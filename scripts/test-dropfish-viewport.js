const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const pagePath=path.join(root,'dropfish/index.html');
const pageUrl=pathToFileURL(pagePath).href;
const output=path.join(root,'test-results/dropfish-viewport-stage-10');
const html=fs.readFileSync(pagePath,'utf8');
const css=fs.readFileSync(path.join(root,'dropfish/mobile-ui.css'),'utf8');
const viewportSource=fs.readFileSync(path.join(root,'dropfish/viewport-fit.js'),'utf8');

function verifyStaticContract(){
  assert(/viewport-fit\.js\?v=2\.1-webkit-resize/.test(html),'viewport-fit cache version was not raised');
  const cssVersion=html.match(/mobile-ui\.css\?v=(\d+)/);
  assert(cssVersion&&Number(cssVersion[1])>=9,'viewport CSS cache version was not raised');
  assert(viewportSource.includes('viewportStableHeight'),'Telegram stable viewport is not supported');
  assert(viewportSource.includes('window.visualViewport'),'visualViewport is not supported');
  for(const event of ['viewportChanged','safeAreaChanged','contentSafeAreaChanged']){
    assert(viewportSource.includes(`'${event}'`),`${event} is not observed`);
  }
  assert(css.includes('--mobile-viewport-height'),'the measured viewport is not shared by the shell, dock and dialogs');
}

async function seedLongContent(page){
  await page.evaluate(()=>{
    state=initialState();
    state.history=[];
    state.historyUi={expandedId:null,filter:'all',introducedKeys:[],initialized:true,compactVersion:4};
    render();
    for(let index=0;index<36;index++)addHistory(`Viewport fixture ${index+1}`,'event');
  });
  await page.waitForTimeout(60);
}

async function coreMetrics(page){
  return page.evaluate(()=>{
    const box=node=>{const r=node.getBoundingClientRect();return {top:r.top,right:r.right,bottom:r.bottom,left:r.left,width:r.width,height:r.height};};
    const rootStyle=getComputedStyle(document.documentElement);
    const bodyStyle=getComputedStyle(document.body);
    const shell=document.querySelector('[data-mobile-game-shell]');
    const dock=document.getElementById('bottomNavigation');
    const chronology=document.getElementById('mobileFishingChronology');
    const history=document.getElementById('historyScroll');
    return {
      fitHeight:parseFloat(rootStyle.getPropertyValue('--fit-height')),
      viewportSource:document.documentElement.dataset.viewportHeightSource||'',
      html:box(document.documentElement),body:box(document.body),shell:box(shell),dock:box(dock),chronology:box(chronology),history:box(history),
      htmlOverflowY:getComputedStyle(document.documentElement).overflowY,
      bodyOverflowY:bodyStyle.overflowY,
      shellOverflowY:getComputedStyle(shell).overflowY,
      historyOverflowY:getComputedStyle(history).overflowY,
      historyScrollable:history.scrollHeight>history.clientHeight,
      documentOverflow:Math.max(document.documentElement.scrollHeight-document.documentElement.clientHeight,document.body.scrollHeight-document.body.clientHeight),
      bodyScrollTop:document.body.scrollTop,
      htmlScrollTop:document.documentElement.scrollTop,
      telegram:document.body.classList.contains('is-telegram'),
      fullscreen:document.body.classList.contains('tg-fullscreen'),
      insets:Object.fromEntries(['top','right','bottom','left'].map(side=>[side,parseFloat(rootStyle.getPropertyValue(`--tg-inset-${side}`))||0]))
    };
  });
}

function verifyCore(metrics,expectedHeight,label){
  const tolerance=2;
  assert(Math.abs(metrics.fitHeight-expectedHeight)<=tolerance,`${label}: --fit-height ${metrics.fitHeight} != ${expectedHeight}`);
  for(const key of ['html','body','shell']){
    assert(Math.abs(metrics[key].height-expectedHeight)<=tolerance,`${label}: ${key} height escaped measured viewport ${JSON.stringify(metrics[key])}`);
  }
  assert(metrics.dock.top>=metrics.chronology.bottom-tolerance&&metrics.dock.bottom<=metrics.shell.bottom+tolerance,`${label}: action row is not contained below chronology in the unified shell ${JSON.stringify(metrics.dock)}`);
  assert(metrics.documentOverflow<=1&&metrics.bodyScrollTop===0&&metrics.htmlScrollTop===0,`${label}: document became scrollable`);
  assert(metrics.htmlOverflowY==='hidden'&&metrics.bodyOverflowY==='hidden'&&metrics.shellOverflowY==='hidden',`${label}: outer overflow contract changed`);
  assert(['auto','scroll'].includes(metrics.historyOverflowY)&&metrics.historyScrollable,`${label}: chronology does not own its scrolling`);
}

