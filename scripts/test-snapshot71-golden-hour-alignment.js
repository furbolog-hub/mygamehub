const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const target=pathToFileURL(path.join(root,'dropfish','index.html')).href;
const output=path.join(root,'artifacts','snapshot71-golden-hour-alignment');
const viewports={desktop:{width:1366,height:768},phonePortrait:{width:390,height:844},phoneReference:{width:440,height:892},phoneLandscape:{width:844,height:390},tabletPortrait:{width:768,height:1024},tabletLandscape:{width:1024,height:768}};
const engines={chromium,webkit};
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const close=(a,b,tolerance=1)=>Math.abs(a-b)<=tolerance;

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  let renders=0;
  for(const [engineName,engine] of Object.entries(engines)){
    const browser=await engine.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        const errors=[];
        page.on('pageerror',error=>errors.push(String(error)));
        await page.goto(target,{waitUntil:'load'});
        const rowId=await page.evaluate(()=>{
          state=initialState();
          state.weather='golden';
          state.history=[];
          state.fish=[];
          const fish={id:'snapshot71-turbot',name:'тюрбо',weight:4.3,originalWeight:.3,category:'normal',rarity:'common',source:'Заброс',removed:false,tags:[],goldenHourImpact:{before:.3,plus:4,after:4.3}};
          const row={id:'snapshot71-row',type:'fish',text:'Тюрбо — 4,3 кг',detail:'',numbered:true,createdAt:Date.now(),fishId:fish.id,fishSource:'Заброс'};
          state.fish.push(fish);
          state.history.push(row);
          state.historyUi={expandedIds:[row.id],filter:'all',introducedKeys:[],initialized:true,compactVersion:5};
          render();
          return row.id;
        });
        await page.waitForFunction(id=>{
          const effect=document.querySelector(`[data-history-id="${id}"] .golden-hour-impact`);
          return [...(effect?.querySelectorAll('img')||[])].every(image=>image.complete&&image.naturalWidth>0);
        },rowId);
        const metrics=await page.evaluate(id=>{
          const rect=node=>{const box=node?.getBoundingClientRect();return box?{left:box.left,top:box.top,right:box.right,bottom:box.bottom,width:box.width,height:box.height,cx:(box.left+box.right)/2,cy:(box.top+box.bottom)/2}:null;};
          const row=document.querySelector(`[data-history-id="${id}"]`);
          const effect=row?.querySelector('.golden-hour-impact');
          const source=effect?.querySelector(':scope > .gear-icon');
          const sourceImage=source?.querySelector('img');
          const copy=effect?.querySelector(':scope > .effect-impact-copy');
          const summary=copy?.querySelector('.effect-impact-summary');
          const gain=summary?.querySelector(':scope > .gold-add');
          const target=summary?.querySelector(':scope > .effect-target-icon');
          const targetImage=target?.querySelector('img');
          const calculation=copy?.querySelector('.effect-impact-calculation');
          const scroller=document.getElementById('historyScroll');
          return {
            expanded:row?.classList.contains('is-expanded')||false,
            effect:rect(effect),source:rect(source),sourceImage:rect(sourceImage),copy:rect(copy),summary:rect(summary),gain:rect(gain),target:rect(target),targetImage:rect(targetImage),calculation:rect(calculation),
            sourceSrc:sourceImage?.getAttribute('src')||'',targetSrc:targetImage?.getAttribute('src')||'',gainText:gain?.textContent.trim()||'',calculationText:calculation?.textContent.replace(/\s+/g,' ').trim()||'',
            sourceDisplay:source?getComputedStyle(source).display:'',summaryDisplay:summary?getComputedStyle(summary).display:'',targetDisplay:target?getComputedStyle(target).display:'',targetTransform:targetImage?getComputedStyle(targetImage).transform:'',
            gainFont:gain?getComputedStyle(gain).fontSize:'',calculationFont:calculation?getComputedStyle(calculation).fontSize:'',
            domOrder:source?.nextElementSibling===copy&&gain?.nextElementSibling===target,
            legacyNodes:effect?.querySelectorAll('.gear-arrow,.gear-target').length||0,
            documentOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
            historyOverflow:scroller?scroller.scrollWidth-scroller.clientWidth:0
          };
        },rowId);
        const label=`${engineName}/${viewportName}`;
        assert(metrics.expanded,`${label}: fixture row is not expanded`);
        assert(metrics.source&&metrics.sourceImage&&metrics.gain&&metrics.target&&metrics.targetImage&&metrics.calculation,`${label}: Golden Hour structure is incomplete ${JSON.stringify(metrics)}`);
        assert(metrics.domOrder&&metrics.legacyNodes===0,`${label}: Golden Hour DOM order is not icon → gain → fish ${JSON.stringify(metrics)}`);
        assert(metrics.sourceDisplay==='grid'&&metrics.summaryDisplay==='grid'&&metrics.targetDisplay==='grid',`${label}: explicit alignment grid is missing ${JSON.stringify(metrics)}`);
        for(const [name,box] of [['source',metrics.source],['sourceImage',metrics.sourceImage],['target',metrics.target]])assert(close(box.width,30)&&close(box.height,30),`${label}: ${name} is not 30x30 ${JSON.stringify(box)}`);
        assert(metrics.targetImage.width>=39&&metrics.targetImage.width<=42&&close(metrics.targetImage.width,metrics.targetImage.height,1)&&close(metrics.targetImage.cx,metrics.target.cx,1)&&close(metrics.targetImage.cy,metrics.target.cy,1)&&metrics.targetTransform!=='none',`${label}: transparent margins of the base-fish target were not optically normalized ${JSON.stringify(metrics)}`);
        assert(close(metrics.source.cy,metrics.target.cy,1)&&close(metrics.source.cy,metrics.gain.cy,1.5),`${label}: Golden Hour summary elements do not share one center line ${JSON.stringify(metrics)}`);
        assert(metrics.source.right<=metrics.gain.left+1&&metrics.gain.right<=metrics.target.left+1&&metrics.target.left-metrics.gain.right<=6,`${label}: Golden Hour horizontal order/gaps are wrong ${JSON.stringify(metrics)}`);
        assert(metrics.calculation.top>=metrics.summary.bottom-1&&metrics.calculation.top-metrics.summary.bottom<=3,`${label}: calculation is not directly below the summary ${JSON.stringify(metrics)}`);
        assert(metrics.gainText==='+4 кг'&&/0,3 кг \+ 4 кг = 4,3 кг/.test(metrics.calculationText),`${label}: compact Golden Hour copy is wrong ${JSON.stringify(metrics)}`);
        assert(metrics.gainFont===metrics.calculationFont,`${label}: Golden Hour font sizes differ ${JSON.stringify(metrics)}`);
        assert(metrics.documentOverflow<=1&&metrics.historyOverflow<=1,`${label}: Golden Hour creates horizontal overflow ${JSON.stringify(metrics)}`);
        assert(errors.length===0,`${label}: page errors ${errors.join(' | ')}`);
        await page.locator(`[data-history-id="${rowId}"]`).screenshot({path:path.join(output,`${engineName}-${viewportName}.png`),animations:'disabled'});
        renders++;
        await page.close();
      }
    }finally{await browser.close();}
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,renders,viewports},null,2));
  process.stdout.write(`PASS: ${renders} Snapshot 71 Golden Hour alignment renders across Chromium and WebKit\n`);
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
