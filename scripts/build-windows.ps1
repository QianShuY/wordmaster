param([string]$Version = '2026-10-13-preview', [switch]$SkipZip)
$ErrorActionPreference = 'Stop'
if ($Version -notmatch '^[a-zA-Z0-9][a-zA-Z0-9.-]{0,60}$') { throw 'Invalid release folder version' }
$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$releaseRoot = Join-Path $repoRoot 'output\releases'
$destination = Join-Path $releaseRoot ('WordMaster-' + $Version)
if (Test-Path -LiteralPath $destination) { throw "Release directory already exists: $destination" }
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path -LiteralPath $compiler)) { throw 'Windows .NET Framework C# compiler is unavailable' }
if (-not (Test-Path -LiteralPath (Join-Path $repoRoot 'runtime\LICENSE'))) { throw 'Bundled Node license missing: runtime/LICENSE' }
New-Item -ItemType Directory -Path $releaseRoot -Force | Out-Null
$staging = Join-Path $releaseRoot ('.build-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $staging | Out-Null
foreach ($folder in @('app','shared','static','node_modules','runtime')) {
    Copy-Item -LiteralPath (Join-Path $repoRoot $folder) -Destination (Join-Path $staging $folder) -Recurse
}
foreach ($file in @('package.json','package-lock.json')) { Copy-Item -LiteralPath (Join-Path $repoRoot $file) -Destination $staging }
$launcher = Join-Path $staging 'WordMaster.exe'
& $compiler /nologo /target:winexe /platform:x64 /optimize+ /reference:System.Windows.Forms.dll /reference:System.Web.Extensions.dll "/out:$launcher" (Join-Path $repoRoot 'windows\WordMasterLauncher.cs')
if ($LASTEXITCODE -ne 0) { throw 'Launcher compilation failed; staging retained for diagnostics' }
$unexpected = Get-ChildItem -LiteralPath $staging -File -Recurse | Where-Object { $_.Extension -in @('.db','.sqlite','.sqlite3') -or $_.Name -match '\.db-(wal|shm)$' }
if ($unexpected) { throw 'Personal database detected in release payload' }
$notes = @'
墨词 Windows 预览包

解压完整目录后双击 WordMaster.exe。需要 Windows x64 和 .NET Framework 4.x，无需另外安装 Node 或联网安装依赖。
首次启动会在本目录 data/ 创建空白个人数据库。发行包不含任何人的学习数据。
重复打开会复用同一目录、同一数据库的服务；端口冲突时在 3456–3476 中选择空闲端口。
应用通过系统默认浏览器打开；关掉浏览器后本地服务仍运行，重新打开不会重复启动。
迁移到新目录会改变本地端口/浏览器存储位置；学习数据在数据库中，浏览器未提交的题目与断点不保证迁移。

这是发行候选验收包：高考词库尚未正式替换中考，全词库例句与视觉、长时间验收仍在进行。
不要删除原目录 data/。升级现有安装时保留 data/，不要覆盖学习数据库；关闭原服务后再更新程序文件。
已有内置词库会在成功备份后增量应用核对过的修订；手动修改和历史词库保持原样。备份放在个人数据库所在目录的 backups/ 中。
内容更新失败时仍可使用原有词库，并在首页重试；不会为修复更新而删除学习记录。
本包尚未完成正式发行验收。构建清单见 release-manifest.json。
'@
[IO.File]::WriteAllText((Join-Path $staging 'RELEASE-NOTES.txt'), $notes, [Text.UTF8Encoding]::new($false))
$files = @(Get-ChildItem -LiteralPath $staging -File -Recurse | Sort-Object FullName | ForEach-Object {
    [ordered]@{ path=$_.FullName.Substring($staging.Length+1).Replace('\','/'); bytes=$_.Length; sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() }
})
$manifest = [ordered]@{ format=1; version=$Version; candidate=$true; platform='windows-x64'; personal_data_included=$false; files=$files }
[IO.File]::WriteAllText((Join-Path $staging 'release-manifest.json'), ($manifest | ConvertTo-Json -Depth 6), [Text.UTF8Encoding]::new($false))
$releasePrefix = [IO.Path]::GetFullPath($releaseRoot).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
$stagingAbs = [IO.Path]::GetFullPath($staging)
$destinationAbs = [IO.Path]::GetFullPath($destination)
if (-not $stagingAbs.StartsWith($releasePrefix, [StringComparison]::OrdinalIgnoreCase) -or -not $destinationAbs.StartsWith($releasePrefix, [StringComparison]::OrdinalIgnoreCase)) { throw 'Release move escaped the intended output directory' }
if (Test-Path -LiteralPath $destinationAbs) { throw 'Release destination appeared during build; staging retained' }
Move-Item -LiteralPath $stagingAbs -Destination $destinationAbs
if (-not $SkipZip) { Compress-Archive -LiteralPath $destination -DestinationPath ($destination + '.zip') -CompressionLevel Optimal }
Write-Output ([pscustomobject]$manifest | Select-Object version,platform,candidate,@{Name='fileCount';Expression={$_.files.Count}} | ConvertTo-Json)
Write-Output $destination
