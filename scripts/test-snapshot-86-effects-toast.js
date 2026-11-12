const assert=require('assert/strict');
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const pageUrl=process.env.DROPFISH_TEST_URL||pathToFileURL(path.join(root,'dropfish/index.html')).href;
const output=path.join(root,'test-results/snapshot-86-effects-toast');
const viewports={
  phonePortrait:{width:390,height:844},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:768,height:1024},
  tabletLandscape:{width:1024,height:768},
  desktop:{width:1366,height:768}
};

async function prepare(page){
  await page.addInitScript(()=>{
    localStorage.removeItem('proFishingTestSessionV1');
    localStorage.setItem('proFishingReduceMotion','0');
  });
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pageUrl,{waitUntil:process.env.DROPFISH_TEST_URL?'domcontentloaded':'load',timeout:60000});
  await page.waitForFunction(()=>typeof initialState==='function'&&Boolean(document.getElementById('effectsList')),{timeout:60000});
  await page.evaluate(()=>{
    state=initialState();
    state.history=Array.from({length:36},(_,index)=>({
      id:uid(),
      text:`Проверочная запись ${index+1}`,
      type:'event',
      detail:'',
      numbered:false,
      createdAt:Date.now()+index
    }));
    state.bonuses=[];
    render();
  });
  return errors;
}

async function inspectEmptyState(page){
  return page.evaluate(()=>{
    const rail=document.querySelector('.active-effects-rail');
    const empty=document.querySelector('.active-effects-empty');
    const title=document.querySelector('.mobile-game-shell__chronology .section-heading h2');
    const summary=document.getElementById('historyEffectsSummary');
    const toggle=document.getElementById('historyFiltersToggle');
    const railBox=rail.getBoundingClientRect();
    const emptyBox=empty.getBoundingClientRect();
    const titleBox=title.getBoundingClientRect();
    const summaryBox=summary.getBoundingClientRect();
    return {
      emptyText:empty.textContent.trim(),
      emptyCenter:(emptyBox.left+emptyBox.right)/2,
      railCenter:(railBox.left+railBox.right)/2,
      count:document.getElementById('effectCount').textContent,
      oldVisibleLabel:Boolean(document.querySelector('.active-effects-rail__label')),
      summaryText:summary.textContent.replace(/\s+/g,' ').trim(),
      summaryInsideToggle:toggle.contains(summary),
      titleRight:titleBox.right,
      summaryLeft:summaryBox.left,
      toggleLabel:toggle.getAttribute('aria-label'),
      documentOverflow:Math.max(document.documentElement.scrollWidth-document.documentElement.clientWidth,document.body.scrollWidth-document.body.clientWidth)
    };
  });
}

async function inspectDynamicCounts(page){
  return page.evaluate(()=>{
    const snapshot=()=>({
      count:document.getElementById('effectCount').textContent,
      empty:Boolean(document.querySelector('.active-effects-empty')),
      chips:document.querySelectorAll('#effectsList .chip').length,
      railHasEffects:document.querySelector('.active-effects-rail').classList.contains('has-effects')
    });
    state.bonuses=[
      {id:'snapshot86-a',name:'Подводная маска'},
      {id:'snapshot86-b',name:'Подводная маска'}
    ];
    render();
    const added=snapshot();
    state.disabledBonusIds.add('snapshot86-b');
    render();
    const disabled=snapshot();
    state.bonuses.forEach(bonus=>{bonus.isotopeDestroyed=true;});
    render();
    const removed=snapshot();
    return {added,disabled,removed};
  });
}

