const assert=require('assert');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const pageUrl=pathToFileURL(path.join(root,'dropfish/index.html')).href;

async function openCleanPage(browser,viewport){
  const page=await browser.newPage({viewport});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    localStorage.removeItem('proFishingTestSessionV1');
    localStorage.setItem('proFishingReduceMotion','1');
  });
  await page.goto(pageUrl,{waitUntil:'load'});
  return {page,errors};
}

async function verifyPostFinishTransformation(browserType,engineName){
  const browser=await browserType.launch({headless:true});
  try{
    const {page,errors}=await openCleanPage(browser,{width:440,height:956});
    const before=await page.evaluate(()=>{
      state=initialState();
      state.sessionDate='2026-11-09';
      state.history=[];
      state.historyUi={expandedIds:[],filter:'all',introducedKeys:[],initialized:true,compactVersion:4};
      const fish=makeFish('giant','test',true,{initialWeight:101.7,fishName:'Snapshot 84 fixture fish'});
      fish.weight=101.7;
      fish.originalWeight=101.7;
      state.castsLeft=0;
      state.castClicks=10;
      state.tradeShipChecked=true;
      state.tradeShipCompleted=true;
      grantDungeonReward('blood',{bossHp:0,dungeonType:'cradle'});
      finishGame();
      const blood=state.dungeon.rewards.find(item=>item.key==='blood');
      transformLeviaxarBlood(blood);
      return state.finalResult.total;
    });

    await page.locator('#choiceButtons button').nth(1).click();
    await page.locator('#choiceButtons button').nth(1).click();
    await page.locator('#choiceButtons button').nth(1).click();
    await page.waitForTimeout(80);

    const after=await page.evaluate(()=>({
      finished:state.finished,
      total:state.finalResult?.total,
      diceImpact:state.finalResult?.diceImpact,
      resultVisible:!document.getElementById('resultCard').classList.contains('hidden'),
      unnumberedEvents:state.history.filter(row=>row.type==='event'&&!row.numbered).length
    }));
    assert(after.finished&&after.resultVisible,`${engineName}: post-finish choice lost the completed result UI`);
    assert.strictEqual(after.total,Math.round(before*50)/10,`${engineName}: post-finish Hexahedron did not recalculate the total`);
    assert(after.diceImpact?.factor===5&&after.diceImpact.after===after.total,`${engineName}: post-finish multiplier formula is missing`);
    assert.strictEqual(after.unnumberedEvents,1,`${engineName}: recalculation duplicated the completion marker`);
    assert.deepStrictEqual(errors,[],`${engineName}: page errors during post-finish recalculation: ${errors.join(' | ')}`);
    await page.close();
  }finally{
    await browser.close();
  }
}

async function verifyAtomicFinalization(browserType,engineName){
  const browser=await browserType.launch({headless:true});
  try{
    const {page,errors}=await openCleanPage(browser,{width:390,height:844});
    const result=await page.evaluate(()=>{
      state=initialState();
      state.sessionDate='2026-11-09';
      state.castsLeft=0;
      state.tradeShipChecked=true;
      state.tradeShipCompleted=true;
      const original=finalFishSnapshot;
      finalFishSnapshot=()=>{throw new Error('synthetic finalization failure');};
      let escaped=false;
      try{maybeFinalizeSession();}catch(_){escaped=true;}
      finalFishSnapshot=original;
      return {finished:state.finished,hasResult:Boolean(state.finalResult),escaped};
    });
    assert(!result.finished&&!result.hasResult,`${engineName}: a failed calculation left a locked result-less session`);
    assert(!result.escaped,`${engineName}: finalization error escaped to the browser event loop`);
    await page.waitForTimeout(500);
    const recovered=await page.evaluate(()=>(
      {finished:state.finished,hasResult:Boolean(state.finalResult),resultVisible:!document.getElementById('resultCard').classList.contains('hidden')}
    ));
    assert(recovered.finished&&recovered.hasResult&&recovered.resultVisible,`${engineName}: the guarded final-cast retry did not recover the result`);
    assert.deepStrictEqual(errors,[],`${engineName}: atomic-finalization test emitted page errors: ${errors.join(' | ')}`);
    await page.close();
  }finally{
    await browser.close();
  }
}

