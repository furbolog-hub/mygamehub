const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');
const pageUrl=pathToFileURL(path.join(__dirname,'..','dropfish','index.html')).href;
const viewports=[
  {name:'desktop',width:1440,height:900},
  {name:'phone-portrait',width:390,height:844},
  {name:'phone-landscape',width:844,height:390},
  {name:'tablet-portrait',width:820,height:1180},
  {name:'tablet-landscape',width:1180,height:820}
];
function assert(value,message){if(!value)throw new Error(message);}

(async()=>{
  for(const engine of [chromium,webkit]){
    const browser=await engine.launch({headless:true});
    try{
      for(const viewport of viewports){
        const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',error=>errors.push(error.message));
        await page.goto(pageUrl,{waitUntil:'load'});
        const result=await page.evaluate(()=>{
          openGuide('Подземелья');
          const text=document.querySelector('#guideContent')?.textContent||'',icon=document.querySelector('#guideContent h3.guide-dungeon .dungeon-icon.is-guide-icon'),style=icon?getComputedStyle(icon):null,iconResult={exists:Boolean(icon),width:style?.width,height:style?.height,background:style?.backgroundColor,borderRadius:style?.borderRadius};
          openGuide('Разломы');const riftIcon=document.querySelector('#guideContent h3.guide-rift .rift-relic-icon.is-guide-icon'),riftStyle=riftIcon?getComputedStyle(riftIcon):null,riftHeading=riftIcon?.closest('h3');
          return {text,icon:iconResult,riftIcon:{exists:Boolean(riftIcon),width:riftStyle?.width,height:riftStyle?.height,display:riftStyle?.display,headingText:riftHeading?.textContent||''},scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth};
        });
        const label=`${engine.name()} ${viewport.name}`;
        assert(result.text.includes('общий чистый вес всего доступного улова вместе с принесённой жертвой'),`${label}: clean-weight rule is missing`);
        assert(!result.text.includes('Менее 50%'),`${label}: boss reward threshold text must be absent`);
        assert(result.icon.exists&&result.icon.width==='40px'&&result.icon.height==='40px',`${label}: dungeon guide icon must match the 40px Rift icon: ${JSON.stringify(result.icon)}`);
        assert(result.icon.background==='rgba(0, 0, 0, 0)'&&result.icon.borderRadius==='0px',`${label}: dungeon guide icon must have a clean transparent background`);
        assert(result.riftIcon.exists&&result.riftIcon.width==='40px'&&result.riftIcon.height==='40px'&&result.riftIcon.display==='inline-block',`${label}: Rift icon must be inline and match dungeon icon size`);
        assert(result.riftIcon.headingText.includes('Сумрачный разлом'),`${label}: Rift icon and title must share one heading`);
        assert(result.scrollWidth===result.clientWidth,`${label}: guide introduced horizontal overflow`);
        assert(!errors.length,`${label}: ${errors.join('; ')}`);
        await page.close();
      }
    }finally{await browser.close();}
  }
  process.stdout.write('PASS: dungeon guide copy and icons across Chromium/WebKit viewports\n');
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
