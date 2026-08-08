const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const pagePath=path.join(root,'dropfish','index.html');
const output=path.join(root,'.visual-test-output','leviaxar');
const phases=['splash','weapon','ally','boss','battle'];
const viewports={desktop:{width:1920,height:1080},phonePortrait:{width:390,height:844},phoneLandscape:{width:844,height:390},tabletPortrait:{width:768,height:1024},tabletLandscape:{width:1024,height:768}};
function assert(value,message){if(!value)throw new Error(message);}

(async()=>{
  fs.mkdirSync(output,{recursive:true});let renders=0;
  for(const [engineName,engine] of Object.entries({chromium,webkit})){
    const browser=await engine.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',error=>errors.push(error.message));
        for(const phase of phases){const url=new URL(pathToFileURL(pagePath));url.searchParams.set('dungeonPreview',phase);url.searchParams.set('dungeonType','cradle');await page.goto(url.href,{waitUntil:'load'});await page.waitForTimeout(250);const result=await page.evaluate(()=>{const card=document.querySelector('#dungeonCard')?.getBoundingClientRect(),dialog=document.querySelector('#dungeonDialog'),missing=document.querySelectorAll('.dungeon-icon.is-missing').length;return {open:Boolean(dialog?.open),type:dialog?.dataset.dungeonType,missing,card:card&&{width:card.width,height:card.height},boss:document.querySelector('.boss-actor strong,.level-three .dungeon-level-heading strong')?.textContent||''};});assert(result.open,`${engineName}/${viewportName}/${phase}: dialog closed`);assert(result.type==='cradle',`${engineName}/${viewportName}/${phase}: wrong dungeon type`);assert(result.missing===0,`${engineName}/${viewportName}/${phase}: missing images`);assert(Math.abs(result.card.width/result.card.height-9/16)<.001,`${engineName}/${viewportName}/${phase}: distorted scene`);if(['boss','battle'].includes(phase))assert(result.boss.includes('Левиаксар'),`${engineName}/${viewportName}/${phase}: boss missing`);await page.screenshot({path:path.join(output,`${engineName}-${viewportName}-${phase}.png`)});renders++;}
        assert(errors.length===0,`${engineName}/${viewportName}: ${errors.join('; ')}`);await page.close();
      }
    }finally{await browser.close();}
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,renders,engines:['chromium','webkit'],viewports,phases},null,2));process.stdout.write(`PASS: ${renders} Leviaxar renders across Chromium and WebKit\n`);
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
