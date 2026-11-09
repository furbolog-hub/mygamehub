const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const pageUrl=pathToFileURL(path.join(root,'dropfish/index.html')).href;
const output=path.join(root,'test-results/dropfish-history-stage-8');
const source=fs.readFileSync(path.join(root,'dropfish/script.js'),'utf8');
const css=fs.readFileSync(path.join(root,'dropfish/mobile-ui.css'),'utf8');
const viewports={
  phoneSmall:{width:320,height:568},
  phonePortrait:{width:390,height:844},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:768,height:1024},
  tabletLandscape:{width:1024,height:768},
  desktop:{width:1280,height:900}
};

function verifyStaticContract(){
  assert(source.includes("new Set(['weather','rift','radioactive','special'])"),'temporary ambient motion tiers are not centralized');
  assert(source.includes('chronologyMotionReduced()'),'motion does not share a reduced-motion guard');
  assert(source.includes('triggerChronologyAmbientMotion(latest)'),'new rows do not trigger temporary ambient motion');
  assert(!source.includes('scheduleFishShadow'),'recurring chronology fish-shadow scheduler remains enabled');
  assert(!source.includes('historyAmbientMarkup'),'recurring fish-shadow markup remains enabled');
  assert(css.includes('chronology-row-enter 200ms'),'row entrance is outside the 180-220ms requirement');
  assert(css.includes('grid-template-rows 250ms'),'disclosure is outside the 220-280ms requirement');
  assert(css.includes('@keyframes chronology-catch-icon'),'catch icon scale motion is missing');
  assert(css.includes('@keyframes chronology-negative-impulse'),'negative event impulse is missing');
  assert(css.includes('@keyframes chronology-weather-change'),'weather state transition is missing');
  assert(css.includes('@keyframes chronology-ambient-wash'),'temporary ambient transition is missing');
  assert(css.includes('body[class].reduce-motion .mobile-game-shell__chronology'),'in-game reduced-motion override is missing');
  assert(css.includes('@media (prefers-reduced-motion: reduce)'),'system reduced-motion override is missing');
}

async function prepare(page,reducedPreference='0'){
  await page.addInitScript(value=>{
    localStorage.setItem('proFishingReduceMotion',value);
    localStorage.removeItem('proFishingTestSessionV1');
  },reducedPreference);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pageUrl,{waitUntil:'load'});
  await page.evaluate(()=>{
    state=initialState();
    state.history=[];
    state.historyUi={expandedId:null,filter:'all',introducedKeys:[],initialized:true,compactVersion:4};
    render();
  });
  return errors;
}

async function addMotionRow(page,type,meta={}){
  return page.evaluate(({type,meta})=>{
    const row=addHistory(`Motion fixture: ${type}`,type,meta.detail||'',meta);
    const element=document.querySelector(`[data-history-id="${row.id}"]`);
    const icon=element?.querySelector('.chronology-row__icon');
    const head=element?.querySelector('.history-row-head');
    if(!element||!head)throw new Error(`Motion fixture did not render: ${type}`);
    const style=getComputedStyle(element);
    const iconStyle=icon?getComputedStyle(icon):null;
    const headStyle=getComputedStyle(head);
    const animations=[element,...element.querySelectorAll('*')].flatMap(node=>{
      const computed=getComputedStyle(node);
      return computed.animationName.split(',').map((name,index)=>({
        name:name.trim(),
        iterations:(computed.animationIterationCount.split(',')[index]||computed.animationIterationCount.split(',')[0]||'').trim()
      })).filter(item=>item.name&&item.name!=='none');
    });
    return {
      id:row.id,
      tier:element.dataset.historyMotionTier,
      animationName:style.animationName,
      animationDuration:style.animationDuration,
      iconAnimationName:iconStyle?.animationName||'none',
      headAnimationName:headStyle.animationName,
      height:element.getBoundingClientRect().height,
      opacity:style.opacity,
      ambient:document.querySelector('[data-mobile-game-shell]')?.dataset.chronologyAmbient||'',
      animations
    };
  },{type,meta});
}

