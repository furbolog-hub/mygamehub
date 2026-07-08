'use strict';

const TelegramApp = window.Telegram?.WebApp?.initData ? window.Telegram.WebApp : null;
TelegramApp?.ready();
TelegramApp?.expand();

const $ = id => document.getElementById(id);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const chance = p => Math.random() < p;
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const uid = () => crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

const STORAGE_KEY = 'agroClickSessionV12';
const TEST_BUILD = true;
const TOTAL_CELLS = 30;
const OPENS_PER_LOCATION = 15;

const BALANCE = Object.freeze({
  moleChestStealChance: 0.30,
  rabbitChance: 0.07,
  rabbitLifetimeMs: 2000,
  rabbitMaxPerLocation: 2,
  characterChance: 0.05,
  characterMaxPerLocation: 2,
  characterWeights: { defender: 20, mage: 32, economist: 32, scientist: 16 },
  chestBonusWeights: {
    bombShield: 14,
    digitalMagnifier: 13,
    wateringCan: 14,
    mineralFertilizer: 12,
    scarecrow: 12,
    portableNeutralizer: 10,
    goldenHoe: 9,
    enchantedSickle: 9,
    agroRushX2: 5,
    agroRushX3: 2
  },
  neutralizerSuccessChance: 0.75,
  beetleLossMaximum: 60
});

const LOCATIONS = [
  {name:'Бескрайняя равнина',background:'./assets/backgrounds/endless-plain.png'},
  {name:'Ветреный хребет',background:'./assets/backgrounds/windy-ridge.png'},
  {name:'Грозовая поляна',background:'./assets/backgrounds/stormy-glade.png'},
  {name:'Золотая долина',background:'./assets/backgrounds/golden-valley.png'},
  {name:'Каменистая пустошь',background:'./assets/backgrounds/rocky-wasteland.png'},
  {name:'Медный уступ',background:'./assets/backgrounds/copper-ledge.png'},
  {name:'Сухой разлом',background:'./assets/backgrounds/dry-rift.png'},
  {name:'Теневой утес',background:'./assets/backgrounds/shadow-cliff.png'},
  {name:'Туманный удел',background:'./assets/backgrounds/misty-realm.png'},
  {name:'Черная борозда',background:'./assets/backgrounds/black-furrow.png'},
  {name:'Южная степь',background:'./assets/backgrounds/southern-steppe.png'},
  {name:'Янтарный склон',background:'./assets/backgrounds/amber-slope.png'}
];

const ICONS = {
  wheat:'🌾', bomb:'💣', mole:'🐹', weed:'🌿', chest:'📦', beetle:'🪲',
  bombShield:'🛡️', digitalMagnifier:'🔍', wateringCan:'💧', mineralFertilizer:'🧪',
  scarecrow:'🧍', portableNeutralizer:'🧰', goldenHoe:'🪄', enchantedSickle:'🌙',
  agroRushX2:'×2', agroRushX3:'×3', key:'🔑'
};

const BONUS_DESCRIPTIONS = {
  bombShield:'Защищает от всех взрывов в течение 5 ходов.', digitalMagnifier:'Позволяет посмотреть две закрытые незаблокированные ячейки и при желании открыть их.', wateringCan:'Мгновенно добавляет от 20 до 40 единиц урожая.',
  mineralFertilizer:'Однократно удваивает урожай выбранной открытой пшеничной ячейки.', scarecrow:'Три следующих хода даёт +5 урожая и отпугивает крота.',
  portableNeutralizer:'Обезвреживает выбранную бомбу с шансом 75%; шанс взрыва — 25%.', goldenHoe:'Показывает все заблокированные сорняком ячейки и позволяет открыть одну.',
  enchantedSickle:'Мгновенно приносит от 10 до 100 единиц урожая.', agroRushX2:'Мгновенно умножает текущий урожай локации на 2.', agroRushX3:'Мгновенно умножает текущий урожай локации на 3.'
};

const BONUS_NAMES = {
  bombShield:'Щит от бомбы', digitalMagnifier:'Цифровая лупа', wateringCan:'Лейка успеха',
  mineralFertilizer:'Минеральное удобрение', scarecrow:'Пугало',
  portableNeutralizer:'Портативный нейтрализатор', goldenHoe:'Золотая тяпка',
  enchantedSickle:'Зачарованный серп', agroRushX2:'Агро-рывок ×2', agroRushX3:'Агро-рывок ×3'
};

const CHARACTER_INFO = {
  defender:{name:'Кот-защитник',icon:'🛡️🐱'}, mage:{name:'Кот-маг',icon:'🪄🐱'},
  scientist:{name:'Кот-учёный',icon:'🔬🐱'}, economist:{name:'Кот-экономист',icon:'📈🐱'}
};


const ASSET_PATHS = {
  wheat:'./assets/objects/wheat.png', chest:'./assets/objects/mysterious-chest.png', rabbit:'./assets/objects/rabbit.png',
  bomb:'./assets/debuffs/bomb.png', mole:'./assets/debuffs/mole.png', weed:'./assets/debuffs/weed.png', beetle:'./assets/debuffs/beetle.png',
  bombShield:'./assets/bonuses/bomb-shield.png', digitalMagnifier:'./assets/bonuses/digital-magnifier.png', wateringCan:'./assets/bonuses/watering-can.png',
  mineralFertilizer:'./assets/bonuses/mineral-fertilizer.png', scarecrow:'./assets/bonuses/scarecrow.png', portableNeutralizer:'./assets/bonuses/portable-neutralizer.png',
  goldenHoe:'./assets/bonuses/golden-hoe.png', enchantedSickle:'./assets/bonuses/enchanted-sickle.png', agroRushX2:'./assets/bonuses/agro-rush-x2.png',
  agroRushX3:'./assets/bonuses/agro-rush-x3.png', key:'./assets/bonuses/key.png',
  defender:'./assets/characters/cat-defender.png', mage:'./assets/characters/cat-mage.png', economist:'./assets/characters/cat-economist.png', scientist:'./assets/characters/cat-scientist.png',
  moleSource:'./assets/markers/mole-source.png', beetleSource:'./assets/markers/beetle-source.png', mageAlert:'./assets/markers/mage-alert.png'
};
function assetMarkup(key,fallback='',extraClass=''){
  const src=ASSET_PATHS[key];
  if(!src) return `<span class="asset-fallback ${extraClass}">${fallback}</span>`;
  return `<span class="asset-wrap ${extraClass}"><img class="asset-image" src="${src}" alt="" draggable="false" onerror="this.style.display='none';this.nextElementSibling.style.display='inline-flex'"><span class="asset-fallback" style="display:none">${fallback}</span></span>`;
}
function locationData(value){
  const name=value&&typeof value==='object'?value.name:value;
  const canonical=LOCATIONS.find(item=>item.name===name);
  if(canonical){
    return {...canonical,...(value&&typeof value==='object'?value:{})};
  }
  return {name:String(name||'Локация'),background:''};
}

const SOUND_ENABLED_KEY = 'agroClickSoundsEnabled';
const SOUND_PATHS = Object.freeze({
  guideOpen:'./sounds/guide-open.ogg',
  weedBlocks:'./sounds/weed-blocks.ogg',
  bombExplosion:'./sounds/bomb-explosion.ogg',
  chestBonus:'./sounds/chest-bonus.ogg',
  rabbitKey:'./sounds/rabbit-key.ogg',
  characterAppears:'./sounds/character-appears.ogg',
  rabbitAppears:'./sounds/rabbit-appears.ogg',
  moleAppears:'./sounds/mole-appears.ogg',
  beetleSummoned:'./sounds/beetle-summoned.ogg',
  chestFound:'./sounds/chest-found.ogg',
  locationChange:'./sounds/location-change.ogg'
});
let soundsEnabled=localStorage.getItem(SOUND_ENABLED_KEY)!=='false';
function playSound(name){
  if(!soundsEnabled) return;
  const path=SOUND_PATHS[name];
  if(!path) return;
  try {
    const audio=new Audio(`${path}?v=1.42-test-telegram`);
    audio.preload='auto';
    audio.volume=1;
    const playback=audio.play();
    if(playback&&typeof playback.catch==='function') playback.catch(()=>{});
  } catch(_){}
}
function renderSoundToggle(){
  const button=$('soundToggle');
  if(!button) return;
  button.textContent=soundsEnabled?'🔊':'🔇';
  button.title=soundsEnabled?'Отключить звуки':'Включить звуки';
  button.setAttribute('aria-label',button.title);
  button.setAttribute('aria-pressed',String(!soundsEnabled));
}
function toggleSounds(){
  soundsEnabled=!soundsEnabled;
  try { localStorage.setItem(SOUND_ENABLED_KEY,String(soundsEnabled)); } catch(_){}
  renderSoundToggle();
}

function weightedKey(weights){
  const entries=Object.entries(weights); const total=entries.reduce((s,[,v])=>s+v,0); let roll=Math.random()*total;
  for(const [key,value] of entries){ roll-=value; if(roll<=0) return key; }
  return entries.at(-1)[0];
}

