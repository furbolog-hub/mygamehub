const path=require('path');
const {pathToFileURL}=require('url');
const {chromium}=require('playwright');

const pagePath=path.join(__dirname,'..','dropfish','index.html');
const assert=(value,message)=>{if(!value)throw new Error(message);};

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(pathToFileURL(pagePath).href,{waitUntil:'load'});
    const result=await page.evaluate(async()=>{
      const fresh=()=>{$('choiceDialog')?.close();state=initialState();state.weatherSeen=[state.weather];ensureDungeon();ensureIslands();};
      const flask=()=>({id:uid(),key:'firstWaterFlask',name:'Флакон Первой Воды',icon:'🧪',exchanged:false,islandTrade:true});

      fresh();
      const directFlask=flask();state.tradeItems.push(directFlask);render();
      const directButton=Boolean(document.querySelector('[data-island-item-use="firstWaterFlask"]'));
      document.querySelector('[data-island-item-use="firstWaterFlask"]')?.click();
      const direct={button:directButton,consumed:directFlask.exchanged,megalodon:state.megalodon,artifact:state.artifacts.some(a=>a.name==='Плавник мегалодона')};
      const persisted=hydrateState(serializeState(state));
      direct.persisted=persisted.megalodon&&persisted.tradeItems.find(item=>item.id===directFlask.id)?.exchanged;

      fresh();
      state.islands.unstablePresence=true;
      const staleFlask=flask();state.tradeItems.push(staleFlask);useFirstWaterFlask();
      const stale={consumed:staleFlask.exchanged,megalodon:state.megalodon,unstable:state.islands.unstablePresence};

      fresh();
      const activeFlask=flask();state.tradeItems.push(activeFlask);
      state.fish.push({id:uid(),name:'искажённая рыба',category:'normal',originalWeight:10,weight:10,removed:false,islandColossus:false,islandDistorted:true,islandOriginalWeight:20,islandDistortedWeight:10});
      state.fish.push({id:uid(),name:'Абиссалор',category:'islandColossus',originalWeight:150,weight:150,removed:false,islandColossus:true});
      useFirstWaterFlask();
      const restoredFish=state.fish.find(f=>f.name==='искажённая рыба');
      const active={consumed:activeFlask.exchanged,megalodon:state.megalodon,weight:restoredFish.weight,weakening:state.islands.firstWaterWeakening};

      fresh();
      const flaskA=flask(),flaskB=flask();state.tradeItems.push(flaskA,flaskB);render();
      const beforeLabel=document.querySelector('[data-island-item-use="firstWaterFlask"]')?.textContent||'';
      document.querySelector('[data-island-item-use="firstWaterFlask"]')?.click();render();
      const afterLabel=document.querySelector('[data-island-item-use="firstWaterFlask"]')?.textContent||'';
      const multiple={beforeLabel,afterLabel,remaining:state.tradeItems.filter(item=>item.key==='firstWaterFlask'&&!item.exchanged).length};

      fresh();
      const ether={id:uid(),key:'darkEther',name:'Тёмный эфир',used:false,charges:5};state.dungeon.rewards.push(ether);state.dungeon.darkEtherArmedId=ether.id;
      state.megalodon=true;processDebuff('Рак');const blockedDebuffRow=state.history.at(-1);
      state.megalodon=false;processDebuff('Рак');const validDebuffRow=state.history.at(-1);
      processBonus('Ласты');const bonusRow=state.history.at(-1);undoBonusById(bonusRow.bonusId);
      processTrash();const trashRow=state.history.at(-1),trash=state.trash.find(item=>item.historyRowId===trashRow.id);trash.converted=true;
      const artifactRow=processEpic('Компас потерянных глубин'),artifact=state.artifacts.find(item=>item.id===artifactRow.artifactId);artifact.traded=true;
      const eligibility={blockedDebuff:darkEtherEligibleRow(blockedDebuffRow),validDebuff:darkEtherEligibleRow(validDebuffRow),removedBonus:darkEtherEligibleRow(bonusRow),convertedTrash:darkEtherEligibleRow(trashRow),tradedArtifact:darkEtherEligibleRow(artifactRow)};
      const castsBefore=state.castsLeft;useDarkEtherOnRow(blockedDebuffRow.id);eligibility.blockedUnchanged=state.castsLeft===castsBefore&&ether.charges===5;
      useDarkEtherOnRow(validDebuffRow.id);eligibility.validApplied=state.castsLeft===castsBefore+1&&ether.charges===4&&!state.debuffs.find(item=>item.id===validDebuffRow.debuffId)?.active;

      fresh();
      const blood={id:uid(),key:'blood',name:'Кровь Левиаксара',used:false,charges:2};state.dungeon.rewards.push(blood);
      state.debuffs.push({id:uid(),name:'Чайка',active:false},{id:uid(),name:'Рак',active:true});
      useLeviaxarBlood(blood.id);$('choiceButtons').querySelector('button')?.click();
      const bloodChoices=[...$('choiceButtons').querySelectorAll('button')].map(button=>button.textContent);

      fresh();
      const shell={id:uid(),key:'moonTideShell',name:'Раковина лунного прилива',exchanged:true,moonShellUsed:true};state.tradeItems.push(shell);state.islands.moonShellActiveId=shell.id;ensureIslands();
      const shellState={activeId:state.islands.moonShellActiveId};

      fresh();
      state.tradeShipArrived=true;state.tradeShipCompleted=false;state.tradeShipSource='natural';state.tradeShipHistoryId=addHistory('Торговое судно прибыло','tradeShip','',{numbered:false}).id;
      const gem={id:uid(),key:'temporalGem',name:'Темпоральный самоцвет',exchanged:false,dungeonReward:true},gem2={id:uid(),key:'temporalGem',name:'Темпоральный самоцвет',exchanged:false,dungeonReward:true};state.tradeItems.push(gem,gem2);
      const gemFishBefore=state.fish.length;exchangeAllTradeItems();
      const temporalTrade={exchanged:gem.exchanged&&gem2.exchanged,giants:state.fish.slice(gemFishBefore).filter(f=>f.category==='giant'&&f.source==='Темпоральный самоцвет').length};

      fresh();
      state.rifts.obsidianArmed='missing-relic';
      const staleObsidianResult=changeWeatherRandomly('Тест устаревшего флага');
      const staleObsidian={result:staleObsidianResult,armed:state.rifts.obsidianArmed,dialog:$('choiceDialog').open};
      fresh();
      const obsidian={id:uid(),name:'Обсидиановый ключ',used:false};state.rifts.relics.push(obsidian);state.rifts.obsidianArmed=obsidian.id;
      const validObsidianResult=changeWeatherRandomly('Тест ключа');const validDialog=$('choiceDialog').open;$('choiceButtons').querySelector('button')?.click();
      const validObsidian={result:validObsidianResult,dialog:validDialog,used:obsidian.used,armed:state.rifts.obsidianArmed};

      fresh();
      state.tradeShipChecked=true;state.castsLeft=1;
      state.dungeon.rewards.push({id:uid(),key:'chronocrystal',name:'Хронокристалл',used:false});
      const finalChronoSnapshot=createChronoSnapshot(),finalChronoFish=makeFish('normal','Заброс',true,{initialWeight:4,fishName:'последняя рыба'}),finalChronoRow=state.history.find(row=>row.fishId===finalChronoFish.id);
      state.castsLeft=0;state.dungeon.chronoSnapshot=finalChronoSnapshot;state.dungeon.chronoCurrentRowId=finalChronoRow.id;render();maybeFinalizeSession();
      const chronoPaused=!state.finished&&Boolean(document.querySelector('[data-chrono-keep]'));document.querySelector('[data-chrono-keep]')?.click();
      const finalChrono={paused:chronoPaused,finished:state.finished,snapshotCleared:!state.dungeon.chronoSnapshot};

      fresh();
      state.tradeShipChecked=true;const finalEther={id:uid(),key:'darkEther',name:'Тёмный эфир',used:false,charges:5};state.dungeon.rewards.push(finalEther);state.dungeon.darkEtherArmedId=finalEther.id;
      const finalEtherFish=makeFish('normal','Заброс',true,{initialWeight:3,fishName:'последняя эфирная рыба'});state.castsLeft=0;render();maybeFinalizeSession();
      const etherPaused=!state.finished;armDarkEther(finalEther.id);
      const finalEtherState={paused:etherPaused,finished:state.finished,armed:state.dungeon.darkEtherArmedId};

      fresh();
      state.castsLeft=2;const eyeA={id:uid(),key:'eye',name:'Око Балистьера',used:false,bonusCastsRemaining:1},eyeB={id:uid(),key:'eye',name:'Око Балистьера',used:false,bonusCastsRemaining:1};state.dungeon.rewards.push(eyeA,eyeB);
      const eyeFishBefore=state.fish.length,eyeRandom=Math.random;Math.random=()=>.5;castLine();Math.random=eyeRandom;const eyeFish=state.fish.slice(eyeFishBefore);
      const stackedEyes={used:eyeA.used&&eyeB.used,remaining:eyeA.bonusCastsRemaining+eyeB.bonusCastsRemaining,fish:eyeFish.length,categories:eyeFish.map(f=>f.category).sort(),hiddenWeightBonus:eyeFish.some(f=>f.ballistierEyeImpact)};

      fresh();
      const singulaA={id:uid(),key:'singula',name:'Пульсирующая сингула',used:false,activated:true},singulaB={id:uid(),key:'singula',name:'Пульсирующая сингула',used:false,activated:true};state.dungeon.rewards.push(singulaA,singulaB);state.dungeon.singulaFinalBonus=true;
      const singulaFish=makeFish('normal','Заброс',true,{initialWeight:10,fishName:'рыба двух сингул'}),singulaCount=activeSingulaCount();
      const stackedSingulas={count:singulaCount,weight:singulaFish.weight,impactCount:singulaFish.singulaImpact?.count,factor:singulaFish.singulaImpact?.factor};

      fresh();
      const pendingSingula={id:uid(),key:'singula',name:'Пульсирующая сингула',used:false,activated:false};state.dungeon.rewards.push(pendingSingula);state.castsLeft=0;state.tradeShipChecked=true;state.tradeShipCompleted=true;maybeFinalizeSession();const heldOpen=!state.finished;processTrash();processTrash();processTrash();usePulsatingSingula(pendingSingula.id);document.querySelector('#choiceButtons button:last-child')?.click();render();const threadTrashRows=[...document.querySelectorAll('.history-item.type-trash.is-thread-removed')];const singulaThreadResume={heldOpen,finished:state.finished,castsLeft:state.castsLeft,castDisabled:document.querySelector('#castBtn')?.disabled,rows:threadTrashRows.length,greenReturns:threadTrashRows.filter(row=>row.querySelector('.thread-returned-cast')).length,grayIcons:threadTrashRows.map(row=>getComputedStyle(row.querySelector('.trash-entity-icon img')).filter)};

      fresh();
      const pearlA={id:uid(),key:'pearl',name:'Жемчужина',used:false,bonusArtifacts:0,bonusAngus:0},pearlB={id:uid(),key:'pearl',name:'Жемчужина',used:false,bonusArtifacts:0,bonusAngus:0};state.dungeon.rewards.push(pearlA,pearlB);
      const pearlRow=addHistory('Проверка жемчужин','fish','',{numbered:true}),pearlItemsBefore=state.tradeItems.length,pearlArtifactsBefore=state.artifacts.length,pearlRandom=Math.random;Math.random=()=>.1;grantPearlTradeItems(pearlRow);rollPearlArtifact();Math.random=pearlRandom;
      const stackedPearls={items:state.tradeItems.length-pearlItemsBefore,artifacts:state.artifacts.length-pearlArtifactsBefore,counters:[pearlA.bonusArtifacts,pearlB.bonusArtifacts]};

      fresh();
      state.weather='sunny';state.weatherSeen=['sunny'];state.tradeShipChecked=true;state.castsLeft=0;for(let i=0;i<4;i++)makeFish('normal','Заброс',true,{initialWeight:10,fishName:`панцирная рыба ${i+1}`});
      const carapaceA={id:uid(),key:'carapace',name:'Панцирная чешуя',used:false},carapaceB={id:uid(),key:'carapace',name:'Панцирная чешуя',used:false};state.dungeon.rewards.push(carapaceA,carapaceB);finishGame();
      const stackedCarapaces={weights:[carapaceA.finalWeight,carapaceB.finalWeight],maxFishWeight:Math.max(...state.fish.map(f=>f.weight))};

      fresh();
      ['abyss','blood','darkCoal','singula','darkEther'].forEach(key=>state.dungeon.rewards.push({id:uid(),key,name:key,used:false,charges:key==='blood'?2:key==='darkEther'?5:undefined}));
      render();
      const dungeonButtons=[...document.querySelectorAll('[data-dungeon-reward]')].map(button=>state.dungeon.rewards.find(item=>item.id===button.dataset.dungeonReward)?.key).filter(Boolean);

      return {direct,stale,active,multiple,eligibility,bloodChoices,shellState,temporalTrade,staleObsidian,validObsidian,finalChrono,finalEtherState,stackedEyes,stackedSingulas,singulaThreadResume,stackedPearls,stackedCarapaces,dungeonButtons};
    });

    assert(result.direct.button&&result.direct.consumed&&result.direct.megalodon&&result.direct.artifact&&result.direct.persisted,`Flask direct path failed: ${JSON.stringify(result.direct)}`);
    assert(result.stale.consumed&&result.stale.megalodon&&!result.stale.unstable,`Flask stale flag path failed: ${JSON.stringify(result.stale)}`);
    assert(result.active.consumed&&!result.active.megalodon&&result.active.weight===15&&result.active.weakening,`Flask unstable path failed: ${JSON.stringify(result.active)}`);
    assert(result.multiple.beforeLabel.includes('×2')&&result.multiple.afterLabel.includes('×1')&&result.multiple.remaining===1,`Flask count/consumption failed: ${JSON.stringify(result.multiple)}`);
    assert(!result.eligibility.blockedDebuff&&result.eligibility.validDebuff&&!result.eligibility.removedBonus&&!result.eligibility.convertedTrash&&!result.eligibility.tradedArtifact&&result.eligibility.blockedUnchanged&&result.eligibility.validApplied,`Dark Ether eligibility failed: ${JSON.stringify(result.eligibility)}`);
    assert(result.bloodChoices.length===1&&result.bloodChoices[0]==='Рак',`Blood must list active debuffs only: ${JSON.stringify(result.bloodChoices)}`);
    assert(result.shellState.activeId===null,'Consumed Moon Shell must not remain active');
    assert(result.temporalTrade.exchanged&&result.temporalTrade.giants===12,`Trade All must exchange every Temporal Gem for six giants: ${JSON.stringify(result.temporalTrade)}`);
    assert(!result.staleObsidian.result&&!result.staleObsidian.armed&&!result.staleObsidian.dialog,`Stale Obsidian Key state must fall back to normal weather: ${JSON.stringify(result.staleObsidian)}`);
    assert(result.validObsidian.result&&result.validObsidian.dialog&&result.validObsidian.used&&!result.validObsidian.armed,`Valid Obsidian Key must be consumed after choice: ${JSON.stringify(result.validObsidian)}`);
    assert(result.finalChrono.paused&&result.finalChrono.finished&&result.finalChrono.snapshotCleared,`Chronocrystal must resolve before finalization: ${JSON.stringify(result.finalChrono)}`);
    assert(result.finalEtherState.paused&&result.finalEtherState.finished&&!result.finalEtherState.armed,`Armed Dark Ether must pause finalization and resume after cancellation: ${JSON.stringify(result.finalEtherState)}`);
    assert(result.stackedEyes.used&&result.stackedEyes.remaining===0&&result.stackedEyes.fish===6&&!result.stackedEyes.hiddenWeightBonus&&result.stackedEyes.categories.filter(x=>x==='normal').length===2&&result.stackedEyes.categories.filter(x=>x==='heavy').length===2&&result.stackedEyes.categories.filter(x=>x==='giant').length===2,`Stacked Ballistier Eyes must resolve independently without an undocumented weight bonus: ${JSON.stringify(result.stackedEyes)}`);
    assert(result.stackedSingulas.count===2&&result.stackedSingulas.weight===16.9&&result.stackedSingulas.impactCount===2&&Math.abs(result.stackedSingulas.factor-1.69)<1e-9,`Stacked Pulsating Singulas must resolve independently: ${JSON.stringify(result.stackedSingulas)}`);
    assert(result.singulaThreadResume.heldOpen&&!result.singulaThreadResume.finished&&result.singulaThreadResume.castsLeft===3&&!result.singulaThreadResume.castDisabled,`Singula must keep the session open and make Thread-returned casts usable: ${JSON.stringify(result.singulaThreadResume)}`);
    assert(result.singulaThreadResume.rows===3&&result.singulaThreadResume.greenReturns===3&&result.singulaThreadResume.grayIcons.every(value=>value.includes('grayscale(1)')),`Thread-removed trash must use gray icons and green returned-cast text: ${JSON.stringify(result.singulaThreadResume)}`);
    assert(result.stackedPearls.items===2&&result.stackedPearls.artifacts===2&&result.stackedPearls.counters.every(value=>value===1),`Stacked Corrupted Pearls must resolve independently: ${JSON.stringify(result.stackedPearls)}`);
    assert(result.stackedCarapaces.weights.every(value=>value===40)&&result.stackedCarapaces.maxFishWeight===40,`Stacked Carapace Scales must share the same pre-effect clean weight: ${JSON.stringify(result.stackedCarapaces)}`);
    assert(['abyss','blood','darkCoal','singula','darkEther'].every(key=>result.dungeonButtons.includes(key)),`Dungeon reward UI coverage failed: ${JSON.stringify(result.dungeonButtons)}`);
    assert(errors.length===0,errors.join('; '));
    process.stdout.write('PASS: activatable items, stale-state guards, Dark Ether eligibility, and persistence\n');
  }finally{await browser.close();}
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
