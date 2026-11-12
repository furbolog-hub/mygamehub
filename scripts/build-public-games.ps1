param([string[]]$Games = @('dropfish'))

$ErrorActionPreference = 'Stop'

$workspace = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$releaseRoot = [System.IO.Path]::GetFullPath((Join-Path $workspace 'public-release'))
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$releaseVersion = '20261112-dropfish-effects-arcade'
$guardVersion = '20261112-daily-limit-protected'
$scriptStripPattern = '(?s)/\* PUBLIC_STRIP_DEBUG_START \*/.*?/\* PUBLIC_STRIP_DEBUG_END \*/'
$htmlStripPattern = '(?s)<!--\s*PUBLIC_STRIP_DEBUG_START\s*-->.*?<!--\s*PUBLIC_STRIP_DEBUG_END\s*-->'

function Assert-SafePath([string]$Path, [string]$Root, [string]$Label) {
  $fullPath = [System.IO.Path]::GetFullPath($Path)
  $fullRoot = [System.IO.Path]::GetFullPath($Root).TrimEnd('\') + '\'
  if (-not ($fullPath + '\').StartsWith($fullRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "$Label escaped its allowed root: $fullPath"
  }
  return $fullPath
}

function New-ProtectedBundle {
  param(
    [Parameter(Mandatory = $true)][string]$SourceText,
    [Parameter(Mandatory = $true)][string]$ReleaseDir,
    [Parameter(Mandatory = $true)][string]$TargetName,
    [Parameter(Mandatory = $true)][string]$Label,
    [int]$MinimumObfuscatedIds = 20
  )

  $target = Assert-SafePath (Join-Path $ReleaseDir $TargetName) $ReleaseDir "$Label target"
  $stageSource = Assert-SafePath (Join-Path $ReleaseDir "$TargetName.stage.js") $ReleaseDir "$Label source stage"
  $stageMin = Assert-SafePath (Join-Path $ReleaseDir "$TargetName.stage.min.js") $ReleaseDir "$Label minified stage"
  $stageObfuscated = Assert-SafePath (Join-Path $ReleaseDir "$TargetName.stage.obfuscated.js") $ReleaseDir "$Label obfuscated stage"

  try {
    [System.IO.File]::WriteAllText($stageSource, $SourceText, $utf8NoBom)
    & node --check $stageSource
    if ($LASTEXITCODE -ne 0) { throw "$Label staging syntax check failed" }

    & npx.cmd --yes terser $stageSource --compress --mangle --output $stageMin
    if ($LASTEXITCODE -ne 0) { throw "$Label minification failed" }

    & npx.cmd --yes javascript-obfuscator $stageMin --output $stageObfuscated --compact true --identifier-names-generator hexadecimal --identifiers-prefix a
    if ($LASTEXITCODE -ne 0) { throw "$Label obfuscation failed" }

    & node --check $stageObfuscated
    if ($LASTEXITCODE -ne 0) { throw "$Label obfuscated syntax check failed" }

    $bundle = Get-Content -Raw -Encoding utf8 -LiteralPath $stageObfuscated
    $obfuscatedIds = [regex]::Matches($bundle, '_0x[0-9a-f]+').Count
    if ($obfuscatedIds -lt $MinimumObfuscatedIds) {
      throw "$Label obfuscation signature check failed: $obfuscatedIds identifiers"
    }
    Move-Item -LiteralPath $stageObfuscated -Destination $target -Force
    Write-Output "$Label bundle: $obfuscatedIds obfuscated identifiers, $((Get-Item -LiteralPath $target).Length) bytes"
  }
  finally {
    Remove-Item -LiteralPath $stageSource -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $stageMin -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $stageObfuscated -Force -ErrorAction SilentlyContinue
  }
}

function Copy-DropFishRuntimeAssets {
  param([string]$SourceDir, [string]$TargetDir)

  $source = Assert-SafePath $SourceDir $workspace 'DropFish asset source'
  $target = Assert-SafePath $TargetDir $releaseRoot 'DropFish public asset target'
  if (Test-Path -LiteralPath $target) {
    $resolvedTarget = [System.IO.Path]::GetFullPath((Resolve-Path -LiteralPath $target).Path)
    if (-not ($resolvedTarget + '\').StartsWith(($releaseRoot.TrimEnd('\') + '\'), [System.StringComparison]::OrdinalIgnoreCase)) {
      throw "Refusing to replace assets outside public-release: $resolvedTarget"
    }
    Remove-Item -LiteralPath $resolvedTarget -Recurse -Force
  }
  New-Item -ItemType Directory -Path $target -Force | Out-Null

  $copied = 0
  Get-ChildItem -LiteralPath $source -Recurse -File | ForEach-Object {
    $relative = $_.FullName.Substring($source.Length + 1).Replace('\', '/')
    $extension = $_.Extension.ToLowerInvariant()
    $excluded =
      $extension -notin @('.webp', '.png', '.jpg', '.ogg') -or
      $relative.StartsWith('chronology-compact-art/', [System.StringComparison]::OrdinalIgnoreCase) -or
      $relative -match '^chronology-row-art/.+\.jpg$' -or
      $relative -eq 'scene/base-sea.webp' -or
      $relative -match '^scene/weather/.+\.webp$' -or
      $relative -eq 'icons/ui/debug-panel.webp'
    if ($excluded) { return }

    $destination = Assert-SafePath (Join-Path $target $relative) $target 'DropFish public asset'
    $destinationDir = Split-Path -Parent $destination
    New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
    Copy-Item -LiteralPath $_.FullName -Destination $destination -Force
    $copied += 1
  }
  Write-Output "dropfish public assets: $copied runtime files"
}

function New-DropFishPublicHtml {
  param([string]$Source, [string]$Target)

  $html = Get-Content -Raw -Encoding utf8 -LiteralPath $Source
  $debugBlockCount = [regex]::Matches($html, $htmlStripPattern).Count
  if ($debugBlockCount -ne 2) { throw "dropfish index must contain exactly two marked debug blocks; found $debugBlockCount" }
  $html = [regex]::Replace($html, $htmlStripPattern, '')

  $htmlRootPattern = '<html\s+lang="ru"\s*>'
  if ([regex]::Matches($html, $htmlRootPattern).Count -ne 1) { throw 'dropfish public HTML root could not be merged safely' }
  $html = [regex]::Replace($html, $htmlRootPattern, '<html lang="ru" data-game="dropfish">', 1)

  $title = '<title>DropFish</title>'
  $guardIncludes = "$title`r`n  <link rel=`"stylesheet`" href=`"../session-guard.css?v=$guardVersion`">`r`n  <script src=`"../session-guard.min.js?v=$guardVersion`"></script>"
  if (-not $html.Contains($title)) { throw 'dropfish title anchor missing from test HTML' }
  $html = $html.Replace($title, $guardIncludes)

  $html = [regex]::Replace($html, '<link rel="stylesheet" href="style\.css\?v=[^"]+"\s*/>', ('<link rel="stylesheet" href="style.css?v={0}" />' -f $releaseVersion))
  $html = [regex]::Replace($html, '<link rel="stylesheet" href="mobile-ui\.css\?v=[^"]+"\s*/>', ('<link rel="stylesheet" href="mobile-ui.css?v={0}" />' -f $releaseVersion))
  $html = [regex]::Replace($html, '<script src="viewport-fit\.js\?v=[^"]+"></script>', ('<script src="viewport-fit.min.js?v={0}"></script>' -f $releaseVersion))
  $html = [regex]::Replace($html, '<script src="mobile-ui\.js\?v=[^"]+"></script>', ('<script src="mobile-ui.min.js?v={0}"></script>' -f $releaseVersion))
  $html = [regex]::Replace($html, '<script src="ui-enhancements\.js\?v=[^"]+"></script>', ('<script src="ui-enhancements.min.js?v={0}"></script>' -f $releaseVersion))
  $html = [regex]::Replace($html, '<script src="script\.js\?v=[^"]+"></script>', ('<script src="script.public.min.js?v={0}"></script>' -f $releaseVersion))

  if ($html -match '(?i)PUBLIC_STRIP_DEBUG|dropfishDebug|debug-toggle|debug-panel|debug-modal') {
    throw 'dropfish public HTML still contains debug markup'
  }
  if ($html -notmatch '<html lang="ru" data-game="dropfish">' -or $html -notmatch '\.\./session-guard\.css' -or $html -notmatch '\.\./session-guard\.min\.js') {
    throw 'dropfish public HTML lost mandatory session protection'
  }
  if ($html -match 'src="(?:viewport-fit|mobile-ui|ui-enhancements|script)\.js') {
    throw 'dropfish public HTML still references source JavaScript'
  }
  $html = [regex]::Replace($html, '[ \t]+(?=\r?\n|$)', '')
  [System.IO.File]::WriteAllText($Target, $html, $utf8NoBom)
}

$guardSource = Assert-SafePath (Join-Path $workspace 'scripts\session-guard.source.js') $workspace 'Session guard source'
$guardTargetDir = Assert-SafePath $releaseRoot $workspace 'Public release root'
if (-not (Test-Path -LiteralPath $guardSource)) { throw 'Session guard source is missing' }
$guardSourceText = Get-Content -Raw -Encoding utf8 -LiteralPath $guardSource
if ($guardSourceText -notmatch '/v1/session/claim' -or $guardSourceText -notmatch '/v1/session/finish' -or $guardSourceText -notmatch 'proFishingDailySessionV3') {
  throw 'Session guard source lost a required daily-limit contract'
}
$rawGuardTarget = Assert-SafePath (Join-Path $guardTargetDir 'session-guard.js') $guardTargetDir 'Raw session guard cleanup target'
Remove-Item -LiteralPath $rawGuardTarget -Force -ErrorAction SilentlyContinue
New-ProtectedBundle -SourceText $guardSourceText -ReleaseDir $guardTargetDir -TargetName 'session-guard.min.js' -Label 'session guard' -MinimumObfuscatedIds 40

foreach ($game in $Games) {
  if ($game -notin @('dropfish', 'agroclick')) { throw "Unsupported public game: $game" }

  $source = Assert-SafePath (Join-Path $workspace "$game\script.js") $workspace "$game source"
  $releaseDir = Assert-SafePath (Join-Path $releaseRoot $game) $releaseRoot "$game release directory"
  $styleSource = Assert-SafePath (Join-Path $workspace "$game\style.css") $workspace "$game style source"
  $styleTarget = Assert-SafePath (Join-Path $releaseDir 'style.css') $releaseDir "$game style target"
  $assetsSource = Assert-SafePath (Join-Path $workspace "$game\assets") $workspace "$game asset source"
  $assetsTarget = Assert-SafePath (Join-Path $releaseDir 'assets') $releaseDir "$game asset target"
  New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null

  $sourceText = Get-Content -Raw -Encoding utf8 -LiteralPath $source
  $stripCount = [regex]::Matches($sourceText, $scriptStripPattern).Count
  if ($stripCount -lt 1) { throw "$game has no PUBLIC_STRIP_DEBUG section" }
  $publicSource = [regex]::Replace($sourceText, $scriptStripPattern, '')
  if ($game -eq 'dropfish') {
    $testFlag = 'const BUILD_CONFIG = { unlimitedSessions: true };'
    $publicFlag = 'const BUILD_CONFIG = { unlimitedSessions: false };'
    if (-not $publicSource.Contains($testFlag)) { throw 'dropfish BUILD_CONFIG test flag was not found' }
    $publicSource = $publicSource.Replace($testFlag, $publicFlag)
  }
  if ($publicSource -match '(?i)PUBLIC_STRIP_DEBUG|buildDropfishDebugPanel|buildDebug\s*\(|debugToggle|dropfishDebug|debug-panel|debugBtn|data-debug-action') {
    throw "$game public staging source still contains debug code"
  }
  if ($game -eq 'dropfish' -and $publicSource -notmatch 'BUILD_CONFIG\s*=\s*\{\s*unlimitedSessions:\s*false\s*\}') {
    throw 'dropfish public staging source is not daily-limited'
  }

  New-ProtectedBundle -SourceText $publicSource -ReleaseDir $releaseDir -TargetName 'script.public.min.js' -Label "$game main" -MinimumObfuscatedIds 1000
  Copy-Item -LiteralPath $styleSource -Destination $styleTarget -Force

  if ($game -eq 'dropfish') {
    Copy-Item -LiteralPath (Join-Path $workspace 'dropfish\mobile-ui.css') -Destination (Join-Path $releaseDir 'mobile-ui.css') -Force
    New-ProtectedBundle -SourceText (Get-Content -Raw -Encoding utf8 -LiteralPath (Join-Path $workspace 'dropfish\viewport-fit.js')) -ReleaseDir $releaseDir -TargetName 'viewport-fit.min.js' -Label 'dropfish viewport support' -MinimumObfuscatedIds 20
    New-ProtectedBundle -SourceText (Get-Content -Raw -Encoding utf8 -LiteralPath (Join-Path $workspace 'dropfish\mobile-ui.js')) -ReleaseDir $releaseDir -TargetName 'mobile-ui.min.js' -Label 'dropfish mobile UI' -MinimumObfuscatedIds 40
    New-ProtectedBundle -SourceText (Get-Content -Raw -Encoding utf8 -LiteralPath (Join-Path $workspace 'dropfish\ui-enhancements.js')) -ReleaseDir $releaseDir -TargetName 'ui-enhancements.min.js' -Label 'dropfish UI enhancements' -MinimumObfuscatedIds 20
    Copy-DropFishRuntimeAssets -SourceDir $assetsSource -TargetDir $assetsTarget
    New-DropFishPublicHtml -Source (Join-Path $workspace 'dropfish\index.html') -Target (Join-Path $releaseDir 'index.html')

    Get-ChildItem -LiteralPath $releaseDir -File -Filter '*.md' | Remove-Item -Force
  }
  else {
    New-ProtectedBundle -SourceText (Get-Content -Raw -Encoding utf8 -LiteralPath (Join-Path $workspace 'agroclick\viewport-fit.js')) -ReleaseDir $releaseDir -TargetName 'viewport-fit.min.js' -Label 'agroclick viewport support' -MinimumObfuscatedIds 20
    if (Test-Path -LiteralPath $assetsTarget) { Remove-Item -LiteralPath $assetsTarget -Recurse -Force }
    Copy-Item -LiteralPath $assetsSource -Destination $releaseDir -Recurse -Force
  }
}

# The shared guard cache key must move with the protected bundle for every existing public game.
Get-ChildItem -LiteralPath $releaseRoot -Directory | ForEach-Object {
  $indexPath = Join-Path $_.FullName 'index.html'
  if (-not (Test-Path -LiteralPath $indexPath)) { return }
  $html = Get-Content -Raw -Encoding utf8 -LiteralPath $indexPath
  if ($html -notmatch '\.\./session-guard\.min\.js') { return }
  $html = [regex]::Replace($html, '\.\./session-guard\.css\?v=[^"'']+', "../session-guard.css?v=$guardVersion")
  $html = [regex]::Replace($html, '\.\./session-guard\.min\.js\?v=[^"'']+', "../session-guard.min.js?v=$guardVersion")
  [System.IO.File]::WriteAllText($indexPath, $html, $utf8NoBom)
}

if (Test-Path -LiteralPath (Join-Path $releaseRoot 'session-guard.js')) {
  throw 'Raw session-guard.js must not exist in public-release'
}
