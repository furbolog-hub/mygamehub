const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const target=pathToFileURL(path.join(root,'dropfish','index.html')).href;
const output=path.join(root,'.visual-test-output','snapshot-82-abyssal-artwork');
const viewports={
  desktop:{width:1366,height:768},
  phonePortrait:{width:390,height:844},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:768,height:1024},
  tabletLandscape:{width:1024,height:768}
};
const personalities=['parasite','predator','symbiote','raider','destroyer','metamorph'];
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  for(const [engineName,engine] of Object.entries({chromium,webkit})){
    const browser=await engine.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        const pageErrors=[];
        page.on('pageerror',error=>pageErrors.push(error.message));
        await page.goto(target,{waitUntil:'load'});
        await page.evaluate(keys=>{
          state=initialState();
          const unknown=addHistory('Неизвестная абиссальная форма жизни','abyssal','(Форма ещё не проявилась)',{numbered:false,abyssDecision:true});
          const rows={};
          keys.forEach(key=>{
            const definition=ABYSSAL_PERSONALITIES[key];
            rows[key]=addHistory(definition.reveal,'abyssal',`(${definition.name}: проявление формы)`,{numbered:false,abyssPersonality:key,abyssManifestation:true}).id;
          });
          window.__snapshot82={unknown:unknown.id,rows};
          render();
        },personalities);
        await page.waitForFunction(()=>[...document.querySelectorAll('.chronology-row__art img')].every(image=>image.complete&&image.naturalWidth>0));

        const metrics=await page.evaluate(keys=>{
          const read=id=>{
            const row=document.querySelector(`[data-history-id="${id}"]`);
            const image=row?.querySelector('.chronology-row__art img');
            const box=row?.getBoundingClientRect();
            const imageStyle=image?getComputedStyle(image):null;
            return {
              exists:Boolean(row),
              src:image?.getAttribute('src')||'',
              loaded:Boolean(image?.complete&&image.naturalWidth>0),
              objectFit:imageStyle?.objectFit||'',
              overflow:box?Math.max(0,-box.left,box.right-innerWidth):0,
              manifestation:Boolean(row?.classList.contains('is-abyss-manifestation'))
            };
          };
          return {
            documentOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
            unknown:read(window.__snapshot82.unknown),
            forms:Object.fromEntries(keys.map(key=>[key,read(window.__snapshot82.rows[key])]))
          };
        },personalities);

        assert(pageErrors.length===0,`${engineName}/${viewportName}: page errors ${pageErrors.join(' | ')}`);
        assert(metrics.documentOverflow<=1,`${engineName}/${viewportName}: document overflow ${metrics.documentOverflow}px`);
        assert(metrics.unknown.loaded&&metrics.unknown.src.endsWith('/assets/chronology-row-art/abyssal-unknown.webp'),`${engineName}/${viewportName}: initial unknown form lost its shared artwork (${metrics.unknown.src})`);
        const sources=new Set();
        for(const key of personalities){
          const form=metrics.forms[key];
          const expected=`/assets/icons/abyssal-life/${key}.webp`;
          assert(form.exists&&form.manifestation,`${engineName}/${viewportName}/${key}: manifestation row is missing`);
          assert(form.loaded&&form.src.endsWith(expected),`${engineName}/${viewportName}/${key}: wrong chronology artwork (${form.src}; expected ${expected})`);
          assert(form.objectFit==='contain',`${engineName}/${viewportName}/${key}: transparent form artwork is cropped (${form.objectFit})`);
          assert(form.overflow<=1,`${engineName}/${viewportName}/${key}: row escaped viewport by ${form.overflow}px`);
          sources.add(form.src);
        }
        assert(sources.size===personalities.length,`${engineName}/${viewportName}: abyssal forms reuse artwork (${[...sources].join(', ')})`);

        if(viewportName==='phonePortrait')await page.screenshot({path:path.join(output,`${engineName}-${viewportName}.png`),animations:'disabled',fullPage:true});
        await page.close();
      }
      process.stdout.write(`${engineName}: snapshot 82 abyssal artwork PASS\n`);
    }finally{
      await browser.close();
    }
  }
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
