const assert=require('assert');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const game=path.join(root,'dropfish');
const pageUrl=pathToFileURL(path.join(game,'index.html')).href;
const badgeDir=path.join(game,'assets','icons','chronology-badges');
const rowArtDir=path.join(game,'assets','chronology-row-art');
const weightLimitIcon=path.join(game,'assets','icons','fish-status','weight-limit.webp');
const output=path.join(root,'.visual-test-output','chronology-badge-icons');
const expectedFiles=[
  'origin-cast.webp','origin-arcade.webp','origin-depth.webp','origin-dungeon.webp','origin-expedition.webp','origin-rift.webp','origin-radioactive.webp','origin-trade.webp','origin-angus.webp','origin-abyss.webp','origin-dead-waters.webp','origin-bottomless-chest.webp','origin-duplicator.webp',
  'type-catch.webp','type-non-fish.webp','type-trash.webp','type-bonus.webp','type-danger.webp','type-coin.webp','type-event.webp','type-dfme.webp','type-blueprint.webp','type-device.webp',
  'rarity-epic.webp','rarity-legendary.webp','rarity-mythic.webp'
];

function verifyAssetContract(){
  const actual=fs.readdirSync(badgeDir).filter(name=>name.endsWith('.webp')).sort();
  assert.deepStrictEqual(actual,[...expectedFiles].sort(),'chronology badge asset set changed');
  for(const name of actual){
    const bytes=fs.readFileSync(path.join(badgeDir,name));
    assert(bytes.length>64&&bytes.subarray(0,4).toString('ascii')==='RIFF'&&bytes.subarray(8,12).toString('ascii')==='WEBP',`invalid WebP: ${name}`);
  }
  const rowArt=fs.readdirSync(rowArtDir).filter(name=>name.endsWith('.webp'));
  assert.strictEqual(rowArt.length,39,'chronology wide artwork set must contain 39 WebP files');
  assert(rowArt.includes('orca-debuff.webp')&&rowArt.includes('abyssal-unknown.webp')&&rowArt.includes('viaxalior.webp'),'required chronology artwork is missing');
  for(const name of rowArt){
    const bytes=fs.readFileSync(path.join(rowArtDir,name));
    assert(bytes.length>64&&bytes.subarray(0,4).toString('ascii')==='RIFF'&&bytes.subarray(8,12).toString('ascii')==='WEBP',`invalid wide artwork WebP: ${name}`);
  }
  const orcaArtworkHash=crypto.createHash('sha256').update(fs.readFileSync(path.join(rowArtDir,'orca-debuff.webp'))).digest('hex').toUpperCase();
  assert.strictEqual(orcaArtworkHash,'8D4DF7CACC5C573B28491021832593E223AE8C6CD036DE9D0E8E192E8F4A93F0','orca chronology artwork is not the approved wide replacement');
  const viaxaliorArtworkHash=crypto.createHash('sha256').update(fs.readFileSync(path.join(rowArtDir,'viaxalior.webp'))).digest('hex').toUpperCase();
  assert.strictEqual(viaxaliorArtworkHash,'52BA20251B7D8ADE541D76F3ED9B7C25E735A98D9A1BC9866D2156497B27D0AA','Viaxalior chronology artwork is not the approved supplied illustration');
  const weightLimitBytes=fs.readFileSync(weightLimitIcon);
  assert(weightLimitBytes.length>64&&weightLimitBytes.subarray(0,4).toString('ascii')==='RIFF'&&weightLimitBytes.subarray(8,12).toString('ascii')==='WEBP','invalid weight-limit WebP');
  const runtime=['index.html','script.js','style.css','mobile-ui.css'].map(name=>fs.readFileSync(path.join(game,name),'utf8')).join('\n');
  assert(!runtime.includes('chronology-compact-art'),'runtime still references the retired compact chronology artwork');
  assert(!/Иконки[\\/]+рыбы DF/i.test(runtime),'runtime references the external source folder');
}

