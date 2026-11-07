param([string]$Proxy)
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$target = Join-Path $root 'runtime\cinema'
$work = Join-Path $root ('output\cinema-setup-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $work,$target -Force | Out-Null
$url = 'https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0-win-64bit-build1.zip'
$expected = '67d015301eef0b612191212d564c5bb0a14b5b9c4796b76454276a4d28d9b288'
$zip = Join-Path $work 'aria2.zip'
$request = @{ Uri=$url; OutFile=$zip; UseBasicParsing=$true }
if ($Proxy) { $request.Proxy=$Proxy }
Invoke-WebRequest @request
if ((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected) { throw 'aria2 下载包校验失败，未安装。' }
Expand-Archive -LiteralPath $zip -DestinationPath $work
$aria = Join-Path $work 'aria2-1.37.0-win-64bit-build1'
Copy-Item -LiteralPath (Join-Path $aria 'aria2c.exe') -Destination $target -Force
Get-ChildItem -LiteralPath $aria -File | Where-Object { $_.Extension -ne '.exe' } | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $target ('aria2-'+$_.Name)) -Force }
$ffmpeg=(Get-Command ffmpeg -ErrorAction Stop).Definition
$ffprobe=(Get-Command ffprobe -ErrorAction Stop).Definition
$bin=Split-Path -Parent $ffmpeg
Copy-Item -LiteralPath $ffmpeg,$ffprobe -Destination $target -Force
Get-ChildItem -LiteralPath $bin -Filter '*.dll' -File | Copy-Item -Destination $target -Force
Get-ChildItem -LiteralPath (Split-Path -Parent $bin) -File | Where-Object { $_.Name -match 'license|copying|readme' } | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $target ('ffmpeg-'+$_.Name)) -Force }
@{ aria2=@{version='1.37.0';url=$url;archiveSha256=$expected}; ffmpeg=@{source='maintainer-installed FFmpeg';sha256=(Get-FileHash -LiteralPath $ffmpeg -Algorithm SHA256).Hash}; preparedAt=(Get-Date).ToString('o') } | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $target 'components.json') -Encoding utf8
Write-Output '下载与影片处理组件已准备好，随 Windows 安装目录一起发布。未启动后台下载。'
