@echo off
setlocal enabledelayedexpansion

:: =========================================
:: LevPrav Website Full Backup Script
:: =========================================

echo.
echo ========================================
echo   LevPrav Website - Full Backup
echo ========================================
echo.

:: Get current timestamp using PowerShell (works on all Windows versions)
for /f "delims=" %%i in ('powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'"') do set TIMESTAMP=%%i

:: Set paths
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%
set BACKUP_ROOT=D:\levprav2-backups
set BACKUP_DIR=%BACKUP_ROOT%\backup_%TIMESTAMP%

echo [INFO] Backup timestamp: %TIMESTAMP%
echo [INFO] Backup location: %BACKUP_DIR%
echo.

:: Create backup directory structure
echo [1/7] Creating backup directories...
if not exist "%BACKUP_ROOT%" mkdir "%BACKUP_ROOT%"
mkdir "%BACKUP_DIR%"
mkdir "%BACKUP_DIR%\source"
mkdir "%BACKUP_DIR%\firestore"
mkdir "%BACKUP_DIR%\storage"
mkdir "%BACKUP_DIR%\csv"
mkdir "%BACKUP_DIR%\products"
mkdir "%BACKUP_DIR%\universal"

:: Copy source code
echo [2/6] Copying source code...
echo       (excluding node_modules, .next, out)

:: Use xcopy for simpler, more reliable copying
xcopy "%PROJECT_DIR%src" "%BACKUP_DIR%\source\src\" /E /I /Q /Y >nul
xcopy "%PROJECT_DIR%public" "%BACKUP_DIR%\source\public\" /E /I /Q /Y >nul
xcopy "%PROJECT_DIR%scripts" "%BACKUP_DIR%\source\scripts\" /E /I /Q /Y >nul

:: Copy config files
copy "%PROJECT_DIR%package.json" "%BACKUP_DIR%\source\" >nul 2>&1
copy "%PROJECT_DIR%package-lock.json" "%BACKUP_DIR%\source\" >nul 2>&1
copy "%PROJECT_DIR%tsconfig.json" "%BACKUP_DIR%\source\" >nul 2>&1
copy "%PROJECT_DIR%tailwind.config.ts" "%BACKUP_DIR%\source\" >nul 2>&1
copy "%PROJECT_DIR%postcss.config.mjs" "%BACKUP_DIR%\source\" >nul 2>&1
copy "%PROJECT_DIR%next.config.mjs" "%BACKUP_DIR%\source\" >nul 2>&1
copy "%PROJECT_DIR%eslint.config.mjs" "%BACKUP_DIR%\source\" >nul 2>&1
copy "%PROJECT_DIR%.env.local" "%BACKUP_DIR%\source\" >nul 2>&1
copy "%PROJECT_DIR%.gitignore" "%BACKUP_DIR%\source\" >nul 2>&1
copy "%PROJECT_DIR%firebase.json" "%BACKUP_DIR%\source\" >nul 2>&1
copy "%PROJECT_DIR%.firebaserc" "%BACKUP_DIR%\source\" >nul 2>&1
copy "%PROJECT_DIR%firestore.rules" "%BACKUP_DIR%\source\" >nul 2>&1
copy "%PROJECT_DIR%firestore.indexes.json" "%BACKUP_DIR%\source\" >nul 2>&1
copy "%PROJECT_DIR%README.md" "%BACKUP_DIR%\source\" >nul 2>&1
copy "%PROJECT_DIR%PROJECT_RULES.md" "%BACKUP_DIR%\source\" >nul 2>&1
copy "%PROJECT_DIR%DEVELOPMENT_LOG.md" "%BACKUP_DIR%\source\" >nul 2>&1

echo       [OK] Source code copied
echo.

:: Check for service account file
if not exist "%PROJECT_DIR%service-account.json" (
    echo [3/6] Exporting Firestore data...
    echo       [SKIP] service-account.json not found
    echo.
    echo [4/6] Exporting Storage files...
    echo       [SKIP] service-account.json not found
    echo.
    echo [5/6] Exporting CSV files...
    echo       [SKIP] service-account.json not found
    echo.
    goto :summary
)

:: Export Firestore (JSON)
echo [3/6] Exporting Firestore data (JSON)...
cd /d "%PROJECT_DIR%"
call node scripts/export-firestore.js "%BACKUP_DIR%\firestore"
if errorlevel 1 (
    echo       [WARN] Firestore export had issues
) else (
    echo       [OK] Firestore data exported
)
echo.

:: Export Storage
echo [4/6] Exporting Storage files...
cd /d "%PROJECT_DIR%"
call node scripts/export-storage.js "%BACKUP_DIR%\storage"
if errorlevel 1 (
    echo       [WARN] Storage export had issues
) else (
    echo       [OK] Storage files exported
)
echo.

:: Export CSV
echo [5/6] Exporting products to CSV...
cd /d "%PROJECT_DIR%"
call node scripts/export-products-csv.js "%BACKUP_DIR%\csv"
if errorlevel 1 (
    echo       [WARN] CSV export had issues
) else (
    echo       [OK] CSV files exported
)
echo.

:: Export Product Folders with Images
echo [6/7] Exporting product folders with images...
cd /d "%PROJECT_DIR%"
call node scripts/export-products-folders.js "%BACKUP_DIR%\products"
if errorlevel 1 (
    echo       [WARN] Product folders export had issues
) else (
    echo       [OK] Product folders with images exported
)
echo.

:: Universal Format Export (for migration to other databases)
echo [7/7] Exporting universal database formats...
echo       (JSON, CSV, SQL, NDJSON for any database)
cd /d "%PROJECT_DIR%"
call node scripts/export-universal.js "%BACKUP_DIR%\universal"
if errorlevel 1 (
    echo       [WARN] Universal export had issues
) else (
    echo       [OK] Universal formats exported
    echo       See universal/MIGRATION_GUIDE.md for import instructions
)
echo.

:summary
:: Create backup summary
echo Creating backup summary...

(
echo LevPrav Website Backup
echo ======================
echo.
echo Timestamp: %TIMESTAMP%
echo.
echo Contents:
echo - source/    : Website source code
echo - firestore/ : Database exports ^(JSON^)
echo - storage/   : Uploaded files from Firebase Storage
echo - csv/       : Product data in CSV format ^(Excel/Sheets^)
echo - products/  : Organized product folders with images
echo - universal/ : MIGRATION-READY exports for any database:
echo     - json/    : Standard JSON format
echo     - csv/     : CSV for PostgreSQL/MySQL/Excel
echo     - sql/     : Ready-to-run SQL statements
echo     - ndjson/  : MongoDB/BigQuery compatible
echo.
echo MIGRATION TO ANOTHER HOSTING:
echo =============================
echo.
echo Option A - Keep Firebase, different host:
echo   1. Copy source/ to your new project
echo   2. Run 'npm install' ^&^& 'npm run build'
echo   3. Deploy 'out/' folder to any static host
echo.
echo Option B - Full migration to other database:
echo   1. Copy source/ to your new project
echo   2. See universal/MIGRATION_GUIDE.md for database import
echo   3. Update code to use new database ^(PostgreSQL/MongoDB/etc^)
echo   4. Update .env.local with new credentials
) > "%BACKUP_DIR%\backup-summary.txt"

echo.
echo ========================================
echo   BACKUP COMPLETE!
echo ========================================
echo.
echo Location: %BACKUP_DIR%
echo.

:: Open backup folder in Explorer
start "" "%BACKUP_DIR%"

echo Press any key to close...
pause >nul
