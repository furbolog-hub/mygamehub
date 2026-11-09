const assert=require('assert/strict');
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const pagePath=path.join(root,'dropfish/index.html');
const pageUrl=pathToFileURL(pagePath).href;
const output=path.join(root,'test-results/dropfish-new-events-stage-11');
const html=fs.readFileSync(pagePath,'utf8');
const css=fs.readFileSync(path.join(root,'dropfish/mobile-ui.css'),'utf8');
const source=fs.readFileSync(path.join(root,'dropfish/script.js'),'utf8');

const viewports={
  phonePortrait:{width:390,height:844},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:768,height:1024},
  desktop:{width:1366,height:768}
};

function verifyStaticContract(){
  assert(/id="historyNewEntries"/.test(html),'new-entry control is missing from chronology');
  assert(source.includes('syncNewHistoryRowToBottom'),'chronology has no follow-latest synchronizer');
  const cssVersion=html.match(/mobile-ui\.css\?v=(\d+)/);
  assert(cssVersion&&Number(cssVersion[1])>=10,'stage 11 CSS cache version was not raised');
  const scriptVersion=html.match(/script\.js\?v=(\d+)\.[^"']+/);
  assert(scriptVersion&&Number(scriptVersion[1])>=30,'history auto-scroll script cache version was not raised');
}

async function prepare(page){
  await page.addInitScript(()=>{
    localStorage.removeItem('proFishingTestSessionV1');
    localStorage.setItem('proFishingReduceMotion','1');
  });
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pageUrl,{waitUntil:'load'});
  await page.evaluate(()=>{
    state=initialState();
    state.history=Array.from({length:48},(_,index)=>({
      id:uid(),
      text:`Stage 11 fixture ${index+1}`,
      type:'event',
      detail:'',
      numbered:false,
      createdAt:Date.now()+index
    }));
    state.historyUi={expandedId:null,filter:'all',introducedKeys:[],initialized:true,compactVersion:4};
    render();
    const scroller=document.getElementById('historyScroll');
    scroller.style.setProperty('scroll-behavior','auto','important');
    scroller.scrollTop=scroller.scrollHeight;
    scroller.dispatchEvent(new Event('scroll'));
  });
  await page.waitForTimeout(100);
  return errors;
}

async function runScenario(page,label){
  const seeded=await page.evaluate(()=>{
    const scroller=document.getElementById('historyScroll');
    const button=document.getElementById('historyNewEntries');
    return {
      scrollable:scroller.scrollHeight>scroller.clientHeight,
      bottomDelta:scroller.scrollHeight-scroller.clientHeight-scroller.scrollTop,
      hidden:button.hidden,
      outsideScroller:!scroller.contains(button),
      historyIds:state.history.map(row=>row.id)
    };
  });
  assert(seeded.scrollable,`${label}: chronology fixture is not scrollable`);
  assert(seeded.bottomDelta<=2,`${label}: fixture did not start at the bottom`);
  assert(seeded.hidden,`${label}: new-entry control is visible before new entries`);
  assert(seeded.outsideScroller,`${label}: new-entry control scrolls away with the chronology`);

  await page.evaluate(()=>addHistory('Followed event','event'));
  await page.waitForTimeout(950);
  let metrics=await page.evaluate(()=>{
    const scroller=document.getElementById('historyScroll');
    const button=document.getElementById('historyNewEntries');
    return {
      bottomDelta:scroller.scrollHeight-scroller.clientHeight-scroller.scrollTop,
      hidden:button.hidden,
      count:document.getElementById('historyNewEntriesCount').textContent
    };
  });
  assert(metrics.bottomDelta<=2,`${label}: a user at the bottom did not follow the new entry`);
  assert(metrics.hidden&&metrics.count==='0',`${label}: followed entry was marked unread`);

  await page.evaluate(()=>{
    const scroller=document.getElementById('historyScroll');
    scroller.scrollTop=0;
    scroller.dispatchEvent(new Event('scroll'));
    addHistory('Unread event one','event');
    addHistory('Unread event two','event');
  });
  await page.waitForTimeout(1050);
  metrics=await page.evaluate(()=>{
    const scroller=document.getElementById('historyScroll');
    const button=document.getElementById('historyNewEntries');
    const buttonBox=button.getBoundingClientRect();
    const chronologyBox=document.getElementById('mobileFishingChronology').getBoundingClientRect();
    return {
      scrollTop:scroller.scrollTop,
      hidden:button.hidden,
      text:button.textContent.replace(/\s+/g,' ').trim(),
      aria:button.getAttribute('aria-label'),
      buttonHeight:buttonBox.height,
      buttonWidth:buttonBox.width,
      insideChronology:buttonBox.top>=chronologyBox.top-1&&buttonBox.bottom<=chronologyBox.bottom+1,
      historyLength:state.history.length,
      prefixIds:state.history.slice(0,48).map(row=>row.id),
      persistedUnread:Object.prototype.hasOwnProperty.call(state.historyUi,'unreadCount'),
      documentOverflow:Math.max(document.documentElement.scrollHeight-document.documentElement.clientHeight,document.body.scrollHeight-document.body.clientHeight)
    };
  });
  assert(metrics.scrollTop<=1,`${label}: delayed auto-scroll pulled the user away from older entries`);
  assert(!metrics.hidden&&metrics.text==='↓ 2 новых',`${label}: unseen-entry counter did not accumulate`);
  assert(metrics.aria==='Показать 2 новых события',`${label}: unseen-entry control has an incorrect accessible label`);
  assert(metrics.buttonHeight>=28&&metrics.buttonHeight<=38&&metrics.buttonWidth<=150,`${label}: unseen-entry control is not compact`);
  assert(metrics.insideChronology,`${label}: unseen-entry control escaped the chronology`);
  assert(metrics.historyLength===51,`${label}: new-entry UI changed the number of history records`);
  assert.deepEqual(metrics.prefixIds,seeded.historyIds,`${label}: existing history records were mutated or reordered`);
  assert(!metrics.persistedUnread,`${label}: ephemeral unread count leaked into saved history UI state`);
  assert(metrics.documentOverflow<=1,`${label}: unseen-entry control introduced document scroll`);

  await page.screenshot({path:path.join(output,`${label}-unread.png`),fullPage:true});
  await page.locator('#historyNewEntries').click();
  await page.waitForTimeout(950);
  metrics=await page.evaluate(()=>{
    const scroller=document.getElementById('historyScroll');
    const button=document.getElementById('historyNewEntries');
    return {
      bottomDelta:scroller.scrollHeight-scroller.clientHeight-scroller.scrollTop,
      hidden:button.hidden,
      count:document.getElementById('historyNewEntriesCount').textContent
    };
  });
  assert(metrics.bottomDelta<=2,`${label}: new-entry control did not return to the latest events`);
  assert(metrics.hidden&&metrics.count==='0',`${label}: new-entry control did not clear after activation`);

  await page.evaluate(()=>{
    const scroller=document.getElementById('historyScroll');
    scroller.scrollTop=0;
    scroller.dispatchEvent(new Event('scroll'));
    addHistory('Manual clear event','event');
  });
  await page.waitForTimeout(80);
  await page.evaluate(()=>{
    const scroller=document.getElementById('historyScroll');
    scroller.scrollTop=scroller.scrollHeight;
    scroller.dispatchEvent(new Event('scroll'));
  });
  await page.waitForTimeout(120);
  metrics=await page.evaluate(()=>({
    hidden:document.getElementById('historyNewEntries').hidden,
    count:document.getElementById('historyNewEntriesCount').textContent
  }));
  assert(metrics.hidden&&metrics.count==='0',`${label}: manually reaching the bottom did not mark entries as seen`);
}

async function runAutoFollowScenario(page,label){
  const seeded=await page.evaluate(()=>{
    const scroller=document.getElementById('historyScroll');
    const button=document.getElementById('historyNewEntries');
    return {
      scrollable:scroller.scrollHeight>scroller.clientHeight,
      bottomDelta:scroller.scrollHeight-scroller.clientHeight-scroller.scrollTop,
      hidden:button.hidden,
      historyIds:state.history.map(row=>row.id)
    };
  });
  assert(seeded.scrollable,`${label}: chronology fixture is not scrollable`);
  assert(seeded.bottomDelta<=2,`${label}: fixture did not start at the bottom`);
  assert(seeded.hidden,`${label}: obsolete counter is visible before new entries`);

  await page.evaluate(()=>{
    const scroller=document.getElementById('historyScroll');
    scroller.scrollTop=0;
    scroller.dispatchEvent(new Event('scroll'));
    addHistory('Auto-follow event one','event');
    addHistory('Auto-follow event two','event');
  });
  await page.waitForTimeout(1050);
  let metrics=await page.evaluate(()=>{
    const scroller=document.getElementById('historyScroll');
    const latest=document.querySelector('#historyList > li:last-child');
    const latestBox=latest.getBoundingClientRect();
    const scrollerBox=scroller.getBoundingClientRect();
    return {
      bottomDelta:scroller.scrollHeight-scroller.clientHeight-scroller.scrollTop,
      latestVisible:latestBox.bottom<=scrollerBox.bottom+1&&latestBox.top>=scrollerBox.top-1,
      hidden:document.getElementById('historyNewEntries').hidden,
      count:document.getElementById('historyNewEntriesCount').textContent,
      historyLength:state.history.length,
      prefixIds:state.history.slice(0,48).map(row=>row.id),
      documentOverflow:Math.max(document.documentElement.scrollHeight-document.documentElement.clientHeight,document.body.scrollHeight-document.body.clientHeight)
    };
  });
  assert(metrics.bottomDelta<=2,`${label}: chronology did not automatically follow new rows from an older position ${JSON.stringify(metrics)}`);
  assert(metrics.latestVisible,`${label}: latest chronology row is outside the visible scroll area`);
  assert(metrics.hidden&&metrics.count==='0',`${label}: obsolete new-entry counter appeared instead of auto-scroll`);
  assert(metrics.historyLength===50,`${label}: auto-scroll changed the number of history records`);
  assert.deepEqual(metrics.prefixIds,seeded.historyIds,`${label}: existing history records were mutated or reordered`);
  assert(metrics.documentOverflow<=1,`${label}: auto-scroll introduced document scrolling`);

  await page.screenshot({path:path.join(output,`${label}-autofollow.png`),fullPage:true});
  await page.evaluate(()=>{
    const scroller=document.getElementById('historyScroll');
    scroller.scrollTop=0;
    scroller.dispatchEvent(new Event('scroll'));
    addHistory('Repeated auto-follow event','event');
  });
  await page.waitForTimeout(950);
  metrics=await page.evaluate(()=>{
    const scroller=document.getElementById('historyScroll');
    return {
      bottomDelta:scroller.scrollHeight-scroller.clientHeight-scroller.scrollTop,
      hidden:document.getElementById('historyNewEntries').hidden,
      count:document.getElementById('historyNewEntriesCount').textContent
    };
  });
  assert(metrics.bottomDelta<=2,`${label}: repeated chronology append did not auto-scroll`);
  assert(metrics.hidden&&metrics.count==='0',`${label}: obsolete counter appeared after repeated append`);
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
        const errors=await prepare(page);
        await runAutoFollowScenario(page,`${engineName}-${viewportName}`);
        assert.equal(errors.length,0,`${engineName}/${viewportName}: page errors: ${errors.join('; ')}`);
        renders++;
        await page.close();
      }
    }finally{
      await browser.close();
    }
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,renders,viewports},null,2));
  process.stdout.write(`DropFish stage 11 new-event checks passed (${renders} Chromium/WebKit renders).\n`);
})().catch(error=>{
  process.stderr.write(`${error.stack||error}\n`);
  process.exitCode=1;
});
