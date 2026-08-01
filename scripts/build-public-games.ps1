param([string[]]$Games = @('dropfish', 'agroclick'))

$ErrorActionPreference = 'Stop'

$workspace = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$games = $Games
$stripPattern = '(?s)/\* PUBLIC_STRIP_DEBUG_START \*/.*?/\* PUBLIC_STRIP_DEBUG_END \*/'

foreach ($game in $games) {
  $source = [System.IO.Path]::GetFullPath((Join-Path $workspace "$game\script.js"))
  $releaseDir = [System.IO.Path]::GetFullPath((Join-Path $workspace "public-release\$game"))
  $stageSource = [System.IO.Path]::GetFullPath((Join-Path $releaseDir 'script.public.stage.js'))
  $stageMin = [System.IO.Path]::GetFullPath((Join-Path $releaseDir 'script.public.stage.min.js'))
  $stageObfuscated = [System.IO.Path]::GetFullPath((Join-Path $releaseDir 'script.public.stage.obfuscated.js'))
  $target = [System.IO.Path]::GetFullPath((Join-Path $releaseDir 'script.public.min.js'))

  foreach ($path in @($source, $releaseDir, $stageSource, $stageMin, $stageObfuscated, $target)) {
    if (-not $path.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
      throw "Public build path escaped the canonical workspace: $path"
    }
  }

  $sourceText = Get-Content -Raw -Encoding utf8 -LiteralPath $source
  $stripCount = [regex]::Matches($sourceText, $stripPattern).Count
  if ($stripCount -lt 1) { throw "$game has no PUBLIC_STRIP_DEBUG section" }
  $publicSource = [regex]::Replace($sourceText, $stripPattern, '')
  if ($game -eq 'dropfish') {
    $testFlag = 'const BUILD_CONFIG = { unlimitedSessions: true };'
    $publicFlag = 'const BUILD_CONFIG = { unlimitedSessions: false };'
    if (-not $publicSource.Contains($testFlag)) { throw 'dropfish BUILD_CONFIG test flag was not found' }
    $publicSource = $publicSource.Replace($testFlag, $publicFlag)
  }
  if ($publicSource -match '(?i)PUBLIC_STRIP_DEBUG|buildDropfishDebugPanel|buildDebug\s*\(|debugToggle|dropfishDebug|debug-panel|debugBtn') {
    throw "$game public staging source still contains debug code"
  }
  if ($game -eq 'dropfish' -and $publicSource -notmatch 'BUILD_CONFIG\s*=\s*\{\s*unlimitedSessions:\s*false\s*\}') {
    throw 'dropfish public staging source is not daily-limited'
  }

  try {
    [System.IO.File]::WriteAllText($stageSource, $publicSource, (New-Object System.Text.UTF8Encoding($false)))
    & node --check $stageSource
    if ($LASTEXITCODE -ne 0) { throw "$game staging syntax check failed" }
    & npx.cmd --yes terser $stageSource --compress --mangle --output $stageMin
    if ($LASTEXITCODE -ne 0) { throw "$game minification failed" }
    & npx.cmd --yes javascript-obfuscator $stageMin --output $stageObfuscated --compact true --identifier-names-generator hexadecimal --identifiers-prefix a
    if ($LASTEXITCODE -ne 0) { throw "$game obfuscation failed" }
    & node --check $stageObfuscated
    if ($LASTEXITCODE -ne 0) { throw "$game obfuscated syntax check failed" }

    $bundle = Get-Content -Raw -Encoding utf8 -LiteralPath $stageObfuscated
    $obfuscatedIds = [regex]::Matches($bundle, '_0x[0-9a-f]+').Count
    if ($obfuscatedIds -lt 1000 -or $bundle -notmatch 'while\s*\(!!\[\]\)') {
      throw "$game obfuscation signature check failed"
    }
    if ($bundle -match 'buildDropfishDebugPanel|buildDebug|debugToggle|dropfishDebug') {
      throw "$game public bundle still contains debug code"
    }

    Move-Item -LiteralPath $stageObfuscated -Destination $target -Force
    Write-Output "$game public bundle: $obfuscatedIds obfuscated identifiers, $((Get-Item -LiteralPath $target).Length) bytes"
  }
  finally {
    Remove-Item -LiteralPath $stageSource -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $stageMin -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $stageObfuscated -Force -ErrorAction SilentlyContinue
  }
}
