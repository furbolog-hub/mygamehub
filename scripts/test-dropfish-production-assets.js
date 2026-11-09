const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const game=path.join(root,'dropfish');
const target=pathToFileURL(path.join(game,'index.html')).href;
const weather=['sunny','rain','calm','golden','fog','eclipse','thunder','storm'];
const rifts=['phantom','df1','currents','singularity','unstable','leviathan','gates','crimson'];
const islands=['destructive-tides','leaden-fog','stone-guardians','forgotten-currents'];
const dungeons=['astral-whisper-abyss','leviathan-cradle','eternal-darkness-vault','forgotten-ages-vault'];
const chronologyBadges=[
  'origin-cast','origin-arcade','origin-depth','origin-dungeon','origin-expedition','origin-rift','origin-radioactive','origin-trade','origin-angus','origin-abyss','origin-dead-waters','origin-bottomless-chest','origin-duplicator',
  'type-catch','type-non-fish','type-trash','type-bonus','type-danger','type-coin','type-event','type-dfme','type-blueprint','type-device',
  'rarity-epic','rarity-legendary','rarity-mythic'
];
const assets=[
  'scene/base-sea-wide.png',
  ...weather.map(key=>`scene/weather/${key}.png`),
  'scene/base-sea.webp',
  ...weather.map(key=>`scene/weather/${key}.webp`),
  ...rifts.map(key=>`banners/rifts/${key}.webp`),
  ...islands.map(key=>`banners/islands/${key}.webp`),
  'banners/events/dead-waters.webp',
  ...dungeons.flatMap(key=>[`banners/dungeons/${key}/entrance.webp`,`banners/dungeons/${key}/interior.webp`]),
  ...['event','island','radioactive','rift'].map(key=>`icons/chronology/${key}.webp`),
  ...chronologyBadges.map(key=>`icons/chronology-badges/${key}.webp`),
  ...['fishing','journal','collection','menu'].map(key=>`icons/navigation/${key}.webp`),
  ...['total-weight','casts-left'].map(key=>`icons/hud/${key}.webp`),
  ...['all','catch','events','artifacts','rifts'].map(key=>`icons/filters/${key}.webp`)
];

function verifyFiles(){
  for(const relative of assets){
    const file=path.join(game,'assets',relative);
    assert(fs.existsSync(file),`missing production asset: ${relative}`);
    const bytes=fs.readFileSync(file);
    const isPng=bytes.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
    const isWebp=bytes.subarray(0,4).toString('ascii')==='RIFF'&&bytes.subarray(8,12).toString('ascii')==='WEBP';
    assert(bytes.length>64&&(relative.endsWith('.png')?isPng:isWebp),`asset format mismatch: ${relative}`);
  }
  const runtime=['index.html','script.js','style.css','mobile-ui.css','mobile-ui.js','ui-enhancements.js','viewport-fit.js'].map(file=>fs.readFileSync(path.join(game,file),'utf8')).join('\n');
  const forbiddenIntake=new RegExp(['For','(?: |%20)','work'].join(''),'i');
  assert(!forbiddenIntake.test(runtime),'runtime references the intake folder');
  assert(/mobile-ui\.css\?v=17\.41-snapshot78-hud-filters/.test(runtime),'current mobile UI CSS cache version is missing');
  assert(/style\.css\?v=3\.43-viaxalior/.test(runtime),'current DropFish base CSS cache version is missing');
  assert(/script\.js\?v=31\.38-snapshot78-hud-filters/.test(runtime),'current DropFish JS cache version is missing');
  assert(/viewport-fit\.js\?v=2\.1-webkit-resize/.test(runtime),'current viewport controller cache version is missing');
}

