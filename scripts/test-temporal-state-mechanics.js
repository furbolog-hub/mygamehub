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
    const result=await page.evaluate(async()=>{
      const fresh=()=>{state=initialState();state.weatherSeen=[state.weather];ensureDungeon();};

      fresh();
      state.dungeon.rewards.push({id:uid(),key:'chronocrystal',name:'Хронокристалл',used:false});
      const snapshot=createChronoSnapshot();
      const fish=makeFish('normal','Заброс',true,{initialWeight:4,fishName:'рыба времени'});
      const row=state.history.find(item=>item.fishId===fish.id);
      state.castsLeft=9;state.castClicks=1;state.dungeon.chronoCurrentRowId=row.id;state.dungeon.chronoSnapshot=snapshot;
      state=hydrateState(serializeState(state));
      const persistedButton=renderChronocrystalAction(state.history.find(item=>item.id===row.id)).includes('data-chrono-row');
      useChronocrystal(row.id);
      const chrono={persistedButton,fishCount:state.fish.length,castsLeft:state.castsLeft,snapshotCleared:!state.dungeon.chronoSnapshot};

      fresh();
      processDebuff('Рак');processDebuff('Рак');
      const crabRows=state.history.filter(item=>item.type==='debuff'&&item.text==='Рак');
      undoDebuffById(crabRows[0].debuffId,'Рак');
      const afterFirst=state.debuffs.filter(item=>item.name==='Рак'&&item.active).length;
      undoDebuffById(crabRows[1].debuffId,'Рак');
      const afterSecond=state.debuffs.filter(item=>item.name==='Рак'&&item.active).length;

      fresh();
      const ether={id:uid(),key:'darkEther',name:'Тёмный эфир',used:false,charges:5};state.dungeon.rewards.push(ether);state.dungeon.darkEtherArmedId=ether.id;
      const etherFish=makeFish('normal','Заброс',true,{initialWeight:3,fishName:'эфирная рыба'}),etherRow=state.history.find(item=>item.fishId===etherFish.id);
      state.finished=true;const eligibleAfterFinish=darkEtherEligibleRow(etherRow),castsBefore=state.castsLeft;useDarkEtherOnRow(etherRow.id);
      const etherFinal={eligibleAfterFinish,castsUnchanged:state.castsLeft===castsBefore,fishPresent:!etherFish.removed};

      fresh();
      const artifactEther={id:uid(),key:'darkEther',name:'Тёмный эфир',used:false,charges:5};state.dungeon.rewards.push(artifactEther);state.dungeon.darkEtherArmedId=artifactEther.id;state.compassUsed=true;
      const compassCastsBefore=state.castsLeft,compassRow=processEpic('Компас потерянных глубин');useDarkEtherOnRow(compassRow.id);
      const compassRollback={casts:state.castsLeft,expected:compassCastsBefore+1,removed:state.artifacts.find(item=>item.id===compassRow.artifactId)?.darkEtherRemoved};
      const oldArtifactRandom=Math.random;Math.random=()=>.5;const chestRow=processEpic('Бездонный ларь'),chestFishIds=[...(chestRow.embeddedFishIds||[])];Math.random=oldArtifactRandom;useDarkEtherOnRow(chestRow.id);
      const chestRollback={created:chestFishIds.length,remaining:state.fish.filter(item=>chestFishIds.includes(item.id)&&!item.removed).length};

      fresh();
      const gear={id:uid(),key:'goldenGear',name:'Золотая шестерня',used:false};state.dungeon.rewards.push(gear);
      prepareGoldenGearAlternatives();
      gear.alternatives.forEach((item,index)=>{item.type=index<2?'normal':'trash';resolveGoldenGear(index<2?'keep':'reject',item.id);});
      resumeGoldenGearApplication();
      const golden={used:gear.used,pending:gear.pending,applied:gear.alternatives.filter(item=>item.applied).length,fish:state.fish.filter(item=>item.source==='Золотая шестерня').length};

      fresh();
      const choiceGear={id:uid(),key:'goldenGear',name:'Золотая шестерня',used:false};state.dungeon.rewards.push(choiceGear);prepareGoldenGearAlternatives();
      choiceGear.alternatives.forEach((item,index)=>{item.type=index===0?'legendary':'normal';});
      const oldRandom=Math.random;Math.random=()=>.3;
      choiceGear.alternatives.forEach((item,index)=>resolveGoldenGear(index<2?'keep':'reject',item.id));
      const pausedAtChoice=$('choiceDialog').open&&choiceGear.alternatives.filter(item=>item.applied).length===1;
      $('choiceButtons').querySelector('button')?.click();await new Promise(resolve=>setTimeout(resolve,20));Math.random=oldRandom;
      const goldenChoice={pausedAtChoice,used:choiceGear.used,applied:choiceGear.alternatives.filter(item=>item.applied).length};

      fresh();state.castsLeft=4;state.castClicks=6;primordialChaosTriggeredDuringCast=false;processMythic('Искра Хаоса');
      const chaos={explicitSignal:primordialChaosTriggeredDuringCast,resetCasts:state.castsLeft===BALANCE.session.casts,resetClicks:state.castClicks===0,active:state.mythic.primordialChaos};

      const baseTotal=Object.values(BALANCE.catch.baseWeights).reduce((sum,value)=>sum+value,0);
      const normalizedTotal=Object.values(BALANCE.catch.baseWeights).reduce((sum,value)=>sum+value/baseTotal,0);
      return {chrono,afterFirst,afterSecond,etherFinal,compassRollback,chestRollback,golden,goldenChoice,chaos,baseTotal,normalizedTotal};
    });

    assert(result.chrono.persistedButton&&result.chrono.fishCount===0&&result.chrono.castsLeft===9&&result.chrono.snapshotCleared,'Chronocrystal snapshot must survive hydration and remain single-use');
    assert(result.afterFirst===1&&result.afterSecond===0,'Dark Ether debuff rollback must target one debuff instance');
    assert(!result.etherFinal.eligibleAfterFinish&&result.etherFinal.castsUnchanged&&result.etherFinal.fishPresent,'Dark Ether must not reopen a finalized session');
    assert(result.compassRollback.removed&&result.compassRollback.casts===result.compassRollback.expected,`Dark Ether must reverse artifact casts and return exactly one attempt: ${JSON.stringify(result.compassRollback)}`);
    assert(result.chestRollback.created>0&&result.chestRollback.remaining===0,`Dark Ether must remove Bottomless Chest fish: ${JSON.stringify(result.chestRollback)}`);
    assert(result.golden.used&&!result.golden.pending&&result.golden.applied===2&&result.golden.fish===2,`Golden Gear must apply every kept timeline exactly once: ${JSON.stringify(result.golden)}`);
    assert(result.goldenChoice.pausedAtChoice&&result.goldenChoice.used&&result.goldenChoice.applied===2,`Golden Gear must pause and resume around mandatory choices: ${JSON.stringify(result.goldenChoice)}`);
    assert(result.chaos.explicitSignal&&result.chaos.resetCasts&&result.chaos.resetClicks&&result.chaos.active,`Primordial Chaos must expose an explicit reset signal: ${JSON.stringify(result.chaos)}`);
    assert(Math.abs(result.baseTotal-96.25)<1e-9&&Math.abs(result.normalizedTotal-1)<1e-9,'catch weights must normalize to exactly one');
    assert(await page.evaluate(()=>BALANCE.islands.itemChance===.02),'expedition item chance must equal 2%');
    assert(errors.length===0,errors.join('; '));
    process.stdout.write('PASS: temporal rollback, persistence, queue, and weight normalization\n');
  }finally{await browser.close();}
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
