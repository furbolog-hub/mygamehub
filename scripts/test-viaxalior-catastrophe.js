const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const pageUrl=pathToFileURL(path.join(root,'dropfish/index.html')).href;
const source=fs.readFileSync(path.join(root,'dropfish/script.js'),'utf8');
const css=fs.readFileSync(path.join(root,'dropfish/style.css'),'utf8');
const output=path.join(root,'artifacts','viaxalior-catastrophe');
const viewports={desktop:{width:1280,height:900},phonePortrait:{width:390,height:844},phoneLandscape:{width:844,height:390},tabletPortrait:{width:768,height:1024},tabletLandscape:{width:1024,height:768}};

function staticChecks(){
  for(const relative of ['dropfish/assets/icons/events/viaxalior.webp','dropfish/assets/icons/trophies/viaxalior-spike.webp','dropfish/assets/chronology-row-art/viaxalior.webp','dropfish/assets/audio/events/viaxalior-attack.ogg'])assert(fs.existsSync(path.join(root,relative)),`missing ${relative}`);
  assert(source.includes("attackChance:.01")&&source.includes("spikeChance:.25")&&source.includes('spikeWeightFactor:2'),'Viaxalior probabilities/weight factor changed');
  assert(source.includes("'./assets/audio/events/viaxalior-attack.ogg'")&&!source.includes('Виаксалиор2.png')&&!source.includes('атака Виаксалиора.mp3'),'wrong attack asset wired');
  assert(css.includes('.viaxalior-blackout')&&css.includes('.is-viaxalior-destroyed::after')&&css.includes('.viaxalior-destroyed-status')&&css.includes('clip-path:none'),'Viaxalior visual states missing');
}

async function seed(page){
  await page.evaluate(()=>{
    state=initialState();state.history=[];state.fish=[];state.nonFishCatches=[];state.bonuses=[];state.artifacts=[];state.debuffs=[];state.coins=[];state.castClicks=10;state.castsLeft=4;state.viaxalior=defaultViaxaliorState();
    const fish=(id,name,weight,extra={})=>({id,name,weight,originalWeight:weight,category:weight>=10?'heavy':'normal',source:'Заброс',direct:true,removed:false,tags:[],...extra});
    const a=fish('vx-fish-a','кижуч',1),control=fish('vx-control','сёмга',10),embedded=fish('vx-embedded','пикша',3,{historyParentId:'vx-artifact'}),pastVictim=fish('vx-past','сайда',7,{removed:true});
    state.fish.push(a,control,embedded,pastVictim);state.stolen=[pastVictim];
    state.nonFishCatches.push({id:'vx-nonfish',name:'Синий осьминог',weight:4,originalWeight:4,removed:false,historyRowId:'vx-nonfish-row',impacts:[]});
    state.bonuses.push({id:'vx-bonus',name:'Счастливый поплавок',startFishIndex:0,source:'Заброс',historyRowId:'vx-bonus-row'});
    state.artifacts.push({id:'vx-artifact-item',name:'Бездонный ларь',tier:'epic',historyRowId:'vx-artifact',rollback:{castsLeft:4}});state.artifactCount=1;state.bonusArtifactCount=1;
    state.debuffs.push({id:'vx-debuff',name:'Чайка',active:true,historyRowId:'vx-debuff-row',affectedFishIds:[pastVictim.id]});
    state.history=[
      {id:'vx-fish-row',type:'fish',text:'Кижуч',detail:'(Тестовый улов)',fishId:a.id,fishSource:'Заброс',numbered:true,createdAt:Date.now()-6000},
      {id:'vx-artifact',type:'epic',text:'Бездонный ларь',detail:'(Создана дополнительная рыба)',artifactId:'vx-artifact-item',embeddedFishIds:[embedded.id],numbered:true,createdAt:Date.now()-5000},
      {id:'vx-bonus-row',type:'bonus',text:'Счастливый поплавок',detail:'(Добавлено 2 заброса)',bonusId:'vx-bonus',numbered:true,createdAt:Date.now()-4000},
      {id:'vx-debuff-row',type:'debuff',text:'Чайка',detail:'(Рыба уже была украдена)',debuffId:'vx-debuff',numbered:true,createdAt:Date.now()-3000},
      {id:'vx-nonfish-row',type:'nonFishCatch',text:'Синий осьминог',detail:'(Необычный улов)',nonFishCatchId:'vx-nonfish',numbered:true,createdAt:Date.now()-2000},
      {id:'vx-control-row',type:'fish',text:'Сёмга',detail:'',fishId:control.id,fishSource:'Заброс',numbered:true,createdAt:Date.now()-1000}
    ];
    recordViaxaliorCastGrant(2,['vx-bonus-row']);
    state.deadWaters.active={id:'vx-water',rowId:'none',status:'available',expiresAt:Date.now()+1200};
    render();
    window.__viaxStartExpiry=state.deadWaters.active.expiresAt;
    window.__viaxAttack=triggerViaxaliorAttack({forceSpike:true,blackoutMs:250,forceDestroyCount:5,forceRowIds:['vx-fish-row','vx-artifact','vx-bonus-row','vx-debuff-row','vx-nonfish-row']});
  });
}

