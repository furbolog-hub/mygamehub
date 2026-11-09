const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const pageUrl=pathToFileURL(path.join(root,'dropfish/index.html')).href;
const output=path.join(root,'test-results/dropfish-responsive-stage-9');
const css=fs.readFileSync(path.join(root,'dropfish/mobile-ui.css'),'utf8');
const html=fs.readFileSync(path.join(root,'dropfish/index.html'),'utf8');

const viewports={
  phoneSmallPortrait:{width:320,height:568},
  iphonePortrait:{width:390,height:844,safe:{top:47,right:0,bottom:34,left:0}},
  androidPortrait:{width:412,height:915},
  telegramPortrait:{width:390,height:844,safe:{top:32,right:6,bottom:24,left:6}},
  iphoneLandscape:{width:844,height:390,safe:{top:0,right:47,bottom:21,left:47}},
  androidLandscape:{width:915,height:412},
  tabletPortrait:{width:768,height:1024},
  tabletLandscape:{width:1024,height:768},
  desktopPortrait:{width:900,height:1200},
  desktop:{width:1366,height:768},
  wideDesktop:{width:1920,height:1080}
};

function verifyStaticContract(){
  assert(!/@media\s*\(orientation:\s*landscape\)/.test(css),'a landscape-only application layout still exists');
  assert(!css.includes('grid-template-areas: "mobile-scene mobile-chronology"'),'Scene | Chronology split-view still exists');
  assert(css.includes('grid-template-areas: "portrait-header" "portrait-weather" "portrait-effects" "mobile-chronology" "mobile-action"'),'the single-shell vertical order is missing');
  assert(html.includes('class="mobile-game-shell__fishing"'),'the fishing group still acts as a scene column');
  assert(/id="lakeCard"[\s\S]*?class="scene-artwork"/.test(html),'the marine artwork is not owned by the Weather/HUD hero');
  for(const side of ['top','right','bottom','left']){
    assert(css.includes(`env(safe-area-inset-${side}`),`safe-area-inset-${side} is not represented in the shell`);
    assert(css.includes(`--tg-inset-${side}`),`Telegram ${side} inset is not represented in the shell`);
  }
  const cssVersion=html.match(/mobile-ui\.css\?v=(\d+)/);
  assert(cssVersion&&Number(cssVersion[1])>=13,'single-shell CSS cache version was not raised');
  const jsVersion=html.match(/mobile-ui\.js\?v=(\d+)/);
  assert(jsVersion&&Number(jsVersion[1])>=7,'header-actions shell adapter cache version was not raised');
}

async function prepare(page,viewport){
  await page.addInitScript(()=>{
    localStorage.removeItem('proFishingTestSessionV1');
    localStorage.setItem('proFishingReduceMotion','1');
  });
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pageUrl,{waitUntil:'load'});
  if(viewport.safe){
    await page.evaluate(safe=>{
      for(const side of ['top','right','bottom','left']){
        document.documentElement.style.setProperty(`--tg-inset-${side}`,`${safe[side]||0}px`);
      }
      document.body.classList.add('is-telegram','tg-fullscreen');
      window.dispatchEvent(new Event('resize'));
    },viewport.safe);
  }
  await page.evaluate(()=>{
    state=initialState();
    state.history=[];
    state.historyUi={expandedId:null,filter:'all',introducedKeys:[],initialized:true,compactVersion:4};
    render();
    for(let index=0;index<28;index++)addHistory(`Responsive fixture ${index+1}`,'event');
  });
  await page.waitForTimeout(950);
  return errors;
}

