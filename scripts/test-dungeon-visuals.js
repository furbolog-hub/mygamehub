const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const fixture=path.join(root,'scripts','fixtures','dungeon-visual-harness.html');
const output=path.join(root,'.visual-test-output','dungeon');
const phases=['entrance','world','battle','result'];
const viewports={
  desktopWide:{width:1920,height:1080},
  desktopStandard:{width:1366,height:768},
  phoneTall:{width:390,height:844},
  phoneWide:{width:430,height:932},
  tabletPortrait:{width:768,height:1024},
  tabletLandscape:{width:1024,height:768},
  tabletTall:{width:1024,height:1366},
};
const engines={chromium,webkit};
const tolerance=.002;

function close(a,b,limit=tolerance){return Math.abs(a-b)<=limit;}
function assert(condition,message){if(!condition)throw new Error(message);}
function normalized(rect,card){return {x:(rect.x-card.x)/card.width,y:(rect.y-card.y)/card.height,w:rect.width/card.width,h:rect.height/card.height};}

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const baselines={};
  const results=[];
  for(const [engineName,engine] of Object.entries(engines)){
    const browser=await engine.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        for(const phase of phases){
          const url=new URL(pathToFileURL(fixture));url.searchParams.set('phase',phase);
          await page.goto(url.href,{waitUntil:'load'});
          await page.waitForTimeout(180);
          const geometry=await page.evaluate((phase)=>{
            const box=selector=>{const r=document.querySelector(selector)?.getBoundingClientRect();return r&&{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
            const card=box('#dungeonCard');
            const actors=phase==='battle'?Object.fromEntries(['.boss-actor','.ally-actor','.player-actor','.battle-health.boss','.battle-health.player','.battle-log-player','.battle-log-boss'].map(selector=>[selector,box(selector)])):{};
            return {card,actors,viewport:{width:innerWidth,height:innerHeight},entranceHeadings:phase==='entrance'?document.querySelectorAll('.dungeon-splash h2,.dungeon-splash .dungeon-kicker').length:null,backgroundSize:getComputedStyle(document.querySelector('#dungeonScene>section')).backgroundSize};
          },phase);
          const expectedScale=Math.min(1,viewport.width/720,viewport.height/1280);
          assert(close(geometry.card.width,720*expectedScale,1),`${engineName}/${viewportName}/${phase}: wrong stage width`);
          assert(close(geometry.card.height,1280*expectedScale,1),`${engineName}/${viewportName}/${phase}: wrong stage height`);
          assert(geometry.card.x>=-1&&geometry.card.y>=-1&&geometry.card.right<=viewport.width+1&&geometry.card.bottom<=viewport.height+1,`${engineName}/${viewportName}/${phase}: stage clipped`);
          assert(close(geometry.card.width/geometry.card.height,9/16,.0005),`${engineName}/${viewportName}/${phase}: stage distorted`);
          assert(geometry.backgroundSize.split(',').every(value=>value.trim()==='cover'),`${engineName}/${viewportName}/${phase}: background is not cover`);
          if(phase==='entrance')assert(geometry.entranceHeadings===0,`${engineName}/${viewportName}: duplicate entrance heading`);
          if(phase==='battle'){
            const current=Object.fromEntries(Object.entries(geometry.actors).map(([key,value])=>[key,normalized(value,geometry.card)]));
            baselines[engineName]??=current;
            for(const [key,value] of Object.entries(current))for(const field of ['x','y','w','h'])assert(close(value[field],baselines[engineName][key][field]),`${engineName}/${viewportName}: ${key}.${field} drifted`);
          }
          await page.screenshot({path:path.join(output,`${engineName}-${viewportName}-${phase}.png`)});
          results.push({engine:engineName,viewport:viewportName,phase,scale:Number(expectedScale.toFixed(5))});
        }
        await page.close();
      }
    }finally{await browser.close();}
  }
  for(const key of Object.keys(baselines.chromium))for(const field of ['x','y','w','h'])assert(close(baselines.chromium[key][field],baselines.webkit[key][field],.004),`cross-engine drift: ${key}.${field}`);
  const report={passed:true,renders:results.length,engines:Object.keys(engines),viewports,phases,results};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  process.stdout.write(`PASS: ${results.length} dungeon renders across Chromium and WebKit\n`);
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
