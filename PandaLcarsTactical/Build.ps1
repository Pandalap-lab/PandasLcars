param([switch]$Start, [string]$DotnetPath, [string]$RestoreConfig)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not $DotnetPath) {
    $installedDotnet = Get-Command dotnet -ErrorAction SilentlyContinue
    $localDotnet = Join-Path $PSScriptRoot '..\.build-tools\dotnet\dotnet.exe'
    if ($installedDotnet) { $DotnetPath = $installedDotnet.Source }
    elseif (Test-Path -LiteralPath $localDotnet) { $DotnetPath = (Resolve-Path -LiteralPath $localDotnet).Path }
    else { throw 'Das .NET 8 SDK fehlt. Bitte zuerst das x64 SDK installieren; siehe README.md.' }
}
$buildArguments = @('publish', '.\PandaLcarsTactical.csproj', '-c', 'Release', '-p:Platform=x64', '-o', '.\dist')
if ($RestoreConfig) { $buildArguments += @('--configfile', $RestoreConfig) }
& $DotnetPath @buildArguments
if ($LASTEXITCODE -ne 0) { throw 'Build fehlgeschlagen. Bitte die Ausgabe oben prüfen.' }
Write-Host "Fertig: $PSScriptRoot\dist\PandasLcars.exe"
if ($Start) { Start-Process -FilePath (Join-Path $PSScriptRoot 'dist\PandasLcars.exe') }