function shuffle(items){
  const a=[...items];
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

function createBoard(){
  const types=['bomb','bomb','mole','mole','weed','weed','chest'];
  while(types.length<TOTAL_CELLS) types.push('wheat');
  return shuffle(types).map((type,index)=>({
    id:index, type, opened:false, blocked:false, blockedBy:[], destroyed:false,
    amount:type==='wheat'?randInt(1,20):0, originalAmount:null, characterBoost:0, characterEffects:[], stolen:false, stolenAmount:0, fertilized:false,
    timer:null, revealed:false, chestResolved:false, resolvedBonus:null, summoned:false, summonedByMole:false, summonedBeetle:false, justActivated:false, exploded:false, neutralized:false, bombLoss:0, burned:false
  })).map(cell=>{ if(cell.type==='wheat') cell.originalAmount=cell.amount; return cell; });
}

function createState(){
  const locations=shuffle(LOCATIONS).slice(0,3);
  return {
    version:1, locations, locationIndex:0, board:createBoard(), movesLeft:OPENS_PER_LOCATION,
    locationHarvest:0, completedHarvest:0, baseHarvest:0, grossHarvest:0, bombLossTotal:0, keys:0, beetles:0, inventory:[], character:null,
    moleStolenTotal:0, moleStolenByLocation:[0,0,0],
    rabbitSpawns:0, characterSpawns:0, activeRabbitCell:null, status:'Откройте первую грядку.',
    finished:false, locationLocked:false, keyBlockedOpenUsed:false, keyExchangeHarvest:0, completedLocations:[], viewLocationIndex:0, resultDialogDismissed:false, sessionLog:[{id:uid(),text:'Откройте первую грядку.',icon:'🌱',location:1}]
  };
}

function loadState(){
  try { const raw=localStorage.getItem(STORAGE_KEY); return raw ? {...createState(),...JSON.parse(raw)} : createState(); }
  catch(_){ return createState(); }
}
function save(){ try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); } catch(_){} }
let state=loadState();
if(!Array.isArray(state.sessionLog)||!state.sessionLog.length) state.sessionLog=[{id:uid(),text:state.status||'Откройте первую грядку.',icon:'🌱',location:state.locationIndex+1}];
state.board.forEach(c=>{
  if(c.neutralized==null)c.neutralized=false;
  if(c.summonedByMole==null)c.summonedByMole=Boolean(c.summoned);
  if(c.summonedBeetle==null)c.summonedBeetle=false;
  if(c.type==='wheat'){
    if(!Number.isFinite(c.originalAmount)) c.originalAmount=Number.isFinite(c.amount)?c.amount:0;
    if(!Number.isFinite(c.characterBoost)) c.characterBoost=0;
    if(!Array.isArray(c.characterEffects)) c.characterEffects=[];
  }
});
if(!Array.isArray(state.completedLocations)) state.completedLocations=[];
if(!Number.isInteger(state.viewLocationIndex)) state.viewLocationIndex=state.locationIndex;
if(state.resultDialogDismissed==null) state.resultDialogDismissed=false;
if(state.keyBlockedOpenUsed==null) state.keyBlockedOpenUsed=false;
if(!Number.isFinite(state.keyExchangeHarvest)) state.keyExchangeHarvest=0;
if(!Number.isFinite(state.baseHarvest)) state.baseHarvest=Math.max(0,Number(state.grossHarvest)||0);
if(!Number.isFinite(state.grossHarvest)) state.grossHarvest=Math.max(0,totalHarvest()+(state.moleStolenTotal||0));
if(!Number.isFinite(state.bombLossTotal)){
  const boards=[0,1,2].map(index=>{
    if(index===state.locationIndex&&!state.finished) return state.board;
    return state.completedLocations[index]?.board||[];
  });
  state.bombLossTotal=boards.flat().reduce((sum,cell)=>sum+Math.max(0,Number(cell?.bombLoss)||0),0);
}
let rabbitTimer=null;
let rabbitTapGuard={cellId:null,until:0};
let inlineAction=null;
let selectionMode=null;
let mageSpellViewIndex=null;

function totalHarvest(){ return Math.max(0,state.completedHarvest+state.locationHarvest); }
function addHarvest(amount,{countGross=true,countBase=false}={}){
  const gain=Math.max(0,Number(amount)||0);
  state.locationHarvest+=gain;
  if(countGross) state.grossHarvest=Math.max(0,(Number(state.grossHarvest)||0)+gain);
  if(countBase) state.baseHarvest=Math.max(0,(Number(state.baseHarvest)||0)+gain);
  return gain;
}
function multiplyHarvest(multiplier,{countGross=true}={}){
  const before=Math.max(0,Number(state.locationHarvest)||0);
  const after=Math.max(0,before*(Number(multiplier)||1));
  state.locationHarvest=after;
  const gain=Math.max(0,after-before);
  if(countGross) state.grossHarvest=Math.max(0,(Number(state.grossHarvest)||0)+gain);
  return {before,after,gain};
}
function isReviewMode(){ return state.viewLocationIndex !== state.locationIndex || state.finished; }
function cloneData(value){ return JSON.parse(JSON.stringify(value)); }
function snapshotCurrentLocation(){
  const snap={
    board:cloneData(state.board), movesLeft:state.movesLeft, locationHarvest:state.locationHarvest,
    inventory:cloneData(state.inventory), character:cloneData(state.character), keys:state.keys,
    locationLocked:true, keyBlockedOpenUsed:Boolean(state.keyBlockedOpenUsed), cumulativeHarvest:totalHarvest()
  };
  state.completedLocations[state.locationIndex]=snap;
  return snap;
}
function currentView(){
  const index=state.viewLocationIndex;
  if(index===state.locationIndex && !state.finished) return {index,board:state.board,movesLeft:state.movesLeft,locationHarvest:state.locationHarvest,inventory:state.inventory,character:state.character,keys:state.keys,keyBlockedOpenUsed:Boolean(state.keyBlockedOpenUsed),locationLocked:state.locationLocked,live:true,cumulativeHarvest:totalHarvest()};
  const snap=state.completedLocations[index];
  return snap?{index,...snap,keys:state.keys,live:false}:{index:state.locationIndex,board:state.board,movesLeft:state.movesLeft,locationHarvest:state.locationHarvest,inventory:state.inventory,character:state.character,keys:state.keys,keyBlockedOpenUsed:Boolean(state.keyBlockedOpenUsed),locationLocked:state.locationLocked,live:!state.finished,cumulativeHarvest:totalHarvest()};
}
function cellById(id){ return state.board.find(c=>c.id===Number(id)); }
function setStatus(text,icon='📜',kind='event',groupKey=null,{append=false}={}){
  state.status=text;
  if(!Array.isArray(state.sessionLog)) state.sessionLog=[];
  let row=null;
  if(groupKey) row=state.sessionLog.find(item=>item.groupKey===groupKey&&item.location===state.locationIndex+1);
  if(row){
    row.icon=icon||row.icon;
    row.kind=kind||row.kind;
    row.text=append&&row.text?`${row.text} • ${text}`:text;
  } else {
    state.sessionLog.push({id:uid(),text,icon,kind,groupKey,location:state.locationIndex+1});
  }
  if(state.sessionLog.length>300) state.sessionLog=state.sessionLog.slice(-300);
  renderStatusLog();
}
function markLogValue(text,kind='bonus'){
  const cls=kind==='debuff'?'log-negative':'log-positive';
  return `<span class="${cls}">${text}</span>`;
}
function toast(text,iconKey=null){ const el=$('toast'); el.innerHTML=iconKey?`<span class="toast-icon">${assetMarkup(iconKey,ICONS[iconKey]||'')}</span><span class="toast-text">${text}</span>`:text; el.classList.toggle('with-icon',Boolean(iconKey)); el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),2100); }
function highlightCell(id){ const el=document.querySelector(`[data-cell-id="${id}"]`); el?.classList.remove('highlight'); void el?.offsetWidth; el?.classList.add('highlight'); }

function inventoryCount(type){ return state.inventory.filter(x=>x.type===type).reduce((s,x)=>s+(x.count||1),0); }
function addInventory(type,count=1,timer=null){
  const stackable=['digitalMagnifier','mineralFertilizer','portableNeutralizer','goldenHoe'];
  const existing=stackable.includes(type)?state.inventory.find(x=>x.type===type&&x.timer==null):null;
  if(existing) existing.count=(existing.count||1)+count;
  else state.inventory.push({id:uid(),type,count,timer,justActivated:true});
}
function consumeInventory(type){
  const item=state.inventory.find(x=>x.type===type);
  if(!item) return false;
  item.count=(item.count||1)-1;
  if(item.count<=0) state.inventory=state.inventory.filter(x=>x.id!==item.id);
  return true;
}
function activeItem(type){ return state.inventory.find(x=>x.type===type); }

function openCell(id,source='normal'){
  const numericId=Number(id);
  if(rabbitTapGuard.cellId===numericId&&Date.now()<rabbitTapGuard.until) return;
  if(isReviewMode()||state.finished||state.locationLocked) return;
  const cell=cellById(id);
  if(!cell||cell.opened||cell.destroyed) return;
  if(cell.blocked && source!=='hoe'){ toast('Эта грядка заблокирована сорняком.'); return; }
  if(state.movesLeft<=0) return;

  // Запоминаем только те таймеры, которые уже действовали ДО этого открытия.
  // Новая бомба/ящик/предмет/персонаж не теряют ход в момент появления.
  const existingBoardTimerIds=new Set(state.board.filter(c=>c.opened&&c.timer!=null&&c.timer>0).map(c=>c.id));
  const existingInventoryTimerIds=new Set(state.inventory.filter(i=>i.timer!=null&&i.timer>0).map(i=>i.id));
  const existingCharacterToken=state.character ? state.character.token : null;

  if(source==='hoe') cell.blocked=false;
  cell.opened=true; cell.revealed=false;
  state.movesLeft--;

  processCell(cell);
  applyCharacterOnOpenedCell(cell);
  tickExistingEffects(existingBoardTimerIds,existingInventoryTimerIds,existingCharacterToken);
  maybeRabbit();
  maybeCharacter();

  if(state.movesLeft<=0){
    state.locationLocked=true;
    if(state.character){
      const pendingMageSpell=state.character.type==='mage'&&!state.character.spellChosen;
      state.character.inactive=!pendingMageSpell;
      if(pendingMageSpell){
        setStatus('Ходы закончились, но Кот-маг остаётся активным до выбора заклинания. Его выбор не блокирует переход или завершение игры.','🪄🐱','character',`character:${state.character.token}`,{append:true});
      } else {
        setStatus(`${CHARACTER_INFO[state.character.type].name} больше не активен: ходы в локации закончились.`,CHARACTER_INFO[state.character.type].icon,'character',`character:${state.character.token}`,{append:true});
      }
    }
    setStatus('Открытия закончились. Можно применить ключ к активному ящику или перейти дальше.');
  }
  render(); save();
}

function processCell(cell){
  if(cell.type==='wheat'){
    const baseAmount=Math.max(0,Number.isFinite(cell.originalAmount)?cell.originalAmount:cell.amount);
    let amount=cell.amount;
    const mage=state.character?.type==='mage'&&!state.character.inactive?state.character:null;
    if(mage&&mage.remainingTargets>0){
      const before=amount;
      amount+=10; cell.amount=amount;
      cell.characterBoost=(cell.characterBoost||0)+10;
      if(!Array.isArray(cell.characterEffects)) cell.characterEffects=[];
      cell.characterEffects.push({type:'mage',bonus:10,before,after:amount});
      mage.remainingTargets--; highlightCell(cell.id);
      setStatus(`Грядка ${cell.id+1}: ${before} → ${markLogValue(amount+' ед.')} (${markLogValue('+10')}).`,'✨','character',`character:${mage.token}`,{append:true});
      if(mage.remainingTargets<=0){
        if(mage.spellChosen) clearCharacter('Кот-маг завершил действие.');
        else setStatus('Бонус +10 завершён, но Кот-маг остаётся до выбора дополнительного заклинания.','🪄','character',`character:${mage.token}`,{append:true});
      }
    }
    else setStatus(`Собрано ${markLogValue(amount+' ед.')} пшеницы.`,'🌾','harvest');
    addHarvest(amount);
    state.baseHarvest=Math.max(0,(Number(state.baseHarvest)||0)+baseAmount);
  }
  if(cell.type==='bomb') activateBomb(cell);
  if(cell.type==='mole') processMole(cell);
  if(cell.type==='weed') processWeed(cell);
  if(cell.type==='chest') activateChest(cell);
}

