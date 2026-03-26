'use client';

import { CSSProperties, ReactNode, useCallback } from 'react';

interface StaticLinkProps {
    href: string;
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    onClick?: () => void;
    target?: string;
    id?: string;
    'aria-label'?: string;
}

/**
 * A navigation component that uses window.location for static exports.
 * Uses a span element instead of anchor to completely bypass Next.js 
 * App Router link interception.
 */
export function StaticLink({
    href,
    children,
    onClick,
    className,
    style,
    target,
    id,
    'aria-label': ariaLabel,
}: StaticLinkProps) {
    const handleClick = useCallback(() => {
        // Call the original onClick if provided
        onClick?.();

        // Handle external links
        if (
            href.startsWith('http') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:')
        ) {
            if (target === '_blank') {
                window.open(href, '_blank', 'noopener,noreferrer');
            } else {
                window.location.href = href;
            }
            return;
        }

        // For internal links, always do full page navigation
        window.location.href = href;
    }, [href, onClick, target]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        // Support keyboard navigation (Enter and Space)
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    }, [handleClick]);

    return (
        <span
            id={id}
            role="link"
            tabIndex={0}
            className={className}
            style={{ cursor: 'pointer', ...style }}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            aria-label={ariaLabel}
        >
            {children}
        </span>
    );
}
