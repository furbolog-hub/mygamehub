const assert=require('assert/strict');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const pageUrl=pathToFileURL(path.resolve('dropfish/index.html')).href;

(async()=>{
  for(const [engine,browserType] of Object.entries({chromium,webkit})){
    const browser=await browserType.launch({headless:true});
    try{
      const page=await browser.newPage({viewport:{width:440,height:892}}),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(pageUrl,{waitUntil:'load'});
      const result=await page.evaluate(()=>{
        document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
        state=initialState();
        state.weather='sunny';
        state.weatherSeen=['sunny'];
        state.castClicks=12;

        const chestRow=addHistory('Бездонный ларь','epic','',{numbered:true,bottomlessChest:true});
        const fish=makeFish('normal','Бездонный ларь',false,{
          parentHistoryId:chestRow.id,
          bottomlessChestFish:true,
          initialWeight:4.9,
          fishName:'обыкновенный зубан'
        });
        changeAbyssFishWeight(fish,1.27,'Симбиот');
        const afterSymbiote=fish.weight;
        const sameCastGrowth=growBottomlessChestFishAfterCast();

        makeFish('giant','Заброс',false,{initialWeight:40,fishName:'контрольная рыба'});
        addHistory('Эссенция «Великан Океанов»','epic','',{numbered:true,essencePending:true});
        resolveEssencesAtFinish();
        const essence=fish.essenceImpacts?.at(-1)||null;

        state=initialState();
        state.weather='sunny';
        state.weatherSeen=['sunny'];
        state.castClicks=20;
        const laterFish=makeFish('normal','Бездонный ларь',false,{
          bottomlessChestFish:true,
          initialWeight:4.9,
          fishName:'рыба следующего заброса'
        });
        const creationCastWeight=laterFish.weight;
        state.castClicks++;
        const laterGrowth=growBottomlessChestFishAfterCast();

        return {
          afterSymbiote,
          sameCastGrowth,
          essence,
          creationCastWeight,
          laterGrowth,
          laterWeight:laterFish.weight
        };
      });

      assert.equal(errors.length,0,errors.join('\n'));
      assert.equal(result.afterSymbiote,6.2,`${engine}: Symbiote must turn 4.9 kg into 6.2 kg`);
      assert.equal(result.sameCastGrowth,0,`${engine}: chest fish grew on its creation cast`);
      assert.deepEqual(result.essence,{before:6.2,after:31,factor:5},`${engine}: Essence used a hidden extra kilogram`);
      assert.equal(result.creationCastWeight,4.9,`${engine}: creation weight changed before the next cast`);
      assert.equal(result.laterGrowth,1,`${engine}: chest fish must grow on a later cast`);
      assert.equal(result.laterWeight,5.9,`${engine}: later cast must add exactly 1 kg`);
      console.log(`${engine}: Bottomless Chest → Symbiote → Essence chain PASS`);
    }finally{
      await browser.close();
    }
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