function activeBombsForDefender(){
  return state.board.filter(c=>
    c.opened&&c.type==='bomb'&&Number.isFinite(c.timer)&&c.timer>0&&
    !c.destroyed&&!c.exploded&&!c.neutralized
  );
}

function applyDefenderToOpenBombs(){
  const defender=state.character?.type==='defender'&&!state.character.inactive?state.character:null;
  if(!defender) return false;
  if(!Array.isArray(defender.boostedBombs)) defender.boostedBombs=[];
  // Усиливаем только те бомбы, которые этот защитник ещё не трогал,
  // чтобы серия новых бомб не накручивала +3 на уже усиленные.
  const bombs=activeBombsForDefender().filter(b=>!defender.boostedBombs.includes(b.id));
  if(!bombs.length) return false;

  const details=bombs.map(b=>{
    const before=b.timer;
    b.timer+=3;
    defender.boostedBombs.push(b.id);
    highlightCell(b.id);
    return `грядка ${b.id+1}: ${before} → ${markLogValue(b.timer+' х.')} (${markLogValue('+3')})`;
  });
  // Защитник НЕ уходит: он остаётся на всё своё окно и прикрывает поле,
  // смягчая любые взрывы, пока активен (см. explodeBomb).
  setStatus(`Кот-защитник усилил бомбы и прикрывает поле: ${details.join(', ')}. Пока он на поле, взрывы бьют вдвое слабее.`,'🛡️','character',`character:${defender.token}`,{append:true});
  return true;
}

function activateBomb(cell){
  cell.timer=3; cell.justActivated=true;
  setStatus(`Бомба в грядке ${cell.id+1} активирована. До взрыва ${markLogValue('3 хода','debuff')}.`,'💣','debuff',`bomb:${cell.id}`);
  applyDefenderToOpenBombs();
  highlightCell(cell.id);
}

function explodeBomb(cell,forced=false){
  if(!cell||cell.destroyed) return;
  const shield=activeItem('bombShield');
  if(shield){ cell.timer=null; cell.destroyed=cell.summoned; setStatus(`Щит отразил взрыв бомбы в грядке ${cell.id+1}.`,'🛡️','bonus',`bomb:${cell.id}`,{append:true}); toast('🛡️ Взрыв заблокирован'); return; }
  const defender=state.character?.type==='defender'&&!state.character.inactive?state.character:null;
  const fullLoss=Math.max(0,Math.round(state.locationHarvest));
  const lostHarvest=defender?Math.max(0,Math.round(fullLoss*0.5)):fullLoss;
  const saved=Math.max(0,fullLoss-lostHarvest);
  cell.bombLoss=lostHarvest;
  state.bombLossTotal=Math.max(0,(Number(state.bombLossTotal)||0)+lostHarvest);
  state.locationHarvest=Math.max(0,state.locationHarvest-lostHarvest); cell.timer=null; cell.exploded=true;
  if(cell.summoned) cell.destroyed=true;
  if(defender){
    defender.mitigated=(defender.mitigated||0)+saved;
    setStatus(`${forced?'Нейтрализатор вызвал взрыв!':'Бомба взорвалась,'} но Кот-защитник принял удар на себя: потеряно только ${markLogValue('−'+lostHarvest,'debuff')} вместо ${fullLoss} (спасено ${markLogValue('+'+saved+' ед.')}).`,'🛡️','debuff',`bomb:${cell.id}`,{append:true});
  } else {
    // Полный взрыв (без защитника) «сжигает» все открытые пшеничные грядки:
    // их урожай уже обнулён выше, поэтому просто помечаем их визуально.
    state.board.forEach(w=>{ if(w.type==='wheat'&&w.opened&&!w.stolen&&!w.destroyed) w.burned=true; });
    setStatus(`${forced?'Нейтрализатор вызвал взрыв!':'Бомба взорвалась:'} уничтожено ${markLogValue('−'+lostHarvest,'debuff')} урожая текущей локации.`,'💣','debuff',`bomb:${cell.id}`,{append:true});
  }
  playSound('bombExplosion'); highlightCell(cell.id); flashBoardExplosion();
}

// Кратковременная красная рассеянная подсветка по краям блока с ячейками при взрыве.
function flashBoardExplosion(){
  const fx=document.getElementById('boardFlash')||document.querySelector('.board-panel');
  if(!fx) return;
  fx.classList.remove('flash');
  void fx.offsetWidth; // рестарт анимации, если взрывов несколько подряд
  fx.classList.add('flash');
  clearTimeout(flashBoardExplosion._t);
  flashBoardExplosion._t=setTimeout(()=>fx.classList.remove('flash'),850);
}

function processMole(cell){
  playSound('moleAppears'); highlightCell(cell.id);
  const groupKey=`mole:${cell.id}`;
  if(activeItem('scarecrow')){ setStatus('Пугало отпугнуло крота.','🐹','debuff',groupKey); return; }
  const chest=state.board.find(c=>c.type==='chest'&&c.opened&&!c.chestResolved&&c.timer>0);
  if(chest&&chance(BALANCE.moleChestStealChance)){
    chest.chestResolved=true; chest.timer=null; chest.destroyed=true;
    setStatus(`Крот украл Загадочный ящик из грядки ${chest.id+1} до его открытия.`,'🐹','debuff',groupKey); highlightCell(chest.id); return;
  }
  const wheat=shuffle(state.board.filter(c=>c.type==='wheat'&&c.opened&&!c.stolen&&c.amount>0)).slice(0,3);
  const stolenDetails=[];
  let stolenTotal=0;
  wheat.forEach(w=>{
    const stolen=w.amount;
    stolenTotal+=stolen;
    stolenDetails.push(`грядка ${w.id+1}: ${markLogValue('−'+stolen,'debuff')}`);
    state.locationHarvest=Math.max(0,state.locationHarvest-stolen);
    w.stolenAmount=stolen; w.amount=0; w.stolen=true; highlightCell(w.id);
  });
  if(stolenTotal>0){
    state.moleStolenTotal=(state.moleStolenTotal||0)+stolenTotal;
    if(!Array.isArray(state.moleStolenByLocation)) state.moleStolenByLocation=[0,0,0];
    state.moleStolenByLocation[state.locationIndex]=(state.moleStolenByLocation[state.locationIndex]||0)+stolenTotal;
  }
  if(wheat.length===0){
    setStatus('На поле ещё нет открытой пшеницы.','🐹','debuff',groupKey);
    const summoned=summonMoleHazards(['bomb','weed']);
    appendMoleSummons(groupKey,summoned);
    if(!summoned.length) setStatus('Свободных грядок для призыва не осталось.','🐹','debuff',groupKey,{append:true});
    return;
  }
  setStatus(`Крот украл урожай: ${stolenDetails.join(', ')}. Всего ${markLogValue('−'+stolenTotal,'debuff')}.`,'🐹','debuff',groupKey);
  if(wheat.length===1){
    const summoned=summonHazard();
    appendMoleSummons(groupKey,summoned);
  }
}

function appendMoleSummons(groupKey,summoned){
  summoned.forEach(item=>{
    let detail='';
    if(item.type==='bomb'){
      detail=`Крот призвал бомбу в грядку ${item.cellId+1}; источник отмечен 🐹.`;
    } else {
      const blocked=item.blockedCellIds?.length
        ? `сорняк заблокировал ${item.blockedCellIds.length===1?'грядку':'грядки'} ${item.blockedCellIds.map(id=>id+1).join(', ')}`
        : 'сорняк не нашёл свободных соседних грядок';
      const beetle=item.summonedBeetle?` и призвал жука 🪲`:'';
      detail=`Крот призвал сорняк в грядку ${item.cellId+1}; ${blocked}${beetle}.`;
    }
    setStatus(detail,'🐹','debuff',groupKey,{append:true});
  });
}

function summonMoleHazards(types){
  const summoned=[];
  for(const type of types){
    const candidates=state.board.filter(c=>!c.opened&&!c.blocked&&!c.destroyed);
    if(!candidates.length) break;
    const target=pick(candidates);
    target.type=type; target.amount=0; target.blocked=true; target.summoned=true; target.summonedByMole=true; target.summonedBeetle=false;
    const result={type,cellId:target.id,blockedCellIds:[],summonedBeetle:false};
    if(type==='bomb'){
      target.opened=true; target.timer=3; target.justActivated=true;
      activateDefenderIfPresent();
    } else {
      target.opened=true; target.blocked=false; target.justActivated=true;
      const weedResult=processWeed(target,{silent:true});
      result.blockedCellIds=weedResult.blockedCellIds;
      result.summonedBeetle=weedResult.summonedBeetle;
    }
    highlightCell(target.id);
    summoned.push(result);
  }
  return summoned;
}

function summonHazard(){
  const type=chance(.5)?'bomb':'weed';
  return summonMoleHazards([type]);
}
function activateDefenderIfPresent(){
  applyDefenderToOpenBombs();
}

function neighborsOf(cell){
  const row=Math.floor(cell.id/5), col=cell.id%5;
  return state.board.filter(c=>{
    if(c.id===cell.id) return false;
    const r=Math.floor(c.id/5), cc=c.id%5;
    return Math.abs(r-row)<=1&&Math.abs(cc-col)<=1;
  });
}
function processWeed(cell,{silent=false}={}){
  playSound('weedBlocks'); highlightCell(cell.id);
  // Только восемь непосредственных соседей: горизонталь, вертикаль и диагональ.
  const available=neighborsOf(cell).filter(c=>!c.opened&&!c.blocked&&!c.destroyed);
  const targets=shuffle(available).slice(0,2);
  targets.forEach(t=>{
    t.blocked=true;
    t.blockedBy=[...(t.blockedBy||[]),cell.id];
    highlightCell(t.id);
  });

  const baseBeetleChance=targets.length===0?1:targets.length===1?.30:0;
  const moleBonus=cell.summonedByMole?.20:0;
  const beetleChance=Math.min(1,baseBeetleChance+moleBonus);
  const summonedBeetle=chance(beetleChance);
  if(summonedBeetle){
    state.beetles++;
    cell.summonedBeetle=true;
    playSound('beetleSummoned');
  }

  if(!silent){
    const origin=cell.summonedByMole?'Крот призвал сорняк':'Сорняк появился';
    const blockedText=targets.length
      ? `заблокировал ${targets.length===1?'грядку':'грядки'} ${targets.map(t=>t.id+1).join(', ')}`
      : 'не нашёл свободных соседних грядок';
    const beetleText=summonedBeetle?` и призвал жука 🪲 (всего жуков: ${state.beetles})`:'';
    setStatus(`${origin} в грядке ${cell.id+1}: ${blockedText}${beetleText}.`,'🌿','debuff',`weed:${cell.id}`);
  }
  return {blockedCellIds:targets.map(t=>t.id),summonedBeetle,beetleChance};
}