async function inspectPage(browserType,engine,viewport,telegram=false){
  const browser=await browserType.launch({headless:true});
  try{
    const page=await browser.newPage({viewport});
    const errors=[];
    const failed=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('requestfailed',request=>{if(request.resourceType()==='image')failed.push(`${request.url()} :: ${request.failure()?.errorText||'failed'}`);});
    page.on('response',response=>{if(response.status()>=400&&response.request().resourceType()==='image'&&response.url().includes('/dropfish/'))failed.push(`${response.status()} ${response.url()}`);});
    await page.goto(target,{waitUntil:'load'});
    if(telegram){
      await page.evaluate(()=>{
        document.documentElement.style.setProperty('--tg-inset-top','32px');
        document.documentElement.style.setProperty('--tg-inset-right','6px');
        document.documentElement.style.setProperty('--tg-inset-bottom','24px');
        document.documentElement.style.setProperty('--tg-inset-left','6px');
        document.body.classList.add('is-telegram','tg-fullscreen');
        dispatchEvent(new Event('resize'));
      });
    }
    const result=await page.evaluate(async ({weather,rifts,islands})=>{
      const waitFor=(test,timeout=3500)=>new Promise((resolve,reject)=>{
        const started=performance.now();
        const poll=()=>test()?resolve():performance.now()-started>timeout?reject(new Error('asset wait timed out')):requestAnimationFrame(poll);
        poll();
      });
      const base=document.getElementById('weatherArtwork');
      await waitFor(()=>base.complete&&base.naturalWidth>0);
      const weatherStates=[];
      for(const key of weather){
        state.weather=key;render();
        await waitFor(()=>document.getElementById('weatherArtwork')?.dataset.weatherArtwork===key&&document.getElementById('weatherArtwork')?.naturalWidth>0);
        const active=document.getElementById('weatherArtwork');
        weatherStates.push({key,src:active.getAttribute('src'),width:active.naturalWidth,height:active.naturalHeight});
      }
      const media=[
        ...rifts.map(key=>chronologyRowMedia({type:'rift',riftType:key})),
        ...Object.keys(ISLANDS).map(key=>chronologyRowMedia({type:'island',islandCompletion:true,islandKey:key})),
        chronologyRowMedia({type:'deadWaters',deadWatersEvent:true}),
        ...Object.keys(DUNGEON_TYPES).flatMap(key=>[
          chronologyRowMedia({type:'dungeon',dungeonType:key,dungeonAction:'sacrifice'}),
          chronologyRowMedia({type:'dungeon',dungeonType:key,dungeonOutcome:'victory'})
        ])
      ];
      const decoded=await Promise.all(media.map(item=>new Promise(resolve=>{
        const image=new Image();
        image.onload=()=>resolve({src:item.src,fallback:item.fallback,width:image.naturalWidth,height:image.naturalHeight,kind:item.kind});
        image.onerror=()=>resolve({src:item.src,fallback:item.fallback,width:0,height:0,kind:item.kind});
        image.src=item.src;
      })));
      const fallbackIcons=Object.fromEntries(['event','island','radioactive','rift'].map(type=>{
        const host=document.createElement('div');host.innerHTML=chronologyFallbackIcon(type);
        return [type,host.querySelector('img')?.getAttribute('src')||''];
      }));
      const filters=[...document.querySelectorAll('.chronology-filter')].map(button=>({
        id:button.dataset.historyFilter,
        iconCount:button.querySelectorAll('img').length,
        height:button.getBoundingClientRect().height
      }));
      const artboard=document.querySelector('[data-scene-artboard]').getBoundingClientRect();
      const scene=document.getElementById('mobileFishingScene').getBoundingClientRect();
      const artwork=document.querySelector('.scene-artwork').getBoundingClientRect();
      const lake=document.getElementById('lakeCard').getBoundingClientRect();
      const activeWeather=base;
      const baseStyle=getComputedStyle(base);
      const weatherStyle=getComputedStyle(activeWeather);
      return {
        base:{width:base.naturalWidth,height:base.naturalHeight},weatherStates,decoded,fallbackIcons,filters,
        nav:[...document.querySelectorAll('.mobile-nav-item__icon img')].map(image=>image.getAttribute('src')),
        hudIcons:document.querySelectorAll('.lake-stat__icon').length,
        hudLabels:[...document.querySelectorAll('.lake-stat__label')].map(label=>label.textContent.trim()),
        filterHeight:document.getElementById('historyFilters').getBoundingClientRect().height,
        overlayPointer:getComputedStyle(document.getElementById('weatherArtwork')).pointerEvents,
        sceneRatio:scene.height/innerHeight,artboardRatio:artboard.width/artboard.height,
        portraitShell:innerHeight>innerWidth&&innerWidth<=600,
        artworkFit:{base:baseStyle.objectFit,weather:weatherStyle.objectFit},
        artworkPosition:{base:baseStyle.objectPosition,weather:weatherStyle.objectPosition},
        weatherFade:weatherStyle.transitionDuration,
        artwork:{top:artwork.top,left:artwork.left,width:artwork.width,height:artwork.height},
        lake:{top:lake.top,left:lake.left,width:lake.width,height:lake.height},
        intake:[...document.querySelectorAll('[src],[href]')].some(node=>/For(?:%20|\s)+work/i.test(node.getAttribute('src')||node.getAttribute('href')||''))
      };
    },{weather,rifts,islands});
    assert.deepStrictEqual(errors,[],`${engine}: page errors: ${errors.join(' | ')}`);
    assert.deepStrictEqual(failed,[],`${engine}: failed assets: ${failed.join(' | ')}`);
    assert(result.base.width===2172&&result.base.height===724,`${engine}: wide base scene did not load at source geometry`);
    assert(result.weatherStates.length===8&&result.weatherStates.every(item=>item.width===2172&&item.height===724&&item.src.endsWith(`/scene/weather/${item.key}.png`)),`${engine}: weather mapping/load failure`);
    assert(result.artworkFit.base==='cover'&&result.artworkFit.weather==='cover'&&result.artworkPosition.base===result.artworkPosition.weather,`${engine}: base and weather FX geometry diverged`);
    assert(result.weatherFade==='0.32s',`${engine}: weather artwork fade changed`);
    assert(result.lake.height<=112.5,`${engine}: compact weather hero is too tall (${result.lake.height}px)`);
    assert(result.decoded.length===21&&result.decoded.every(item=>item.width>0&&item.height>0&&item.fallback),`${engine}: banner mapping/load/fallback failure`);
    assert(Object.entries(result.fallbackIcons).every(([key,src])=>src.endsWith(`/icons/chronology/${key}.webp`)),`${engine}: fallback icon mapping failure`);
    assert.deepStrictEqual(result.nav,['./assets/icons/navigation/fishing.webp','./assets/icons/navigation/journal.webp','./assets/icons/navigation/collection.webp','./assets/icons/navigation/menu.webp'],`${engine}: navigation icon mapping changed`);
    assert(result.hudIcons===0&&result.hudLabels.join('|')==='Вес|Забросов',`${engine}: unreadable HUD icons or labels returned`);
    assert(result.filters.length===5&&result.filters.every(filter=>filter.iconCount===0&&filter.height<=30.5)&&result.filterHeight<=44.5,`${engine}: chronology filters regained decorative icons or enlarged the rail`);
    assert(result.overlayPointer==='none'&&!result.intake,`${engine}: overlay interception or intake-folder runtime dependency`);
    assert(Math.abs(result.artwork.top-result.lake.top)<1&&Math.abs(result.artwork.left-result.lake.left)<1&&Math.abs(result.artwork.width-result.lake.width)<1&&Math.abs(result.artwork.height-result.lake.height)<1,`${engine}: sea artwork is not integrated into the weather/HUD area`);
  }finally{
    await browser.close();
  }
}

(async()=>{
  verifyFiles();
  const cases=[
    ['chromium-phone',chromium,{width:390,height:844},true],
    ['chromium-landscape',chromium,{width:844,height:390},false],
    ['webkit-tablet',webkit,{width:768,height:1024},false],
    ['webkit-desktop',webkit,{width:1366,height:768},false]
  ];
  for(const args of cases)await inspectPage(args[1],args[0],args[2],args[3]);
  console.log(`DropFish production asset checks passed (${assets.length} production files, 8 weather states, 21 banners, ${cases.length} cross-device renders).`);
})().catch(error=>{console.error(error);process.exitCode=1;});
