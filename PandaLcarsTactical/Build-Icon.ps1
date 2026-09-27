Add-Type -AssemblyName System.Drawing
$sourceImage = [System.Drawing.Image]::FromFile((Join-Path $PSScriptRoot 'Assets\panda-spock.png'))
$iconImages = @()
foreach ($size in @(16,20,24,32,40,48,64,128,256)) {
    $bitmap = [System.Drawing.Bitmap]::new($size,$size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($sourceImage,0,0,$size,$size)
    $stream = [System.IO.MemoryStream]::new()
    $bitmap.Save($stream,[System.Drawing.Imaging.ImageFormat]::Png)
    $iconImages += @{ Size=$size; Data=$stream.ToArray() }
    $stream.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}
$sourceImage.Dispose()
$file = [System.IO.File]::Create((Join-Path $PSScriptRoot 'Assets\panda-spock.ico'))
$writer = [System.IO.BinaryWriter]::new($file)
$writer.Write([uint16]0); $writer.Write([uint16]1); $writer.Write([uint16]$iconImages.Count)
$offset = 6 + 16 * $iconImages.Count
foreach ($entry in $iconImages) {
    $dimension = if ($entry.Size -eq 256) { 0 } else { $entry.Size }
    $writer.Write([byte]$dimension); $writer.Write([byte]$dimension)
    $writer.Write([byte]0); $writer.Write([byte]0)
    $writer.Write([uint16]1); $writer.Write([uint16]32)
    $writer.Write([uint32]$entry.Data.Length); $writer.Write([uint32]$offset)
    $offset += $entry.Data.Length
}
foreach ($entry in $iconImages) { $writer.Write([byte[]]$entry.Data) }
$writer.Dispose()