function activateChest(cell){ cell.timer=3; cell.justActivated=true; playSound('chestFound'); setStatus(`Загадочный ящик в грядке ${cell.id+1} откроется через 3 хода.`,'🎁','bonus',`chest:${cell.id}`); highlightCell(cell.id); }
function resolveChest(cell,byKey=false){
  if(!cell||cell.chestResolved||cell.destroyed) return;
  cell.chestResolved=true; cell.timer=null; playSound('chestBonus');
  const bonus=weightedKey(BALANCE.chestBonusWeights); const info=grantBonus(bonus)||{};
  cell.resolvedBonus=bonus;
  const detail=info.detail||BONUS_DESCRIPTIONS[bonus];
  setStatus(`${byKey?'Ключ открыл':'Открылся'} ящик. Выпал бонус: ${BONUS_NAMES[bonus]}. ${detail}`,ICONS[bonus],'bonus',`chest:${cell.id}`,{append:true}); highlightCell(cell.id);
}

function grantBonus(type){
  if(type==='wateringCan'){ const n=randInt(20,40); addHarvest(n); toast(`+${n} урожая`,'wateringCan'); return {amount:n,detail:`Добавила ${markLogValue(n+' ед.')} урожая.`}; }
  if(type==='enchantedSickle'){
    const r=Math.random(); const n=r<.25?randInt(10,30):r<.8?randInt(31,70):randInt(71,100);
    addHarvest(n); toast(`Серп принёс ${n}`,'enchantedSickle'); return {amount:n,detail:`Принёс ${markLogValue(n+' ед.')} урожая.`};
  }
  if(type==='agroRushX2'){ multiplyHarvest(2); toast('Агро-рывок ×2','agroRushX2'); return {detail:'Умножил урожай локации ×2.'}; }
  if(type==='agroRushX3'){ multiplyHarvest(3); toast('Агро-рывок ×3','agroRushX3'); return {detail:'Умножил урожай локации ×3.'}; }
  if(type==='bombShield') addInventory(type,1,5);
  else if(type==='scarecrow') addInventory(type,1,3);
  else if(type==='digitalMagnifier') addInventory(type,2,null);
  else addInventory(type,1,null);
  return {detail:BONUS_DESCRIPTIONS[type]};
}

function tickExistingEffects(boardTimerIds,inventoryTimerIds,characterToken){
  state.board.forEach(cell=>{
    if(!boardTimerIds.has(cell.id)) return;
    if(!cell.opened||cell.timer==null||cell.timer<=0) return;
    cell.timer--;
    if(cell.timer===0){
      if(cell.type==='bomb') explodeBomb(cell);
      else if(cell.type==='chest') resolveChest(cell);
    }
  });

  state.inventory.forEach(item=>{
    if(!inventoryTimerIds.has(item.id)) return;
    if(item.timer==null||item.timer<=0) return;
    item.timer--;
    if(item.type==='scarecrow') addHarvest(5);
  });
  state.inventory=state.inventory.filter(item=>item.timer==null||item.timer>0);

  if(state.character && !state.character.inactive && state.character.token===characterToken){
    if(state.character.type==='defender'){
      state.character.timer--;
      if(state.character.timer<=0){
        const saved=Math.max(0,Math.round(state.character.mitigated||0));
        if(saved>0){
          clearCharacter(`Кот-защитник ушёл, прикрыв поле и спася ${markLogValue('+'+saved+' ед.')} от взрывов.`);
        } else {
          const bonus=12; addHarvest(bonus);
          clearCharacter(`Кот-защитник ушёл: взрывов не случилось, за дежурство ${markLogValue('+'+bonus+' ед.')} урожая.`);
        }
      }
    } else if(state.character.type==='scientist'){
      state.character.timer--;
      if(state.character.timer<=0){ multiplyHarvest(2); clearCharacter('Кот-учёный удвоил урожай.'); }
    } else if(state.character.type==='economist') tickEconomist();
  }
}
function tickEconomist(){
  const ch=state.character; if(!ch||ch.type!=='economist'||ch.inactive) return;
  const bonuses=[20,40,60]; const bonus=bonuses[ch.step]||0;
  const candidates=state.board.filter(c=>c.type==='wheat'&&c.opened&&!c.stolen&&!ch.usedCells.includes(c.id));
  if(candidates.length){
    const target=pick(candidates);
    const before=target.amount;
    target.amount+=bonus;
    target.characterBoost=(target.characterBoost||0)+bonus;
    if(!Array.isArray(target.characterEffects)) target.characterEffects=[];
    target.characterEffects.push({type:'economist',bonus,before,after:target.amount});
    addHarvest(bonus); ch.usedCells.push(target.id); ch.step++; highlightCell(target.id);
    setStatus(`Грядка ${target.id+1}: ${before} → ${markLogValue(target.amount+' ед.')} (${markLogValue('+'+bonus)}).`,'📈','character',`character:${ch.token}`,{append:true});
  }
  ch.timer--;
  if(ch.step>=3||ch.timer<=0) clearCharacter(ch.step>=3?'Кот-экономист завершил расчёты.':'Кот-экономист ушёл: подходящих целей не хватило.');
}

function applyCharacterOnOpenedCell(cell){
  // Mage is handled before wheat is added. Other characters work by timers.
}
function clearCharacter(message=''){ const ch=state.character; state.character=null; if(message) setStatus(message,'🐱','character',ch?`character:${ch.token}`:null,{append:Boolean(ch)}); }

function maybeCharacter(){
  if(state.character||state.characterSpawns>=BALANCE.characterMaxPerLocation||state.movesLeft<=0) return;
  if(!chance(BALANCE.characterChance)) return;
  summonCharacter(weightedKey(BALANCE.characterWeights));
}
function summonCharacter(type){
  if(state.character) return;
  state.characterSpawns++;
  const base={type,token:uid()};
  if(type==='defender') state.character={...base,timer:5,boostedBombs:[],mitigated:0};
  if(type==='mage') state.character={...base,remainingTargets:3,spellChosen:false,chosenSpell:null};
  if(type==='scientist') state.character={...base,timer:4};
  if(type==='economist') state.character={...base,timer:3,step:0,usedCells:[]};
  playSound('characterAppears');
  setStatus(`Появился ${CHARACTER_INFO[type].name}.`,CHARACTER_INFO[type].icon,'character',`character:${state.character.token}`);
  // Если защитник появился, когда бомбы уже активны, он должен сразу
  // увеличить таймер всех доступных бомб и исчезнуть.
  if(type==='defender') applyDefenderToOpenBombs();
}


function mageStolenHarvestTotal(){
  return state.board.filter(c=>c.type==='wheat'&&c.stolen&&(c.stolenAmount||0)>0).reduce((sum,c)=>sum+(c.stolenAmount||0),0);
}
function openMageSpellDialog(){
  const view=currentView();
  const mage=view.character?.type==='mage'?view.character:null;
  const canChoose=Boolean(mage&&!mage.spellChosen&&!state.finished&&(view.locationLocked||view.movesLeft<=0||view.live));
  if(!canChoose) return;
  mageSpellViewIndex=view.index;
  const stolen=view.board.filter(c=>c.type==='wheat'&&c.stolen&&(c.stolenAmount||0)>0).reduce((sum,c)=>sum+(c.stolenAmount||0),0);
  const dialog=$('choiceDialog');
  $('choiceTitle').textContent='🪄 Заклинание Кота-мага';
  $('choiceText').textContent='Выберите одно дополнительное заклинание. Бонус +10 к трём открытым пшеничным грядкам продолжит действовать независимо от выбора.';
  $('choiceGrid').innerHTML=`
    <button type="button" data-mage-spell="restore" ${stolen<=0?'disabled':''}>↩️ Вернуть украденный урожай${stolen>0?` (+${stolen})`:' — нечего возвращать'}</button>
    <button type="button" data-mage-spell="scarecrow">🧍 Призвать Пугало на 3 хода</button>
    <button type="button" data-mage-spell="fertilizer">🧪 Получить Минеральное удобрение</button>`;
  dialog.showModal();
  dialog.querySelectorAll('[data-mage-spell]').forEach(btn=>btn.onclick=()=>chooseMageSpell(btn.dataset.mageSpell));
}
function chooseMageSpell(spell){
  const viewIndex=Number.isInteger(mageSpellViewIndex)?mageSpellViewIndex:currentView().index;
  withViewedLocationContext(viewIndex,()=>{
    const mage=state.character?.type==='mage'?state.character:null;
    if(!mage||mage.spellChosen||state.finished) return;
    if(spell==='restore'){
      const stolenCells=state.board.filter(c=>c.type==='wheat'&&c.stolen&&(c.stolenAmount||0)>0);
    if(!stolenCells.length) return toast('Крот ещё ничего не украл.');
    const restored=stolenCells.reduce((sum,c)=>sum+(c.stolenAmount||0),0);
    stolenCells.forEach(c=>{ c.amount=c.stolenAmount||0; c.stolen=false; c.stolenAmount=0; highlightCell(c.id); });
    addHarvest(restored,{countGross:false});
    state.moleStolenTotal=Math.max(0,(state.moleStolenTotal||0)-restored);
    if(Array.isArray(state.moleStolenByLocation)) state.moleStolenByLocation[state.locationIndex]=Math.max(0,(state.moleStolenByLocation[state.locationIndex]||0)-restored);
    setStatus(`Кот-маг вернул украденный кротом урожай: ${markLogValue('+'+restored+' ед.')}.`,'↩️','character',`character:${mage.token}`,{append:true});
  } else if(spell==='scarecrow'){
    addInventory('scarecrow',1,3);
    setStatus('Кот-маг призвал Пугало на 3 хода: +5 урожая за ход и защита от крота.','🧍','character',`character:${mage.token}`,{append:true});
  } else if(spell==='fertilizer'){
    addInventory('mineralFertilizer',1,null);
    setStatus('Кот-маг создал Минеральное удобрение. Оно добавлено в активы.','🧪','character',`character:${mage.token}`,{append:true});
    } else return;
    mage.spellChosen=true; mage.chosenSpell=spell;
    if((mage.remainingTargets||0)<=0 && !state.locationLocked && state.movesLeft>0) clearCharacter('Кот-маг завершил действие.');
    else mage.inactive=Boolean(state.locationLocked||state.movesLeft<=0);
  });
  mageSpellViewIndex=null;
  $('choiceDialog').close(); render(); save();
}

