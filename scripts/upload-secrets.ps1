# Requires GitHub CLI (gh) installed and authenticated (`gh auth login`)

$repo = "MAStif55/LevPrav"

# Priority to .env.local, fall back to .env
$envLocalPaths = @(".env.local", ".env")
$envContent = $null
foreach ($path in $envLocalPaths) {
    if (Test-Path $path) {
        $envContent = Get-Content $path
        Write-Host "Reading from $path..."
        break
    }
}

if ($envContent) {
    Write-Host "Uploading secrets to $repo..."
    foreach ($line in $envContent) {
        if ($line.Trim() -and -not $line.StartsWith("#")) {
            $parts = $line.Split("=", 2)
            if ($parts.Length -eq 2) {
                $key = $parts[0].Trim()
                $value = $parts[1].Trim()
                
                # Only upload matching keys based on deploy.yml filter
                if ($key -match '^(NEXT_PUBLIC_|TELEGRAM_|SMTP_|EMAIL_)') {
                    Write-Host "Setting $key..."
                    $value | gh secret set $key --repo $repo
                }
            }
        }
    }
    Write-Host "Done setting .env.local variables."
} else {
    Write-Host "Could not find .env.local or .env file."
}

Write-Host ""
Write-Host "NOTE: You still need to manually set FIREBASE_SERVICE_ACCOUNT by running:"
Write-Host 'cat path/to/serviceAccountKey.json | gh secret set FIREBASE_SERVICE_ACCOUNT --repo "MAStif55/LevPrav"'
