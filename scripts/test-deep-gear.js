const assert=require('assert/strict');
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const pageUrl=pathToFileURL(path.resolve('dropfish/index.html')).href;
const output=path.resolve('.visual-test-output/deep-gear');
const viewports={
  desktop:{width:1280,height:900},
  phonePortrait:{width:390,height:844},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:820,height:1180},
  tabletLandscape:{width:1180,height:820}
};

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  for(const [engine,browserType] of Object.entries({chromium,webkit})){
    const browser=await browserType.launch({headless:true});
    try{
      const page=await browser.newPage({viewport:viewports.desktop}),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(pageUrl,{waitUntil:'load'});
      const checks=await page.evaluate(()=>{
        const results=[];
        const ok=(value,label)=>{if(!value)throw new Error(label);results.push(label);};
        const fresh=()=>{document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());state=initialState();state.weather='sunny';state.weatherSeen=['sunny'];render();};
        const originalRandom=Math.random;
        try{
          ok(BALANCE.deepGear.containerChance.dangerousWeather===.04&&BALANCE.deepGear.containerChance.default===.02,'container chances are configurable');
          ok(JSON.stringify(BALANCE.deepGear.componentCountWeights)===JSON.stringify({1:60,2:30,3:10}),'component distribution is configurable');
          fresh();state.weather='storm';ok(deepGearContainerChance()===.04,'storm chance');state.weather='thunder';ok(deepGearContainerChance()===.04,'thunder chance');state.weather='rain';ok(deepGearContainerChance()===.02,'ordinary weather chance');
          for(const [randomValue,rank] of [[.1,1],[.7,2],[.95,3]]){Math.random=()=>randomValue;ok(rollDeepGearRank()===rank,`rank ${rank} distribution boundary`);}
          for(const rank of [1,2,3]){const components=deepGearComponentsForRank(rank);ok(components.length===rank&&new Set(components).size===rank,`rank ${rank} unique components`);}

          fresh();Math.random=()=>.5;state.castsLeft=1;state.rifts.preparedCatch='giant';const prepared=state.rifts.preparedCatch;resolveDeepEquipmentCast(2);
          ok(state.deepGear.pending&&state.deepGear.rank===2&&state.deepGear.components.length===2,'container equips rank II');
          ok(state.castsLeft===1&&state.deepGear.bonusCast,'last-cast container grants dedicated cast');
          ok(state.fish.length===0&&state.fishCaughtTotal===0,'container is not a fish and adds no weight');
          ok(state.rifts.preparedCatch===prepared,'prepared catch survives container');
          const containerRow=state.history.find(row=>row.type==='deepEquipment');
          ok(containerRow?.numbered&&containerRow.deepGearComponents.length===2,'single compact container chronology row');
          const restored=hydrateState(serializeState(state));ok(restored.deepGear.pending&&restored.deepGear.rank===2,'pending gear survives reload in same session');
          const fish=resolveDeepFishingCast();
          ok(fish.deepSea&&fish.category==='deep'&&fish.deepRank===2,'deep cast uses independent category');
          ok(DEEP_FISH_RANKS[2].fish.some(item=>item.name===fish.name)&&fish.originalWeight>=100.1&&fish.originalWeight<=200,'rank II pool and range');
          ok(!state.deepGear.pending&&state.deepGear.rank===0&&!state.deepGear.components.length,'gear clears after one cast');
          ok(state.rifts.preparedCatch===prepared,'prepared catch survives deep cast');
          ok(state.fishCaughtTotal===1&&state.heavyCaughtTotal===0&&state.giantCaughtTotal===0,'only total fish count increments');
          ok(!availableSacrificeFish().includes(fish)&&!dungeonAvailableFish().includes(fish),'deep fish cannot be sacrificed');

          const beforeAbyss=fish.weight;changeAbyssFishWeight(fish,.7,'Паразит');ok(fish.weight>beforeAbyss,'abyss negative action becomes growth');
          const afterAbyss=fish.weight;setFishAbyssLost(fish,'Уничтожена Разрушителем');ok(!fish.removed&&fish.weight===afterAbyss,'abyss cannot destroy deep fish');
          grantBonus('Подводная маска');grantBonus('Акваланг');state.debuffs.push({id:uid(),name:'Косатка',active:true});ok(finalFishSnapshot().find(item=>item.id===fish.id)?.weight===fish.weight,'bonuses and final orca do not affect deep fish');
          processDebuff('Чайка');processDebuff('Косатка');ok(!fish.removed,'seagull and orca ignore deep fish');
          state.dungeon.wrath=true;fish.smoldering=false;smolderFishBeforeCast();ok(!fish.smoldering&&!fish.removed,'Ballistier wrath immunity');
          const beforeLeviaxar=fish.weight;applyLeviaxarWrath();ok(!fish.removed&&fish.weight===beforeLeviaxar,'Leviaxar wrath immunity');
          fish.luminarImpacts=[{before:fish.weight-5,after:fish.weight}];applyEthirionWrath();ok(!fish.removed&&fish.weight===beforeLeviaxar,'Ethirion wrath immunity');

          fresh();Math.random=()=>.5;
          state.artifacts.push({id:'luminar',name:'Люминар Удильщика',tier:'mythic'},{id:'spark',name:'Искра Хаоса',tier:'mythic',sparkRemaining:5},{id:'scale',name:'Чешуя Левиафана',tier:'epic'});
          state.mythic.threadPendingBoosts.push({threadId:'thread',plus:7,trashId:null,rowId:null});
          state.rifts.temporaryEffects.push({id:'rift-effect',name:'Багровая сила',casts:1,value:1.3});
          state.pendingCoinBoosts.push({coinId:null,rowId:null,add:5,name:'Око скрытой бездны',type:'gold'});
          state.rifts.crystalArmed=true;state.deepGear={pending:true,rank:3,components:['hook','line','reel'],bonusCast:false,containerHistoryId:null};
          const artifactFish=makeDeepFish(3).fish;
          ok(artifactFish.category==='deep'&&artifactFish.luminarImpacts?.length===1&&artifactFish.leviathanImpact&&artifactFish.threadImpacts?.length===1&&artifactFish.sparkImpacts?.length===1&&artifactFish.riftEffectImpacts?.length===1&&artifactFish.coinImpacts?.some(impact=>impact.name==='Око скрытой бездны'),'artifacts and relic effects interact without changing deep category');
          ok($('choiceDialog').open&&!state.rifts.crystalArmed,'crystal relic offers an alternative for deep fish');$('choiceButtons').firstElementChild.click();

          fresh();Math.random=()=>.5;state.islands.unstablePresence=true;state.deepGear={pending:true,rank:1,components:['hook'],bonusCast:false,containerHistoryId:null};const unstableFish=makeDeepFish(1).fish;
          ok(unstableFish.deepUnstableApplied&&unstableFish.weight===round1(unstableFish.deepUnstableImpact.before*.8),'unstable presence applies exactly minus 20 percent');
          markFishDisplaced(unstableFish);ok(!unstableFish.removed,'unstable presence never displaces deep fish');
          const beforeCore=unstableFish.weight,core={id:uid(),deepBoostedFishIds:[]};destroyCatchByIsotope(core);
          ok(!unstableFish.removed&&unstableFish.weight===round1(beforeCore*1.3)&&core.deepBoostedFishIds.includes(unstableFish.id),'isotope explosion adds 30 percent and preserves deep fish');

          fresh();for(const rank of [1,2,3]){state.deepGear={pending:true,rank,components:deepGearComponentsForRank(rank),bonusCast:false,containerHistoryId:null};for(let i=0;i<20;i++){const sample=makeDeepFish(rank).fish,range=BALANCE.deepGear.ranks[rank];ok(sample.originalWeight>=range.min&&sample.originalWeight<=range.max&&Math.round(sample.originalWeight*10)===sample.originalWeight*10,`rank ${rank} inclusive tenths ${i+1}`);sample.removed=true;}}
          ok(!state.fish.some(item=>item.category!=='deep'),'closed deep pool');
          return results;
        }finally{Math.random=originalRandom;}
      });
      assert.equal(errors.length,0,errors.join('\n'));

      for(const [viewportName,viewport] of Object.entries(viewports)){
        await page.setViewportSize(viewport);
        await page.evaluate(()=>{
          state=initialState();state.weather='storm';state.weatherSeen=['storm'];
          for(const rank of [1,2,3]){
            const row=grantDeepGear(rank);state.deepGear={pending:true,rank,components:[...row.deepGearComponents],bonusCast:false,containerHistoryId:row.id};
            makeDeepFish(rank);state.deepGear={pending:false,rank:0,components:[],bonusCast:false,containerHistoryId:null};
          }
          grantDeepGear(2);render();
        });
        await page.waitForFunction(()=>[...document.querySelectorAll('.deep-gear-icon img,.deep-fish-icon img')].every(image=>image.complete&&image.naturalWidth>0));
        await page.evaluate(()=>document.querySelectorAll('.history-item.type-deepEquipment').forEach(row=>setHistoryRowExpanded(row.dataset.historyId,true)));
        await page.evaluate(()=>{const scroll=$('historyScroll');scroll.style.setProperty('scroll-behavior','auto','important');scroll.scrollTop=scroll.scrollHeight;});
        await page.waitForTimeout(180);
        const metrics=await page.evaluate(()=>{
          const chip=document.querySelector('.chip.effect-deep'),chipBox=chip?.getBoundingClientRect(),button=$('castBtn'),buttonBox=button.getBoundingClientRect();
          const containerRows=[...document.querySelectorAll('.history-item.type-deepEquipment')],fishRows=[...document.querySelectorAll('.history-item.type-fish:has(.deep-fish-icon)')];
          const containerDetails=containerRows.map(row=>row.querySelector('.deep-equipment-detail'));
          return {
            overflow:document.documentElement.scrollWidth>innerWidth+1,
            chip:chipBox?{width:chipBox.width,height:chipBox.height}:null,
            button:{height:buttonBox.height,text:button.textContent.trim(),ariaLabel:button.getAttribute('aria-label')||'',title:button.title,cluster:button.querySelectorAll('.deep-gear-cluster .deep-gear-icon').length},
            containerRows:containerRows.length,
            containerHeights:containerRows.map(row=>row.getBoundingClientRect().height),
            expanded:containerRows.every(row=>row.querySelector('.history-row-details')?.hidden===false),
            detailHeights:containerDetails.map(detail=>detail?.getBoundingClientRect().height||0),
            oneLine:containerDetails.every(detail=>detail&&detail.scrollHeight<=detail.clientHeight+1),
            componentCounts:containerDetails.map(detail=>detail?.querySelectorAll('.deep-equipment-component').length||0),
            fishRows:fishRows.length,
            missing:[...document.querySelectorAll('.deep-gear-icon img,.deep-fish-icon img')].filter(image=>!image.complete||!image.naturalWidth).length,
            guide:Boolean(GUIDE['Глубинные']?.length===11)
          };
        });
        assert.equal(metrics.overflow,false,`${engine} ${viewportName}: no horizontal overflow`);
        assert(metrics.chip&&metrics.chip.width<=148&&metrics.chip.height<=60,`${engine} ${viewportName}: compact effect chip`);
        assert(metrics.button.text==='ЗАБРОС'&&metrics.button.ariaLabel==='Глубинный заброс'&&metrics.button.title==='Глубинный заброс'&&metrics.button.cluster===2&&metrics.button.height>=60&&metrics.button.height<=64,`${engine} ${viewportName}: rank II cast button ${JSON.stringify(metrics.button)}`);
        assert.equal(metrics.containerRows,4,`${engine} ${viewportName}: container rows`);
        assert(metrics.containerHeights.every(height=>height<=105),`${engine} ${viewportName}: compact expanded chronology ${JSON.stringify(metrics.containerHeights)}`);
        assert(metrics.expanded&&metrics.detailHeights.every(height=>height>0&&height<=30)&&metrics.oneLine,`${engine} ${viewportName}: expanded container details stay on one line ${JSON.stringify({expanded:metrics.expanded,detailHeights:metrics.detailHeights,oneLine:metrics.oneLine})}`);
        assert.deepEqual(metrics.componentCounts,[1,2,3,2],`${engine} ${viewportName}: all awarded components stay in their container row`);
        assert(metrics.fishRows===3&&metrics.missing===0&&metrics.guide,`${engine} ${viewportName}: visuals and guide`);
        await page.screenshot({path:path.join(output,`${engine}-${viewportName}.png`),fullPage:false});
      }
      console.log(`${engine}: ${checks.length} mechanics checks, ${Object.keys(viewports).length} visual sizes PASS`);
    }finally{await browser.close();}
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
