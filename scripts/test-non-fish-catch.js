const assert=require('assert/strict');
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const pageUrl=pathToFileURL(path.resolve('dropfish/index.html')).href;
const output=path.resolve('.visual-test-output/non-fish-catch');
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
        const add=(key,weight,fixed=false)=>makeNonFishCatch({type:'nonFishCatch',nonFishKey:key,weight,fixed});
        const originalRandom=Math.random;
        try{
          const expected=[
            ['japaneseSpiderCrab','Японский краб-паук',15,20],['barrelJellyfish','Корнерот',25,35],['humboldtSquid','Кальмар Гумбольдта',30,45],
            ['tridacnaDerasa','Тридакна дераза',45,90],['sevenArmOctopus','Семирукий осьминог',45,75],['giantSquid','Гигантский кальмар',90,180],
            ['loggerhead','Логгерхед',90,150],['nomuraJellyfish','Медуза Номура',90,180],['giantClam','Гигантская тридакна',100,200],
            ['colossalSquid','Колоссальный кальмар',200,350]
          ];
          ok(NON_FISH_CATCH_CHANCE===.005,'ordinary-cast chance is exactly 0.5 percent');
          ok(JSON.stringify(NON_FISH_CATCHES.map(item=>[item.key,item.name,item.min,item.max]))===JSON.stringify(expected),'ten approved species and ranges');
          ok(new Set(NON_FISH_CATCHES.map(item=>item.file)).size===10&&NON_FISH_CATCHES.every(item=>item.file.endsWith('.webp')),'ten unique WebP assets');
          ok(GUIDE['Не рыбный улов'][0][0]==='Не рыбный улов'&&GUIDE['Не рыбный улов'].slice(1).every(([title])=>title.includes('non-fish-catch-icon')),'guide overview has no species icon while every species keeps its own');

          for(const weather of Object.keys(DATA.weather)){
            state.weather=weather;Math.random=()=>.004;ok(maybeNonFishCatchDescriptor()?.type==='nonFishCatch',`${weather}: below threshold succeeds`);
            Math.random=()=>.005;ok(maybeNonFishCatchDescriptor()===null,`${weather}: threshold itself fails`);
          }
          expected.forEach(([key,name,min,max],index)=>{
            let values=[(index+.25)/10,0];Math.random=()=>values.shift()??0;
            const low=nonFishCatchDescriptor();ok(low.nonFishKey===key&&low.name===name&&low.weight===min,`${name}: inclusive minimum`);
            values=[(index+.25)/10,.999999];Math.random=()=>values.shift()??.999999;
            const high=nonFishCatchDescriptor();ok(high.nonFishKey===key&&high.weight===max&&Math.round(high.weight*10)===high.weight*10,`${name}: inclusive maximum and 0.1 kg step`);
          });

          fresh();state.weather='golden';state.bonuses.push({id:uid(),name:'Подводная маска'},{id:uid(),name:'Ласты'},{id:uid(),name:'Акваланг'});state.debuffs.push({id:uid(),name:'Чайка',active:true},{id:uid(),name:'Рак',active:true},{id:uid(),name:'Утка',active:true},{id:uid(),name:'Косатка',active:true});state.dungeon.wrath=true;state.dungeon.leviaxarWrath=true;state.dungeon.ethirionWrath=true;state.dungeon.vexinonWrath=true;
          const protectedCatch=add('giantSquid',125.4);
          ok(protectedCatch.weight===125.4&&protectedCatch.originalWeight===125.4,'weather, ordinary gear, debuffs and boss wraths do not alter non-fish catch');
          ok(state.fish.length===0&&state.fishCaughtTotal===0&&state.heavyCaughtTotal===0&&state.giantCaughtTotal===0&&!state.hadAnyFish,'non-fish catch never enters fish pools or counters');
          render();ok($('weightLabel').textContent===kg(125.4),'current session weight includes non-fish catch');
          ok(state.history[0].type==='nonFishCatch'&&state.history[0].nonFishCatchId===protectedCatch.id,'dedicated numbered chronology row');
          const restored=hydrateState(serializeState(state));ok(restored.nonFishCatches.length===1&&restored.nonFishCatches[0].weight===125.4,'non-fish catch survives session hydration');

          fresh();const symbioteCatch=add('colossalSquid',200);Math.random=()=>.5;const symbioteResult=symbioteAction();
          ok(symbioteCatch.weight===206&&symbioteCatch.impacts.length===1&&symbioteCatch.impacts[0].source==='Симбиот','Symbiote changes current weight by 2-4 percent');
          ok(symbioteCatch.weight/symbioteCatch.impacts[0].before>=1.02&&symbioteCatch.weight/symbioteCatch.impacts[0].before<=1.04&&symbioteResult[0].includes('Симбиот'),'Symbiote stays within its exclusive range');

          fresh();const exactly100=add('giantClam',100),over100=add('giantClam',100.1),heavy=add('colossalSquid',350),core={id:uid()};const destroyed=destroyCatchByIsotope(core);
          ok(destroyed===1&&exactly100.removed&&exactly100.weight===0&&exactly100.isotopeDestroyed,'isotope destroys current weight up to and including 100 kg');
          ok(!over100.removed&&over100.weight===50.1&&!heavy.removed&&heavy.weight===175,'isotope halves current weight above 100 kg');
          ok(core.destroyedNonFishCatchIds.length===1&&core.reducedNonFishCatchIds.length===2,'isotope records both non-fish outcomes');

          fresh();add('japaneseSpiderCrab',15);add('colossalSquid',200);finishGame();
          ok(state.finalResult.total===215&&state.fish.length===0,'non-fish catch contributes to total without creating fish');
          fresh();add('giantClam',100);state.dungeon.rewards.push({id:uid(),key:'flame',used:false},{id:uid(),key:'singula',activated:true});state.diceFinalMultiplier=5;finishGame();
          ok(state.finalResult.total===551.5,'Burning Core, Pulsating Singula and Hexahedron include non-fish weight');

          fresh();let values=[.004,.05,.5];Math.random=()=>values.shift()??.5;const predicted=mythicCatchDescriptor();
          ok(predicted.type==='nonFishCatch'&&descriptorText(predicted).includes('кг'),'Eye of Storm prediction can contain exact non-fish result');
          executeCatchDescriptor({...predicted,fixed:true});ok(state.nonFishCatches[0].predicted&&state.history[0].detail.includes('Оком Шторма'),'accepted prediction preserves the predicted result');

          fresh();state.castsLeft=3;
          const originalMaybeNonFishCatchDescriptor=maybeNonFishCatchDescriptor;
          maybeNonFishCatchDescriptor=()=>({type:'nonFishCatch',nonFishKey:'japaneseSpiderCrab',weight:15,fixed:false});
          Math.random=()=>.99;castLine();
          maybeNonFishCatchDescriptor=originalMaybeNonFishCatchDescriptor;
          ok(state.nonFishCatches.length===1&&state.history.some(row=>row.type==='nonFishCatch'),'free ordinary cast resolves the independent non-fish roll');
          fresh();state.castsLeft=3;state.rifts.preparedCatch='giant';Math.random=()=>.99;castLine();
          ok(state.nonFishCatches.length===0&&state.fish.some(fish=>fish.category==='giant'),'prepared guaranteed result is not overridden');
          return results;
        }finally{Math.random=originalRandom;}
      });
      assert.equal(errors.length,0,errors.join('\n'));

      for(const [viewportName,viewport] of Object.entries(viewports)){
        await page.setViewportSize(viewport);
        await page.evaluate(()=>{
          document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());reduceMotion=true;document.body.classList.add('reduce-motion');$('effectOverlay').className='effect-overlay';$('effectParticles').innerHTML='';state=initialState();state.weather='sunny';state.weatherSeen=['sunny'];
          NON_FISH_CATCHES.forEach((item,index)=>makeNonFishCatch({type:'nonFishCatch',nonFishKey:item.key,weight:index%2?item.max:item.min}));
          changeNonFishCatchWeight(state.nonFishCatches.at(-1),1.04,'Симбиот');
          const reducible=state.nonFishCatches.find(item=>item.weight>100&&!item.removed);if(reducible){const before=reducible.weight;reducible.weight=round1(before*.5);reducible.impacts.push({source:ISOTOPE_CORE_NAME,type:'weight',before,after:reducible.weight,factor:.5});}
          render();
          document.querySelectorAll('.history-item.type-nonFishCatch.is-expandable').forEach(row=>setHistoryRowExpanded(row.dataset.historyId,true));
          const scroll=$('historyScroll');scroll.style.setProperty('scroll-behavior','auto','important');scroll.scrollTop=scroll.scrollHeight;
        });
        await page.waitForFunction(()=>[...document.querySelectorAll('.non-fish-catch-icon img')].every(image=>image.complete&&image.naturalWidth>0));
        await page.waitForTimeout(180);
        const metrics=await page.evaluate(()=>{
          const rows=[...document.querySelectorAll('.history-item.type-nonFishCatch')],icons=[...document.querySelectorAll('.history-item.type-nonFishCatch .non-fish-catch-icon')],impacts=[...document.querySelectorAll('.non-fish-impact')];
          return {
            overflow:document.documentElement.scrollWidth>innerWidth+1,
            rows:rows.length,
            rowWidths:rows.map(row=>({width:row.getBoundingClientRect().width,scroll:row.scrollWidth})),
            rowHeights:rows.map(row=>row.getBoundingClientRect().height),
            iconBoxes:icons.map(icon=>({width:icon.getBoundingClientRect().width,height:icon.getBoundingClientRect().height})),
            impactWidths:impacts.map(impact=>({width:impact.getBoundingClientRect().width,parent:impact.parentElement.getBoundingClientRect().width})),
            missing:[...document.querySelectorAll('.non-fish-catch-icon img')].filter(image=>!image.complete||!image.naturalWidth).length,
            guide:GUIDE['Не рыбный улов']?.length===11
          };
        });
        assert.equal(metrics.overflow,false,`${engine} ${viewportName}: no page overflow`);
        assert.equal(metrics.rows,10,`${engine} ${viewportName}: all chronology rows`);
        assert(metrics.rowWidths.every(box=>box.scroll<=box.width+1),`${engine} ${viewportName}: bounded chronology content`);
        assert(metrics.rowHeights.every(height=>height<=92),`${engine} ${viewportName}: compact chronology rows`);
        assert(metrics.iconBoxes.every(box=>box.width<=47&&box.height<=47),`${engine} ${viewportName}: compact icons`);
        assert(metrics.impactWidths.every(box=>box.width<=box.parent+1),`${engine} ${viewportName}: wrapped effect badges`);
        assert(metrics.missing===0&&metrics.guide,`${engine} ${viewportName}: assets and guide`);
        await page.screenshot({path:path.join(output,`${engine}-${viewportName}.png`),fullPage:false});
      }
      console.log(`${engine}: ${checks.length} mechanics checks, ${Object.keys(viewports).length} visual sizes PASS`);
    }finally{await browser.close();}
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
