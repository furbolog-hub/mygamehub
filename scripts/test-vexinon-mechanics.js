const path=require('path');
const {pathToFileURL}=require('url');
const {chromium}=require('playwright');
const pagePath=path.join(__dirname,'..','dropfish','index.html');
function assert(value,message){if(!value)throw new Error(message);}

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(pathToFileURL(pagePath).href,{waitUntil:'load'});
    const result=await page.evaluate(()=>{
      const oldRandom=Math.random,fresh=()=>{state=initialState();state.weatherSeen=[state.weather];ensureDungeon();},encounter=()=>({id:uid(),dungeonType:'forgotten',phase:'battle',cleanWeight:10,weapon:'sword',ally:'eel',initialWeapon:'sword',initialAlly:'eel',playerHp:500,bossHp:3000,round:0,log:[],speed:4,bossAttacks:0,battleEventId:0,chronoResolved:false});
      const normal=encounter();Math.random=()=>.9;bossAttack(normal,false);bossAttack(normal,false);
      const critical=encounter();Math.random=()=>.1;bossAttack(critical,true);
      const rift=encounter();Math.random=()=>.9;for(let i=0;i<5;i++){rift.round=i+1;bossAttack(rift,false);}
      fresh();state.dungeon.encounter={...encounter(),bossHp:0};resolveDungeonBattle();const victory=state.dungeon.rewards.map(item=>item.key);
      fresh();state.dungeon.encounter={...encounter(),bossHp:1499};Math.random=()=>.1;resolveDungeonBattle();const survival=state.dungeon.rewards.map(item=>item.key);
      fresh();state.castsLeft=7;applyVexinonWrath();const wrath={casts:state.castsLeft,active:state.dungeon.vexinonWrath,checked:state.tradeShipChecked};beginTradeShip();const shift=state.history.at(-1);
      fresh();state.dungeon.rewards.push({id:uid(),key:'chronocrystal',name:'Хронокристалл',used:false});const chronoSnapshot=createChronoSnapshot(),undoneFish=makeFish('normal','Заброс',true,{initialWeight:4,fishName:'рыба времени'}),undoneRow=state.history.find(row=>row.fishId===undoneFish.id);state.castsLeft=9;state.castClicks=1;state.dungeon.chronoCurrentRowId=undoneRow.id;state.dungeon.chronoSnapshot=chronoSnapshot;useChronocrystal(undoneRow.id);const chronoUse={fish:state.fish.length,casts:state.castsLeft,rolled:state.history.at(-1)?.chronoRolledBack,snapshotCleared:!state.dungeon.chronoSnapshot};
      fresh();state.dungeon.rewards.push({id:uid(),key:'goldenGear',name:'Золотая шестерня',used:false});prepareGoldenGearAlternatives();const gear=goldenGearReward(),gearCount=gear.alternatives.length;gear.alternatives.forEach(item=>resolveGoldenGear('reject',item.id));const gearUse={count:gearCount,used:gear.used,pending:gear.pending};
      fresh();state.castsLeft=0;state.dungeon.rewards.push({id:uid(),key:'temporalGem',name:'Темпоральный самоцвет',used:false});maybeFinalizeSession();const gemItem=state.tradeItems.find(item=>item.key==='temporalGem');const shipGuaranteed=state.tradeShipArrived;exchangeTemporalGem();const gemUse={shipGuaranteed,exchanged:gemItem?.exchanged,giants:state.fish.filter(fish=>fish.source==='Темпоральный самоцвет'&&fish.category==='giant').length};
      Math.random=oldRandom;
      return {normalHp:normal.playerHp,criticalHp:critical.playerHp,rift:{phase:rift.chronoPhase,weapons:rift.chronoWeapons,allies:rift.chronoAllies},victory,survival,wrath,shift,chronoUse,gearUse,gemUse};
    });
    assert(result.normalHp===472,'Vexinon attacks 1 and 2 must deal 10 and 18');
    assert(result.criticalHp===440,'successful ally-triggered critical must add 50 damage to the base attack');
    assert(result.rift.phase==='weapon'&&result.rift.weapons.length===3&&!result.rift.weapons.includes('sword'),'Chrono Rift must offer three weapons excluding the initial weapon');
    assert(result.rift.allies.length===3&&!result.rift.allies.includes('eel'),'Chrono Rift must offer three allies excluding the initial ally');
    assert(result.victory.length===1&&result.victory[0]==='chronocrystal','victory must grant only Chronocrystal');
    assert(result.survival.length===1&&['goldenGear','temporalGem'].includes(result.survival[0]),'sub-50% survival must grant one regular Vexinon reward');
    assert(result.wrath.casts===0&&result.wrath.active&&result.wrath.checked,'Vexinon wrath must burn casts and lock the ship check');
    assert(result.shift.text==='Сдвиг Времени'&&result.shift.vexinonWrath,'ship must enter an untradeable time loop');
    assert(result.chronoUse.fish===0&&result.chronoUse.casts===9&&result.chronoUse.rolled&&result.chronoUse.snapshotCleared,'Chronocrystal must cancel only the current result without refunding a cast');
    assert(result.gearUse.count===4&&result.gearUse.used&&!result.gearUse.pending,'Golden Gear must create four selectable alternatives');
    assert(result.gemUse.shipGuaranteed&&result.gemUse.exchanged&&result.gemUse.giants===6,`Temporal Gem must guarantee the ship and exchange for six giants: ${JSON.stringify(result.gemUse)}`);
    assert(errors.length===0,errors.join('; '));
    process.stdout.write('PASS: Vexinon combat, Chrono Rift, rewards, and wrath\n');
  }finally{await browser.close();}
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
