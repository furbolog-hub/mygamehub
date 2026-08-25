const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');
const pageUrl=pathToFileURL(path.join(__dirname,'..','dropfish','index.html')).href;
const viewports={desktop:{width:1440,height:900},phonePortrait:{width:390,height:844},phoneLandscape:{width:844,height:390},tabletPortrait:{width:768,height:1024},tabletLandscape:{width:1024,height:768}};
function assert(value,message){if(!value)throw new Error(message);}
(async()=>{
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
          document.querySelector('#choiceButtons button:last-child').click();render();
          const rows=[...document.querySelectorAll('.history-item.type-trash.is-thread-removed')];
          return {heldOpen,finished:state.finished,castsLeft:state.castsLeft,castDisabled:document.querySelector('#castBtn').disabled,rows:rows.length,green:rows.map(row=>getComputedStyle(row.querySelector('.thread-returned-cast')).color),filters:rows.map(row=>getComputedStyle(row.querySelector('.trash-entity-icon img')).filter),overflows:rows.map(row=>row.scrollWidth-row.clientWidth)};
        });
        const label=`${engineName}/${viewportName}`;
        assert(result.heldOpen&&!result.finished&&result.castsLeft===3&&!result.castDisabled,`${label}: returned casts are unavailable: ${JSON.stringify(result)}`);
        assert(result.rows===3&&result.green.every(color=>color==='rgb(111, 240, 155)')&&result.filters.every(filter=>filter.includes('grayscale(1)')),`${label}: removed-trash styling is wrong: ${JSON.stringify(result)}`);
        assert(result.overflows.every(value=>value<=1),`${label}: removed-trash row overflows: ${JSON.stringify(result)}`);
        await page.close();
      }
    }finally{await browser.close();}
  }
  process.stdout.write('PASS: Siphonophore session continuation and trash visuals across Chromium/WebKit viewports\n');
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
