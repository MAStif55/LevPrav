'use client';

import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import Cropper, { Area } from 'react-easy-crop';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Loader2, Video, X, Crop, Scissors, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

// ─── Video Variant Configuration ─────────────────────────────────────────────

const VIDEO_VARIANTS = [
    { name: 'Hi-Res', maxHeight: 720, crf: '24', suffix: '_full',    key: 'videoUrl'        as const },
    { name: 'Preview', maxHeight: 480, crf: '30', suffix: '_preview', key: 'videoPreviewUrl' as const },
] as const;

// Cache headers for immutable assets
const VIDEO_METADATA = {
    cacheControl: 'public, max-age=31536000, immutable',
    contentType: 'video/mp4',
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface VideoUploadProps {
    videoUrl?: string;
    videoPreviewUrl?: string;
    onChange: (urls: { videoUrl: string; videoPreviewUrl: string }) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function VideoUpload({ videoUrl, videoPreviewUrl, onChange }: VideoUploadProps) {
    const { t, locale } = useTranslation();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [originalVideoUrl, setOriginalVideoUrl] = useState<string | null>(null);

    // Processing State
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressLabel, setProgressLabel] = useState('');
    const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

    // Trimming State
    const [startTime, setStartTime] = useState<number>(0);
    const [endTime, setEndTime] = useState<number>(0);
    const [videoDuration, setVideoDuration] = useState<number>(0);

    // Cropping State
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [aspectRatio, setAspectRatio] = useState<number>(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    // Thumbnails state
    const THUMB_COUNT = 8;
    const [thumbnails, setThumbnails] = useState<string[]>([]);

    const videoRef = useRef<HTMLVideoElement>(null);
    const ffmpegRef = useRef(new FFmpeg());

    const loadFFmpeg = async () => {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        const ffmpeg = ffmpegRef.current;

        if (ffmpeg.loaded) return;

        // Listen for progress updates to show a loading bar
        ffmpeg.on('progress', ({ progress }) => {
            setProgress(Math.round(progress * 100));
        });

        // Load the core WebAssembly files
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        setFfmpegLoaded(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            alert(locale === 'ru' ? 'Пожалуйста, загрузите видео' : 'Please upload a video file');
            return;
        }

        // 100MB limit check
        if (file.size > 100 * 1024 * 1024) {
            alert(locale === 'ru' ? 'Файл слишком большой (макс. 100MB)' : 'File too large (max 100MB)');
            return;
        }

        // MOV detection warning
        if (file.type === 'video/quicktime' || file.name.toLowerCase().endsWith('.mov')) {
            const proceed = confirm(
                locale === 'ru'
                    ? 'MOV файлы будут автоматически конвертированы в MP4. Это может занять больше времени. Продолжить?'
                    : 'MOV files will be automatically converted to MP4. This may take longer. Continue?'
            );
            if (!proceed) return;
        }

        setSelectedFile(file);

        // Cleanup old url
        if (originalVideoUrl) {
            URL.revokeObjectURL(originalVideoUrl);
        }

        const url = URL.createObjectURL(file);
        setOriginalVideoUrl(url);

        // Reset state
        setStartTime(0);
        setEndTime(0);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setThumbnails([]);
    };

    const generateThumbnails = async (videoNode: HTMLVideoElement, duration: number) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;
        const thumbs: string[] = [];
        const interval = duration / THUMB_COUNT;

        // Use a low-res canvas for lightning-fast memory extraction
        canvas.width = 160;
        canvas.height = 90;

        for (let i = 0; i < THUMB_COUNT; i++) {
            videoNode.currentTime = i * interval;

            // Wait for the video buffer to catch up to the seek frame
            await new Promise<void>((resolve) => {
                const onSeeked = () => {
                    videoNode.removeEventListener('seeked', onSeeked);
                    resolve();
                };
                videoNode.addEventListener('seeked', onSeeked);
            });
            context.drawImage(videoNode, 0, 0, canvas.width, canvas.height);
            thumbs.push(canvas.toDataURL('image/jpeg', 0.5));
        }
        videoNode.currentTime = 0;
        setThumbnails(thumbs);
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const duration = videoRef.current.duration;
            setVideoDuration(duration);
            if (endTime === 0 || endTime > duration) {
                setEndTime(duration);
            }
            generateThumbnails(videoRef.current, duration);
        }
    };

    const clearSelection = () => {
        setSelectedFile(null);
        if (originalVideoUrl) {
            URL.revokeObjectURL(originalVideoUrl);
            setOriginalVideoUrl(null);
        }
        if (videoUrl || videoPreviewUrl) {
            onChange({ videoUrl: '', videoPreviewUrl: '' });
        }
    };

    /**
     * Encodes a single video variant using FFmpeg WASM.
     * Returns a Blob of the processed MP4.
     */
    const encodeVariant = async (
        ffmpeg: FFmpeg,
        inputName: string,
        outputName: string,
        maxHeight: number,
        crf: string,
        duration: number
    ): Promise<Blob> => {
        const ffmpegArgs = [
            '-ss', startTime.toString(),
            '-i', inputName,
            '-t', duration.toString(),
        ];

        // Build video filter chain
        const filters: string[] = [];

        // Crop filter from react-easy-crop pixel coordinates
        if (croppedAreaPixels) {
            const { width, height, x, y } = croppedAreaPixels;
            filters.push(`crop=${width}:${height}:${x}:${y}`);
        }

        // Scale to target resolution (maintain aspect ratio)
        filters.push(`scale=-2:${maxHeight}`);

        if (filters.length > 0) {
            ffmpegArgs.push('-vf', filters.join(','));
        }

        // Compression settings per spec
        ffmpegArgs.push(
            '-c:v', 'libx264',
            '-preset', 'slow',
            '-crf', crf,
            '-an',                    // Strip audio
            '-movflags', '+faststart', // Streaming-optimized MP4
            outputName
        );

        await ffmpeg.exec(ffmpegArgs);

        const data = await ffmpeg.readFile(outputName);
        const blob = new Blob([data as any], { type: 'video/mp4' });

        // Clean up output
        await ffmpeg.deleteFile(outputName);

        return blob;
    };

    /**
     * Processes the selected video into dual variants (720p + 480p),
     * uploads both to Firebase Storage, and returns URLs.
     */
    const processAndUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setProgress(0);

        try {
            await loadFFmpeg();
            const ffmpeg = ffmpegRef.current;

            const ext = selectedFile.name.split('.').pop() || 'mp4';
            const inputName = `input.${ext}`;

            // Write file to WebAssembly virtual memory
            await ffmpeg.writeFile(inputName, await fetchFile(selectedFile));

            const duration = endTime <= startTime ? videoDuration : endTime - startTime;
            const timestamp = Date.now();

            const results: Record<string, string> = {};

            // Encode variants sequentially (FFmpeg WASM doesn't support parallel)
            for (let i = 0; i < VIDEO_VARIANTS.length; i++) {
                const variant = VIDEO_VARIANTS[i];
                const outputName = `output_${variant.suffix}.mp4`;

                setProgressLabel(
                    locale === 'ru'
                        ? `Обработка ${variant.name} (${variant.maxHeight}p)...`
                        : `Processing ${variant.name} (${variant.maxHeight}p)...`
                );

                const blob = await encodeVariant(
                    ffmpeg,
                    inputName,
                    outputName,
                    variant.maxHeight,
                    variant.crf,
                    duration
                );

                // Upload to Firebase Storage
                const storageFilename = `videos/${timestamp}${variant.suffix}.mp4`;
                const storageRef = ref(storage, storageFilename);

                setProgressLabel(
                    locale === 'ru'
                        ? `Загрузка ${variant.name}...`
                        : `Uploading ${variant.name}...`
                );

                await uploadBytes(storageRef, blob, VIDEO_METADATA);
                const publicUrl = await getDownloadURL(storageRef);
                results[variant.key] = publicUrl;
            }

            // Clean up input file
            await ffmpeg.deleteFile(inputName);

            // Return both URLs to parent
            onChange({
                videoUrl: results.videoUrl || '',
                videoPreviewUrl: results.videoPreviewUrl || '',
            });

            // Clean up component state
            setSelectedFile(null);
            if (originalVideoUrl) {
                URL.revokeObjectURL(originalVideoUrl);
                setOriginalVideoUrl(null);
            }
        } catch (error) {
            console.error(error);
            alert(locale === 'ru' ? 'Ошибка при обработке видео' : 'Video processing failed');
        } finally {
            setUploading(false);
            setProgress(0);
            setProgressLabel('');
        }
    };

    const replaceInputRef = useRef<HTMLInputElement>(null);

    const handleReplaceClick = () => {
        if (replaceInputRef.current) {
            replaceInputRef.current.value = '';
            replaceInputRef.current.click();
        }
    };

    // If there is an existing uploaded video but no file selected in cropper mode
    const hasExistingVideo = (videoUrl || videoPreviewUrl) && !selectedFile;
    if (hasExistingVideo) {
        return (
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border group w-full max-w-sm">
                <input
                    ref={replaceInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                />
                <video
                    src={videoPreviewUrl || videoUrl}
                    className="w-full h-full object-cover pointer-events-none"
                    muted
                    playsInline
                    loop
                    autoPlay
                />
                <div className="absolute top-2 right-2 flex gap-1">
                    <button
                        type="button"
                        onClick={handleReplaceClick}
                        className="bg-amber-500 text-white p-1 rounded-full hover:bg-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title={locale === 'ru' ? 'Заменить видео' : 'Replace video'}
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={clearSelection}
                        className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title={locale === 'ru' ? 'Удалить видео' : 'Remove video'}
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        );
    }

    // Cropper & Trimmer UI
    if (selectedFile && originalVideoUrl) {
        return (
            <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-700 flex items-center gap-2">
                        <Crop size={18} />
                        {locale === 'ru' ? 'Обрезка и кадрирование' : 'Crop & Trim'}
                    </h4>
                    <button
                        type="button"
                        onClick={clearSelection}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                        disabled={uploading}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="relative w-full aspect-square bg-black rounded overflow-hidden">
                    <Cropper
                        video={originalVideoUrl}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspectRatio}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={(croppedArea, croppedAreaPixels) => {
                            setCroppedAreaPixels(croppedAreaPixels);
                        }}
                    />
                </div>

                {/* Hidden video to get metadata duration */}
                <video
                    ref={videoRef}
                    src={originalVideoUrl}
                    className="hidden"
                    onLoadedMetadata={handleLoadedMetadata}
                />

                <div className="relative mt-2 rounded-lg overflow-hidden border border-gray-200">
                    {/* 1. Underlying Filmstrip Background */}
                    <div className="flex w-full h-14 bg-black">
                        {thumbnails.map((thumb, idx) => (
                            <div
                                key={idx}
                                className="flex-1 h-full bg-cover bg-center border-r border-[#ffffff10] last:border-r-0"
                                style={{ backgroundImage: `url(${thumb})` }}
                            />
                        ))}
                    </div>

                    {/* 2. RC Slider Overlay */}
                    <div className="absolute inset-x-0 top-0 bottom-0 flex items-center px-0">
                        <Slider
                            range
                            min={0}
                            max={videoDuration || 1}
                            step={0.1}
                            value={[startTime, endTime]}
                            onChange={(val) => {
                                const [newStart, newEnd] = val as number[];
                                
                                // Live scrub: check which handle moved
                                if (Math.abs(newStart - startTime) > 0.01) {
                                    if (videoRef.current) videoRef.current.currentTime = newStart;
                                } else if (Math.abs(newEnd - endTime) > 0.01) {
                                    if (videoRef.current) videoRef.current.currentTime = newEnd;
                                }

                                setStartTime(newStart);
                                setEndTime(newEnd);
                            }}
                            styles={{
                                track: { backgroundColor: 'transparent', height: '100%' },
                                handle: { 
                                    borderColor: '#E67E22', 
                                    backgroundColor: '#E67E22', 
                                    opacity: 1, 
                                    boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                                    width: '4px',
                                    height: '100%',
                                    borderRadius: '2px',
                                    marginTop: '0',
                                    top: '0',
                                    cursor: 'col-resize'
                                },
                                rail: { backgroundColor: 'transparent', height: '100%' }
                            }}
                        />

                        {/* 3. Shadowed Unselected Bounds */}
                        <div 
                            className="absolute top-0 bottom-0 left-0 bg-black/60 pointer-events-none transition-all duration-100" 
                            style={{ width: `${videoDuration ? (startTime / videoDuration) * 100 : 0}%` }} 
                        />
                        <div 
                            className="absolute top-0 bottom-0 right-0 bg-black/60 pointer-events-none transition-all duration-100" 
                            style={{ width: `${videoDuration ? (1 - endTime / videoDuration) * 100 : 0}%` }} 
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="button"
                        onClick={processAndUpload}
                        disabled={uploading}
                        className="w-full flex items-center justify-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                        {uploading ? <Loader2 className="animate-spin" size={18} /> : <Video size={18} />}
                        <span>
                            {uploading
                                ? (progressLabel || `${progress}%`)
                                : (locale === 'ru' ? 'Обрезать и Сохранить' : 'Trim, Crop & Save')}
                        </span>
                    </button>
                    {uploading && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                            <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Default Upload Zone
    return (
        <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer w-full max-w-sm">
            <Video className="mb-2 text-gray-400" size={32} />
            <span className="text-xs text-gray-500 text-center px-2">
                {locale === 'ru' ? 'Добавить Live Photo (Видео)' : 'Add Live Photo (Video)'}
            </span>
            <span className="text-xs text-gray-400 mt-1">MP4, MOV (до 100MB)</span>
            <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
            />
        </label>
    );
}