async function verifyOrientationRecovery(browserType,engineName){
  const browser=await browserType.launch({headless:true});
  try{
    const {page,errors}=await openCleanPage(browser,{width:440,height:956});
    await page.evaluate(()=>{
      state=initialState();
      state.history=[];
      state.historyUi={expandedIds:[],filter:'all',introducedKeys:[],initialized:true,compactVersion:4};
      for(let index=0;index<50;index++)addHistory(`Orientation fixture ${index+1}`,'event');
      render();
    });
    await page.waitForTimeout(80);
    await page.locator('#historyScroll').evaluate(node=>{node.scrollTop=0;});
    await page.setViewportSize({width:956,height:440});
    await page.evaluate(()=>window.dispatchEvent(new Event('orientationchange')));
    await page.waitForTimeout(850);

    const beforeScroll=await page.evaluate(()=>{
      const shell=document.querySelector('[data-mobile-game-shell]');
      const chronology=document.getElementById('mobileFishingChronology');
      const scroll=document.getElementById('historyScroll');
      const shellBox=shell.getBoundingClientRect();
      const chronologyBox=chronology.getBoundingClientRect();
      return {
        viewportHeight:innerHeight,
        shellBottom:shellBox.bottom,
        chronologyHeight:chronologyBox.height,
        clientHeight:scroll.clientHeight,
        scrollHeight:scroll.scrollHeight,
        scrollTop:scroll.scrollTop,
        overflowY:getComputedStyle(scroll).overflowY,
        touchAction:getComputedStyle(scroll).touchAction
      };
    });
    assert(beforeScroll.shellBottom<=beforeScroll.viewportHeight+1,`${engineName}: rotated shell escaped the visible viewport`);
    assert(beforeScroll.chronologyHeight>0&&beforeScroll.clientHeight>0&&beforeScroll.scrollHeight>beforeScroll.clientHeight,`${engineName}: rotated chronology lost its scroll viewport`);
    assert(['auto','scroll'].includes(beforeScroll.overflowY),`${engineName}: rotated chronology no longer owns vertical overflow`);
    assert(/pan-y/.test(beforeScroll.touchAction),`${engineName}: Safari touch panning is not explicitly routed to chronology (${beforeScroll.touchAction})`);

    const maxScrollTop=beforeScroll.scrollHeight-beforeScroll.clientHeight;
    const wheelDelta=beforeScroll.scrollTop>=maxScrollTop-1?-600:600;
    await page.locator('#historyScroll').hover();
    await page.mouse.wheel(0,wheelDelta);
    await page.waitForTimeout(100);
    const afterWheel=await page.locator('#historyScroll').evaluate(node=>node.scrollTop);
    assert(wheelDelta>0?afterWheel>beforeScroll.scrollTop:afterWheel<beforeScroll.scrollTop,`${engineName}: chronology did not scroll after portrait-to-landscape rotation`);

    await page.setViewportSize({width:440,height:956});
    await page.evaluate(()=>window.dispatchEvent(new Event('orientationchange')));
    await page.waitForTimeout(850);
    const portraitAgain=await page.locator('#historyScroll').evaluate(node=>({clientHeight:node.clientHeight,scrollHeight:node.scrollHeight,overflowY:getComputedStyle(node).overflowY}));
    assert(portraitAgain.clientHeight>0&&portraitAgain.scrollHeight>portraitAgain.clientHeight&&['auto','scroll'].includes(portraitAgain.overflowY),`${engineName}: chronology did not recover after rotating back`);
    assert.deepStrictEqual(errors,[],`${engineName}: orientation sequence emitted page errors: ${errors.join(' | ')}`);
    await page.close();
  }finally{
    await browser.close();
  }
}

(async()=>{
  for(const [engineName,browserType] of Object.entries({chromium,webkit})){
    await verifyPostFinishTransformation(browserType,engineName);
    await verifyAtomicFinalization(browserType,engineName);
    await verifyOrientationRecovery(browserType,engineName);
  }
  process.stdout.write('PASS: post-finish recalculation, atomic finalization, and orientation recovery in Chromium/WebKit\n');
})().catch(error=>{
  process.stderr.write(`FAIL: ${error.stack||error}\n`);
  process.exitCode=1;
});
