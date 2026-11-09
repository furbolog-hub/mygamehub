const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const pageUrl=pathToFileURL(path.join(root,'dropfish/index.html')).href;
const output=path.join(root,'artifacts','session-result-disclosure');
const viewports={
  phonePortrait:{width:390,height:844},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:768,height:1024},
  tabletLandscape:{width:1024,height:768},
  desktop:{width:1280,height:900}
};

async function installFixture(page){
  await page.evaluate(()=>{
    state=initialState();
    state.historyUi={expandedIds:[],filter:'all',introducedKeys:[],initialized:true,compactVersion:4};
    const finishedAt='2026-10-30T07:27:31.000Z';
    state.history=[
      {id:'result-height-reference',type:'event',text:'Контрольная строка результата',detail:'',createdAt:Date.parse(finishedAt),numbered:false},
      {id:'session-complete-reference',type:'event',text:'Игровая сессия завершена',detail:'',createdAt:Date.parse(finishedAt),numbered:false}
    ];
    state.finalResult={
      total:133.9,
      earned:['Гроза глубин','Коллекционер артефактов','Точный расчёт'],
      finishedAt,
      diceImpact:null,
      singulaImpact:null
    };
    const card=document.getElementById('resultCard');
    delete card.dataset.summaryExpanded;
    delete card.dataset.achievementsExpanded;
    delete card.dataset.animated;
    renderHistory();
    renderResultCard();
  });
}

async function metrics(page){
  return page.evaluate(()=>{
    const card=document.getElementById('resultCard');
    const row=document.querySelector('[data-history-id="result-height-reference"]');
    const sessionMarker=document.querySelector('[data-history-id="session-complete-reference"]');
    const summary=card.querySelector('.result-summary-toggle');
    const date=card.querySelector('.result-date');
    const details=card.querySelector('.result-details');
    const achievements=card.querySelector('.result-achievements-toggle');
    const list=card.querySelector('.result-achievements');
    const cardBox=card.getBoundingClientRect();
    const summaryBox=summary.getBoundingClientRect();
    const dateBox=date.getBoundingClientRect();
    return {
      cardHeight:cardBox.height,
      rowHeight:row.getBoundingClientRect().height,
      sessionMarkerHeight:sessionMarker.getBoundingClientRect().height,
      sessionMarkerIsRow:sessionMarker.classList.contains('chronology-row'),
      sessionMarkerImages:sessionMarker.querySelectorAll('img').length,
      viewportWidth:document.documentElement.clientWidth,
      cardLeft:cardBox.left,
      cardRight:cardBox.right,
      cardScrollWidth:card.scrollWidth,
      cardClientWidth:card.clientWidth,
      summaryExpanded:summary.getAttribute('aria-expanded'),
      detailsHidden:details.getAttribute('aria-hidden'),
      detailsInert:details.inert,
      achievementsVisible:Boolean(achievements&&achievements.getClientRects().length&&getComputedStyle(achievements).visibility!=='hidden'&&details.clientHeight>0),
      achievementsExpanded:achievements?.getAttribute('aria-expanded')||'',
      achievementsText:achievements?.textContent.trim()||'',
      achievementCount:list?.children.length||0,
      listHidden:Boolean(list?.hidden),
      dateFontSize:Number.parseFloat(getComputedStyle(date).fontSize),
      dateFits:dateBox.left>=summaryBox.left-1&&dateBox.right<=summaryBox.right+1&&dateBox.top>=summaryBox.top-1&&dateBox.bottom<=summaryBox.bottom+1,
      hasChevron:Boolean(card.querySelector('.result-summary-chevron')),
      cardExpanded:card.classList.contains('is-expanded')
    };
  });
}

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const report={passed:true,viewports,engines:{}};
  for(const [engineName,browserType] of Object.entries({chromium,webkit})){
    const browser=await browserType.launch({headless:true});
    report.engines[engineName]={};
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        const errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        await page.goto(pageUrl,{waitUntil:'load'});
        await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
        await installFixture(page);

        const closed=await metrics(page);
        assert(Math.abs(closed.cardHeight-closed.rowHeight)<=.5,`${engineName}/${viewportName}: result row ${closed.cardHeight}px differs from chronology ${closed.rowHeight}px`);
        assert(Math.abs(closed.cardHeight-46)<=.5,`${engineName}/${viewportName}: closed result row is not 46px (${closed.cardHeight}px)`);
        assert(!closed.sessionMarkerIsRow&&closed.sessionMarkerImages===0&&closed.sessionMarkerHeight<=28,`${engineName}/${viewportName}: session completion is not a compact icon-free caption`);
        assert(closed.summaryExpanded==='false'&&closed.detailsHidden==='true'&&closed.detailsInert,`${engineName}/${viewportName}: result details are not closed semantically`);
        assert(!closed.achievementsVisible&&closed.hasChevron,`${engineName}/${viewportName}: collapsed row disclosure affordance is wrong`);
        assert(closed.dateFontSize>=10.4&&closed.dateFits,`${engineName}/${viewportName}: completion time is too small or clipped (${closed.dateFontSize}px)`);
        assert(closed.cardScrollWidth<=closed.cardClientWidth+1&&closed.cardLeft>=-1&&closed.cardRight<=closed.viewportWidth+1,`${engineName}/${viewportName}: closed result row overflows horizontally`);

        await page.locator('.result-summary-toggle').click();
        const expanded=await metrics(page);
        assert(expanded.cardExpanded&&expanded.summaryExpanded==='true'&&expanded.detailsHidden==='false'&&!expanded.detailsInert,`${engineName}/${viewportName}: result row did not expand`);
        assert(expanded.achievementsVisible&&expanded.achievementsExpanded==='false'&&expanded.achievementsText.endsWith('+')&&expanded.listHidden,`${engineName}/${viewportName}: achievements are not independently closed with a plus control`);

        await page.locator('.result-achievements-toggle').click();
        const achievementsOpen=await metrics(page);
        assert(achievementsOpen.achievementsExpanded==='true'&&!achievementsOpen.listHidden&&achievementsOpen.achievementCount===3,`${engineName}/${viewportName}: achievement list did not open independently`);
        assert(achievementsOpen.cardScrollWidth<=achievementsOpen.cardClientWidth+1,`${engineName}/${viewportName}: expanded result row overflows horizontally`);
        assert(!errors.length,`${engineName}/${viewportName}: page errors: ${errors.join('; ')}`);

        if(viewportName==='phonePortrait'){
          await installFixture(page);
          await page.waitForTimeout(950);
          assert.strictEqual(await page.locator('.result-total-number').textContent(),'133,9 кг',`${engineName}: animated final weight did not settle before the visual snapshot`);
          await page.locator('#resultCard').screenshot({path:path.join(output,`${engineName}-collapsed-390x844.png`),animations:'disabled'});
          await page.locator('.result-summary-toggle').click();
          await page.locator('#resultCard').screenshot({path:path.join(output,`${engineName}-expanded-390x844.png`),animations:'disabled'});
          await page.locator('.result-achievements-toggle').click();
          await page.locator('#resultCard').screenshot({path:path.join(output,`${engineName}-achievements-open-390x844.png`),animations:'disabled'});
        }
        report.engines[engineName][viewportName]={closed,expanded,achievementsOpen};
        await page.close();
      }
    }finally{
      await browser.close();
    }
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  process.stdout.write('PASS: two-level session-result disclosure in Chromium/WebKit across phone, tablet, landscape, and desktop\n');
})().catch(error=>{
  process.stderr.write(`FAIL: ${error.stack||error}\n`);
  process.exitCode=1;
});
