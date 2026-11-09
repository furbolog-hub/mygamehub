const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const target=pathToFileURL(path.join(root,'dropfish','index.html')).href;
const output=path.join(root,'.visual-test-output','dungeon-sacrifice-picker');
const viewports={desktop:{width:1366,height:768},phonePortrait:{width:390,height:844},phoneReference:{width:440,height:892},phoneLandscape:{width:844,height:390},tabletPortrait:{width:768,height:1024},tabletLandscape:{width:1024,height:768}};
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
          const fishData=[
            ['normal','белый окунь',4.2],
            ['heavy','красный луциан',12],
            ['giant','кета',24],
            ['normal','тюрбо',5.8],
          ];
          fishData.forEach(([category,name,initialWeight])=>makeFish(category,'Заброс',true,{initialWeight,fishName:name}));
          state.dungeon.encounter={id:uid(),dungeonType:'cradle',phase:'piranhas',historyRowId:null,castsUsed:1};
          render();
          openDungeonSacrifice();
        });
        await page.waitForTimeout(100);
        const cards=await page.evaluate(()=>{
          const rect=node=>{const box=node?.getBoundingClientRect();return box?{left:box.left,top:box.top,right:box.right,bottom:box.bottom,width:box.width,height:box.height}:null;};
          return [...document.querySelectorAll('.dungeon-fish-grid [data-dungeon-fish]')].map(button=>{
            const visual=button.querySelector('.dungeon-fish-visual');
            const species=visual?.querySelector('.base-fish-icon,.rift-fish-icon,.island-fish-icon,.deep-fish-icon');
            const badge=visual?.querySelector('.base-fish-category-badge');
            const category=badge?.querySelector('.fish-category-icon');
            const name=button.querySelector('strong');
            const badgeStyle=badge?getComputedStyle(badge):null;
            return {button:rect(button),visual:rect(visual),species:rect(species),badge:rect(badge),category:rect(category),name:rect(name),badgeOverflow:badgeStyle?.overflow||'',badgeCssWidth:parseFloat(badgeStyle?.width||'0'),badgeCssHeight:parseFloat(badgeStyle?.height||'0')};
          });
        });
        assert(cards.length===4,`${engineName}/${viewportName}: expected four sacrifice cards, found ${cards.length}`);
        cards.forEach((card,index)=>{
          assert(card.species&&card.badge&&card.category&&card.name,`${engineName}/${viewportName}: card ${index+1} lost a fish or weight-category icon`);
          assert(card.badgeOverflow==='visible',`${engineName}/${viewportName}: card ${index+1} still clips the weight-category icon`);
          assert(card.badgeCssWidth>=52&&card.badgeCssHeight>=52,`${engineName}/${viewportName}: card ${index+1} category slot is only ${card.badgeCssWidth}x${card.badgeCssHeight} CSS px`);
          for(const [kind,box] of [['fish',card.species],['category',card.category]]){
            assert(box.left>=card.button.left-1&&box.right<=card.button.right+1&&box.top>=card.button.top-1&&box.bottom<=card.button.bottom+1,`${engineName}/${viewportName}: card ${index+1} ${kind} icon is cut by its card`);
          }
          assert(Math.max(card.species.bottom,card.category.bottom)<=card.name.top+1,`${engineName}/${viewportName}: card ${index+1} icons overlap the fish name`);
        });
        await page.locator('#dungeonDialog').screenshot({path:path.join(output,`${engineName}-${viewportName}.png`),animations:'disabled'});renders++;
        await page.close();
      }
    }finally{await browser.close();}
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,renders,engines:Object.keys(engines),viewports},null,2));
  process.stdout.write(`PASS: ${renders} dungeon sacrifice picker renders across Chromium and WebKit\n`);
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
