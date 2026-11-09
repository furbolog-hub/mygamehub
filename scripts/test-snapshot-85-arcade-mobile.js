const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const pageUrl=pathToFileURL(path.resolve(__dirname,'../dropfish/index.html')).href;
const output=path.resolve(__dirname,'../test-results/snapshot-85-arcade');
const viewports={
  iphone16ProMaxPortrait:{width:440,height:956},
  iphone16ProMaxLandscape:{width:956,height:440}
};

async function inspectArcadeCreature(page){
  await page.evaluate(()=>{
    state=initialState();
    state.weather='eclipse';
    state.weatherSeen=['eclipse'];
    render();
    document.querySelectorAll('#arcadeLayer .arcade-fish').forEach(node=>node.remove());
    if(activeArcadeFish)removeArcadeCreature(activeArcadeFish);
    const originalRandom=Math.random;
    Math.random=()=>.2;
    try{spawnArcadeCreature();}finally{Math.random=originalRandom;}
  });
  const creature=page.locator('#arcadeLayer .arcade-fish');
  await creature.waitFor({state:'visible'});
  await creature.evaluate(node=>{
    const animation=node.getAnimations()[0];
    animation.pause();
    animation.currentTime=animation.effect.getTiming().duration*.5;
  });
  return creature.evaluate(node=>{
    const rect=element=>element.getBoundingClientRect().toJSON();
    const style=getComputedStyle(node);
    const body=node.querySelector('.arcade-fish-body,.arcade-orca-body');
    return {
      target:rect(node),
      body:rect(body),
      lake:rect(document.getElementById('lakeCard')),
      weatherCopy:rect(document.querySelector('.weather-copy')),
      effects:rect(document.querySelector('.active-effects-rail')),
      appearance:style.appearance||style.webkitAppearance,
      webkitAppearance:style.webkitAppearance,
      backgroundColor:style.backgroundColor,
      backgroundImage:style.backgroundImage,
      borderWidths:[style.borderTopWidth,style.borderRightWidth,style.borderBottomWidth,style.borderLeftWidth],
      boxShadow:style.boxShadow,
      padding:[style.paddingTop,style.paddingRight,style.paddingBottom,style.paddingLeft],
      animationName:style.animationName,
      arcadeY:style.getPropertyValue('--arcade-y'),
      computedTop:style.top
    };
  });
}

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  for(const [engineName,browserType] of Object.entries({chromium,webkit})){
    const browser=await browserType.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        const errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        await page.addInitScript(()=>localStorage.setItem('proFishingReduceMotion','0'));
        await page.goto(pageUrl,{waitUntil:'load'});
        const metrics=await inspectArcadeCreature(page);
        await page.locator('#lakeCard').screenshot({path:path.join(output,`${engineName}-${viewportName}.png`),animations:'allow'});
        const targetCenter=(metrics.target.top+metrics.target.bottom)/2;
        const lakeCenter=(metrics.lake.top+metrics.lake.bottom)/2;
        const trajectoryOffset=targetCenter-lakeCenter;
        assert(trajectoryOffset>=25&&trajectoryOffset<=27,`${engineName}/${viewportName}: arcade trajectory is not shifted below the weather copy (${JSON.stringify({trajectoryOffset,arcadeY:metrics.arcadeY,computedTop:metrics.computedTop,target:metrics.target,lake:metrics.lake})})`);
        assert(metrics.body.top>=metrics.weatherCopy.bottom-1,`${engineName}/${viewportName}: arcade creature still intersects the weather copy (${JSON.stringify({body:metrics.body,weatherCopy:metrics.weatherCopy})})`);
        assert(metrics.body.top>=metrics.lake.top-1&&metrics.body.bottom<=metrics.lake.bottom+1&&metrics.body.bottom<=metrics.effects.top+1,`${engineName}/${viewportName}: arcade creature overlaps the active-effects rail (${JSON.stringify({body:metrics.body,lake:metrics.lake,effects:metrics.effects})})`);
        assert(metrics.appearance==='none'&&metrics.webkitAppearance==='none',`${engineName}/${viewportName}: native button appearance leaked into the arcade target (${metrics.appearance}/${metrics.webkitAppearance})`);
        assert(metrics.backgroundColor==='rgba(0, 0, 0, 0)'&&metrics.backgroundImage==='none'&&metrics.boxShadow==='none',`${engineName}/${viewportName}: arcade target has a visible rectangular backplate`);
        assert(metrics.borderWidths.every(value=>value==='0px')&&metrics.padding.every(value=>value==='0px'),`${engineName}/${viewportName}: native button box metrics remain`);
        assert(metrics.animationName.startsWith('mobileSceneArcade'),`${engineName}/${viewportName}: mobile arcade animation is not active`);
        assert.deepStrictEqual(errors,[],`${engineName}/${viewportName}: ${errors.join(' | ')}`);
        await page.close();
      }
    }finally{
      await browser.close();
    }
  }
  process.stdout.write('PASS: Snapshot 86 arcade trajectory is lowered, unclipped, and backplate-free in Chromium/WebKit\n');
})().catch(error=>{
  process.stderr.write(`FAIL: ${error.stack||error}\n`);
  process.exitCode=1;
});
