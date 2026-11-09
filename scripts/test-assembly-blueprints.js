const path=require('path');
const fs=require('fs');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const pagePath=path.join(__dirname,'..','dropfish','index.html');
const assert=(value,message)=>{if(!value)throw new Error(message);};
const viewports={
  desktop:{width:1440,height:900},
  phonePortrait:{width:390,height:844},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:820,height:1180},
  tabletLandscape:{width:1180,height:820}
};

(async()=>{
  const output=path.join(__dirname,'..','test-results','assembly-blueprints');
  fs.mkdirSync(output,{recursive:true});
  for(const [engine,launcher] of Object.entries({chromium,webkit})){
    const browser=await launcher.launch({headless:true});
    try{
      const page=await browser.newPage({viewport:viewports.desktop}),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(pathToFileURL(pagePath).href,{waitUntil:'load'});
      const mechanics=await page.evaluate(()=>{
        const fresh=()=>{state=initialState();state.weatherSeen=[state.weather];ensureAssemblyState();};
        const addTrash=count=>{for(let i=0;i<count;i++)state.trash.push({id:uid(),name:`тестовый хлам ${i+1}`,converted:false,recyclonEligible:true});};
        const addCastFish=(category,weight,name)=>{const fish={id:uid(),name,category,originalWeight:weight,weight,source:'Заброс',direct:true,removed:false,tags:[]};state.fish.push(fish);return fish;};
        const addTrade=(fish,index=1)=>{const item={id:uid(),key:`test${index}`,name:`Предмет обмена ${index}`,icon:'',fishId:fish.id,historyRowId:null,exchanged:false};state.tradeItems.push(item);return item;};

        fresh();
        const reel=grantAssemblyBlueprint('reverseReel',{numbered:true});addTrash(2);const reelFish=addCastFish('normal',4.2,'рыба катушки');
        const readyBefore=assemblyBlueprintReady(reel);assembleBlueprint(reel.id,{fishId:reelFish.id,tradeIds:[]});
        const reelResult={readyBefore,built:reel.stage==='built',casts:state.castsLeft,fishConsumed:reelFish.removed};

        fresh();
        const converter=grantAssemblyBlueprint('converterXb1',{numbered:true});addTrash(3);const converterFish=addCastFish('normal',3.4,'рыба преобразователя');
        const oldRandom=Math.random;Math.random=()=>.5;assembleBlueprint(converter.id,{fishId:converterFish.id,tradeIds:[]});Math.random=oldRandom;
        const converterResult={built:converter.stage==='built',category:converterFish.category,weight:converterFish.weight,removed:converterFish.removed};

        fresh();
        const materializer=grantAssemblyBlueprint('shipMaterializer',{numbered:true});addTrash(4);const heavy=addCastFish('heavy',14,'рыба материализатора'),materialTrade=addTrade(heavy);
        assembleBlueprint(materializer.id,{fishId:heavy.id,tradeIds:[materialTrade.id]});
        const materialGiants=state.fish.filter(f=>f.source==='Преобразовано Xb1');
        const materializerResult={built:materializer.stage==='built',consumed:heavy.removed&&materialTrade.exchanged,giants:materialGiants.length,categories:materialGiants.map(f=>f.category)};

        fresh();
        const sonar=grantAssemblyBlueprint('echoSounder',{numbered:true});addTrash(2);const sonarFish=addCastFish('normal',2,'рыба эхолота'),tradeA=addTrade(sonarFish,1),tradeB=addTrade(sonarFish,2);
        assembleBlueprint(sonar.id,{fishId:null,tradeIds:[tradeA.id,tradeB.id]});
        const sonarRandom=Math.random,sonarCategories=[];for(const roll of [.1,.6,.9]){Math.random=()=>roll;const before=state.fish.length;applyEchoSounderAfterOrdinaryCast(null);sonarCategories.push(state.fish.slice(before).at(-1)?.category);}Math.random=sonarRandom;
        const sonarResult={charges:sonar.charges,categories:sonarCategories};

        fresh();
        const buoyA=grantAssemblyBlueprint('guardBuoy',{numbered:true}),buoyB=grantAssemblyBlueprint('guardBuoy',{numbered:true});
        buoyA.stage='built';buoyA.charges=2;buoyB.stage='built';buoyB.charges=2;
        state.debuffs.push({id:uid(),name:'Косатка',active:true});const protectedFish=addCastFish('normal',6,'рыба под защитой');enforceOrca(protectedFish);
        const persistedBuoyState=hydrateState(serializeState(state));
        const buoyResult={protected:!protectedFish.removed,charges:assemblyDeviceCharges('guardBuoy'),persistedCharges:persistedBuoyState.assembly.blueprints.filter(item=>item.deviceKey==='guardBuoy').reduce((sum,item)=>sum+item.charges,0)};

        fresh();state.weather='sunny';
        const debuffBuoy=grantAssemblyBlueprint('guardBuoy',{numbered:true});debuffBuoy.stage='built';debuffBuoy.charges=2;state.debuffs.push({id:uid(),name:'Рак',active:true},{id:uid(),name:'Утка',active:true});
        assemblyBuoyProtectionActive=activateGuardBuoyForDebuffResult(true);const debuffProtectedFish=makeFish('normal','Заброс',true,{initialWeight:8,fishName:'защищённая рыба'});assemblyBuoyProtectionActive=false;
        const debuffBuoyResult={limited:debuffProtectedFish.debuffLimited,weight:debuffProtectedFish.weight,charges:debuffBuoy.charges};

        fresh();
        const duplicator=grantAssemblyBlueprint('ichthyoDuplicator',{numbered:true});duplicator.stage='built';duplicator.used=false;
        const original=addCastFish('giant',27.3,'рыба-копия');const copy=useIchthyoDuplicator(duplicator.id,original.id);
        const duplicateResult={used:duplicator.used,name:copy?.name,category:copy?.category,weight:copy?.weight,source:copy?.source,independent:copy&&copy.id!==original.id};

        fresh();
        const repeatedA=grantAssemblyBlueprint('reverseReel',{numbered:true}),repeatedB=grantAssemblyBlueprint('reverseReel',{numbered:true});
        addTrash(2);const repeatedFish=addCastFish('normal',3,'рыба повторного чертежа');repeatedA.ready=assemblyBlueprintReady(repeatedA);repeatedB.ready=assemblyBlueprintReady(repeatedB);assembleBlueprint(repeatedA.id,{fishId:repeatedFish.id,tradeIds:[]});
        const repeatedResult={instances:state.assembly.blueprints.length,firstBuilt:repeatedA.stage==='built',secondReady:repeatedB.ready,casts:state.castsLeft,deviceIcons:document.querySelectorAll('.assembly-device-icon').length};

        fresh();
        const chanceRandom=Math.random,chanceRolls=[.049,0,.249];Math.random=()=>chanceRolls.shift();const standaloneDrop=rollAssemblyBlueprintDrop();const extraRolls=[.049,.99,.25];Math.random=()=>extraRolls.shift();const additionalDrop=rollAssemblyBlueprintDrop();Math.random=chanceRandom;
        const dropRules={chance:ASSEMBLY_BLUEPRINT_CHANCE,standaloneChance:ASSEMBLY_STANDALONE_CHANCE,standalone:standaloneDrop?.standalone,additional:additionalDrop?.standalone===false};

        fresh();
        const finalBlueprint=grantAssemblyBlueprint('reverseReel',{numbered:true});addTrash(2);addCastFish('normal',2.5,'финальная рыба');finalBlueprint.ready=assemblyBlueprintReady(finalBlueprint);state.castsLeft=0;state.tradeShipChecked=true;maybeFinalizeSession();
        const finalHeld=!state.finished&&$('assemblyDialog').open;skipAssemblyBlueprint(finalBlueprint.id);
        const finalDecision={held:finalHeld,skipped:finalBlueprint.skipped,finished:state.finished};

        return {reelResult,converterResult,materializerResult,sonarResult,buoyResult,debuffBuoyResult,duplicateResult,repeatedResult,dropRules,finalDecision};
      });

      assert(mechanics.reelResult.readyBefore&&mechanics.reelResult.built&&mechanics.reelResult.casts===12&&mechanics.reelResult.fishConsumed,`reverse reel: ${JSON.stringify(mechanics.reelResult)}`);
      assert(mechanics.converterResult.built&&mechanics.converterResult.category==='heavy'&&mechanics.converterResult.weight>=10&&mechanics.converterResult.weight<=19.9&&!mechanics.converterResult.removed,`converter: ${JSON.stringify(mechanics.converterResult)}`);
      assert(mechanics.materializerResult.built&&mechanics.materializerResult.consumed&&mechanics.materializerResult.giants===2&&mechanics.materializerResult.categories.every(x=>x==='giant'),`materializer: ${JSON.stringify(mechanics.materializerResult)}`);
      assert(mechanics.sonarResult.charges===0&&JSON.stringify(mechanics.sonarResult.categories)===JSON.stringify(['normal','heavy','giant']),`sonar: ${JSON.stringify(mechanics.sonarResult)}`);
      assert(mechanics.buoyResult.protected&&mechanics.buoyResult.charges===3&&mechanics.buoyResult.persistedCharges===3,`guard buoy: ${JSON.stringify(mechanics.buoyResult)}`);
      assert(!mechanics.debuffBuoyResult.limited&&mechanics.debuffBuoyResult.weight===8&&mechanics.debuffBuoyResult.charges===1,`guard buoy crab/duck protection: ${JSON.stringify(mechanics.debuffBuoyResult)}`);
      assert(mechanics.duplicateResult.used&&mechanics.duplicateResult.name==='рыба-копия'&&mechanics.duplicateResult.category==='giant'&&mechanics.duplicateResult.weight===27.3&&mechanics.duplicateResult.source==='Ихтиодубликатор'&&mechanics.duplicateResult.independent,`duplicator: ${JSON.stringify(mechanics.duplicateResult)}`);
      assert(mechanics.repeatedResult.instances===2&&mechanics.repeatedResult.firstBuilt&&!mechanics.repeatedResult.secondReady&&mechanics.repeatedResult.casts===12,`duplicates: ${JSON.stringify(mechanics.repeatedResult)}`);
      assert(mechanics.dropRules.chance===.05&&mechanics.dropRules.standaloneChance===.25&&mechanics.dropRules.standalone&&mechanics.dropRules.additional,`drop rules: ${JSON.stringify(mechanics.dropRules)}`);
      assert(mechanics.finalDecision.held&&mechanics.finalDecision.skipped&&mechanics.finalDecision.finished,`final assembly decision: ${JSON.stringify(mechanics.finalDecision)}`);

      for(const [name,viewport] of Object.entries(viewports)){
        await page.setViewportSize(viewport);
        await page.evaluate(()=>{
          state=initialState();state.weatherSeen=[state.weather];ensureAssemblyState();$('toast').classList.remove('show');
          ASSEMBLY_DEVICE_KEYS.forEach(key=>{const blueprint=grantAssemblyBlueprint(key,{numbered:true});if(key!=='ichthyoDuplicator'){blueprint.stage='built';blueprint.charges=['echoSounder','guardBuoy'].includes(key)?2:0;}});
          render();
        });
        const metrics=await page.evaluate(()=>({
          overflow:document.documentElement.scrollWidth>innerWidth+1,
          chips:[...document.querySelectorAll('#effectsList .effect-assembly')].map(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})),
          rows:[...document.querySelectorAll('.history-item.type-assemblyBlueprint')].map(el=>el.getBoundingClientRect().height),
          artwork:[...document.querySelectorAll('.history-item.type-assemblyBlueprint')].map(el=>{
            const row=state.history.find(item=>String(item.id)===el.dataset.historyId),definition=assemblyDefinition(row?.assemblyDeviceKey);
            return {key:row?.assemblyDeviceKey,src:el.querySelector('.chronology-row__art img')?.getAttribute('src')||'',expected:definition?`${ASSEMBLY_ICON_PATH}${definition.file}`:''};
          }),
          missing:[...document.querySelectorAll('.assembly-blueprint-icon img,.assembly-device-icon img,.history-item.type-assemblyBlueprint .chronology-row__art img')].filter(img=>!img.complete||!img.naturalWidth).map(img=>img.getAttribute('src'))
        }));
        assert(!metrics.overflow,`${engine} ${name}: horizontal overflow`);
        assert(metrics.chips.length===6&&metrics.chips.every(chip=>chip.width<=148&&chip.height<=60),`${engine} ${name}: compact chips ${JSON.stringify(metrics.chips)}`);
        assert(metrics.rows.length===6&&metrics.rows.every(height=>height<=92),`${engine} ${name}: compact chronology ${JSON.stringify(metrics.rows)}`);
        assert(metrics.artwork.length===6&&metrics.artwork.every(item=>item.src===item.expected&&!/(?:orca|diver-equipment)\.webp$/i.test(item.src)),`${engine} ${name}: assembly chronology artwork ${JSON.stringify(metrics.artwork)}`);
        assert(metrics.missing.length===0,`${engine} ${name}: missing images ${JSON.stringify(metrics.missing)}`);
        await page.screenshot({path:path.join(output,`${engine}-${name}.png`),fullPage:false});
        await page.evaluate(()=>{const blueprint=state.assembly.blueprints.find(item=>item.deviceKey==='ichthyoDuplicator');openAssemblyDialog(blueprint.id);});
        const dialogMetrics=await page.evaluate(()=>{const dialog=$('assemblyDialog'),card=dialog.querySelector('.assembly-card'),box=card.getBoundingClientRect();return {open:dialog.open,left:box.left,right:box.right,top:box.top,bottom:box.bottom,width:box.width,height:box.height,viewportWidth:innerWidth,viewportHeight:innerHeight};});
        assert(dialogMetrics.open&&dialogMetrics.left>=-1&&dialogMetrics.right<=dialogMetrics.viewportWidth+1&&dialogMetrics.top>=-1&&dialogMetrics.bottom<=dialogMetrics.viewportHeight+1,`${engine} ${name}: assembly dialog escaped viewport ${JSON.stringify(dialogMetrics)}`);
        await page.screenshot({path:path.join(output,`${engine}-${name}-dialog.png`),fullPage:false});
        await page.evaluate(()=>{$('assemblyDialog').close();assemblyDialogSelection=null;});
      }
      assert(errors.length===0,errors.join('; '));
      console.log(`${engine}: assembly blueprint mechanics and ${Object.keys(viewports).length} viewports PASS`);
    }finally{await browser.close();}
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
