const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');
const pageUrl=pathToFileURL(path.join(__dirname,'..','agroclick','index.html')).href;
const output=path.join(__dirname,'..','test-results','agroclick-cell-layout');
const viewports={desktop:{width:1440,height:900},phonePortrait:{width:390,height:844},phoneLandscape:{width:844,height:390},tabletPortrait:{width:768,height:1024},tabletLandscape:{width:1024,height:768}};
function assert(value,message){if(!value)throw new Error(message);}
function close(a,b,tolerance=1.5){return Math.abs(a-b)<=tolerance;}
(async()=>{
  fs.mkdirSync(output,{recursive:true});
  let renders=0;
  for(const [engineName,engine] of Object.entries({chromium,webkit})){
    const browser=await engine.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});const errors=[];
        page.on('pageerror',error=>{if(!/ResizeObserver loop/i.test(error.message))errors.push(error.message);});
        await page.goto(pageUrl,{waitUntil:'load'});
        await page.evaluate(()=>{
          state=createState();
          const setup=[
            {type:'wheat',opened:true,amount:120},
            {type:'wheat',opened:true,amount:145,originalAmount:105,characterBoost:40},
            {type:'wheat',opened:true,stolen:true,stolenAmount:80,amount:0},
            {type:'bomb',opened:true,timer:3},
            {type:'bomb',opened:true,neutralized:true,timer:null},
            {type:'bomb',opened:true,exploded:true,bombLoss:160,timer:null},
            {type:'chest',opened:true,chestResolved:false,timer:2},
            {type:'chest',opened:true,chestResolved:true,resolvedBonus:'goldenHoe',timer:null},
            {type:'weed',opened:true,summonedBeetle:true},
            {type:'mole',opened:true}
          ];
          setup.forEach((values,index)=>Object.assign(state.board[index],values));
          render();
        });
        await page.waitForTimeout(180);
        const result=await page.evaluate(()=>{
          const cells=[...document.querySelectorAll('#board .cell')].slice(0,10);
          const geometry=cells.map(cell=>{
            const box=cell.getBoundingClientRect(),visual=cell.querySelector('.cell-visual')?.getBoundingClientRect(),caption=cell.querySelector('.cell-caption')?.getBoundingClientRect(),asset=cell.querySelector('.cell-visual .asset-wrap')?.getBoundingClientRect();
            return {type:[...cell.classList].find(name=>name.startsWith('type-')),box:{left:box.left,top:box.top,right:box.right,bottom:box.bottom,width:box.width,height:box.height},visual:visual&&{cx:visual.left+visual.width/2,cy:visual.top+visual.height/2,width:visual.width,height:visual.height},caption:caption&&{top:caption.top,bottom:caption.bottom,height:caption.height,overflow:Math.max(0,cell.querySelector('.cell-caption').scrollWidth-cell.querySelector('.cell-caption').clientWidth)},asset:asset&&{width:asset.width,height:asset.height}};
          });
          return {geometry,pageOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth)};
        });
        const label=`${engineName}/${viewportName}`;
        assert(!errors.length,`${label}: ${errors.join('; ')}`);
        assert(result.pageOverflow<=1,`${label}: page overflow ${result.pageOverflow}px`);
        result.geometry.forEach((item,index)=>{
          assert(close(item.box.width,item.box.height,1),`${label}/cell${index+1}: cell is not square`);
          assert(item.box.left>=-1&&item.box.top>=-1&&item.box.right<=viewport.width+1&&item.box.bottom<=viewport.height+1,`${label}/cell${index+1}: cell is clipped`);
          if(item.caption)assert(item.caption.overflow<=1,`${label}/cell${index+1}: caption overflow ${item.caption.overflow}px`);
          if(item.visual)assert(close(item.visual.cx,item.box.left+item.box.width/2,1),`${label}/cell${index+1}: visual is not horizontally centered`);
          if(item.asset)assert(item.asset.width/item.box.width>=.45,`${label}/cell${index+1}: icon remains too small (${(item.asset.width/item.box.width).toFixed(2)}): ${JSON.stringify(item)}`);
        });
        const captionOffsets=result.geometry.filter(item=>item.caption).map(item=>item.box.bottom-item.caption.bottom);
        assert(Math.max(...captionOffsets)-Math.min(...captionOffsets)<=1.5,`${label}: captions do not share one lower zone: ${captionOffsets.join(', ')}`);
        await page.screenshot({path:path.join(output,`${engineName}-${viewportName}.png`),fullPage:true});
        renders++;await page.close();
      }
    }finally{await browser.close();}
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,renders,viewports},null,2));
  process.stdout.write(`PASS: ${renders} AgroClick cell-layout renders across Chromium and WebKit\n`);
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
