const path=require('path');
const fs=require('fs');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const target=pathToFileURL(path.resolve(__dirname,'../dropfish/index.html')).href;
const output=path.resolve(__dirname,'../.visual-test-output/active-effects');
const viewports={desktop:{width:1366,height:768},phonePortrait:{width:390,height:844},phoneLandscape:{width:844,height:390},tabletPortrait:{width:768,height:1024},tabletLandscape:{width:1024,height:768}};
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  for(const [engineName,engine] of Object.entries({chromium,webkit})){
    const browser=await engine.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        await page.goto(target,{waitUntil:'load'});
        await page.waitForTimeout(150);
        const result=await page.evaluate(()=>{
          state=initialState();
          state.islands.flares=1;
          state.artifacts.push({id:uid(),name:'Око Шторма',tier:'mythic',traded:false,used:false});
          state.dungeon.rewards.push({id:uid(),key:'singula',name:'Пульсирующая сингула',used:false,activated:true});
          state.dungeon.rewards.push({id:uid(),key:'pearl',name:'Жемчужина осквернённого сердца',used:false,bonusArtifacts:0,bonusAngus:0});
          const fish=makeFish('normal','Заброс',true,{initialWeight:.1,fishName:'контрольная рыба'});
          const singulaAfter=fish.singulaImpact?.after;
          state.rifts.temporaryEffects.push({id:uid(),name:'Багровый осколок: следующая рыба +15%',type:'weight',casts:1,value:1.15});
          render();
          const chips=[...document.querySelectorAll('#effectsList .chip')];
          const flare=chips.find(x=>x.textContent.includes('Руническая сигнальная ракета'));
          const eye=chips.find(x=>x.textContent.includes('Око Шторма'));
          const crimson=chips.find(x=>x.textContent.includes('Багровый осколок'));
          const pearl=chips.find(x=>x.textContent.includes('Жемчужина осквернённого сердца'));
          const singulaImpact=document.querySelector('.singula-weight-impact');
          const cleanSingula=singulaImpact?.querySelector('.dungeon-icon');
          const cleanStyle=cleanSingula?getComputedStyle(cleanSingula):null;
          return {
            fishWeight:singulaAfter,
            singulaText:singulaImpact?.textContent||'',
            singulaBackground:cleanStyle?.backgroundImage||'',
            singulaBackgroundColor:cleanStyle?.backgroundColor||'',
            flareOverflow:flare?flare.scrollWidth-flare.clientWidth:999,
            flareIconOverflow:flare?.querySelector('.island-loot-icon')?.scrollWidth-flare?.querySelector('.island-loot-icon')?.clientWidth,
            eyeText:eye?.textContent.trim()||'',
            crimsonIcon:crimson?.querySelector('img')?.getAttribute('src')||'',
            pearlText:pearl?.querySelector('.effect-chip-copy')?.textContent.trim()||'',
            pearlOverflow:pearl?pearl.scrollWidth-pearl.clientWidth:999,
            invalidChipStructure:chips.filter(chip=>chip.querySelectorAll(':scope > .effect-chip-main').length!==1||chip.querySelectorAll(':scope > .effect-chip-main > .effect-chip-copy').length!==1||!chip.querySelector(':scope > .effect-chip-main > .is-effect-icon')).map(chip=>chip.textContent.trim()),
            chipOverflows:chips.flatMap(chip=>{const outer=chip.getBoundingClientRect(),main=chip.querySelector(':scope > .effect-chip-main')?.getBoundingClientRect();return main&&(main.left<outer.left-1||main.right>outer.right+1||main.top<outer.top-1||main.bottom>outer.bottom+1)?[{text:chip.querySelector('.effect-chip-copy')?.textContent.trim(),outer:{width:outer.width,height:outer.height},main:{width:main.width,height:main.height}}]:[];}),
            heartIcon:riftRelicIcon('Сердце бездны','is-effect-icon'),
            rareLoot:riftLootText({kind:'fish',rarity:'rare'}),
            pageOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
          };
        });
        const prefix=`${engineName}/${viewportName}`;
        assert(result.fishWeight===.2&&/0,1 кг.*1,3.*0,2 кг/.test(result.singulaText),`${prefix}: Singula did not visibly increase 0.1 kg (${JSON.stringify(result)})`);
        assert(result.singulaBackground==='none'&&result.singulaBackgroundColor==='rgba(0, 0, 0, 0)',`${prefix}: Singula icon still has a backplate`);
        assert(result.flareOverflow<=1&&result.flareIconOverflow<=1,`${prefix}: flare is clipped (${JSON.stringify(result)})`);
        assert(result.eyeText==='Око Шторма',`${prefix}: Storm Eye contains leftover action copy`);
        assert(result.pearlText==='Жемчужина осквернённого сердца'&&result.pearlOverflow<=1,`${prefix}: corrupted pearl contains duplicate status or overflows (${JSON.stringify(result)})`);
        assert(!result.invalidChipStructure.length,`${prefix}: active effects do not share icon/title structure (${JSON.stringify(result.invalidChipStructure)})`);
        assert(!result.chipOverflows.length,`${prefix}: active effect content overflows (${JSON.stringify(result.chipOverflows)})`);
        assert(result.crimsonIcon.endsWith('/crimson-shard.webp')&&!result.heartIcon.includes('crimson-shard.webp'),`${prefix}: Crimson Shard and Abyss Heart icons are not distinct`);
        assert(!result.rareLoot.includes('/fish-categories/rift.webp'),`${prefix}: rift-origin icon remains inside rift loot`);
        assert(result.pageOverflow<=1,`${prefix}: page overflowed by ${result.pageOverflow}px`);
        await page.locator('.inventory').screenshot({path:path.join(output,`${engineName}-${viewportName}.png`)});
        await page.close();
      }
    }finally{await browser.close();}
  }
  process.stdout.write('PASS: rift UI regressions across Chromium and WebKit\n');
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
