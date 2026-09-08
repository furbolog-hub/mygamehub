const path=require('path');
const fs=require('fs');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');
const pageUrl=pathToFileURL(path.join(__dirname,'..','dropfish','index.html')).href;
const output=path.join(__dirname,'..','.visual-test-output','siphonophore-history');
const viewports={desktop:{width:1440,height:900},phonePortrait:{width:390,height:844},phoneLandscape:{width:844,height:390},tabletPortrait:{width:768,height:1024},tabletLandscape:{width:1024,height:768}};
function assert(value,message){if(!value)throw new Error(message);}
(async()=>{
  fs.mkdirSync(output,{recursive:true});
  for(const [engineName,engine] of Object.entries({chromium,webkit})){
    const browser=await engine.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        await page.goto(pageUrl,{waitUntil:'load'});
        const result=await page.evaluate(()=>{
          state=initialState();
          state.tradeShipChecked=true;state.tradeShipCompleted=true;state.castsLeft=0;
          const singula={id:uid(),key:'singula',name:'Пульсирующая сингула',used:false,activated:false};state.dungeon.rewards.push(singula);
          maybeFinalizeSession();const heldOpen=!state.finished;
          processTrash();processTrash();processTrash();usePulsatingSingula(singula.id);
          document.querySelector('#choiceButtons button:last-child').click();
          const parent=addHistory('Контрольный заброс','fish','',{numbered:true});
          state.castClicks=2;
          state.artifacts.push({id:uid(),name:'Нить Сифонофоры',tier:'mythic',traded:false,used:false,createdCast:1,threadChance:1});
          advanceMythicAfterCast(parent);
          render();
          const rows=[...document.querySelectorAll('.history-item.type-trash.is-thread-removed')];
          const embedded=document.querySelector(`[data-history-id="${parent.id}"] .embedded-fish-item`);
          return {heldOpen,finished:state.finished,castsLeft:state.castsLeft,castDisabled:document.querySelector('#castBtn').disabled,rows:rows.length,green:rows.map(row=>getComputedStyle(row.querySelector('.thread-returned-cast')).color),filters:rows.map(row=>getComputedStyle(row.querySelector('.trash-entity-icon img')).filter),overflows:rows.map(row=>row.scrollWidth-row.clientWidth),embeddedCategoryIcons:embedded?.querySelectorAll('.embedded-fish-icon .fish-category-icon').length||0,embeddedDuplicateMarkers:embedded?.querySelectorAll('.fish-size-marker,.fish-inline-status').length||0,spawnNoteInsideFish:embedded?.querySelectorAll('.siphonophore-spawn-impact').length||0,spawnNoteInParentDetail:parent.detail.includes('Нить Сифонофоры добавила')};
        });
        const label=`${engineName}/${viewportName}`;
        assert(result.heldOpen&&!result.finished&&result.castsLeft===3&&!result.castDisabled,`${label}: returned casts are unavailable: ${JSON.stringify(result)}`);
        assert(result.rows===3&&result.green.every(color=>color==='rgb(111, 240, 155)')&&result.filters.every(filter=>filter.includes('grayscale(1)')),`${label}: removed-trash styling is wrong: ${JSON.stringify(result)}`);
        assert(result.overflows.every(value=>value<=1),`${label}: removed-trash row overflows: ${JSON.stringify(result)}`);
        assert(result.embeddedCategoryIcons===1&&result.embeddedDuplicateMarkers===0,`${label}: embedded Siphonophore fish has duplicate category markers: ${JSON.stringify(result)}`);
        assert(result.spawnNoteInsideFish===1&&!result.spawnNoteInParentDetail,`${label}: Siphonophore spawn note is not attached to its fish: ${JSON.stringify(result)}`);
        await page.locator(`[data-history-id]`).last().screenshot({path:path.join(output,`${engineName}-${viewportName}.png`)});
        await page.close();
      }
    }finally{await browser.close();}
  }
  process.stdout.write('PASS: Siphonophore session continuation and trash visuals across Chromium/WebKit viewports\n');
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