async function measure(page,viewport){
  return page.evaluate(({width,height,safe})=>{
    const box=node=>{
      const rect=node.getBoundingClientRect();
      return {top:rect.top,right:rect.right,bottom:rect.bottom,left:rect.left,width:rect.width,height:rect.height};
    };
    const shell=document.querySelector('[data-mobile-game-shell]');
    const scene=document.getElementById('mobileFishingScene');
    const chronology=document.getElementById('mobileFishingChronology');
    const artboard=document.querySelector('[data-scene-artboard]');
    const dock=document.getElementById('bottomNavigation');
    const cast=document.getElementById('castBtn');
    const header=document.querySelector('.topbar');
    const lake=document.getElementById('lakeCard');
    const inventory=document.querySelector('.active-effects-rail');
    const historyScroll=document.getElementById('historyScroll');
    const firstRow=document.querySelector('.chronology-row');
    const firstFilter=document.querySelector('.chronology-filter');
    const filterRail=document.querySelector('.chronology-filter-rail');
    const filterDisclosure=document.getElementById('historyFiltersPanel');
    const filterToggle=document.getElementById('historyFiltersToggle');
    const navItems=[...document.querySelectorAll('.mobile-nav-item')];
    const sceneBox=box(scene);
    const chronologyBox=box(chronology);
    const artboardBox=box(artboard);
    const shellBox=box(shell);
    const dockBox=box(dock);
    return {
      viewport:{width,height},safe:safe||{top:0,right:0,bottom:0,left:0},
      shell:shellBox,scene:sceneBox,chronology:chronologyBox,artboard:artboardBox,dock:dockBox,cast:box(cast),
      header:box(header),lake:box(lake),inventory:box(inventory),
      headerControls:[...header.querySelectorAll('#sceneMenuBtn,#dropfishDebugBtn,#soundToggleBtn,#motionBtn,#guideBtn')].map(box),
      firstRow:box(firstRow),firstFilter:box(firstFilter),filterRail:box(filterRail),navItems:navItems.map(box),
      filterDisclosure:box(filterDisclosure),filterDisclosureVisibility:getComputedStyle(filterDisclosure).visibility,
      filterExpanded:filterToggle.getAttribute('aria-expanded')==='true',filterToggle:box(filterToggle),filterToggleHit:getComputedStyle(filterToggle,'::before').content,
      filterSummary:document.getElementById('historyFilterSummary').hidden?'':document.getElementById('historyFilterSummary').textContent.trim(),
      historyScrollBox:box(historyScroll),
      sceneScale:Number(artboard.dataset.sceneScale),
      historyOverflow:getComputedStyle(historyScroll).overflowY,
      historyScrollable:historyScroll.scrollHeight>historyScroll.clientHeight,
      documentVertical:Math.max(document.documentElement.scrollHeight-document.documentElement.clientHeight,document.body.scrollHeight-document.body.clientHeight),
      documentHorizontal:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      sceneDisplay:getComputedStyle(scene).display,
      artboardDisplay:getComputedStyle(artboard).display,
      artworkInsideHero:lake.contains(document.querySelector('.scene-artwork'))
    };
  },viewport);
}

