const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const target=pathToFileURL(path.join(root,'dropfish','index.html')).href;
const output=path.join(root,'.visual-test-output','requested-regressions');
const viewports={desktop:{width:1366,height:768},phonePortrait:{width:390,height:844},phoneLandscape:{width:844,height:390},tabletPortrait:{width:768,height:1024},tabletLandscape:{width:1024,height:768}};
const engines={chromium,webkit};
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  let renders=0;
  for(const [engineName,engine] of Object.entries(engines)){
    const browser=await engine.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        await page.goto(target,{waitUntil:'load'});
        await page.evaluate(()=>{
          state=initialState();
          state.artifacts.push({id:uid(),name:'Чешуя Левиафана',tier:'epic',traded:false});
          state.leviathanStep=0;
          makeFish('normal','Заброс',true,{initialWeight:4.2,fishName:'Заброс обычная'});
          makeFish('heavy','Заброс',true,{initialWeight:12,fishName:'Заброс тяжеловес'});
          makeFish('giant','Заброс',true,{initialWeight:24,fishName:'Заброс гигант'});
          makeFish('normal','Аркадный улов',false,{initialWeight:4.2,fishName:'Аркада обычная',arcadeCatch:true});
          makeFish('heavy','Аркадный улов',false,{initialWeight:12,fishName:'Аркада тяжеловес',arcadeCatch:true});
          makeFish('giant','Аркадный улов',false,{initialWeight:24,fishName:'Аркада гигант',arcadeCatch:true});
          const riftFish=makeFish('heavy','Нестабильный разлом',false,{initialWeight:18.7,fishName:'Золотая рыбка'});
          riftFish.riftFish=true;riftFish.rarity='heavy';
          const dedicatedRiftFish=makeFish('heavy','Нестабильный разлом',false,{initialWeight:49.2,fishName:'Сингулярный тунец'});
          dedicatedRiftFish.riftFish=true;dedicatedRiftFish.rarity='epic';
          const islandFish=makeFish('giant','Заброс',false,{initialWeight:126.3,fishName:'Островной гигант'});
          islandFish.islandColossus=true;islandFish.rarity='common';
          const replaced=makeFish('normal','Заброс',true,{initialWeight:3.8,fishName:'Заменённая рыба'});
          replaced.removed=true;replaced.crystalReplaced=true;
          const replacedRow=state.history.find(row=>row.fishId===replaced.id);replacedRow.crystalReplaced=true;
          state.dungeon.encounter={id:uid(),dungeonType:'cradle',phase:'piranhas',historyRowId:null,castsUsed:0};
          render();
        });
        await page.waitForTimeout(100);
        const main=await page.evaluate(()=>{
          const chip=document.querySelector('.dungeon-encounter-effect');
          const fishRows=[...document.querySelectorAll('.history-item.type-fish')];
          return {
            chipOverflow:chip?chip.scrollWidth-chip.clientWidth:0,
            chipText:chip?.querySelector('.effect-chip-copy')?.textContent.trim(),
            inlineStatuses:document.querySelectorAll('.history-item.type-fish .fish-inline-status').length,
            sourceIcons:Object.fromEntries(fishRows.map(row=>[row.querySelector('.history-fish-catch-text')?.textContent||'',row.querySelector('.fish-inline-status img')?.getAttribute('src')||''])),
            leadingIcons:Object.fromEntries(fishRows.map(row=>[row.querySelector('.history-fish-catch-text')?.textContent||'',[...row.querySelectorAll('.history-fish-leading img')].map(img=>img.getAttribute('src')||'')])),
            fishTextGaps:Object.fromEntries(fishRows.map(row=>{const lead=row.querySelector('.history-fish-leading'),copy=row.querySelector('.history-entity-copy');return [row.querySelector('.history-fish-catch-text')?.textContent||'',lead&&copy?copy.getBoundingClientRect().left-lead.getBoundingClientRect().right:null];})),
            replacedBadges:document.querySelectorAll('.crystal-replaced-status').length,
            horizontalOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
            fishRows:fishRows.length,
          };
        });
        assert(main.chipOverflow<=1,`${engineName}/${viewportName}: piranha chip overflowed by ${main.chipOverflow}px`);
        assert(main.chipText==='Пираньи Колыбели Левиафана',`${engineName}/${viewportName}: piranha chip has extra copy: ${JSON.stringify(main.chipText)}`);
        assert(main.inlineStatuses===8,`${engineName}/${viewportName}: ordinary, cast, or arcade fish icons are missing or duplicated (${main.inlineStatuses} found)`);
        const iconFor=name=>Object.entries(main.sourceIcons).find(([title])=>title.includes(name))?.[1]||'';
        assert(iconFor('Заброс обычная').endsWith('/cast-catch.webp'),`${engineName}/${viewportName}: normal cast icon is wrong`);
        assert(iconFor('Заброс тяжеловес').endsWith('/heavyweight.webp'),`${engineName}/${viewportName}: heavyweight cast icon is wrong`);
        assert(iconFor('Заброс гигант').endsWith('/giant.webp'),`${engineName}/${viewportName}: giant cast icon is wrong`);
        for(const name of ['Аркада обычная','Аркада тяжеловес','Аркада гигант'])assert(iconFor(name).endsWith('/arcade-catch.webp'),`${engineName}/${viewportName}: ${name} does not use the arcade icon`);
        assert(iconFor('Золотая рыбка').endsWith('/heavyweight.webp'),`${engineName}/${viewportName}: ordinary heavyweight rewarded by a rift lost its post-title weight icon`);
        const ordinaryRiftLeading=main.leadingIcons[Object.keys(main.leadingIcons).find(title=>title.includes('Золотая рыбка'))]||[];
        assert(ordinaryRiftLeading.some(src=>/heavy\.webp$/.test(src)),`${engineName}/${viewportName}: ordinary heavyweight rewarded by a rift lost its leading category badge`);
        for(const name of ['Сингулярный тунец','Островной гигант']){
          assert(!iconFor(name),`${engineName}/${viewportName}: ${name} incorrectly uses an ordinary cast/arcade icon`);
          const categoryFiles=main.leadingIcons[Object.keys(main.leadingIcons).find(title=>title.includes(name))]||[];
          assert(!categoryFiles.some(src=>/(?:normal|heavyweight|giant)\.webp$/.test(src)),`${engineName}/${viewportName}: ${name} incorrectly uses an ordinary weight-category icon`);
          const gap=main.fishTextGaps[Object.keys(main.fishTextGaps).find(title=>title.includes(name))];
          assert(gap===null||gap>=0,`${engineName}/${viewportName}: ${name} category visual overlaps its title by ${-gap}px`);
        }
        assert(main.replacedBadges===1,`${engineName}/${viewportName}: crystal replacement badge missing`);
        assert(main.horizontalOverflow<=1,`${engineName}/${viewportName}: main page overflowed horizontally`);
        await page.screenshot({path:path.join(output,`${engineName}-${viewportName}-history.png`),fullPage:true});renders++;

        await page.evaluate(()=>{state.rifts.active=null;makeRift('df1',true);});
        await page.waitForTimeout(80);
        const buttons=await page.evaluate(()=>{
          const leave=document.querySelector('#riftLeaveBtn'),next=document.querySelector('#riftContinueBtn');
          const a=getComputedStyle(leave),b=getComputedStyle(next),card=document.querySelector('.rift-card').getBoundingClientRect();
          return {leaveHeight:leave.getBoundingClientRect().height,nextHeight:next.getBoundingClientRect().height,leaveRadius:a.borderRadius,nextRadius:b.borderRadius,leaveBackground:a.backgroundImage,nextBackground:b.backgroundImage,card:{left:card.left,top:card.top,right:card.right,bottom:card.bottom}};
        });
        assert(Math.abs(buttons.leaveHeight-buttons.nextHeight)<=1,`${engineName}/${viewportName}: rift action heights differ`);
        assert(buttons.leaveRadius===buttons.nextRadius,`${engineName}/${viewportName}: rift action radii differ`);
        assert(buttons.leaveBackground!=='none'&&buttons.nextBackground!=='none',`${engineName}/${viewportName}: translucent button backgrounds missing`);
        assert(buttons.card.left>=-1&&buttons.card.top>=-1&&buttons.card.right<=viewport.width+1&&buttons.card.bottom<=viewport.height+1,`${engineName}/${viewportName}: rift card clipped`);
        await page.screenshot({path:path.join(output,`${engineName}-${viewportName}-rift.png`)});renders++;
        await page.close();
      }
    }finally{await browser.close();}
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,renders,engines:Object.keys(engines),viewports},null,2));
  process.stdout.write(`PASS: ${renders} requested-regression renders across Chromium and WebKit\n`);
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