function maybeRabbit(){
  if(state.activeRabbitCell!=null||state.rabbitSpawns>=BALANCE.rabbitMaxPerLocation||state.movesLeft<=0) return;
  if(!chance(BALANCE.rabbitChance)) return;
  const cells=state.board.filter(c=>!c.opened&&!c.blocked&&!c.destroyed);
  if(!cells.length) return;
  const target=pick(cells); state.activeRabbitCell=target.id; state.rabbitSpawns++; playSound('rabbitAppears'); renderBoard();
  clearTimeout(rabbitTimer); rabbitTimer=setTimeout(()=>{state.activeRabbitCell=null;renderBoard();save();},BALANCE.rabbitLifetimeMs);
}
function catchRabbit(id){
  if(isReviewMode()) return;
  if(Number(id)!==state.activeRabbitCell) return;
  // Блокируем последующий синтетический click по грядке после тапа по кролику.
  const caughtCellId=Number(id);
  rabbitTapGuard={cellId:caughtCellId,until:Date.now()+450};
  clearTimeout(rabbitTimer);
  state.activeRabbitCell=null;
  state.keys++;
  playSound('rabbitKey');
  toast('🐇 Кролик пойман: +1 ключ');
  render();
  save();
}

function withViewedLocationContext(viewIndex, callback){
  if(viewIndex===state.locationIndex && !state.finished) return callback(state);
  const snap=state.completedLocations[viewIndex];
  if(!snap) return null;
  const saved={
    locationIndex:state.locationIndex, board:state.board, movesLeft:state.movesLeft,
    locationHarvest:state.locationHarvest, inventory:state.inventory, character:state.character,
    locationLocked:state.locationLocked, keyBlockedOpenUsed:state.keyBlockedOpenUsed
  };
  const beforeHarvest=Number(snap.locationHarvest)||0;
  state.locationIndex=viewIndex;
  state.board=snap.board;
  state.movesLeft=0;
  state.locationHarvest=beforeHarvest;
  state.inventory=snap.inventory||[];
  state.character=snap.character||null;
  state.locationLocked=true;
  state.keyBlockedOpenUsed=Boolean(snap.keyBlockedOpenUsed);
  try { return callback(state); }
  finally {
    const afterHarvest=Math.max(0,Number(state.locationHarvest)||0);
    snap.board=state.board;
    snap.locationHarvest=afterHarvest;
    snap.inventory=state.inventory;
    snap.character=state.character;
    snap.keyBlockedOpenUsed=Boolean(state.keyBlockedOpenUsed);
    snap.cumulativeHarvest=(Number(snap.cumulativeHarvest)||0)+(afterHarvest-beforeHarvest);
    state.completedHarvest=Math.max(0,state.completedHarvest+(afterHarvest-beforeHarvest));
    Object.assign(state,saved);
  }
}

function viewedKeyTargets(){
  const view=currentView();
  const locked=Boolean(view.locationLocked||view.movesLeft<=0||!view.live);
  const chest=view.board.find(c=>c.type==='chest'&&c.opened&&!c.chestResolved&&!c.destroyed&&c.timer>0);
  const blocked=view.board.filter(c=>c.blocked&&!c.opened&&!c.destroyed);
  return {view,locked,chest,blocked};
}

function openChestWithKey(viewIndex,cellId){
  if(state.keys<=0) return;
  withViewedLocationContext(viewIndex,()=>{
    const chest=state.board.find(c=>c.id===cellId);
    if(!chest||chest.chestResolved||chest.destroyed) return;
    state.keys--;
    resolveChest(chest,true);
  });
  clearInlineAction(); render(); save();
}

function openBlockedCellWithKey(viewIndex,cellId){
  if(state.keys<=0) return;
  withViewedLocationContext(viewIndex,()=>{
    if(state.keyBlockedOpenUsed){ toast('В этой локации ключом уже открывали заблокированную грядку.'); return; }
    const cell=state.board.find(c=>c.id===Number(cellId));
    if(!cell||!cell.blocked||cell.opened||cell.destroyed) return;
    state.keys--;
    state.keyBlockedOpenUsed=true;
    cell.blocked=false; cell.opened=true; cell.revealed=false; cell.openedByKey=true;
    const groupKey=`key-cell:${cell.id}`;
    if(cell.type==='wheat'){
      addHarvest(cell.amount);
      state.baseHarvest=Math.max(0,(Number(state.baseHarvest)||0)+Math.max(0,Number.isFinite(cell.originalAmount)?cell.originalAmount:cell.amount));
      setStatus(`Ключом открыта заблокированная грядка ${cell.id+1}: получено ${markLogValue(cell.amount+' ед.')} пшеницы.`,'🔑','bonus',groupKey);
      } else if(cell.type==='chest'){
      setStatus(`Ключом открыта заблокированная грядка ${cell.id+1}: обнаружен Загадочный ящик.`,'🔑','bonus',groupKey);
      resolveChest(cell,true);
    } else if(cell.type==='bomb'){
      setStatus(`Ключом открыта заблокированная грядка ${cell.id+1}: обнаружена бомба.`,'🔑','debuff',groupKey);
      explodeBomb(cell);
    } else if(cell.type==='mole'){
      setStatus(`Ключом открыта заблокированная грядка ${cell.id+1}: обнаружен крот.`,'🔑','debuff',groupKey);
      processMole(cell);
    } else if(cell.type==='weed'){
      setStatus(`Ключом открыта заблокированная грядка ${cell.id+1}: обнаружен сорняк.`,'🔑','debuff',groupKey);
      processWeed(cell);
    }
    highlightCell(cell.id);
  });
  clearInlineAction(); render(); save();
}

function exchangeKeys(viewIndex,count){
  if(state.finished||state.keys<=0) return;
  const view=currentView();
  if(view.index!==Number(viewIndex)||!(view.locationLocked||view.movesLeft<=0||!view.live)) return;
  const used=Math.min(Math.max(0,Number(count)||0),state.keys);
  if(!used) return toast('Нет ключей для обмена.');
  const bonus=used*10;
  withViewedLocationContext(view.index,()=>{
    state.keys-=used;
    addHarvest(bonus);
    state.keyExchangeHarvest=(state.keyExchangeHarvest||0)+bonus;
    setStatus(`Обмен ключей: обменяно ${used}, получено ${markLogValue('+'+bonus+' ед.')} урожая.`,'🔑','bonus',`key-exchange:${view.index}`,{append:Boolean(state.sessionLog?.some(x=>x.groupKey===`key-exchange:${view.index}`))});
  });
  clearInlineAction(); render(); save();
}

function useKey(){
  if(state.finished) return toast('Сессия уже завершена.');
  if(state.keys<=0) return toast('Ключей нет.');
  const {view,locked,chest,blocked}=viewedKeyTargets();
  if(!locked) return toast('Ключ можно использовать после завершения открытий локации.');
  const actions=[];
  if(chest) actions.push({label:`🎁 Открыть ящик в грядке ${chest.id+1}`,run:()=>openChestWithKey(view.index,chest.id)});
  if(blocked.length&&!view.keyBlockedOpenUsed) actions.push({label:'🔓 Открыть заблокированную грядку',run:()=>{
    // Ключ подсвечивает доступные заблокированные грядки, но не раскрывает их содержимое.
    openInlineAction('🔑 Ключ от грядки','Выберите одну подсвеченную заблокированную грядку. Содержимое останется скрытым до открытия и сработает сразу после выбора.',[],id=>openBlockedCellWithKey(view.index,id),{pickerIds:blocked.map(c=>c.id),onCancel:()=>clearInlineAction()});
    render();
  }});
  const canExchange=Boolean(view.locationLocked||view.movesLeft<=0||!view.live);
  if(canExchange){
    actions.push({label:'🌾 Обменять 1 ключ на +10',run:()=>exchangeKeys(view.index,1)});
    if(state.keys>1) actions.push({label:`🌾 Обменять все (${state.keys}) на +${state.keys*10}`,run:()=>exchangeKeys(view.index,state.keys)});
  }
  if(!actions.length) return toast('Сейчас ключ применить не к чему.');
  openInlineAction('🔑 Использование ключа','Выберите действие. На каждой локации ключом можно открыть не более одной заблокированной грядки.',actions.map((a,i)=>({label:a.label,value:i})),value=>actions[Number(value)]?.run());
}

function inventoryBonusApplicable(type,view=currentView()){
  const board=view.board||[];
  if(type==='digitalMagnifier') return Boolean(view.live&&view.movesLeft>0&&board.some(c=>!c.opened&&!c.blocked&&!c.destroyed));
  if(type==='mineralFertilizer') return board.some(c=>c.type==='wheat'&&c.opened&&!c.stolen&&!c.fertilized&&c.amount>0);
  if(type==='portableNeutralizer') return board.some(c=>c.type==='bomb'&&c.opened&&c.timer>0&&!c.destroyed&&!c.exploded&&!c.neutralized);
  if(type==='goldenHoe') return board.some(c=>c.blocked&&!c.opened&&!c.destroyed);
  return false;
}

function useInventory(type){
  const view=currentView();
  if(!inventoryBonusApplicable(type,view)) return toast('В этой локации бонус сейчас применить нельзя.');
  if(type==='digitalMagnifier') useMagnifier(view.index);
  if(type==='mineralFertilizer') useFertilizer(view.index);
  if(type==='portableNeutralizer') useNeutralizer(view.index);
  if(type==='goldenHoe') useHoe(view.index);
}

function clearInlineAction({clearReveals=false}={}){
  if(clearReveals) state.board.forEach(c=>c.revealed=false);
  inlineAction=null; selectionMode=null;
  renderInlineAction(); renderBoard(); save();
}
function openInlineAction(title,text,items,onSelect,{pickerIds=null,onCancel=null}={}){
  inlineAction={title,text,items,onSelect,onCancel};
  selectionMode=pickerIds?{ids:new Set(pickerIds.map(Number)),onPick:onSelect}:null;
  renderInlineAction(); renderBoard();
}
function renderInlineAction(){
  const box=$('inlineAction'); if(!box) return;
  if(!inlineAction){ box.classList.add('hidden'); box.innerHTML=''; return; }
  box.classList.remove('hidden');
  box.innerHTML=`<div class="inline-action-head"><div><strong>${inlineAction.title}</strong><p>${inlineAction.text}</p></div><button type="button" class="inline-cancel" aria-label="Закрыть">×</button></div><div class="inline-options">${inlineAction.items.map((item,i)=>`<button type="button" data-inline-option="${i}">${item.label}</button>`).join('')}</div>`;
  box.querySelector('.inline-cancel').onclick=()=>{ const fn=inlineAction?.onCancel; if(fn) fn(); else clearInlineAction({clearReveals:true}); };
  box.querySelectorAll('[data-inline-option]').forEach(btn=>btn.onclick=()=>{
    const action=inlineAction; const item=action.items[Number(btn.dataset.inlineOption)];
    action.onSelect(item.value);
  });
}