async function installFixtures(page){
  await page.evaluate(()=>{
    state=initialState();
    state.history=[];
    state.fish=[];
    state.historyUi={expandedId:'badge-event',filter:'all',introducedKeys:[],initialized:true,compactVersion:4};
    const now=Date.now();
    const fishRows=[
      ['badge-cast','треска','Заброс'],
      ['badge-bottomless','морской окунь','Бездонный ларь'],
      ['badge-duplicator','пикша','Ихтиодубликатор']
    ];
    fishRows.forEach(([id,name,source],index)=>{
      const fish={id:`fish-${id}`,name,weight:4.2+index,originalWeight:4.2+index,category:'normal',source,direct:true,removed:false,tags:[]};
      state.fish.push(fish);
      state.history.push({id,type:'fish',text:name,detail:'(Проверка источника)',numbered:false,createdAt:now-index*1000,fishId:fish.id,fishSource:source});
    });
    state.history.push(
      {id:'badge-event',type:'event',text:'Штормовое предупреждение',detail:'(Ветер усиливается)',numbered:false,createdAt:now-5000},
      {id:'badge-duck',type:'debuff',text:'Утка',detail:'(Проверка иллюстрации дебафа)',numbered:false,createdAt:now-5500},
      {id:'badge-orca',type:'debuff',text:'Косатка',detail:'(Проверка новой иллюстрации Косатки)',numbered:false,createdAt:now-5750},
      {id:'badge-bonus',type:'bonus',text:'Счастливый поплавок',detail:'(Хлам не расходует заброс)',numbered:false,createdAt:now-6000},
      {id:'badge-epic',type:'epic',text:'Эпический артефакт',detail:'(Редкость артефакта)',numbered:false,createdAt:now-7000},
      {id:'badge-rift',type:'rift',text:'Открыт Древний разлом: Сингулярная яма',detail:'(Разлом обнаружен)',numbered:false,createdAt:now-8000,riftType:'singularity',riftId:'badge-rift-fixture'}
    );
    render();
    document.getElementById('historyScroll').scrollTop=0;
  });
  await page.waitForFunction(()=>[...document.querySelectorAll('.chronology-row__badge img,.chronology-row__art img')].every(image=>image.complete&&image.naturalWidth>0));
}

