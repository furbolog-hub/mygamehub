'use strict';

const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium,webkit}=require('playwright');

const pageUrl=pathToFileURL(path.join(__dirname,'..','agroclick','index.html')).href;

(async()=>{
  for(const [engineName,engine] of Object.entries({chromium,webkit})){
    const browser=await engine.launch({headless:true});
    try{
      const page=await browser.newPage({viewport:{width:390,height:844}});
      const errors=[];
      page.on('pageerror',error=>{if(!/ResizeObserver loop/i.test(error.message)) errors.push(error.message);});
      await page.goto(pageUrl,{waitUntil:'load'});
      await page.evaluate(()=>{
        state.locationLocked=true;
        state.movesLeft=0;
        const wheat=state.board.find(cell=>cell.type==='wheat');
        wheat.opened=true;
        state.inventory=[
          {id:uid(),type:'mineralFertilizer',count:1,timer:null,origin:'chest'},
          {id:uid(),type:'bombShield',count:1,timer:4,origin:'chest'}
        ];
        state.beetles=2;
        render();
      });

      const initial=await page.evaluate(()=>({
        risk:document.querySelector('#beetleIndicatorRisk')?.textContent,
        badges:document.querySelectorAll('.cell-state-badge').length,
        closed:document.querySelectorAll('.cell-state-badge.is-closed').length
      }));
      assert.equal(initial.risk,'Итоговая потеря: 25–50%',`${engineName}: wrong beetle range`);
      assert.equal(initial.badges,30,`${engineName}: not every cell has a state marker`);
      assert(initial.closed>0,`${engineName}: closed state marker missing`);

      await page.locator('#nextBtn').click();
      const warning=await page.locator('#inlineAction').textContent();
      assert.match(warning,/доступны действия/i,`${engineName}: exit warning missing`);
      await page.getByRole('button',{name:/Продолжить и перенести активы/}).click();

      const carried=await page.evaluate(()=>({
        locationIndex:state.locationIndex,
        items:state.inventory.map(item=>({type:item.type,count:item.count,timer:item.timer})),
        movesLeft:state.movesLeft,
        locked:state.locationLocked
      }));
      assert.equal(carried.locationIndex,1,`${engineName}: location did not advance`);
      assert.equal(carried.movesLeft,15,`${engineName}: moves were not reset`);
      assert.equal(carried.locked,false,`${engineName}: next location stayed locked`);
      assert.deepEqual(carried.items,[
        {type:'mineralFertilizer',count:1,timer:null},
        {type:'bombShield',count:1,timer:4}
      ],`${engineName}: inventory was not carried intact`);
      assert.deepEqual(errors,[],`${engineName}: page errors: ${errors.join('; ')}`);
      await page.close();
    } finally {
      await browser.close();
    }
  }
  process.stdout.write('PASS: AgroClick carry-over, exit warning, cell states and beetle range in Chromium/WebKit\n');
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