async function inspectToast(page){
  await page.evaluate(()=>{
    const scroller=document.getElementById('historyScroll');
    scroller.scrollTop=0;
    toast('Проверочное уведомление хронологии');
  });
  await page.waitForTimeout(300);
  const before=await page.evaluate(()=>{
    const toastNode=document.getElementById('toast');
    const chronology=document.querySelector('.mobile-game-shell__chronology .history');
    const header=chronology.querySelector('.section-heading');
    const scroller=document.getElementById('historyScroll');
    const cast=document.getElementById('castBtn');
    const rect=node=>node.getBoundingClientRect().toJSON();
    const style=getComputedStyle(toastNode);
    return {
      toast:rect(toastNode),
      chronology:rect(chronology),
      header:rect(header),
      scroller:rect(scroller),
      cast:rect(cast),
      outsideScroller:!scroller.contains(toastNode),
      shown:toastNode.classList.contains('show'),
      position:style.position,
      transform:style.transform,
      transitionDuration:style.transitionDuration,
      background:style.backgroundColor
    };
  });
  await page.evaluate(()=>{
    const scroller=document.getElementById('historyScroll');
    scroller.scrollTop=Math.min(240,scroller.scrollHeight-scroller.clientHeight);
    scroller.dispatchEvent(new Event('scroll'));
  });
  await page.waitForTimeout(80);
  const after=await page.locator('#toast').evaluate(node=>node.getBoundingClientRect().top);
  return {before,after};
}

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  let renders=0;
  for(const [engineName,browserType] of Object.entries({chromium,webkit})){
    const browser=await browserType.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport,ignoreHTTPSErrors:Boolean(process.env.DROPFISH_TEST_URL)});
        const errors=await prepare(page);
        const label=`${engineName}/${viewportName}`;
        const empty=await inspectEmptyState(page);
        assert.equal(empty.emptyText,'Эффекты: Пока нет',`${label}: incorrect empty-effects copy`);
        assert(Math.abs(empty.emptyCenter-empty.railCenter)<=2,`${label}: empty-effects copy is not centered (${JSON.stringify({emptyCenter:empty.emptyCenter,railCenter:empty.railCenter})})`);
        assert.equal(empty.count,'0',`${label}: initial effect count is not zero`);
        assert(!empty.oldVisibleLabel,`${label}: obsolete visible effects caption remains`);
        assert.equal(empty.summaryText,'Эффекты: 0',`${label}: chronology effect summary is incorrect`);
        assert(empty.summaryInsideToggle,`${label}: effect count is outside the filter disclosure row`);
        assert(empty.summaryLeft-empty.titleRight>=6,`${label}: chronology title and effect count collide (${empty.summaryLeft-empty.titleRight}px)`);
        assert(empty.toggleLabel.includes('Эффекты: 0'),`${label}: filter disclosure accessible label lacks the effect count`);
        assert(empty.documentOverflow<=1,`${label}: effect summary introduced horizontal document scrolling`);

        const dynamic=await inspectDynamicCounts(page);
        assert.deepEqual(dynamic.added,{count:'2',empty:false,chips:1,railHasEffects:true},`${label}: grouped effects did not produce the factual count`);
        assert.deepEqual(dynamic.disabled,{count:'1',empty:false,chips:2,railHasEffects:true},`${label}: exhausted effect was counted as active`);
        assert.deepEqual(dynamic.removed,{count:'0',empty:true,chips:0,railHasEffects:false},`${label}: removed effects did not restore the empty state`);

        await page.locator('#historyFiltersToggle').click();
        await page.waitForTimeout(200);
        assert.equal(await page.locator('#historyFiltersToggle').getAttribute('aria-expanded'),'true',`${label}: chronology filters did not expand`);
        assert.equal((await page.locator('#historyEffectsSummary').textContent()).replace(/\s+/g,' ').trim(),'Эффекты: 0',`${label}: effect count disappeared from the expanded filter row`);

        const toastMetrics=await inspectToast(page);
        const {before,after}=toastMetrics;
        assert(before.outsideScroller,`${label}: toast scrolls with chronology rows`);
        assert(before.shown&&before.position==='absolute',`${label}: toast is not shown in the chronology overlay plane`);
        assert(before.toast.top>=before.header.bottom&&before.toast.top<=before.scroller.top+12,`${label}: toast is not attached to the top of the chronology rows (${JSON.stringify({toast:before.toast,chronology:before.chronology,header:before.header,scroller:before.scroller,transform:before.transform,shown:before.shown})})`);
        assert(before.toast.bottom<before.cast.top,`${label}: toast still overlaps the cast action`);
        assert(Math.abs(after-before.toast.top)<=.5,`${label}: toast moved while chronology rows scrolled`);
        assert(before.transitionDuration.split(',').some(value=>Number.parseFloat(value)>0),`${label}: toast no longer fades smoothly`);
        assert(before.background.startsWith('rgba('),`${label}: toast lost its translucent white backing`);
        assert.equal(errors.length,0,`${label}: page errors: ${errors.join(' | ')}`);

        if(!process.env.DROPFISH_TEST_URL){
          await page.screenshot({
            path:path.join(output,`${engineName}-${viewportName}.png`),
            fullPage:true,
            animations:'allow'
          });
        }
        await page.close();
        renders++;
      }
    }finally{
      await browser.close();
    }
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,renders,viewports},null,2));
  process.stdout.write(`PASS: Snapshot 86 effects and chronology toast (${renders} Chromium/WebKit renders)\n`);
})().catch(error=>{
  process.stderr.write(`FAIL: ${error.stack||error}\n`);
  process.exitCode=1;
});