function verifyGeometry(result,label){
  const {viewport,safe,shell,chronology,dock,cast,header,lake,inventory,firstRow,firstFilter,filterRail}=result;
  const tolerance=1.5;
  assert(result.documentVertical<=1&&result.documentHorizontal<=1,`${label}: main document scrolls ${JSON.stringify({vertical:result.documentVertical,horizontal:result.documentHorizontal})}`);
  assert(shell.top>=-tolerance&&shell.bottom<=viewport.height+tolerance,`${label}: shell escapes the visible viewport`);
  assert(header.left>=safe.left-tolerance&&chronology.right<=viewport.width-safe.right+tolerance,`${label}: content enters a horizontal safe area`);
  assert(header.top>=safe.top-tolerance,`${label}: content enters the top safe area`);
  assert(result.headerControls.length===5&&result.headerControls.every(control=>control.left>=header.left-tolerance&&control.right<=header.right+tolerance&&control.top>=header.top-tolerance&&control.bottom<=header.bottom+tolerance&&control.width>=40&&control.height>=40),`${label}: restored header controls are clipped or too small ${JSON.stringify(result.headerControls)}`);
  assert(chronology.bottom<=dock.top+tolerance,`${label}: chronology reaches into the bottom action row`);
  assert(chronology.height>=72-tolerance,`${label}: chronology collapsed in the unified shell (${chronology.height}px)`);
  assert(['auto','scroll'].includes(result.historyOverflow)&&result.historyScrollable,`${label}: chronology is not the owned scroll region`);
  assert(result.sceneDisplay==='contents'&&result.artboardDisplay==='contents',`${label}: a separate scene viewport still exists`);
  assert(result.artworkInsideHero,`${label}: marine scene is not the Weather/HUD hero background`);
  assert(header.bottom<=lake.top+tolerance&&lake.bottom<=inventory.top+tolerance&&inventory.bottom<=chronology.top+tolerance,`${label}: single-shell vertical order changed`);
  assert(cast.top>=dock.top-tolerance&&cast.bottom<=dock.bottom+tolerance&&cast.width>220&&cast.height>=60&&cast.height<=64,`${label}: cast action is not contained below chronology`);
  assert(firstRow.height>=44&&firstRow.height<=50,`${label}: closed chronology row changed compact height (${firstRow.height})`);
  assert(firstFilter.height<=32&&filterRail.height>=44,`${label}: filter controls lost their compact visual or 44px touch lane`);
  assert(!result.filterExpanded&&result.filterDisclosure.height<=1&&result.filterDisclosureVisibility==='hidden',`${label}: filters are not initially collapsed`);
  assert(result.filterToggle.width>=44&&result.filterToggle.height>=28&&result.filterToggleHit!=='none',`${label}: filter disclosure control lost its expanded hit target`);
  assert(shell.width<=980+tolerance,`${label}: unified shell exceeds its responsive max-width`);
  assert(Math.abs(dock.left-header.left)<=tolerance&&Math.abs(dock.right-header.right)<=tolerance,`${label}: bottom action row escaped the unified shell content column`);
}

(async()=>{
  verifyStaticContract();
  fs.mkdirSync(output,{recursive:true});
  const results=[];
  for(const [engineName,browserType] of Object.entries({chromium,webkit})){
    const browser=await browserType.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height}});
        const errors=await prepare(page,viewport);
        const result=await measure(page,viewport);
        verifyGeometry(result,`${engineName}/${viewportName}`);
        assert.deepStrictEqual(errors,[],`${engineName}/${viewportName}: page errors: ${errors.join(' | ')}`);
        await page.locator('#historyFiltersToggle').click();
        await page.waitForTimeout(190);
        const expanded=await measure(page,viewport);
        assert(expanded.filterExpanded&&expanded.filterDisclosure.height>=44&&expanded.filterDisclosureVisibility==='visible',`${engineName}/${viewportName}: filter disclosure did not open ${JSON.stringify(expanded.filterDisclosure)}`);
        assert(Math.abs(expanded.chronology.height-result.chronology.height)<=1&&expanded.historyScrollBox.height<result.historyScrollBox.height-35&&expanded.documentVertical<=1&&expanded.documentHorizontal<=1,`${engineName}/${viewportName}: opening filters changed the shell instead of borrowing chronology space`);
        await page.locator('[data-history-filter="events"]').click();
        await page.waitForTimeout(40);
        const filtered=await measure(page,viewport);
        assert(filtered.filterExpanded&&filtered.filterSummary==='События',`${engineName}/${viewportName}: selecting a filter closed the panel or hid its active summary`);
        await page.locator('#historyFiltersToggle').click();
        await page.waitForTimeout(190);
        const collapsedAgain=await measure(page,viewport);
        assert(!collapsedAgain.filterExpanded&&collapsedAgain.filterDisclosure.height<=1&&collapsedAgain.filterSummary==='События',`${engineName}/${viewportName}: active filter is not visible after collapsing the panel`);
        await page.screenshot({path:path.join(output,`${engineName}-${viewportName}.png`),animations:'disabled'});
        results.push({engine:engineName,viewport:viewportName,...result});
        await page.close();
      }
    }finally{
      await browser.close();
    }
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,results},null,2));
  console.log(`DropFish single-shell responsive checks passed (${results.length} Chromium/WebKit renders).`);
})().catch(error=>{
  console.error(error);
  process.exitCode=1;
});
