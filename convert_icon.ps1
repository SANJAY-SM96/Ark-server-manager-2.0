
Add-Type -AssemblyName System.Drawing
$source = "src\assets\logo.png"
$dest = "src\assets\logo_fixed.png"

try {
    $img = [System.Drawing.Image]::FromFile($source)
    $img.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose()
    
    Move-Item -Force $dest $source
    Write-Host "Converted successfully"
} catch {
    Write-Error $_
    exit 1
}