async function run(){
  staticChecks();
  fs.mkdirSync(output,{recursive:true});
  for(const [engineName,engine] of Object.entries({chromium,webkit})){
    const browser=await engine.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        await page.goto(pageUrl,{waitUntil:'load'});
        const roll=await page.evaluate(()=>{const original=Math.random;try{state=initialState();state.castClicks=5;state.castsLeft=5;let values=[.005,.5];Math.random=()=>values.shift();armViaxaliorAfterFifthCast();const attackCast=state.viaxalior.attackCast;state.castsLeft+=5;armViaxaliorAfterFifthCast();const unchanged=state.viaxalior.attackCast;state.viaxalior=defaultViaxaliorState();values=[.5];Math.random=()=>values.shift();armViaxaliorAfterFifthCast();return {attackCast,unchanged,missRolled:state.viaxalior.rolled,missEligible:state.viaxalior.eligible};}finally{Math.random=original;}});
        assert(roll.attackCast===8&&roll.unchanged===8&&roll.missRolled&&!roll.missEligible,`${engineName}/${viewportName}: fifth-cast roll or fixed attack cast failed`);
        await seed(page);await page.waitForTimeout(10);
        const blackout=await page.evaluate(()=>{const el=document.getElementById('viaxaliorBlackout');return {runtime:viaxaliorAttackRuntime,visible:el&&!el.hidden&&getComputedStyle(el).display!=='none',width:el?.getBoundingClientRect().width,height:el?.getBoundingClientRect().height};});
        assert(blackout.runtime&&blackout.visible,`${engineName}/${viewportName}: blackout not active`);
        assert(Math.abs(blackout.width-viewport.width)<=1&&Math.abs(blackout.height-viewport.height)<=1,`${engineName}/${viewportName}: blackout does not cover viewport`);
        await page.evaluate(()=>window.__viaxAttack);await page.waitForTimeout(30);
        await page.evaluate(()=>document.querySelector('[data-history-type="catastrophe"] .chronology-row__art img')?.scrollIntoView({block:'center'}));
        await page.waitForFunction(()=>{const image=document.querySelector('[data-history-type="catastrophe"] .chronology-row__art img');return Boolean(image?.complete&&image.naturalWidth>0);});
        await page.evaluate(async()=>{const image=document.querySelector('[data-history-type="catastrophe"] .chronology-row__art img');await image?.decode?.().catch(()=>{});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
        const result=await page.evaluate(()=>{
          const destroyed=[...document.querySelectorAll('.chronology-row.is-viaxalior-destroyed')],attackRows=[...document.querySelectorAll('[data-history-type="catastrophe"]')],trophyRows=[...document.querySelectorAll('[data-history-type="trophy"]')],spikeRow=state.history.find(row=>row.type==='trophy');
          const first=destroyed[0],pseudo=first?getComputedStyle(first,'::after'):null;
          const damageVariants=destroyed.map(row=>[...row.classList].find(name=>name.startsWith('viaxalior-damage-'))||'');
          const ruptureShapes=destroyed.map(row=>getComputedStyle(row).clipPath);
          const fractureLayers=destroyed.map(row=>{const after=getComputedStyle(row,'::after');return [after.backgroundImage,after.left,after.width];});
          const hudText=document.getElementById('weightLabel')?.textContent||'';
          const attackArt=attackRows[0]?.querySelector('.chronology-row__art img');
          const attackArtStyle=attackArt?getComputedStyle(attackArt):null;
          const attackArtContainer=attackArt?.closest('.chronology-row__art'),attackArtContainerStyle=attackArtContainer?getComputedStyle(attackArtContainer):null,attackArtBox=attackArt?.getBoundingClientRect(),attackArtContainerBox=attackArtContainer?.getBoundingClientRect();
          const attackArtState={src:attackArt?.getAttribute('src')||'',loaded:Boolean(attackArt?.complete&&attackArt.naturalWidth>0),loading:attackArt?.getAttribute('loading')||'',fit:attackArtStyle?.objectFit||'',position:attackArtStyle?.objectPosition||'',mask:attackArtStyle?.maskImage||attackArtStyle?.webkitMaskImage||'',opacity:attackArtStyle?.opacity||'',containerDisplay:attackArtContainerStyle?.display||'',containerVisibility:attackArtContainerStyle?.visibility||'',containerOpacity:attackArtContainerStyle?.opacity||'',containerHidden:Boolean(attackArtContainer?.hidden),size:[attackArtBox?.width||0,attackArtBox?.height||0],containerSize:[attackArtContainerBox?.width||0,attackArtContainerBox?.height||0]};
          return {destroyedCount:destroyed.length,statusCount:destroyed.filter(row=>row.querySelector('.chronology-row__result .viaxalior-destroyed-status')?.textContent.trim()==='УНИЧТОЖЕНО'&&row.querySelector('.chronology-row__result')?.textContent.trim()==='УНИЧТОЖЕНО').length,actions:destroyed.reduce((n,row)=>n+row.querySelectorAll('.history-row-actions button').length,0),damageVariants,ruptureShapes,fractureLayers,attackRows:attackRows.length,trophyRows:trophyRows.length,attackArt:attackArtState,spikeDetail:spikeRow?.detail||'',destroyedWeight:state.viaxalior.destroyedWeight,spikeWeight:state.viaxalior.spike?.weight,fishA:state.fish.find(f=>f.id==='vx-fish-a'),embedded:state.fish.find(f=>f.id==='vx-embedded'),nonfish:state.nonFishCatches.find(item=>item.id==='vx-nonfish'),control:state.fish.find(f=>f.id==='vx-control'),pastVictim:state.fish.find(f=>f.id==='vx-past'),debuff:state.debuffs.find(d=>d.id==='vx-debuff'),bonusExists:state.bonuses.some(b=>b.id==='vx-bonus'),artifact:state.artifacts.find(a=>a.id==='vx-artifact-item'),castsLeft:state.castsLeft,spikeInCatch:state.fish.some(f=>f.id===state.viaxalior.spike?.id)||state.nonFishCatches.some(item=>item.id===state.viaxalior.spike?.id),deadWatersExtension:state.deadWaters.active.expiresAt-window.__viaxStartExpiry,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,cracks:pseudo?.backgroundImage||'',filter:first?getComputedStyle(first.querySelector('.chronology-row__icon')).filter:'',hudText};
        });
        assert.strictEqual(result.destroyedCount,5,`${engineName}/${viewportName}: destroyed row count`);assert.strictEqual(result.statusCount,5,`${engineName}/${viewportName}: explicit destroyed status missing`);assert.strictEqual(result.actions,0,`${engineName}/${viewportName}: destroyed action remains`);
        assert(result.attackRows===1&&result.trophyRows===1,`${engineName}/${viewportName}: attack/trophy rows not separate`);assert(/200%/.test(result.spikeDetail)&&!/кг/i.test(result.spikeDetail),`${engineName}/${viewportName}: spike hint leaks weight`);
        assert(result.attackArt.loaded&&result.attackArt.src.endsWith('/assets/chronology-row-art/viaxalior.webp'),`${engineName}/${viewportName}: Viaxalior chronology illustration is not connected (${JSON.stringify(result.attackArt)})`);
        assert(result.attackArt.loading==='eager',`${engineName}/${viewportName}: critical Viaxalior artwork is deferred (${JSON.stringify(result.attackArt)})`);
        assert(result.attackArt.fit==='cover',`${engineName}/${viewportName}: Viaxalior chronology illustration does not fill its row (${JSON.stringify(result.attackArt)})`);
        assert(result.attackArt.mask==='none'&&Number(result.attackArt.opacity)>=.84,`${engineName}/${viewportName}: Viaxalior illustration is obscured by the generic artwork mask (${JSON.stringify(result.attackArt)})`);
        assert(!result.attackArt.containerHidden&&result.attackArt.containerDisplay!=='none'&&result.attackArt.containerVisibility==='visible'&&result.attackArt.size[0]>300&&result.attackArt.size[1]>=40,`${engineName}/${viewportName}: Viaxalior illustration has no visible paint area (${JSON.stringify(result.attackArt)})`);
        assert(result.destroyedWeight===8&&result.spikeWeight===16,`${engineName}/${viewportName}: weights are ${result.destroyedWeight}/${result.spikeWeight}`);
        assert(result.fishA.removed&&result.embedded.removed&&result.nonfish.removed&&!result.control.removed,`${engineName}/${viewportName}: catch cascade incorrect`);assert(result.pastVictim.removed&&!result.debuff.active,`${engineName}/${viewportName}: past debuff effect was restored`);
        assert(!result.bonusExists&&result.artifact.viaxaliorDestroyed&&result.castsLeft===2&&!result.spikeInCatch,`${engineName}/${viewportName}: source cancellation or immutable spike storage failed`);
        assert(result.deadWatersExtension>=220&&result.overflow<=1&&result.cracks!=='none'&&result.filter!=='none',`${engineName}/${viewportName}: paused timer or visual damage failed`);assert(/26/.test(result.hudText),`${engineName}/${viewportName}: HUD excludes spike (${result.hudText})`);
        assert(result.damageVariants.every(Boolean)&&new Set(result.damageVariants).size>=4&&result.ruptureShapes.every(shape=>shape==='none')&&new Set(result.fractureLayers.map(layer=>layer[1])).size>=4&&result.fractureLayers.every(layer=>parseFloat(layer[2])<=72),`${engineName}/${viewportName}: destroyed rows lost their shared shell or localized damage variants ${JSON.stringify({variants:result.damageVariants,ruptures:result.ruptureShapes,fractures:result.fractureLayers})}`);
        if(viewportName==='phonePortrait')await page.locator('#historyList').screenshot({path:path.join(output,`${engineName}-destroyed-rows.png`),animations:'disabled'});
        const final=await page.evaluate(()=>{state.deadWaters.active=null;state.diceFinalMultiplier=5;finishGame();return state.finalResult;});
        assert(final.total===66&&final.viaxaliorSpikeImpact?.before===50&&final.viaxaliorSpikeImpact?.added===16,`${engineName}/${viewportName}: spike is not added after final multipliers`);
        await page.close();
      }
    }finally{await browser.close();}
  }
  console.log('PASS: Viaxalior catastrophe mechanics and cross-device visuals');
}

run().catch(error=>{console.error(`FAIL: ${error.stack||error}`);process.exit(1);});