function useMagnifier(viewIndex=state.viewLocationIndex){
  const candidates=state.board.filter(c=>!c.opened&&!c.blocked&&!c.destroyed);
  if(!candidates.length) return toast('Нет доступных закрытых ячеек.');
  setStatus('Цифровая лупа активирована: выберите закрытую ячейку для просмотра.','🔍','bonus');
  openInlineAction('🔍 Цифровая лупа','Выберите полупрозрачную ячейку на поле. Просмотр не расходует открытие.',[],id=>{
    const cell=cellById(id); if(!cell) return;
    cell.revealed=true; consumeInventory('digitalMagnifier'); selectionMode=null; renderBoard();
    openInlineAction('🔍 Содержимое обнаружено',`${ICONS[cell.type]} ${cell.type==='wheat'?`Пшеница: ${cell.amount}`:typeLabel(cell.type)}.`,[
      {value:'open',label:'Открыть (−1 открытие)'},{value:'close',label:'Оставить закрытой'}
    ],answer=>{
      inlineAction=null; selectionMode=null;
      if(answer==='open') openCell(cell.id,'magnifier');
      else {cell.revealed=false;setStatus(`Лупа показала грядку ${cell.id+1}; ячейка оставлена закрытой.`,'🔍','bonus');render();save();}
    },{onCancel:()=>{cell.revealed=false;clearInlineAction();}});
  },{pickerIds:candidates.map(c=>c.id),onCancel:()=>clearInlineAction()});
}
function useFertilizer(viewIndex=state.viewLocationIndex){
  const view=currentView();
  const candidates=view.board.filter(c=>c.type==='wheat'&&c.opened&&!c.stolen&&!c.fertilized&&c.amount>0);
  if(!candidates.length) return toast('Нет подходящей пшеничной ячейки.');
  setStatus('Минеральное удобрение готово: выберите открытую пшеничную ячейку.','🧪','bonus');
  openInlineAction('🧪 Минеральное удобрение','Выберите подсвеченную пшеничную ячейку для удвоения.',[],id=>{
    withViewedLocationContext(viewIndex,()=>{
      const c=cellById(id); if(!c) return;
      const add=c.amount; c.amount*=2; c.fertilized=true; c.characterBoost=(c.characterBoost||0)+add; addHarvest(add); consumeInventory('mineralFertilizer');
      setStatus(`Грядка ${c.id+1}: ${add} → ${markLogValue(c.amount+' ед.')} (${markLogValue('+'+add)}).`,'🧪','bonus',`fertilizer:${c.id}`);
    });
    clearInlineAction(); highlightCell(id); render(); save();
  },{pickerIds:candidates.map(c=>c.id),onCancel:()=>clearInlineAction()});
}
function useNeutralizer(viewIndex=state.viewLocationIndex){
  const view=currentView();
  const bombs=view.board.filter(c=>c.type==='bomb'&&c.opened&&c.timer>0&&!c.destroyed&&!c.exploded&&!c.neutralized);
  if(!bombs.length) return toast('Нет активной бомбы.');
  setStatus('Портативный нейтрализатор активирован: выберите бомбу.','🧰','bonus');
  openInlineAction('🧰 Портативный нейтрализатор','75% успеха, 25% немедленного взрыва. Выберите подсвеченную бомбу.',[],id=>{
    withViewedLocationContext(viewIndex,()=>{
      const c=cellById(id); if(!c) return;
      consumeInventory('portableNeutralizer');
      if(chance(BALANCE.neutralizerSuccessChance)){ c.timer=null; c.neutralized=true; c.destroyed=false; setStatus(`Бомба в грядке ${c.id+1} ${markLogValue('обезврежена')}.`,'🧰','bonus',`bomb:${c.id}`,{append:true}); }
      else explodeBomb(c,true);
    });
    clearInlineAction(); highlightCell(id); render(); save();
  },{pickerIds:bombs.map(c=>c.id),onCancel:()=>clearInlineAction()});
}
function useHoe(viewIndex=state.viewLocationIndex){
  const view=currentView();
  const blocked=view.board.filter(c=>c.blocked&&!c.opened&&!c.destroyed);
  if(!blocked.length) return toast('Нет заблокированных ячеек.');
  blocked.forEach(c=>c.revealed=true);
  setStatus('Золотая тяпка показала все заблокированные ячейки. Можно открыть одну.','🪄','bonus');
  openInlineAction('🪄 Золотая тяпка','Заблокированные ячейки стали полупрозрачными. Выберите одну прямо на поле.',[],id=>{
    withViewedLocationContext(viewIndex,()=>{
      state.board.forEach(c=>c.revealed=false);
      const cell=cellById(id); if(!cell||!cell.blocked||cell.opened||cell.destroyed) return;
      consumeInventory('goldenHoe');
      cell.blocked=false; cell.opened=true; cell.revealed=false;
      processCell(cell); applyCharacterOnOpenedCell(cell); highlightCell(cell.id);
    });
    inlineAction=null; selectionMode=null; render(); save();
  },{pickerIds:blocked.map(c=>c.id),onCancel:()=>{blocked.forEach(c=>c.revealed=false);clearInlineAction();}});
}

function typeLabel(type){ return ({bomb:'Бомба',mole:'Крот',weed:'Сорняк',chest:'Загадочный ящик',wheat:'Пшеница'})[type]||type; }

function goNext(){
  if(state.viewLocationIndex < state.locationIndex){ state.viewLocationIndex++; playSound('locationChange'); render(); save(); return; }
  if(state.finished) return;
  if(!state.locationLocked) return;

  // На финальной локации сначала даём распорядиться оставшимися ключами.
  // Урожай фиксируется только при фактическом завершении, чтобы повторное
  // нажатие не добавляло одну и ту же локацию несколько раз.
  if(state.locationIndex>=2&&state.keys>0){
    const actions=[
      {label:'🌾 Обменять 1 ключ на +10',run:()=>exchangeKeys(state.locationIndex,1)},
      {label:`🌾 Обменять все ключи (${state.keys}) на +${state.keys*10}`,run:()=>exchangeKeys(state.locationIndex,state.keys)},
      {label:'✅ Завершить без обмена',run:()=>{clearInlineAction();snapshotCurrentLocation();state.completedHarvest+=state.locationHarvest;finishSession();}},
      {label:'↩️ Вернуться к локациям',run:()=>clearInlineAction()}
    ];
    openInlineAction('🔑 Остались ключи','Можно открыть ими сундуки или по одной заблокированной грядке в каждой локации, либо обменять каждый ключ на 10 единиц урожая.',actions.map((a,i)=>({label:a.label,value:i})),value=>actions[Number(value)]?.run());
    render(); save(); return;
  }

  snapshotCurrentLocation();
  state.completedHarvest+=state.locationHarvest;
  if(state.locationIndex>=2){ finishSession(); return; }
  state.locationIndex++;
  state.viewLocationIndex=state.locationIndex;
  playSound('locationChange');
  state.board=createBoard(); state.movesLeft=OPENS_PER_LOCATION; state.locationHarvest=0; state.inventory=[]; state.character=null;
  state.rabbitSpawns=0; state.characterSpawns=0; state.activeRabbitCell=null; state.locationLocked=false; state.keyBlockedOpenUsed=false;
  setStatus('Новая локация. Откройте грядку.'); render(); save();
}
function goBack(){
  if(state.viewLocationIndex<=0) return;
  state.viewLocationIndex--;
  playSound('locationChange');
  clearInlineAction();
  render(); save();
}
function beetleRange(count){
  if(count<=0) return [0,0];
  if(count===1) return [20,40]; if(count===2) return [25,50]; if(count===3) return [30,60]; return [35,60];
}
function finishSession(){
  state.finished=true;
  const before=state.completedHarvest; const [min,max]=beetleRange(state.beetles); const pct=state.beetles?randInt(min,max):0;
  const loss=Math.round(before*pct/100); const final=Math.max(0,before-loss);
  const finishedAt=new Date().toISOString();
  const baseGross=Math.max(0,Math.round(Number(state.baseHarvest)||0));
  const gross=Math.max(0,Math.round(Number(state.grossHarvest)||0));
  const moleLoss=Math.max(0,Math.round(Number(state.moleStolenTotal)||0));
  // До жуков единственные постоянные потери — кроты и взорвавшиеся бомбы.
  // Выводим значение, согласованное с итоговой формулой, а отдельный счётчик
  // сохраняем для диагностики и новых сессий.
  const inferredBombLoss=Math.max(0,gross-moleLoss-Math.max(0,Math.round(before)));
  const trackedBombLoss=Math.max(0,Math.round(Number(state.bombLossTotal)||0));
  const bombLoss=inferredBombLoss;
  state.finalResult={baseGross,gross,positiveGain:Math.max(0,gross-baseGross),before,bombLoss,trackedBombLoss,beetles:state.beetles,pct,loss,final,finishedAt,keyExchangeHarvest:state.keyExchangeHarvest||0,moleStolenTotal:moleLoss,moleStolenByLocation:Array.isArray(state.moleStolenByLocation)?state.moleStolenByLocation:[0,0,0]};
  state.resultDialogDismissed=false; state.viewLocationIndex=state.locationIndex; save(); showResult();
}
function showResult(){
  const r=state.finalResult; if(!r) return;
  const moleBreakdown=(r.moleStolenByLocation||[]).map((value,index)=>value?`Локация ${index+1}: −${value}`:'').filter(Boolean).join(' • ');
  const ended=r.finishedAt?new Date(r.finishedAt):new Date();
  const endedText=ended.toLocaleString('ru-RU');
  const gross=Number.isFinite(r.gross)?Math.max(0,Math.round(r.gross)):Math.max(0,Math.round((Number(r.before)||0)+(Number(r.moleStolenTotal)||0)+(Number(r.bombLoss)||0)));
  const baseGross=Number.isFinite(r.baseGross)?Math.max(0,Math.round(r.baseGross)):gross;
  const positiveGain=Number.isFinite(r.positiveGain)?Math.max(0,Math.round(r.positiveGain)):Math.max(0,gross-baseGross);
  const moleLoss=Math.max(0,Math.round(Number(r.moleStolenTotal)||0));
  const bombLoss=Number.isFinite(r.bombLoss)?Math.max(0,Math.round(r.bombLoss)):Math.max(0,gross-moleLoss-Math.max(0,Math.round(Number(r.before)||0)));
  const beetleLoss=Math.max(0,Math.round(Number(r.loss)||0));
  const formula=`${gross} − ${moleLoss} − ${bombLoss} − ${beetleLoss} = ${r.final}`;
  $('resultContent').innerHTML=`
    <div class="result-breakdown">
      <div class="result-row"><span>Собрано с ячеек</span><strong>${baseGross}</strong></div>
      <div class="result-row positive"><span>Бонусы и персонажи</span><strong>+${positiveGain}</strong></div>
      ${r.keyExchangeHarvest?`<div class="result-note">В том числе обмен ключей: +${r.keyExchangeHarvest}</div>`:''}
      <div class="result-row subtotal"><span>Всего до потерь</span><strong>${gross}</strong></div>
      <div class="result-row negative"><span>Кроты</span><strong>−${moleLoss}</strong></div>
      ${moleBreakdown?`<div class="result-note negative-note">${moleBreakdown}</div>`:''}
      <div class="result-row negative"><span>Бомбы</span><strong>−${bombLoss}</strong></div>
      <div class="result-row negative"><span>Жуки${r.beetles?` (${r.beetles}, ${r.pct}%)`:''}</span><strong>−${beetleLoss}</strong></div>
      <div class="result-formula">${formula}</div>
    </div>
    <p>Итоговый урожай</p><div class="total">${r.final}</div>
    <p class="finished-at">Дата и время завершения:<br><strong>${endedText}</strong></p>`;
  $('resultDialog').showModal();
}
function resetGame(){ localStorage.removeItem(STORAGE_KEY); state=createState(); render(); $('resultDialog').close(); }

