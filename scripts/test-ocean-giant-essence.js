const assert=require('assert/strict');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const pageUrl=pathToFileURL(path.resolve('dropfish/index.html')).href;

async function essenceBranch(page,weights){
  return page.evaluate(inputWeights=>{
    state=initialState();
    state.history=[];
    state.fish=inputWeights.map((weight,index)=>({
      id:`essence-fish-${index}`,
      name:`контрольная рыба ${index+1}`,
      weight,
      originalWeight:weight,
      category:'normal',
      source:'Заброс',
      direct:true,
      removed:false,
      tradeFish:false,
      islandColossus:false,
      tags:[]
    }));
    const row=addHistory('Эссенция «Великан Океанов»','epic','',{
      numbered:true,
      essencePending:true
    });
    resolveEssencesAtFinish();
    return {
      fish:state.fish.map(fish=>({weight:fish.weight,impact:fish.essenceImpacts?.at(-1)||null})),
      detail:row.detail,
      resolved:row.essenceResolved,
      pending:state.essencePending
    };
  },weights);
}

(async()=>{
  for(const [engine,browserType] of Object.entries({chromium,webkit})){
    const browser=await browserType.launch({headless:true});
    try{
      const page=await browser.newPage({viewport:{width:440,height:892}});
      await page.goto(pageUrl,{waitUntil:'load'});

      const none=await essenceBranch(page,[]);
      assert.equal(none.fish.length,0,`${engine}: empty catch received an Essence target`);
      assert(none.resolved&&!none.pending&&none.detail.includes('не осталось рыбы'),`${engine}: empty-catch branch was not resolved cleanly`);

      const one=await essenceBranch(page,[4.2]);
      assert.deepEqual(one.fish,[{weight:42,impact:{before:4.2,after:42,factor:10}}],`${engine}: single-fish branch is not ×10`);

      const many=await essenceBranch(page,[3.3,1.1,2.2]);
      assert.deepEqual(many.fish,[
        {weight:3.3,impact:null},
        {weight:5.5,impact:{before:1.1,after:5.5,factor:5}},
        {weight:11,impact:{before:2.2,after:11,factor:5}}
      ],`${engine}: two lightest fish did not receive ×5 each`);

      console.log(`${engine}: Ocean Giant Essence 0/1/2-target branches PASS`);
    }finally{
      await browser.close();
    }
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