async function verifyBrowserViewport(browserType,engineName){
  const browser=await browserType.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(pageUrl,{waitUntil:'load'});
    await seedLongContent(page);
    for(const viewport of [{width:390,height:844},{width:390,height:680},{width:844,height:390},{width:768,height:920}]){
      await page.setViewportSize(viewport);
      await page.waitForTimeout(120);
      const metrics=await coreMetrics(page);
      verifyCore(metrics,Math.round(await page.evaluate(()=>visualViewport?.height||innerHeight)),`${engineName}/browser-${viewport.width}x${viewport.height}`);
      assert(!metrics.telegram,`${engineName}: browser was classified as Telegram`);
    }
    assert.deepStrictEqual(errors,[],`${engineName}/browser page errors: ${errors.join(' | ')}`);
    await page.screenshot({path:path.join(output,`${engineName}-browser-dynamic.png`),animations:'disabled'});
  }finally{
    await browser.close();
  }
}

async function installTelegramStub(page){
  await page.addInitScript(()=>{
    const listeners={};
    const webApp={
      initData:'viewport-stage-10',platform:'ios',isFullscreen:false,
      viewportStableHeight:760,viewportHeight:730,
      safeAreaInset:{top:32,right:8,bottom:20,left:8},
      contentSafeAreaInset:{top:38,right:10,bottom:24,left:10},
      ready(){},expand(){},disableVerticalSwipes(){},postEvent(){},
      isVersionAtLeast(){return true;},
      requestFullscreen(){this.isFullscreen=true;},
      onEvent(name,handler){(listeners[name]||(listeners[name]=[])).push(handler);},
      __emit(name){for(const handler of listeners[name]||[])handler();}
    };
    window.Telegram={WebApp:webApp};
  });
}

async function verifySectionScroll(page,label){
  if(!await page.locator('[data-mobile-nav="journal"]').isVisible()){
    await page.evaluate(()=>window.setDropfishMobileSection?.('menu'));
  }
  for(const section of ['journal','collection','menu']){
    await page.locator(`[data-mobile-nav="${section}"]`).click();
    const metrics=await page.evaluate(name=>{
      const view=document.querySelector(`[data-mobile-section-view="${name}"]`);
      const scroll=view.querySelector('.mobile-section-scroll');
      const filler=document.createElement('div');
      filler.style.height='1800px';
      filler.dataset.viewportFiller='';
      scroll.append(filler);
      scroll.scrollTop=scroll.scrollHeight;
      return {
        overflow:getComputedStyle(scroll).overflowY,
        scrollable:scroll.scrollHeight>scroll.clientHeight,
        scrolled:scroll.scrollTop>0,
        documentOverflow:Math.max(document.documentElement.scrollHeight-document.documentElement.clientHeight,document.body.scrollHeight-document.body.clientHeight)
      };
    },section);
    assert(['auto','scroll'].includes(metrics.overflow)&&metrics.scrollable&&metrics.scrolled,`${label}/${section}: section does not own scrolling`);
    assert(metrics.documentOverflow<=1,`${label}/${section}: section content scrolls the document`);
  }
  await page.locator('[data-mobile-nav="fishing"]').click();
}

async function verifyScrollableDialogs(page,label,fitHeight){
  for(const [dialogId,cardSelector] of [
    ['guideDialog','.modal-card'],['tradeDialog','.trade-card'],['assemblyDialog','.assembly-card'],
    ['riftDialog','.rift-card'],['islandDialog','.island-card']
  ]){
    const metrics=await page.evaluate(({dialogId,cardSelector})=>{
      const dialog=document.getElementById(dialogId);
      const card=dialog.querySelector(cardSelector);
      const filler=document.createElement('div');
      filler.style.cssText='height:1600px;min-height:1600px;flex:0 0 1600px';
      filler.dataset.viewportDialogFiller='';
      card.append(filler);
      dialog.showModal();
      card.scrollTop=card.scrollHeight;
      const box=node=>{const r=node.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height};};
      const result={
        dialog:box(dialog),card:box(card),
        overflow:getComputedStyle(card).overflowY,
        scrollable:card.scrollHeight>card.clientHeight,
        scrolled:card.scrollTop>0,
        documentOverflow:Math.max(document.documentElement.scrollHeight-document.documentElement.clientHeight,document.body.scrollHeight-document.body.clientHeight)
      };
      dialog.close();
      filler.remove();
      return result;
    },{dialogId,cardSelector});
    assert(Math.abs(metrics.dialog.height-fitHeight)<=2&&metrics.dialog.top>=-1&&metrics.dialog.bottom<=fitHeight+1,`${label}/${dialogId}: dialog escaped measured viewport ${JSON.stringify(metrics.dialog)}`);
    assert(metrics.card.top>=-1&&metrics.card.bottom<=fitHeight+1,`${label}/${dialogId}: event card escaped measured viewport ${JSON.stringify(metrics.card)}`);
    assert(['auto','scroll'].includes(metrics.overflow)&&metrics.scrollable&&metrics.scrolled,`${label}/${dialogId}: overflowing event content has no owned scroll`);
    assert(metrics.documentOverflow<=1,`${label}/${dialogId}: dialog content scrolls the document`);
  }
}

