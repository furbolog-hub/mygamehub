const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const pageUrl=pathToFileURL(path.join(root,'dropfish','index.html')).href;
const output=path.join(root,'artifacts','snapshot68-69-systemic');
const viewports={
  desktop:{width:1280,height:900},
  phonePortrait:{width:390,height:844},
  phoneReference:{width:440,height:892},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:768,height:1024},
  tabletLandscape:{width:1024,height:768},
};

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const report={passed:true,renders:0,viewports,engines:{}};
  for(const [engineName,browserType] of Object.entries({chromium,webkit})){
    const browser=await browserType.launch({headless:true});
    report.engines[engineName]={};
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        const errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        await page.goto(pageUrl,{waitUntil:'load'});
        const angusId=await page.evaluate(()=>{
          state=initialState();
          state.weather='golden';
          state.debuffs=[];
          state.history=[];
          const angus=addHistory('Появился старина Ангус','angus','',{numbered:false});
          const fish=makeFish('heavy','Старина Ангус',false,{parentHistoryId:angus.id,initialWeight:22.7,fishName:'атлантический палтус',skipSideEvents:true});
          fish.originalWeight=22.7;
          fish.weight=25.7;
          fish.preDebuffWeight=25.7;
          fish.debuffBaseWeight=22.7;
          fish.debuffLimited=true;
          fish.debuffSource='Утка';
          fish.goldenHourImpact={before:22.7,after:25.7,plus:3};
          ensureDungeon();
          state.dungeon.rewards.push({id:uid(),key:'goldenGear',name:'Золотая шестерня',used:false});
          prepareGoldenGearAlternatives();
          render();
          setHistoryRowExpanded(angus.id,true);
          return angus.id;
        });
        await page.waitForTimeout(80);
        const metrics=await page.evaluate(id=>{
          const box=node=>{const value=node?.getBoundingClientRect();return value?{left:value.left,top:value.top,right:value.right,bottom:value.bottom,width:value.width,height:value.height}:null;};
          const angus=document.querySelector(`[data-history-id="${id}"]`);
          const marker=angus?.querySelector('.embedded-fish-attribute .fish-size-marker');
          const markerImage=marker?.querySelector('img');
          const effect=angus?.querySelector('.fish-debuff-impact');
          const effectIcon=effect?.querySelector('.fish-effect-badge-slot');
          const effectImage=effectIcon?.querySelector('img');
          const effectCopy=effect?.querySelector('.fish-debuff-impact-copy');
          const actionRows=[...document.querySelectorAll('.golden-alternative')].map(row=>{
            const summary=row.querySelector('.chronology-row__summary');
            const title=row.querySelector('.chronology-row__title');
            const actions=row.querySelector('.history-row-actions');
            return {
              row:box(row),summary:box(summary),title:box(title),actions:box(actions),
              titleText:title?.textContent.replace(/\s+/g,' ').trim()||'',
              actionClientWidth:actions?.clientWidth||0,
              actionScrollWidth:actions?.scrollWidth||0,
              buttons:[...row.querySelectorAll('.history-row-actions button')].map(button=>({
                text:button.textContent.trim(),box:box(button),clientWidth:button.clientWidth,scrollWidth:button.scrollWidth,
                overflow:getComputedStyle(button).overflow,textOverflow:getComputedStyle(button).textOverflow,
              })),
            };
          });
          const scroller=document.getElementById('historyScroll');
          return {
            marker:box(marker),markerImage:box(markerImage),effect:box(effect),effectIcon:box(effectIcon),effectImage:box(effectImage),effectCopy:box(effectCopy),actionRows,
            documentOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
            chronologyOverflow:scroller?scroller.scrollWidth-scroller.clientWidth:0,
          };
        },angusId);

        assert(metrics.marker&&metrics.markerImage,`${engineName}/${viewportName}: Angus category slot is missing`);
        assert(metrics.markerImage.left>=metrics.marker.left-1&&metrics.markerImage.right<=metrics.marker.right+1&&metrics.markerImage.top>=metrics.marker.top-1&&metrics.markerImage.bottom<=metrics.marker.bottom+1,`${engineName}/${viewportName}: Angus category artwork is clipped`);
        assert(metrics.effect&&metrics.effectIcon&&metrics.effectImage&&metrics.effectCopy,`${engineName}/${viewportName}: Angus weight-limit record is incomplete`);
        assert(metrics.effectIcon.right<=metrics.effectCopy.left+1,`${engineName}/${viewportName}: Angus weight-limit icon overlaps its copy`);
        assert(metrics.effectImage.left>=metrics.effectIcon.left-1&&metrics.effectImage.right<=metrics.effectIcon.right+1&&metrics.effectImage.top>=metrics.effectIcon.top-1&&metrics.effectImage.bottom<=metrics.effectIcon.bottom+1,`${engineName}/${viewportName}: Angus weight-limit icon is clipped`);
        assert.strictEqual(metrics.actionRows.length,4,`${engineName}/${viewportName}: expected four Golden Gear action rows`);
        metrics.actionRows.forEach((entry,index)=>{
          assert(entry.titleText.startsWith(`Альтернативный заброс ${index+1}:`),`${engineName}/${viewportName}: Golden Gear title is truncated (${entry.titleText})`);
          assert(entry.actions.top>=entry.summary.bottom-1&&entry.actions.bottom<=entry.row.bottom+1,`${engineName}/${viewportName}: Golden Gear actions overlap the title or leave the row`);
          assert(entry.actionScrollWidth<=entry.actionClientWidth+1,`${engineName}/${viewportName}: Golden Gear action group overflows`);
          assert.deepStrictEqual(entry.buttons.map(button=>button.text),['Оставить','Отказаться'],`${engineName}/${viewportName}: Golden Gear button labels changed`);
          entry.buttons.forEach(button=>{
            assert(button.scrollWidth<=button.clientWidth+1,`${engineName}/${viewportName}: Golden Gear button text is clipped`);
            assert(button.overflow!=='hidden'&&button.textOverflow!=='ellipsis',`${engineName}/${viewportName}: Golden Gear button hides text`);
          });
        });
        assert(metrics.documentOverflow<=1&&metrics.chronologyOverflow<=1,`${engineName}/${viewportName}: chronology creates horizontal scrolling`);
        assert.strictEqual(errors.length,0,`${engineName}/${viewportName}: page errors: ${errors.join(' | ')}`);
        await page.screenshot({path:path.join(output,`${engineName}-${viewportName}.png`),fullPage:true,animations:'disabled'});
        report.engines[engineName][viewportName]=metrics;
        report.renders++;
        await page.close();
      }
    }finally{
      await browser.close();
    }
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  process.stdout.write(`PASS: ${report.renders} Snapshot 68-69 regression renders across Chromium and WebKit\n`);
})().catch(error=>{
  process.stderr.write(`FAIL: ${error.stack||error}\n`);
  process.exitCode=1;
});