function renderStatusLog(){
  const box=$('statusMessage'); if(!box) return;
  if(!Array.isArray(state.sessionLog)||!state.sessionLog.length) state.sessionLog=[{id:uid(),text:state.status||'Откройте первую грядку.',icon:'🌱',location:state.locationIndex+1}];
  box.innerHTML=state.sessionLog.map((row,index)=>`<div class="status-entry ${row.kind||'event'}"><span class="status-index">${index+1}</span><span class="status-icon">${row.icon||'📜'}</span><span class="status-text"><small>Локация ${row.location||1}</small><span class="status-copy">${row.text}</span></span></div>`).join('');
  requestAnimationFrame(()=>{box.scrollTop=box.scrollHeight;});
}

function render(){
  const view=currentView();
  document.body.dataset.location=String(view.index+1);
  document.body.classList.toggle('review-mode',!view.live);
  const location=locationData(state.locations[view.index]);
  if(location.background){
    document.body.style.backgroundImage=`linear-gradient(180deg,rgba(13,28,15,.30),rgba(8,18,10,.72)),url("${location.background}")`;
    document.body.style.backgroundSize='cover';
    document.body.style.backgroundPosition='center';
    document.body.style.backgroundRepeat='no-repeat';
  }
  $('locationProgress').textContent=`Локация ${view.index+1} из 3${!view.live?' • просмотр':''}`;
  $('locationName').textContent=location.name;
  $('harvestLabel').textContent=view.cumulativeHarvest??totalHarvest(); $('movesLabel').textContent=view.movesLeft;
  renderStatusLog(); renderInlineAction();
  $('backLocationBtn').disabled=view.index<=0;
  const resultsBtn=$('resultsBtn');
  if(resultsBtn) resultsBtn.classList.toggle('hidden',!(state.finished&&state.finalResult));
  if(view.index<state.locationIndex){ $('nextBtn').disabled=false; $('nextBtn').textContent='Вперёд →'; }
  else if(state.finished){ $('nextBtn').disabled=true; $('nextBtn').textContent='Завершено'; }
  else { $('nextBtn').disabled=!state.locationLocked; $('nextBtn').textContent=state.locationIndex===2?'Завершить →':'Вперёд →'; }
  renderCharacter(view); renderBoard(view); renderInventory(view); renderBeetleField(view);
  if(state.finished&&state.finalResult&&!state.resultDialogDismissed&&!$('resultDialog').open) showResult();
}

// Синхронизирует «живой» слой CSS-жуков в зоне хронологии с числом жуков.
// Жуки хаотично бегают под строками лога, прячась за границами панели,
// напоминая, что урожай под угрозой. Слой не мешает читать текст (он позади строк).
function renderBeetleField(view=currentView()){
  const field=$('beetleField'); if(!field) return;
  const count=view&&view.live?(Number(state.beetles)||0):0;
  const want=Math.min(6,Math.max(0,count));
  const have=field.children.length;
  if(want<have){ while(field.children.length>want) field.lastChild.remove(); return; }
  if(want===have) return;
  const variants=['beetleRoamA','beetleRoamB','beetleRoamC'];
  for(let i=have;i<want;i++){
    const wrap=document.createElement('div');
    wrap.className='beetle-wrap'; wrap.setAttribute('aria-hidden','true');
    wrap.style.setProperty('--s',(0.78+Math.random()*0.42).toFixed(2));
    wrap.style.setProperty('--o',(0.40+Math.random()*0.24).toFixed(2));
    const dur=(7+Math.random()*6).toFixed(1);
    const bug=document.createElement('div'); bug.className='beetle';
    bug.style.animation=`${variants[i%variants.length]} ${dur}s linear ${(-Math.random()*dur).toFixed(1)}s infinite`;
    bug.innerHTML='<i class="bug"></i><i class="legs"></i><i class="ant"></i>';
    wrap.appendChild(bug); field.appendChild(wrap);
  }
}
function renderCharacter(view=currentView()){
  const card=$('characterCard'); const c=view.character;
  const pendingMageSpell=Boolean(c?.type==='mage'&&!c.spellChosen&&!state.finished);
  const inactive=Boolean(c&&!pendingMageSpell&&(c.inactive||view.locationLocked||view.movesLeft<=0||!view.live));
  const mageCanChoose=Boolean(pendingMageSpell);
  card.classList.toggle('active',Boolean(c)&&!inactive);
  card.classList.toggle('inactive',inactive);
  card.classList.toggle('empty',!c);
  card.classList.toggle('mage-choice-ready',mageCanChoose);
  card.classList.toggle('defender-active',Boolean(c)&&c.type==='defender'&&!inactive);
  card.querySelector('.character-icon').innerHTML=c?assetMarkup(c.type,CHARACTER_INFO[c.type].icon,'character-asset'):assetMarkup('', '🐾','character-asset');
  $('characterName').textContent=c?CHARACTER_INFO[c.type].name:'Пока нет';
  const mageTurns=Math.max(0,Number(c?.remainingTargets)||0);
  const mageTurnWord=mageTurns===1?'ход':mageTurns>=2&&mageTurns<=4?'хода':'ходов';
  $('characterTimer').textContent=!c?'':inactive?'Неактивен':c.type==='mage'?`${view.locationLocked||view.movesLeft<=0||!view.live?'Заклинание доступно':`Исчезнет через ${mageTurns} ${mageTurnWord}`}${c.spellChosen?' • заклинание выбрано':' • нажмите для выбора'}`:c.type==='economist'?`Шаг ${c.step+1}/3 • ${c.timer} х.`:`${c.timer} х.`;
  card.onclick=mageCanChoose?openMageSpellDialog:null;
  card.setAttribute('role',mageCanChoose?'button':'group');
  card.tabIndex=mageCanChoose?0:-1;
  card.onkeydown=mageCanChoose?(e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openMageSpellDialog();}}):null;
}
function renderBoard(view=currentView()){
  const board=view.board; const readOnly=!view.live;
  $('board').innerHTML=board.map(c=>{
    const rabbit=state.activeRabbitCell===c.id;
    const classes=['cell',`type-${c.type}`,c.opened?'opened':'',c.opened&&c.type==='bomb'&&!c.neutralized?'bomb-cell':'',c.exploded?'exploded-bomb-cell':'',c.neutralized?'neutralized-bomb-cell':'',(c.destroyed||c.burned)&&!(c.type==='bomb'&&c.exploded)?'destroyed-cell':'',c.opened&&c.type==='chest'&&!c.chestResolved&&!c.destroyed?'active-chest-cell':'',c.opened&&c.type==='chest'&&c.chestResolved?'resolved-chest-cell':'',c.stolen?'stolen-cell':'',(c.characterBoost||0)>0&&!c.stolen?'character-boosted-cell':'',c.blocked&&!c.opened?'blocked':'',c.revealed?'revealed':'',c.openedByKey?'opened-by-key':'',selectionMode?.ids?.has(c.id)?'selectable-cell':'',rabbit?'rabbit rabbit-active':''].filter(Boolean).join(' ');
    let body=rabbit
      ? `<span class="icon rabbit-cell-icon">${assetMarkup('rabbit','🐇','rabbit-asset')}</span>`
      : '';
    if(!rabbit&&(c.opened||c.revealed)){
      if((c.destroyed||c.burned)&&!(c.type==='bomb'&&c.exploded)) body='<span class="icon">💥</span><span class="destroyed">Уничтожено</span>';
      else if(c.type==='wheat') body=c.stolen
        ? `<span class="icon stolen-wheat-icon">${assetMarkup('wheat',ICONS.wheat)}</span><span class="stolen">Украдено</span><span class="stolen-value">−${c.stolenAmount||0}</span>`
        : `<span class="icon">${assetMarkup('wheat',ICONS.wheat)}</span>${(c.characterBoost||0)>0
            ? `<span class="amount boosted-amount"><span class="base-amount">${Number.isFinite(c.originalAmount)?c.originalAmount:c.amount-(c.characterBoost||0)}</span><span class="boost-arrow">→</span><span class="boost-final">${c.amount}</span><small>(+${c.characterBoost})</small></span>`
            : `<span class="amount">${c.amount}</span>`}`;
      else if(c.type==='chest'&&c.chestResolved) body=`<span class="icon resolved-chest-icon">${assetMarkup('chest','🎁')}</span><span class="resolved-chest-label">Открыт</span>${c.resolvedBonus?`<span class="chest-bonus-badge" title="${BONUS_NAMES[c.resolvedBonus]||''}">${assetMarkup(c.resolvedBonus,ICONS[c.resolvedBonus]||'')}</span>`:''}`;
      else if(c.type==='chest') body=`<span class="icon active-chest-icon">${assetMarkup('chest',ICONS.chest)}</span><span class="amount chest-label">Загадочный ящик</span>`;
      else if(c.type==='bomb'&&c.neutralized) body=`<span class="icon neutralized-bomb-icon">${assetMarkup('bomb',ICONS.bomb)}</span><span class="neutralized-label">Обезврежена</span>`;
      else if(c.type==='bomb'&&c.exploded) body=`<span class="icon exploded-bomb-icon">${assetMarkup('bomb',ICONS.bomb)}</span><span class="exploded-label">Взорвана</span><span class="bomb-loss">−${c.bombLoss||0}</span>`;
      else body=`<span class="icon">${assetMarkup(c.type,ICONS[c.type])}</span><span class="amount">${typeLabel(c.type)}</span>`;
    }
    const timer=!rabbit&&c.timer!=null&&c.timer>0?`<span class="timer">${c.timer}</span>`:'';
    const originBadges=!rabbit?`${c.summonedByMole&&(c.type==='bomb'||c.type==='weed')?`<span class="origin-badge mole-origin" title="Призвано кротом">${assetMarkup('moleSource','🐹')}</span>`:''}${c.type==='weed'&&c.summonedBeetle?`<span class="origin-badge beetle-origin" title="Этот сорняк призвал жука">${assetMarkup('beetleSource','🪲')}</span>`:''}`:'';
    const cellNumber=`<span class="cell-number" aria-hidden="true">${c.id+1}</span>`;
    return `<button class="${classes}" data-cell-id="${c.id}" ${rabbit?'data-rabbit-cell="true"':''} type="button" ${(readOnly&&!selectionMode?.ids?.has(c.id))||((c.opened||c.blocked||state.locationLocked)&&!selectionMode?.ids?.has(c.id))?'disabled':''}>${cellNumber}<span class="cell-main">${body}</span>${timer}${originBadges}</button>`;
  }).join('');
  document.querySelectorAll('.cell').forEach(el=>{
    const id=Number(el.dataset.cellId);
    const catchRabbitFromCell=event=>{
      if(state.activeRabbitCell!==id) return false;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      catchRabbit(id);
      return true;
    };
    el.addEventListener('pointerdown',event=>{ catchRabbitFromCell(event); });
    el.addEventListener('click',event=>{
      if(catchRabbitFromCell(event)) return;
          if(rabbitTapGuard.cellId===id&&Date.now()<rabbitTapGuard.until) return;
      if(selectionMode?.ids?.has(id)) selectionMode.onPick(id);
      else openCell(id);
    });
  });
}
function renderInventory(view=currentView()){
  const items=[];
  const keyUsable=!state.finished&&state.keys>0&&Boolean(view.locationLocked||view.movesLeft<=0||!view.live);
  if(state.keys>0) items.push({type:'key',count:state.keys,usable:keyUsable,label:'Ключ'});
  (view.inventory||[]).forEach(item=>{
    const usable=inventoryBonusApplicable(item.type,view);
    items.push({...item,usable,passiveActive:Boolean(item.timer)&&['bombShield','scarecrow'].includes(item.type),attention:usable&&Boolean(view.locationLocked||view.movesLeft<=0||!view.live)});
  });
  $('inventoryCount').textContent=items.reduce((s,x)=>s+(x.count||1),0);
  $('inventoryList').innerHTML=items.length?items.map(item=>`<button type="button" class="inventory-item ${item.usable?'usable':''} ${item.passiveActive?'passive-active':''} ${item.attention?'available-bonus':''} ${item.timer?'glow':''}" data-inv-type="${item.type}" ${item.usable?'':'disabled'}><span class="inv-icon">${assetMarkup(item.type,ICONS[item.type])}</span><strong>${item.label||BONUS_NAMES[item.type]}</strong>${item.count>1?`<small>×${item.count}</small>`:''}${item.timer?`<small>${item.timer} х.</small>`:''}</button>`).join(''):'<div class="inventory-item"><span class="inv-icon">—</span><strong>Пусто</strong></div>';
  document.querySelectorAll('[data-inv-type]').forEach(el=>el.addEventListener('click',()=>el.dataset.invType==='key'?useKey():useInventory(el.dataset.invType)));
}

