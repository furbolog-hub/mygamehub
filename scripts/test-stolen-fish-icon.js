const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const pageUrl=pathToFileURL(path.join(root,'dropfish','index.html')).href;
const assetPath=path.join(root,'dropfish','assets','icons','fish-status','stolen.webp');
const output=path.join(root,'.visual-test-output','stolen-fish-icon');
const viewports={
  desktop:{width:1366,height:768},
  phoneSmall:{width:320,height:700},
  phonePortrait:{width:390,height:844},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:768,height:1024},
  tabletLandscape:{width:1024,height:768}
};
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

async function renderStolenFish(page){
  return page.evaluate(async()=>{
    state=initialState();
    state.weather='calm';
    state.weatherSeen=['calm'];
    state.sessionDate='2099-01-01';
    state.castClicks=1;
    const fish=makeFish('heavy','Заброс',true,{initialWeight:12.4,fishName:'красный луциан'});
    fish.removed=true;
    state.stolen.push(fish);
    setFishHistoryStolen(fish,true);
    render();
    const historyRow=state.history.find(row=>row.type==='fish'&&row.fishId===fish.id);
    const row=document.querySelector(`[data-history-id="${historyRow.id}"]`);
    const icon=row?.querySelector('.fish-stolen-main-icon .fish-status-icon');
    if(icon&&!icon.complete)await new Promise(resolve=>icon.addEventListener('load',resolve,{once:true}));
    const rect=icon?.getBoundingClientRect();
    const title=row?.querySelector('.chronology-row__title-text');
    const result=row?.querySelector('.chronology-row__result');
    return {
      historyId:historyRow.id,
      rowClass:row?.className||'',
      src:icon?.getAttribute('src')||'',
      complete:Boolean(icon?.complete),
      naturalWidth:icon?.naturalWidth||0,
      naturalHeight:icon?.naturalHeight||0,
      displayWidth:rect?.width||0,
      displayHeight:rect?.height||0,
      title:row?.querySelector('.fish-stolen-main-icon')?.getAttribute('title')||'',
      alt:icon?.getAttribute('alt'),
      ariaHidden:icon?.getAttribute('aria-hidden'),
      objectFit:icon?getComputedStyle(icon).objectFit:'',
      originIcon:row?.querySelector('.chronology-row__badge img')?.getAttribute('src')||'',
      categoryIcons:row?.querySelectorAll('.fish-category-icons,.fish-category-icon').length||0,
      expandable:row?.classList.contains('is-expandable')||false,
      chevron:Boolean(row?.querySelector('.chronology-row__chevron')),
      ariaExpanded:row?.querySelector('[data-history-toggle]')?.getAttribute('aria-expanded')||'',
      titleColor:title?getComputedStyle(title).color:'',
      resultColor:result?getComputedStyle(result).color:'',
      resultText:result?.textContent.trim()||''
    };
  });
}

(async()=>{
  assert(fs.existsSync(assetPath),'stolen fish icon is missing from permanent DropFish assets');
  const assetHash=crypto.createHash('sha256').update(fs.readFileSync(assetPath)).digest('hex').toUpperCase();
  assert(assetHash==='532963AA697A660DAB6C9BBC427C08954969D7F24BA5F7E0BD43C1F6B0D112D1','stolen fish icon is not the supplied artwork');
  fs.mkdirSync(output,{recursive:true});
  let renders=0;
  for(const [engineName,browserType] of Object.entries({chromium,webkit})){
    const browser=await browserType.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        const errors=[];
        page.on('pageerror',error=>errors.push(String(error)));
        await page.goto(pageUrl,{waitUntil:'load'});
        const result=await renderStolenFish(page);
        assert(errors.length===0,`${engineName}/${viewportName}: page errors ${errors.join(' | ')}`);
        assert(result.complete&&result.naturalWidth===256&&result.naturalHeight===256,`${engineName}/${viewportName}: stolen icon did not load as the expected 256x256 asset`);
        assert(result.src.endsWith('./assets/icons/fish-status/stolen.webp'),`${engineName}/${viewportName}: wrong stolen icon source ${result.src}`);
        assert(result.displayWidth>0&&result.displayHeight>0&&Math.abs(result.displayWidth-result.displayHeight)<1,`${engineName}/${viewportName}: stolen icon layout is not a stable square ${result.displayWidth}x${result.displayHeight}`);
        assert(result.objectFit==='contain',`${engineName}/${viewportName}: stolen icon must preserve its aspect ratio`);
        assert(result.title==='Рыба украдена Чайкой'&&result.alt===''&&result.ariaHidden==='true',`${engineName}/${viewportName}: stolen icon accessibility contract changed`);
        assert(result.originIcon.endsWith('/origin-cast.webp'),`${engineName}/${viewportName}: independent catch-origin icon disappeared ${JSON.stringify(result)}`);
        assert(result.categoryIcons===0,`${engineName}/${viewportName}: terminal stolen state repeats the former size/category icon`);
        assert(result.expandable&&result.chevron&&result.ariaExpanded==='false',`${engineName}/${viewportName}: stolen fish row has no closed disclosure control`);
        assert(result.titleColor==='rgb(255, 111, 125)'&&result.resultColor===result.titleColor,`${engineName}/${viewportName}: stolen fish title and weight do not share the red terminal color ${JSON.stringify(result)}`);
        assert(result.resultText==='12,4 кг',`${engineName}/${viewportName}: stolen fish closed-row weight changed: ${result.resultText}`);
        const row=page.locator(`[data-history-id="${result.historyId}"]`);
        await row.screenshot({path:path.join(output,`${engineName}-${viewportName}-closed.png`),animations:'disabled'});
        await row.locator('[data-history-toggle]').click();
        const disclosure=await row.evaluate(element=>{
          const toggle=element.querySelector('[data-history-toggle]'),panel=element.querySelector('.chronology-disclosure'),details=element.querySelector('.stolen-fish-detail'),detailHost=element.querySelector('.history-row-details');
          const hostStyle=detailHost?getComputedStyle(detailHost):null;
          return {expanded:element.classList.contains('is-expanded'),ariaExpanded:toggle?.getAttribute('aria-expanded')||'',ariaHidden:panel?.getAttribute('aria-hidden')||'',inert:Boolean(panel?.inert),text:details?.textContent.trim()||'',detailsCount:element.querySelectorAll('.stolen-fish-detail').length,borderWidth:hostStyle?.borderTopWidth||'',background:hostStyle?.backgroundColor||''};
        });
        assert(disclosure.expanded&&disclosure.ariaExpanded==='true'&&disclosure.ariaHidden==='false'&&!disclosure.inert,`${engineName}/${viewportName}: stolen fish disclosure did not open ${JSON.stringify(disclosure)}`);
        assert(disclosure.detailsCount===1&&disclosure.text==='Украдена наглой чайкой',`${engineName}/${viewportName}: stolen fish disclosure copy is incorrect ${JSON.stringify(disclosure)}`);
        assert(disclosure.borderWidth==='0px'&&disclosure.background==='rgba(0, 0, 0, 0)',`${engineName}/${viewportName}: stolen fish disclosure violates the shared flat detail styling ${JSON.stringify(disclosure)}`);
        await row.screenshot({path:path.join(output,`${engineName}-${viewportName}-expanded.png`),animations:'disabled'});
        renders++;
        await page.close();
      }
    }finally{
      await browser.close();
    }
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,renders,viewports},null,2));
  process.stdout.write(`PASS: ${renders} stolen-fish icon renders across Chromium and WebKit\n`);
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
