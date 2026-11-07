param([string]$TrainingSource = 'D:\cet6-practice', [Parameter(Mandatory=$true)][string]$Destination)
$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$target = [IO.Path]::GetFullPath($Destination)
if (Test-Path -LiteralPath $target) { throw '目标目录已存在，未覆盖。请选择新的目录。' }
$ffmpeg = (Get-Command ffmpeg -ErrorAction Stop).Definition
$ffprobe = (Get-Command ffprobe -ErrorAction Stop).Definition
$binaryRoot = Split-Path -Parent $ffmpeg
$ffmpegRoot = Split-Path -Parent $binaryRoot
foreach ($file in @('src\utils\filmPackage.ts','src\utils\cinema.ts','scripts\cinema-prepare.mjs','scripts\cinema-prepare.cmd','docs\CINEMA_PACKS.md')) {
    if (-not (Test-Path -LiteralPath (Join-Path $TrainingSource $file))) { throw "缺少源文件：$file" }
}
New-Item -ItemType Directory -Path $target,(Join-Path $target 'lib'),(Join-Path $target 'licenses') | Out-Null
Copy-Item -LiteralPath (Join-Path $repo 'runtime\node.exe') -Destination (Join-Path $target 'node.exe')
Copy-Item -LiteralPath (Join-Path $repo 'runtime\LICENSE') -Destination (Join-Path $target 'licenses\Node-LICENSE.txt')
Copy-Item -LiteralPath $ffmpeg,$ffprobe -Destination $target
Get-ChildItem -LiteralPath $binaryRoot -Filter '*.dll' -File | Copy-Item -Destination $target
Get-ChildItem -LiteralPath $ffmpegRoot -File | Where-Object { $_.Name -match 'license|copying|readme' } | Copy-Item -Destination (Join-Path $target 'licenses')
$source = [IO.File]::ReadAllText((Join-Path $TrainingSource 'scripts\cinema-prepare.mjs')).Replace('../src/utils/', './lib/')
[IO.File]::WriteAllText((Join-Path $target 'cinema-prepare.mjs'),$source,(New-Object Text.UTF8Encoding($false)))
Copy-Item -LiteralPath (Join-Path $TrainingSource 'src\utils\filmPackage.ts'),(Join-Path $TrainingSource 'src\utils\cinema.ts') -Destination (Join-Path $target 'lib')
Copy-Item -LiteralPath (Join-Path $TrainingSource 'scripts\cinema-prepare.cmd') -Destination (Join-Path $target '制作观影包.cmd')
Copy-Item -LiteralPath (Join-Path $TrainingSource 'docs\CINEMA_PACKS.md') -Destination (Join-Path $target '使用说明.md')
Write-Output "本机工具已生成：$target"
Write-Output '将视频或文件夹拖到 制作观影包.cmd。输入文件与已有输出不会被覆盖。'