function buildDebug(){
  const actions=[
    ['Показать поле',()=>{state.board.forEach(c=>{if(!c.opened)c.revealed=true});render();}],
    ['Скрыть поле',()=>{state.board.forEach(c=>c.revealed=false);render();}],
    ['+1 ключ',()=>{state.keys++;render();}],['+100 урожая',()=>{addHarvest(100);render();}],
    ['Выдать щит',()=>{addInventory('bombShield',1,5);render();}],['Выдать лупу',()=>{addInventory('digitalMagnifier',2);render();}],
    ['Выдать удобрение',()=>{addInventory('mineralFertilizer');render();}],['Выдать нейтрализатор',()=>{addInventory('portableNeutralizer');render();}],
    ['Выдать тяпку',()=>{addInventory('goldenHoe');render();}],['Призвать защитника',()=>{clearCharacter();summonCharacter('defender');render();}],
    ['Призвать мага',()=>{clearCharacter();summonCharacter('mage');render();}],['Призвать учёного',()=>{clearCharacter();summonCharacter('scientist');render();}],
    ['Призвать экономиста',()=>{clearCharacter();summonCharacter('economist');render();}],['+1 жук',()=>{state.beetles++;render();}],
    ['Таймеры бомб = 1',()=>{state.board.filter(c=>c.type==='bomb'&&c.opened).forEach(c=>c.timer=1);render();}],
    ['Остался 1 ход',()=>{state.movesLeft=1;state.locationLocked=false;render();}],['Очистить сохранение',()=>resetGame()]
  ];
  $('debugGrid').innerHTML=actions.map((a,i)=>`<button type="button" data-debug="${i}">${a[0]}</button>`).join('');
  document.querySelectorAll('[data-debug]').forEach(b=>b.onclick=()=>{actions[Number(b.dataset.debug)][1]();save();});
}

// Надёжно перехватываем тап по кролику до того, как событие достигнет кнопки грядки.
// Делегирование на постоянном контейнере продолжает работать после каждого renderBoard().
$('board').addEventListener('pointerdown',event=>{
  const rabbit=event.target.closest('[data-rabbit-id]');
  if(!rabbit) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  catchRabbit(rabbit.dataset.rabbitId);
},true);
$('board').addEventListener('click',event=>{
  const cell=event.target.closest('[data-cell-id]');
  const id=cell?Number(cell.dataset.cellId):null;
  if(event.target.closest('[data-rabbit-id]')||id!=null&&rabbitTapGuard.cellId===id&&Date.now()<rabbitTapGuard.until){
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
},true);

$('nextBtn').addEventListener('click',goNext);
$('backLocationBtn').addEventListener('click',goBack);
$('newGameBtn').addEventListener('click',resetGame);
$('resultCloseBtn').addEventListener('click',()=>{state.resultDialogDismissed=true; $('resultDialog').close(); save(); render();});
$('resultsBtn')?.addEventListener('click',()=>{ if(state.finalResult) showResult(); });
$('soundToggle')?.addEventListener('click',toggleSounds);
$('debugToggle').addEventListener('click',()=>$('debugDialog').showModal());
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
initGuideDialog();
renderSoundToggle();
buildDebug(); render(); save();


function resolveStatusAssetKey(row={}){
  const text=String(row.text||'');
  const icon=String(row.icon||'');
  const lower=text.toLowerCase();
  if(row.assetKey && ASSET_PATHS[row.assetKey]) return row.assetKey;
  if(/кот-защитник/i.test(text)||icon==='🛡️🐱') return 'defender';
  if(/кот-маг/i.test(text)||/заклинан/i.test(text)||icon==='🪄🐱'||icon==='🪄') return 'mage';
  if(/кот-экономист/i.test(text)||icon==='📈🐱') return 'economist';
  if(/кот-уч[её]ный/i.test(text)||icon==='🔬🐱') return 'scientist';
  if(/зачарованн(ый|ого) серп/i.test(text)||icon==='🌙') return 'enchantedSickle';
  if(/золотая тяпка/i.test(text)) return 'goldenHoe';
  if(/цифровая лупа/i.test(text)) return 'digitalMagnifier';
  if(/минеральное удобрение/i.test(text)) return 'mineralFertilizer';
  if(/лейка успеха/i.test(text)) return 'wateringCan';
  if(/щит/i.test(text)&&/бомб/i.test(text)||icon==='🛡️') return 'bombShield';
  if(/пугало/i.test(text)||icon==='🧍') return 'scarecrow';
  if(/нейтрализатор/i.test(text)||icon==='🧰') return 'portableNeutralizer';
  if(/агро-рывок/i.test(text)||icon==='×2') return 'agroRushX2';
  if(/агро-рывок/i.test(text)&&/×3/.test(text)||icon==='×3') return 'agroRushX3';
  if(/кролик/i.test(lower)||icon==='🐇') return 'rabbit';
  if(/ключ/i.test(lower)||icon==='🔑') return 'key';
  if(/загадочн/i.test(lower)||/ящик/i.test(lower)||icon==='🎁'||icon==='📦') return 'chest';
  if(/бомб/i.test(lower)||icon==='💣') return 'bomb';
  if(/крот/i.test(lower)||icon==='🐹') return 'mole';
  if(/сорняк/i.test(lower)||icon==='🌿') return 'weed';
  if(/жук/i.test(lower)||icon==='🪲') return 'beetle';
  if(/пшен/i.test(lower)||row.kind==='harvest'||icon==='🌾') return 'wheat';
  return '';
}
function logIconMarkup(row={}){
  const assetKey=resolveStatusAssetKey(row);
  if(assetKey) return assetMarkup(assetKey, row.icon||ICONS[assetKey]||'•', 'status-asset');
  return row.icon||'📜';
}
function renderStatusLog(){
  const box=$('statusMessage'); if(!box) return;
  if(!Array.isArray(state.sessionLog)||!state.sessionLog.length) state.sessionLog=[{id:uid(),text:state.status||'Откройте первую грядку.',icon:'🌱',location:state.locationIndex+1}];
  box.innerHTML=state.sessionLog.map((row,index)=>`<div class="status-entry ${row.kind||'event'}"><span class="status-index">${index+1}</span><span class="status-icon">${logIconMarkup(row)}</span><span class="status-text"><small>Локация ${row.location||1}</small><span class="status-copy">${row.text}</span></span></div>`).join('');
  requestAnimationFrame(()=>{box.scrollTop=box.scrollHeight;});
}

function initGuideDialog(){
  const btn=$('guideBtn');
  const dialog=$('guideDialog');
  if(btn&&dialog){
    btn.addEventListener('click',()=>{ playSound('guideOpen'); dialog.showModal(); });
    dialog.querySelectorAll('.guide-link').forEach(link=>{
      link.addEventListener('click',event=>{
        const href=link.getAttribute('href');
        if(!href||!href.startsWith('#')) return;
        event.preventDefault();
        dialog.querySelector(href)?.scrollIntoView({behavior:'smooth',block:'start'});
      });
    });
  }
}