async function verifyFixedScenes(page,label,fitHeight){
  for(const [dialogId,fitName] of [['dungeonDialog','fitDungeonStage'],['deadWatersDialog','fitDeadWatersStage']]){
    const metrics=await page.evaluate(({dialogId,fitName})=>{
      const dialog=document.getElementById(dialogId);
      dialog.showModal();
      window[fitName]?.();
      const card=dialog.firstElementChild;
      const box=node=>{const r=node.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height};};
      const result={dialog:box(dialog),card:box(card),overflow:getComputedStyle(dialog).overflowY,documentOverflow:document.documentElement.scrollHeight-document.documentElement.clientHeight};
      dialog.close();
      return result;
    },{dialogId,fitName});
    assert(Math.abs(metrics.dialog.height-fitHeight)<=2&&metrics.dialog.bottom<=fitHeight+1,`${label}/${dialogId}: fixed scene dialog escaped viewport`);
    assert(metrics.card.top>=-1&&metrics.card.bottom<=fitHeight+1,`${label}/${dialogId}: uniformly scaled fixed scene was cropped`);
    assert(metrics.overflow==='hidden'&&metrics.documentOverflow<=1,`${label}/${dialogId}: fixed scene introduced outer scroll`);
  }
}

async function verifyTelegramViewport(browserType,engineName){
  const browser=await browserType.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await installTelegramStub(page);
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(pageUrl,{waitUntil:'load'});
    await seedLongContent(page);
    await page.waitForTimeout(120);
    let metrics=await coreMetrics(page);
    verifyCore(metrics,760,`${engineName}/telegram-stable`);
    assert(metrics.telegram&&metrics.fullscreen,`${engineName}: Telegram/fullscreen classes were not applied`);
    assert.deepStrictEqual(metrics.insets,{top:38,right:10,bottom:24,left:10},`${engineName}: Telegram safe areas do not use the maximum API inset`);

    await page.evaluate(()=>{
      Telegram.WebApp.viewportStableHeight=640;
      Telegram.WebApp.viewportHeight=610;
      Telegram.WebApp.safeAreaInset={top:18,right:4,bottom:16,left:4};
      Telegram.WebApp.contentSafeAreaInset={top:24,right:6,bottom:20,left:6};
      Telegram.WebApp.__emit('viewportChanged');
      Telegram.WebApp.__emit('safeAreaChanged');
      Telegram.WebApp.__emit('contentSafeAreaChanged');
    });
    await page.waitForTimeout(120);
    metrics=await coreMetrics(page);
    verifyCore(metrics,640,`${engineName}/telegram-resized`);
    assert.deepStrictEqual(metrics.insets,{top:24,right:6,bottom:20,left:6},`${engineName}: dynamic Telegram safe areas did not update`);

    await verifySectionScroll(page,`${engineName}/telegram-resized`);
    await verifyScrollableDialogs(page,`${engineName}/telegram-resized`,640);
    await verifyFixedScenes(page,`${engineName}/telegram-resized`,640);
    assert.deepStrictEqual(errors,[],`${engineName}/telegram page errors: ${errors.join(' | ')}`);
    await page.screenshot({path:path.join(output,`${engineName}-telegram-resized.png`),animations:'disabled'});
  }finally{
    await browser.close();
  }
}

(async()=>{
  verifyStaticContract();
  fs.mkdirSync(output,{recursive:true});
  for(const [engineName,browserType] of Object.entries({chromium,webkit})){
    await verifyBrowserViewport(browserType,engineName);
    await verifyTelegramViewport(browserType,engineName);
  }
  console.log('DropFish stage 10 viewport checks passed (Chromium/WebKit browser resize, Telegram stable viewport, owned scroll regions and event screens).');
})().catch(error=>{
  console.error(error);
  process.exitCode=1;
});
