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
      const page=await browser.newPage({viewport:{width:1280,height:800}});
      const errors=[];
      page.on('pageerror',error=>{if(!/ResizeObserver loop/i.test(error.message)) errors.push(error.message);});
      await page.goto(pageUrl,{waitUntil:'load'});
      const result=await page.evaluate(()=>{
        const location=slug=>LOCATIONS.find(item=>item.background.includes(slug));
        const counts=slug=>{
          const board=createBoard(location(slug));
          return {board,types:Object.fromEntries(['bomb','mole','weed','chest','wheat'].map(type=>[type,board.filter(cell=>cell.type===type).length]))};
        };
        const generated={};
        for(const slug of Object.keys(LOCATION_RULES)) generated[slug]=counts(slug).types;
        const dry=createBoard(location('dry-rift'));
        const shadow=createBoard(location('shadow-cliff'));
        const amber=createBoard(location('amber-slope'));

        state.locations=[location('stormy-glade'),location('misty-realm'),location('golden-valley')];
        state.locationIndex=0; state.board=createBoard(state.locations[0]); state.locationHarvest=0; state.inventory=[];
        const stormWheat=state.board.filter(cell=>cell.type==='wheat').slice(0,6);
        stormWheat.forEach((cell,index)=>{cell.opened=true;cell.amount=index+10;cell.originalAmount=cell.amount;state.locationHarvest+=cell.amount;});
        const stormMole=state.board.find(cell=>cell.type==='mole'); stormMole.opened=true;
        const oldRandom=Math.random; Math.random=()=>.99; processMole(stormMole);
        const stormStolen=stormWheat.filter(cell=>cell.stolen).length;
        state.activeRabbitCell=null; state.rabbitSpawns=0; state.movesLeft=10; Math.random=()=>0; maybeRabbit();
        const stormRabbit=state.activeRabbitCell;
        const stormSummons=summonMoleHazards(['bomb','weed']).map(item=>item.type);

        state.locationIndex=1; state.board=createBoard(state.locations[1]); state.locationHarvest=40; state.inventory=[];
        const mistBomb=state.board.find(cell=>cell.type==='bomb'); mistBomb.opened=true; mistBomb.timer=2;
        const mistMole=state.board.find(cell=>cell.type==='mole'); mistMole.opened=true;
        Math.random=()=>0; processMole(mistMole);
        const bombStolen=Boolean(mistBomb.stolenByMole&&mistBomb.destroyed&&mistBomb.timer==null);
        const mistWeed=state.board.find(cell=>cell.type==='weed'); mistWeed.opened=true; processWeed(mistWeed);
        const blockedByMist=state.board.filter(cell=>cell.blockedBy?.includes(mistWeed.id));
        if(blockedByMist[0]) blockedByMist[0].blockedBy.push(999);
        tickExistingEffects(new Set([mistWeed.id]),new Set(),null);
        const withered={value:mistWeed.withered,released:blockedByMist.filter(cell=>!cell.blocked).length,sharedStayed:Boolean(blockedByMist[0]?.blocked)};

        state.locationIndex=2; state.board=createBoard(state.locations[2]); state.locationHarvest=100; state.inventory=[];
        const goldenChest=state.board.find(cell=>cell.type==='chest'); activateChest(goldenChest);
        const goldenBomb=state.board.find(cell=>cell.type==='bomb'); goldenBomb.opened=true; goldenBomb.timer=1;
        Math.random=()=>0; tickExistingEffects(new Set([goldenBomb.id]),new Set(),null);
        const golden={chestTimer:goldenChest.timer,bombFizzled:goldenBomb.fizzled,harvest:state.locationHarvest};

        state.locations[2]=location('rocky-wasteland'); state.board=createBoard(state.locations[2]);
        const rockyWeed=state.board.find(cell=>cell.type==='weed'); rockyWeed.id=12; rockyWeed.opened=true;
        state.board.forEach(cell=>{if(cell!==rockyWeed){cell.opened=false;cell.blocked=false;cell.destroyed=false;cell.blockedBy=[];}});
        Math.random=()=>.99; const rocky=processWeed(rockyWeed).blockedCellIds.length;
        Math.random=oldRandom;

        return {
          generated,
          dryHidden:dry.filter(cell=>cell.hiddenBonus==='scarecrow').length,
          shadowHidden:shadow.filter(cell=>cell.hiddenBonus==='digitalMagnifier').length,
          hiddenStayWheat:dry.filter(cell=>cell.hiddenBonus).every(cell=>cell.type==='wheat')&&shadow.filter(cell=>cell.hiddenBonus).every(cell=>cell.type==='wheat'),
          amberAmounts:amber.filter(cell=>cell.type==='wheat').map(cell=>cell.amount),
          stormStolen,stormRabbit,stormSummons,bombStolen,withered,golden,rocky
        };
      });

      const expected={
        'endless-plain':[2,2,0,2], 'windy-ridge':[2,0,2,1], 'stormy-glade':[0,2,2,1],
        'golden-valley':[2,2,2,1], 'rocky-wasteland':[2,2,2,1], 'copper-ledge':[1,1,1,1],
        'dry-rift':[2,2,2,1], 'shadow-cliff':[2,2,2,1], 'misty-realm':[2,2,2,1],
        'black-furrow':[0,3,0,1], 'southern-steppe':[1,0,4,1], 'amber-slope':[2,2,2,1]
      };
      for(const [slug,values] of Object.entries(expected)) assert.deepEqual(
        ['bomb','mole','weed','chest'].map(type=>result.generated[slug][type]),values,`${engineName}/${slug}: wrong board composition`
      );
      assert.equal(result.dryHidden,2,`${engineName}: dry-rift scarecrows`);
      assert.equal(result.shadowHidden,2,`${engineName}: shadow-cliff magnifiers`);
      assert(result.hiddenStayWheat,`${engineName}: hidden bonuses replaced wheat`);
      assert(result.amberAmounts.every(value=>value>=10&&value<=20),`${engineName}: amber wheat range`);
      assert.equal(result.stormStolen,5,`${engineName}: storm mole limit`);
      assert.equal(result.stormRabbit,null,`${engineName}: storm rabbit appeared`);
      assert(!result.stormSummons.includes('bomb'),`${engineName}: storm mole summoned bomb`);
      assert(result.bombStolen,`${engineName}: mist mole did not prefer bomb`);
      assert(result.withered.value&&result.withered.released>=1&&result.withered.sharedStayed,`${engineName}: weed wither ownership failed`);
      assert.deepEqual(result.golden,{chestTimer:1,bombFizzled:true,harvest:100},`${engineName}: golden timers failed`);
      assert.equal(result.rocky,4,`${engineName}: rocky weed did not block four cells`);
      assert.deepEqual(errors,[],`${engineName}: ${errors.join('; ')}`);
      await page.close();
    } finally { await browser.close(); }
  }
  process.stdout.write('PASS: all 12 AgroClick location rules in Chromium/WebKit\n');
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
