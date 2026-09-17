const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const pagePath=path.join(root,'dropfish','index.html');
const output=path.join(root,'.visual-test-output','ethirion');
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
        for(const phase of phases){
          const url=new URL(pathToFileURL(pagePath));url.searchParams.set('dungeonPreview',phase);url.searchParams.set('dungeonType','astral');await page.goto(url.href,{waitUntil:'load'});await page.waitForTimeout(250);
          const result=await page.evaluate(()=>{const card=document.querySelector('#dungeonCard')?.getBoundingClientRect(),dialog=document.querySelector('#dungeonDialog'),missing=dialog?.querySelectorAll('.dungeon-icon.is-missing').length||0,section=document.querySelector('#dungeonScene>section'),rect=selector=>{const r=document.querySelector(selector)?.getBoundingClientRect();return r&&card?{top:(r.top-card.top)/card.height,bottom:(r.bottom-card.top)/card.height,center:(r.top+r.height/2-card.top)/card.height}:null;};return {open:Boolean(dialog?.open),type:dialog?.dataset.dungeonType,missing,card:card&&{width:card.width,height:card.height},boss:document.querySelector('.boss-actor strong,.level-three .dungeon-level-heading strong')?.textContent||'',background:getComputedStyle(section).backgroundImage,whisper:document.querySelector('.shadow-whisper-active')?.textContent||'',anchor:rect('.dungeon-boss-anchor'),bossHp:rect('.dungeon-boss-anchor small'),fight:rect('.dungeon-fight-btn'),actor:rect('.boss-actor'),health:rect('.battle-health.boss'),logs:[rect('.battle-log-player'),rect('.battle-log-boss')]};});
          assert(result.open,`${engineName}/${viewportName}/${phase}: dialog closed`);assert(result.type==='astral',`${engineName}/${viewportName}/${phase}: wrong dungeon type`);assert(result.missing===0,`${engineName}/${viewportName}/${phase}: missing images`);assert(Math.abs(result.card.width/result.card.height-9/16)<.001,`${engineName}/${viewportName}/${phase}: distorted scene`);assert(result.background!=='none',`${engineName}/${viewportName}/${phase}: background missing`);if(['boss','battle'].includes(phase))assert(result.boss.includes('Эфирион'),`${engineName}/${viewportName}/${phase}: boss missing`);if(phase==='boss'){assert(result.anchor.center>.37&&result.anchor.center<.43,`${engineName}/${viewportName}: prebattle boss is outside intended gateway position`);assert(result.bossHp.bottom<=result.fight.top,`${engineName}/${viewportName}: fight button overlaps boss HP label`);}if(phase==='battle'){assert(result.whisper.includes('Шепот Теней'),`${engineName}/${viewportName}: Whisper status missing`);assert(result.health.bottom<result.actor.top,`${engineName}/${viewportName}: boss health overlaps Ethirion`);assert(result.logs.every(log=>log.top>result.actor.bottom),`${engineName}/${viewportName}: battle chronology overlaps Ethirion`);}
          await page.screenshot({path:path.join(output,`${engineName}-${viewportName}-${phase}.png`)});renders++;
        }
        assert(errors.length===0,`${engineName}/${viewportName}: ${errors.join('; ')}`);await page.close();
      }
    }finally{await browser.close();}
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,renders,engines:['chromium','webkit'],viewports,phases},null,2));process.stdout.write(`PASS: ${renders} Ethirion renders across Chromium and WebKit\n`);
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