async function verifyFullMotion(page,label){
  const standard=await addMotionRow(page,'event');
  assert.strictEqual(standard.tier,'standard',`${label}: standard tier missing`);
  assert(standard.animationName.includes('chronology-row-enter')&&standard.animationDuration.includes('0.2s'),`${label}: standard row entrance is not 200ms`);
  assert.strictEqual(standard.opacity,'1',`${label}: new row entered with unsafe opacity`);

  const catchRow=await addMotionRow(page,'fish');
  assert.strictEqual(catchRow.tier,'catch',`${label}: catch tier missing`);
  assert(catchRow.iconAnimationName.includes('chronology-catch-icon'),`${label}: catch icon scale motion missing`);

  const rare=await addMotionRow(page,'epic');
  const legendary=await addMotionRow(page,'legendary');
  const mythic=await addMotionRow(page,'mythic');
  assert(rare.animationName.includes('chronology-rarity-reveal')&&rare.animationDuration.includes('0.36s'),`${label}: rare reveal is missing`);
  assert(legendary.animationName.includes('chronology-legendary-reveal')&&legendary.animationDuration.includes('0.48s'),`${label}: legendary reveal is missing`);
  assert(mythic.animationName.includes('chronology-mythic-reveal')&&mythic.animationDuration.includes('0.62s'),`${label}: mythic reveal is missing`);

  const negative=await addMotionRow(page,'debuff');
  assert.strictEqual(negative.tier,'negative',`${label}: negative tier missing`);
  assert(negative.headAnimationName.includes('chronology-negative-impulse'),`${label}: negative impulse is missing`);

  await page.evaluate(()=>showWeatherTransition('storm'));
  const weatherScene=await page.evaluate(()=>{
    const style=getComputedStyle(document.getElementById('weatherScene'));
    return {name:style.animationName,duration:style.animationDuration};
  });
  assert(weatherScene.name.includes('chronology-weather-change')&&weatherScene.duration.includes('0.68s'),`${label}: weather scene transition is missing`);

  for(const [type,tier] of [['weather','weather'],['rift','rift'],['radioactive','radioactive'],['abyssal','special']]){
    const row=await addMotionRow(page,type,type==='weather'?{weatherKey:'storm'}:{});
    assert.strictEqual(row.tier,tier,`${label}: ${type} motion tier differs from contract`);
    assert.strictEqual(row.ambient,tier,`${label}: ${tier} temporary ambient state did not start`);
  }

  const disclosure=await page.evaluate(()=>{
    const row=addHistory('Disclosure motion fixture','event','(Details)');
    const element=document.querySelector(`[data-history-id="${row.id}"]`);
    const summary=element.querySelector('[data-history-toggle]');
    const panel=element.querySelector('.chronology-disclosure');
    const before=element.getBoundingClientRect().height;
    summary.click();
    const style=getComputedStyle(panel);
    return {duration:style.transitionDuration,before,expanded:summary.getAttribute('aria-expanded')};
  });
  assert(disclosure.duration.split(',').some(value=>value.trim()==='0.25s'),`${label}: disclosure duration is not 250ms`);
  assert.strictEqual(disclosure.expanded,'true',`${label}: disclosure stopped responding`);

  await page.waitForTimeout(930);
  const settled=await page.evaluate(()=>{
    const shell=document.querySelector('[data-mobile-game-shell]');
    const rows=[...document.querySelectorAll('.chronology-row')];
    const animated=[];
    for(const row of rows){
      for(const node of [row,...row.querySelectorAll('*')]){
        const style=getComputedStyle(node);
        const names=style.animationName.split(',');
        const iterations=style.animationIterationCount.split(',');
        names.forEach((name,index)=>{if(name.trim()!=='none')animated.push({name:name.trim(),iterations:(iterations[index]||iterations[0]||'').trim()});});
      }
    }
    return {
      ambient:shell?.dataset.chronologyAmbient||'',
      newRows:document.querySelectorAll('.chronology-row.is-new').length,
      animated,
      opacity:[...document.querySelectorAll('.chronology-row')].map(row=>getComputedStyle(row).opacity),
      documentScroll:document.documentElement.scrollHeight-document.documentElement.clientHeight
    };
  });
  assert.strictEqual(settled.ambient,'',`${label}: temporary ambient state did not clear`);
  assert.strictEqual(settled.newRows,0,`${label}: new-row state did not clear`);
  assert(settled.animated.every(item=>item.iterations!=='infinite'),`${label}: permanent chronology animation remains: ${JSON.stringify(settled.animated)}`);
  assert(settled.opacity.every(value=>value==='1'),`${label}: a chronology row remained transparent`);
  assert(settled.documentScroll<=1,`${label}: document escaped the fixed shell by ${settled.documentScroll}px`);
}

async function verifyReducedMotion(browserType,engineName){
  for(const [mode,reducedMotion,stored] of [['toggle','no-preference','1'],['system','reduce','0']]){
    const context=await browserType.launch({headless:true});
    try{
      const page=await context.newPage({viewport:viewports.phonePortrait,reducedMotion});
      const errors=await prepare(page,stored);
      const row=await addMotionRow(page,'rift');
      assert.strictEqual(row.animationName,'none',`${engineName}/${mode}: row animation ignored reduced motion`);
      assert.strictEqual(row.ambient,'',`${engineName}/${mode}: ambient state ignored reduced motion`);
      assert(row.animations.length===0,`${engineName}/${mode}: descendant animation ignored reduced motion`);
      assert.strictEqual(row.opacity,'1',`${engineName}/${mode}: reduced-motion row is not visible`);
      assert.deepStrictEqual(errors,[],`${engineName}/${mode}: page errors: ${errors.join(' | ')}`);
    }finally{
      await context.close();
    }
  }
}

(async()=>{
  verifyStaticContract();
  fs.mkdirSync(output,{recursive:true});
  let renders=0;
  for(const [engineName,browserType] of Object.entries({chromium,webkit})){
    const browser=await browserType.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        const errors=await prepare(page,'0');
        await verifyFullMotion(page,`${engineName}/${viewportName}`);
        await page.screenshot({path:path.join(output,`${engineName}-${viewportName}.png`),fullPage:false});
        assert.deepStrictEqual(errors,[],`${engineName}/${viewportName}: page errors: ${errors.join(' | ')}`);
        await page.close();
        renders++;
      }
    }finally{
      await browser.close();
    }
    await verifyReducedMotion(browserType,engineName);
  }
  console.log(`DropFish stage 8 motion checks passed (${renders} full-motion renders + 4 reduced-motion cases).`);
})().catch(error=>{
  console.error(error);
  process.exitCode=1;
});
