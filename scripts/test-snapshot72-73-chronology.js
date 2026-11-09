const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const target=pathToFileURL(path.join(root,'dropfish','index.html')).href;
const output=path.join(root,'artifacts','snapshot72-73-chronology');
const engines={chromium,webkit};
const viewports={
  desktop:{width:1366,height:768},
  phonePortrait:{width:390,height:844},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:768,height:1024},
  tabletLandscape:{width:1024,height:768}
};
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

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
        const fixture=await page.evaluate(()=>{
          state=initialState();
          state.weather='storm';
          state.weatherSeen=['storm'];
          state.history=[];
          state.fish=[];
          const fish={
            id:'snapshot72-displaced-fish',
            name:'атлантическая пеламида',
            category:'normal',
            rarity:'common',
            originalWeight:5.2,
            weight:5.2,
            source:'Заброс',
            direct:true,
            removed:true,
            islandDisplaced:true,
            tags:[]
          };
          const row={
            id:'snapshot72-displaced-row',
            type:'fish',
            text:'Атлантическая пеламида — 5,2 кг',
            detail:'',
            numbered:true,
            createdAt:Date.now(),
            fishId:fish.id,
            fishSource:'Заброс',
            islandDisplaced:true
          };
          state.fish.push(fish);
          state.history.push(row);
          state.historyUi={expandedIds:[row.id],filter:'all',introducedKeys:[],initialized:true,compactVersion:5};
          maybeSpawnDeadWatersAfterCast(true);
          render();
          setHistoryRowExpanded(row.id,true);
          return {fishRowId:row.id,deadRowId:activeDeadWaters().rowId};
        });
        await page.waitForFunction(ids=>{
          const images=[...document.querySelectorAll(`[data-history-id="${ids.fishRowId}"] img,[data-history-id="${ids.deadRowId}"] img`)];
          return images.length>0&&images.every(image=>image.complete&&image.naturalWidth>0);
        },fixture);
        const metrics=await page.evaluate(ids=>{
          const rect=node=>{const box=node?.getBoundingClientRect();return box?{left:box.left,top:box.top,right:box.right,bottom:box.bottom,width:box.width,height:box.height,cx:(box.left+box.right)/2,cy:(box.top+box.bottom)/2}:null;};
          const textRect=node=>{if(!node)return null;const range=document.createRange();range.selectNodeContents(node);return rect(range);};
          const fishRow=document.querySelector(`[data-history-id="${ids.fishRowId}"]`);
          const fishTitle=fishRow?.querySelector('.chronology-row__title-text');
          const fishIcon=fishRow?.querySelector('.chronology-row__icon img');
          const displaced=fishRow?.querySelector('.fish-displaced-inline-hint');
          const fishStyle=fishTitle?getComputedStyle(fishTitle):null;
          const displacedStyle=displaced?getComputedStyle(displaced):null;
          const deadRow=document.querySelector(`[data-history-id="${ids.deadRowId}"]`);
          const deadTitle=deadRow?.querySelector('.chronology-row__title');
          const deadTitleText=deadRow?.querySelector('.chronology-row__title-text');
          const inlineAction=deadRow?.querySelector('.chronology-row__inline-action');
          const button=inlineAction?.querySelector('[data-open-dead-waters]');
          const summary=deadRow?.querySelector('.chronology-row__summary');
          const deadTextBox=textRect(deadTitleText),buttonBox=rect(button),summaryBox=rect(summary);
          return {
            fish:{
              expanded:fishRow?.classList.contains('is-expanded')||false,
              iconSrc:fishIcon?.getAttribute('src')||'',
              iconClass:fishIcon?.className||'',
              oldMainIconCount:fishRow?.querySelectorAll('.chronology-row__icon :is(.base-fish-icon,.rift-fish-icon,.deep-fish-icon,.island-fish-icon,.fish-category-icons,.island-displaced-cross)').length||0,
              originBadgeCount:fishRow?.querySelectorAll('.chronology-row__badge img').length||0,
              detailText:displaced?.textContent.replace(/\s+/g,' ').trim()||'',
              detailCount:[...(fishRow?.querySelectorAll('.history-row-details *')||[])].filter(node=>node.children.length===0&&/Нестабильное присутствие/i.test(node.textContent)).length,
              effectBadgeCount:displaced?.querySelectorAll('.fish-effect-badge').length||0,
              duplicateNoteCount:fishRow?.querySelectorAll('.history-impact-note.island-displaced-note').length||0,
              titleColor:fishStyle?.color||'',
              fontFamilyMatch:fishStyle?.fontFamily===displacedStyle?.fontFamily,
              fontSizeMatch:fishStyle?.fontSize===displacedStyle?.fontSize,
              detailLineHeight:parseFloat(displacedStyle?.lineHeight||'0'),
              detailFontSize:parseFloat(displacedStyle?.fontSize||'0'),
              overflow:Boolean(fishRow&&fishRow.scrollWidth>fishRow.clientWidth+1)
            },
            dead:{
              inline:Boolean(inlineAction&&inlineAction.parentElement===deadTitle&&deadTitleText?.nextElementSibling===inlineAction),
              noDetachedAction:!deadRow?.querySelector('.history-row-actions'),
              buttonText:button?.textContent.trim()||'',
              titleBox:rect(deadTitle),
              textBox:deadTextBox,
              buttonBox,
              summaryBox,
              sameLine:Boolean(deadTextBox&&buttonBox&&buttonBox.top<deadTextBox.bottom&&buttonBox.bottom>deadTextBox.top),
              centered:Boolean(deadTextBox&&buttonBox&&Math.abs(deadTextBox.cy-buttonBox.cy)<=2),
              adjacent:Boolean(deadTextBox&&buttonBox&&buttonBox.left>=deadTextBox.right-1&&buttonBox.left-deadTextBox.right<=8),
              overflow:Boolean(deadRow&&deadRow.scrollWidth>deadRow.clientWidth+1)
            },
            pageOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
          };
        },fixture);
        const label=`${engineName}/${viewportName}`;
        assert(metrics.fish.expanded,`${label}: displaced fish row is not expanded`);
        assert(metrics.fish.iconSrc.endsWith('/fish-status/unstable-presence.webp')&&metrics.fish.iconClass.includes('fish-status-icon'),`${label}: unstable-presence did not replace the fish icon ${JSON.stringify(metrics.fish)}`);
        assert(metrics.fish.oldMainIconCount===0,`${label}: displaced row still exposes a fish/category/cross main icon ${JSON.stringify(metrics.fish)}`);
        assert(metrics.fish.originBadgeCount===1,`${label}: acquisition-origin badge was not preserved ${JSON.stringify(metrics.fish)}`);
        assert(metrics.fish.detailText==='Вытеснена эффектом: Нестабильное присутствие',`${label}: displaced detail copy is wrong ${JSON.stringify(metrics.fish)}`);
        assert(metrics.fish.detailCount===1&&metrics.fish.effectBadgeCount===0&&metrics.fish.duplicateNoteCount===0,`${label}: displaced effect is duplicated or rendered as a second badge ${JSON.stringify(metrics.fish)}`);
        assert(metrics.fish.titleColor==='rgb(255, 111, 125)',`${label}: displaced fish title is not red ${metrics.fish.titleColor}`);
        assert(metrics.fish.fontFamilyMatch&&metrics.fish.fontSizeMatch,`${label}: expanded copy does not use the closed-row font ${JSON.stringify(metrics.fish)}`);
        assert(metrics.fish.detailLineHeight<=metrics.fish.detailFontSize*1.2,`${label}: displaced detail line-height is excessive ${JSON.stringify(metrics.fish)}`);
        assert(!metrics.fish.overflow,`${label}: displaced fish row overflows horizontally`);
        assert(metrics.dead.inline&&metrics.dead.noDetachedAction,`${label}: Dead Waters action is not inside the title immediately after its text ${JSON.stringify(metrics.dead)}`);
        assert(metrics.dead.buttonText==='Войти'&&metrics.dead.sameLine&&metrics.dead.centered&&metrics.dead.adjacent,`${label}: Dead Waters entry button is not aligned with the title ${JSON.stringify(metrics.dead)}`);
        assert(metrics.dead.buttonBox.height===28&&metrics.dead.buttonBox.top>=metrics.dead.summaryBox.top-1&&metrics.dead.buttonBox.bottom<=metrics.dead.summaryBox.bottom+1,`${label}: Dead Waters entry button enlarges or escapes the shared header ${JSON.stringify(metrics.dead)}`);
        assert(!metrics.dead.overflow&&metrics.pageOverflow<=1,`${label}: chronology changes create horizontal overflow ${JSON.stringify(metrics)}`);
        assert(errors.length===0,`${label}: page errors ${errors.join(' | ')}`);
        await page.locator('#historyList').screenshot({path:path.join(output,`${engineName}-${viewportName}.png`),animations:'disabled'});
        renders++;
        await page.close();
      }
    }finally{
      await browser.close();
    }
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,renders,viewports},null,2));
  process.stdout.write(`PASS: ${renders} Snapshot 72–73 chronology renders across Chromium and WebKit\n`);
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