async function inspect(browserType,label,viewport){
  const browser=await browserType.launch({headless:true});
  try{
    const page=await browser.newPage({viewport});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(pageUrl,{waitUntil:'load'});
    await installFixtures(page);
    const result=await page.evaluate(()=>{
      const files=Object.values(CHRONOLOGY_BADGE_ICON_FILES);
      const fishKeys={...CHRONOLOGY_FISH_BADGE_KEYS};
      const typeKeys={...CHRONOLOGY_TYPE_BADGE_KEYS};
      const abyssLabel=chronologyRowBadge({type:'abyssal'})?.label||'';
      const debuffSources=Object.fromEntries(['Чайка','Рак','Утка','Осьминог','Косатка'].map(name=>[name,chronologyRowArtwork({type:'debuff',text:name})?.src||'']));
      const weightLimitImpacts=['Утка','Рак'].map(source=>{
        const host=document.createElement('div');
        host.className='history-row-details';
        host.style.cssText='position:absolute;left:-10000px;top:0';
        host.innerHTML=renderDebuffWeightImpact({debuffLimited:true,preDebuffWeight:12.4,debuffBaseWeight:4.2,debuffSource:source});
        document.querySelector('.mobile-game-shell__chronology').append(host);
        const badge=host.querySelector('.fish-effect-badge'),image=badge?.querySelector('img');
        const badgeBox=badge?.getBoundingClientRect(),imageBox=image?.getBoundingClientRect(),background=badge?getComputedStyle(badge).backgroundColor:'';
        const result={source,src:image?.getAttribute('src')||'',className:badge?.className||'',label:badge?.getAttribute('aria-label')||'',badgeSize:[badgeBox?.width||0,badgeBox?.height||0],imageSize:[imageBox?.width||0,imageBox?.height||0],background};
        host.remove();
        return result;
      });
      const rows=[...document.querySelectorAll('.chronology-row')].map(row=>{
        const box=element=>element?.getBoundingClientRect()||null;
        const summary=row.querySelector('.chronology-row__summary');
        const icon=row.querySelector('.chronology-row__icon');
        const badge=row.querySelector('.chronology-row__badge');
        const badgeImage=badge?.querySelector('img');
        const title=row.querySelector('.chronology-row__title');
        const resultNode=row.querySelector('.chronology-row__result');
        const chevron=row.querySelector('.chronology-row__chevron');
        const art=row.querySelector('.chronology-row__art');
        const artImage=art?.querySelector('img');
        const detail=row.querySelector('.chronology-row__badge-detail');
        const badgeStyle=badge?getComputedStyle(badge):null;
        return {
          id:row.dataset.historyId,
          summary:box(summary),icon:box(icon),badge:box(badge),badgeImage:box(badgeImage),title:box(title),result:box(resultNode),chevron:box(chevron),art:box(art),
          hasNoSummaryIcon:row.classList.contains('has-no-summary-icon'),
          badgeText:badge?.textContent.trim()||'',
          badgeTitle:badge?.getAttribute('title')||'',
          badgeAria:badge?.getAttribute('aria-label')||'',
          badgeKey:badge?.dataset.badgeKey||'',
          badgeLoaded:Boolean(badgeImage?.naturalWidth),
          badgeImmediatelyBeforeChevron:chevron?badge?.nextElementSibling===chevron:true,
          badgeAfterTitle:title&&badge?Boolean(title.compareDocumentPosition(badge)&Node.DOCUMENT_POSITION_FOLLOWING):false,
          badgeBackground:badgeStyle?.backgroundColor||'',
          badgeBorder:badgeStyle?.borderTopWidth||'',
          badgeShadow:badgeStyle?.boxShadow||'',
          artLoaded:Boolean(artImage?.naturalWidth),
          artSource:artImage?.getAttribute('src')||'',
          artNaturalSize:artImage?[artImage.naturalWidth,artImage.naturalHeight]:[0,0],
          artObjectFit:artImage?getComputedStyle(artImage).objectFit:'',
          artMask:artImage?(getComputedStyle(artImage).webkitMaskImage||getComputedStyle(artImage).maskImage):'none',
          summaryBackground:summary?getComputedStyle(summary).backgroundImage:'',
          artOverlay:art?getComputedStyle(art,'::after').content:'none',
          detailText:detail?.textContent.replace(/\s+/g,' ').trim()||''
        };
      });
      return {files,fishKeys,typeKeys,abyssLabel,debuffSources,weightLimitImpacts,rows};
    });
    assert.deepStrictEqual(errors,[],`${label}: page errors: ${errors.join(' | ')}`);
    assert.strictEqual(result.files.length,26,`${label}: badge mapping count changed`);
    assert.strictEqual(new Set(result.files).size,26,`${label}: badge files are not unique`);
    assert.strictEqual(result.fishKeys['ЭПИЧЕСКИЙ'],'origin-bottomless-chest',`${label}: bottomless chest collision returned`);
    assert.strictEqual(result.fishKeys['БОНУС'],'origin-duplicator',`${label}: duplicator collision returned`);
    assert.strictEqual(result.typeKeys.epic,'rarity-epic',`${label}: epic rarity collision returned`);
    assert.strictEqual(result.typeKeys.bonus,'type-bonus',`${label}: bonus event collision returned`);
    assert.strictEqual(result.abyssLabel,'АБИССАЛЬНАЯ ФОРМА',`${label}: abyss source still uses an abbreviation`);
    assert.deepStrictEqual(result.debuffSources,{
      'Чайка':'./assets/chronology-row-art/seagull.webp',
      'Рак':'./assets/chronology-row-art/crayfish.webp',
      'Утка':'./assets/chronology-row-art/duck.webp',
      'Осьминог':'./assets/chronology-row-art/octopus.webp',
      'Косатка':'./assets/chronology-row-art/orca-debuff.webp?v=20261105-2'
    },`${label}: debuff artwork mapping changed`);
    assert.deepStrictEqual(result.weightLimitImpacts,[
      {source:'Утка',src:'./assets/icons/fish-status/weight-limit.webp',className:'fish-effect-badge is-weight-limit',label:'Ограничение в весе',badgeSize:[30,30],imageSize:[30,30],background:'rgba(0, 0, 0, 0)'},
      {source:'Рак',src:'./assets/icons/fish-status/weight-limit.webp',className:'fish-effect-badge is-weight-limit',label:'Ограничение в весе',badgeSize:[30,30],imageSize:[30,30],background:'rgba(0, 0, 0, 0)'}
    ],`${label}: duck and crayfish do not share the new project weight-limit icon`);
    for(const row of result.rows){
      assert(row.badgeLoaded&&row.badgeText==='',`${label}/${row.id}: text badge or unloaded icon`);
      assert(row.badgeAfterTitle&&row.badgeImmediatelyBeforeChevron,`${label}/${row.id}: attribute icon is not after the title and before disclosure`);
      assert([row.badge.width,row.badge.height,row.badgeImage.width,row.badgeImage.height].every(value=>Math.abs(value-42)<=.5),`${label}/${row.id}: attribute icon does not match the 42px object slot (${JSON.stringify({badge:row.badge,badgeImage:row.badgeImage})})`);
      assert(row.badgeBackground==='rgba(0, 0, 0, 0)'&&row.badgeBorder==='0px'&&row.badgeShadow==='none',`${label}/${row.id}: colored badge backplate returned`);
      assert(row.badgeTitle&&row.badgeAria.includes(row.badgeTitle),`${label}/${row.id}: accessible full label missing`);
      assert((!row.icon||row.icon.right<=row.title.left+1)&&(!row.result||row.result.right<=row.badge.left+1),`${label}/${row.id}: object/title/result/attribute order overlaps ${JSON.stringify({icon:row.icon,title:row.title,result:row.result,badge:row.badge})}`);
      if(row.id==='badge-rift')assert(!row.icon&&row.hasNoSummaryIcon&&row.badgeKey==='origin-rift',`${label}: Rift parent must keep only its service origin badge`);
      assert(row.summaryBackground==='none',`${label}/${row.id}: artwork still overlays the summary`);
      if(row.art){
        assert(row.artLoaded&&Math.abs(row.art.width-row.summary.width)<=.5&&Math.abs(row.art.height-row.summary.height)<=.5,`${label}/${row.id}: artwork does not cover the chronology row (${JSON.stringify({summary:row.summary,art:row.art})})`);
        if(row.id!=='badge-orca')assert(row.artMask&&row.artMask!=='none'&&row.artMask.includes('gradient'),`${label}/${row.id}: artwork edge feathering is missing (${row.artMask})`);
        assert(row.artOverlay==='""',`${label}/${row.id}: readability scrim is missing over wide artwork`);
        assert(row.badge.right<=row.summary.right+1&&(!row.chevron||row.badge.right<=row.chevron.left+1),`${label}/${row.id}: attribute/disclosure controls overlap`);
      }
      if(row.id==='badge-duck')assert(row.artSource.endsWith('/assets/chronology-row-art/duck.webp'),`${label}: duck debuff received unrelated artwork (${row.artSource})`);
      if(row.id==='badge-orca'){
        assert(row.artLoaded&&row.artSource.endsWith('/assets/chronology-row-art/orca-debuff.webp?v=20261105-2'),`${label}: orca debuff did not receive the new artwork (${row.artSource})`);
        assert(row.artNaturalSize[0]/row.artNaturalSize[1]>=5.5,`${label}: orca artwork is too tall and will crop the subject (${row.artNaturalSize.join('x')})`);
        assert(row.artObjectFit==='contain',`${label}: orca artwork does not preserve the complete subject (${row.artObjectFit})`);
        assert(row.artMask==='none',`${label}: orca artwork still uses the cross-browser object mask (${row.artMask})`);
      }
      if(row.id==='badge-event')assert(/Тип:\s*СОБЫТИЕ/.test(row.detailText),`${label}: expanded label text missing`);
    }
    await page.locator('[data-history-id="badge-orca"]').screenshot({path:path.join(output,`${label}-orca.png`),animations:'disabled'});
  }finally{
    await browser.close();
  }
}

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  verifyAssetContract();
  const cases=[
    [chromium,'chromium-phone-portrait',{width:390,height:844}],
    [chromium,'chromium-phone-landscape',{width:844,height:390}],
    [chromium,'chromium-desktop',{width:1366,height:768}],
    [webkit,'webkit-phone-portrait',{width:390,height:844}],
    [webkit,'webkit-tablet-portrait',{width:768,height:1024}],
    [webkit,'webkit-tablet-landscape',{width:1024,height:768}]
  ];
  for(const args of cases)await inspect(...args);
  process.stdout.write(`PASS: chronology badge icons (${expectedFiles.length} assets, ${cases.length} cross-device cases)\n`);
})().catch(error=>{console.error(error);process.exitCode=1;});
