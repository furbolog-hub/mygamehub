param(
    [string]$OutputName = "dropfish-teaser-v1.mp4"
)

$ErrorActionPreference = "Stop"

$promoDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = (Resolve-Path (Join-Path $promoDir "..\..")).Path
$framesDir = Join-Path $promoDir "frames"
$outputPath = Join-Path $promoDir $OutputName

$ffmpegCommand = Get-Command ffmpeg -ErrorAction SilentlyContinue
if ($ffmpegCommand) {
    $ffmpeg = $ffmpegCommand.Source
} else {
    $wingetRoot = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe"
    $ffmpeg = Get-ChildItem -LiteralPath $wingetRoot -Recurse -Filter "ffmpeg.exe" -ErrorAction SilentlyContinue |
        Select-Object -First 1 -ExpandProperty FullName
}

if (-not $ffmpeg -or -not (Test-Path -LiteralPath $ffmpeg)) {
    throw "FFmpeg was not found. Install Gyan.FFmpeg with winget before rendering."
}

$framePaths = @(
    (Join-Path $framesDir "01-fisherman-and-leviathan.png"),
    (Join-Path $framesDir "02-lone-expedition.png"),
    (Join-Path $framesDir "03-mythology-and-artifacts.png"),
    (Join-Path $framesDir "04-levioxar-and-storm-eye.png")
)

$audioPaths = @(
    (Join-Path $projectDir "dropfish\assets\audio\dungeons\eternal-darkness-vault\boss-battle.ogg"),
    (Join-Path $projectDir "dropfish\assets\audio\rifts\ambient\rift-ambient.ogg"),
    (Join-Path $projectDir "dropfish\assets\audio\rifts\opening\rift-open.ogg"),
    (Join-Path $projectDir "dropfish\assets\audio\dungeons\eternal-darkness-vault\dungeon-entrance.ogg")
)

foreach ($path in ($framePaths + $audioPaths)) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Missing promo source: $path"
    }
}

$filter = @"
[0:v]scale=2200:-2,crop=1920:1080,zoompan=z='min(zoom+0.00065,1.09)':x='iw/2-(iw/zoom/2)+20*sin(on/45)':y='ih/2-(ih/zoom/2)-18*sin(on/60)':d=144:s=1920x1080:fps=30,setsar=1[v0];
[1:v]scale=2200:-2,crop=1920:1080,zoompan=z='min(zoom+0.00045,1.065)':x='iw/2-(iw/zoom/2)-35+on/7':y='ih/2-(ih/zoom/2)':d=144:s=1920x1080:fps=30,setsar=1[v1];
[2:v]scale=2200:-2,crop=1920:1080,zoompan=z='if(lte(on,1),1.085,max(zoom-0.00042,1.025))':x='iw/2-(iw/zoom/2)+28*sin(on/58)':y='ih/2-(ih/zoom/2)+12':d=144:s=1920x1080:fps=30,setsar=1[v2];
[3:v]scale=2200:-2,crop=1920:1080,zoompan=z='min(zoom+0.00072,1.105)':x='iw/2-(iw/zoom/2)+45':y='ih/2-(ih/zoom/2)-on/18':d=144:s=1920x1080:fps=30,setsar=1[v3];
[v0][v1]xfade=transition=fadeblack:duration=0.7:offset=4.1[x1];
[x1][v2]xfade=transition=radial:duration=0.7:offset=8.2[x2];
[x2][v3]xfade=transition=fade:duration=0.7:offset=12.3[cut];
nullsrc=s=1920x1080:r=30:d=17.1,noise=alls=92:allf=t+u,format=yuv420p[grain];
[cut][grain]blend=all_mode=screen:all_opacity=0.035,vignette=PI/5,eq=contrast=1.05:saturation=1.08,fade=t=in:st=0:d=0.7,fade=t=out:st=16.45:d=0.65,drawtext=fontfile='C\:/Windows/Fonts/georgiab.ttf':text='DROPFISH':fontcolor=white:fontsize=82:shadowcolor=black@0.85:shadowx=4:shadowy=5:x=(w-text_w)/2:y=h*0.76:enable='between(t,14.45,16.55)',drawtext=fontfile='C\:/Windows/Fonts/georgia.ttf':text='THE DEPTHS ARE WATCHING':fontcolor=0xC7E9FF:fontsize=30:shadowcolor=black@0.9:shadowx=3:shadowy=3:x=(w-text_w)/2:y=h*0.855:enable='between(t,14.8,16.55)'[video];
[4:a]atrim=0:17.1,asetpts=N/SR/TB,volume=0.58[music];
[5:a]atrim=18:35.1,asetpts=N/SR/TB,volume=0.17[ambience];
[6:a]atrim=0:4.5,asetpts=N/SR/TB,volume=0.72,adelay=3900|3900[rift];
[7:a]atrim=0:4.1,asetpts=N/SR/TB,volume=0.56,adelay=8000|8000[entrance];
[music][ambience][rift][entrance]amix=inputs=4:duration=longest:dropout_transition=0,alimiter=limit=0.94,afade=t=in:st=0:d=0.5,afade=t=out:st=16.2:d=0.9[audio]
"@ -replace "`r?`n", ""

$arguments = @(
    "-hide_banner", "-y"
)

foreach ($frame in $framePaths) {
    $arguments += @("-loop", "1", "-t", "4.8", "-i", $frame)
}
foreach ($audio in $audioPaths) {
    $arguments += @("-i", $audio)
}

$arguments += @(
    "-filter_complex", $filter,
    "-map", "[video]", "-map", "[audio]",
    "-t", "17.1",
    "-c:v", "libx264", "-preset", "slow", "-crf", "18",
    "-profile:v", "high", "-level", "4.1", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
    $outputPath
)

Write-Host "Rendering $outputPath"
& $ffmpeg @arguments
if ($LASTEXITCODE -ne 0) {
    throw "FFmpeg render failed with exit code $LASTEXITCODE"
}

Write-Host "Rendered $outputPath"
