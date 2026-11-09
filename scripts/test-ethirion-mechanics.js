const path=require('path');
const {pathToFileURL}=require('url');
const {chromium}=require('playwright');

const pagePath=path.join(__dirname,'..','dropfish','index.html');
function assert(value,message){if(!value)throw new Error(message);}

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:800}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(pathToFileURL(pagePath).href,{waitUntil:'load'});
    const result=await page.evaluate(()=>{
      const oldRandom=Math.random;
      const fresh=()=>{state=initialState();state.weatherSeen=[state.weather];ensureDungeon();};
      const encounter=()=>({id:uid(),dungeonType:'astral',phase:'battle',cleanWeight:10,weapon:'shield',ally:'eel',playerHp:500,bossHp:3000,round:0,log:[],speed:4,bossAttacks:0,battleEventId:0});

      fresh();const d=encounter();Math.random=()=>.1;bossAttack(d);const critical={playerHp:d.playerHp,attacks:d.bossAttacks};Math.random=()=>.9;bossAttack(d);const alternating={playerHp:d.playerHp,attacks:d.bossAttacks};d.bossAttacks=4;d.bossHp=1000;bossAttack(d);const whisper={bossHp:d.bossHp,active:d.shadowWhisperActive,playerHp:d.playerHp};

      const redirected=encounter();redirected.shadowWhisperActive=true;Math.random=()=>.1;for(let i=0;i<3;i++)playerAttack(redirected,1);const redirect={bossHp:redirected.bossHp,count:redirected.allyRedirects,vanished:redirected.allyVanished};

      fresh();state.dungeon.encounter={...encounter(),bossHp:0,playerHp:40,round:10,ally:'stonefish'};Math.random=()=>.9;resolveDungeonBattle();const victoryKeys=state.dungeon.rewards.map(x=>x.key),victoryFeats=[...state.dungeon.feats];
      fresh();state.dungeon.encounter={...encounter(),bossHp:1499,playerHp:40,round:10};Math.random=()=>.1;resolveDungeonBattle();const survivalKeys=state.dungeon.rewards.map(x=>x.key),survivalFeats=[...state.dungeon.feats];

      fresh();state.dungeon.encounter={...encounter(),dungeonType:'vault',bossHp:1499,playerHp:40,round:10};Math.random=()=>.1;resolveDungeonBattle();const vaultFeats=[...state.dungeon.feats];
      fresh();state.dungeon.encounter={...encounter(),dungeonType:'cradle',bossHp:1499,playerHp:40,round:10,ally:'stonefish'};Math.random=()=>.1;resolveDungeonBattle();const cradleFeats=[...state.dungeon.feats];

      fresh();state.dungeon.singulaFinalBonus=true;const fish=makeFish('normal','Заброс',true,{initialWeight:10,fishName:'тестовая рыба'});const singula={original:fish.originalWeight,weight:fish.weight,impact:fish.singulaImpact};

      fresh();const ether={id:uid(),key:'darkEther',name:'Тёмный эфир',used:false,charges:5,dungeonType:'astral'};state.dungeon.rewards.push(ether);const caught=makeFish('normal','Заброс',true,{initialWeight:5,fishName:'эфирная рыба'}),row=state.history.find(x=>x.fishId===caught.id);ether.historyRowId=addHistory('Тёмный эфир','dungeon','',{numbered:false,dungeonReward:'darkEther',dungeonRewardId:ether.id,dungeonType:'astral'}).id;state.dungeon.darkEtherArmedId=ether.id;useDarkEtherOnRow(row.id);const etherUse={removed:caught.removed,rowRemoved:row.darkEtherRemoved,castsLeft:state.castsLeft,charges:ether.charges};
      fresh();const coal={id:uid(),key:'darkCoal',name:'Уголь тьмы',used:false,dungeonType:'astral'};state.dungeon.rewards.push(coal);const castFish=makeFish('normal','Заброс',true,{initialWeight:2,fishName:'обычная рыба'}),arcadeFish=makeFish('normal','Аркадный улов',false,{initialWeight:3,fishName:'аркадная рыба',arcadeCatch:true});useDarkCoal(coal.id);renderHistory();const coalRows=[castFish,arcadeFish].map(f=>state.history.find(h=>h.fishId===f.id));const coalUse={used:coal.used,converted:[castFish.darkCoalConverted,arcadeFish.darkCoalConverted],tradeItems:state.tradeItems.filter(x=>x.darkCoal).length,rows:coalRows.map(row=>({changed:Boolean(row.darkCoalTransform),html:document.querySelector(`[data-history-id="${row.id}"]`)?.innerHTML||''}))};
      const resultMarkup=dungeonResultMarkup({...encounter(),phase:'result',outcome:'reward',reward:'darkCoal',allyReward:{weight:20}});
      Math.random=oldRandom;
      return {critical,alternating,whisper,redirect,victoryKeys,victoryFeats,survivalKeys,survivalFeats,vaultFeats,cradleFeats,singula,etherUse,coalUse,resultMarkup,trail:DUNGEON_TYPES.astral.trail};
    });
    assert(result.critical.playerHp===440,'critical attack must deal 60');
    assert(result.alternating.playerHp===395,'second non-critical attack must deal 45');
    assert(result.whisper.active&&result.whisper.bossHp===800,'fifth attack must activate Whisper and remove 20% current HP');
    assert(result.redirect.bossHp===3000&&result.redirect.count===3&&result.redirect.vanished,'three redirects must spare boss and remove ally');
    assert(result.victoryKeys.length===1&&result.victoryKeys[0]==='darkEther','victory must grant only Dark Ether');
    assert(result.survivalKeys.length===1&&['darkCoal','singula'].includes(result.survivalKeys[0]),'sub-50% survival must grant one regular reward');
    assert(!result.victoryFeats.some(x=>['eternalDarknessCore','ballistierEye','pocketTank','lastBreath'].includes(x)),'Ethirion victory must not grant Ballistier achievements');
    assert(!result.survivalFeats.some(x=>['eternalDarknessCore','ballistierEye','pocketTank','lastBreath'].includes(x)),'Ethirion survival must not grant Ballistier achievements');
    assert(!result.cradleFeats.some(x=>['eternalDarknessCore','ballistierEye','pocketTank','lastBreath'].includes(x)),'Leviaxar survival must not grant Ballistier achievements');
    assert(result.vaultFeats.includes('eternalDarknessCore')&&result.vaultFeats.includes('lastBreath'),'Ballistier survival must retain its dungeon achievements');
    assert(result.singula.original===13&&result.singula.weight===13,'Singula must add 30% to future original weight');
    assert(result.etherUse.removed&&result.etherUse.rowRemoved&&result.etherUse.castsLeft===11&&result.etherUse.charges===4,'Dark Ether must remove result and return one cast');
    assert(result.coalUse.used&&result.coalUse.converted.every(Boolean)&&result.coalUse.tradeItems===2,'Dark Coal must transform ordinary cast and arcade fish');
    assert(result.coalUse.rows.every(row=>row.changed&&row.html.includes('dark-coal-transform-line')&&row.html.includes('history-transform-source')&&row.html.includes('trade-item-icon')),'Dark Coal rows must render the compact source/result transform chain');
    assert(!result.resultMarkup.includes('data-dungeon-use-reward'),'Dungeon result must not contain a Dark Coal action button');
    assert(result.trail==='Алый след','Astral piranhas must create the shared Scarlet Trail');
    assert(errors.length===0,errors.join('; '));
    process.stdout.write('PASS: Ethirion combat and reward mechanics\n');
  }finally{await browser.close();}
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
