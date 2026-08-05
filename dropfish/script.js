'use strict';

// Реальный Telegram-контекст нельзя определять только по существованию WebApp:
// официальный bridge-скрипт создаёт объект и в обычном Safari.
const TelegramBridge = window.Telegram?.WebApp ?? null;
const telegramLaunchText = `${location.search} ${location.hash}`;
const isRealTelegramContext = Boolean(
  TelegramBridge?.initData ||
  (TelegramBridge?.platform && TelegramBridge.platform !== 'unknown') ||
  /tgWebApp(?:Data|Version|Platform|ThemeParams)/i.test(telegramLaunchText)
);

(function markIPhoneSafariBrowser() {
  const ua = navigator.userAgent || '';
  const isIPhone = /iPhone|iPod/i.test(ua);
  const isWebKit = /WebKit/i.test(ua);
  const isOtherIOSBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(ua);
  const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
  const isPlainIPhoneSafari = isIPhone && isWebKit && !isOtherIOSBrowser && !isRealTelegramContext && !isStandalone;
  document.documentElement.classList.toggle('iphone-safari-browser', isPlainIPhoneSafari);
})();

// Реальная видимая высота окна: защищает нижнюю панель на iPhone Safari
// и не мешает Telegram Mini App использовать собственную stable-height.
let viewportUpdateFrame = 0;
function updateAppViewportHeight() {
  cancelAnimationFrame(viewportUpdateFrame);
  viewportUpdateFrame = requestAnimationFrame(() => {
    const viewport = window.visualViewport;
    const viewportHeight = viewport?.height || window.innerHeight;
    const viewportOffsetTop = viewport?.offsetTop || 0;
    if (Number.isFinite(viewportHeight) && viewportHeight > 0) {
      const root = document.documentElement;
      root.style.setProperty('--app-height', `${Math.round(viewportHeight)}px`);
      root.style.setProperty('--vv-height', `${Math.round(viewportHeight)}px`);
      root.style.setProperty('--vv-offset-top', `${Math.round(viewportOffsetTop)}px`);
      const panel = document.querySelector('.cast-panel');
      if (panel) {
        root.style.setProperty('--ios-cast-panel-space', `${Math.ceil(panel.getBoundingClientRect().height)}px`);
      }
    }
  });
}
updateAppViewportHeight();
window.addEventListener('resize', updateAppViewportHeight, { passive: true });
window.addEventListener('orientationchange', updateAppViewportHeight, { passive: true });
window.visualViewport?.addEventListener('resize', updateAppViewportHeight, { passive: true });
window.visualViewport?.addEventListener('scroll', updateAppViewportHeight, { passive: true });


const TelegramApp = isRealTelegramContext ? TelegramBridge : null;
if (TelegramApp) {
  document.documentElement.dataset.theme = TelegramApp.colorScheme || 'dark';
  TelegramApp.ready();
  TelegramApp.expand();
  TelegramApp.onEvent?.('themeChanged', () => document.documentElement.dataset.theme = TelegramApp.colorScheme || 'dark');
}

const SOUND_PATHS = {
  cast: './assets/audio/fishing/cast.ogg',
  bonus: './assets/audio/effects/bonus.ogg',
  debuff: './assets/audio/effects/debuff.ogg',
  epic: './assets/audio/artifacts/epic.ogg',
  legendary: './assets/audio/artifacts/legendary.ogg',
  achievement: './assets/audio/ui/achievement.ogg',
  angus: './assets/audio/characters/angus.ogg',
  weather: './assets/audio/weather/weather.ogg',
  guide: './assets/audio/ui/guide.ogg?v=20260724-2',
  motion: './assets/audio/ui/motion.ogg',
  riftOpen: './assets/audio/rifts/opening/rift-open.ogg',
  riftAmbient: './assets/audio/rifts/ambient/rift-ambient.ogg',
  abyssalAppear: './assets/audio/abyssal/events/abyssal-appear.ogg',
  abyssalImpact: './assets/audio/abyssal/events/abyssal-impact.ogg',
  tradeShipArrival: './assets/audio/ships/trade-ship-arrival.ogg',
  signalFlareLaunch: './assets/audio/items/signal-flare-launch.ogg',
  islandDiscovered: './assets/audio/islands/opening/island-discovered.ogg',
  islandDanger: './assets/audio/islands/dangers/island-danger.ogg',
  unstablePresence: './assets/audio/abyssal/events/unstable-presence.ogg',
  islandDestructiveTides: './assets/audio/islands/music/destructive-tides.ogg',
  islandLeadenFog: './assets/audio/islands/music/leaden-fog.ogg',
  islandStoneGuardians: './assets/audio/islands/music/stone-guardians.ogg',
  islandForgottenCurrents: './assets/audio/islands/music/forgotten-currents.ogg'
};

const sounds = Object.fromEntries(
  Object.entries(SOUND_PATHS).map(([name, path]) => {
    const audio = new Audio(path);
    audio.preload = 'auto';
    audio.volume = 0.7;
    return [name, audio];
  })
);
sounds.cast.volume = 0.55;
sounds.weather.volume = 0.6;
sounds.angus.volume = 0.9;
sounds.achievement.volume = 0.9;
sounds.guide.volume = 0.65;
sounds.motion.volume = 0.65;
sounds.riftOpen.volume = 0.85;
sounds.riftAmbient.volume = 0.42;
sounds.abyssalAppear.volume = 0.8;
sounds.abyssalImpact.volume = 0.75;
sounds.tradeShipArrival.volume = 0.85;
sounds.signalFlareLaunch.volume = 0.85;
sounds.islandDiscovered.volume = 0.8;
sounds.islandDanger.volume = 0.8;
sounds.unstablePresence.volume = 0.85;
sounds.riftAmbient.loop = true;
['islandDestructiveTides','islandLeadenFog','islandStoneGuardians','islandForgottenCurrents'].forEach(name=>{
  sounds[name].volume = 0.42;
  sounds[name].loop = true;
});

let soundEnabled = true;
function playSound(name) {
  if (!soundEnabled || !sounds[name]) return;
  const source = sounds[name];
  const audio = name === 'guide' ? new Audio(SOUND_PATHS.guide) : source.cloneNode(true);
  audio.preload = 'auto';
  audio.volume = source.volume;
  const playback = audio.play();
  if (playback && typeof playback.catch === 'function') {
    playback.catch(() => {});
  }
}

function startRiftAmbient() {
  const audio = sounds.riftAmbient;
  if (!audio || localStorage.getItem('dropfishSoundsEnabled') === 'false') return;
  if (!audio.paused) return;
  const playback = audio.play();
  if (playback && typeof playback.catch === 'function') playback.catch(() => {});
}
function stopRiftAmbient() {
  const audio = sounds.riftAmbient;
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}
const ISLAND_AMBIENT_SOUNDS=Object.freeze({
  destructiveTides:'islandDestructiveTides',
  leadenFog:'islandLeadenFog',
  stoneGuardians:'islandStoneGuardians',
  forgottenCurrents:'islandForgottenCurrents'
});
let activeIslandAmbient=null;
function startIslandAmbient(island=state?.islands?.active?.island){
  const name=ISLAND_AMBIENT_SOUNDS[island],audio=sounds[name];
  if(!audio||localStorage.getItem('dropfishSoundsEnabled')==='false')return;
  if(activeIslandAmbient&&activeIslandAmbient!==name)stopIslandAmbient();
  activeIslandAmbient=name;
  if(!audio.paused)return;
  const playback=audio.play();
  if(playback&&typeof playback.catch==='function')playback.catch(()=>{});
}
function stopIslandAmbient(){
  if(!activeIslandAmbient)return;
  const audio=sounds[activeIslandAmbient];
  if(audio){audio.pause();audio.currentTime=0;}
  activeIslandAmbient=null;
}
window.addEventListener('dropfishsoundchange', event => {
  soundEnabled = event.detail?.enabled !== false;
  if (!soundEnabled) {stopRiftAmbient();stopIslandAmbient();}
  else if (state?.rifts?.active?.status === 'active' && $('riftDialog')?.open) startRiftAmbient();
  else if(state?.islands?.active&&$('islandDialog')?.open)startIslandAmbient();
});

const MOTION_KEY = 'proFishingReduceMotion';
const storedMotionPreference = localStorage.getItem(MOTION_KEY);
let reduceMotion = storedMotionPreference === null
  ? Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  : storedMotionPreference === '1';
let lastAnimatedHistoryId = null;
let effectTimer = null;
let headerPresenceTimer=null;
let headerPresenceCooldown=0;

function scheduleHeaderPresence(){
  clearTimeout(headerPresenceTimer);if(reduceMotion)return;
  headerPresenceTimer=setTimeout(()=>{triggerHeaderPresence('ambient',true);scheduleHeaderPresence();},Math.floor(rand(32000,65000)));
}
function triggerHeaderPresence(kind='ambient',forceCreature=false){
  if(reduceMotion||document.hidden)return;
  const header=document.querySelector('.topbar');if(!header)return;
  const now=Date.now(),tone=String(kind).includes('debuff')?'debuff':String(kind).includes('abyss')?'abyssal':['epic','legendary','danger','mythic'].includes(kind)?kind:'ambient';
  header.classList.remove('presence-signal','presence-epic','presence-legendary','presence-debuff','presence-danger','presence-abyssal','presence-mythic');
  void header.offsetWidth;header.classList.add('presence-signal',`presence-${tone}`);
  setTimeout(()=>header.classList.remove('presence-signal',`presence-${tone}`),1900);
  const major=['legendary','mythic','abyssal','danger'].includes(kind),canAppear=now-headerPresenceCooldown>18000;
  if(canAppear&&(forceCreature||(major&&chance(.42)))){headerPresenceCooldown=now;header.classList.remove('presence-awake');void header.offsetWidth;header.classList.add('presence-awake');setTimeout(()=>header.classList.remove('presence-awake'),5000);}
}

function applyMotionPreference() {
  document.body.classList.toggle('reduce-motion', reduceMotion);
  const button = $('motionBtn');
  if (button) {
    button.classList.toggle('is-reduced', reduceMotion);
    button.innerHTML = uiIconMarkup(reduceMotion?'animationOff':'animationOn');
    button.title = reduceMotion
      ? 'Включить полные анимации (аркадный режим доступен)'
      : 'Уменьшить анимации (аркадный режим останется доступен)';
    button.setAttribute('aria-label', button.title);
  }
  scheduleHeaderPresence();
  requestAnimationFrame(initRiftFuzzyTitles);
}
function animateElement(id, className, duration=900) {
  const el=$(id); if (!el || reduceMotion) return;
  el.classList.remove(className); void el.offsetWidth; el.classList.add(className);
  setTimeout(()=>el.classList.remove(className),duration);
}
function showVisualEffect(kind, icon, title, subtitle='', duration=1150, minor=false, fullscreen=true) {
  if (reduceMotion) return;
  triggerHeaderPresence(kind);
  if (!fullscreen) return;
  const overlay=$('effectOverlay');
  if (!overlay) return;
  clearTimeout(effectTimer);
  overlay.className=`effect-overlay show ${kind}${minor?' minor':''}`;
  if(String(icon).includes('<'))$('effectIcon').innerHTML=icon;
  else $('effectIcon').textContent=icon;
  $('effectTitle').textContent=title;
  $('effectSubtitle').textContent=subtitle;
  const particles=$('effectParticles'); particles.innerHTML='';
  const particleSymbols = kind==='legendary' ? ['✦','✨','◆','✧'] : kind==='epic' ? ['✦','💜','✧','•'] : kind==='achievement' ? ['🎉','✨','★','✦'] : kind==='giant' ? ['💦','🌊','✦'] : ['•','✦','✨'];
  const count=minor?7:14;
  for(let i=0;i<count;i++) {
    const span=document.createElement('span'); span.className='particle'; span.textContent=pick(particleSymbols);
    const angle=rand(0,Math.PI*2);
    const startDistance=rand(78,118);
    span.style.setProperty('--sx',`${Math.cos(angle)*startDistance}px`);
    span.style.setProperty('--sy',`${Math.sin(angle)*startDistance}px`);
    span.style.setProperty('--r',`${Math.floor(rand(-170,170))}deg`);
    span.style.setProperty('--d',`${Math.floor(rand(95,240))}px`);
    particles.appendChild(span);
  }
  effectTimer=setTimeout(()=>{overlay.className='effect-overlay';particles.innerHTML='';},duration);
}
function showWeatherTransition(weatherKey) {
  if (reduceMotion) return;
  const fx=$('weatherFx'); if (!fx) return;
  fx.className=`weather-fx ${weatherKey} show`;
  animateElement('weatherScene','weather-pop',800);
  setTimeout(()=>fx.className='weather-fx',1200);
}
function animateCast() {
  if (reduceMotion) return;
  animateElement('lakeCard','is-casting',1180);
  animateElement('castBtn','is-casting',900);
}

const BUILD_CONFIG = { unlimitedSessions: true };
const DAILY_KEY = 'proFishingDailySessionV3';
const TEST_SESSION_KEY = 'proFishingTestSessionV1';
const localDayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DATA = {
  fish: ['кижуч','плотва','жёлтый окунь','семотилус','солнечник','семга','меланотения','жерех','горчак','ринихт','лосось','щука','каменный окунь','корюшка','малый солнечник','арктический голец','судак','красноперка','золотая форель','моксостома','форелеокунь','палия','зеленый солнечник','белый амур','фундулюс','полосатый окунь','длинноухий солнечник','белый сом','золотая рыбка','подкаменщик','озерный сиг','окунь','карпиодес'],
  giants: ['гигантский усач','озерный осетр','нильский окунь','карп','сом','гигантский судак'],
  riftRare: ['астральный скат','призрачный целакант','кристальный удильщик','обсидиановый парусник','багровый латимер','сингулярный тунец','эфирный змееголов','глубинная химера'],
  riftEpic: ['хроноскат','звёздная манта','лазурный драконец','эфирный марлин','лунный парусник','штормовой целакант','кварцевый осётр','теневой арапайма'],
  riftLegendary: ['левиафанов вестник','коронованный мегалодон','первозданная латимерия','страж сингулярности','багровый исполин','владыка обсидиановых врат','фантомный кит','сердце древнего океана'],
  trash: ['погнутый крючок','рваный башмак','старый кроссовок','обрывок газеты','спутанная леска','половина блесны','консервная банка','сломанная ветка','ржавое ведро','пластиковая бутылка','полиэтиленовый пакет','обрывок ткани','пустая ракушка','чей-то обгрызенный плавник','обломок весла','резиновый сапог','комок водорослей','колпачок от ручки','утопленный мобильник','жестяная кружка','зубная щетка','осколок разбитой фары','череп крупной рыбы','размокшее полено'],
  bonuses: ['Подводная маска','Ласты','Акваланг','Счастливый поплавок','Снаряжение дайвера'],
  epics: ['Бездонный ларь','Компас потерянных глубин','Послание в бутылке','Чешуя Левиафана','Эссенция «Великан Океанов»'],
  legendary: ['Глубоководное нечто','Гексаэдр пятой грани','Штурвал Наутилуса','Плавник мегалодона'],
  mythic: ['Око Шторма','Искра Хаоса','Люминар Удильщика','Нить Сифонофоры'],
  debuffs: ['Чайка','Рак','Утка','Осьминог','Касатка'],
  weather: {
    sunny: { name:'Солнечно', icon:'☀️', text:'Высока вероятность дебафа «Чайка».' },
    rain: { name:'Дождь', icon:'🌧️', text:'Высока вероятность дебафа «Утка».' },
    calm: { name:'Штиль', icon:'🌊', text:'Высока вероятность дебафа «Рак».' },
    golden: { name:'Золотой час', icon:'🌅', text:'Меньше хлама, бонусов и дебафов. Рыба получает +1–4 кг.' },
    fog: { name:'Туман', icon:'🌫️', text:'Повышен шанс эпических артефактов.' },
    eclipse: { name:'Затмение', icon:'🌑', text:'Повышен шанс легендарных артефактов.' },
    thunder: { name:'Гроза', icon:'⛈️', text:'Больше тяжеловесов и хлама из-за ударов молнии.' },
    storm: { name:'Шторм', icon:'🌪️', text:'Бонусы и дебафы не выпадают. Много хлама, артефакты встречаются чаще.' }
  }
};

const TRADE_ITEMS = Object.freeze([
  Object.freeze({key:'tidePearl', name:'Жемчужина прилива', icon:'🫧'}),
  Object.freeze({key:'glimmerCoral', name:'Коралл мерцающих глубин', icon:'🪸'}),
  Object.freeze({key:'sunkenAmber', name:'Янтарь затонувших берегов', icon:'🟠'}),
  Object.freeze({key:'blackShellShard', name:'Осколок чёрной раковины', icon:'🐚'}),
  Object.freeze({key:'abyssStar', name:'Звезда бездны', icon:'⭐'}),
  Object.freeze({key:'seaSerpentFang', name:'Клык морского змея', icon:'🦷'})
]);
const EXPEDITION_ITEMS=Object.freeze([
  'Половина старой карты','Страница дневника экспедиции','Повреждённый судовой журнал',
  'Тубус неизвестного картографа','Фрагмент навигационной таблички','Обрывок письма пропавшего капитана'
]);
const MESSAGE_EXPEDITION_ITEMS=Object.freeze([
  'Половина старой карты','Страница дневника экспедиции','Страница повреждённого судового журнала','Обрывок письма пропавшего капитана'
]);
const EXPEDITION_ITEM_ICON_PATH='./assets/icons/expedition-items/';
const EXPEDITION_ITEM_ICON_FILES=Object.freeze({
  'Половина старой карты':'old-map-half.webp',
  'Страница дневника экспедиции':'expedition-diary-page.webp',
  'Повреждённый судовой журнал':'damaged-ship-log.webp',
  'Страница повреждённого судового журнала':'damaged-ship-log.webp',
  'Тубус неизвестного картографа':'unknown-cartographer-tube.webp',
  'Фрагмент навигационной таблички':'navigation-plate-fragment.webp',
  'Обрывок письма пропавшего капитана':'missing-captain-letter.webp'
});
function expeditionItemIconMarkup(name,extraClass=''){
  const file=EXPEDITION_ITEM_ICON_FILES[name];
  if(!file)return '🗺️';
  return `<span class="expedition-item-icon${extraClass?` ${extraClass}`:''}"><img src="${EXPEDITION_ITEM_ICON_PATH}${file}" alt="" aria-hidden="true" title="${name}" decoding="async"></span>`;
}
const ISLAND_FISH_ICON_PATH='./assets/icons/island-fish/';
const ISLAND_FISH_ICON_PREFIX=Object.freeze({
  colossus:'abyssalor',
  moray:'mist-moray',
  graniteCatfish:'granite-catfish',
  echoRay:'echo-ray'
});
function islandFishKind(item){
  if(item?.kind&&ISLAND_FISH_ICON_PREFIX[item.kind])return item.kind;
  if(item?.islandColossus)return 'colossus';
  if(item?.islandMoray)return 'moray';
  if(item?.islandGraniteCatfish)return 'graniteCatfish';
  if(item?.islandEchoRay)return 'echoRay';
  return '';
}
function islandFishIconMarkup(item,extraClass=''){
  const kind=islandFishKind(item),prefix=ISLAND_FISH_ICON_PREFIX[kind];
  if(!prefix)return '';
  const tier=item?.tier||item?.rarity||'common',suffix=tier==='exceptional'?'primordial':tier==='rare'?'ancient':'common';
  const label=item?.name||'Островная рыба';
  return `<span class="island-fish-icon${extraClass?` ${extraClass}`:''}"><img src="${ISLAND_FISH_ICON_PATH}${prefix}-${suffix}.webp" alt="" aria-hidden="true" title="${label}" decoding="async"></span>`;
}
const ISLAND_TRADE_ITEMS=Object.freeze([
  Object.freeze({key:'tideRoot',name:'Корень приливника',icon:'🌿'}),
  Object.freeze({key:'stormCoral',name:'Штормовой коралл',icon:'🪸'}),
  Object.freeze({key:'tideGlass',name:'Осколок приливного стекла',icon:'💎'}),
  Object.freeze({key:'surfFlower',name:'Цветок грохочущего прибоя',icon:'🌺'}),
  Object.freeze({key:'stoneVine',name:'Каменная лоза',icon:'🌿'}),
  Object.freeze({key:'fossilEchoFlower',name:'Цветок окаменевшего эха',icon:'🌺'}),
  Object.freeze({key:'runicObsidian',name:'Рунический обсидиан',icon:'🪨'}),
  Object.freeze({key:'sanctuaryCrystal',name:'Кристалл древнего святилища',icon:'💎'}),
  Object.freeze({key:'enchantedIdol',name:'Зачарованный идол',icon:'🗿'}),
  Object.freeze({key:'ceremonialMask',name:'Церемониальная маска',icon:'🎭'}),
  Object.freeze({key:'fadedRelicFragment',name:'Фрагмент угасшей реликвии',icon:'🔸'}),
  Object.freeze({key:'firstTidePearl',name:'Жемчужина первого прилива',icon:'🫧'}),
  Object.freeze({key:'livingCoral',name:'Живой коралл',icon:'🪸'}),
  Object.freeze({key:'serenityLily',name:'Лилия безмятежных вод',icon:'🪷'}),
  Object.freeze({key:'moonTideShell',name:'Раковина лунного прилива',icon:'🐚'}),
  Object.freeze({key:'firstWaterFlask',name:'Флакон Первой Воды',icon:'🧪'})
]);
const ABYSSAL_PERSONALITIES = Object.freeze({
  parasite:{name:'Паразит',icon:'🦠',reveal:'Обнаружены паразитические свойства',repeat:'Паразит снова внедрился в добычу'},
  predator:{name:'Хищник',icon:'🦈',reveal:'Форма жизни проявила поведение хищника',repeat:'Хищник снова начал охоту'},
  symbiote:{name:'Симбиот',icon:'🪼',reveal:'Форма жизни вступила в симбиотическую связь',repeat:'Симбиотическая связь снова проявилась'},
  raider:{name:'Расхититель',icon:'💰',reveal:'Форма жизни проявляет интерес к редким находкам',repeat:'Расхититель снова заинтересовался находками'},
  destroyer:{name:'Разрушитель',icon:'💥',reveal:'Форма жизни демонстрирует разрушительное поведение',repeat:'Разрушитель снова нарушил порядок'},
  metamorph:{name:'Метаморф',icon:'🧬',reveal:'Форма жизни начала неконтролируемую мутацию',repeat:'Метаморф вызвал новую волну мутаций'}
});
const ABYSSAL_ICON_PATH='./assets/icons/abyssal-life/';
const ABYSSAL_ICON_FILES=Object.freeze({
  unknown:'unknown.webp',
  parasite:'parasite.webp',
  predator:'predator.webp',
  symbiote:'symbiote.webp',
  raider:'raider.webp',
  destroyer:'destroyer.webp',
  metamorph:'metamorph.webp'
});
function abyssalIconMarkup(personality=null,extraClass=''){
  const key=ABYSSAL_ICON_FILES[personality]?personality:'unknown';
  const label=key==='unknown'?'Неизвестная абиссальная форма жизни':ABYSSAL_PERSONALITIES[key].name;
  return `<span class="abyssal-entity-icon${extraClass?` ${extraClass}`:''}"><img src="${ABYSSAL_ICON_PATH}${ABYSSAL_ICON_FILES[key]}" alt="" aria-hidden="true" title="${label}" decoding="async"></span>`;
}
function abyssalPersonalityKey(value){
  if(ABYSSAL_PERSONALITIES[value])return value;
  const text=String(value||'').toLocaleLowerCase('ru-RU');
  if(!text)return null;
  return Object.entries(ABYSSAL_PERSONALITIES).find(([,def])=>
    [def.name,def.reveal,def.repeat].some(label=>text.includes(String(label).toLocaleLowerCase('ru-RU')))
  )?.[0]||null;
}
function historyAbyssalPersonality(row,currentEntity=null){
  const stored=abyssalPersonalityKey(row?.abyssPersonality);
  if(stored)return stored;
  if(currentEntity?.rowId===row?.id&&currentEntity.manifested)return abyssalPersonalityKey(currentEntity.personality);
  return abyssalPersonalityKey(`${row?.text||''} ${row?.detail||''}`);
}
const ABYSSAL_WEATHERS = Object.freeze(['rain','fog','eclipse','thunder','storm']);
function tradeItemByKey(key) { return [...TRADE_ITEMS,...ISLAND_TRADE_ITEMS].find(item=>item.key===key); }
const TRADE_ITEM_ICON_PATH='./assets/icons/trade-items/';
const TRADE_ITEM_ICON_FILES=Object.freeze({
  tidePearl:'tide-pearl.webp',
  glimmerCoral:'glimmer-coral.webp',
  sunkenAmber:'sunken-amber.webp',
  blackShellShard:'black-shell-shard.webp',
  abyssStar:'abyss-star.webp',
  seaSerpentFang:'sea-serpent-fang.webp'
});
const ISLAND_LOOT_ICON_PATH='./assets/icons/island-loot/';
const ISLAND_TRADE_ITEM_ICON_FILES=Object.freeze({
  tideRoot:'tide-root.webp',
  stormCoral:'storm-coral.png',
  tideGlass:'tide-glass-shard.webp',
  surfFlower:'roaring-surf-flower.webp',
  stoneVine:'stone-vine.webp',
  fossilEchoFlower:'fossil-echo-flower.webp',
  runicObsidian:'runic-obsidian.webp',
  sanctuaryCrystal:'ancient-sanctuary-crystal.webp',
  enchantedIdol:'enchanted-idol.webp',
  ceremonialMask:'ceremonial-mask.webp',
  fadedRelicFragment:'faded-relic-fragment.webp',
  firstTidePearl:'first-tide-pearl.webp',
  livingCoral:'living-coral.webp',
  serenityLily:'serenity-lily.webp',
  moonTideShell:'moon-tide-shell.webp',
  firstWaterFlask:'first-water-flask.webp'
});
const ISLAND_LOOT_KIND_FILES=Object.freeze({
  cache:'island-cache.webp',
  flare:'runic-signal-flare.webp',
  rod:'sharp-fin-rod.webp',
  routeMap:'last-route-map.webp',
  navigator:'astral-navigator.webp',
  mistSupplies:'mist-order-supplies.webp'
});
const ISLAND_LOOT_KIND_KEYS=Object.freeze({
  idol:'enchantedIdol',
  mask:'ceremonialMask',
  fadedFragment:'fadedRelicFragment',
  moonShell:'moonTideShell',
  firstWaterFlask:'firstWaterFlask'
});
function tradeItemIconMarkup(itemOrKey,extraClass=''){
  const item=typeof itemOrKey==='string'
    ? tradeItemByKey(itemOrKey)||[...TRADE_ITEMS,...ISLAND_TRADE_ITEMS].find(entry=>entry.name===itemOrKey)
    : itemOrKey;
  const standardFile=TRADE_ITEM_ICON_FILES[item?.key],islandFile=ISLAND_TRADE_ITEM_ICON_FILES[item?.key];
  const file=standardFile||islandFile;
  if(!file)return item?.icon||'✦';
  const path=islandFile?ISLAND_LOOT_ICON_PATH:TRADE_ITEM_ICON_PATH;
  return `<span class="trade-item-icon${islandFile?' island-loot-icon':''}${extraClass?` ${extraClass}`:''}"><img src="${path}${file}" alt="" aria-hidden="true" title="${item?.name||''}" decoding="async"></span>`;
}
function islandLootIconMarkup(item,extraClass=''){
  const key=item?.key||ISLAND_LOOT_KIND_KEYS[item?.kind];
  if(key)return tradeItemIconMarkup(tradeItemByKey(key)||{...item,key},extraClass);
  const file=ISLAND_LOOT_KIND_FILES[item?.kind];
  if(!file)return item?.icon||'✦';
  return `<span class="trade-item-icon island-loot-icon${extraClass?` ${extraClass}`:''}"><img src="${ISLAND_LOOT_ICON_PATH}${file}" alt="" aria-hidden="true" title="${item?.name||''}" decoding="async"></span>`;
}
const SHIP_ICON_PATH='./assets/icons/ships/';
const SHIP_ICON_FILES=Object.freeze({
  trade:'trade-ship.webp',
  recyclon:'recyclon.webp'
});
function shipIconMarkup(kind='trade',extraClass=''){
  const key=kind==='recyclon'?'recyclon':'trade';
  const label=key==='recyclon'?'Перерабатывающее судно «Рециклон»':'Торговое судно';
  return `<span class="ship-icon ship-${key}${extraClass?` ${extraClass}`:''}"><img src="${SHIP_ICON_PATH}${SHIP_ICON_FILES[key]}" alt="" aria-hidden="true" title="${label}" decoding="async"></span>`;
}
const CHARACTER_ICON_PATH='./assets/icons/characters/';
function characterIconMarkup(character='angus',extraClass=''){
  const file=character==='angus'?'angus.webp':'';
  if(!file)return '';
  return `<span class="character-icon character-${character}${extraClass?` ${extraClass}`:''}"><img src="${CHARACTER_ICON_PATH}${file}" alt="" aria-hidden="true" title="Старина Ангус" decoding="async"></span>`;
}

const ENTITY_ICONS = Object.freeze({
  'Подводная маска':'🥽',
  'Ласты':'🩴',
  'Акваланг':'🤿',
  'Счастливый поплавок':'🎈',
  'Снаряжение дайвера':'🧰',
  'Чайка':'🦅',
  'Рак':'🦞',
  'Утка':'🦆',
  'Осьминог':'🐙',
  'Касатка':'🐋',
  'Бездонный ларь':'🧰',
  'Компас потерянных глубин':'🧭',
  'Послание в бутылке':'🍾',
  'Чешуя Левиафана':'🐉',
  'Эссенция «Великан Океанов»':'🧪',
  'Глубоководное нечто':'🦑',
  'Гексаэдр пятой грани':'🎲',
  'Штурвал Наутилуса':'🛳️',
  'Плавник мегалодона':'🦈'
  ,'Око Шторма':'◉'
  ,'Искра Хаоса':'ϟ'
  ,'Люминар Удильщика':'◇'
  ,'Нить Сифонофоры':'⌁'
});
function entityIcon(name, fallback='•') { return ENTITY_ICONS[name] || fallback; }
const ARTIFACT_ICON_PATH='./assets/icons/artifacts/';
const ARTIFACT_ICON_FILES=Object.freeze({
  epic:Object.freeze({
    'Бездонный ларь':'bottomless-chest.webp',
    'Компас потерянных глубин':'lost-depths-compass.webp',
    'Послание в бутылке':'message-in-a-bottle.webp',
    'Чешуя Левиафана':'leviathan-scale.webp',
    'Эссенция «Великан Океанов»':'ocean-giant-essence.webp'
  }),
  legendary:Object.freeze({
    'Глубоководное нечто':'deep-sea-thing.webp',
    'Гексаэдр пятой грани':'fifth-face-hexahedron.webp',
    'Штурвал Наутилуса':'nautilus-helm.webp',
    'Плавник мегалодона':'megalodon-fin.webp'
  }),
  mythic:Object.freeze({
    'Око Шторма':'storm-eye.webp',
    'Искра Хаоса':'chaos-spark.webp',
    'Люминар Удильщика':'angler-luminar.webp',
    'Нить Сифонофоры':'siphonophore-thread.webp',
    'Буйство Шторма':'storm-rage.webp',
    'Первобытный хаос':'primordial-chaos.webp'
  })
});
function artifactIconMarkup(name,tier='epic',extraClass=''){
  const file=ARTIFACT_ICON_FILES[tier]?.[name];if(!file)return entityIcon(name,tier==='epic'?'💜':'◆');
  return `<span class="artifact-entity-icon${extraClass?` ${extraClass}`:''}"><img src="${ARTIFACT_ICON_PATH}${tier}/${file}" alt="" aria-hidden="true" decoding="async"></span>`;
}
function artifactCategoryBadge(tier){
  const labels={epic:'Эпический артефакт',legendary:'Легендарный артефакт',mythic:'Мифический артефакт'},label=labels[tier];if(!label)return '';
  return `<span class="artifact-history-category artifact-category-${tier}" title="${label}" aria-label="${label}"><img src="${ARTIFACT_ICON_PATH}${tier}/${tier}.webp" alt="" aria-hidden="true" decoding="async"></span>`;
}
function artifactVisualName(artifact){
  if(artifact?.name==='Око Шторма'&&artifact.form==='stormRage')return 'Буйство Шторма';
  return artifact?.name||'';
}
const BONUS_ICON_PATH='./assets/icons/bonuses/';
const BONUS_ICON_FILES=Object.freeze({
  'Подводная маска':'diving-mask.webp',
  'Ласты':'flippers.webp',
  'Акваланг':'scuba-gear.webp',
  'Счастливый поплавок':'lucky-float.webp',
  'Снаряжение дайвера':'diver-equipment.webp'
});
function bonusIconMarkup(name,extraClass=''){
  const file=BONUS_ICON_FILES[name];if(!file)return entityIcon(name,'✅');
  return `<span class="artifact-entity-icon bonus-entity-icon${extraClass?` ${extraClass}`:''}"><img src="${BONUS_ICON_PATH}${file}" alt="" aria-hidden="true" decoding="async"></span>`;
}
function bonusCategoryBadge(){
  return `<span class="artifact-history-category bonus-history-category" title="Бонус" aria-label="Бонус"><img src="${BONUS_ICON_PATH}bonus.webp" alt="" aria-hidden="true" decoding="async"></span>`;
}
const TRASH_ICON_PATH='./assets/icons/trash/trash.webp';
function trashIconMarkup(extraClass=''){
  return `<span class="artifact-entity-icon trash-entity-icon${extraClass?` ${extraClass}`:''}"><img src="${TRASH_ICON_PATH}" alt="" aria-hidden="true" decoding="async"></span>`;
}
const DEBUFF_ICON_PATH='./assets/icons/debuffs/';
const DEBUFF_ICON_FILES=Object.freeze({
  'Чайка':'seagull.webp',
  'Рак':'crayfish.webp',
  'Утка':'duck.webp',
  'Осьминог':'octopus.webp',
  'Касатка':'orca.webp'
});
function debuffNameForText(text){
  const value=String(text||'');return DATA.debuffs.find(name=>value.includes(name))||'';
}
function debuffIconMarkup(nameOrText,extraClass=''){
  const name=DEBUFF_ICON_FILES[nameOrText]?nameOrText:debuffNameForText(nameOrText),file=DEBUFF_ICON_FILES[name];if(!file)return entityIcon(nameOrText,'🛑');
  return `<span class="artifact-entity-icon debuff-entity-icon${extraClass?` ${extraClass}`:''}"><img src="${DEBUFF_ICON_PATH}${file}" alt="" aria-hidden="true" decoding="async"></span>`;
}
function debuffCategoryBadge(){
  return `<span class="artifact-history-category debuff-history-category" title="Дебаф" aria-label="Дебаф"><img src="${DEBUFF_ICON_PATH}debuff.webp" alt="" aria-hidden="true" decoding="async"></span>`;
}

// Единый объект баланса. Все вероятности и весовые коэффициенты,
// которые чаще всего требуют настройки, собраны в одном месте.
const BALANCE = Object.freeze({
  session: Object.freeze({
    casts: 10
  }),
  dungeon: Object.freeze({
    piranhaChance:.10,
    piranhaEveryFish:3,
    trailCasts:3,
    playerHealth:500,
    bossHealth:3000,
    rounds:10
  }),
  catch: Object.freeze({
    baseWeights: Object.freeze({
      normal: 58.8,
      heavy: 8,
      giant: 2,
      trash: 18,
      bonus: 8,
      epic: 1.2,
      legendary: 0.25
    }),
    coinChance: 0.025
  }),
  weather: Object.freeze({
    golden: Object.freeze({ trashMultiplier: 0.4, bonusMultiplier: 0.4 }),
    fog: Object.freeze({ epicMultiplier: 2.5 }),
    eclipse: Object.freeze({ legendaryMultiplier: 3 }),
    thunder: Object.freeze({ heavyMultiplier: 2.5, trashMultiplier: 2 }),
    storm: Object.freeze({
      bonusWeight: 0,
      trashMultiplier: 3,
      // Это итоговые доли внутри основной таблицы улова.
      epicTargetChance: 0.02,
      legendaryTargetChance: 0.01
    })
  }),
  debuffs: Object.freeze({
    duckTrashMultiplier: 3,
    eventChance: Object.freeze({
      storm: 0,
      golden: 0.019,
      featured: 0.065,
      default: 0.0475
    })
  }),
  artifacts: Object.freeze({
    megalodonGiantMultiplier: 1.5,
    mythicRiftChance:.002,
    mythicWeatherChance:Object.freeze({
      sunny:Object.freeze({'Нить Сифонофоры':.001}),
      rain:Object.freeze({'Искра Хаоса':.003,'Люминар Удильщика':.002,'Нить Сифонофоры':.002}),
      calm:Object.freeze({'Нить Сифонофоры':.001}),
      golden:Object.freeze({'Нить Сифонофоры':.002}),
      fog:Object.freeze({'Искра Хаоса':.003,'Люминар Удильщика':.002,'Нить Сифонофоры':.003}),
      eclipse:Object.freeze({'Искра Хаоса':.004,'Нить Сифонофоры':.003}),
      thunder:Object.freeze({'Око Шторма':.005,'Искра Хаоса':.005,'Люминар Удильщика':.003}),
      storm:Object.freeze({'Око Шторма':.005,'Искра Хаоса':.005,'Люминар Удильщика':.003})
    })
  }),
  events: Object.freeze({
    angusChance: 0.02,
    weatherChangeChance: 0.10
  }),
  arcade: Object.freeze({
    maxCatches: 2,
    triggerChance: 0.08,
    pityChance: 0.12,
    orcaChance: 0.05
  }),
  tradeShip: Object.freeze({
    arrivalChance: 0.50,
    itemDropChance: 0.40,
    offerCount: 3,
    heavyChance: 0.90,
    giantChance: 0.10,
    forbiddenWeather: 'storm'
  }),
  coins: Object.freeze({
    types: Object.freeze([
      Object.freeze({key:'copper', name:'Медная монета', add:10, luck:0.12, weight:60}),
      Object.freeze({key:'silver', name:'Серебряная монета', add:20, luck:0.15, weight:30}),
      Object.freeze({key:'gold', name:'Золотая монета', add:30, luck:0.20, weight:10})
    ])
  }),
  rifts: Object.freeze({
    spawnChance: Object.freeze({fog:.04,eclipse:.06,thunder:.07,storm:.09}),
    phantom: Object.freeze({level2Fail:.15,level3Fail:.30}),
    currents: Object.freeze({blueFail:.10,purpleFail:.25}),
    singularity: Object.freeze({1:.05,2:.20,3:.40,4:.65}),
    leviathan: Object.freeze({sacrificeFail:.10,noSacrificeFail:.30}),
    gates: Object.freeze({treasureFail:.25,creatureFail:.35}),
    crimson: Object.freeze({noSacrificeFail:.20,fullFail:.45})
  }),
  islands:Object.freeze({itemChance:.0002,decodeChance:.5,danger:Object.freeze([.30,.32,.34])}),
  abyssal: Object.freeze({
    castChance:.03,
    riftExitChance:.01,
    repeatChance:.35,
    repeatEveryCasts:2
  })
});

const COIN_TYPES = BALANCE.coins.types;
const COIN_ICON_PATH='./assets/icons/coins/';
const COIN_ICON_FILES=Object.freeze({
  copper:'copper-coin.webp',
  silver:'silver-coin.webp',
  gold:'gold-coin.webp'
});
function coinIconMarkup(type, extraClass='') {
  const safeType=['copper','silver','gold'].includes(type)?type:'copper';
  const label=COIN_TYPES.find(coin=>coin.key===safeType)?.name||'Монета';
  return `<span class="coin-icon coin-${safeType}${extraClass?` ${extraClass}`:''}" title="${label}"><img src="${COIN_ICON_PATH}${COIN_ICON_FILES[safeType]}" alt="" aria-hidden="true" decoding="async"></span>`;
}
const WEATHER_WARNING_ICON_PATH='./assets/icons/weather/weather-warning.webp';
const UI_ICON_PATH='./assets/icons/ui/';
const UI_ICON_FILES=Object.freeze({
  /* PUBLIC_STRIP_DEBUG_START */
  debug:'debug-panel.webp',
  /* PUBLIC_STRIP_DEBUG_END */
  soundOn:'sound-on.webp',
  soundOff:'sound-off.webp',
  animationOn:'animation-on.webp',
  animationOff:'animation-off.webp',
  guide:'guide.webp',
  menu:'menu.webp',
  fishingRod:'fishing-rod.webp'
});
function uiIconMarkup(iconKey,extraClass=''){
  const file=UI_ICON_FILES[iconKey];
  if(!file)return '';
  return `<span class="ui-icon${extraClass?` ${extraClass}`:''}"><img src="${UI_ICON_PATH}${file}" alt="" aria-hidden="true" decoding="async"></span>`;
}
const WEATHER_ICON_PATH='./assets/icons/weather/';
const WEATHER_ICON_FILES=Object.freeze({
  sunny:'sunny.webp',
  rain:'rain.webp',
  calm:'calm.webp',
  golden:'golden-hour.webp',
  fog:'fog.webp',
  eclipse:'eclipse.webp',
  thunder:'thunder.webp',
  storm:'storm.webp'
});
function weatherIconMarkup(weatherKey,extraClass=''){
  const file=WEATHER_ICON_FILES[weatherKey];
  if(!file)return DATA.weather[weatherKey]?.icon||'';
  const label=DATA.weather[weatherKey]?.name||'Погода';
  return `<span class="weather-state-icon${extraClass?` ${extraClass}`:''}" title="${label}"><img src="${WEATHER_ICON_PATH}${file}" alt="" aria-hidden="true" decoding="async"></span>`;
}
function weatherWarningIconMarkup(extraClass=''){
  return `<span class="weather-warning-icon${extraClass?` ${extraClass}`:''}" title="Предупреждение о смене погоды"><img src="${WEATHER_WARNING_ICON_PATH}" alt="" aria-hidden="true" decoding="async"></span>`;
}
const $ = (id) => document.getElementById(id);
const round1 = (n) => Math.round((n + Number.EPSILON) * 10) / 10;
const kg = (n) => `${round1(n).toLocaleString('ru-RU',{minimumFractionDigits:1,maximumFractionDigits:1})} кг`;
const rand = (min,max) => Math.random() * (max-min) + min;
const rand1 = (min,max) => round1(rand(min,max));
const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];
const chance = (p) => Math.random() < p;
const uid = () => crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
function rollIslandDistortedWeight(weight){const original=round1(weight);if(original<=.1)return 0;if(original<=1){const maxStep=Math.max(1,Math.round((original-.1)*10));return Math.floor(rand(1,maxStep+1))/10;}return rand1(.1,1);}

function initialState() {
  return {
    castsLeft:BALANCE.session.casts, castClicks:0, weather:pick(Object.keys(DATA.weather)), finished:false,
    fish:[], trash:[], history:[], stolen:[], eaten:[],
    bonuses:[], artifacts:[], debuffs:[], disabledBonusIds:new Set(),
    mythic:{eyeCycles:[],primordialChaos:false,threadPendingBoosts:[]},
    compassUsed:false, angusTrailCasts:0, leviathanStep:0, diverPending:false, essenceUsed:false,
    deepThingActive:false, nautilus:false, megalodon:false, diceFinalMultiplier:1,
    directHeavy:false, directGiant:false, angusGift:false, octopusSeen:false,
    receivedDebuffCount:0, receivedDebuffNames:[], bonusArtifactCount:0, artifactCount:0, stormSeen:false,
    weatherSeen:[/* filled after state creation */], fishCaughtTotal:0, heavyCaughtTotal:0,
    giantCaughtTotal:0, smallFishCaught:0, goldenFishCaught:false, exactFortyCaught:false,
    goldenHourFishCount:0, thunderHeavyCaught:false, scubaAppliedTo15:false, seagullStoleHeaviest:false, trashStreak:0, maxTrashStreak:0,
    trashNamesCaught:[], luckyFloatSaves:0, flippersBoostedCount:0, blockedDebuffCount:0,
    recoveredByMessage:false, recoveredByMegalodonCount:0, orcaNeutralized:false,
    bonusAfterOctopus:false, hadAnyFish:false, fishLostToDebuffs:false,
    epicInFog:false, legendaryInEclipse:false, compassWeatherChanged:false,
    diceExtraCasts:false, diceWeightMultiplier:false, deepThingConvertedCount:0,
    nautilusActivatedWithTwoBonuses:false, leviathanFishCount:0,
    angusEncounters:0, angusLegendaryGift:false, angusGiantGift:false, angusFromCompass:false,
    sessionCategories:{bonus:false,debuff:false,epic:false,legendary:false},
    arcadeCaughtCount:0, arcadeLastSpawnCast:-1, pendingSeagulls:[], coins:[], pendingCoinBoosts:[], tradeItems:[], tradeShipChecked:false, tradeShipArrived:false, tradeShipCompleted:false, tradeShipOffers:[], tradeExchanges:[], tradeShipHistoryId:null,tradeShipSource:null,
    rifts:{naturalOpened:false,active:null,completed:0,failed:0,declined:0,maxDepthCompleted:false,feats:[],relics:[],temporaryEffects:[],pendingDanger:false},
    islands:{items:[],expeditions:[],active:null,unstablePresence:false,sharpFinRod:false,flares:0,destructiveFlares:0,finishPromptResolved:false,flareFinishResolved:false,completed:0,navigators:[],navigatorCategory:null,fadedRelicFragments:0,moonShellActiveId:null,moonShellProtected:false,moonShellDoubles:0,moonShellLeviathanGranted:false,firstWaterWeakening:false,feats:[]},
    abyssal:{entity:null},
    dungeon:{ordinaryFishSinceRoll:0,encounter:null,runs:0,rewards:[],wrath:false,feats:[]},
    sessionDate:null, finalResult:null
  };
}
function serializeState(value) {
  return JSON.stringify({...value, disabledBonusIds:[...value.disabledBonusIds]});
}
function hydrateState(raw) {
  const parsed = JSON.parse(raw);
  const base=initialState();
  const restored={...base, ...parsed, rifts:{...base.rifts,...(parsed.rifts||{})}, islands:{...base.islands,...(parsed.islands||{})}, abyssal:{...base.abyssal,...(parsed.abyssal||{})}, dungeon:{...base.dungeon,...(parsed.dungeon||{})}, mythic:{...base.mythic,...(parsed.mythic||{})}, disabledBonusIds:new Set(parsed.disabledBonusIds || [])};
  (restored.fish||[]).forEach(fish=>{
    if(Array.isArray(fish.tags))fish.tags=fish.tags.filter(tag=>!/^\s*Ласты\s*[×xх]\s*[\d.,]+/i.test(String(tag))&&!/ограничение\s+до\s+[\d.,]+\s*кг/i.test(String(tag)));
  });
  (restored.history||[]).forEach(row=>{
    if(row.type!=='fish')return;
    row.detail=String(row.detail||'').split(/\s*•\s*/).filter(part=>!/^\s*Ласты\s*[×xх]\s*[\d.,]+/i.test(part)&&!/ограничение\s+до\s+[\d.,]+\s*кг/i.test(part)).join(' • ');
  });
  (restored.artifacts||[]).forEach(artifact=>{
    if(artifact.name==='Игральная кость')artifact.name='Гексаэдр пятой грани';
    if(artifact.name==='Око Шторма'&&!artifact.form){const cycle=(restored.mythic?.eyeCycles||[]).find(item=>item.id===artifact.id);artifact.form=cycle?.mode==='rage'?'stormRage':'stormEye';}
  });
  (restored.history||[]).forEach(row=>{if(row.text==='Игральная кость')row.text='Гексаэдр пятой грани';row.detail=String(row.detail||'').replaceAll('Игральные кости','Гексаэдры пятой грани').replaceAll('Игральная кость','Гексаэдр пятой грани');});
  const riftLabels={phantom:'Призрачный шлейф',df1:'Батисфера DF‑1',currents:'Разрыв течений',singularity:'Сингулярная яма',unstable:'Скрытая бездна',leviathan:'Печать Левиафана',gates:'Врата глубин',crimson:'Сердце бездны'};
  (restored.history||[]).forEach(row=>{if(row.type==='abyssal'&&row.abyssPersonality==='parasite')row.detail=String(row.detail||'').replace('Паразит пожрал предмет обмена','Паразит поглотил предмет обмена');});
  (restored.fish||[]).filter(f=>f.riftSacrificed&&!f.riftSacrificeLabel).forEach(f=>{
    const activeSacrifice=(restored.rifts.active?.sacrifices||[]).some(item=>item.id===f.id);
    const name=activeSacrifice?riftLabels[restored.rifts.active?.type]:null;
    f.riftSacrificeLabel=name?`Принесена в жертву Разлому «${name}»`:'Принесена в жертву Разлому';
    (restored.history||[]).forEach(row=>{if(row.type==='fish'&&row.fishId===f.id){row.eaten=true;row.riftSacrificeLabel=f.riftSacrificeLabel;}if((row.embeddedFishIds||[]).includes(f.id))row.riftSacrificeLabel=f.riftSacrificeLabel;});
  });
  (restored.tradeItems||[]).filter(item=>item.abyssConsumed&&!item.destroyedByParasite).forEach(item=>{
    const parasiteEvent=(restored.history||[]).some(row=>row.type==='abyssal'&&row.abyssPersonality==='parasite'&&String(row.detail||'').includes(item.name)&&/(пожрал|поглотил) предмет обмена/.test(String(row.detail||'')));
    if(parasiteEvent)item.destroyedByParasite=true;
  });
  (restored.tradeItems||[]).filter(item=>item.destroyedByParasite&&!item.abyssChange).forEach(item=>{item.abyssChange={kind:'destroyed',source:'Паразит',label:'Уничтожен Паразитом'};});
  if(restored.rifts){
    if(!Array.isArray(restored.rifts.relics))restored.rifts.relics=[];
    const acquiredRelics=new Map();
    (restored.history||[]).forEach(row=>(row.riftLootResults||[]).forEach(item=>{
      const relicName=item.kind==='relic'?item.name:item.kind==='shard'&&item.name==='Осколок сингулярности'?item.name:'';
      if(relicName)acquiredRelics.set(relicName,(acquiredRelics.get(relicName)||0)+(item.count||1));
    }));
    acquiredRelics.forEach((count,name)=>{
      const storedCount=restored.rifts.relics.filter(relic=>relic.name===name).length;
      for(let i=storedCount;i<count;i++)restored.rifts.relics.push({id:uid(),name,type:name==='Сердце бездны'?'crimson':null,used:false,recovered:true});
    });
  }
  if(restored.rifts?.active?.awaitingChoice){
    restored.rifts.active.awaitingChoice=false;
    restored.rifts.active.resumeInterruptedStage=true;
    restored.rifts.active.message='Выбор текущего этапа был прерван обновлением страницы. Нажмите «Исследовать глубже», чтобы восстановить его.';
  }
  const disabledLegacyFlippers=(restored.bonuses||[]).some(b=>b.name==='Ласты'&&restored.disabledBonusIds.has(b.id));
  if(restored.octopusSeen&&disabledLegacyFlippers){
    (restored.fish||[]).forEach(fish=>{
      const impact=fish.flipperImpact;
      if(!impact||impact.cancelledByOctopus||Array.isArray(impact.bonusIds))return;
      impact.cancelledByOctopus=true;
      const baseLoss=round1(impact.after-impact.before);
      const propagatedLoss=fish.moonShellImpact?round1(baseLoss*2):baseLoss;
      impact.cancelledWeight=fish.islandDistorted?0:Math.min(Math.max(0,fish.weight),propagatedLoss);
      if(!fish.islandDistorted){
        fish.weight=round1(Math.max(0,fish.weight-impact.cancelledWeight));
        if(Number.isFinite(fish.unrestrictedWeight))fish.unrestrictedWeight=round1(Math.max(0,fish.unrestrictedWeight-impact.cancelledWeight));
        fish.category=categoryForWeight(fish.weight);
      }
    });
  }
  const obsoleteHistoryIds=new Set();
  (restored.history||[]).filter(row=>row.type==='abyssal'&&['metamorph','raider'].includes(row.abyssPersonality)).forEach(row=>{
    const detail=String(row.detail||'');
    const match=detail.match(/(?:предмет|Предмет) «([^»]+)» (?:мутировал|превращён) в ([^•)]+)/);
    if(!match)return;
    const item=(restored.tradeItems||[]).find(entry=>entry.abyssConsumed&&!entry.abyssChange&&entry.name===match[1]);if(!item)return;
    const trashName=match[2].trim().toLocaleLowerCase('ru-RU');
    const eventIndex=(restored.history||[]).findIndex(entry=>entry.id===row.id);
    let trash=(restored.trash||[]).find(entry=>entry.abyssCreated&&entry.name.toLocaleLowerCase('ru-RU')===trashName);
    if(!trash)trash=(restored.trash||[]).filter(entry=>entry.abyssCreated&&entry.historyRowId).map(entry=>({entry,index:(restored.history||[]).findIndex(historyRow=>historyRow.id===entry.historyRowId)})).filter(candidate=>candidate.index>eventIndex).sort((a,b)=>a.index-b.index)[0]?.entry;
    item.abyssChange={kind:'transform',source:row.abyssPersonality==='metamorph'?'Метаморф':'Расхититель',toName:trash?.name||trashName,toIcon:'🔘',toType:'trash'};
    if(trash){if(trash.historyRowId)obsoleteHistoryIds.add(trash.historyRowId);trash.historyRowId=item.historyRowId;}
  });
  if(obsoleteHistoryIds.size)restored.history=(restored.history||[]).filter(row=>!obsoleteHistoryIds.has(row.id));
  return restored;
}
function loadDailyState() {
  try {
    const storageKey = BUILD_CONFIG.unlimitedSessions ? TEST_SESSION_KEY : DAILY_KEY;
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (BUILD_CONFIG.unlimitedSessions) {
      if (saved?.state && !JSON.parse(saved.state).finished) return hydrateState(saved.state);
      return initialState();
    }
    if (saved?.date === localDayKey() && saved.state) return hydrateState(saved.state);
    if (saved?.date && saved.date !== localDayKey()) localStorage.removeItem(DAILY_KEY);
  } catch (error) {
    console.warn('Не удалось восстановить игровую сессию', error);
  }
  return initialState();
}
function saveDailyState() {
  if (!state.sessionDate) return;
  try {
    const storageKey = BUILD_CONFIG.unlimitedSessions ? TEST_SESSION_KEY : DAILY_KEY;
    localStorage.setItem(storageKey, JSON.stringify({date:state.sessionDate, state:serializeState(state)}));
  } catch (error) {
    console.warn('Не удалось сохранить игровую сессию', error);
  }
}

let state = loadDailyState();
;(state.trash||[]).filter(item=>!item.abyssCreated).forEach(item=>{if(item.recyclonEligible===undefined)item.recyclonEligible=true;});
if (!Array.isArray(state.weatherSeen)) state.weatherSeen=[];
if (!state.weatherSeen.includes(state.weather)) state.weatherSeen.push(state.weather);
if (state.weather==='storm') state.stormSeen=true;
function commitState(){render();saveDailyState();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveDailyState();});
window.addEventListener('pagehide',saveDailyState);

function activeBonuses(name) {
  return state.bonuses.filter(b => b.name === name && !state.disabledBonusIds.has(b.id));
}
function hasBonus(name) { return activeBonuses(name).length > 0; }
function activeDebuff(name) { return state.debuffs.some(d => d.name === name && d.active); }
function activeEnhancedDiver(){return activeBonuses('Снаряжение дайвера').find(b=>b.abyssEnhanced&&!b.strongBlockUsed);}
function tradeItemCounts() {
  return (state.tradeItems||[]).reduce((counts,item)=>{
    if (!item.exchanged) counts[item.key]=(counts[item.key]||0)+1;
    return counts;
  },{});
}
function tradedTradeItemCounts(){return (state.tradeItems||[]).reduce((counts,item)=>{if(item.exchanged&&item.exchangeReason==='trade')counts[item.key]=(counts[item.key]||0)+1;return counts;},{});}
function availableTradeItemsForKey(key) {
  return (state.tradeItems||[]).filter(item=>item.key===key&&!item.exchanged);
}
function sampleUnique(items,count) {
  const pool=[...items]; const result=[];
  while(pool.length&&result.length<count) result.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
  return result;
}

function abyssalEntity(){ return state.abyssal?.entity||null; }
function hasPendingAbyssalDecision(){ return abyssalEntity()?.status==='pending'; }
function hasRetainedAbyssal(){ return abyssalEntity()?.status==='retained'; }
function availableAbyssFish(){ return state.fish.filter(f=>!f.removed&&!f.riftSacrificed); }
function availableAbyssTrash(){ return state.trash.filter(t=>!t.converted); }
function unusedCoins(){ return state.coins.filter(c=>!c.used&&!c.expired); }
function availableTradeItems(){ return state.tradeItems.filter(item=>!item.exchanged); }
function abyssSample(items,min,max=min){ return sampleUnique(items,Math.min(items.length,Math.floor(rand(min,max+1)))); }
function abyssPercent(value){ return Math.round(value*100); }
function abyssFishLabel(f){ return `${capitalize(f.name)} — ${kg(f.weight)}`; }
function setFishAbyssLost(fish,label){
  if(fish.islandColossus)return false;
  fish.removed=true;fish.abyssLost=label;
  if(/Уничтожена Разрушителем/i.test(label))fish.abyssSkeleton=true;
  state.history.forEach(row=>{if((row.type==='fish'&&row.fishId===fish.id)||(row.embeddedFishIds||[]).includes(fish.id)){row.abyssLost=label;}});
  refreshUnstablePresence();
  return true;
}
function damageProtectedAbyssColossus(fish,source){
  const before=fish.weight,factor=rand(.5,.7);changeAbyssFishWeight(fish,factor,source);return `${fish.name} невозможно уничтожить: ${kg(before)} → ${kg(fish.weight)} (−${abyssPercent(1-factor)}%) • «Нестабильное присутствие» сохраняется`;
}
function changeAbyssFishWeight(fish,factor,source){
  const before=fish.weight;fish.weight=Math.max(.1,round1(before*factor));fish.tags.push(`${source}: ${factor>=1?'+':'−'}${Math.abs(abyssPercent(factor-1))}%`);
  if(!Array.isArray(fish.abyssImpacts))fish.abyssImpacts=[];
  fish.abyssImpacts.push({source,type:'weight',before,after:fish.weight,factor});
  return `${capitalize(fish.name)}: ${kg(before)} → ${kg(fish.weight)}`;
}
function transformAbyssFish(fish,category,source){
  const beforeCategory=fish.category,before=fish.weight;
  fish.category=category;fish.weight=category==='giant'?rand1(20,40):category==='heavy'?rand1(10,19.9):rand1(.1,9.9);
  fish.abyssTransformed=true;fish.tags.push(`${source}: ${beforeCategory} → ${category}`);
  if(!Array.isArray(fish.abyssImpacts))fish.abyssImpacts=[];
  fish.abyssImpacts.push({source,type:'category',before,after:fish.weight,beforeCategory,afterCategory:category});
  const labels={normal:'обычная',heavy:'тяжеловес',giant:'гигант'};
  return `${capitalize(fish.name)}: ${labels[beforeCategory]||beforeCategory} ${kg(before)} → ${labels[category]} ${kg(fish.weight)}`;
}
function neutralizeRandomDebuff(source){
  const active=state.debuffs.filter(d=>d.active);if(!active.length)return null;
  const debuff=pick(active);debuff.active=false;debuff.abyssChange={kind:'neutralized',source,label:`Нейтрализован: ${source}`};
  if(debuff.name==='Чайка'&&state.pendingSeagulls.length)state.pendingSeagulls.shift();
  return `${source} нейтрализовал дебаф «${debuff.name}»; прошлые последствия сохранены`;
}
function disableRandomBonus(source){
  const bonuses=state.bonuses.filter(b=>!state.disabledBonusIds.has(b.id));if(!bonuses.length)return null;
  const bonus=pick(bonuses);state.disabledBonusIds.add(bonus.id);bonus.abyssChange={kind:'disabled',source,label:`Отключён: ${source}`};return `${source} отключил бонус «${bonus.name}» до конца сессии`;
}
function createAbyssTrash(source,parentHistoryId=null){
  const name=pick(DATA.trash);let row=null;
  if(!parentHistoryId)row=addHistory(capitalize(name),'trash',`(Создано формой жизни • ${source})`,{numbered:false});
  const trash={id:uid(),name,converted:false,historyRowId:parentHistoryId||row?.id||null,abyssCreated:true};state.trash.push(trash);return trash;
}
function createAbyssTradeItem(source,key=null,parentHistoryId=null){
  const d=key?tradeItemByKey(key):pick(TRADE_ITEMS);const item={id:uid(),key:d.key,name:d.name,icon:d.icon,fishId:null,historyRowId:parentHistoryId,exchanged:false,abyssCreated:true};state.tradeItems.push(item);return item;
}
function createAbyssCoin(source,parentHistoryId=null){
  const type=chooseCoinType();const coin={id:uid(),type:type.key,name:type.name,add:type.add,luck:type.luck,used:false,success:false,applied:false,expired:false,historyRowId:null,abyssCreated:true};
  state.coins.push(coin);if(parentHistoryId){coin.historyRowId=parentHistoryId;const row=state.history.find(h=>h.id===parentHistoryId);if(row)row.coinId=coin.id;}else{const row=addHistory(type.name,'coin',`(Создана формой жизни • ${source}; шанс ${Math.round(type.luck*100)}%: следующая рыба получит +${type.add} кг)`,{coinId:coin.id,numbered:false});coin.historyRowId=row.id;}return coin;
}
function runAvailableAbyssAction(actions,neutral){
  const available=actions.filter(action=>action.available());if(!available.length)return [neutral];
  const selected=weightedResult(Object.fromEntries(available.map((action,index)=>[index,action.weight||1])));return available[Number(selected)].run();
}
function parasiteAction(){
  return runAvailableAbyssAction([
    {available:()=>availableAbyssFish().length,run:()=>abyssSample(availableAbyssFish(),1,3).map(f=>changeAbyssFishWeight(f,rand(.6,.8),'Паразит'))},
    {available:()=>availableAbyssFish().some(f=>f.category==='giant'),run:()=>[transformAbyssFish(pick(availableAbyssFish().filter(f=>f.category==='giant')),chance(.5)?'heavy':'normal','Паразит')]},
    {available:()=>state.bonuses.some(b=>!state.disabledBonusIds.has(b.id)),run:()=>[disableRandomBonus('Паразит')]},
    {available:()=>state.debuffs.some(d=>d.active),run:()=>[neutralizeRandomDebuff('Паразит')]},
    {available:()=>availableTradeItems().length,run:()=>{const item=pick(availableTradeItems());item.exchanged=true;item.abyssConsumed=true;item.destroyedByParasite=true;item.abyssChange={kind:'destroyed',source:'Паразит',label:'Уничтожен Паразитом'};return [`Паразит поглотил предмет обмена «${item.name}»`];}},
    {available:()=>unusedCoins().length,run:()=>{const coin=pick(unusedCoins());coin.expired=true;coin.abyssConsumed=true;coin.abyssChange={kind:'destroyed',source:'Паразит',label:'Поглощена Паразитом'};return [`Паразит поглотил монету «${coin.name}»`];}}
  ],'Паразит не нашёл носителя');
}
function predatorVictims(pool,count,preferHeavy=false){
  const victims=[];const candidates=[...pool];
  while(candidates.length&&victims.length<count){const target=preferHeavy&&chance(.7)?[...candidates].sort((a,b)=>b.weight-a.weight)[0]:pick(candidates);victims.push(target);candidates.splice(candidates.indexOf(target),1);}
  return victims.map(f=>{if(f.islandColossus)return damageProtectedAbyssColossus(f,'Хищник');setFishAbyssLost(f,'Съедена Хищником');return `Съедена: ${abyssFishLabel(f)}`;});
}
function predatorAction(){
  const fish=availableAbyssFish();if(!fish.length)return ['Хищник не обнаружил добычу'];
  const rare=fish.filter(f=>['rare','epic','legendary'].includes(f.rarity));const giants=fish.filter(f=>f.category==='giant');
  return runAvailableAbyssAction([
    {weight:45,available:()=>fish.length,run:()=>predatorVictims(fish,chance(.3)?2:1)},
    {weight:35,available:()=>fish.length,run:()=>{const valuable=[...new Map([...rare,...giants].map(f=>[f.id,f])).values()],tier=valuable.length?valuable:fish.some(f=>f.category==='heavy')?fish.filter(f=>f.category==='heavy'):fish;return predatorVictims(tier,chance(.3)?2:1,true);}},
    {weight:10,available:()=>rare.length,run:()=>predatorVictims(rare,rare.length)},
    {weight:10,available:()=>giants.length,run:()=>predatorVictims(giants,chance(.25)?2:1)}
  ],'Хищник не обнаружил добычу');
}
function symbioteAction(){
  return runAvailableAbyssAction([
    {available:()=>availableAbyssFish().length,run:()=>abyssSample(availableAbyssFish(),1,3).map(f=>changeAbyssFishWeight(f,rand(1.2,1.4),'Симбиот'))},
    {available:()=>availableAbyssFish().some(f=>f.category==='normal'),run:()=>[transformAbyssFish(pick(availableAbyssFish().filter(f=>f.category==='normal')),'heavy','Симбиот')]},
    {available:()=>availableAbyssFish().some(f=>f.category==='heavy'),run:()=>[transformAbyssFish(pick(availableAbyssFish().filter(f=>f.category==='heavy')),'giant','Симбиот')]},
    {available:()=>state.bonuses.some(b=>!state.disabledBonusIds.has(b.id)&&!b.abyssEnhanced),run:()=>{const b=pick(state.bonuses.filter(x=>!state.disabledBonusIds.has(x.id)&&!x.abyssEnhanced));b.abyssEnhanced=true;b.strongBlockUsed=false;b.abyssChange={kind:'enhanced',source:'Симбиот',label:'Усилен Симбиотом'};return [`Симбиот усилил бонус «${b.name}»`];}},
    {available:()=>state.debuffs.some(d=>d.active),run:()=>[neutralizeRandomDebuff('Симбиот')]},
    {available:()=>availableAbyssFish().some(f=>f.debuffLimited),run:()=>{const f=pick(availableAbyssFish().filter(x=>x.debuffLimited)),before=f.weight,restored=Number.isFinite(f.unrestrictedWeight)?f.unrestrictedWeight:f.preDebuffWeight;f.weight=round1(restored);if(!Array.isArray(f.abyssImpacts))f.abyssImpacts=[];f.abyssImpacts.push({source:'Симбиот',type:'weight',before,after:f.weight,factor:f.weight/before});f.debuffLimited=false;delete f.debuffBaseWeight;delete f.preDebuffWeight;delete f.unrestrictedWeight;return [`Симбиот восстановил ${capitalize(f.name)}: ${kg(before)} → ${kg(f.weight)}`];}}
  ],'Симбиотическая связь не оказала заметного эффекта');
}
function raiderAction(){
  return runAvailableAbyssAction([
    {available:()=>availableAbyssTrash().length,run:()=>{const t=pick(availableAbyssTrash());t.converted=true;const item=createAbyssTradeItem('Расхититель',null,t.historyRowId);t.abyssChange={kind:'transform',source:'Расхититель',toName:item.name,toIcon:item.icon,toType:'trade'};return [`${capitalize(t.name)} превращён в предмет «${item.name}»`];}},
    {available:()=>availableAbyssTrash().length,run:()=>{const t=pick(availableAbyssTrash());t.converted=true;const coin=createAbyssCoin('Расхититель',t.historyRowId);t.abyssChange={kind:'transform',source:'Расхититель',toName:coin.name,toIcon:'🪙',toType:'coin',toCoinType:coin.type};return [`${capitalize(t.name)} превращён в монету «${coin.name}»`];}},
    {available:()=>availableTradeItems().length,run:()=>{const item=pick(availableTradeItems());item.exchanged=true;item.abyssConsumed=true;const t=createAbyssTrash('Расхититель',item.historyRowId);item.abyssChange={kind:'transform',source:'Расхититель',toName:t.name,toIcon:'🔘',toType:'trash'};return [`Предмет «${item.name}» превращён в ${t.name}`];}},
    {available:()=>unusedCoins().length,run:()=>{const victims=sampleUnique(unusedCoins(),Math.min(unusedCoins().length,chance(.25)?2:1));victims.forEach(c=>{c.expired=true;c.abyssConsumed=true;c.abyssChange={kind:'removed',source:'Расхититель',label:'Забрана Расхитителем'};});return [`Расхититель забрал монет: ${victims.length} (${victims.map(c=>c.name).join(', ')})`];}},
    {available:()=>availableTradeItems().length,run:()=>{const base=pick(availableTradeItems()),count=chance(.25)?2:1;for(let i=0;i<count;i++)createAbyssTradeItem('Расхититель',base.key,base.historyRowId);base.abyssNotes=[...(base.abyssNotes||[]),`Расхититель увеличил количество на ${count}`];return [`Количество предметов «${base.name}» увеличено на ${count}`];}},
    {available:()=>availableTradeItems().length,run:()=>{const base=pick(availableTradeItems()),same=availableTradeItems().filter(i=>i.key===base.key),victims=sampleUnique(same,Math.min(same.length,chance(.25)?2:1));victims.forEach(i=>{i.exchanged=true;i.abyssConsumed=true;i.abyssChange={kind:'removed',source:'Расхититель',label:'Изъят Расхитителем'};});return [`Количество предметов «${base.name}» уменьшено на ${victims.length}`];}}
  ],'Расхититель не обнаружил редких находок');
}
function destroyerAction(){
  const fish=availableAbyssFish();
  const actions=[
    {key:'bonus',weight:25,available:()=>state.bonuses.some(b=>!state.disabledBonusIds.has(b.id)),run:()=>[disableRandomBonus('Разрушитель')]},
    {key:'debuff',weight:20,available:()=>state.debuffs.some(d=>d.active),run:()=>[neutralizeRandomDebuff('Разрушитель')]},
    {key:'weight',weight:25,available:()=>availableAbyssFish().length,run:()=>abyssSample(availableAbyssFish(),2,4).map(f=>changeAbyssFishWeight(f,rand(.6,1.4),'Разрушитель'))},
    {key:'destroy',weight:20,available:()=>availableAbyssFish().length,run:()=>{const pool=availableAbyssFish(),count=Math.max(1,Math.ceil(pool.length*rand(.2,.3))),victims=sampleUnique(pool,count);return victims.map(f=>{if(f.islandColossus)return damageProtectedAbyssColossus(f,'Разрушитель');setFishAbyssLost(f,'Уничтожена Разрушителем');return `Уничтожена: ${abyssFishLabel(f)}`;});}},
    {key:'chain',weight:10,available:()=>state.bonuses.some(b=>!state.disabledBonusIds.has(b.id))||availableAbyssFish().length,run:()=>{const effects=[];if(state.bonuses.some(b=>!state.disabledBonusIds.has(b.id)))effects.push(()=>[disableRandomBonus('Разрушитель')]);if(availableAbyssFish().length)effects.push(()=>abyssSample(availableAbyssFish(),1,3).map(f=>changeAbyssFishWeight(f,rand(.6,.8),'Разрушитель')));if(availableAbyssFish().length)effects.push(()=>{const f=pick(availableAbyssFish());if(f.islandColossus)return [damageProtectedAbyssColossus(f,'Разрушитель')];setFishAbyssLost(f,'Уничтожена Разрушителем');return [`Уничтожена: ${abyssFishLabel(f)}`];});const count=Math.min(effects.length,chance(.25)?3:2);return sampleUnique(effects,count).flatMap(run=>run());}}
  ];
  return runAvailableAbyssAction(actions,'Разрушителю нечего нарушить');
}
function metamorphBaseActions(){
  return [
    {key:'normal-heavy',available:()=>availableAbyssFish().some(f=>f.category==='normal'),run:()=>[transformAbyssFish(pick(availableAbyssFish().filter(f=>f.category==='normal')),'heavy','Метаморф')]},
    {key:'heavy-giant',available:()=>availableAbyssFish().some(f=>f.category==='heavy'),run:()=>[transformAbyssFish(pick(availableAbyssFish().filter(f=>f.category==='heavy')),'giant','Метаморф')]},
    {key:'to-normal',available:()=>availableAbyssFish().some(f=>['heavy','giant'].includes(f.category)),run:()=>[transformAbyssFish(pick(availableAbyssFish().filter(f=>['heavy','giant'].includes(f.category))),'normal','Метаморф')]},
    {key:'weight',available:()=>availableAbyssFish().length,run:()=>abyssSample(availableAbyssFish(),2,4).map(f=>changeAbyssFishWeight(f,rand(.6,1.4),'Метаморф'))},
    {key:'trash-out',available:()=>availableAbyssTrash().length,run:()=>{const t=pick(availableAbyssTrash());t.converted=true;if(chance(.5)){const item=createAbyssTradeItem('Метаморф',null,t.historyRowId);t.abyssChange={kind:'transform',source:'Метаморф',toName:item.name,toIcon:item.icon,toType:'trade'};return [`${capitalize(t.name)} мутировал в предмет «${item.name}»`];}const coin=createAbyssCoin('Метаморф',t.historyRowId);t.abyssChange={kind:'transform',source:'Метаморф',toName:coin.name,toIcon:'🪙',toType:'coin',toCoinType:coin.type};return [`${capitalize(t.name)} мутировал в монету «${coin.name}»`];}},
    {key:'resource-trash',available:()=>availableTradeItems().length||unusedCoins().length,run:()=>{const useItem=availableTradeItems().length&&(!unusedCoins().length||chance(.5));let label,sourceObject,parentId;if(useItem){sourceObject=pick(availableTradeItems());sourceObject.exchanged=true;sourceObject.abyssConsumed=true;label=`предмет «${sourceObject.name}»`;parentId=sourceObject.historyRowId;}else{sourceObject=pick(unusedCoins());sourceObject.expired=true;sourceObject.abyssConsumed=true;label=`монета «${sourceObject.name}»`;parentId=sourceObject.historyRowId;}const t=createAbyssTrash('Метаморф',parentId);sourceObject.abyssChange={kind:'transform',source:'Метаморф',toName:t.name,toIcon:'🔘',toType:'trash'};return [`${label} мутировал в ${t.name}`];}}
  ];
}
function metamorphAction(){
  const base=metamorphBaseActions().map(a=>({...a,weight:15}));
  const chain={key:'chain',weight:10,available:()=>base.some(a=>a.available()),run:()=>{const wanted=chance(.2)?5:chance(.375)?4:3,used=new Set(),lines=[];for(let i=0;i<wanted;i++){const choices=metamorphBaseActions().filter(a=>!used.has(a.key)&&a.available());if(!choices.length)break;const action=pick(choices);used.add(action.key);lines.push(...action.run());}return lines;}};
  return runAvailableAbyssAction([...base,chain],'Мутация не затронула улов');
}
function performAbyssalManifestation(forced=false){
  const entity=abyssalEntity();if(!entity||entity.status!=='retained')return false;
  triggerHeaderPresence('abyssal');
  playSound('abyssalImpact');
  const def=ABYSSAL_PERSONALITIES[entity.personality];const runners={parasite:parasiteAction,predator:predatorAction,symbiote:symbioteAction,raider:raiderAction,destroyer:destroyerAction,metamorph:metamorphAction};
  const first=!entity.manifested,row=addHistory(first?def.reveal:def.repeat,'abyssal','(Проявление исследуется…)',{numbered:false,abyssPersonality:entity.personality,abyssManifestation:true,forced:Boolean(forced)});
  const lines=(runners[entity.personality]?.()||['Проявление не оказало заметного эффекта']).filter(Boolean);
  entity.manifested=true;entity.actions=(entity.actions||0)+1;entity.castsSinceCheck=0;
  row.detail=`(${lines.join(' • ')})`;renderHistory();
  return true;
}
function advanceAbyssalAfterCast(){
  const entity=abyssalEntity();if(!entity||entity.status!=='retained')return;
  if(!entity.manifested){entity.delayLeft=Math.max(0,(entity.delayLeft||1)-1);if(entity.delayLeft===0)performAbyssalManifestation();return;}
  entity.castsSinceCheck=(entity.castsSinceCheck||0)+1;
  if(entity.castsSinceCheck>=BALANCE.abyssal.repeatEveryCasts){entity.castsSinceCheck=0;if(chance(BALANCE.abyssal.repeatChance))performAbyssalManifestation();}
}
function catchAbyssalLife(source='cast',forcedPersonality=null){
  if(abyssalEntity())return null;
  playSound('abyssalAppear');
  const personality=forcedPersonality||pick(Object.keys(ABYSSAL_PERSONALITIES));
  const row=addHistory('Неизвестная абиссальная форма жизни','abyssal',source==='rift'?'(Обнаружена среди добычи Разлома)':'(Самостоятельный результат заброса)',{numbered:source==='cast',abyssDecision:true,abyssSource:source});
  state.abyssal.entity={id:uid(),personality,status:'pending',source,rowId:row.id,manifested:false,actions:0,delayLeft:null,castsSinceCheck:0};return state.abyssal.entity;
}
function resolveAbyssalDecision(keep){
  const entity=abyssalEntity();if(!entity||entity.status!=='pending')return;
  const source=entity.source,row=state.history.find(h=>h.id===entity.rowId);if(keep){entity.status='retained';entity.delayLeft=chance(.5)?1:2;if(row){row.abyssDecision=false;row.abyssKept=true;row.detail='(Форма жизни оставлена • характер неизвестен • избавиться от неё больше нельзя)';}}else{if(row){row.abyssDecision=false;row.abyssRemoved=true;row.detail='(Форма жизни удалена без последствий)';}state.abyssal.entity=null;}
  if(source==='cast'){let opened=false;if(state.mythic?.pendingSparkRift&&!state.rifts.active){state.mythic.pendingSparkRift=false;makeRift(pick(Object.keys(RIFT_TYPES)),true);opened=true;}else opened=maybeOpenRiftAfterCast();if(!opened)maybeScheduleArcadeAfterCast();}if(state.castsLeft<=0)maybeFinalizeSession();commitState();
}

function addHistory(text,type='event',detail='',meta={}) {
  const defaultNumbered=['fish','bonus','epic','legendary','mythic','trash','coin'].includes(type);
  const row={id:uid(),text,type,detail,numbered:defaultNumbered,...meta};
  state.history.push(row);
  lastAnimatedHistoryId=row.id;
  renderHistory();
  return row;
}
function updateHistoryDetail(rowOrId, detail) {
  const id=typeof rowOrId==='object'?rowOrId?.id:rowOrId;
  const row=state.history.find(item=>item.id===id);
  if (!row) return;
  row.detail=detail;
  renderHistory();
}
function appendLatestHistoryDetail(type, detail) {
  const row=[...state.history].reverse().find(item=>item.type===type);
  if (!row) return;
  const clean=String(detail||'').replace(/^\(|\)$/g,'');
  const previous=String(row.detail||'').replace(/^\(|\)$/g,'');
  row.detail=`(${previous?`${previous} • `:''}${clean})`;
  renderHistory();
}

function appendHistoryDetailById(id, detail) {
  const row=state.history.find(item=>item.id===id);
  if (!row) return;
  const clean=String(detail||'').replace(/^\(|\)$/g,'');
  const previous=String(row.detail||'').replace(/^\(|\)$/g,'');
  row.detail=`(${previous?`${previous} • `:''}${clean})`;
  renderHistory();
}
function attachFishToHistoryRow(rowId, fishId) {
  const row=state.history.find(item=>item.id===rowId);
  if (!row) return;
  if (!Array.isArray(row.embeddedFishIds)) row.embeddedFishIds=[];
  row.embeddedFishIds.push(fishId);
  renderHistory();
}
function fishIsStolen(fish) { return state.stolen.some(item=>item.id===fish.id); }
function fishIsEaten(fish) { return state.eaten.some(item=>item.id===fish.id); }
const FISH_CATEGORY_ICON_PATH='./assets/icons/fish-categories/';
const FISH_STATUS_ICON_PATH='./assets/icons/fish-status/';
const RIFT_FISH_ICON_PATH='./assets/icons/rift-fish/';
const RIFT_RELIC_ICON_PATH='./assets/icons/rift-relics/';
const RIFT_RELIC_ICON_FILES=Object.freeze({
  'Фантомный осколок':'phantom-shard.webp',
  'Ядро DF1':'df1-core-relic.webp',
  'Кристалл расслоения':'stratification-crystal.webp',
  'Осколок сингулярности':'singularity-shard.webp',
  'Око скрытой бездны':'hidden-abyss-eye.webp',
  'Печать Левиафана':'leviathan-seal.webp',
  'Обсидиановый ключ':'obsidian-key.webp',
  'Сердце бездны':'abyss-heart.webp'
});
const RIFT_RELIC_HINTS=Object.freeze({
  'Фантомный осколок':'Автоматически вернёт первую рыбу, которую украдёт Чайка или съест Касатка',
  'Ядро DF1':'Вручную покажет результат следующего заброса: его можно оставить или уничтожить',
  'Кристалл расслоения':'Вручную предложит оставить следующую рыбу или раскрыть второй результат',
  'Осколок сингулярности':'Вручную превратит выбранную обычную рыбу в гиганта',
  'Око скрытой бездны':'Вручную отменит следующее негативное событие и даст следующей рыбе +5 кг',
  'Печать Левиафана':'Вручную усилит выбранного тяжеловеса на 25–40%, затем вызовет опасное событие',
  'Обсидиановый ключ':'При следующей автоматической смене погоды позволит выбрать один из двух случайных вариантов',
  'Сердце бездны':'Вручную поглотит две выбранные рыбы и создаст из них одну новую'
});
const RIFT_RELIC_ACTIVE_HINTS=Object.freeze({
  'Фантомный осколок':'автоматически вернёт похищенную рыбу',
  'Ядро DF1':'покажет результат следующего заброса',
  'Кристалл расслоения':'раскроет второй результат улова',
  'Осколок сингулярности':'превратит выбранную рыбу в гиганта',
  'Око скрытой бездны':'защитит от следующего негативного события',
  'Печать Левиафана':'усилит выбранного тяжеловеса',
  'Обсидиановый ключ':'даст выбор при автоматической смене погоды',
  'Сердце бездны':'поглотит 2 выбранные рыбы → создаст 1 новую'
});
const RIFT_FISH_ICON_FILES=Object.freeze({
  'астральный скат':'astral-stingray.webp',
  'призрачный целакант':'ghost-coelacanth.webp',
  'кристальный удильщик':'crystal-anglerfish.webp',
  'обсидиановый парусник':'obsidian-sailfish.webp',
  'багровый латимер':'crimson-latimer.webp',
  'сингулярный тунец':'singular-tuna.webp',
  'эфирный змееголов':'ethereal-snakehead.webp',
  'глубинная химера':'deep-sea-chimera.webp',
  'хроноскат':'chrono-stingray.webp',
  'звёздная манта':'star-manta.webp',
  'лазурный драконец':'azure-dragonet.webp',
  'эфирный марлин':'ethereal-marlin.webp',
  'лунный парусник':'lunar-sailfish.webp',
  'штормовой целакант':'storm-coelacanth.webp',
  'кварцевый осётр':'quartz-sturgeon.webp',
  'теневой арапайма':'shadow-arapaima.webp',
  'левиафанов вестник':'leviathan-herald.webp',
  'коронованный мегалодон':'crowned-megalodon.webp',
  'первозданная латимерия':'primordial-coelacanth.webp',
  'страж сингулярности':'singularity-guardian.webp',
  'багровый исполин':'crimson-colossus.webp',
  'владыка обсидиановых врат':'obsidian-gates-lord.webp',
  'фантомный кит':'phantom-whale.webp',
  'сердце древнего океана':'ancient-ocean-heart.webp'
});
function fishCategoryIcon(file,label,extraClass=''){
  return `<img class="fish-category-icon${extraClass?` ${extraClass}`:''}" src="${FISH_CATEGORY_ICON_PATH}${file}.webp" width="256" height="256" alt="" aria-hidden="true" title="${label}" decoding="async">`;
}
function riftFishIcon(fish,extraClass=''){
  const file=RIFT_FISH_ICON_FILES[String(fish?.name||'').toLowerCase()];
  if(!file)return '';
  const label=capitalize(fish.name);
  return `<img class="rift-fish-icon${extraClass?` ${extraClass}`:''}" src="${RIFT_FISH_ICON_PATH}${file}" alt="" aria-hidden="true" title="${label}" decoding="async">`;
}
function riftRelicIcon(name,extraClass=''){
  const file=RIFT_RELIC_ICON_FILES[name];
  if(!file)return '';
  return `<img class="rift-relic-icon${extraClass?` ${extraClass}`:''}" src="${RIFT_RELIC_ICON_PATH}${file}" alt="" aria-hidden="true" title="${name}" decoding="async">`;
}
function riftTemporaryEffectIconMarkup(effect,extraClass=''){
  const name=String(effect?.name||'');
  if(name.startsWith('Калибровка DF1'))return `<img class="rift-relic-icon${extraClass?` ${extraClass}`:''}" src="${RIFT_RELIC_ICON_PATH}df1-core.webp" alt="" aria-hidden="true" title="Калибровка DF1" decoding="async">`;
  if(name.startsWith('Багровый осколок'))return riftRelicIcon('Сердце бездны',extraClass);
  return fishCategoryIcon('rift','Эффект разлома',extraClass);
}
function fishStatusIcon(file,label,extraClass=''){
  return `<img class="fish-status-icon${extraClass?` ${extraClass}`:''}" src="${FISH_STATUS_ICON_PATH}${file}.webp" alt="" aria-hidden="true" title="${label}" decoding="async">`;
}
function fishEffectBadge(file,label,extraClass=''){
  return `<span class="fish-effect-badge${extraClass?` ${extraClass}`:''}" title="${label}" aria-label="${label}"><img src="${FISH_STATUS_ICON_PATH}${file}.webp" alt="" aria-hidden="true" decoding="async"></span>`;
}
function unstablePresenceVisualText(value){
  return String(value??'').replace(
    /[«"]?Нестабильн(?:ое|ого)\s+присутстви(?:е|я)[»"]?/gi,
    fishEffectBadge('unstable-presence','Нестабильное присутствие')
  );
}
function fishHistoryStatus(h,fish){
  if(!fish)return null;
  if(fish.islandSkeleton||fish.mythicSkeleton||fish.abyssSkeleton||fish.ballistierSkeleton)return {file:'skeleton',label:'Рыба превратилась в скелет',kind:'skeleton'};
  if(fish.dungeonSacrifice)return {file:'dungeon-sacrifice',label:'Рыба принесена в жертву пираньям',kind:'sacrifice'};
  if(h.riftSacrificeLabel||fish.riftSacrificeLabel)return {file:'rift-sacrifice',label:'Рыба принесена в жертву Разлому',kind:'sacrifice'};
  if(h.eaten||fishIsEaten(fish))return {file:'eaten',label:'Рыба съедена',kind:'eaten'};
  if(h.arcade||fish.arcadeCatch||fish.source==='Аркадный улов')return {file:'arcade-catch',label:'Аркадная рыба',kind:'arcade'};
  const fishSource=h.fishSource||fish.source;
  if(fishSource==='Заброс'||fishSource==='Бездонный ларь')return {file:'cast-catch',label:fishSource==='Бездонный ларь'?'Рыба из Бездонного ларя':'Рыба обычного заброса',kind:'cast'};
  return null;
}
function fishInlineStatusIcon(h,fish){
  const status=fishHistoryStatus(h,fish);if(!status)return '';
  if(status.kind==='skeleton'||status.kind==='eaten')return '';
  if((status.kind==='cast'||status.kind==='arcade')&&(fish.category==='heavy'||fish.category==='giant'))return '';
  return `<span class="fish-inline-status status-${status.kind}" title="${status.label}" aria-label="${status.label}">${fishStatusIcon(status.file,status.label)}</span>`;
}
function fishSkeletonMainIcon(fish){
  if(!fish?.islandSkeleton&&!fish?.mythicSkeleton&&!fish?.abyssSkeleton&&!fish?.ballistierSkeleton)return '';
  const label='Рыба превратилась в скелет';
  return `<span class="fish-skeleton-main-icon" title="${label}" aria-label="${label}">${fishStatusIcon('skeleton',label)}</span>`;
}
function fishEatenMainIcon(h,fish){
  if(!fish||h?.riftSacrificeLabel||fish.riftSacrificeLabel||fish.islandSkeleton||fish.mythicSkeleton||fish.abyssSkeleton)return '';
  const eatenByPredator=/Съедена Хищником/i.test(String(fish.abyssLost||h?.abyssLost||''));
  const eatenByOrca=!fish.abyssLost&&(Boolean(h?.eaten)||fishIsEaten(fish));
  if(!eatenByPredator&&!eatenByOrca)return '';
  const label=eatenByPredator?'Рыба съедена Хищником':'Рыба съедена Касаткой';
  return `<span class="fish-eaten-main-icon" title="${label}" aria-label="${label}">${fishStatusIcon('eaten',label)}</span>`;
}
function fishDungeonSacrificeMainIcon(fish){
  if(!fish?.dungeonSacrifice)return '';
  const label='Принесена в жертву магматическим пираньям';
  return `<span class="fish-eaten-main-icon dungeon-sacrifice-main-icon" title="${label}" aria-label="${label}">${fishStatusIcon('dungeon-sacrifice',label)}</span>`;
}
function fishSizeMarker(fish){
  if(!fish||fish.category!=='heavy'&&fish.category!=='giant')return '';
  const file=fish.category==='giant'?'giant':'heavyweight',label=fish.category==='giant'?'Рыба-гигант':'Тяжеловес';
  return `<span class="fish-size-marker" title="${label}" aria-label="${label}">${fishStatusIcon(file,label)}</span>`;
}
function fishCategoryIcons(fish,extraClass='',includeOrigin=true){
  if(!fish)return fishCategoryIcon('normal','Обычная рыба',extraClass);
  if(fish.islandColossus||fish.islandMoray||fish.islandGraniteCatfish||fish.islandEchoRay){
    const tiers={
      common:['island-common','Островная рыба'],
      rare:['island-ancient','Древняя островная рыба'],
      exceptional:['island-primordial','Первородная островная рыба']
    };
    const [tierFile,tierLabel]=tiers[fish.rarity]||tiers.common;
    return `<span class="fish-category-icons">${fishCategoryIcon('island','Островная рыба',extraClass)}${fishCategoryIcon(tierFile,tierLabel,extraClass)}</span>`;
  }
  if(isRiftFish(fish)){
    const categories={normal:'Обычная рыба',heavy:'Тяжеловес',giant:'Рыба-гигант',rare:'Редкая рыба',epic:'Эпическая рыба',legendary:'Легендарная рыба'};
    const category=categories[fish.rarity]?fish.rarity:categories[fish.category]?fish.category:'normal';
    return `<span class="fish-category-icons">${includeOrigin?fishCategoryIcon('rift','Рыба Разлома',extraClass):''}${fishCategoryIcon(category,categories[category],extraClass)}</span>`;
  }
  const categories={normal:'Обычная рыба',heavy:'Тяжеловес',giant:'Рыба-гигант'};
  const category=categories[fish.category]?fish.category:'normal';
  return `<span class="fish-category-icons">${fishCategoryIcon(category,categories[category],extraClass)}</span>`;
}
function islandFishBadges(fish,extraClass=''){
  if(!islandFishKind(fish))return '';
  const tiers={
    common:['island-common','Обычная островная рыба'],
    rare:['island-ancient','Древняя островная рыба'],
    exceptional:['island-primordial','Первородная островная рыба']
  };
  const [tierFile,tierLabel]=tiers[fish.rarity]||tiers.common;
  return `<span class="island-fish-badges fish-category-icons">${fishCategoryIcon(tierFile,tierLabel,extraClass)}</span>`;
}
function riftFishBadges(fish,extraClass='',includeOrigin=true){
  if(!isRiftFish(fish)||!RIFT_FISH_ICON_FILES[String(fish?.name||'').toLowerCase()])return '';
  const categories={normal:'Обычная рыба',heavy:'Тяжеловес',giant:'Рыба-гигант',rare:'Редкая рыба',epic:'Эпическая рыба',legendary:'Легендарная рыба'};
  const category=categories[fish.rarity]?fish.rarity:categories[fish.category]?fish.category:'normal';
  return `<span class="rift-fish-badges fish-category-icons">${includeOrigin?fishCategoryIcon('rift','Рыба Разлома',extraClass):''}${fishCategoryIcon(category,categories[category],extraClass)}</span>`;
}
function riftLootCategoryIcons(item){
  const rarity=['rare','epic','legendary'].includes(item?.rarity)?item.rarity:item?.rarity==='giant'?'giant':item?.rarity==='heavy'?'heavy':'normal';
  const labels={normal:'Обычная рыба',heavy:'Тяжеловес',giant:'Рыба-гигант',rare:'Редкая рыба',epic:'Эпическая рыба',legendary:'Легендарная рыба'};
  return `<span class="fish-category-icons">${fishCategoryIcon(rarity,labels[rarity])}</span>`;
}
function fishRarityBadge(rarity){const labels={rare:'РЕДКАЯ',epic:'ЭПИЧЕСКАЯ',legendary:'ЛЕГЕНДАРНАЯ'};return labels[rarity]?`<span class="fish-rarity rarity-${rarity}">${labels[rarity]}</span> `:'';}
function fishDisplayedWeight(fish){return Number.isFinite(fish?.finalWeight)?fish.finalWeight:fish?.weight;}
function fishFinalWeightSuffix(fish,baseWeight){const finalWeight=fishDisplayedWeight(fish);if(!Number.isFinite(finalWeight)||!Number.isFinite(baseWeight)||Math.abs(finalWeight-baseWeight)<.05)return '';const direction=finalWeight<baseWeight?' is-negative':' is-positive';return ` <span class="fish-final-equals${direction}">→</span> <span class="fish-final-weight${direction}">${kg(finalWeight)}</span>`;}
function fishDisplayName(fish){
  const name=capitalize(fish.name);
  return isRiftFish(fish)&&Boolean(RIFT_FISH_ICON_FILES[String(fish.name||'').toLowerCase()])
    ? `<span class="rift-fish-gradient-name">${name}</span>`
    : name;
}
function fishTitleText(fish) {
  if(fish.ballistierEscaped)return `${capitalize(fish.name)} — <span class="dungeon-escaped-label">сорвалась</span>`;
  if(fish.islandSkeleton){const before=Number.isFinite(fish.islandOriginalWeight)?fish.islandOriginalWeight:.1;return `Рыбный скелет (${capitalize(fish.skeletonOf)}) — <span class="island-weight-before">${kg(before)}</span> <span class="island-weight-arrow">→</span> <span class="island-weight-final">${kg(0)}</span> <span class="island-weight-difference">(−${kg(before)})</span>`;}
  if(fish.mythicSkeleton)return `Рыбный скелет (${capitalize(fish.skeletonOf)})`;
  if(fish.islandColossus)return `${capitalize(fish.name)} — ${kg(fish.weight)}`;
  if(fish.islandMoray){const before=fish.morayOriginalWeight,finalSuffix=fishFinalWeightSuffix(fish,fish.weight);if(Number.isFinite(before)&&before!==fish.weight)return `${capitalize(fish.name)} — <span class="island-weight-before">${kg(before)}</span> <span class="island-weight-arrow">→</span> <span class="island-weight-final">${kg(fish.weight)}</span> <span class="island-weight-difference">(−${kg(round1(before-fish.weight))})</span>${finalSuffix}`;return `${capitalize(fish.name)} — ${kg(fish.weight)}${finalSuffix}`;}
  if(fish.islandGraniteCatfish){const before=fish.graniteOriginalWeight,saved=` <span class="granite-saved-casts">• сохранено забросов: ${fish.graniteSavedCasts||0}</span>`,finalSuffix=fishFinalWeightSuffix(fish,fish.weight);if(Number.isFinite(before)&&before!==fish.weight)return `${capitalize(fish.name)} — <span class="island-weight-before">${kg(before)}</span> <span class="island-weight-arrow">→</span> <span class="island-weight-final">${kg(fish.weight)}</span>${finalSuffix}${saved}`;return `${capitalize(fish.name)} — ${kg(fish.weight)}${finalSuffix}${saved}`;}
  if(fish.islandEchoRay){const counter=` <span class="granite-saved-casts">• эхо-уловов: ${fish.echoCatches||0}</span>`;return `${capitalize(fish.name)} — ${kg(fish.weight)}${counter}`;}
  if(fish.islandDistorted){const before=Number.isFinite(fish.islandOriginalWeight)?fish.islandOriginalWeight:fish.originalWeight,distorted=Number.isFinite(fish.islandDistortedWeight)?fish.islandDistortedWeight:fish.originalWeight,difference=round1(distorted-before),differenceText=difference>0?`+${kg(difference)}`:difference<0?`−${kg(Math.abs(difference))}`:kg(0);return `${fishRarityBadge(fish.rarity)}${capitalize(fish.name)} — <span class="island-weight-before">${kg(before)}</span> <span class="island-weight-arrow">→</span> <span class="island-weight-final">${kg(distorted)}</span> <span class="island-weight-difference">(${differenceText})</span>${fishFinalWeightSuffix(fish,distorted)}`;}
  const rarityLabel=isRiftFish(fish)?'':fishRarityBadge(fish.rarity);
  const essenceApplied=Array.isArray(fish?.essenceImpacts) && fish.essenceImpacts.length>0;
  const hasCoinBoost=Array.isArray(fish?.coinImpacts) && fish.coinImpacts.length>0;
  const hasLuminarBoost=Array.isArray(fish?.luminarImpacts) && fish.luminarImpacts.length>0;
  const hasRiftBoost=Boolean((Array.isArray(fish?.riftEffectImpacts)&&fish.riftEffectImpacts.length)||fish?.riftEffectImpact);
  const hasAbyssImpact=Array.isArray(fish?.abyssImpacts)&&fish.abyssImpacts.length>0;
  const hasPositiveBoost=Boolean(fish?.flipperImpact || fish?.maskImpact || fish?.scubaImpact || fish?.diceImpact || fish?.leviathanImpact || fish?.goldenHourImpact || fish?.singularityImpact || fish?.megalodonImpact || (fish?.sparkImpacts||[]).length || (fish?.threadImpacts||[]).length || essenceApplied || hasCoinBoost || hasLuminarBoost || hasRiftBoost || hasAbyssImpact);
  const normalBase=Number.isFinite(fish.originalWeight) ? fish.originalWeight : fish.weight;
  const caughtWeight=fish.debuffLimited&&Number.isFinite(fish.preDebuffWeight) ? fish.preDebuffWeight : normalBase;
  const hasChangedWeight=hasPositiveBoost && Math.abs(fish.weight-caughtWeight)>=0.05;
  const finalDirection=fish.weight<caughtWeight?' is-negative':fish.weight>caughtWeight?' is-positive':'';
  const displayWeight=fishDisplayedWeight(fish),displayChanged=Math.abs(displayWeight-caughtWeight)>=.05;
  const finalResult=(hasChangedWeight||displayChanged)
    ? ` <span class="fish-final-equals${displayWeight<caughtWeight?' is-negative':displayWeight>caughtWeight?' is-positive':''}">→</span> <span class="fish-final-weight${displayWeight<caughtWeight?' is-negative':displayWeight>caughtWeight?' is-positive':''}">${kg(displayWeight)}</span>`
    : '';
  return `${rarityLabel}${fishDisplayName(fish)} — ${kg(caughtWeight)}${finalResult}`;
}

function renderAbyssFishImpacts(fish){
  const impacts=Array.isArray(fish?.abyssImpacts)?fish.abyssImpacts:[];
  if(!impacts.length)return '';
  const categories={normal:'обычная рыба',heavy:'тяжеловес',giant:'гигант'};
  return impacts.map(impact=>{
    const kind=abyssalPersonalityKey(impact.source)||'unknown';
    const icon=abyssalIconMarkup(kind,'is-impact-icon');
    const ranks={normal:1,heavy:2,giant:3};
    const positive=impact.type==='category'?(ranks[impact.afterCategory]||0)>(ranks[impact.beforeCategory]||0):impact.after>=impact.before;
    const direction=positive?'positive':'negative';
    const category=impact.type==='category'?`<span class="abyss-impact-category">${categories[impact.beforeCategory]||impact.beforeCategory} → ${categories[impact.afterCategory]||impact.afterCategory}</span>`:'';
    const parasitePercent=kind==='parasite'&&impact.type!=='category'&&impact.before>0
      ?` <span class="abyss-impact-percent">(−${Math.round((1-impact.after/impact.before)*100)}%)</span>`
      :'';
    return `<div class="gear-impact abyss-fish-impact abyss-impact-${kind} abyss-impact-${direction}"><span class="gear-icon">${icon}</span><span><strong>${impact.source}${parasitePercent}</strong>${category}<small>${kg(impact.before)} <span class="abyss-impact-arrow">→</span> <b class="gear-result">${kg(impact.after)}</b></small></span></div>`;
  }).join('');
}

function renderEssenceImpact(fish) {
  const impacts=Array.isArray(fish?.essenceImpacts) && fish.essenceImpacts.length ? fish.essenceImpacts : (fish?.essence ? [fish.essence] : []);
  if (!impacts.length) return '';
  return impacts.map(e=>`<div class="essence-impact">${artifactIconMarkup('Эссенция «Великан Океанов»','epic','essence-icon')}<span class="essence-impact-copy"><strong>Эссенция «Великан Океанов»</strong><span class="essence-impact-calculation">${kg(e.before)} → ${kg(e.after)} (×${e.factor})</span></span></div>`).join('');
}

function renderRiftEffectImpact(fish) {
  const impacts=Array.isArray(fish?.riftEffectImpacts)&&fish.riftEffectImpacts.length?fish.riftEffectImpacts:(fish?.riftEffectImpact?[fish.riftEffectImpact]:[]);
  return impacts.map(impact=>{
    const percent=Math.round(((impact.value||impact.after/impact.before)-1)*100);
    const name=String(impact.name||'Усиление Разлома').split(':')[0];
    return `<div class="gear-impact rift-effect-impact">${riftTemporaryEffectIconMarkup(impact,'gear-icon')}<span><strong>${name}</strong> <span class="gear-arrow">→</span> <span class="gear-target">${capitalize(fish.name)}</span><small>${kg(impact.before)} <b class="rift-percent">(+${percent}%)</b> = <b class="gear-result">${kg(impact.after)}</b></small></span></div>`;
  }).join('');
}
function renderIslandDangerImpact(fish){const impact=fish?.dangerImpact;if(!impact)return '';return `<div class="gear-impact island-danger-impact"><span class="gear-icon">${weatherWarningIconMarkup('is-compact-icon')}</span><span><strong>${impact.title}</strong><small>${kg(impact.before)} <span class="island-weight-arrow">→</span> <b class="island-weight-final">${kg(impact.after)}</b> (−${impact.percent}%)</small></span></div>`;}
function renderFirstWaterImpact(fish){const x=fish?.firstWaterImpact;if(!x)return '';return `<div class="gear-impact first-water-impact">${tradeItemIconMarkup('firstWaterFlask','gear-icon')}<span><strong>Флакон Первой Воды</strong><small>Искажение ${kg(x.distorted)} → восстановлено 50% потери → <b class="gear-result">${kg(x.after)}</b></small></span></div>`;}
function renderMoonShellImpact(fish){const restore=fish?.moonShellRestoreImpact,x=fish?.moonShellImpact;if(!restore&&!x)return '';const icon=tradeItemIconMarkup('moonTideShell','gear-icon');return `${restore?`<div class="gear-impact moon-shell-impact">${icon}<span><strong>Снято «Нестабильное присутствие»</strong><small>${kg(restore.before)} → <b class="gear-result">${kg(restore.after)}</b> • защита до конца сессии</small></span></div>`:''}${x?`<div class="gear-impact moon-shell-impact">${icon}<span><strong>Раковина лунного прилива ×2</strong><small>${kg(x.before)} ×2 = <b class="gear-result">${kg(x.after)}</b></small></span></div>`:''}`;}

function renderSingularityImpact(fish) {
  const impact=fish?.singularityImpact;if(!impact)return '';
  return `<div class="gear-impact singularity-impact"><span class="gear-icon">${riftRelicIcon('Осколок сингулярности','is-compact-icon')}</span><span><strong>Осколок сингулярности</strong><small>${kg(impact.before)} → <b class="gear-result">${kg(impact.after)}</b><br>Преобразована в гиганта</small></span></div>`;
}

function renderMegalodonImpact(fish) {
  const impact=fish?.megalodonImpact;if(!impact)return '';
  return `<div class="gear-impact megalodon-impact"><span class="gear-icon">${artifactIconMarkup('Плавник мегалодона','legendary','is-compact-icon')}</span><span><strong>Плавник мегалодона</strong><small>Ограниченный вес: ${kg(impact.before)} → <b class="gear-result">${kg(impact.after)}</b><br>Предыдущие усиления восстановлены</small></span></div>`;
}

function renderFinalOrcaImpact(fish) {
  const impact=fish?.finalOrcaImpact;if(!impact)return '';
  const icon=debuffIconMarkup('Касатка','is-compact-icon');
  if(impact.islandResistance)return `<div class="gear-impact final-orca-impact is-protected"><span class="gear-icon">${icon}</span><span><strong>Исполин отбился от Касатки</strong><small>Проверка съедения 50% не удалась; другая рыба не затронута</small></span></div>`;
  if(impact.protected)return `<div class="gear-impact final-orca-impact is-protected"><span class="gear-icon">${icon}</span><span><strong>Фантомный осколок защитил от Касатки</strong><small>Вес после финальных усилений: ${kg(impact.weight)}<br>Рыба включена в итоговый вес</small></span></div>`;
  return `<div class="gear-impact final-orca-impact is-eaten"><span class="gear-icon">${icon}</span><span><strong>Съедена Касаткой</strong><small>Вес перед съедением: ${kg(impact.weight)}<br>В итоговый вес не включена</small></span></div>`;
}

function renderDiceImpact(fish) {
  const impact=fish?.diceImpact;if(!impact)return '';
  const count=Math.max(1,Math.round(Math.log(impact.factor)/Math.log(5)));
  const title=count>1?`Гексаэдры пятой грани ×${count}`:'Гексаэдр пятой грани';
  return `<div class="gear-impact dice-impact"><span class="gear-icon">${artifactIconMarkup('Гексаэдр пятой грани','legendary','is-compact-icon')}</span><span><strong>${title}</strong><small>${kg(impact.before)} ×${impact.factor} = <b class="gear-result">${kg(impact.after)}</b><br>Финальный множитель</small></span></div>`;
}

function renderScubaImpact(fish) {
  if (!fish?.scubaImpact) return '';
  const impact=fish.scubaImpact;
  const gear=bonusIconMarkup('Акваланг','is-compact-icon');
  const nautilus=impact.nautilus?' <span class="scuba-nautilus">🛳️ усиление Штурвала</span>':'';
  const eaten=impact.eatenAfterBoost?'<span class="scuba-eaten">💀 После усиления съедена Касаткой и не вошла в итоговый вес</span>':'';
  return `<div class="scuba-impact${impact.eatenAfterBoost?' is-eaten':''}"><span class="scuba-icon">${gear}</span><span><strong>Акваланг${impact.count>1?'и':''} ×${impact.factor}</strong>${nautilus}: ${kg(impact.before)} → <b class="gear-result">${kg(impact.after)}</b><small>Самая тяжёлая оставшаяся рыба</small>${eaten}</span></div>`;
}

function renderScubaBonusStatus(row) {
  if (row.type!=='bonus' || row.text!=='Акваланг') return '';
  const bonus=state.bonuses.find(item=>item.id===row.bonusId);
  const disabled=bonus && state.disabledBonusIds.has(bonus.id);
  if (disabled) return '<div class="scuba-bonus-status is-disabled"><strong>Бонус отключён и не участвует в финальном расчёте</strong></div>';
  if (row.scubaApplication) {
    const a=row.scubaApplication;
    return `<div class="scuba-bonus-status applied"><strong>${a.nautilus?'🛳️ + ':''}Акваланг ${a.index} из ${a.count}</strong><span>Цель: ${capitalize(a.targetName)}</span><span>Общий множитель: ×${a.factor}</span><span>${kg(a.before)} → ${kg(a.after)}</span></div>`;
  }
  const activeCount=activeBonuses('Акваланг').length;
  const scubaList=activeBonuses('Акваланг');
  const factor=(scubaList.length?scubaList.reduce((sum,b)=>sum+(b.abyssEnhanced?4:3),0):3)*(state.nautilus?2:1);
  return `<div class="scuba-bonus-status pending"><strong>${state.nautilus?'🛳️ Штурвал усилил Акваланг':'Ожидает финального расчёта'} <span class="scuba-pending-summary">• Активных Аквалангов: ${activeCount||1} • общий множитель ×${factor}</span></strong></div>`;
}


function renderMaskImpact(fish) {
  if (!fish?.maskImpact) return '';
  const impact=fish.maskImpact;
  const gear=bonusIconMarkup('Подводная маска','is-compact-icon');
  const nautilus=impact.nautilus?' <span class="gear-nautilus">🛳️ усиление Штурвала</span>':'';
  return `<div class="gear-impact mask-impact"><span class="gear-icon">${gear}</span><span><strong>Подводная маска${impact.count>1?'и':''} ×${impact.factor}</strong>${nautilus}: ${kg(impact.before)} → <b class="gear-result">${kg(impact.after)}</b><small>Финальное усиление оставшейся рыбы</small></span></div>`;
}

function renderFlipperImpact(fish) {
  if (!fish?.flipperImpact) return '';
  const impact=fish.flipperImpact;
  const gear=bonusIconMarkup('Ласты','is-compact-icon');
  const nautilus=impact.nautilus?' <span class="gear-nautilus">🛳️ усиление Штурвала</span>':'';
  const cancelled=impact.cancelledByOctopus;
  const excludedByFishLoss=fishIsEaten(fish)||Boolean(fish.abyssLost)||Boolean(fish.riftSacrificeLabel);
  const cancelledNote=cancelled?'<small class="flipper-cancelled-note">Этот вес не входит в итоговый расчёт <span class="flipper-cancelled-source">(Осьминог)</span></small>':'';
  const storedFactors=Array.isArray(impact.bonusFactors)?impact.bonusFactors.map(item=>item.factor):[];
  const legacyFactor=impact.count>1?Number(Math.pow(impact.factor,1/impact.count).toFixed(3)):impact.factor;
  const individualFactors=storedFactors.length?storedFactors:Array.from({length:Math.max(1,impact.count||1)},()=>legacyFactor);
  const factorBreakdown=individualFactors.length>1
    ?`${individualFactors.map(value=>`Ласты ×${value}`).join(' · ')} <span class="flipper-total-factor">= общий ×${impact.factor}</span>`
    :`Ласты ×${individualFactors[0]}`;
  return `<div class="gear-impact flipper-impact${cancelled?' is-cancelled':''}${excludedByFishLoss?' is-excluded-by-fish-loss':''}"><span class="gear-icon">${gear}</span><span><strong>${factorBreakdown}</strong>${nautilus} <span class="gear-arrow">→</span> <span class="gear-target">${capitalize(fish.name)}</span><small>${kg(impact.before)} × ${impact.factor} = <b class="gear-result">${kg(impact.after)}</b> • каждая вторая подходящая рыба</small>${cancelledNote}</span></div>`;
}

function renderSparkChaosImpact(fish) {
  const impacts=Array.isArray(fish?.sparkImpacts)?fish.sparkImpacts:[];
  if(!impacts.length)return '';
  return impacts.map((impact,index)=>{
    const lost=round1(impact.before-impact.after);
    const result=fish.mythicSkeleton&&index===impacts.length-1?'<b class="spark-skeleton-result">рыбный скелет</b>':`<b class="spark-weight-after">${kg(impact.after)}</b>`;
    return `<div class="gear-impact spark-chaos-impact"><span class="gear-icon">${artifactIconMarkup('Искра Хаоса','mythic','is-compact-icon')}</span><span><strong>Искра Хаоса</strong> <span class="gear-arrow">→</span> <span class="gear-target">${fish.mythicSkeleton?capitalize(fish.skeletonOf):capitalize(fish.name)}</span><small><span class="spark-weight-before">${kg(impact.before)}</span> <span class="spark-weight-arrow">→</span> ${result} <span class="spark-weight-loss">(−${lost.toLocaleString('ru-RU',{maximumFractionDigits:1})} кг)</span></small></span></div>`;
  }).join('');
}

function renderSiphonophoreImpact(fish,timing='trash'){
  const impacts=(Array.isArray(fish?.threadImpacts)?fish.threadImpacts:[]).filter(impact=>(impact.timing||'trash')===timing);
  return impacts.map(impact=>{const trash=state.trash.find(x=>x.id===impact.trashId),trashName=trash?capitalize(trash.name):'Хлам',step=Math.max(1,Math.round(impact.plus/10));return `<div class="gear-impact siphonophore-impact"><span class="gear-icon">${artifactIconMarkup('Нить Сифонофоры','mythic','is-compact-icon')}</span><span><strong>Нить Сифонофоры преобразовала хлам</strong><small>${step}-й хлам: ${trashName} → <b class="gear-result">+${impact.plus} кг</b> к рыбе «${capitalize(fish.name)}»<br>${kg(impact.before)} + ${impact.plus} кг = <b class="gear-result">${kg(impact.after)}</b></small></span></div>`;}).join('');
}

function renderGoldenHourImpact(fish,animate=false) {
  if (!fish?.goldenHourImpact) return '';
  const impact=fish.goldenHourImpact;
  return `<div class="gear-impact golden-hour-impact"><span class="gear-icon">${weatherIconMarkup('golden','is-compact-icon')}</span><span><strong>Золотой час <span class="gold-add${animate?' is-catch-animated':''}">+${impact.plus} кг</span></strong> <span class="gear-arrow">→</span> <span class="gear-target">${capitalize(fish.name)}</span><small>${kg(impact.before)} + ${impact.plus} кг = <b class="gear-result">${kg(impact.after)}</b></small></span></div>`;
}

function renderLeviathanImpact(fish) {
  if (!fish?.leviathanImpact) return '';
  const impact=fish.leviathanImpact;
  return `<div class="gear-impact leviathan-impact"><span class="gear-icon">${artifactIconMarkup('Чешуя Левиафана','epic','is-compact-icon')}</span><span><strong>Чешуя Левиафана +${impact.plus} кг</strong> <span class="gear-arrow">→</span> <span class="gear-target">${capitalize(fish.name)}</span><small>${kg(impact.before)} + ${impact.plus} кг = <b class="gear-result">${kg(impact.after)}</b></small></span></div>`;
}

function renderCoinImpacts(fish) {
  const impacts=Array.isArray(fish?.coinImpacts)?fish.coinImpacts:[];
  if (!impacts.length) return '';
  return impacts.map(impact=>{
    const limited=fish.debuffLimited?'<small class="coin-limited-note">Дебаф ограничил фактический вес этой рыбы</small>':'';
    return `<div class="gear-impact coin-impact"><span class="gear-icon">${coinIconMarkup(impact.type,'coin-icon-small')}</span><span><strong>${impact.name} +${impact.add} кг</strong> <span class="gear-arrow">→</span> <span class="gear-target">${capitalize(fish.name)}</span><small>${kg(impact.before)} + ${impact.add} кг = <b class="gear-result">${kg(impact.after)}</b></small>${limited}</span></div>`;
  }).join('');
}
function renderLuminarImpacts(fish){
  const impacts=Array.isArray(fish?.luminarImpacts)?fish.luminarImpacts:[];if(!impacts.length)return '';
  const labels={normal:'обычная рыба',heavy:'тяжеловес',giant:'рыба-гигант'};
  return impacts.map((impact,index)=>{const changed=impact.beforeCategory!==impact.afterCategory;return `<div class="gear-impact luminar-impact"><span class="gear-icon">${artifactIconMarkup('Люминар Удильщика','mythic','is-compact-icon')}</span><span><strong>Люминар Удильщика${impacts.length>1?` ${index+1} из ${impacts.length}`:''}: +${impact.plus} кг</strong><small>${kg(impact.before)} + ${impact.plus} кг = <b class="gear-result">${kg(impact.after)}</b>${changed?`<br>Категория: ${labels[impact.beforeCategory]} → <b class="gear-result">${labels[impact.afterCategory]}</b>`:''}</small></span></div>`;}).join('');
}
function renderDebuffWeightImpact(fish){if(!fish?.debuffLimited||!Number.isFinite(fish.preDebuffWeight)||!Number.isFinite(fish.debuffBaseWeight))return '';const source=fish.debuffSource||'Дебаф';return `<div class="gear-impact fish-debuff-impact"><span class="fish-debuff-impact-copy"><strong>${source}:</strong><small>${kg(fish.preDebuffWeight)} → <b class="island-weight-final">${kg(fish.debuffBaseWeight)}</b></small></span><span class="fish-effect-badge-slot">${fishEffectBadge('weight-limit','Ограничение в весе')}</span></div>`;}
function renderMessageImpact(fish){const impact=fish?.messageImpact;if(!impact)return '';const icon=artifactIconMarkup('Послание в бутылке','epic','is-compact-icon');if(impact.blocked)return `<div class="gear-impact message-impact is-blocked"><span class="gear-icon">${icon}</span><span><strong>Послание не восстановило вес</strong><small><span class="island-negative-hint">Действует «Нестабильное присутствие»</span><br>Вес остался ${kg(impact.after)}</small></span></div>`;return `<div class="gear-impact message-impact"><span class="gear-icon">${icon}</span><span><strong>Послание в бутылке ×2</strong><small>${kg(impact.before)} ×2 = <b class="gear-result">${kg(impact.after)}</b></small></span></div>`;}
function renderCoinAction(row) {
  if (!row.coinId) return '';
  const coin=state.coins.find(item=>item.id===row.coinId);
  if (!coin) return '';
  const reservedForShip=coin.lastCastTradeEligible&&state.tradeShipArrived&&!coin.exchangedForTrade;
  const disabled=state.finished || coin.used || coin.expired || reservedForShip;
  const label=coin.used?(coin.success?'Использовано':'Не повезло'):(coin.expired?'Недоступно':'Бросить на удачу');
  const displayLabel=coin.exchangedForTrade?'Обменяна на 2 рыбы':reservedForShip?'Капитан готов к обмену':label;
  return `<button type="button" class="coin-luck-btn${disabled?' is-disabled':''}" data-coin-id="${coin.id}" ${disabled?'disabled':''}>${displayLabel}</button>`;
}

function renderGearBonusStatus(row) {
  if (row.type!=='bonus' || !['Подводная маска','Ласты'].includes(row.text)) return '';
  const bonus=state.bonuses.find(item=>item.id===row.bonusId);
  const disabled=bonus && state.disabledBonusIds.has(bonus.id);
  const ownFlipperFactor=row.text==='Ласты'&&bonus?(bonus.abyssEnhanced?3:2)*(state.nautilus?2:1):null;
  if (disabled) return `<div class="gear-bonus-status is-disabled">${row.text==='Ласты'?`Ласты ×${ownFlipperFactor} отключены и не участвуют в расчёте`:'Бонус отключён и не участвует в расчёте'}</div>`;
  if (row.text==='Подводная маска') {
    if (row.maskApplication) {
      const a=row.maskApplication;
      return `<div class="gear-bonus-status applied"><strong>${a.nautilus?'🛳️ + ':''}Маска ${a.index} из ${a.count}</strong><span>Общий множитель: ×${a.factor}</span><span>Усилено рыб: ${a.affectedCount}</span></div>`;
    }
    const maskList=activeBonuses('Подводная маска'),count=maskList.length;
    const factor=(maskList.length?maskList:[{abyssEnhanced:false}]).reduce((total,b)=>total*(b.abyssEnhanced?2:1.5)*(state.nautilus?2:1),1);
    return `<div class="gear-bonus-status pending"><strong>${state.nautilus?'🛳️ Штурвал усилил Маски':'Ожидает финального расчёта'}</strong><span>Активных Масок: ${count||1} • общий множитель ×${Number(factor.toFixed(3))}</span></div>`;
  }
  const impacts=state.fish.filter(f=>f.flipperImpact&&!f.flipperImpact.cancelledByOctopus&&(!Array.isArray(f.flipperImpact.bonusIds)||f.flipperImpact.bonusIds.includes(bonus?.id)));
  return `<div class="gear-bonus-status flipper-bonus-status ${impacts.length?'applied':'pending'}"><strong>Множитель этих Ласт: ×${ownFlipperFactor||2}</strong><span>${impacts.length?`Участий в расчётах: ${impacts.length}`:'Ожидают подходящую рыбу'}</span></div>`;
}

function renderTransmutation(row) {
  if (!row.transmutation || !Array.isArray(row.embeddedFishIds) || !row.embeddedFishIds.length) return '';
  const fish=state.fish.find(item=>item.id===row.embeddedFishIds[0]);
  if (!fish) return '';
  const eaten=fishIsEaten(fish)||Boolean(fish.abyssLost)||Boolean(fish.riftSacrificeLabel);
  const stolen=fishIsStolen(fish);
  const resultFishIcon=fishSizeMarker(fish)||`<span class="fish-inline-status status-cast" title="Полученная рыба" aria-label="Полученная рыба">${fishStatusIcon('cast-catch','Полученная рыба')}</span>`;
  const icon=fishSkeletonMainIcon(fish)||fishEatenMainIcon({eaten},fish)||`${fishCategoryIcons(fish,'is-embedded')}${resultFishIcon}`;
  const status=fish.riftSacrificeLabel||fish.abyssLost||(eaten?fishEffectBadge('eaten-by-orca','Съедена Касаткой'):stolen?fishEffectBadge('stolen','Украдена Чайкой'):'');
  const tags=fish.tags?.length?`<small class="transmutation-tags">${fish.tags.join(' • ')}</small>`:'';
  const impacts=`${renderMegalodonImpact(fish)}${renderSingularityImpact(fish)}${renderRiftEffectImpact(fish)}${renderAbyssFishImpacts(fish)}${renderEssenceImpact(fish)}${renderFlipperImpact(fish)}${renderMaskImpact(fish)}${renderScubaImpact(fish)}${renderDiceImpact(fish)}${renderFinalOrcaImpact(fish)}`;
  return `<div class="transmutation-chain">
    <div class="transmutation-summary${eaten?' is-eaten':''}${stolen?' is-stolen':''}">
      <span class="transmutation-trash-icon">${trashIconMarkup('is-compact-icon')}</span>
      <span class="transmutation-trash-name">${capitalize(row.transmutation.trashName)}</span>
      <span class="transmutation-arrow">→</span>
      <span class="transmutation-fish-icon">${icon}</span>
      <div class="transmutation-result-copy">
        <div class="transmutation-result-heading"><span class="transmutation-fish-name">${fishTitleText(fish)}</span>${status?`<span class="transmutation-status${fish.abyssLost?' abyss-negative-hint':''}">${status}</span>`:''}</div>${tags}
      </div>
    </div>
    ${impacts?`<div class="transmutation-effects">${impacts}</div>`:''}
  </div>`;
}

function findTrashHistoryRow(trash) {
  if (trash?.historyRowId) {
    const direct=state.history.find(row=>row.id===trash.historyRowId);
    if (direct) return direct;
  }
  return [...state.history].reverse().find(row=>row.type==='trash' && row.text===capitalize(trash.name) && !row.transmutation);
}

function transmuteTrash(trash, source='Глубоководное нечто') {
  let row=findTrashHistoryRow(trash);
  if (!row) row=addHistory(capitalize(trash.name),'trash','');
  trash.historyRowId=row.id;
  trash.converted=true;
  row.transmutation={trashName:trash.name,source};
  row.detail=`(Трансмутация хлама • ${source})`;
  const fish=makeFish('giant','Трансмутация хлама',false,{parentHistoryId:row.id});
  row.transmutation.fishId=fish.id;
  renderHistory();
  return fish;
}

function syncDeepThingConversionDetails() {
  const counter=`Превращено единиц хлама в гигантов: ${state.deepThingConvertedCount}`;
  state.history.forEach(row=>{
    if(row.type!=='legendary'||!['Глубоководное нечто','Штурвал Наутилуса'].includes(row.text))return;
    const detail=String(row.detail||'').trim();
    if(/Превращено единиц хлама в гигантов: \d+/.test(detail)){
      row.detail=detail.replace(/Превращено единиц хлама в гигантов: \d+/,counter);
    }else if(detail.startsWith('(')&&detail.endsWith(')')){
      row.detail=`${detail.slice(0,-1)}${detail.length>2?' • ':''}${counter})`;
    }else{
      row.detail=`(${[detail,counter].filter(Boolean).join(' • ')})`;
    }
  });
}

function renderNautilusSummon(row) {
  if(row?.type!=='legendary'||row.text!=='Штурвал Наутилуса')return '';
  return `<div class="nautilus-summon-chain">
    <span class="nautilus-summon-source">${artifactIconMarkup('Штурвал Наутилуса','legendary','is-summon-icon')}</span>
    <span class="nautilus-summon-arrow" aria-hidden="true">→</span>
    <span class="nautilus-summon-target">${artifactIconMarkup('Глубоководное нечто','legendary','is-summon-icon')}</span>
    <span class="nautilus-summon-copy"><strong>Призвано Глубоководное нечто</strong><small>Трансмутировано хлама: ${state.deepThingConvertedCount}</small></span>
  </div>`;
}

function renderEmbeddedFishList(row) {
  if (row.transmutation) return '';
  if (!Array.isArray(row.embeddedFishIds) || !row.embeddedFishIds.length) return '';
  const items=row.embeddedFishIds
    .map(id=>state.fish.find(fish=>fish.id===id))
    .filter(Boolean)
    .map(fish=>{
      const eaten=fishIsEaten(fish)||Boolean(fish.abyssLost)||Boolean(fish.riftSacrificeLabel);
      const stolen=fishIsStolen(fish);
      const displaced=Boolean(fish.islandDisplaced),traded=Boolean(fish.islandTraded),skeletonIcon=fishSkeletonMainIcon(fish),eatenIcon=fishEatenMainIcon({eaten,riftSacrificeLabel:fish.riftSacrificeLabel,abyssLost:fish.abyssLost},fish),keepAngusCategoryIcon=row.type==='angus'&&fishIsEaten(fish)&&!fish.abyssLost&&!fish.riftSacrificeLabel,icon=displaced?'<span class="island-displaced-cross">✖</span>':traded?shipIconMarkup(fish.tradeVessel==='recyclon'?'recyclon':'trade','is-embedded'):skeletonIcon||(!keepAngusCategoryIcon&&eatenIcon)||fishCategoryIcons(fish,'is-embedded',row.type!=='rift');
      const orcaEaten=fishIsEaten(fish)&&!fish.abyssLost&&!fish.riftSacrificeLabel;
      const status=traded?'обменяна вызванному торговому судну':fish.islandSkeleton?'':fish.abyssLost||(orcaEaten?fishEffectBadge('eaten-by-orca','Съедена Касаткой'):stolen?fishEffectBadge('stolen','Украдена Чайкой'):'');
      const riftImpactNames=new Set((fish.riftEffectImpacts||[]).map(impact=>String(impact.name||'').trim()).filter(Boolean));
      const visibleTags=(fish.tags||[]).filter(tag=>{
        const plainTag=String(tag).replace(/<[^>]*>/g,'').trim();
        return (!fish.goldenHourImpact||!String(tag).includes('class="gold-add"'))
          &&!(fish.islandColossus&&/Нестабильное присутствие/i.test(String(tag)))
          &&![...riftImpactNames].some(name=>plainTag===name||plainTag.startsWith(`${name}:`));
      }).map(compactIslandOriginText).map(unstablePresenceVisualText);
      const tags=visibleTags.length?`<small class="embedded-fish-tags">${visibleTags.join(' • ')}</small>`:'';
      const colossusClass=fish.islandColossus?` is-island-colossus tier-${fish.rarity||'common'}${row.id===lastAnimatedHistoryId?' is-new-colossus':''}`:fish.islandMoray?` is-island-moray tier-${fish.rarity||'common'}`:fish.islandGraniteCatfish?` is-island-granite-catfish tier-${fish.rarity||'common'}`:'';
       const riftIcon=skeletonIcon||(!keepAngusCategoryIcon&&eatenIcon)?'':riftFishIcon(fish)||islandFishIconMarkup(fish),riftBadges=riftFishBadges(fish,'',row.type!=='rift')||(riftIcon&&islandFishKind(fish)?islandFishBadges(fish):'');
       const abyssOutcome=fish.abyssLost?`<small class="embedded-fish-outcome abyss-negative-hint">(${fish.abyssLost})</small>`:'';
       const sacrificeOutcome=fish.riftSacrificeLabel?`<small class="embedded-fish-outcome rift-sacrifice-inline-hint">(${fish.riftSacrificeLabel})</small>`:'';
       const displacedOutcome=displaced?`<small class="embedded-fish-outcome island-displaced-effect-hint">(Вытеснена эффектом ${fishEffectBadge('unstable-presence','Нестабильное присутствие')})</small>`:'';
       const sideStatus=fish.abyssLost||displaced?'':status;
       const islandColossusStatus=fish.islandColossus
         ? `<span class="island-colossus-side-badges"><span class="island-row-origin">${fishCategoryIcon('island','Островная','is-island-row')}</span>${orcaEaten?fishEffectBadge('eaten-by-orca','Съедена Касаткой'):fishEffectBadge('unstable-presence','Нестабильное присутствие')}</span>`
         : sideStatus;
       const inlineAngusStatus=row.type==='angus'&&sideStatus?`<span class="embedded-fish-inline-status">${sideStatus}</span>`:'';
       const inlineTags=islandFishKind(fish)?tags:'',trailingTags=islandFishKind(fish)?'':tags;
       return `<li class="embedded-fish-item${eaten?' is-eaten':''}${stolen?' is-stolen':''}${displaced?' is-island-displaced':''}${traded?' is-island-traded':''}${fish.abyssLost||fish.riftSacrificeLabel?' has-abyss-outcome':''}${colossusClass}${riftIcon?' has-rift-fish-icon':''}"><div class="embedded-fish-main"><span class="embedded-fish-icon">${riftIcon||icon}</span><span class="embedded-fish-name">${riftIcon?'':riftBadges}<span class="embedded-fish-title">${fishTitleText(fish)}</span>${fishSizeMarker(fish)}${fishInlineStatusIcon({eaten,stolen,riftSacrificeLabel:fish.riftSacrificeLabel,arcade:Boolean(fish.arcadeCatch),fishSource:fish.source},fish)}${inlineAngusStatus}${abyssOutcome}${sacrificeOutcome}${displacedOutcome}${inlineTags}</span>${row.type!=='angus'&&islandColossusStatus?`<span class="embedded-fish-status">${islandColossusStatus}</span>`:''}</div>${trailingTags}${renderIslandDangerImpact(fish)}${renderMegalodonImpact(fish)}${renderSingularityImpact(fish)}${renderRiftEffectImpact(fish)}${renderAbyssFishImpacts(fish)}${renderEssenceImpact(fish)}${renderGoldenHourImpact(fish)}${renderLeviathanImpact(fish)}${renderCoinImpacts(fish)}${renderLuminarImpacts(fish)}${renderDebuffWeightImpact(fish)}${renderMessageImpact(fish)}${renderFlipperImpact(fish)}${renderSiphonophoreImpact(fish,'pending')}${renderSparkChaosImpact(fish)}${renderSiphonophoreImpact(fish,'trash')}${renderFirstWaterImpact(fish)}${renderMoonShellImpact(fish)}${renderMaskImpact(fish)}${renderScubaImpact(fish)}${renderDiceImpact(fish)}${renderFinalOrcaImpact(fish)}</li>`;
    })
    .join('');
  return `<ul class="embedded-fish-list">${items}</ul>`;
}
function renderRiftLootResults(row) {
  if(row.type!=='rift')return '';
  let results=Array.isArray(row.riftLootResults)?row.riftLootResults:[];
  if(!results.length&&/Вынесена добыча:/i.test(String(row.detail||''))){
    results=[...String(row.detail).matchAll(/(💠|✨|🧿|🔹)\s*([^•)<]+)/g)].map(match=>({
      kind:match[1]==='💠'?'relic':match[1]==='✨'?'effect':match[1]==='🧿'?'trade':'shard',
      name:match[2].trim(),
      count:1
    }));
  }
  if(!results.length)return '';
  results=results.map(item=>item.kind==='shard'&&item.name==='Осколок сингулярности'?{...item,kind:'relic'}:item.kind==='shard'&&item.name==='Багровый осколок'?{...item,kind:'effect',name:'Багровый осколок: следующая рыба +15%'}:item);
  const grouped=new Map();
  results.forEach(item=>{
    const key=`${item.kind}:${item.name||item.key||''}`;
    const existing=grouped.get(key);
    if(existing)existing.count=(existing.count||1)+(item.count||1);
    else grouped.set(key,{...item,count:item.count||1});
  });
  const consumedEffects=new Map();
  (row.embeddedFishIds||[]).map(id=>state.fish.find(fish=>fish.id===id)).filter(Boolean).forEach(fish=>{
    (fish.riftEffectImpacts||[]).forEach(impact=>{
      const name=String(impact.name||'').trim();
      if(name)consumedEffects.set(name,(consumedEffects.get(name)||0)+1);
    });
  });
  results=[...grouped.values()].map(item=>item.kind==='effect'&&consumedEffects.has(item.name)
    ?{...item,count:Math.max(0,(item.count||1)-consumedEffects.get(item.name))}
    :item
  ).filter(item=>(item.count||0)>0);
  const rank={relic:1,effect:2,trade:3};
  results=[...results].sort((a,b)=>(rank[a.kind]||9)-(rank[b.kind]||9));
  const items=results.map(item=>{
    const count=item.count>1?` ×${item.count}`:'';
    const relicHint=RIFT_RELIC_HINTS[item.name]||RIFT_RELIC_INFO[item.name]||'Одноразовая реликвия';
    const content=item.kind==='relic'?`${riftRelicIcon(item.name)}<span class="rift-relic-copy"><strong><span class="rift-relic-shiny-name"><span class="rift-relic-name-base">${item.name}</span><span class="rift-relic-name-shine" aria-hidden="true">${item.name}</span></span>${count}</strong><small>(${relicHint})</small></span>`:
      item.kind==='effect'?`${riftLootEffectIcon(item,'is-loot-icon')} ${item.name}${count}`:
      item.kind==='trade'?`${riftTradeLootIcon(item,'is-loot-icon')} ${item.name||'Предмет обмена'}${count}`:
      item.kind==='shard'?`${item.name==='Осколок сингулярности'?riftRelicIcon('Осколок сингулярности'):riftRelicIcon('Сердце бездны')} ${item.name}${count}`:
      `${item.name||'Добыча Разлома'}${count}`;
    return `<li class="rift-loot-result-item type-${item.kind}">${content}</li>`;
  }).join('');
  return `<ul class="rift-loot-results">${items}</ul>`;
}
function renderIslandLootResults(row){
  if(row.type!=='island'||!Array.isArray(row.islandLootResults)||!row.islandLootResults.length)return '';
  const items=row.islandLootResults.map(item=>`<li class="island-history-loot-item type-${item.kind||'item'}"><span class="island-history-loot-copy">${islandLootHistoryPurposeLabel(item)}</span></li>`).join('');
  return `<ul class="island-history-loot-results">${items}</ul>`;
}
function setFishHistoryEaten(fish, eaten=true) {
  state.history.forEach(row=>{ if (row.type==='fish' && row.fishId===fish.id) row.eaten=eaten; });
}
function setFishHistorySacrificed(fish, riftType) {
  const riftName=RIFT_TYPES[riftType]?.short||'Неизвестному Разлому';
  const label=`Принесена в жертву Разлому «${riftName}»`;
  fish.riftSacrificeLabel=label;
  state.history.forEach(row=>{
    if (row.type==='fish'&&row.fishId===fish.id) { row.eaten=true;row.riftSacrificeLabel=label; }
    if ((row.embeddedFishIds||[]).includes(fish.id)) row.riftSacrificeLabel=label;
  });
}
function setFishHistoryStolen(fish, stolen=true) {
  state.history.forEach(row=>{ if (row.type==='fish' && row.fishId===fish.id) row.stolen=stolen; });
}
function setFishHistoryIslandTraded(fish){state.history.forEach(row=>{if(row.type==='fish'&&row.fishId===fish.id)row.islandTraded=true;});}
function fishHistorySourceLabel(source=''){
  const value=String(source);
  if(value==='Заброс')return 'Заброс';
  if(/аркад/i.test(value))return 'Аркада';
  if(value.startsWith('Разлом:'))return 'Разлом';
  if(/остров|экспедиц|припасы ордена/i.test(value))return 'Экспедиция';
  if(/рециклон/i.test(value))return 'Рециклон';
  if(/торговое судно/i.test(value))return 'Торговое судно';
  if(/ангус/i.test(value))return 'Ангус';
  if(/эхо улова/i.test(value))return 'Эхо';
  if(/кристалл расслоения/i.test(value))return 'Реликвия';
  return value;
}
function compactFishHistoryDetail(detail,source=''){
  const value=String(detail||'');
  const prefix=String(source||'');
  if(!prefix)return value;
  if(value===prefix)return '';
  if(value.startsWith(`${prefix} • `))return value.slice(prefix.length+3);
  return value;
}
function addFishHistory(fish, source) {
  const details=[...(fish.tags||[])].filter(tag=>!fish.goldenHourImpact||!String(tag).includes('class="gold-add"'));
  if(fish.dangerImpact)details.push(`${fish.dangerImpact.title}: ${kg(fish.dangerImpact.before)} → ${kg(fish.dangerImpact.after)} (−${fish.dangerImpact.percent}%)`);
  return addHistory(`${capitalize(fish.name)} — ${kg(fish.weight)}`,'fish',details.join(' • '),{fishId:fish.id,fishSource:source,goldenAnimationUntil:fish.goldenHourImpact?Date.now()+1400:0,eaten:Boolean(fish.removed&&!fish.mythicSkeleton),mythicSkeleton:Boolean(fish.mythicSkeleton),arcade:Boolean(fish.arcadeCatch),numbered:source==='Заброс'});
}
function maybeGrantTradeItem(historyRow, fish) {
  if (!historyRow || !fish || fish.removed || fish.source!=='Заброс' || !fish.direct) return null;
  if (!chance(BALANCE.tradeShip.itemDropChance)) return null;
  const definition=pick(TRADE_ITEMS);
  const item={id:uid(),key:definition.key,name:definition.name,icon:definition.icon,fishId:fish.id,historyRowId:historyRow.id,exchanged:false};
  state.tradeItems.push(item);
  historyRow.tradeItemId=item.id;
  if(state.islands?.sharpFinRod){state.tradeItems.push({...item,id:uid(),sharpFinCopy:true});appendHistoryDetailById(historyRow.id,'Удочка племени Острого Плавника удвоила предмет обмена');}
  const luminars=activeMythics('Люминар Удильщика');
  luminars.forEach(luminar=>state.tradeItems.push({...item,id:uid(),fishId:fish.id,luminarCopy:true,luminarId:luminar.id,historyRowId:historyRow.id}));
  if(luminars.length)appendHistoryDetailById(historyRow.id,`Люминар Удильщика создал копий предмета: ${luminars.length}`);
  return item;
}
function toast(text) {
  const el=$('toast'); el.textContent=text; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),2200);
}
function weightedResult(weights) {
  const entries=Object.entries(weights).filter(([,v])=>v>0); const total=entries.reduce((s,[,v])=>s+v,0);
  let roll=Math.random()*total;
  for (const [key,value] of entries) { roll-=value; if (roll<=0) return key; }
  return entries.at(-1)[0];
}
function setExactWeightShares(weights, targetShares) {
  const targets=Object.entries(targetShares).filter(([,share])=>Number.isFinite(share) && share>0);
  const targetTotal=targets.reduce((sum,[,share])=>sum+share,0);
  if (!targets.length || targetTotal>=1) return weights;

  const targetKeys=new Set(targets.map(([key])=>key));
  const fixedTotal=Object.entries(weights)
    .filter(([key,value])=>!targetKeys.has(key) && value>0)
    .reduce((sum,[,value])=>sum+value,0);
  const finalTotal=fixedTotal/(1-targetTotal);
  targets.forEach(([key,share])=>{ weights[key]=finalTotal*share; });
  return weights;
}

function currentWeights() {
  const w={...BALANCE.catch.baseWeights};
  const weatherBalance=BALANCE.weather;

  if (state.weather==='golden') {
    w.trash*=weatherBalance.golden.trashMultiplier;
    w.bonus*=weatherBalance.golden.bonusMultiplier;
  }
  if (state.weather==='fog') w.epic*=weatherBalance.fog.epicMultiplier;
  if (state.weather==='eclipse') w.legendary*=weatherBalance.eclipse.legendaryMultiplier;
  if (state.weather==='thunder') {
    w.heavy*=weatherBalance.thunder.heavyMultiplier;
    w.trash*=weatherBalance.thunder.trashMultiplier;
  }
  if (state.weather==='storm') {
    w.bonus=weatherBalance.storm.bonusWeight;
    w.trash*=weatherBalance.storm.trashMultiplier;
  }
  if (activeDebuff('Утка')) w.trash*=BALANCE.debuffs.duckTrashMultiplier;
  if (state.megalodon) w.giant*=BALANCE.artifacts.megalodonGiantMultiplier;
  const luminars=state.artifacts.filter(a=>a.name==='Люминар Удильщика'&&!a.traded).length;
  if(luminars){w.giant*=1+luminars*.3;w.trash=0;}
  const rageBoost=(state.mythic?.eyeCycles||[]).filter(x=>x.mode==='rage'&&x.remaining>0).reduce((sum,x)=>sum+(.05+(x.step||0)*.01),0);
  if(rageBoost){const total=Object.values(w).reduce((s,v)=>s+Math.max(0,v),0),base=total?w.trash/total:0;setExactWeightShares(w,{trash:Math.min(.99,base+rageBoost)});}

  // Целевые вероятности Шторма применяются после остальных модификаторов,
  // поэтому эпик остаётся ровно 2%, а легендарный артефакт — ровно 1%
  // внутри основной таблицы даже при активной Утке или Плавнике мегалодона.
  if (state.weather==='storm') {
    setExactWeightShares(w, {
      epic: weatherBalance.storm.epicTargetChance,
      legendary: weatherBalance.storm.legendaryTargetChance
    });
  }
  return w;
}

function rollMythicName(weather=state.weather){
  const table=BALANCE.artifacts.mythicWeatherChance[weather]||{};
  let roll=Math.random();
  for(const [name,p] of Object.entries(table)){if(roll<p)return name;roll-=p;}
  return null;
}
function activeMythics(name){return state.artifacts.filter(a=>a.name===name&&!a.traded);}
function categoryForWeight(weight){return weight>=20?'giant':weight>=10?'heavy':'normal';}
function mythicCatchDescriptor(weather=state.weather,allowMythic=true){
  const mythic=allowMythic?rollMythicName(weather):null;if(mythic)return {type:'mythic',name:mythic};
  let type=chance(BALANCE.catch.coinChance)?'coin':weightedResult(currentWeights());
  if(state.dungeon?.rewards?.some(item=>item.key==='eye'&&!item.used)&&['normal','heavy','giant'].includes(type))type='giant';
  if(['normal','heavy','giant'].includes(type))return {type,fishName:pick(type==='giant'?DATA.giants:DATA.fish),weight:type==='giant'?rand1(20,40):type==='heavy'?rand1(10,19.9):rand1(.1,9.9)};
  if(type==='trash')return {type,name:pick(DATA.trash)};
  if(type==='bonus')return {type,name:pick(DATA.bonuses)};
  if(type==='epic')return {type,name:pick(DATA.epics)};
  if(type==='legendary')return {type,name:pick(DATA.legendary)};
  if(type==='coin'){const coin=chooseCoinType();return {type,name:coin.name,coinType:coin.key};}
  return {type};
}
function descriptorText(d){
  if(['normal','heavy','giant'].includes(d.type))return `${capitalize(d.fishName)} — ${kg(d.weight)}`;
  return d.name||d.type;
}
function chooseDebuff() {
  const w={Чайка:1,Рак:1,Утка:1,Осьминог:1,Касатка:1};
  if (state.weather==='sunny') w.Чайка=5;
  if (state.weather==='rain') w.Утка=5;
  if (state.weather==='calm') w.Рак=5;
  return weightedResult(w);
}

function currentDebuffEventChance() {
  if (state.weather==='storm') return BALANCE.debuffs.eventChance.storm;
  if (state.weather==='golden') return BALANCE.debuffs.eventChance.golden;
  if (['sunny','rain','calm'].includes(state.weather)) return BALANCE.debuffs.eventChance.featured;
  return BALANCE.debuffs.eventChance.default;
}
function maybeTriggerDebuffEvent() {
  if (!chance(currentDebuffEventChance()))return;
  if(state.dungeon?.rewards?.some(item=>item.key==='eye'&&!item.used)){
    const predicted=chooseDebuff();addHistory(`Око Балистьера предвидит дебаф: ${predicted}`,'dungeon','(Принять событие или отказаться; отказ не возвращает заброс)',{numbered:false,dungeonDebuffPrediction:predicted,dungeonPredictionOpen:true});renderHistory();return;
  }
  processDebuff();
}
function chooseCoinType() {
  const weights=Object.fromEntries(COIN_TYPES.map(item=>[item.key,item.weight]));
  const key=weightedResult(weights);
  return COIN_TYPES.find(item=>item.key===key) || COIN_TYPES[0];
}
function processCoinCatch(forcedType=null) {
  const type=COIN_TYPES.find(x=>x.key===forcedType)||chooseCoinType();
  const luck=Math.min(1,type.luck+activeMythics('Люминар Удильщика').length*.4);
  const coin={id:uid(), type:type.key, name:type.name, add:type.add, luck, used:false, success:false, applied:false, expired:false, historyRowId:null,lastCastTradeEligible:state.castsLeft===0};
  state.coins.push(coin);
  const row=addHistory(type.name,'coin',`(Шанс ${Math.round(type.luck*100)}%: следующая пойманная рыба получит +${type.add} кг)`,{coinId:coin.id});
  coin.historyRowId=row.id;
}
function useCoin(coinId) {
  const coin=state.coins.find(item=>item.id===coinId);
  if (!coin || coin.used || coin.expired || state.finished || (coin.lastCastTradeEligible&&state.tradeShipArrived)) return;
  coin.used=true;
  coin.success=chance(Number(coin.luck)||0);
  const row=state.history.find(item=>item.id===coin.historyRowId);
  if (coin.success) {
    state.pendingCoinBoosts.push({coinId:coin.id, rowId:coin.historyRowId, add:coin.add, name:coin.name, type:coin.type});
    if (row) row.detail=`(Удача улыбнулась: следующая пойманная рыба получит +${coin.add} кг)`;
  } else if (row) {
    row.detail='(Удача не улыбнулась: усиление не получено)';
  }
  commitState();
}
function expireUnusedCoins() {
  state.coins.forEach(coin=>{
    if (!coin.used) {
      coin.expired=true;
      const row=state.history.find(item=>item.id===coin.historyRowId);
      if (row) row.detail='(Не использована до завершения сессии)';
    }
  });
  state.pendingCoinBoosts.forEach(boost=>{
    const coin=state.coins.find(item=>item.id===boost.coinId);
    if (coin && !coin.applied) {
      const row=state.history.find(item=>item.id===coin.historyRowId);
      if (row) row.detail=`(Усиление +${coin.add} кг не успело примениться)`;
    }
  });
}

function makeFish(category='normal', source='Заброс', direct=true, options={}) {
  const navigatorOverride=source==='Заброс'&&state.islands?.navigatorCategory&&['normal','heavy','giant'].includes(category);if(navigatorOverride)category=state.islands.navigatorCategory;
  const { parentHistoryId=null, arcadeCatch=false, initialWeight=null, fishName=null, rarity=null, bottomlessChestFish=false } = options;
  const giant=category==='giant';
  let original=!navigatorOverride&&Number.isFinite(initialWeight)?round1(initialWeight):giant?rand1(20,40):category==='heavy'?rand1(10,19.9):rand1(.1,9.9);
  const islandDistorted=Boolean(state.islands?.unstablePresence);
  const f={id:uid(),name:!navigatorOverride&&fishName?fishName:pick(giant?DATA.giants:DATA.fish),category,rarity,originalWeight:original,weight:original,source,direct,removed:false,tags:[],debuffLimited:false,historyParentId:parentHistoryId,arcadeCatch,bottomlessChestFish,bottomlessChestGrowth:0};
  consumeRiftFishEffects(f);
  if (Array.isArray(state.pendingCoinBoosts) && state.pendingCoinBoosts.length) {
    f.coinImpacts=[];
    state.pendingCoinBoosts.forEach(boost=>{
      const before=f.weight;
      f.weight=round1(f.weight+boost.add);
      f.coinImpacts.push({coinId:boost.coinId, name:boost.name, type:boost.type, add:boost.add, before, after:f.weight});
      const coin=state.coins.find(item=>item.id===boost.coinId);
      if (coin) coin.applied=true;
      const row=state.history.find(item=>item.id===boost.rowId);
      if (row) row.detail=`(Усиление применено к ${capitalize(f.name)}: ${kg(before)} + ${boost.add} кг = ${kg(f.weight)})`;
    });
    state.pendingCoinBoosts=[];
  }
  const mythicEligible=source==='Заброс'||source==='Аркадный улов'||arcadeCatch||source.startsWith('Разлом:');
  if(mythicEligible){
    const luminars=activeMythics('Люминар Удильщика');
    if(['normal','heavy'].includes(f.category)&&luminars.length){
      f.luminarImpacts=[];luminars.forEach(()=>{const before=f.weight,beforeCategory=categoryForWeight(before),plus=Math.floor(rand(5,11));f.weight=round1(f.weight+plus);f.luminarImpacts.push({before,after:f.weight,plus,beforeCategory,afterCategory:categoryForWeight(f.weight)});});f.category=categoryForWeight(f.weight);
    }
  }
  state.fishCaughtTotal++;
  state.hadAnyFish=true;
  state.trashStreak=0;
  if (category==='heavy') state.heavyCaughtTotal++;
  if (category==='giant') state.giantCaughtTotal++;
  if (original<=1) state.smallFishCaught++;
  if (['золотая рыбка','золотая форель'].includes(f.name)) state.goldenFishCaught=true;
  if (original===40) state.exactFortyCaught=true;
  if (state.weather==='golden') state.goldenHourFishCount++;
  if (state.weather==='thunder' && category==='heavy') state.thunderHeavyCaught=true;
  if (state.artifacts.some(a=>a.name==='Чешуя Левиафана')) state.leviathanFishCount++;

  if (!state.megalodon && (activeDebuff('Рак') || activeDebuff('Утка'))) {
    const max=activeDebuff('Рак')?2.5:3;
    f.preDebuffWeight=f.weight;f.unrestrictedWeight=f.weight;
    const originalTenths=Math.max(1,Math.round(f.weight*10));
    const maxTenths=Math.max(1,Math.min(Math.round(max*10),originalTenths-1));
    f.weight=Math.floor(rand(1,maxTenths+1))/10; f.debuffBaseWeight=f.weight; f.debuffLimited=true;f.debuffSource=activeDebuff('Рак')?'Рак':'Утка';
  }
  if (state.weather==='golden') { const threaded=source==='Заброс'&&activeMythics('Нить Сифонофоры').length;const plus=Math.floor(rand(threaded?5:1,threaded?11:5)); const before=f.weight; f.weight=round1(f.weight+plus);if(Number.isFinite(f.unrestrictedWeight))f.unrestrictedWeight=round1(f.unrestrictedWeight+plus); f.goldenHourImpact={before,after:f.weight,plus}; }
  if (state.leviathanStep>=0 && state.artifacts.some(a=>a.name==='Чешуя Левиафана')) {
    state.leviathanStep+=1;
    const plus=state.leviathanStep*5;
    const before=f.weight;
    f.weight=round1(f.weight+plus);
    if(Number.isFinite(f.unrestrictedWeight))f.unrestrictedWeight=round1(f.unrestrictedWeight+plus);
    f.leviathanImpact={before,after:f.weight,plus,step:state.leviathanStep};
    f.tags.push(`Чешуя +${plus} кг`);
  }
  const flipperBonuses=activeBonuses('Ласты').filter(b=>b.startFishIndex<=state.fish.length);
  const flippers=flipperBonuses.length;
  if (flippers>0) {
    const eligibleCount=state.fish.filter(x=>!x.removed && x.createdAfterFlippers).length+1;
    f.createdAfterFlippers=true;
    if (eligibleCount%2===0) { const bonusFactors=flipperBonuses.map(b=>({bonusId:b.id,factor:(b.abyssEnhanced?3:2)*(state.nautilus?2:1)})); const factor=flipperBonuses.reduce((total,b)=>total*(b.abyssEnhanced?3:2)*(state.nautilus?2:1),1); const before=f.weight; f.weight=round1(f.weight*factor);if(Number.isFinite(f.unrestrictedWeight))f.unrestrictedWeight=round1(f.unrestrictedWeight*factor); f.flipperImpact={before,after:f.weight,factor,count:flippers,nautilus:state.nautilus,bonusIds:flipperBonuses.map(b=>b.id),bonusFactors}; state.flippersBoostedCount++; }
  }
  if(!f.removed&&state.mythic.threadPendingBoosts.length){
    state.mythic.threadPendingBoosts.splice(0).forEach(boost=>{const before=f.weight,trash=state.trash.find(x=>x.id===boost.trashId);f.weight=round1(f.weight+boost.plus);f.threadImpacts=[...(f.threadImpacts||[]),{before,after:f.weight,plus:boost.plus,trashId:boost.trashId,timing:'pending'}];appendHistoryDetailById(boost.rowId,`Нить преобразовала ${trash?capitalize(trash.name):'хлам'} в +${boost.plus} кг; прибавка применена к ${capitalize(f.name)}`);});
    f.category=categoryForWeight(f.weight);
  }
  if(islandDistorted){
    const islandOriginalWeight=round1(f.weight),rawDistortedWeight=rollIslandDistortedWeight(islandOriginalWeight),distortedWeight=state.islands?.firstWaterWeakening&&rawDistortedWeight>0?round1(rawDistortedWeight+(islandOriginalWeight-rawDistortedWeight)*.5):rawDistortedWeight;
    f.islandDistorted=true;f.islandOriginalWeight=islandOriginalWeight;f.islandDistortedWeight=distortedWeight;f.originalWeight=distortedWeight;f.weight=distortedWeight;
    if(Number.isFinite(f.unrestrictedWeight))f.unrestrictedWeight=distortedWeight;
    if(state.islands?.firstWaterWeakening)f.firstWaterImpact={before:islandOriginalWeight,distorted:rawDistortedWeight,after:distortedWeight};
    f.tags.push(state.islands?.firstWaterWeakening?'<span class="island-negative-hint">«Нестабильное присутствие» ослаблено Флаконом Первой Воды на 50%</span>':'<span class="island-negative-hint">Применено «Нестабильное присутствие»: вес искажён до 0,1–1,0 кг</span>');
    if(distortedWeight===0){f.skeletonOf=f.name;f.name=`рыбный скелет (${f.name})`;f.islandSkeleton=true;f.mythicSkeleton=true;f.removed=true;f.tags=[`<span class="island-negative-hint">«Нестабильное присутствие» превратило рыбу весом ${kg(islandOriginalWeight)} в скелет</span>`];state.smallFishCaught++;state.fish.push(f);if(parentHistoryId)attachFishToHistoryRow(parentHistoryId,f.id);else addFishHistory(f,source);return f;}
  }
  if(f.category==='normal'&&state.islands?.moonShellActiveId&&!f.removed){const before=f.weight;f.weight=round1(f.weight*2);if(Number.isFinite(f.unrestrictedWeight))f.unrestrictedWeight=round1(f.unrestrictedWeight*2);f.moonShellImpact={before,after:f.weight};state.islands.moonShellDoubles=(state.islands.moonShellDoubles||0)+1;if(state.islands.moonShellProtected&&state.islands.moonShellDoubles>=5&&!state.islands.moonShellLeviathanGranted){state.islands.moonShellLeviathanGranted=true;setTimeout(()=>processEpic('Чешуя Левиафана'),0);}}
  if(mythicEligible){activeMythics('Искра Хаоса').forEach(()=>{
    const before=f.weight,beforeCategory=f.category,reduction=chance(.04)?Math.floor(rand(6,11)):5;
    const targetCategory=f.category==='giant'?'heavy':f.category==='heavy'?'normal':'normal',cap=targetCategory==='heavy'?19.9:9.9;
    f.weight=round1(Math.min(f.weight-reduction,cap));f.category=targetCategory;
    f.sparkImpacts=[...(f.sparkImpacts||[]),{before,after:Math.max(0,f.weight),reduction,beforeCategory,afterCategory:targetCategory}];
    if(f.weight<.1){f.skeletonOf=f.name;f.name=`рыбный скелет (${f.name})`;f.mythicSkeleton=true;f.weight=0;f.removed=true;}
  });}
  if (activeDebuff('Касатка') && f.weight>=5.5 && !state.megalodon) {
    if (consumeProtection('касаткой',f)) { f.tags.push('защищена Фантомным осколком'); }
    else { f.removed=true; state.eaten.push(f); state.fishLostToDebuffs=true; }
    if (f.removed) {
      state.fish.push(f);
      if (parentHistoryId) attachFishToHistoryRow(parentHistoryId, f.id);
      else addFishHistory(f,source);
      return f;
    }
  }
  if(applyBallistierWrathToFish(f)){state.fish.push(f);const escapedRow=parentHistoryId?null:addFishHistory(f,source);if(parentHistoryId)attachFishToHistoryRow(parentHistoryId,f.id);if(escapedRow){escapedRow.ballistierEscaped=true;escapedRow.detail='(Сорвалась • вес неизвестен • Гнев Балистьера)';}return f;}
  state.fish.push(f);
  // Достижения за прямой тяжёлый улов учитывают фактическое состояние рыбы.
  // Если Утка или Рак уже ограничили её вес, она больше не считается
  // полноценным тяжеловесом/гигантом для этих достижений.
  if (direct && category==='heavy' && !f.debuffLimited) state.directHeavy=true;
  if (direct && category==='giant' && !f.debuffLimited) state.directGiant=true;
  let fishHistoryRow=null;
  if (parentHistoryId) attachFishToHistoryRow(parentHistoryId, f.id);
  else fishHistoryRow=addFishHistory(f,source);
  maybeSpawnPiranhas(f);
  maybeGrantTradeItem(fishHistoryRow,f);
  const stolenByWaitingSeagull=resolvePendingSeagullWithFish(f);
  if (stolenByWaitingSeagull) return f;
  if (giant) { TelegramApp?.HapticFeedback?.notificationOccurred?.('success'); showVisualEffect('giant','🏆','РЫБА-ГИГАНТ',`${capitalize(f.name)} — ${kg(f.weight)}`,1450,false,false); }
  else if (category==='heavy') showVisualEffect('giant','🐟','Тяжеловес!',`${capitalize(f.name)} — ${kg(f.weight)}`,850,true,false);
  if (direct && state.rifts?.crystalArmed && !f.removed) {
    state.rifts.crystalArmed=false;
    const alternative=weightedResult(currentWeights());
    showChoice('Кристалл расслоения',`Текущий улов: ${capitalize(f.name)} — ${kg(f.weight)}. Вторая вероятность имеет характер «${alternative}». Первый исход нельзя вернуть после замены.`,['Оставить текущий улов','Раскрыть вторую вероятность'],choice=>{
      if(choice.startsWith('Раскрыть')){f.removed=true;setFishHistoryEaten(f,true);addHistory('Кристалл расслоения заменил текущий улов','rift',`(${capitalize(f.name)} — ${kg(f.weight)} заменена второй вероятностью: ${alternative})`,{numbered:false,relicName:'Кристалл расслоения',relicEvent:'resolved'});if(['normal','heavy','giant'].includes(alternative))makeFish(alternative,'Кристалл расслоения',false);else if(alternative==='trash')processTrash();else if(alternative==='bonus')processBonus();else if(alternative==='epic')processEpic();else if(alternative==='legendary')processLegendary();}
      else addHistory('Кристалл расслоения сохранил исход','rift',`(Оставлена рыба: ${capitalize(f.name)} — ${kg(f.weight)}; вторая вероятность отвергнута)`,{numbered:false,relicName:'Кристалл расслоения',relicEvent:'resolved'});
    });
  }
  return f;
}
function growBottomlessChestFishAfterCast(){
  const growing=state.fish.filter(fish=>fish.bottomlessChestFish&&!fish.removed);
  if(!growing.length)return 0;
  const affectedRows=new Set();
  growing.forEach(fish=>{
    fish.weight=round1(fish.weight+1);
    if(Number.isFinite(fish.unrestrictedWeight))fish.unrestrictedWeight=round1(fish.unrestrictedWeight+1);
    fish.bottomlessChestGrowth=(fish.bottomlessChestGrowth||0)+1;
    fish.category=categoryForWeight(fish.weight);
    if(fish.historyParentId)affectedRows.add(fish.historyParentId);
    enforceOrca(fish);
  });
  affectedRows.forEach(rowId=>{
    const row=state.history.find(item=>item.id===rowId);
    if(row)row.bottomlessChestGrowthTicks=(row.bottomlessChestGrowthTicks||0)+1;
  });
  return growing.length;
}
function capitalize(s){return s.charAt(0).toUpperCase()+s.slice(1);}

function processTrash(forcedName=null) {
  const item=forcedName||pick(DATA.trash);
  state.trashStreak++;
  state.maxTrashStreak=Math.max(state.maxTrashStreak,state.trashStreak);
  if (!state.trashNamesCaught.includes(item)) state.trashNamesCaught.push(item);

  let detail=state.weather==='thunder'?'⚡ Удар молнии поднял хлам со дна':'';
  if (hasBonus('Счастливый поплавок')) {
    const restore=Math.max(...activeBonuses('Счастливый поплавок').map(b=>b.abyssEnhanced?2:1))*(state.nautilus?2:1);
    state.castsLeft+=restore; state.luckyFloatSaves++;
    detail+=`${detail?' • ':''}Счастливый поплавок вернул ${restore} заброс${restore===1?'':'а'}`;
  }

  const row=addHistory(capitalize(item),'trash',detail?`(${detail})`:'');
  const trash={id:uid(),name:item,converted:false,historyRowId:row.id,recyclonEligible:true};
  state.trash.push(trash);

  activeMythics('Нить Сифонофоры').forEach(thread=>{
    thread.threadTrashStep=(thread.threadTrashStep||0)+1;const plus=thread.threadTrashStep*10;
    const target=[...state.fish].reverse().find(f=>!f.removed);
    if(target){const before=target.weight;target.weight=round1(target.weight+plus);target.threadImpacts=[...(target.threadImpacts||[]),{before,after:target.weight,plus,trashId:trash.id,timing:'trash'}];appendHistoryDetailById(row.id,`Нить Сифонофоры преобразовала ${capitalize(trash.name)} в +${plus} кг для рыбы «${capitalize(target.name)}»`);}
    else{state.mythic.threadPendingBoosts.push({threadId:thread.id,plus,trashId:trash.id,rowId:row.id});appendHistoryDetailById(row.id,`Нить Сифонофоры преобразовала ${capitalize(trash.name)} в +${plus} кг; прибавка ожидает первую рыбу`);}
  });

  if (state.deepThingActive) {
    state.deepThingConvertedCount++;
    syncDeepThingConversionDetails();
    transmuteTrash(trash,state.nautilus?'Штурвал Наутилуса / Глубоководное нечто':'Глубоководное нечто');
  }
}
function processBonus(forcedName=null) {
  const name=forcedName||pick(DATA.bonuses); playSound('bonus');
  showVisualEffect('bonus',entityIcon(name,'✅'),'БОНУС ПОЛУЧЕН',name,900,true,false);
  state.bonusArtifactCount++; state.sessionCategories.bonus=true;
  if (name==='Снаряжение дайвера' && state.debuffs.some(d=>['Чайка','Рак','Утка'].includes(d.name))) {
    showChoice('Снаряжение дайвера','Дебаф уже был получен. Выберите замену:', ['Подводная маска','Ласты','Счастливый поплавок'], choice=>grantBonus(choice,`Снаряжение дайвера заменено на «${choice}», поскольку дебаф уже действовал`));
    return;
  }
  grantBonus(name);
}
function grantBonus(name, customDetail='') {
  if (state.octopusSeen) state.bonusAfterOctopus=true;
  const bonus={id:uid(),name,startFishIndex:state.fish.length}; state.bonuses.push(bonus);
  const descriptions={
    'Подводная маска':'Каждая оставшаяся рыба получит множитель ×1,5 в финале',
    'Ласты':'Каждая вторая будущая рыба получает множитель ×2',
    'Акваланг':'В финале самая тяжёлая оставшаяся рыба получает ×3. Несколько Аквалангов складываются линейно: 2 дают ×6, 3 дают ×9. Штурвал Наутилуса удваивает силу каждого Акваланга',
    'Счастливый поплавок':'Хлам сохраняет попытку заброса',
    'Снаряжение дайвера':'Блокирует Чайку, Рака и Утку, полученных после него'
  };
  const row=addHistory(name,'bonus',`(${customDetail||descriptions[name]||'Бонус активирован'})`,{bonusId:bonus.id});
  bonus.historyRowId=row.id;
}
function diverBlocks(name) { return ['Чайка','Рак','Утка'].includes(name) && hasBonus('Снаряжение дайвера'); }
function showDebuffEffect(name) {
  const effects={
    'Чайка':['debuff-seagull','🦅','ЧАЙКА','Перо пронеслось над уловом'],
    'Рак':['debuff-crab','🦞','РАК','Клешни сжимают снасть'],
    'Утка':['debuff-duck','🦆','УТКА','Стая распугивает рыбу'],
    'Осьминог':['debuff-octopus','🐙','ОСЬМИНОГ','Щупальца опутывают бонусы'],
    'Касатка':['debuff-orca','🐋','КАСАТКА','Хищная волна проходит по улову']
  };
  const [kind,icon,title,subtitle]=effects[name]||['debuff','🛑',name,'Неблагоприятное событие'];
  showVisualEffect(kind,icon,title,subtitle,1050,true,false);
}
function resolvePendingSeagullWithFish(fish) {
  if (!fish || fish.removed || fish.islandColossus || fish.islandMoray || fish.islandGraniteCatfish || fish.islandEchoRay || !Array.isArray(state.pendingSeagulls) || !state.pendingSeagulls.length) return false;
  const pending=state.pendingSeagulls.shift();
  if (consumeProtection('чайкой',fish)) { const row=state.history.find(item=>item.id===pending.historyRowId);if(row)row.detail=`(Фантомный осколок отпугнул Чайку от ${capitalize(fish.name)})`;renderHistory();return false; }
  fish.removed=true;
  state.stolen.push(fish);
  state.fishLostToDebuffs=true;
  setFishHistoryStolen(fish,true);
  const remaining=state.fish.filter(item=>!item.removed && item.id!==fish.id);
  const maxWeight=Math.max(fish.weight,...remaining.map(item=>item.weight));
  const originalWeight=Number.isFinite(fish.originalWeight)?fish.originalWeight:fish.weight;
  if (fish.weight===maxWeight&&originalWeight>=20) state.seagullStoleHeaviest=true;
  const row=state.history.find(item=>item.id===pending.historyRowId);
  if (row) row.detail=`(Украла первую доступную рыбу: ${capitalize(fish.name)} — ${kg(fish.weight)})`;
  renderHistory();
  return true;
}
function finalizePendingSeagulls() {
  if (!Array.isArray(state.pendingSeagulls) || !state.pendingSeagulls.length) return;
  state.pendingSeagulls.forEach(pending=>{
    const row=state.history.find(item=>item.id===pending.historyRowId);
    if (row) row.detail='(Чайке нечего было украсть — доступная рыба так и не появилась)';
  });
  state.pendingSeagulls=[];
  renderHistory();
}

function processDebuff(forcedName=null, options={}) {
  const { arcadeCatch=false } = options;
  const name=forcedName||chooseDebuff();
  if (state.rifts?.eyeArmed) {
    state.rifts.eyeArmed=false;
    const eye=availableRiftRelic('Око скрытой бездны');if(eye)eye.used=true;
    state.pendingCoinBoosts.push({coinId:null,rowId:null,add:5,name:'Око скрытой бездны',type:'gold'});
    addHistory(`Око скрытой бездны раскрыло исход события «${name}»`,'rift','(Событие предотвращено; следующая рыба получает +5 кг)',{numbered:false});
    return;
  }
  state.receivedDebuffCount++;
  if(!state.receivedDebuffNames.includes(name))state.receivedDebuffNames.push(name);
  state.sessionCategories.debuff=true;
  if (['Осьминог','Касатка'].includes(name)) {
    const enhancedDiver=activeEnhancedDiver();
    if(enhancedDiver){enhancedDiver.strongBlockUsed=true;state.blockedDebuffCount++;addHistory(name,'debuff',`(Усиленное Снаряжение дайвера заблокировало действие ${name})`,{numbered:Boolean(arcadeCatch),arcadeCatch:Boolean(arcadeCatch)});return;}
  }
  if (state.megalodon) { addHistory(name,'debuff','(Плавник мегалодона полностью нейтрализовал действие)',{numbered:Boolean(arcadeCatch),arcadeCatch:Boolean(arcadeCatch)}); return; }
  if (diverBlocks(name)) { state.blockedDebuffCount++; addHistory(name,'debuff','(Снаряжение дайвера заблокировало действие)',{numbered:Boolean(arcadeCatch),arcadeCatch:Boolean(arcadeCatch)}); return; }
  playSound('debuff'); showDebuffEffect(name);
  const d={id:uid(),name,active:true}; state.debuffs.push(d);
  let detail='';
  let seagullPending=false;
  if (name==='Чайка') {
    const candidates=state.fish.filter(f=>!f.removed&&!f.islandColossus&&!f.islandMoray&&!f.islandGraniteCatfish&&!f.islandEchoRay);
    if (!candidates.length) {
      detail='Чайка кружит над водой и ждёт первую доступную рыбу';
      seagullPending=true;
    } else {
      const maxWeight=Math.max(...candidates.map(f=>f.weight));
      const victim=pick(candidates);
      if (consumeProtection('чайкой',victim)) { detail=`Фантомный осколок не позволил украсть ${capitalize(victim.name)}`; }
      else { victim.removed=true; state.stolen.push(victim); state.fishLostToDebuffs=true;
      setFishHistoryStolen(victim,true);
      const originalWeight=Number.isFinite(victim.originalWeight)?victim.originalWeight:victim.weight;
      if (victim.weight===maxWeight&&originalWeight>=20) state.seagullStoleHeaviest=true;
      detail=`Украла рыбу: ${capitalize(victim.name)} — ${kg(victim.weight)}`;
      }
    }
  }
  if (name==='Рак') detail='Повредил снасть: весь будущий улов ограничен диапазоном 0,1–2,5 кг';
  if (name==='Утка') detail='Распугала рыбу: шанс хлама вырос, вес будущей рыбы ограничен 3 кг';
  if (name==='Осьминог') {
    state.octopusSeen=true;
    const disabledIds=new Set(state.bonuses.map(b=>b.id));
    disabledIds.forEach(id=>state.disabledBonusIds.add(id));
    state.fish.forEach(fish=>{
      const impact=fish.flipperImpact;
      if(!impact||impact.cancelledByOctopus)return;
      const impactIds=Array.isArray(impact.bonusIds)?impact.bonusIds:[];
      if(impactIds.length&&!impactIds.some(id=>disabledIds.has(id)))return;
      impact.cancelledByOctopus=true;
      const baseLoss=round1(impact.after-impact.before);
      const propagatedLoss=fish.moonShellImpact?round1(baseLoss*2):baseLoss;
      impact.cancelledWeight=fish.islandDistorted?0:Math.min(Math.max(0,fish.weight),propagatedLoss);
      if(!fish.islandDistorted){
        fish.weight=round1(Math.max(0,fish.weight-impact.cancelledWeight));
        if(Number.isFinite(fish.unrestrictedWeight))fish.unrestrictedWeight=round1(Math.max(0,fish.unrestrictedWeight-impact.cancelledWeight));
        fish.category=categoryForWeight(fish.weight);
      }
    });
    detail='Навсегда отключил все бонусы, полученные до его появления';
  }
  if (name==='Касатка') {
    const colossi=state.fish.filter(f=>!f.removed&&f.islandColossus);
    if(colossi.length){const target=[...colossi].sort((a,b)=>b.weight-a.weight)[0];target.orcaChecked=true;if(chance(.5)){target.removed=true;state.eaten.push(target);state.fishLostToDebuffs=true;setFishHistoryEaten(target,true);const unstableRemains=refreshUnstablePresence();detail=`Съедает исполина ${target.name} — ${kg(target.weight)} (проверка 50%)${unstableRemains?'':' • «Нестабильное присутствие» прекращено'}`;}else detail=`Не смогла съесть исполина ${target.name} и ушла, не тронув другую рыбу`;}
    else {const victims=state.fish.filter(f=>!f.removed&&f.weight>=5.5);victims.forEach((f,index)=>{if(index===0&&consumeProtection('касаткой',f))return;f.removed=true;state.eaten.push(f);state.fishLostToDebuffs=true;setFishHistoryEaten(f,true);});detail=`Съедает всю рыбу весом от 5,5 кг${victims.length?` — ${victims.length} шт.`:'; подходящей рыбы не было'}`;}
  }
  const debuffRow=addHistory(name,'debuff',`(${detail})`,{numbered:Boolean(arcadeCatch),arcadeCatch:Boolean(arcadeCatch)});
  d.historyRowId=debuffRow.id;
  if (seagullPending) state.pendingSeagulls.push({historyRowId:debuffRow.id});
}

function processEpic(name=pick(DATA.epics), fromAngus=false) {
  playSound('epic');
  showVisualEffect('epic',entityIcon(name,'💜'),'ЭПИЧЕСКИЙ АРТЕФАКТ',name,1350,false,false);
  const epicArtifact={id:uid(),name,tier:'epic'};state.artifacts.push(epicArtifact); state.artifactCount++; state.bonusArtifactCount++; state.sessionCategories.epic=true; if(state.weather==='fog') state.epicInFog=true;
  maybeTransformFadedRelicFragment(`эпический артефакт «${name}»`);
  if (fromAngus) state.angusGift=true;
  const epicRow=addHistory(name,'epic',fromAngus?'(Дар старины Ангуса)':'',{numbered:!fromAngus,artifactId:epicArtifact.id});
  if (name==='Бездонный ларь') {
    epicRow.bottomlessChest=true;
    epicRow.bottomlessChestGrowthTicks=0;
    appendHistoryDetailById(epicRow.id,'Содержит от 1 до 5 случайных рыб • каждая получает +1 кг после каждого заброса');
    const count=Math.floor(rand(1,6));
    for(let i=0;i<count;i++) makeFish(chance(.01)?'giant':chance(.35)?'heavy':'normal','Бездонный ларь',false,{parentHistoryId:epicRow.id,bottomlessChestFish:true});
    if(chance(BALANCE.islands.itemChance)){
      const page=maybeFindExpeditionItem('Бездонный ларь',true,pick(MESSAGE_EXPEDITION_ITEMS));
      epicRow.bottomlessExpeditionItemId=page?.id||null;
      if(page)appendHistoryDetailById(epicRow.id,`Найдена экспедиционная страница: ${page.name}`);
    }
  }
  if (name==='Компас потерянных глубин') {
    if (!state.compassUsed) {
      state.compassUsed=true;
      showChoice('Компас потерянных глубин','Выберите новую погоду. Лимит забросов станет равен 10.',Object.keys(DATA.weather).map(k=>DATA.weather[k].name),choice=>{
        const key=Object.keys(DATA.weather).find(k=>DATA.weather[k].name===choice); state.weather=key; state.castsLeft=10; state.compassWeatherChanged=true; showWeatherTransition(key); playSound('weather'); if(!state.weatherSeen.includes(key))state.weatherSeen.push(key); if(key==='storm')state.stormSeen=true; playSound('weather'); addHistory(`Погода изменилась: ${choice}`,'weather','(Компас потерянных глубин восстановил лимит до 10)',{weatherKey:key}); render();
      });
    } else {
      state.castsLeft+=2;
      if(chance(.02)){state.angusTrailCasts=0;appendHistoryDetailById(epicRow.id,'Повторный Компас добавил 2 заброса и немедленно привёл к Ангусу');encounterAngus(true);}
      else{state.angusTrailCasts=(state.angusTrailCasts||0)+3;appendHistoryDetailById(epicRow.id,`Добавлено 2 заброса • След старого рыбака: следующие ${state.angusTrailCasts} заброса имеют шанс Ангуса 5%`);}
    }
  }
  if (name==='Послание в бутылке') restoreByMessage(epicArtifact,epicRow);
  if (name==='Чешуя Левиафана') {
    state.castsLeft+=5;
    state.leviathanStep=0;
    epicRow.detail='(Добавлено 5 дополнительных забросов. Будущие рыбы получают +5, +10, +15 кг и далее.)';
  }
  if (name==='Эссенция «Великан Океанов»') {
    state.essencePending=true;
    epicRow.essencePending=true;
    epicRow.detail='(Эссенция ждёт своего часа: применяется в конце сессии)';
  }
  return epicRow;
}
function restoreByMessage(artifact,row) {
  state.stolen.forEach(f=>{f.removed=false; setFishHistoryStolen(f,false); if(!state.fish.includes(f)) state.fish.push(f);});
  const restored=state.stolen.length; if(restored>0)state.recoveredByMessage=true; state.stolen=[];
  let doubled=0,blocked=0;state.fish.filter(f=>!f.removed&&f.debuffLimited).forEach(f=>{const before=f.weight;if(f.islandDistorted){f.messageImpact={before,after:f.weight,blocked:true};blocked++;return;}f.weight=round1(f.weight*2);if(Number.isFinite(f.unrestrictedWeight))f.unrestrictedWeight=round1(f.unrestrictedWeight*2);f.messageImpact={before,after:f.weight,blocked:false};f.tags.push('Послание ×2');doubled++;enforceOrca(f);});
  const used=restored>0||doubled>0;if(artifact){artifact.messageUnused=!used;artifact.messageResolved=used;artifact.historyRowId=row?.id||null;}
  appendLatestHistoryDetail('epic',used?`Вернуло украденных рыб: ${restored}; удвоено повреждённых рыб: ${doubled}${blocked?` • Нестабильное присутствие заблокировало восстановление: ${blocked}`:''}`:`Не использовано: нечего возвращать или удваивать${blocked?` • Нестабильное присутствие заблокировало восстановление: ${blocked}`:''}. Перед завершением сессии бутылку можно открыть.`);
}
function resolveEssencesAtFinish() {
  const essenceRows=state.history.filter(row=>row.type==='epic' && row.text==='Эссенция «Великан Океанов»' && !row.essenceResolved);
  if (!essenceRows.length) { state.essencePending=false; return; }

  essenceRows.forEach(row=>{
    const fishes=state.fish.filter(f=>!f.removed&&!f.tradeFish&&!f.islandColossus).sort((a,b)=>a.weight-b.weight);
    if (!fishes.length) {
      row.detail='(Не применена: в конце сессии в улове не осталось рыбы)';
      row.essenceResolved=true;
      row.essencePending=false;
      return;
    }

    const targets=fishes.length===1 ? fishes.slice(0,1) : fishes.slice(0,2);
    const factor=fishes.length===1 ? 10 : 5;
    targets.forEach(f=>{
      const before=f.weight;
      f.weight=round1(f.weight*factor);
      const impact={before,after:f.weight,factor};
      if (!Array.isArray(f.essenceImpacts)) f.essenceImpacts=[];
      f.essenceImpacts.push(impact);
      f.essence=impact;
      f.tags.push(`Эссенция ×${factor}`);
      enforceOrca(f);
    });

    row.detail=`(Применена в конце сессии к: ${targets.map(f=>capitalize(f.name)).join(', ')}; множитель ×${factor})`;
    row.essenceResolved=true;
    row.essencePending=false;
    state.essenceUsed=true;
  });

  state.essencePending=false;
  renderHistory();
}
function enforceOrca(f){ if(activeDebuff('Касатка')&&!state.megalodon&&f.weight>=5.5&&!f.removed){if(f.islandColossus&&!chance(.5))return;f.removed=true;state.eaten.push(f);state.fishLostToDebuffs=true;setFishHistoryEaten(f,true);if(f.islandColossus)refreshUnstablePresence();} }

function processLegendary(name=pick(DATA.legendary), fromAngus=false) {
  playSound('legendary');
  showVisualEffect('legendary',entityIcon(name,'🧡'),'ЛЕГЕНДАРНЫЙ АРТЕФАКТ',name,1650,false,false);
  const legendaryArtifact={id:uid(),name,tier:'legendary'};state.artifacts.push(legendaryArtifact); state.artifactCount++; state.bonusArtifactCount++; state.sessionCategories.legendary=true; if(state.weather==='eclipse') state.legendaryInEclipse=true;
  maybeTransformFadedRelicFragment(`легендарный артефакт «${name}»`);
  if (fromAngus) state.angusGift=true;
  const legendaryRow=addHistory(name,'legendary',fromAngus?'(Дар старины Ангуса)':'',{numbered:!fromAngus,artifactId:legendaryArtifact.id});
  if (name==='Глубоководное нечто') activateDeepThing('Глубоководное нечто');
  if (name==='Гексаэдр пятой грани') showChoice('Гексаэдр пятой грани','Выберите один эффект:', ['+5 забросов','×5 финальный вес'], choice=>{ if(choice.startsWith('+')){state.castsLeft+=5;state.diceExtraCasts=true;}else{state.diceFinalMultiplier*=5;state.diceWeightMultiplier=true;} appendLatestHistoryDetail('legendary',`Выбран эффект: ${choice}`);render(); });
  if (name==='Штурвал Наутилуса') { state.nautilus=true; state.nautilusActivatedWithTwoBonuses=activeBonuses('Подводная маска').length+activeBonuses('Ласты').length+activeBonuses('Акваланг').length+activeBonuses('Счастливый поплавок').length+activeBonuses('Снаряжение дайвера').length>=2; activateDeepThing('Штурвал Наутилуса / Глубоководное нечто'); }
  if (name==='Плавник мегалодона') activateMegalodon();
  return legendaryRow;
}
function processMythic(name=pick(DATA.mythic),source='Заброс',parentHistoryId=null){
  playSound('legendary');
  showVisualEffect('mythic',entityIcon(name,'◆'),'МИФИЧЕСКИЙ АРТЕФАКТ',name,1850,false,false);
  const artifact={id:uid(),name,tier:'mythic',source,used:false,traded:false,createdCast:state.castClicks,historyRowId:parentHistoryId};
  state.artifacts.push(artifact);state.artifactCount++;state.bonusArtifactCount++;
  maybeTransformFadedRelicFragment(`мифический артефакт «${name}»`);
  const row=parentHistoryId?state.history.find(item=>item.id===parentHistoryId):addHistory(name,'mythic',source==='Заброс'?'':`(${source})`,{artifactId:artifact.id,numbered:source==='Заброс'});
  if(parentHistoryId&&row){if(!Array.isArray(row.embeddedArtifactIds))row.embeddedArtifactIds=[];row.embeddedArtifactIds.push(artifact.id);}
  if(name==='Око Шторма')row.detail='(Готово к использованию: откроет три точных результата будущих забросов)';
  if(name==='Искра Хаоса'){
    if(state.castsLeft<5){triggerPrimordialChaos(source);return artifact;}
    artifact.sparkRemaining=5;row.detail='(На пятом следующем забросе гарантирован Разлом • рыбы удочки и Разломов понижаются)';
  }
  if(name==='Люминар Удильщика'){
    row.detail='(Хлам исключён из основного улова • шанс гиганта +30% • обычные рыбы и тяжеловесы получают +5–10 кг)';
    if(state.castsLeft===0){processEpic('Бездонный ларь');processEpic('Эссенция «Великан Океанов»');appendHistoryDetailById(row.id,'Последний заброс призвал Бездонный ларь и Эссенцию «Великан Океанов»');}
  }
  if(name==='Нить Сифонофоры'){
    artifact.threadChance=.30;artifact.threadTrashStep=0;
    const removed=state.trash.filter(t=>!t.converted);removed.forEach(t=>{t.converted=true;t.threadRemoved=true;const trashRow=state.history.find(h=>h.id===t.historyRowId);if(trashRow){trashRow.threadRemoved=true;appendHistoryDetailById(trashRow.id,'Нить Сифонофоры удалила хлам • возвращён 1 заброс');}});state.castsLeft+=removed.length;
    row.detail=`(Удалено хлама: ${removed.length}; возвращено забросов: ${removed.length} • дополнительная рыба: 30%)`;
  }
  return artifact;
}
function eyePreviewDescriptors(){return [mythicCatchDescriptor(),mythicCatchDescriptor(),mythicCatchDescriptor()];}
function useStormEye(id){
  const artifact=state.artifacts.find(a=>a.id===id&&a.name==='Око Шторма'&&!a.used&&!a.traded);if(!artifact)return;
  const predictions=eyePreviewDescriptors();artifact.predictions=predictions;
  const lines=predictions.map((d,i)=>`${i+1}. ${descriptorText(d)}`).join('\n');
  showChoice('Око Шторма',`Предсказаны следующие результаты:\n${lines}`,['Принять предсказание','Отказаться — пробудить Буйство Шторма'],choice=>{
    artifact.used=true;artifact.eyeStatus='active';artifact.form=choice.startsWith('Принять')?'stormEye':'stormRage';
    state.mythic.eyeCycles.push({id:artifact.id,mode:choice.startsWith('Принять')?'accepted':'rage',predictions,index:0,remaining:choice.startsWith('Принять')?3:4,step:0});
    appendHistoryDetailById(artifact.historyRowId||state.history.find(h=>h.artifactId===artifact.id)?.id,choice.startsWith('Принять')?'Предсказание принято':'Предсказание отвергнуто; началось Буйство Шторма на 4 заброса');
  });
}
function triggerPrimordialChaos(source='Заброс'){
  const sessionDate=state.sessionDate;state=initialState();state.sessionDate=sessionDate;state.weatherSeen=[state.weather];state.mythic.primordialChaos=true;
  const chain=source==='Фрагмент угасшей реликвии'?'Фрагмент угасшей реликвии → Искра Хаоса → Первобытный хаос':`${source} → Искра Хаоса → Первобытный хаос`;
  addHistory('Первобытный хаос поглощает реальность.','mythic',`${chain}<br>Пространство разрывается.<br>Время обращается вспять.<br>Экспедиция начинается заново`,{numbered:false});
  showVisualEffect('mythic','ϟ','ПЕРВОБЫТНЫЙ ХАОС',chain,2400,false,false);commitState();
}
function executeCatchDescriptor(d,parentHistoryId=null){
  if(['normal','heavy','giant'].includes(d.type)){
    const f=makeFish(d.type,'Заброс',!parentHistoryId,{initialWeight:d.weight,fishName:d.fishName,parentHistoryId});
    if(d.fixed)f.tags.push('предсказано Оком Шторма');
    return f;
  }
  if(d.type==='trash')return processTrash(d.name);
  if(d.type==='bonus')return processBonus(d.name);
  if(d.type==='coin')return processCoinCatch(d.coinType);
  if(d.type==='epic')return processEpic(d.name);
  if(d.type==='legendary')return processLegendary(d.name);
  if(d.type==='mythic')return processMythic(d.name);
}
function nextEyeDescriptor(){
  const cycle=(state.mythic.eyeCycles||[]).find(x=>x.remaining>0);if(!cycle)return null;
  let d;if(cycle.mode==='accepted')d={...cycle.predictions[cycle.index],fixed:true};
  else if(cycle.step<3)d=chance(.75)?mythicCatchDescriptor():{...cycle.predictions[cycle.step],fixed:true};
  else d=mythicCatchDescriptor();
  cycle.index++;cycle.remaining--;cycle.step++;
  const artifact=state.artifacts.find(a=>a.id===cycle.id);if(!cycle.remaining&&artifact)artifact.eyeStatus='exhausted';
  return d;
}
function advanceMythicAfterCast(mainRow){
  let forcedRift=false;
  activeMythics('Искра Хаоса').forEach(spark=>{if(spark.createdCast===state.castClicks||spark.sparkRemaining<=0)return;spark.sparkRemaining--;if(spark.sparkRemaining===0){spark.used=true;forcedRift=true;}});
  activeMythics('Нить Сифонофоры').forEach(thread=>{
    if(thread.createdCast===state.castClicks)return;
    if(chance(thread.threadChance||.30)){const category=pick(['normal','heavy','giant']);makeFish(category,'Заброс',false,{parentHistoryId:mainRow?.id||null});if(mainRow)appendHistoryDetailById(mainRow.id,'Нить Сифонофоры добавила дополнительную рыбу');}
    thread.threadChance=Math.min(1,(thread.threadChance||.30)+.01);
  });
  return forcedRift;
}
function activateDeepThing(source='Глубоководное нечто') {
  state.deepThingActive=true;
  const items=state.trash.filter(t=>!t.converted);
  state.deepThingConvertedCount+=items.length;
  syncDeepThingConversionDetails();
  items.forEach(item=>transmuteTrash(item,source));
}
function activateMegalodon() {
  const recoverableEaten=state.eaten.filter(f=>!f.islandColossus),recoveredIds=new Set([...state.stolen,...recoverableEaten,...state.fish.filter(f=>f.debuffLimited&&!f.islandColossus)].map(f=>f.id));
  const recoveryCount=recoveredIds.size;
  if (activeDebuff('Касатка') || state.eaten.length) state.orcaNeutralized=true;
  state.recoveredByMegalodonCount+=recoveryCount;
  state.megalodon=true;
  state.debuffs.forEach(d=>d.active=false);
  [...state.stolen,...recoverableEaten].forEach(f=>{f.removed=false;if(!state.fish.includes(f))state.fish.push(f);setFishHistoryEaten(f,false);setFishHistoryStolen(f,false);});
  state.stolen=[];state.eaten=state.eaten.filter(f=>f.islandColossus);
  state.fish.forEach(f=>{if(f.debuffLimited){const before=f.weight,restored=Number.isFinite(f.unrestrictedWeight)?f.unrestrictedWeight:Math.max(f.weight,f.originalWeight);f.weight=round1(restored);f.debuffLimited=false;f.megalodonImpact={before,after:f.weight};delete f.debuffBaseWeight;delete f.preDebuffWeight;delete f.unrestrictedWeight;}});
  appendLatestHistoryDetail('legendary',`Все дебафы нейтрализованы; восстановлено рыб: ${recoveryCount}`);
}

function encounterAngus(fromCompass=false) {
  playSound('angus'); showVisualEffect('angus',characterIconMarkup('angus','is-effect-icon'),'Старина Ангус','Опытный рыбак появился у берега',1450,false,false); state.angusEncounters++; if(fromCompass)state.angusFromCompass=true;
  const angusRow=addHistory('Появился старина Ангус','angus',fromCompass?'Призван повторным Компасом':'Случайная встреча');
  if (chance(.05)) {
    if (chance(.85)) {
      const artifact=pick(DATA.epics);appendHistoryDetailById(angusRow.id,`Ангус подарил эпический артефакт «${artifact}»`);const giftRow=processEpic(artifact,true);giftRow.mergedIntoHistoryId=angusRow.id;angusRow.mergedHistoryRowId=giftRow.id;renderHistory();
    } else {
      const artifact=pick(DATA.legendary);state.angusLegendaryGift=true;appendHistoryDetailById(angusRow.id,`Ангус подарил легендарный артефакт «${artifact}»`);const giftRow=processLegendary(artifact,true);giftRow.mergedIntoHistoryId=angusRow.id;angusRow.mergedHistoryRowId=giftRow.id;renderHistory();
    }
  } else {
    state.angusGiantGift=true; appendLatestHistoryDetail('angus','Артефакта нет — Ангус добавил рыбу-гиганта'); makeFish('giant','Старина Ангус',false,{parentHistoryId:angusRow.id});
  }
}

// --- Разломы ---------------------------------------------------------------
const RIFT_TYPES=Object.freeze({
  phantom:{name:'Сумрачный разлом: Призрачный шлейф',icon:'👻',short:'Призрачный шлейф',description:'Отражения исчезнувшего улова скрывают свою истинную форму.',relic:'Фантомный осколок'},
  df1:{name:'Забытый разлом: Батисфера DF‑1',icon:'🛟',short:'Батисфера DF‑1',description:'Отсеки погибшей экспедиции стонут под давлением глубины.',relic:'Ядро DF1'},
  currents:{name:'Мерцающий разлом: Разрыв течений',icon:'〰️',short:'Разрыв течений',description:'Несколько будущих существуют одновременно — выбрать можно только одно.',relic:'Кристалл расслоения'},
  singularity:{name:'Древний разлом: Сингулярная яма',icon:'⚫',short:'Сингулярная яма',description:'Добыча множится у горизонта событий, пока сингулярность не схлопнулась.',relic:'Осколок сингулярности'},
  unstable:{name:'Нестабильный разлом: Скрытая бездна',icon:'👁️',short:'Скрытая бездна',description:'Выберите закон Бездны, накапливайте добычу и решайте, насколько далеко готовы зайти ради высшей награды.',relic:'Око скрытой бездны'},
  leviathan:{name:'Проклятый разлом: Печать Левиафана',icon:'🐉',short:'Печать Левиафана',description:'Каждый разрушенный слой печати пробуждает запретную силу.',relic:'Печать Левиафана'},
  gates:{name:'Обсидиановый разлом: Врата глубин',icon:'🗿',short:'Врата глубин',description:'Древние руны открывают путь к сокровищу — или к пустоте.',relic:'Обсидиановый ключ'},
  crimson:{name:'Багровый разлом: Сердце бездны',icon:'🫀',short:'Сердце бездны',description:'Сердце требует жертву, чтобы преобразовать её в нечто большее.',relic:'Сердце бездны'}
});
const RIFT_BACKGROUND_PATHS=Object.freeze(Object.fromEntries(
  Object.keys(RIFT_TYPES).map(type=>[type,`./assets/rifts/${type}.jpg`])
));
Object.values(RIFT_BACKGROUND_PATHS).forEach(path=>{const image=new Image();image.src=path;});
const RIFT_RELIC_INFO=Object.freeze({
  'Фантомный осколок':'Срабатывает автоматически: один раз возвращает первую рыбу, которую должна украсть Чайка или съесть Касатка.',
  'Ядро DF1':'Используется вручную один раз: показывает основной результат следующего заброса. Результат можно зафиксировать или уничтожить без расхода лимита забросов. В обоих случаях Ядро расходуется.',
  'Кристалл расслоения':'Используется вручную один раз: после следующей пойманной удочкой рыбы предлагает оставить её или необратимо раскрыть второй результат.',
  'Осколок сингулярности':'Используется вручную один раз: превращает в гиганта выбранную рыбу, пойманную обычным забросом вне Разлома. Выбор можно отменить без расходования реликвии.',
  'Око скрытой бездны':'Используется вручную один раз: предотвращает следующее негативное событие и даёт следующей рыбе +5 кг.',
  'Печать Левиафана':'Используется вручную один раз: увеличивает вес выбранного тяжеловеса на 25–40%, после чего гарантирует опасное событие.',
  'Обсидиановый ключ':'Активируется вручную и расходуется после выбора: при следующей автоматической смене погоды позволяет выбрать один из двух случайных вариантов.',
  'Сердце бездны':'Используется вручную один раз: поглощает две выбранные рыбы и создаёт одну новую, качество которой зависит от жертв.'
});
const RIFT_DEPTH_NAMES=['','Кромка','Глубина','Сердце','За горизонтом'];
const riftUid=()=>uid();
function ensureRifts(){ const base=initialState().rifts; state.rifts={...base,...(state.rifts||{})}; if(!Array.isArray(state.rifts.feats))state.rifts.feats=[]; if(!Array.isArray(state.rifts.relics))state.rifts.relics=[]; if(!Array.isArray(state.rifts.temporaryEffects))state.rifts.temporaryEffects=[]; }
function riftReward(kind,count=1,extra={}){return {id:riftUid(),kind,count,...extra};}
function riftFishReward(rarity='rare',count=1,extra={}){
  const category=extra.category||(rarity==='giant'?'giant':rarity==='heavy'||rarity==='legendary'?'heavy':'normal');
  return riftReward('fish',count,{rarity,category,...extra});
}
function riftTradeReward(count=1){
  const item=pick(TRADE_ITEMS);
  return riftReward('trade',count,{key:item.key,name:item.name,icon:item.icon});
}
function riftLootEffectIcon(item,extraClass=''){
  const name=String(item?.name||'');
  if(name.startsWith('Дар печати'))return riftRelicIcon('Печать Левиафана',extraClass);
  return riftTemporaryEffectIconMarkup(item,extraClass)||riftRelicIcon('Ядро DF1',extraClass);
}
function riftTradeLootIcon(item,extraClass=''){
  return tradeItemIconMarkup(item?.key?item:TRADE_ITEMS[0],extraClass);
}
function addRiftLoot(...items){const r=state.rifts.active;if(!r)return;items.flat().filter(Boolean).forEach(item=>r.loot.push(item));}
function riftLootText(item){
  if(item.kind==='ghost')return `${riftRelicIcon('Фантомный осколок','is-loot-icon')} Неопознанный призрачный улов${item.count>1?` ×${item.count}`:''}`;
  if(item.kind==='fish')return `${riftLootCategoryIcons(item)} рыба${item.count>1?` ×${item.count}`:''}`;
  if(item.kind==='relic')return `<span class="rift-loot-entity">${riftRelicIcon(item.name,'is-loot-icon')}<span class="rift-loot-entity-copy">${item.name}${item.count>1?` ×${item.count}`:''}</span></span>`;
  if(item.kind==='effect'){
    const [title,...detail]=String(item.name||'').split(':');
    return `<span class="rift-loot-entity is-effect"><span class="rift-loot-entity-copy"><strong>${title}${detail.length?':':''}</strong>${detail.length?`<small>${detail.join(':').trim()}</small>`:''}</span></span>`;
  }
  if(item.kind==='trade')return `${riftTradeLootIcon(item,'is-loot-icon')} ${item.name||'Предмет обмена'}${item.count>1?` ×${item.count}`:''}`;
  if(item.kind==='shard')return `${item.name==='Осколок сингулярности'?riftRelicIcon('Осколок сингулярности','is-loot-icon'):riftRelicIcon('Сердце бездны','is-loot-icon')} ${item.name}${item.count>1?` ×${item.count}`:''}`;
  return item.name||item.kind;
}
function riftWeighted(table){return weightedResult(table);}
function randomRiftFish(table={rare:45,epic:30,heavy:15,legendary:8,giant:2}){return riftFishReward(riftWeighted(table));}
function riftChoiceButton(label,value,description=''){return `<button type="button" data-rift-choice="${value}"><strong>${label}</strong>${description?`<span>${description}</span>`:''}</button>`;}
function setRiftChoices(items,handler){
  const box=$('riftChoices'),bound=state.rifts?.active?{id:state.rifts.active.id,type:state.rifts.active.type}:null;
  box.innerHTML=items.join('');
  box.classList.remove('is-sacrifice-picker');
  box.classList.toggle('is-dense',items.length>6);
  box.classList.toggle('is-ultra-dense',items.length>12);
  box.dataset.riftId=bound?.id||'';box.dataset.riftType=bound?.type||'';
  box.onclick=e=>{
    const b=e.target.closest('[data-rift-choice]');if(!b||b.disabled)return;
    const active=state.rifts?.active;
    if(!bound||!active||active.id!==bound.id||active.type!==bound.type){console.warn('Устаревший обработчик Разлома отклонён',bound,active?{id:active.id,type:active.type}:null);return;}
    handler(b.dataset.riftChoice,active);
  };
}
function riftGaugeText(r){
  if(r.type==='df1')return `Давление корпуса: ${Math.max(0,r.gauge)}%`;
  if(r.type==='leviathan')return `Сон Левиафана: ${r.gauge} из 3`;
  if(r.type==='crimson')return `Пульс Сердца: ${r.gauge} из 3`;
  if(r.type==='singularity')return `Множитель добычи: ×${r.multiplier||1}`;
  if(r.type==='gates')return r.depth<=1?'Выберите ведущую руну':`Снижение финального риска: −${Math.round((r.gateRiskModifier||0)*100)}%`;
  return `Глубина: ${RIFT_DEPTH_NAMES[r.depth]||r.depth}`;
}
function riftMonitorInfo(r){
  const hidden=(r.loot||[]).filter(item=>item.kind==='ghost').reduce((sum,item)=>sum+(item.count||1),0);
  const sacrifices=(r.sacrifices||[]).length;
  const info={
    phantom:[hidden?`Скрытых отражений: ${hidden}`:'Призрачный контур',r.status==='offer'?'Истинная форма добычи скрыта':r.depth>=3?'Отражения готовы к воплощению':'Сигнатуры улова нестабильны'],
    df1:[`Целостность корпуса: ${Math.max(0,r.gauge)}%`,r.gauge<35?'Критическое давление':r.status==='offer'?'Корпус ожидает погружения':'Давление глубины растёт'],
    currents:[`Линии вероятности: ${r.depth?Math.max(1,4-r.depth):3}`,r.status==='offer'?'Будущие ещё не разделены':'Ложные течения искажают прогноз'],
    singularity:[`Множитель добычи: ×${r.multiplier||1}`,r.depth>=3?'Горизонт событий предельно близко':r.status==='offer'?'Гравитация стабильна':'Риск схлопывания возрастает'],
    unstable:[r.protected?'Правило: защита активна':'Правило: исход неизвестен',r.status==='offer'?'Бездна ещё не выбрала законы':'Следующий символ может изменить правила'],
    leviathan:[`Пробуждение: ${r.gauge||0} из 3`,r.gauge>=2?'Печать почти разрушена':r.status==='offer'?'Печать находится в покое':'Активность Левиафана растёт'],
    gates:[r.gatePath?`Ведущая руна: ${r.gatePathLabel}`:'Ведущая руна не выбрана',r.gateMode?`Настройка: ${r.gateMode}`:r.status==='offer'?'Врата ожидают проводника':'Выберите понятный уровень риска'],
    crimson:[`Пульс Сердца: ${r.gauge||0} из 3`,sacrifices?`Принято жертв: ${sacrifices}`:r.status==='offer'?'Сердце ожидает проводника':'Требование жертвы не определено']
  };
  return info[r.type]||[riftGaugeText(r),'Параметры аномалии обновляются'];
}
function renderRift(){
  ensureRifts();const r=state.rifts.active,dialog=$('riftDialog');if(!r){stopRiftAmbient();if(dialog?.open)dialog.close();return;}
  dialog.dataset.riftType=r.type;
  const card=dialog.querySelector('.rift-card');
  card?.style.setProperty('--rift-background',`url("${RIFT_BACKGROUND_PATHS[r.type]}")`);
  card?.classList.toggle('has-rift-loot',r.loot.length>0);
  card?.classList.toggle('is-awaiting-choice',Boolean(r.awaitingChoice));
  const def=RIFT_TYPES[r.type],monitor=riftMonitorInfo(r);$('riftMonitorTitle').textContent=monitor[0];$('riftMonitorDetail').textContent=monitor[1];$('riftTitle').textContent=def.name;$('riftDescription').textContent=def.description;$('riftGauge').textContent=riftGaugeText(r);
  $('riftKicker').textContent=r.status==='offer'?'Обнаружен Разлом':`${RIFT_DEPTH_NAMES[r.depth]||'Исследование'} • этап ${Math.min(r.depth,3)} из 3`;
  $('riftDepth').innerHTML=[1,2,3].map(i=>`<span class="${i<r.depth?'done':i===r.depth?'active':''}">${i===1?'I':i===2?'II':'III'}<small>${RIFT_DEPTH_NAMES[i]}</small></span>`).join('');
  $('riftMessage').innerHTML=r.message||'';$('riftLoot').innerHTML=r.loot.length?`<ul>${r.loot.map(x=>`<li>${riftLootText(x)}</li>`).join('')}</ul>`:'<span class="muted">Пока ничего не найдено</span>';
  const leave=$('riftLeaveBtn'),next=$('riftContinueBtn');leave.hidden=false;next.hidden=false;
  if(r.status==='offer'){leave.textContent='Остаться на поверхности';next.textContent='Исследовать Разлом';$('riftLoot').innerHTML='<span class="muted">Добыча скрыта за границей Разлома</span>';}
  else{leave.textContent='Забрать добычу и выйти';next.textContent=r.depth>=3&&r.type!=='singularity'?'Завершить исследование':'Исследовать глубже';}
  if(r.awaitingChoice){leave.hidden=true;next.hidden=true;}
  if(!dialog.open)dialog.showModal();
}
function makeRift(type,forced=false){
  ensureRifts();const def=RIFT_TYPES[type];state.rifts.naturalOpened=state.rifts.naturalOpened||!forced;
  state.rifts.active={id:riftUid(),type,status:'offer',depth:0,loot:[],sacrifices:[],choices:[],feats:[],gauge:type==='df1'?100:0,multiplier:1,errors:0,protected:false,message:`<strong>Пространство под водой исказилось.</strong><br>Открыт ${def.name}.<br>Войти в неизвестность?`};
  const row=addHistory(`Открыт ${def.name}`,'rift','(Исследование Разлома начато)',{numbered:false,riftType:type,riftId:state.rifts.active.id});
  state.rifts.active.historyRowId=row.id;playSound('riftOpen');renderRift();saveDailyState();
}
function maybeOpenRiftAfterCast(){
  ensureRifts();if(state.rifts.naturalOpened||state.rifts.active||state.finished||state.castClicks<=1||state.castsLeft<=0||$('choiceDialog')?.open||hasPendingAbyssalDecision())return false;
  const p=BALANCE.rifts.spawnChance[state.weather]||0;if(!p||!chance(p))return false;
  makeRift(pick(Object.keys(RIFT_TYPES)));return true;
}
function riftHistoryRow(r){
  if(!r)return null;
  return state.history.find(row=>row.id===r.historyRowId)||[...state.history].reverse().find(row=>row.type==='rift'&&row.riftType===r.type&&!row.riftResolved);
}
function resolveRiftHistory(r,detail){
  const row=riftHistoryRow(r);if(!row)return null;
  row.text=`Открыт ${RIFT_TYPES[r.type].name}`;row.detail=detail?`(${detail})`:'';row.riftResolved=true;renderHistory();return row;
}
function declineRift(){const r=state.rifts.active;if(!r)return;state.rifts.declined++;resolveRiftHistory(r,'Исследование отклонено • без последствий');state.rifts.active=null;renderRift();commitState();}
function failRift(reason='Критический провал уничтожил накопленную добычу.',expectedRift=null){
  const r=state.rifts.active;if(!r)return false;
  if(expectedRift&&(r.id!==expectedRift.id||r.type!==expectedRift.type)){console.warn('Провал другого Разлома отклонён',{expected:{id:expectedRift.id,type:expectedRift.type},active:{id:r.id,type:r.type},reason});return false;}
  if(r.guaranteedSuccess){r.awaitingChoice=false;r.message=`Ядро бездны переписало неудачный исход.<br><small>${reason} Следующая попытка этого этапа гарантированно безопасна.</small>`;setRiftChoices([],()=>{});renderRift();saveDailyState();toast('Ядро бездны предотвратило провал');return true;}
  if(r.protected){
    r.protected=false;r.awaitingChoice=false;
    r.message=`🛡️ Защита Скрытой бездны предотвратила схлопывание.<br><small>Рискованная награда потеряна, накопленная добыча сохранена. Решение о выходе остаётся за вами.</small>`;
    setRiftChoices([],()=>{});
    appendHistoryDetailById(riftHistoryRow(r)?.id,`Защита Скрытой бездны предотвратила схлопывание • ${reason} • рискованная награда потеряна; накопленная добыча сохранена`);
    renderRift();saveDailyState();toast('Защита сохранила добычу — решите, выходить ли из Разлома');return true;
  }
  (r.sacrifices||[]).forEach(f=>{const original=state.fish.find(x=>x.id===f.id);if(original)original.removed=true;});
  state.rifts.failed++;resolveRiftHistory(r,`Разлом схлопнулся: добыча потеряна • ${reason}`);state.rifts.active=null;renderRift();commitState();toast('Разлом схлопнулся — его добыча потеряна');return true;
}
function addRiftRelic(name,type,parentHistoryId=null){
  state.rifts.relics.push({id:riftUid(),name,type,used:false,historyRowId:parentHistoryId});
  if(!parentHistoryId)addHistory(`Получена реликвия: ${name}`,'rift',`(${RIFT_RELIC_INFO[name]||'Одноразовая реликвия действует до конца текущей сессии.'})`,{numbered:false,relicName:name,relicEvent:'acquired'});
  maybeTransformFadedRelicFragment(`реликвию «${name}»`);
}
function maybeTransformFadedRelicFragment(trigger){
  ensureIslands();if((state.islands.fadedRelicFragments||0)<=0||state.islands.transformingFadedFragment||state.islands.pendingFadedFragmentTrigger)return false;state.islands.pendingFadedFragmentTrigger=trigger;setTimeout(resolveFadedRelicFragment,0);return true;
}
function resolveFadedRelicFragment(){
  ensureIslands();if($('choiceDialog')?.open||!state.islands.pendingFadedFragmentTrigger||(state.islands.fadedRelicFragments||0)<=0)return false;const trigger=state.islands.pendingFadedFragmentTrigger;state.islands.pendingFadedFragmentTrigger=null;
  state.islands.fadedRelicFragments--;state.islands.transformingFadedFragment=true;const fragmentItem=(state.tradeItems||[]).find(x=>x.key==='fadedRelicFragment'&&!x.exchanged);if(fragmentItem){fragmentItem.exchanged=true;fragmentItem.exchangeReason='transformed';}
  const roll=Math.random(),result=roll<.85?{tier:'epic',name:pick(DATA.epics)}:roll<.97?{tier:'legendary',name:pick(DATA.legendary)}:{tier:'mythic',name:pick(DATA.mythic)};
  addHistory('Фрагмент угасшей реликвии пробудился','island',`(${trigger} вызвал превращение • ${result.tier==='epic'?'эпический':result.tier==='legendary'?'легендарный':'мифический'} артефакт: ${result.name})`,{numbered:false});
  if(result.tier==='epic')processEpic(result.name);else if(result.tier==='legendary')processLegendary(result.name);else processMythic(result.name,'Фрагмент угасшей реликвии');
  state.islands.transformingFadedFragment=false;commitState();return true;
}
function commitRiftFish(item,riftType,parentHistoryId=null){
  for(let i=0;i<(item.count||1);i++){
    const tiers={
      rare:{weights:[40,50],names:DATA.riftRare},
      epic:{weights:[50,65],names:DATA.riftEpic},
      legendary:{weights:[65,80],names:DATA.riftLegendary}
    };
    const tier=tiers[item.rarity];
    const options=tier?{initialWeight:rand1(...tier.weights),fishName:pick(tier.names),rarity:item.rarity,parentHistoryId}:{rarity:item.rarity,parentHistoryId};
    const f=makeFish(item.category||'normal',`Разлом: ${RIFT_TYPES[riftType].short}`,false,options);
    f.riftFish=true;f.riftType=riftType;f.rarity=item.rarity;if(item.weightMultiplier)f.weight=round1(f.weight*item.weightMultiplier);if(item.weightAdd)f.weight=round1(f.weight+item.weightAdd);
  }
}
function commitRiftLoot(r){
  const parentHistoryId=riftHistoryRow(r)?.id||null;
  const orderedLoot=[...r.loot.filter(item=>item.kind==='fish'),...r.loot.filter(item=>item.kind!=='fish')];
  orderedLoot.forEach(item=>{
    if(item.kind==='fish')commitRiftFish(item,r.type,parentHistoryId);
    else if(item.kind==='relic')for(let i=0;i<(item.count||1);i++)addRiftRelic(item.name,r.type,parentHistoryId);
    else if(item.kind==='effect')state.rifts.temporaryEffects.push({id:riftUid(),name:item.name,type:item.effectType||'weight',casts:item.casts||3,value:item.value||1.25});
    else if(item.kind==='trade'){for(let i=0;i<(item.count||1);i++){const d=tradeItemByKey(item.key)||pick(TRADE_ITEMS);state.tradeItems.push({id:uid(),key:d.key,name:d.name,icon:d.icon,fishId:null,historyRowId:null,exchanged:false,riftItem:true});}}
    else if(item.kind==='shard'&&item.name==='Осколок сингулярности')for(let i=0;i<(item.count||1);i++)addRiftRelic('Осколок сингулярности',r.type,parentHistoryId);
    else if(item.kind==='shard'&&item.name==='Багровый осколок')state.rifts.temporaryEffects.push({id:riftUid(),name:'Багровый осколок: следующая рыба +15%',type:'weight',casts:1,value:1.15});
  });
}
function exitRift(){const r=state.rifts.active;if(!r)return;resolveGhostLoot(r);commitRiftLoot(r);const historyRow=riftHistoryRow(r),parentHistoryId=historyRow?.id||null;if(historyRow)historyRow.riftLootResults=r.loot.filter(item=>item.kind!=='fish'&&item.kind!=='ghost').map(item=>item.kind==='shard'&&item.name==='Осколок сингулярности'?{kind:'relic',name:item.name,count:item.count||1}:item.kind==='shard'&&item.name==='Багровый осколок'?{kind:'effect',name:'Багровый осколок: следующая рыба +15%',count:item.count||1}:{kind:item.kind,name:item.name||'',key:item.key||'',icon:item.icon||'',count:item.count||1});const mythic=chance(BALANCE.artifacts.mythicRiftChance)?pick(DATA.mythic):null;if(mythic)processMythic(mythic,`Добыча Разлома: ${RIFT_TYPES[r.type].short}`,parentHistoryId);if(mythic&&!state.rifts.active){commitState();return;}state.rifts.completed++;const maxDepth=r.type==='singularity'?4:3;if(r.depth>=maxDepth)state.rifts.maxDepthCompleted=true;(r.feats||[]).forEach(feat=>{if(!state.rifts.feats.includes(feat))state.rifts.feats.push(feat);});resolveRiftHistory(r,'');state.rifts.active=null;renderRift();if(!abyssalEntity()&&chance(BALANCE.abyssal.riftExitChance))catchAbyssalLife('rift');commitState();toast('Добыча Разлома добавлена к улову');if(state.castsLeft<=0)maybeFinalizeSession();}
function resolveGhostLoot(r){if(r.type!=='phantom')return;const resolved=[];r.loot.forEach(item=>{if(item.kind!=='ghost'){resolved.push(item);return;}for(let i=0;i<(item.count||1);i++){if(item.mode==='mixed'){const kind=riftWeighted({fish:70,phantom:20,empty:10});if(kind==='fish')resolved.push(randomRiftFish());if(kind==='phantom')resolved.push(riftReward('relic',1,{name:'Фантомный осколок'}));}else resolved.push(randomRiftFish());}});r.loot=resolved;}
function isRiftFish(f){return Boolean(f?.riftFish||['rare','epic','legendary'].includes(f?.rarity));}
function isOrdinaryFish(f){return Boolean(f&&!isRiftFish(f)&&f.category==='normal');}
function isNaturalHeavy(f){return Boolean(f&&!isRiftFish(f)&&f.category==='heavy');}
function isRiftRare(f){return Boolean(isRiftFish(f)&&f.rarity==='rare');}
function riftSacrificeQuality(f){if(!f)return 0;if(isRiftFish(f)){if(f.rarity==='legendary')return 5;if(f.rarity==='epic')return 4;if(f.rarity==='rare')return 3;}if(f.category==='giant')return 3;if(f.category==='heavy')return 2;return 1;}
function availableSacrificeFish(predicate=()=>true){return state.fish.filter(f=>!f.removed&&!f.tradeFish&&!f.riftSacrificed&&predicate(f));}
function takeSacrifice(id,r){const f=state.fish.find(x=>x.id===id);if(!f||f.removed||f.tradeFish)return null;f.riftSacrificed=true;f.removed=true;r.sacrifices.push({id:f.id,name:f.name,category:f.category,rarity:f.rarity,riftFish:isRiftFish(f),source:f.source,weight:f.weight});setFishHistorySacrificed(f,r.type);return f;}
function selectSacrifice(r,prompt,predicate,onDone,allowRisk=true){
  const fish=availableSacrificeFish(predicate);r.message=prompt;renderRift();const items=fish.map(f=>riftChoiceButton(`${capitalize(f.name)} — ${kg(f.weight)}`,f.id));if(allowRisk)items.push(riftChoiceButton('Не отдавать ничего','none','Продолжить с повышенным риском'));setRiftChoices(items.length?items:[riftChoiceButton('Подходящей рыбы нет — рискнуть','none')],v=>onDone(v==='none'?null:takeSacrifice(v,r)));$('riftChoices')?.classList.add('is-sacrifice-picker');
}
function beginRift(){const r=state.rifts.active;if(!r)return;r.status='active';r.depth=1;startRiftAmbient();runRiftStage(r);}
function continueRift(){const r=state.rifts.active;if(!r)return;if(r.status==='offer'){beginRift();return;}if(r.awaitingChoice)return;if(r.resumeInterruptedStage){delete r.resumeInterruptedStage;runRiftStage(r);return;}if(r.type==='singularity'&&r.depth===3){r.depth=4;runRiftStage(r);return;}if(r.depth>=3){exitRift();return;}r.depth++;runRiftStage(r);}
function stageDone(r,text){r.awaitingChoice=false;r.message=`✅ ${text}<br><small>Можно забрать накопленное или продолжить исследование.</small>`;setRiftChoices([],()=>{});renderRift();saveDailyState();}
function runRiftStage(r){r.awaitingChoice=true;setRiftChoices([],()=>{});const fn=RIFT_STAGE_HANDLERS[r.type];fn(r,r.depth);saveDailyState();}

const RIFT_STAGE_HANDLERS={
  phantom(r,d){
    if(d===1){addRiftLoot(riftReward('ghost'));stageDone(r,'Найдена закрытая призрачная карта. Результат раскроется только при выходе.');return;}
    const risk=d===2?BALANCE.rifts.phantom.level2Fail:BALANCE.rifts.phantom.level3Fail;if(chance(risk)){failRift('Призрачный шлейф рассеял все отражения.',r);return;}
    if(d===2){r.loot.filter(x=>x.kind==='ghost').forEach(x=>x.mode='mixed');addRiftLoot(riftReward('ghost',1,{mode:'mixed'}));stageDone(r,'Первый призрак усилился, рядом возникло второе отражение.');return;}
    addRiftLoot(riftReward('ghost',1,{mode:'mixed'}));r.message='Зеркало утонувших требует выбрать печать.';renderRift();setRiftChoices([riftChoiceButton('Печать воплощения','reveal','Раскрыть все карты без повышения редкости'),riftChoiceButton('Печать слияния','merge','Объединить карты в один более сильный исход')],v=>{if(v==='merge'){const prize=randomRiftFish({epic:40,heavy:30,legendary:20,giant:10});r.loot=[prize];if(['legendary','giant'].includes(prize.rarity))r.feats.push('phantomMerge');}stageDone(r,v==='merge'?'Отражения слились в единую форму.':'Все отражения готовы воплотиться при выходе.');});
  },
  df1(r,d){
    if(d===1){r.message='Выберите отсек внешнего шлюза.';renderRift();setRiftChoices([riftChoiceButton('Грузовой отсек','cargo','Рыба или предмет обмена'),riftChoiceButton('Научный отсек','science','Усиление и информация')],v=>{r.gauge-=Math.floor(rand(10,26));addRiftLoot(v==='cargo'?(chance(.65)?randomRiftFish({rare:65,heavy:30,epic:5}):riftTradeReward()):riftReward('effect',1,{name:'Калибровка DF1: следующие 3 рыбы обычного или аркадного улова +25%',casts:3,value:1.25}));stageDone(r,`Отсек вскрыт. Корпус выдержал, осталось ${r.gauge}% давления.`);});return;}
    if(d===2){const rooms=[{v:'samples',n:'Хранилище образцов',risk:'стабильный',dmg:[8,19]},{v:'core',n:'Энергетическое ядро',risk:'повреждённый',dmg:[18,33]},{v:'captain',n:'Каюта капитана',risk:'критический',dmg:[30,49]}];r.message='Журнал экипажа отмечает состояние отсеков. Точные повреждения неизвестны.';renderRift();setRiftChoices(rooms.map(x=>riftChoiceButton(x.n,x.v,`${x.risk} отсек`)),v=>{const room=rooms.find(x=>x.v===v);r.gauge-=Math.floor(rand(...room.dmg));if(r.gauge<=0){failRift('Корпус DF1 разрушен при вскрытии отсека.',r);return;}if(v==='samples')addRiftLoot(chance(.12)?riftFishReward('giant'):randomRiftFish({rare:70,epic:25,heavy:5}));if(v==='core')addRiftLoot(riftReward('relic',1,{name:'Ядро DF1'}));if(v==='captain')addRiftLoot(chance(.45)?riftFishReward('legendary'):riftFishReward('heavy'));stageDone(r,`Отсек открыт. Давление корпуса: ${r.gauge}%.`);});return;}
    const success=r.gauge>=70?.85:r.gauge>=40?.65:r.gauge>=20?.40:.20;if(!chance(success)){failRift('Скачок давления уничтожил батисферу и добычу экспедиции.',r);return;}const prize=pick([riftFishReward('legendary'),riftFishReward('giant'),riftFishReward('heavy',2),riftReward('relic',1,{name:'Ядро DF1'})]);addRiftLoot(prize);if(r.gauge<=20)r.feats.push('df1Critical');stageDone(r,'Чёрный ящик DF1 извлечён. Главная награда экспедиции найдена.');
  },
  currents(r,d){
    if(d===1){r.message='Два будущих расходятся перед вами.';renderRift();setRiftChoices([riftChoiceButton('Голубое течение','blue','Безопаснее: редкая добыча, провал 10%'),riftChoiceButton('Фиолетовое течение','purple','Тяжёлая и легендарная добыча, провал 25%')],v=>{if(chance(v==='blue'?.10:.25)){failRift('Выбранное течение оказалось пустой вероятностью.',r);return;}addRiftLoot(v==='blue'?randomRiftFish({rare:75,epic:20,legendary:5}):randomRiftFish({heavy:45,epic:25,legendary:25,giant:5}));stageDone(r,'Одно течение стало реальностью, второе исчезло.');});return;}
    if(d===2){const falseFlow=pick(['deep','shine','storm']);r.falseFlow=falseFlow;r.message='Свет в одном из течений кажется неестественным.';renderRift();setRiftChoices([riftChoiceButton('Глубокий поток','deep','Усиляет вес'),riftChoiceButton('Сияющий поток','shine','Повышает редкость'),riftChoiceButton('Бурный поток','storm','Удваивает число наград')],v=>{if(v===falseFlow){failRift('Ложный поток обнулил накопленную вероятность.',r);return;}if(v==='deep')r.loot.filter(x=>x.kind==='fish').forEach(x=>x.weightMultiplier=(x.weightMultiplier||1)*1.5);if(v==='shine')r.loot.filter(x=>x.kind==='fish').forEach(x=>x.rarity=x.rarity==='rare'?'epic':x.rarity==='epic'?'legendary':x.rarity);if(v==='storm')r.loot.forEach(x=>x.count=(x.count||1)*2);stageDone(r,'Поток изменил накопленную добычу.');});return;}
    r.message='Добыча разделилась на две версии реальности.';renderRift();setRiftChoices([riftChoiceButton('Стабильная реальность','stable','Гарантированно сохранить добычу'),riftChoiceButton('Искажённая реальность','distorted','Сильный эффект или полное обнуление')],v=>{if(v==='distorted'){const outcome=riftWeighted({giants:15,rarity:30,double:25,void:30});if(outcome==='void'){failRift('Искажённая реальность обнулилась.',r);return;}r.feats.push('currentsDistorted');if(outcome==='giants')r.loot.filter(x=>x.kind==='fish').forEach(x=>{if(x.rarity==='rare')x.rarity='epic';else if(x.rarity==='epic')x.rarity='legendary';else x.weightMultiplier=(x.weightMultiplier||1)*1.25;});if(outcome==='rarity')r.loot.filter(x=>x.kind==='fish').forEach(x=>x.rarity=x.rarity==='rare'?'epic':'legendary');if(outcome==='double')r.loot.forEach(x=>x.count=(x.count||1)*2);}addRiftLoot(riftReward('relic',1,{name:'Кристалл расслоения'}));stageDone(r,v==='stable'?'Стабильная реальность закреплена.':'Искажённая реальность повысила класс добычи, не разрушив её ценность.');});
  },
  singularity(r,d){
    if(chance(BALANCE.rifts.singularity[d])){failRift('Сингулярность схлопнулась вместе со всей добычей.',r);return;}r.multiplier=d===1?1:d===2?2:d===3?4:8;
    if(d===1)addRiftLoot(randomRiftFish({rare:70,epic:30}),riftReward('shard',1,{name:'Осколок сингулярности'}));
    if(d===2)r.loot.forEach(x=>x.count=(x.count||1)*2);
    if(d===3){r.loot=r.loot.filter(x=>x.kind!=='fish');addRiftLoot(chance(.12)?riftFishReward('giant'):chance(.45)?riftFishReward('heavy'):riftFishReward('epic',2));}
    if(d===4){r.loot=[];const prize=pick([riftFishReward('giant'),riftFishReward('legendary',2),riftFishReward('legendary',1,{category:'heavy',weightMultiplier:1.5}),riftReward('relic',1,{name:'Осколок сингулярности'})]);addRiftLoot(prize);if(prize.kind==='fish'&&prize.rarity==='legendary'&&prize.count===2)r.feats.push('singularityTwins');}
    stageDone(r,d===4?'Невозможный шаг завершён. Сингулярность отдала высшую награду.':`Добыча стабилизирована с множителем ×${r.multiplier}.${d===3?' Сингулярность ещё не закрылась — доступен тайный шаг.':''}`);
  },
  unstable(r,d){
    if(d===1){
      r.message='Выберите первый закон. Его награда гарантирована, а свойство изменит дальнейший путь.';renderRift();
      setRiftChoices([
        riftChoiceButton('⚓ Закон тяжести','mass','Тяжеловес сейчас; рискованные награды получают +25% веса'),
        riftChoiceButton('🪞 Закон отражения','echo','Две редкие рыбы сейчас; безопасный путь даст две награды'),
        riftChoiceButton('👁️ Закон защиты','ward','Эпическая рыба сейчас; первый критический провал будет предотвращён')
      ],v=>{
        r.unstableLaw=v;
        if(v==='mass')addRiftLoot(riftFishReward('heavy'));
        if(v==='echo')addRiftLoot(riftFishReward('rare',2));
        if(v==='ward'){addRiftLoot(riftFishReward('epic'));r.protected=true;}
        stageDone(r,v==='mass'?'Закон тяжести закреплён. Получен тяжеловес.':v==='echo'?'Закон отражения закреплён. Получены две редкие рыбы.':'Закон защиты закреплён. Получена эпическая рыба и защита от одного провала.');
      });return;
    }
    if(d===2){
      const law=r.unstableLaw||'mass';
      r.message='Текущий закон раскрывает цену каждого пути. Выберите риск осознанно.';renderRift();
      setRiftChoices([
        riftChoiceButton('🔹 Стабилизировать','safe',law==='echo'?'Без риска: получить две редкие рыбы':'Без риска: получить одну редкую рыбу'),
        riftChoiceButton('⚡ Углубить искажение','deep','Риск провала 20%: эпическая рыба или тяжеловес'),
        riftChoiceButton('👑 Нарушить закон','break','Риск провала 35%: легендарная рыба или гигант')
      ],v=>{
        if(v==='safe')addRiftLoot(riftFishReward('rare',law==='echo'?2:1));
        if(v==='deep'){
          if(chance(.20)){failRift('Искажение второго слоя раскрыло пустоту.',r);return;}
          const prize=chance(.55)?riftFishReward('epic'):riftFishReward('heavy');if(law==='mass'&&prize.kind==='fish')prize.weightMultiplier=1.25;addRiftLoot(prize);
        }
        if(v==='break'){
          if(chance(.35)){failRift('Нарушенный закон поглотил накопленную добычу.',r);return;}
          const prize=chance(.5)?riftFishReward('legendary'):riftFishReward('giant');if(law==='mass'&&prize.kind==='fish')prize.weightMultiplier=1.25;addRiftLoot(prize);
        }
        stageDone(r,v==='safe'?'Добыча безопасно стабилизирована.':v==='deep'?'Искажение выдержано — новая добыча закреплена.':'Закон сломан, высшая добыча второго слоя сохранена.');
      });return;
    }
    r.message='Последний слой раскрыт. Глаз гарантирует сохранение; Корона и Пустота предлагают большую награду за известный риск.';renderRift();
    setRiftChoices([
      riftChoiceButton('👁️ Глаз сохранения','keep','Без риска: сохранить всё и получить Око скрытой бездны'),
      riftChoiceButton('👑 Корона откровения','crown','Риск провала 25%: гигант или легендарная рыба и реликвия'),
      riftChoiceButton('⚫ Договор с Пустотой','void','Риск провала 45%: гигант и легендарная рыба плюс реликвия')
    ],v=>{
      const risk=v==='crown'?.25:v==='void'?.45:0;
      if(risk&&chance(risk)){failRift(v==='void'?'Пустота приняла договор и забрала всю добычу.':'Корона откровения оказалась ложной.',r);return;}
      if(v==='crown')addRiftLoot(chance(.5)?riftFishReward('giant'):riftFishReward('legendary'));
      if(v==='void')addRiftLoot(riftFishReward('giant'),riftFishReward('legendary'));
      if(v!=='keep')r.feats.push('unstableRevelation');
      addRiftLoot(riftReward('relic',1,{name:'Око скрытой бездны'}));
      stageDone(r,v==='keep'?'Глаз сохранения закрепил всю добычу.':v==='crown'?'Корона открыла высшую награду.':'Договор с Пустотой пережит — обе высшие награды сохранены.');
    });
  },
  leviathan(r,d){
    if(d===1){r.gauge=1;addRiftLoot(pick([riftFishReward('heavy'),riftReward('effect',1,{name:'Дар печати: следующая рыба +30%',casts:1,value:1.3}),riftReward('relic',1,{name:'Фантомный осколок'})]));stageDone(r,'Внешняя печать разрушена. Сон Левиафана: 1 из 3.');return;}
    if(d===2){r.gauge=2;selectSacrifice(r,'Кровь печати требует обычную рыбу. Жертва снижает риск проклятия.',isOrdinaryFish,f=>{if(chance(f?.1:.3)){failRift('Кровь печати отвергла подношение.',r);return;}addRiftLoot(chance(.55)?riftFishReward('heavy',1,{weightMultiplier:1.35}):riftFishReward('legendary'));stageDone(r,f?'Жертва принята, печать ослабла.':'Печать разрушена без жертвы, но Левиафан проснулся.');});return;}
    r.gauge=3;const outcome=riftWeighted({gift:30,fang:25,wrath:20,awakening:25});if(outcome==='wrath'){failRift('Гнев Левиафана уничтожил добычу Разлома.',r);return;}if(outcome==='gift')addRiftLoot(riftFishReward('heavy',1,{weightMultiplier:2}));if(outcome==='fang')addRiftLoot(riftFishReward('legendary'));if(outcome==='awakening')state.rifts.pendingDanger=true;if(!(r.sacrifices||[]).length)r.feats.push('leviathanBloodless');addRiftLoot(riftReward('relic',1,{name:'Печать Левиафана'}));stageDone(r,outcome==='awakening'?'Пробуждение сохранило добычу, но опасное событие неизбежно.':'Левиафан оставил свой дар.');
  },
  gates(r,d){
    if(d===1){r.message='<strong>Выберите ведущую руну.</strong><br>Здесь нет скрытого правильного ответа: каждая кнопка — открытая стратегия риска и награды.';renderRift();setRiftChoices([
      riftChoiceButton('Руна Прилива','tide','Без риска • редкая рыба'),
      riftChoiceButton('Руна Глубины','depth','Риск 10% • эпическая рыба или тяжеловес'),
      riftChoiceButton('Руна Пустоты','void','Риск 25% • легендарная рыба')
    ],v=>{const data={tide:{label:'Прилив',risk:0,reward:()=>riftFishReward('rare')},depth:{label:'Глубина',risk:.10,reward:()=>chance(.5)?riftFishReward('epic'):riftFishReward('heavy')},void:{label:'Пустота',risk:.25,reward:()=>riftFishReward('legendary')}}[v];if(chance(data.risk)){failRift(`Руна «${data.label}» расколола путь. Добыча Разлома потеряна.`,r);return;}r.gatePath=v;r.gatePathLabel=data.label;r.gateRiskModifier=0;addRiftLoot(data.reward());stageDone(r,`Руна «${data.label}» принята. Выбранный риск ${Math.round(data.risk*100)}% пройден.`);});return;}
    if(d===2){const amplifyRisk={tide:.15,depth:.25,void:.40}[r.gatePath]??.25;r.message=`<strong>Ведущая руна: ${r.gatePathLabel}.</strong><br>Теперь выберите, что сделать с уже открытым маршрутом. Риск и последствия указаны на кнопках.`;renderRift();setRiftChoices([
      riftChoiceButton('Стабилизировать','resonance','Без риска • дополнительная редкая рыба • финальные риски −5%'),
      riftChoiceButton('Усилить руну','amplify',`Риск ${Math.round(amplifyRisk*100)}% • ценная рыба • финальные риски без снижения`),
      riftChoiceButton('Запечатать контур','seal','Без дополнительной рыбы • финальные риски −15%')
    ],v=>{if(v==='amplify'&&chance(amplifyRisk)){failRift(`Усиление руны «${r.gatePathLabel}» разрушило Чёрный коридор.`,r);return;}if(v==='resonance'){r.gateMode='Стабилизация';r.gateRiskModifier=.05;addRiftLoot(riftFishReward('rare'));}if(v==='amplify'){r.gateMode='Усиление';r.gateRiskModifier=0;addRiftLoot(r.gatePath==='void'?chance(.25)?riftFishReward('giant'):riftFishReward('legendary'):r.gatePath==='depth'?riftFishReward('legendary'):riftFishReward('epic'));}if(v==='seal'){r.gateMode='Защитная печать';r.gateRiskModifier=.15;}stageDone(r,v==='amplify'?'Руна усилена. Ценная добыча получена, но финальные Врата не стали безопаснее.':v==='seal'?'Контур запечатан. Новой добычи нет, зато финальные Врата стали значительно безопаснее.':'Маршрут стабилизирован и принёс дополнительную добычу.');});return;}
    const reduction=r.gateRiskModifier||0,treasureRisk=Math.max(0,.25-reduction),creatureRisk=Math.max(0,.35-reduction);r.message=`<strong>Финальные Врата.</strong><br>Подготовка «${r.gateMode||'без настройки'}» изменила риски. Выберите итоговый портал.`;renderRift();setRiftChoices([riftChoiceButton('Врата сокровищ','treasure',`Ценная добыча • риск провала ${Math.round(treasureRisk*100)}%`),riftChoiceButton('Врата существа','creature',`Редкое создание • риск провала ${Math.round(creatureRisk*100)}%`),riftChoiceButton('Врата возвращения','return','Безопасный выход • малая награда')],v=>{const risk=v==='treasure'?treasureRisk:v==='creature'?creatureRisk:0;if(chance(risk)){failRift('Портал закрылся и уничтожил добычу.',r);return;}if(v==='treasure')addRiftLoot(randomRiftFish({epic:40,heavy:30,legendary:20,giant:10}));if(v==='creature'){addRiftLoot(chance(.2)?riftFishReward('giant'):riftFishReward('legendary'));if(r.gatePath&&r.gateMode)r.feats.push('gatesChosen');}if(v==='return')addRiftLoot(riftFishReward('rare'));addRiftLoot(riftReward('relic',1,{name:'Обсидиановый ключ'}));stageDone(r,'Выбранные Врата открылись.');});
  },
  crimson(r,d){
    if(d===1){selectSacrifice(r,'Первый пульс: отдайте обычную или редкую рыбу либо рискните.',f=>isOrdinaryFish(f)||isRiftRare(f),f=>{if(!f&&chance(.20)){failRift('Сердце не услышало первого пульса.',r);return;}r.gauge=1;addRiftLoot(riftReward('shard',1,{name:'Багровый осколок'}));stageDone(r,f?'Жертва принята. Первый пульс стабилен.':'Первый пульс выдержан без жертвы.');});return;}
    if(d===2){selectSacrifice(r,'Кровоток бездны: новая жертва улучшит создаваемую рыбу.',()=>true,f=>{r.gauge=2;const quality=f?riftSacrificeQuality(f):1;addRiftLoot(quality>=5?riftFishReward('legendary'):quality>=3?riftFishReward('epic'):riftFishReward('rare'));stageDone(r,'Сердце преобразовало ценность жертвы в новую форму.');});return;}
    r.message='Сердце готово к последнему преобразованию.';renderRift();setRiftChoices([riftChoiceButton('Преобразование','transform','Слить принесённые жертвы в ценную рыбу'),riftChoiceButton('Извлечение','extract','Безопасно забрать добычу и эффект'),riftChoiceButton('Полное насыщение','full','Ещё одна жертва ради гиганта')],v=>{if(v==='extract'){addRiftLoot(riftReward('effect',1,{name:'Багровая сила: 3 рыбы +30%',casts:3,value:1.3}),riftReward('relic',1,{name:'Сердце бездны'}));stageDone(r,'Извлечение прошло безопасно.');return;}if(v==='transform'){const q=r.sacrifices.reduce((s,f)=>s+riftSacrificeQuality(f),0);addRiftLoot(q>=8?riftFishReward('legendary'):q>=5?riftFishReward('epic'):riftFishReward('rare'));stageDone(r,'Жертвы преобразованы в единую ценную рыбу.');return;}selectSacrifice(r,'Выберите последнюю рыбу для полного насыщения.',()=>true,f=>{if(!f||chance(.45)){failRift('Сердце поглотило жертвы и всю добычу Разлома.',r);return;}addRiftLoot(chance(.35)?riftFishReward('giant'):riftFishReward('legendary',1,{category:'heavy',weightMultiplier:1.5}),riftReward('relic',1,{name:'Сердце бездны'}));r.feats.push('crimsonCovenant');stageDone(r,'Полное насыщение завершено.');},false);});
  }
};

function consumeRiftFishEffects(f){ensureRifts();state.rifts.temporaryEffects.filter(e=>e.casts>0&&e.effectType!=='weather').forEach(e=>{const calibrationEligible=(f.direct&&f.source==='Заброс')||f.arcadeCatch;if(String(e.name).startsWith('Калибровка DF1')&&!calibrationEligible)return;const before=f.weight,value=e.value||1;f.weight=round1(f.weight*value);f.tags.push(`${e.name}`);e.casts--;if(!Array.isArray(f.riftEffectImpacts))f.riftEffectImpacts=[];f.riftEffectImpacts.push({before,after:f.weight,name:e.name,value});});state.rifts.temporaryEffects=state.rifts.temporaryEffects.filter(e=>e.casts>0);}
function availableRiftRelic(name){ensureRifts();return state.rifts.relics.find(x=>x.name===name&&!x.used);}
function consumeProtection(source,fish){const relic=availableRiftRelic('Фантомный осколок');if(!relic)return false;relic.used=true;addHistory(`Фантомный осколок вернул в улов рыбу, похищенную ${source}`,'rift',`(${capitalize(fish.name)} — ${kg(fish.weight)})`,{numbered:false});return true;}
function chooseOwnedFish(title,predicate,onPick,options={}){
  const {allowCancel=false,cancelLabel='Отмена — сохранить реликвию',cancelToast='Реликвия сохранена',onCancel=null,backLabel='',onBack=null,prompt='Выберите рыбу из текущего улова.'}=options;
  const candidates=state.fish.filter(f=>!f.removed&&!f.tradeFish&&!f.riftTransformed&&predicate(f));
  if(!candidates.length){toast('Нет подходящей рыбы');return;}
  const labels=candidates.map((f,i)=>`${i+1}. ${capitalize(f.name)} — ${kg(f.weight)}`);
  const choices=[...labels];if(backLabel)choices.push(backLabel);if(allowCancel)choices.push(cancelLabel);
  showChoice(title,prompt,choices,label=>{
    if(label===cancelLabel){toast(cancelToast);onCancel?.();return;}
    if(backLabel&&label===backLabel){onBack?.();return;}
    const fish=candidates[labels.indexOf(label)];if(fish)onPick(fish);
  });
  if(allowCancel)$('choiceButtons').lastElementChild?.classList.add('choice-cancel-btn');
  if(backLabel){const buttons=$('choiceButtons').children;buttons[buttons.length-(allowCancel?2:1)]?.classList.add('choice-back-btn');}
}
function markRelicUsed(relic,detail){relic.used=true;addHistory(`${relic.name}: действие реликвии`,'rift',`(${detail})`,{numbered:false,relicName:relic.name,relicEvent:'used'});commitState();}
function useRiftRelic(id){
  const relic=state.rifts.relics.find(x=>x.id===id&&!x.used);if(!relic||state.finished)return;
  if(relic.name==='Фантомный осколок'){toast('Фантомный осколок сработает автоматически при первом похищении');return;}
  if(relic.name==='Ядро DF1'){
    const type=chance(BALANCE.catch.coinChance)?'coin':weightedResult(currentWeights());
    const hint=({normal:'обычная рыба',heavy:'рыба-тяжеловес',giant:'рыба-гигант',trash:'хлам',bonus:'бонус',coin:'монета',epic:'эпический артефакт',legendary:'легендарный артефакт'})[type]||'неизвестный результат';
    showChoice('Ядро DF1',`Предсказанный основной результат: ${hint}.\nЗафиксировать его для следующего заброса или уничтожить без расхода лимита забросов?`,['Зафиксировать заброс','Отменить протокол — уничтожить результат'],choice=>{
      if(choice.startsWith('Зафиксировать')){
        state.rifts.preparedCatch=type;
        markRelicUsed(relic,`предсказание зафиксировано: ${hint}`);
        toast(`Ядро DF1 зафиксировало: ${hint}`);
      }else{
        state.rifts.preparedCatch=null;
        markRelicUsed(relic,`предсказание уничтожено: ${hint}; лимит забросов сохранён`);
        toast('Предсказание уничтожено — заброс не израсходован');
      }
    });
    $('choiceButtons').lastElementChild?.classList.add('choice-cancel-btn');
    return;
  }
  if(relic.name==='Кристалл расслоения'){state.rifts.crystalArmed=true;markRelicUsed(relic,'следующий обычный улов получит альтернативную вероятность');toast('После следующей рыбы откроется вторая вероятность');return;}
  if(relic.name==='Око скрытой бездны'){state.rifts.eyeArmed=true;markRelicUsed(relic,'следующее негативное событие будет раскрыто и может быть предотвращено');toast('Око наблюдает за следующим негативным событием');return;}
  if(relic.name==='Обсидиановый ключ'){
    if(state.rifts.obsidianArmed){toast('Обсидиановый ключ уже ждёт автоматической смены погоды');return;}
    state.rifts.obsidianArmed=relic.id;
    commitState();
    toast('При следующей автоматической смене погоды появится выбор');
    return;
  }
  if(relic.name==='Осколок сингулярности'){chooseOwnedFish('Осколок сингулярности',f=>f.category!=='giant'&&!f.riftFish&&f.source==='Заброс'&&f.weight<40,f=>{const before=f.weight,minWeight=Math.max(20,Math.min(40,round1(before+5)));f.category='giant';f.rarity='giant';f.weight=rand1(minWeight,40);f.riftTransformed=true;f.singularityImpact={before,after:f.weight};markRelicUsed(relic,`${capitalize(f.name)}: ${kg(before)} → ${kg(f.weight)}; преобразована в гиганта`);},{allowCancel:true,cancelToast:'Осколок сохранён'});return;}
  if(relic.name==='Печать Левиафана'){chooseOwnedFish('Печать Левиафана',isNaturalHeavy,f=>{const before=f.weight,factor=rand(1.25,1.41);f.weight=round1(f.weight*factor);if(Number.isFinite(f.unrestrictedWeight))f.unrestrictedWeight=round1(f.unrestrictedWeight*factor);f.riftTransformed=true;state.rifts.pendingDanger=true;markRelicUsed(relic,`${capitalize(f.name)}: ${kg(before)} → ${kg(f.weight)}; пробуждена опасность`);},{allowCancel:true,cancelLabel:'Отмена — сохранить Печать',cancelToast:'Печать Левиафана сохранена'});return;}
  if(relic.name==='Сердце бездны'){
    const available=state.fish.filter(f=>!f.removed&&!f.tradeFish&&!f.riftTransformed);if(available.length<2){toast('Для Сердца бездны нужны две доступные рыбы');return;}
    const chooseFirst=()=>chooseOwnedFish('Сердце бездны: первая жертва',()=>true,a=>chooseSecond(a),{allowCancel:true,cancelLabel:'Отмена — сохранить Сердце',cancelToast:'Сердце бездны сохранено'});
    const chooseSecond=a=>chooseOwnedFish('Сердце бездны: вторая жертва',f=>f.id!==a.id,b=>{a.removed=true;b.removed=true;a.riftTransformed=b.riftTransformed=true;const quality=riftSacrificeQuality(a)+riftSacrificeQuality(b);const rarity=quality>=8?'legendary':quality>=5?'epic':'rare';commitRiftFish(riftFishReward(rarity), 'crimson');markRelicUsed(relic,`${capitalize(a.name)} и ${capitalize(b.name)} преобразованы`);},{allowCancel:true,cancelLabel:'Отмена — сохранить Сердце',cancelToast:'Сердце бездны сохранено',backLabel:'Назад — выбрать другую первую рыбу',onBack:chooseFirst,prompt:`Первая жертва: ${capitalize(a.name)} — ${kg(a.weight)}. Выберите вторую жертву.`});
    chooseFirst();return;
  }
}

const ISLANDS=Object.freeze({
  destructiveTides:Object.freeze({name:'Остров Разрушительных Приливов',icon:'🌊',description:'Океан постоянно меняет береговую линию, а гигантские волны скрывают следы прошлых экспедиций.',locations:Object.freeze([
    {id:'roaringShore',name:'🌊 Берег Грохочущих Волн'},{id:'brokenBay',name:'Разбитая Бухта'},{id:'tideGorge',name:'🪨 Ущелье Приливов'},{id:'rockyRise',name:'🦀 Скалистый Подъём'},{id:'stormEcho',name:'🌪 Пещера Штормового Эха'},{id:'floodedShoal',name:'🌊 Затопленная Отмель'}])}),
  leadenFog:Object.freeze({name:'Остров Свинцового Тумана',icon:'🌫',description:'Тяжёлый туман поглощает звуки и скрывает следы исчезнувших экспедиций.',locations:Object.freeze([
    {id:'vanishedTrail',name:'Тропа Исчезнувших'},{id:'silentForest',name:'Молчаливый лес'},{id:'forgottenGraveyard',name:'Забытое кладбище кораблей'},{id:'silentRift',name:'Расщелина безмолвия'},{id:'abandonedCamp',name:'Заброшенный лагерь'},{id:'whisperingCliff',name:'Утёс шепчущих голосов'}])}),
  stoneGuardians:Object.freeze({name:'Остров Каменных Стражей',icon:'🗿',description:'Безмолвные исполины охраняют руины Предтеч, где древние обряды всё ещё отзываются в камне.',locations:Object.freeze([
    {id:'guardiansAlley',name:'Аллея Стражей'},{id:'precursorSanctuary',name:'Святилище Предтеч'},{id:'ruinedAmphitheater',name:'Разрушенный Амфитеатр'},{id:'splitMonolith',name:'Расколотый Монолит'},{id:'undergroundRuneHall',name:'Подземный Зал Рун'},{id:'sacrificialAltar',name:'Жертвенный Алтарь'}])})
  ,forgottenCurrents:Object.freeze({name:'Остров Забытых Течений',icon:'🪷',description:'Древние течения хранят память о каждом существе, когда-либо прошедшем через прозрачные воды острова.',locations:Object.freeze([
    {id:'serenityLagoon',name:'Лагуна Безмятежности'},{id:'livingCoralGarden',name:'Сад Живых Кораллов'},{id:'seaLilyGrove',name:'Роща Морских Лилий'},{id:'firstWatersSpring',name:'Источник Первых Вод'},{id:'thousandShellsShore',name:'Берег Тысячи Раковин'},{id:'secretBackwater',name:'Тайная Заводь'}])})
});
const ISLAND_LOCATION_ICON_PATH='./assets/icons/island-locations/';
const ISLAND_LOCATION_ICON_FILES=Object.freeze({
  destructiveTides:Object.freeze({
    roaringShore:'destructive-tides/roaring-shore.webp',brokenBay:'destructive-tides/broken-bay.webp',tideGorge:'destructive-tides/tide-gorge.webp',
    rockyRise:'destructive-tides/rocky-rise.webp',stormEcho:'destructive-tides/storm-echo-cave.webp',floodedShoal:'destructive-tides/flooded-shoal.webp'
  }),
  leadenFog:Object.freeze({
    vanishedTrail:'leaden-fog/vanished-trail.webp',silentForest:'leaden-fog/silent-forest.webp',forgottenGraveyard:'leaden-fog/forgotten-ship-graveyard.webp',
    silentRift:'leaden-fog/silent-rift.webp',abandonedCamp:'leaden-fog/abandoned-camp.webp',whisperingCliff:'leaden-fog/whispering-cliff.webp'
  }),
  stoneGuardians:Object.freeze({
    guardiansAlley:'stone-guardians/guardians-alley.webp',precursorSanctuary:'stone-guardians/precursor-sanctuary.webp',ruinedAmphitheater:'stone-guardians/ruined-amphitheater.webp',
    splitMonolith:'stone-guardians/split-monolith.webp',undergroundRuneHall:'stone-guardians/underground-rune-hall.webp',sacrificialAltar:'stone-guardians/sacrificial-altar.webp'
  }),
  forgottenCurrents:Object.freeze({
    serenityLagoon:'forgotten-currents/serenity-lagoon.webp',livingCoralGarden:'forgotten-currents/living-coral-garden.webp',seaLilyGrove:'forgotten-currents/sea-lily-grove.webp',
    firstWatersSpring:'forgotten-currents/first-waters-spring.webp',thousandShellsShore:'forgotten-currents/thousand-shells-shore.webp',secretBackwater:'forgotten-currents/secret-backwater.webp'
  })
});
function plainIslandLocationName(name){return String(name||'').replace(/^[^\p{L}\p{N}]+/u,'').trim();}
function islandLocationIconMarkup(island,location){
  const file=ISLAND_LOCATION_ICON_FILES[island]?.[location.id];
  return file?`<span class="island-location-visual"><img src="${ISLAND_LOCATION_ICON_PATH}${file}" alt="" aria-hidden="true" decoding="async"></span>`:'';
}
const ISLAND_DANGERS=Object.freeze([
  ['🌊 Неожиданный прилив','Мощная волна накрывает берег. Все оставшиеся маршруты становятся недоступны.'],
  ['🦂 Ядовитые заросли','Ядовитые растения вынуждают экспедицию срочно отступить.'],
  ['🐍 Морской хищник','Из укрытия появляется крупный хищник. Продолжать путь слишком опасно.'],
  ['🌫 Потеря ориентира','Густой туман полностью скрывает оставшиеся тропы.'],
  ['🪨 Камнепад','Тяжёлые валуны отрезают все дальнейшие маршруты.'],
  ['🕳 Обрушение пещеры','Осыпающаяся порода вынуждает немедленно завершить исследование.'],
  ['🦂 Древняя ловушка','Старый механизм перекрывает дальнейший путь.'],
  ['🌋 Геотермальный выброс','Раскалённый пар делает продолжение экспедиции невозможным.'],
  ['🐦 Стая падальщиков','Стая птиц вынуждает экспедицию покинуть открытое место.'],
  ['🦑 Незримое присутствие','Низкий гул из глубины заставляет команду покинуть остров.']
]);
function ensureIslands(){const base=initialState().islands;state.islands={...base,...(state.islands||{})};['items','expeditions','navigators','feats'].forEach(k=>{if(!Array.isArray(state.islands[k]))state.islands[k]=[];});}
function addIslandFeat(feat){ensureIslands();if(!state.islands.feats.includes(feat))state.islands.feats.push(feat);}
function refreshUnstablePresence(){ensureIslands();const active=state.fish.some(f=>f.islandColossus&&!f.removed&&!f.islandTraded);state.islands.unstablePresence=active;return active;}
function useMoonTideShell(){ensureIslands();if(state.islands.moonShellActiveId){toast('Одна Раковина лунного прилива уже активна');return;}const item=state.tradeItems.find(x=>x.key==='moonTideShell'&&!x.exchanged);if(!item)return;const targets=state.fish.filter(f=>f.islandDistorted&&!f.islandSkeleton&&!f.removed);if(!targets.length){toast('Нет доступной рыбы с эффектом «Нестабильное присутствие»');return;}chooseOwnedFish('Раковина лунного прилива',f=>targets.some(x=>x.id===f.id),f=>{const before=f.weight,restored=round1(f.islandOriginalWeight);f.weight=restored;f.originalWeight=restored;f.islandDistorted=false;f.islandDistortedWeight=null;f.moonShellProtected=true;f.moonShellRestoreImpact={before,after:restored};f.tags.push('защищена Раковиной лунного прилива до конца сессии');item.moonShellUsed=true;state.islands.moonShellActiveId=item.id;state.islands.moonShellProtected=true;state.islands.moonShellDoubles=0;if(f.category==='normal'){f.moonShellImpact={before:f.weight,after:round1(f.weight*2)};f.weight=f.moonShellImpact.after;f.originalWeight=f.weight;state.islands.moonShellDoubles=1;}addHistory('Раковина лунного прилива активирована','island',`(${capitalize(f.name)}: ${kg(before)} → ${kg(restored)}${f.category==='normal'?` → ${kg(f.weight)} (×2)`:''} • защита до конца сессии)`,{numbered:false});commitState();},{allowCancel:true,cancelToast:'Раковина сохранена'});}
function useFirstWaterFlask(){ensureIslands();const item=state.tradeItems.find(x=>x.key==='firstWaterFlask'&&!x.exchanged);if(!item)return;if(!state.islands.unstablePresence){item.exchanged=true;item.exchangeReason='used';addHistory('Флакон Первой Воды пробудил Плавник мегалодона','island','(Нестабильного присутствия нет • применена обычная механика Плавника; сам Плавник не отменяет Нестабильное присутствие)',{numbered:false});processLegendary('Плавник мегалодона');commitState();return;}state.islands.firstWaterWeakening=true;let restored=0;state.fish.filter(f=>f.islandDistorted&&!f.islandSkeleton&&!f.removed).forEach(f=>{const before=f.weight,after=round1(before+(f.islandOriginalWeight-before)*.5);f.weight=after;f.originalWeight=after;f.islandDistortedWeight=after;f.firstWaterImpact={before:f.islandOriginalWeight,distorted:before,after};restored++;});item.exchanged=true;item.exchangeReason='used';addHistory('Флакон Первой Воды ослабил Нестабильное присутствие','island',`(Восстановлено 50% потерянного веса у рыб: ${restored} • будущие искажения ослаблены до конца сессии • скелеты не восстановлены)`,{numbered:false});commitState();}
function availableExpeditions(){ensureIslands();return state.islands.expeditions.filter(x=>x.status==='available');}
function hasCompass(){return state.artifacts.some(a=>a.name==='Компас потерянных глубин'&&!a.traded);}
function maybeFindExpeditionItem(source='Заброс',forced=false,forcedName=null){
  ensureIslands();if(!forced&&!chance(BALANCE.islands.itemChance))return null;
  const item={id:uid(),name:forcedName||pick(EXPEDITION_ITEMS),status:'active',source,historyRowId:null};
  state.islands.items.push(item);
  const row=addHistory(item.name,'island',`(Редкий экспедиционный предмет • ${source})`,{numbered:false,expeditionItemId:item.id});item.historyRowId=row.id;
  return item;
}
function decodeExpeditionItem(id,forceSuccess=false){
  ensureIslands();const item=state.islands.items.find(x=>x.id===id&&x.status==='active');if(!item||state.finished)return;
  const success=forceSuccess||chance(BALANCE.islands.decodeChance),row=state.history.find(h=>h.id===item.historyRowId);
  if(!success){item.status='failed';if(row)row.detail='(Расшифровка не удалась • записи слишком повреждены)';toast('Определить координаты не удалось');commitState();return;}
  const island=pick(Object.keys(ISLANDS)),expedition={id:uid(),island,status:'available',itemId:item.id};state.islands.expeditions.push(expedition);item.status='decoded';item.expeditionId=expedition.id;
  playSound('islandDiscovered');
  if(row)row.detail=`(Координаты обнаружены: ${ISLANDS[island].name})`;
  commitState();showChoice('Координаты неизвестного острова','Среди выцветших строк обнаружены координаты неизвестного острова.',[
    {label:'Отправиться на скрытый остров',value:'go'},{label:'Отложить',value:'later'}
  ],value=>{if(value==='go')startIslandExpedition(expedition.id);});
}
function islandLootPurposeMarkup(icon,title,purpose=''){
  return `${icon}<span class="island-loot-purpose-copy"><strong>${title}</strong>${purpose?`<small>${purpose}</small>`:''}</span>`;
}
function islandLootLabel(item){
  if(item.kind==='colossus')return islandLootPurposeMarkup(islandFishIconMarkup(item,'is-loot-icon'),`${item.name} — ${kg(item.weight)}`,'После возвращения активирует «Нестабильное присутствие»: вытесняет прежнюю рыбу и искажает будущий улов');
  if(item.kind==='moray')return islandLootPurposeMarkup(islandFishIconMarkup(item,'is-loot-icon'),`${item.name} — ${kg(item.weight)}`,'Чайка не может украсть; «Нестабильное присутствие» один раз уменьшает вес на 50%');
  if(item.kind==='graniteCatfish')return islandLootPurposeMarkup(islandFishIconMarkup(item,'is-loot-icon'),`${item.name} — ${kg(item.weight)}`,'Пока остаётся в улове: 25% шанс не потратить обычный заброс');
  if(item.kind==='echoRay')return islandLootPurposeMarkup(islandFishIconMarkup(item,'is-loot-icon'),`${item.name} — ${kg(item.weight)}`,'Пока остаётся в улове: 20% шанс создать эхо-улов той же категории');
  if(item.kind==='trade')return islandLootPurposeMarkup(tradeItemIconMarkup(item),item.name,'Предмет обмена');
  if(item.kind==='cache')return islandLootPurposeMarkup(islandLootIconMarkup(item),'Тайник',`Предметы обмена: ${item.items.map(x=>x.name).join(', ')}`);
  if(item.kind==='flare')return islandLootPurposeMarkup(islandLootIconMarkup(item),'Руническая сигнальная ракета','Одноразово вызывает торговое судно; вызванное судно принимает исполинов');
  if(item.kind==='rod')return islandLootPurposeMarkup(islandLootIconMarkup(item),'Удочка племени Острого Плавника','До конца сессии удваивает предметы обмена, найденные обычным забросом');
  if(item.kind==='routeMap')return islandLootPurposeMarkup(islandLootIconMarkup(item),'Карта последнего маршрута','После трёх посещённых локаций открывает четвёртое исследование');
  if(item.kind==='navigator')return islandLootPurposeMarkup(islandLootIconMarkup(item),'Астральный навигатор','На острове показывает награду и опасность локации; после возвращения запоминает категорию рыбы');
  if(item.kind==='idol')return islandLootPurposeMarkup(islandLootIconMarkup(item),'Зачарованный идол','Полностью предотвращает следующую опасность этой экспедиции; при сохранении становится предметом обмена');
  if(item.kind==='mask')return islandLootPurposeMarkup(islandLootIconMarkup(item),'Церемониальная маска','Один раз бесплатно повторяет исследованную локацию этой экспедиции; при сохранении становится предметом обмена');
  if(item.kind==='fadedFragment')return islandLootPurposeMarkup(islandLootIconMarkup(item),'Фрагмент угасшей реликвии','При следующем артефакте или реликвии превращается в артефакт: 85% эпический, 12% легендарный, 3% мифический');
  if(item.kind==='moonShell')return islandLootPurposeMarkup(islandLootIconMarkup(item),'Раковина лунного прилива','Восстанавливает и защищает выбранную искажённую рыбу, затем удваивает обычный улов; пять удвоений призывают Чешую Левиафана');
  if(item.kind==='firstWaterFlask')return islandLootPurposeMarkup(islandLootIconMarkup(item),'Флакон Первой Воды','С «Нестабильным присутствием» возвращает 50% потерянного веса; без него призывает Плавник Мегалодона');
  if(item.kind==='mistSupplies'){const fish=item.islandFish?`${item.islandFish.name} — ${kg(item.islandFish.weight)}`:`${item.standardFish.length} стандартные рыбы`;return islandLootPurposeMarkup(islandLootIconMarkup(item),'Припасы ордена Мглистой Дымки',`${fish}${item.resource?` + ${item.resource.name} (предмет обмена)`:''}`);}
  return item.name||'Неизвестная находка';
}
function islandLootHistoryPurposeLabel(item){
  if(item.kind==='idol')return islandLootPurposeMarkup(islandLootIconMarkup(item),'Зачарованный идол','Предмет обмена');
  if(item.kind==='mask')return islandLootPurposeMarkup(islandLootIconMarkup(item),'Церемониальная маска','Предмет обмена');
  return islandLootLabel(item);
}
function islandLootOrigin(item,fallbackIsland=''){if(!item?.locationName)return '';return `Найдено: ${plainIslandLocationName(item.locationName)}${item.repeatedLocation?' (повторное исследование)':''}`;}
function compactIslandOriginText(value){
  const text=String(value??'');
  if(!/Найдено:/i.test(text))return value;
  return text.replace(/\s+—\s+(?:Остров Разрушительных Приливов|Остров Свинцового Тумана|Остров Каменных Стражей|Остров Забытых Течений)/gi,'');
}
function islandLootHistoryLabel(item,fallbackIsland=''){const origin=islandLootOrigin(item,fallbackIsland);return `${islandLootLabel(item)}${origin?` • ${origin}`:''}`;}
function rollDestructiveTidesReward(){
  const roll=Math.random()*100;
  if(roll<15)return {id:uid(),kind:'colossus',tier:'common',name:'Абиссалор',icon:'🐋',weight:rand1(100,200)};
  if(roll<25)return {id:uid(),kind:'colossus',tier:'rare',name:'Древний Абиссалор',icon:'🐋',weight:rand1(201,300)};
  if(roll<30)return {id:uid(),kind:'colossus',tier:'exceptional',name:'Первородный Абиссалор',icon:'🐋',weight:rand1(301,400)};
  const tradeBands=[[42,ISLAND_TRADE_ITEMS[0]],[52,ISLAND_TRADE_ITEMS[1]],[60,ISLAND_TRADE_ITEMS[2]],[65,ISLAND_TRADE_ITEMS[3]]];
  for(const [limit,d] of tradeBands)if(roll<limit)return {id:uid(),kind:'trade',...d};
  if(roll<80){const count=chance(.5)?1:2;return {id:uid(),kind:'cache',items:Array.from({length:count},()=>({...pick(TRADE_ITEMS)}))};}
  if(roll<92)return {id:uid(),kind:'flare'};
  return {id:uid(),kind:'rod'};
}
function rollMoray(tier){const data={common:['Резонирующая туманная мурена',95,140],rare:['Древняя резонирующая туманная мурена',141,180],exceptional:['Первородная резонирующая туманная мурена',181,200]}[tier];return {id:uid(),kind:'moray',tier,name:data[0],weight:rand1(data[1],data[2])};}
function rollGraniteCatfish(){const roll=Math.random(),tier=roll<.5?'common':roll<.8333?'rare':'exceptional',data={common:['Гранитный сом',80,130],rare:['Древний гранитный сом',131,190],exceptional:['Первородный гранитный сом',191,250]}[tier];return {id:uid(),kind:'graniteCatfish',tier,name:data[0],icon:'🐟',weight:rand1(data[1],data[2])};}
function rollStoneGuardianFish(){const roll=Math.random();if(roll<.5)return {id:uid(),kind:'colossus',tier:'common',name:'Абиссалор',icon:'🐋',weight:rand1(100,200)};if(roll<.8333)return {id:uid(),kind:'colossus',tier:'rare',name:'Древний Абиссалор',icon:'🐋',weight:rand1(201,300)};return {id:uid(),kind:'colossus',tier:'exceptional',name:'Первородный Абиссалор',icon:'🐋',weight:rand1(301,400)};}
function rollStoneGuardiansReward(){const roll=Math.random()*100;if(roll<20)return rollStoneGuardianFish();if(roll<35)return rollGraniteCatfish();if(roll<45)return {id:uid(),kind:'idol',name:'Зачарованный идол',icon:'🗿'};if(roll<55)return {id:uid(),kind:'mask',name:'Церемониальная маска',icon:'🎭'};if(roll<60)return {id:uid(),kind:'fadedFragment',name:'Фрагмент угасшей реликвии',icon:'🔸'};if(roll<88){const d=pick(ISLAND_TRADE_ITEMS.slice(4,8));return {id:uid(),kind:'trade',...d};}return {id:uid(),kind:'flare'};}
function rollEchoRay(tier=null){tier=tier||(['common','rare','exceptional'][weightedResult({0:50,1:33.33,2:16.67})]);const data={common:['Эхоносный скат',70,120],rare:['Древний Эхоносный скат',121,180],exceptional:['Первородный Эхоносный скат',181,240]}[tier];return {id:uid(),kind:'echoRay',tier,name:data[0],icon:'🐟',weight:rand1(data[1],data[2])};}
function rollForgottenCurrentsReward(active){if(active.calmRareBoost){addIslandFeat('currentsBoostClaimed');if(chance(.35)){active.calmRareBoost=false;return pick([()=>rollEchoRay('exceptional'),()=>({id:uid(),kind:'moonShell',name:'Раковина лунного прилива',icon:'🐚'}),()=>({id:uid(),kind:'firstWaterFlask',name:'Флакон Первой Воды',icon:'🧪'})])();}}active.calmRareBoost=false;const roll=Math.random()*100;if(roll<15)return {id:uid(),kind:'colossus',tier:'common',name:'Абиссалор',icon:'🐋',weight:rand1(100,200)};if(roll<25)return {id:uid(),kind:'colossus',tier:'rare',name:'Древний Абиссалор',icon:'🐋',weight:rand1(201,300)};if(roll<30)return {id:uid(),kind:'colossus',tier:'exceptional',name:'Первородный Абиссалор',icon:'🐋',weight:rand1(301,400)};if(roll<48)return rollEchoRay();if(roll<57)return {id:uid(),kind:'moonShell',name:'Раковина лунного прилива',icon:'🐚'};if(roll<65)return {id:uid(),kind:'firstWaterFlask',name:'Флакон Первой Воды',icon:'🧪'};if(roll<90){const d=pick(ISLAND_TRADE_ITEMS.slice(11,14));return {id:uid(),kind:'trade',...d};}return {id:uid(),kind:'flare'};}
function rollFogIslandFish(){const roll=Math.random()*39;if(roll<12)return {id:uid(),kind:'colossus',tier:'common',name:'Абиссалор',icon:'🐋',weight:rand1(100,200)};if(roll<20)return {id:uid(),kind:'colossus',tier:'rare',name:'Древний Абиссалор',icon:'🐋',weight:rand1(201,300)};if(roll<24)return {id:uid(),kind:'colossus',tier:'exceptional',name:'Первородный Абиссалор',icon:'🐋',weight:rand1(301,400)};if(roll<32)return rollMoray('common');if(roll<37)return rollMoray('rare');return rollMoray('exceptional');}
function rollMistSupplies(){const resource=chance(.3)?{...pick(ISLAND_TRADE_ITEMS.slice(0,4))}:null;if(chance(.05))return {id:uid(),kind:'mistSupplies',islandFish:rollFogIslandFish(),standardFish:[],resource};const count=Math.floor(rand(3,6)),standardFish=Array.from({length:count},()=>{const r=Math.random();return r<.85?'normal':r<.97?'heavy':'giant';});return {id:uid(),kind:'mistSupplies',standardFish,resource};}
function rollLeadenFogReward(active){
  const roll=Math.random()*100;
  if(roll<12)return {id:uid(),kind:'colossus',tier:'common',name:'Абиссалор',icon:'🐋',weight:rand1(100,200)};
  if(roll<20)return {id:uid(),kind:'colossus',tier:'rare',name:'Древний Абиссалор',icon:'🐋',weight:rand1(201,300)};
  if(roll<24)return {id:uid(),kind:'colossus',tier:'exceptional',name:'Первородный Абиссалор',icon:'🐋',weight:rand1(301,400)};
  if(roll<32)return rollMoray('common');if(roll<37)return rollMoray('rare');if(roll<39)return rollMoray('exceptional');
  const tradeBands=[[47,ISLAND_TRADE_ITEMS[0]],[54,ISLAND_TRADE_ITEMS[1]],[60,ISLAND_TRADE_ITEMS[2]],[64,ISLAND_TRADE_ITEMS[3]]];for(const [limit,d] of tradeBands)if(roll<limit)return {id:uid(),kind:'trade',...d};
  if(roll<76){const count=chance(.5)?1:2;return {id:uid(),kind:'cache',items:Array.from({length:count},()=>({...pick(TRADE_ITEMS)}))};}
  if(roll<86)return {id:uid(),kind:'flare'};if(roll<92)return rollMistSupplies();if(roll<97&&!active.loot.some(x=>x.kind==='routeMap'))return {id:uid(),kind:'routeMap'};return {id:uid(),kind:'navigator',islandUsed:false};
}
function rollIslandReward(active){return active.island==='leadenFog'?rollLeadenFogReward(active):active.island==='stoneGuardians'?rollStoneGuardiansReward():active.island==='forgottenCurrents'?rollForgottenCurrentsReward(active):rollDestructiveTidesReward();}
function startIslandExpedition(id){
  ensureIslands();const expedition=state.islands.expeditions.find(x=>x.id===id&&x.status==='available');if(!expedition||state.finished)return;
  expedition.status='active';state.islands.active={id:expedition.id,island:expedition.island,actionsLeft:3,maxVisits:3,visited:[],loot:[],stage:'choose',message:'Выберите, куда направится экспедиция.',compassProtected:hasCompass(),danger:null,previews:{},routeMapUsed:false,maskRepeatedLocations:[],totalResearches:0,maskRepeatLocationId:null,maskRepeatItemId:null};
  $('choiceDialog')?.close();renderIsland();if(!$('islandDialog').open)$('islandDialog').showModal();startIslandAmbient(expedition.island);commitState();
}
function renderIsland(){
  ensureIslands();const a=state.islands.active,dialog=$('islandDialog');if(!dialog)return;
  if(!a){stopIslandAmbient();dialog.close();return;}
  const config=ISLANDS[a.island]||ISLANDS.destructiveTides,card=$('islandCard');card.classList.toggle('is-leaden-fog',a.island==='leadenFog');card.classList.toggle('is-stone-guardians',a.island==='stoneGuardians');card.classList.toggle('is-forgotten-currents',a.island==='forgottenCurrents');card.classList.toggle('has-island-loot',a.loot.length>0);$('islandTitle').textContent=`${config.icon} ${config.name}`;$('islandDescription').textContent=config.description;
  $('islandActions').textContent=`Исследования: ${a.actionsLeft}`;
  $('islandProgress').textContent=`Посещено: ${a.visited.length} из ${a.maxVisits||3}`;
  $('islandCompassNotice').classList.toggle('hidden',!a.compassProtected);
  $('islandMessage').innerHTML=a.message;
  $('islandLoot').innerHTML=a.loot.length?a.loot.map(x=>`<span class="island-loot-item tier-${x.tier||x.kind}">${islandLootLabel(x)}</span>`).join(''):'<span>Пока ничего не найдено</span>';
  const canChoose=a.stage==='choose'&&a.actionsLeft>0;
  $('islandLocations').innerHTML=config.locations.map(loc=>{const visited=a.visited.includes(loc.id),previewed=Boolean(a.previews?.[loc.id]),repeatTarget=!a.danger&&a.maskRepeatLocationId===loc.id,enabled=(canChoose&&!visited)||repeatTarget;return `<button type="button" data-island-location="${loc.id}" ${!enabled?'disabled':''} class="${visited&&!repeatTarget?'is-visited':''}${previewed?' island-location-preview':''}${repeatTarget?' island-location-repeat':''}">${islandLocationIconMarkup(a.island,loc)}<strong>${plainIslandLocationName(loc.name)}</strong><span class="island-location-state">${repeatTarget?'Исследовать повторно':visited?'Исследовано':previewed?'Исход известен':'Исследовать'}</span></button>`;}).join('');
  const finished=a.stage==='finished';$('islandContinueBtn').classList.toggle('hidden',a.stage!=='result');
  $('islandContinueBtn').textContent=a.actionsLeft>0?'Продолжить исследование':'Экспедиция завершена. Покинуть остров';
  $('islandLeaveBtn').classList.toggle('hidden',finished);
  if(finished){$('islandContinueBtn').classList.remove('hidden');$('islandContinueBtn').textContent='Экспедиция завершена. Покинуть остров';}
}
function islandResearchCount(a){return Number.isFinite(a.totalResearches)?a.totalResearches:(a.visited?.length||0)+(a.maskRepeatedLocations?.length||0);}
function islandDangerChance(a){const index=islandResearchCount(a),base=index>=3?.36:BALANCE.islands.danger[Math.min(2,index)];return Math.min(.95,base+(a.calmRiskArmed?.15:0));}
function islandLocationOutcome(a,id){if(a.previews?.[id])return a.previews[id];const reward=rollIslandReward(a),dangerChance=islandDangerChance(a),danger=!a.compassProtected&&chance(dangerChance),dangerData=danger?pick(ISLAND_DANGERS):null;return {reward,dangerData,dangerChance};}
function availableIslandNavigator(a){return a.island==='leadenFog'&&a.loot.find(x=>x.kind==='navigator'&&!x.islandUsed);}
function chooseIslandLocation(id){const a=state.islands.active;if(!a)return;if(a.maskRepeatLocationId===id&&!a.danger){exploreIslandMaskRepeat(id);return;}const navigator=availableIslandNavigator(a);if(!navigator||a.previews?.[id]){exploreIslandLocation(id);return;}const outcome=islandLocationOutcome(a,id),loc=ISLANDS[a.island].locations.find(x=>x.id===id);a.previews[id]=outcome;navigator.islandUsed=true;showChoice('Астральный навигатор',`${loc.name}: ${islandLootLabel(outcome.reward)}${outcome.dangerData?` • Опасность: ${outcome.dangerData[0]}`:' • Опасности нет'}`,[{label:'Принять исход',value:'accept'},{label:'Выбрать другую локацию',value:'reject'}],value=>{if(value==='accept')exploreIslandLocation(id);else{a.message=`Навигатор запомнил исход локации «${loc.name}». Можно выбрать другой маршрут.`;renderIsland();commitState();}});}
function exploreIslandLocation(id){
  const a=state.islands.active;if(!a||a.stage!=='choose'||a.actionsLeft<=0||a.visited.includes(id))return;
  const researchBefore=islandResearchCount(a),islandConfig=ISLANDS[a.island]||ISLANDS.destructiveTides,loc=islandConfig.locations.find(x=>x.id===id),outcome=islandLocationOutcome(a,id),reward=outcome.reward;reward.locationId=loc.id;reward.locationName=loc.name;reward.islandName=islandConfig.name;reward.repeatedLocation=false;a.previews[id]=outcome;a.visited.push(id);a.actionsLeft--;a.totalResearches=researchBefore+1;a.loot.push(reward);
  resolveIslandLocationResult(a,loc,outcome,false);
}
function takeIslandLoot(a,kind){const index=a.loot.findIndex(x=>x.kind===kind);if(index<0)return null;return a.loot.splice(index,1)[0];}
function resolveIslandLocationResult(a,loc,outcome,repeated=false){
  const reward=outcome.reward;let message=`<strong>${loc.name}${repeated?' • повторное исследование':''}</strong><br>Найдено: ${islandLootLabel(reward)}`;
  const settleSafe=()=>{if(a.actionsLeft<=0&&a.island==='leadenFog'&&!a.routeMapUsed&&a.loot.some(x=>x.kind==='routeMap')&&a.visited.length===3){a.routeMapUsed=true;a.maxVisits=4;a.actionsLeft=1;message+=`<br><strong class="island-route-warning">${weatherWarningIconMarkup('is-compact-icon')}<span>Карта последнего маршрута открыла четвёртое исследование.</span></strong>`;}a.stage=a.actionsLeft<=0?'finished':'result';a.message=message;renderIsland();commitState();offerIslandMaskRepeat(a,loc);};
  if(!outcome.dangerData){settleSafe();return;}
  const [title,text]=outcome.dangerData;a.danger=title;a.dangerEncountered=true;message+=`<div class="island-danger"><strong>${title}</strong><span>${text}</span></div>`;
  playSound('islandDanger');
  const fail=()=>{if(islandResearchCount(a)>=3){const colossi=a.loot.filter(x=>x.kind==='colossus');if(colossi.length){const victim=pick(colossi),percent=pick([10,20,30,40,50]),before=victim.weight;victim.weight=round1(victim.weight*(1-percent/100));victim.dangerImpact={before,after:victim.weight,percent,title};message+=`<small>${victim.name}: ${kg(before)} → ${kg(victim.weight)} (−${percent}%)</small>`;}}a.actionsLeft=0;a.stage='finished';a.message=message;renderIsland();commitState();};
  if(a.island==='stoneGuardians'&&a.loot.some(x=>x.kind==='idol')){showChoice('Зачарованный идол',`${title}. Использовать идол и полностью предотвратить опасность?`,[{label:'Использовать идол',value:'use'},{label:'Сохранить для обмена',value:'keep'}],value=>{if(value==='use'){takeIslandLoot(a,'idol');addIslandFeat('guardianAccepted');a.danger=null;message+=`<br><strong>🗿 Зачарованный идол полностью предотвратил опасность.</strong>`;settleSafe();}else fail();});return;}
  if(a.island==='forgottenCurrents'&&!a.calmDangerSurvived){showChoice('Спокойствие течений',`${title}. Отступить с добычей или довериться забытому течению?`,[{label:'Продолжить по течению',value:'continue'},{label:'Отступить',value:'leave'}],value=>{if(value==='continue'){a.calmDangerSurvived=true;a.calmRareBoost=true;a.calmRiskArmed=true;a.danger=null;message+='<br><strong>🪷 Течение сохранило путь: следующая награда усилена, опасность увеличена на 15%.</strong>';settleSafe();}else fail();});return;}
  fail();
}
function offerIslandMaskRepeat(a,loc){if(!a||a.island!=='stoneGuardians'||a.maskRepeatItemId||!a.loot.some(x=>x.kind==='mask')||(a.maskRepeatedLocations||[]).includes(loc.id))return;showChoice('Церемониальная маска',`Открыть возможность повторно исследовать «${loc.name}» без расхода исследования? Повтор можно выполнить позже.`,[{label:'Открыть повторный маршрут',value:'use'},{label:'Сохранить для обмена',value:'keep'}],value=>{if(value!=='use')return;const mask=a.loot.find(x=>x.kind==='mask');if(!mask)return;a.maskRepeatItemId=mask.id;a.maskRepeatLocationId=loc.id;a.message=`🎭 Повторный путь к «${loc.name}» открыт. Можно исследовать его сейчас или продолжить обычный маршрут.`;renderIsland();commitState();});}
function exploreIslandMaskRepeat(id){const a=state.islands.active;if(!a||a.danger||a.maskRepeatLocationId!==id||!a.maskRepeatItemId)return;const researchBefore=islandResearchCount(a),loc=(ISLANDS[a.island]||ISLANDS.destructiveTides).locations.find(x=>x.id===id),maskIndex=a.loot.findIndex(x=>x.id===a.maskRepeatItemId&&x.kind==='mask');if(maskIndex<0)return;a.totalResearches=researchBefore;a.loot.splice(maskIndex,1);a.maskRepeatLocationId=null;a.maskRepeatItemId=null;a.maskRepeatedLocations=[...(a.maskRepeatedLocations||[]),loc.id];const dangerChance=islandDangerChance(a),outcome={reward:rollIslandReward(a),dangerChance,dangerData:!a.compassProtected&&chance(dangerChance)?pick(ISLAND_DANGERS):null};a.totalResearches=researchBefore+1;outcome.reward.locationId=loc.id;outcome.reward.locationName=loc.name;outcome.reward.islandName=(ISLANDS[a.island]||ISLANDS.destructiveTides).name;outcome.reward.repeatedLocation=true;a.loot.push(outcome.reward);addIslandFeat('repeatedRite');resolveIslandLocationResult(a,loc,outcome,true);}
function continueIsland(){const a=state.islands.active;if(!a)return;if(a.stage==='finished'){finishIslandExpedition();return;}if(a.stage==='result'){a.stage='choose';a.message='Выберите следующую локацию.';renderIsland();commitState();}}
function requestLeaveIsland(){const a=state.islands.active;if(!a)return;showChoice('Покинуть остров?','Неиспользованные очки исследования будут потеряны.',[{label:'Остаться',value:'stay'},{label:'Покинуть',value:'leave'}],v=>{if(v==='leave')finishIslandExpedition(true);});}
function markFishDisplaced(fish){if(!fish||fish.islandColossus)return;fish.removed=true;fish.islandDisplaced=true;state.history.forEach(row=>{if(row.type==='fish'&&row.fishId===fish.id)row.islandDisplaced=true;});}
function commitIslandLoot(a,parentHistoryId=null){
  const colossi=a.loot.filter(x=>x.kind==='colossus');
  const config=ISLANDS[a.island]||ISLANDS.destructiveTides,source=config.name;
  if(colossi.length){state.fish.filter(f=>!f.removed&&!f.islandColossus&&!f.islandMoray&&!f.islandGraniteCatfish&&!f.islandEchoRay&&!f.moonShellProtected).forEach(markFishDisplaced);state.islands.unstablePresence=true;}
  colossi.forEach(x=>{const f={id:uid(),name:x.name,category:'islandColossus',rarity:x.tier,originalWeight:x.weight,weight:x.weight,source,direct:false,removed:false,tags:['<span class="island-negative-hint">Нестабильное присутствие</span>',...(x.locationName?[islandLootOrigin(x,config.name)]:[])],debuffLimited:false,islandColossus:true,dangerImpact:x.dangerImpact};applyBallistierWrathToFish(f);state.fish.push(f);if(parentHistoryId)attachFishToHistoryRow(parentHistoryId,f.id);else addFishHistory(f,source);});
  const supplyIslandFish=a.loot.filter(x=>x.kind==='mistSupplies'&&x.islandFish).map(pack=>({...pack.islandFish,locationName:pack.locationName,islandName:pack.islandName,repeatedLocation:pack.repeatedLocation})),morays=[...a.loot.filter(x=>x.kind==='moray'),...supplyIslandFish.filter(x=>x.kind==='moray')],supplyColossi=supplyIslandFish.filter(x=>x.kind==='colossus');
  if(colossi.length||supplyColossi.length)playSound('unstablePresence');
  supplyColossi.forEach(x=>{const f={id:uid(),name:x.name,category:'islandColossus',rarity:x.tier,originalWeight:x.weight,weight:x.weight,source,direct:false,removed:false,tags:['<span class="island-negative-hint">Нестабильное присутствие</span>',...(x.locationName?[islandLootOrigin(x,config.name)]:[])],debuffLimited:false,islandColossus:true};applyBallistierWrathToFish(f);state.fish.push(f);if(parentHistoryId)attachFishToHistoryRow(parentHistoryId,f.id);});
  if(supplyColossi.length&&!state.islands.unstablePresence){state.fish.filter(f=>!f.removed&&!f.islandColossus&&!f.islandMoray&&!f.islandGraniteCatfish&&!f.islandEchoRay&&!f.moonShellProtected).forEach(markFishDisplaced);state.islands.unstablePresence=true;}
  const committedMorays=[];morays.forEach(x=>{const affected=state.islands.unstablePresence,weight=affected?round1(x.weight*.5):x.weight,f={id:uid(),name:x.name,category:'islandMoray',rarity:x.tier,originalWeight:weight,weight,source,direct:false,removed:false,tags:[...(x.locationName?[islandLootOrigin(x,config.name)]:[]),...(affected?['<span class="island-negative-hint">Нестабильное присутствие: вес мурены уменьшен на 50%</span>']:[])],debuffLimited:false,islandMoray:true,morayOriginalWeight:affected?x.weight:null,morayUnstableApplied:affected};applyBallistierWrathToFish(f);state.fish.push(f);committedMorays.push(f);if(parentHistoryId)attachFishToHistoryRow(parentHistoryId,f.id);});
  if(colossi.length||supplyColossi.length)state.fish.filter(f=>f.islandMoray&&!f.removed&&!f.morayUnstableApplied).forEach(f=>{f.morayOriginalWeight=f.weight;f.weight=round1(f.weight*.5);f.originalWeight=f.weight;f.morayUnstableApplied=true;f.tags.push('<span class="island-negative-hint">Нестабильное присутствие: вес мурены уменьшен на 50%</span>');});
  const graniteCatfish=a.loot.filter(x=>x.kind==='graniteCatfish');graniteCatfish.forEach(x=>{const affected=state.islands.unstablePresence,weight=affected?round1(x.weight*.5):x.weight,f={id:uid(),name:x.name,category:'islandGraniteCatfish',rarity:x.tier,originalWeight:weight,weight,source,direct:false,removed:false,tags:[...(x.locationName?[islandLootOrigin(x,config.name)]:[]),...(affected?['<span class="island-negative-hint">Нестабильное присутствие: вес гранитного сома уменьшен на 50%</span>']:[]),'Активное свойство: 25% шанс сохранить лимит обычного заброса'],debuffLimited:false,islandGraniteCatfish:true,graniteSavedCasts:0,graniteOriginalWeight:affected?x.weight:null,graniteUnstableApplied:affected};applyBallistierWrathToFish(f);state.fish.push(f);if(parentHistoryId)attachFishToHistoryRow(parentHistoryId,f.id);});if(graniteCatfish.length&&parentHistoryId)appendHistoryDetailById(parentHistoryId,'Гранитный сом активирован: каждый обычный заброс с шансом 25% не расходует лимит');
  if(colossi.length||supplyColossi.length)state.fish.filter(f=>f.islandGraniteCatfish&&!f.removed&&!f.graniteUnstableApplied).forEach(f=>{if(!f.graniteOriginalWeight)f.graniteOriginalWeight=f.weight;f.weight=round1(f.weight*.5);f.originalWeight=f.weight;f.graniteUnstableApplied=true;f.tags.push('<span class="island-negative-hint">Нестабильное присутствие: вес гранитного сома уменьшен на 50%</span>');});
  const echoRays=a.loot.filter(x=>x.kind==='echoRay');echoRays.forEach(x=>{const affected=state.islands.unstablePresence,weight=affected?round1(x.weight*.5):x.weight,f={id:uid(),name:x.name,category:'islandEchoRay',rarity:x.tier,originalWeight:weight,weight,source,direct:false,removed:false,tags:[...(x.locationName?[islandLootOrigin(x,config.name)]:[]),...(affected?['<span class="island-negative-hint">Нестабильное присутствие: вес ската уменьшен на 50%</span>']:[]),'Память течения: 20% шанс эхо-улова'],debuffLimited:false,islandEchoRay:true,echoCatches:0,echoOriginalWeight:affected?x.weight:null,echoUnstableApplied:affected};applyBallistierWrathToFish(f);state.fish.push(f);if(parentHistoryId)attachFishToHistoryRow(parentHistoryId,f.id);});
  if(colossi.length||supplyColossi.length)state.fish.filter(f=>f.islandEchoRay&&!f.removed&&!f.echoUnstableApplied).forEach(f=>{f.echoOriginalWeight=f.weight;f.weight=round1(f.weight*.5);f.originalWeight=f.weight;f.echoUnstableApplied=true;f.tags.push('<span class="island-negative-hint">Нестабильное присутствие: вес ската уменьшен на 50%</span>');});
  a.loot.filter(x=>x.kind==='mistSupplies').forEach(pack=>{pack.standardFish.forEach(category=>{const natural=category==='giant'?rand1(20,40):category==='heavy'?rand1(10,19.9):rand1(.1,9.9),distorted=state.islands.unstablePresence,weight=distorted?rollIslandDistortedWeight(natural):natural,f={id:uid(),name:pick(category==='giant'?DATA.giants:DATA.fish),category,originalWeight:weight,weight,source:'Припасы ордена Мглистой Дымки',direct:false,removed:weight===0,tags:distorted?['<span class="island-negative-hint">Применено «Нестабильное присутствие»</span>']:[],debuffLimited:false,islandDistorted:distorted,islandOriginalWeight:distorted?natural:null,islandDistortedWeight:distorted?weight:null};if(weight===0){f.skeletonOf=f.name;f.name=`рыбный скелет (${f.name})`;f.islandSkeleton=f.mythicSkeleton=true;}else applyBallistierWrathToFish(f);state.fish.push(f);if(parentHistoryId)attachFishToHistoryRow(parentHistoryId,f.id);});if(pack.resource)state.tradeItems.push({id:uid(),key:pack.resource.key,name:pack.resource.name,icon:pack.resource.icon,exchanged:false,islandTrade:true,mistSupplies:true});});
  if(activeDebuff('Касатка')&&!state.megalodon){const newColossusCount=colossi.length+supplyColossi.length,targets=state.fish.filter(f=>f.islandColossus&&!f.removed&&!f.orcaChecked),target=newColossusCount?[...targets].sort((a,b)=>b.weight-a.weight)[0]:null;if(target){target.orcaChecked=true;if(chance(.5)){target.removed=true;state.eaten.push(target);setFishHistoryEaten(target,true);const unstableRemains=refreshUnstablePresence();addHistory(`Касатка съела исполина ${target.name}`,'debuff',`(${kg(target.weight)} • проверка 50%${unstableRemains?'':' • «Нестабильное присутствие» прекращено'})`,{numbered:false});}else addHistory(`Исполин ${target.name} отбился от Касатки`,'island','(Касатка ушла и не тронула другую рыбу)',{numbered:false});}else committedMorays.filter(f=>!f.removed).forEach(f=>{f.removed=true;state.eaten.push(f);setFishHistoryEaten(f,true);addHistory(`Касатка съела ${f.name}`,'debuff',`(${kg(f.weight)} • обычная вероятность 100%)`,{numbered:false});});}
  a.loot.filter(x=>x.kind==='trade').forEach(x=>state.tradeItems.push({id:uid(),key:x.key,name:x.name,icon:x.icon,exchanged:false,islandTrade:true}));
  a.loot.filter(x=>x.kind==='idol').forEach(()=>state.tradeItems.push({id:uid(),key:'enchantedIdol',name:'Зачарованный идол',icon:'🗿',exchanged:false,islandTrade:true}));
  a.loot.filter(x=>x.kind==='mask').forEach(()=>state.tradeItems.push({id:uid(),key:'ceremonialMask',name:'Церемониальная маска',icon:'🎭',exchanged:false,islandTrade:true}));
  a.loot.filter(x=>x.kind==='moonShell').forEach(()=>state.tradeItems.push({id:uid(),key:'moonTideShell',name:'Раковина лунного прилива',icon:'🐚',exchanged:false,islandTrade:true}));
  a.loot.filter(x=>x.kind==='firstWaterFlask').forEach(()=>state.tradeItems.push({id:uid(),key:'firstWaterFlask',name:'Флакон Первой Воды',icon:'🧪',exchanged:false,islandTrade:true}));
  const fadedFragments=a.loot.filter(x=>x.kind==='fadedFragment');state.islands.fadedRelicFragments=(state.islands.fadedRelicFragments||0)+fadedFragments.length;fadedFragments.forEach(()=>state.tradeItems.push({id:uid(),key:'fadedRelicFragment',name:'Фрагмент угасшей реликвии',icon:'🔸',exchanged:false,islandTrade:true}));
  a.loot.filter(x=>x.kind==='cache').forEach(cache=>cache.items.forEach(x=>state.tradeItems.push({id:uid(),key:x.key,name:x.name,icon:x.icon,exchanged:false,islandCache:true})));
  const foundFlares=a.loot.filter(x=>x.kind==='flare').length;state.islands.flares+=foundFlares;if(a.island==='destructiveTides')state.islands.destructiveFlares=(state.islands.destructiveFlares||0)+foundFlares;if(foundFlares)state.islands.flareFinishResolved=false;if(a.loot.some(x=>x.kind==='rod'))state.islands.sharpFinRod=true;a.loot.filter(x=>x.kind==='navigator').forEach(x=>state.islands.navigators.push({id:x.id,islandUsed:x.islandUsed,mainlandUsed:false,historyRowId:parentHistoryId}));
}
function finishIslandExpedition(early=false){
  ensureIslands();const a=state.islands.active;if(!a)return;const config=ISLANDS[a.island]||ISLANDS.destructiveTides,fishKinds=['colossus','moray','graniteCatfish','echoRay'],nonFishLoot=a.loot.filter(x=>!fishKinds.includes(x.kind)),hasColossus=a.loot.some(x=>x.kind==='colossus'||(x.kind==='mistSupplies'&&x.islandFish?.kind==='colossus')),detailParts=[early?'досрочный выход':'',a.compassProtected?'безопасный маршрут Компаса':''].filter(Boolean),hasAnyLoot=a.loot.length>0,researches=islandResearchCount(a);if(a.island==='destructiveTides'&&researches>=3&&a.dangerEncountered&&hasColossus)addIslandFeat('tidesDefied');if(a.island==='leadenFog'&&a.routeMapUsed&&researches>=4)addIslandFeat('finalRoute');if(a.island==='leadenFog'&&a.loot.some(x=>(x.kind==='moray'||x.kind==='mistSupplies'&&x.islandFish?.kind==='moray')&&['rare','exceptional'].includes(x.tier||x.islandFish?.tier)))addIslandFeat('fogMaster');const row=addHistory(`Экспедиция завершена: ${config.name}`,'island',detailParts.length?`(${detailParts.join(' • ')})`:hasAnyLoot?'':'(Без добычи)',{numbered:false,islandCompletion:true,islandName:config.name,islandHasUnstablePresence:hasColossus});row.islandLootResults=nonFishLoot;commitIslandLoot(a,row.id);const expedition=state.islands.expeditions.find(x=>x.id===a.id);if(expedition){expedition.status='completed';expedition.loot=a.loot;}
  state.islands.completed++;state.islands.active=null;stopIslandAmbient();$('islandDialog').close();commitState();if(state.castsLeft<=0)maybeFinalizeSession();
}
function useRunicFlare(){ensureIslands();if(state.finished||state.islands.flares<=0||state.tradeShipArrived)return;const launch=source=>{state.islands.flares--;if(state.islands.destructiveFlares>0){state.islands.destructiveFlares--;addIslandFeat('stormSignal');}playSound('signalFlareLaunch');beginTradeShip(source);commitState();},recyclableTrash=state.trash.filter(item=>item.recyclonEligible&&!item.converted&&!item.recycled),tradeItemCount=availableTradeItems().length;if(!recyclableTrash.length){launch('flare');return;}const recommendTrade=tradeItemCount>=recyclableTrash.length,warning=`Выберите один гарантированный визит. Торговое судно работает с предметами обмена (${tradeItemCount}) и особыми предложениями. «Рециклон» принимает только хлам обычных забросов (${recyclableTrash.length}). Второе судно позже может не прибыть. Сейчас выгоднее: ${recommendTrade?'торговое судно':'«Рециклон»'}.`;showChoice('Руническая сигнальная ракета',warning,[{label:`Торговое судно — предметы: ${tradeItemCount}${recommendTrade?' • рекомендуется':''}`,value:'trade',className:recommendTrade?'choice-recommended':''},{label:`«Рециклон» — хлам: ${recyclableTrash.length}${!recommendTrade?' • рекомендуется':''}`,value:'recyclon',className:!recommendTrade?'choice-recommended':''}],value=>launch(value==='recyclon'?'recyclon':'flare'));}
function promptPendingExpeditions(){
  const list=availableExpeditions();if(!list.length||state.islands.finishPromptResolved)return false;
  showChoice('Найдены координаты острова','Перед завершением сессии можно отправиться в экспедицию.',[
    ...list.map((x,i)=>({label:`${ISLANDS[x.island]?.icon||'🏝️'} ${ISLANDS[x.island]?.name||`Экспедиция ${i+1}`}`,value:x.id})),{label:'Завершить сессию без экспедиции',value:'finish'}
  ],value=>{if(value==='finish'){state.islands.finishPromptResolved=true;state.islands.expeditions.filter(x=>x.status==='available').forEach(x=>x.status='expired');maybeFinalizeSession();commitState();}else startIslandExpedition(value);});return true;
}
function promptFinalFlare(){if(state.islands?.flares<=0||state.islands?.flareFinishResolved||state.tradeShipArrived)return false;showChoice('Руническая сигнальная ракета','Использовать ракету перед завершением сессии и гарантированно призвать торговое судно?',[{label:'Запустить ракету',value:'launch'},{label:'Завершить без запуска',value:'skip'}],value=>{if(value==='launch')useRunicFlare();else{state.islands.flareFinishResolved=true;maybeFinalizeSession();}});return true;}
function promptUnusedMessage(){
  const artifact=state.artifacts.find(x=>x.name==='Послание в бутылке'&&x.messageUnused&&!x.messageResolved);if(!artifact)return false;
  showChoice('Неиспользованное послание в бутылке','Посланию было нечего возвращать или удваивать. Открыть бутылку и извлечь экспедиционный документ?',[
    {label:'Открыть послание',value:'open'},{label:'Не открывать',value:'skip'}
  ],value=>{artifact.messageResolved=true;artifact.messageUnused=false;const row=state.history.find(x=>x.id===artifact.historyRowId);if(value==='open'){const item=maybeFindExpeditionItem('Послание в бутылке',true,pick(MESSAGE_EXPEDITION_ITEMS));if(row)appendHistoryDetailById(row.id,`Бутылка открыта • найдено: ${item.name}`);showChoice('Документ из послания',`Найдено: ${item.name}. Попытаться расшифровать координаты острова?`,[{label:'Расшифровать',value:'decode'},{label:'Отложить',value:'later'}],answer=>{if(answer==='decode')decodeExpeditionItem(item.id);});}else if(row)appendHistoryDetailById(row.id,'Бутылка оставлена закрытой до конца сессии');commitState();});return true;
}


let arcadeTimer=null;
let arcadeStatusTimer=null;
let activeArcadeFish=null;
const ARCADE_MAX_CATCHES=BALANCE.arcade.maxCatches;
const ARCADE_TRIGGER_CHANCE=BALANCE.arcade.triggerChance;
const ARCADE_PITY_CHANCE=BALANCE.arcade.pityChance;
const ARCADE_ORCA_CHANCE=BALANCE.arcade.orcaChance;

function chooseArcadeFishCategory() {
  const roll=Math.random();
  if (roll<0.002) return 'giant';
  if (roll<0.03) return 'heavy';
  return 'normal';
}
function maybeScheduleArcadeAfterCast() {
  clearTimeout(arcadeTimer);
  if (state.finished || activeArcadeFish || state.arcadeCaughtCount>=ARCADE_MAX_CATCHES) return;
  if (state.castsLeft<=0) return; // последний заброс не запускает событие, которое не успеет показаться
  const castsSinceSpawn=state.castClicks-(state.arcadeLastSpawnCast ?? -1);
  if (castsSinceSpawn < 2) return;
  const triggerChance=castsSinceSpawn>=6?(reduceMotion?1:ARCADE_PITY_CHANCE):ARCADE_TRIGGER_CHANCE;
  if (!chance(triggerChance)) return;
  const delay=400+Math.random()*1000;
  arcadeTimer=setTimeout(()=>{
    if (!state.finished && state.sessionDate && !activeArcadeFish && !document.hidden && state.arcadeCaughtCount<ARCADE_MAX_CATCHES) {
      spawnArcadeCreature();
    }
  },delay);
}
function spawnArcadeCreature() {
  const layer=$('arcadeLayer');
  if (!layer || activeArcadeFish || state.finished || state.arcadeCaughtCount>=ARCADE_MAX_CATCHES) return;
  const direction=chance(.5)?'left-to-right':'right-to-left';
  const isOrca=chance(ARCADE_ORCA_CHANCE);
  const category=isOrca?null:chooseArcadeFishCategory();
  const duration=isOrca?rand(3.5,4.2):rand(3.5,5);
  const el=document.createElement('button');
  el.type='button';
  el.className=`arcade-fish ${direction} ${isOrca?'arcade-orca':`category-${category}`}`;
  el.setAttribute('aria-label',isOrca?'Касатка в аркадной дорожке':'Поймать проплывающую рыбу');
  el.innerHTML=isOrca
    ? '<span class="arcade-orca-body"><span class="arcade-orca-fin"></span><span class="arcade-orca-tail"></span><span class="arcade-orca-pectoral"></span></span>'
    : '<span class="arcade-fish-body"><span class="arcade-fish-eye"></span><span class="arcade-fish-tail"></span><span class="arcade-fish-pectoral"></span></span>';
  el.style.setProperty('--arcade-y','50%');
  el.style.setProperty('--arcade-duration',`${duration.toFixed(2)}s`);
  const token={el,category,isOrca,caught:false};
  activeArcadeFish=token;
  state.arcadeLastSpawnCast=state.castClicks;
  el.addEventListener('click',()=>catchArcadeCreature(token),{once:true});
  el.addEventListener('animationend',()=>removeArcadeCreature(token));
  layer.appendChild(el);
}
function removeArcadeCreature(token) {
  token?.el?.remove();
  if (activeArcadeFish===token) activeArcadeFish=null;
}
function showArcadeCatchStatus() {
  const status=$('arcadeStatus');
  if (!status) return;
  clearTimeout(arcadeStatusTimer);
  status.textContent=`🐠 Аркадный улов: ${state.arcadeCaughtCount} из ${ARCADE_MAX_CATCHES}`;
  status.classList.remove('show');
  void status.offsetWidth;
  status.classList.add('show');
  arcadeStatusTimer=setTimeout(()=>status.classList.remove('show'),4000);
}
function catchArcadeCreature(token) {
  if (!token || token.caught || state.finished) return;
  token.caught=true;
  token.el.classList.add('caught');
  if (token.isOrca) {
    TelegramApp?.HapticFeedback?.notificationOccurred?.('error');
    processDebuff('Касатка',{arcadeCatch:true});
    appendLatestHistoryDetail('debuff','Поймана в аркадной дорожке и атаковала улов');
  } else {
    if (state.arcadeCaughtCount>=ARCADE_MAX_CATCHES) { removeArcadeCreature(token); return; }
    state.arcadeCaughtCount++;
    TelegramApp?.HapticFeedback?.notificationOccurred?.('success');
    makeFish(token.category,'Аркадный улов',false,{arcadeCatch:true});
    maybeFindExpeditionItem('Аркадный улов');
    showArcadeCatchStatus();
  }
  commitState();
  setTimeout(()=>removeArcadeCreature(token),220);
}

const DUNGEON_ASSET_PATH='./assets/dungeons/eternal-darkness-vault/';
const DUNGEON_NAME='Хранилище вечной тьмы';
const DUNGEON_WEAPONS=Object.freeze({dagger:{name:'Кинжал',file:'weapon-dagger.webp'},sword:{name:'Меч',file:'weapon-sword.webp'},hammer:{name:'Молот',file:'weapon-hammer.webp'},shield:{name:'Щит',file:'weapon-shield.webp'}});
const DUNGEON_ALLIES=Object.freeze({eel:{name:'Электрический угорь',file:'ally-electric-eel.webp'},stonefish:{name:'Рыба-камень',file:'ally-stonefish.webp'},shark:{name:'Гоблиновая акула',file:'ally-goblin-shark.webp'},crab:{name:'Краб-йети',file:'ally-yeti-crab.webp'}});
const DUNGEON_REWARDS=Object.freeze({eye:{name:'Око Балистьера',file:'loot-ballistier-eye.webp'},flame:{name:'Пылающее ядро',file:'loot-burning-core.webp'},abyss:{name:'Ядро бездны',file:'loot-abyss-core.webp'}});
function ensureDungeon(){const base=initialState().dungeon;state.dungeon={...base,...(state.dungeon||{})};if(!Array.isArray(state.dungeon.rewards))state.dungeon.rewards=[];if(!Array.isArray(state.dungeon.feats))state.dungeon.feats=[];}
function activeDungeonPrompt(){const encounter=state.dungeon?.encounter;return encounter&&['piranhas','trail'].includes(encounter.phase)?encounter:null;}
function dungeonImg(file,label,extra=''){return `<span class="dungeon-icon${extra?` ${extra}`:''}" title="${label}"><img src="${DUNGEON_ASSET_PATH}${file}" alt="" aria-hidden="true" decoding="async" onerror="this.parentElement.classList.add('is-missing')"><span>${label.slice(0,1)}</span></span>`;}
function dungeonAvailableFish(){return state.fish.filter(f=>!f.removed&&!fishIsEaten(f)&&!fishIsStolen(f)&&!f.islandDisplaced&&!f.islandTraded&&!f.riftSacrificeLabel&&!f.dungeonSacrifice);}
function maybeSpawnPiranhas(fish){
  ensureDungeon();if(fish.source!=='Заброс'||!fish.direct||fish.removed)return;
  state.dungeon.ordinaryFishSinceRoll=(state.dungeon.ordinaryFishSinceRoll||0)+1;
  if(state.dungeon.ordinaryFishSinceRoll<BALANCE.dungeon.piranhaEveryFish)return;
  state.dungeon.ordinaryFishSinceRoll=0;if(state.dungeon.encounter||!chance(BALANCE.dungeon.piranhaChance))return;
  const row=addHistory('Пираньи вечной тьмы','dungeon','(Фиолетовые силуэты кружат в воде • жертву можно выбрать до четвёртого заброса)',{numbered:false,dungeonAction:'sacrifice'});
  state.dungeon.encounter={id:uid(),phase:'piranhas',historyRowId:row.id,castsUsed:0,sacrifice:null,cleanWeight:null,weapon:null,ally:null,playerHp:BALANCE.dungeon.playerHealth,bossHp:BALANCE.dungeon.bossHealth,round:0,log:[],speed:1};
}
function expireDungeonEncounterBeforeCast(){
  ensureDungeon();const d=state.dungeon.encounter;if(!d||!['piranhas','trail'].includes(d.phase)||d.castsUsed<BALANCE.dungeon.trailCasts)return false;
  const row=state.history.find(h=>h.id===d.historyRowId);if(row){row.dungeonAction=null;row.detail=d.phase==='trail'?'(Алый след растворился • вход в подземелье закрыт)':'(Стайка не дождалась жертвы и уплыла)';}
  state.dungeon.encounter=null;return true;
}
function advanceDungeonEncounterAfterCast(){const d=state.dungeon?.encounter;if(d&&['piranhas','trail'].includes(d.phase))d.castsUsed=(d.castsUsed||0)+1;}
function openDungeonSacrifice(){
  const d=state.dungeon?.encounter;if(!d||d.phase!=='piranhas')return;const fish=dungeonAvailableFish();if(!fish.length){toast('Нет доступной рыбы для жертвы');return;}
  const scene=$('dungeonScene');scene.innerHTML=`<section class="dungeon-picker"><p class="dungeon-kicker">Пираньи вечной тьмы</p><h2>Выберите рыбу-жертву</h2><p>Её чистый вес сохранится для расчёта боя, но не войдёт в итог сессии.</p><div class="dungeon-fish-grid">${fish.map(f=>`<button type="button" data-dungeon-fish="${f.id}">${fishCategoryIcons(f,'is-dungeon-icon')}<strong>${capitalize(f.name)}</strong><small>${kg(f.weight)} • чистый вес ${kg(dungeonFishCleanWeight(f))}</small></button>`).join('')}</div><button type="button" class="secondary-btn" data-dungeon-close>Продолжить рыбалку</button></section>`;
  scene.onclick=e=>{if(e.target.closest('[data-dungeon-close]')){$('dungeonDialog').close();return;}const button=e.target.closest('[data-dungeon-fish]');if(button)sacrificeDungeonFish(button.dataset.dungeonFish);};$('dungeonDialog').showModal();
}
function sacrificeDungeonFish(id){
  const d=state.dungeon?.encounter,fish=dungeonAvailableFish().find(f=>f.id===id);if(!d||d.phase!=='piranhas'||!fish)return;
  fish.removed=true;fish.dungeonSacrifice=true;d.sacrifice={id:fish.id,name:fish.name,weight:fish.weight,originalWeight:fish.originalWeight,cleanWeight:dungeonFishCleanWeight(fish)};d.phase='trail';d.castsUsed=0;
  const fishRow=state.history.find(h=>h.type==='fish'&&h.fishId===fish.id);if(fishRow){fishRow.dungeonSacrifice=true;fishRow.detail=`(Принесена в жертву магматическим пираньям • ${kg(fish.weight)} исключено из итога)`;}
  const row=state.history.find(h=>h.id===d.historyRowId);if(row){row.text='Алый след';row.detail=`(Пираньи приняли ${capitalize(fish.name)} • вход доступен ещё 3 заброса)`;row.dungeonAction='dive';}
  $('dungeonDialog').close();commitState();
}
function dungeonFishCleanWeight(fish){return fish?.debuffLimited&&Number.isFinite(fish.debuffBaseWeight)?fish.debuffBaseWeight:(Number(fish?.originalWeight)||0);}
function dungeonSacrificeCleanWeight(sacrifice){if(!sacrifice)return 0;if(Number.isFinite(sacrifice.cleanWeight))return sacrifice.cleanWeight;const fish=state.fish.find(f=>f.id===sacrifice.id);return fish?dungeonFishCleanWeight(fish):(Number(sacrifice.originalWeight)||0);}
function dungeonCleanWeight(d){return round1(state.fish.filter(f=>!f.removed).reduce((sum,f)=>sum+dungeonFishCleanWeight(f),0)+dungeonSacrificeCleanWeight(d.sacrifice));}
function beginDungeonDive(){const d=state.dungeon?.encounter;if(!d||d.phase!=='trail')return;d.phase='splash';d.cleanWeight=dungeonCleanWeight(d);render();renderDungeon();}
function dungeonButtonIcon(file,label){return `${dungeonImg(file,label)}<span class="dungeon-object-label">${label}</span>`;}
function dungeonPlacedObject(kind,file,label,slot,action=''){const data=action?` data-${action}="${slot}"`:'';return `<button type="button" class="dungeon-placed-object is-${kind} slot-${slot}"${data}>${dungeonButtonIcon(file,label)}</button>`;}
function dungeonLevelHeading(level,title){return `<header class="dungeon-level-heading"><span>${level}</span><strong>${title}</strong></header>`;}
function dungeonWorld(d,phase,overlay=''){
  const weapon=d.weapon?DUNGEON_WEAPONS[d.weapon]:null,ally=d.ally?DUNGEON_ALLIES[d.ally]:null;
  const weaponSlot=Number.isInteger(d.weaponSlot)?d.weaponSlot:0,allySlot=Number.isInteger(d.allySlot)?d.allySlot:0;
  const chests=Array.from({length:4},(_,i)=>d.weapon?(i===weaponSlot?dungeonPlacedObject('weapon',weapon.file,weapon.name,i):''):dungeonPlacedObject('chest','chest.webp',`Сундук ${i+1}`,i,'dungeon-chest')).join('');
  const orbs=Array.from({length:4},(_,i)=>d.ally?(i===allySlot?dungeonPlacedObject('ally',ally.file,ally.name,i):''):dungeonPlacedObject('orb','ally-orb.webp',`Сфера ${i+1}`,i,'dungeon-orb')).join('');
  const reveal=phase==='weapon'||phase==='weaponLoot'?1:phase==='ally'||phase==='allyLoot'?2:3;
  return `<section class="dungeon-world reveal-${reveal}">
    <div class="dungeon-level level-three">${reveal>=3?`${dungeonLevelHeading('Третий уровень','Балистьер — могучий страж')}<div class="dungeon-boss-anchor">${dungeonImg('boss-ballistier.webp','Балистьер','is-boss')}<small>3000 здоровья</small></div>${phase==='boss'?'<button type="button" class="primary-btn dungeon-fight-btn" data-dungeon-fight>Начать сражение</button>':''}`:''}</div>
    <div class="dungeon-level level-two">${reveal>=2?`${dungeonLevelHeading('Второй уровень',d.ally?'Союзник выбран':'Выберите сферу союзника')}<div class="dungeon-level-objects">${orbs}</div>`:''}</div>
    <div class="dungeon-level level-one">${dungeonLevelHeading('Первый уровень',d.weapon?'Оружие получено':'Выберите один из четырёх сундуков')}<div class="dungeon-level-objects">${chests}</div></div>
    ${reveal<3?'<div class="dungeon-fog fog-level-three" aria-hidden="true"></div>':''}${reveal<2?'<div class="dungeon-fog fog-level-two" aria-hidden="true"></div>':''}
    ${reveal>1?`<div class="dungeon-reveal-wave reveal-wave-${reveal}" aria-hidden="true"></div>`:''}${overlay}
  </section>`;
}
function renderDungeon(){
  const d=state.dungeon?.encounter,dialog=$('dungeonDialog'),scene=$('dungeonScene');if(!d||!dialog||!scene)return;
  dialog.dataset.phase=d.phase;
  if(d.phase==='splash')scene.innerHTML=`<section class="dungeon-splash"><div class="dungeon-splash-weight">Чистый вес отряда: <strong>${kg(d.cleanWeight)}</strong></div><button type="button" class="primary-btn dungeon-enter" data-dungeon-enter>Войти</button></section>`;
  else if(d.phase==='weapon')scene.innerHTML=dungeonWorld(d,'weapon');
  else if(d.phase==='weaponLoot')scene.innerHTML=dungeonWorld(d,'weaponLoot',dungeonLootScene('Получено оружие',DUNGEON_WEAPONS[d.weapon],dungeonWeaponDescription(d.weapon),'weapon-confirm'));
  else if(d.phase==='ally')scene.innerHTML=dungeonWorld(d,'ally');
  else if(d.phase==='allyLoot')scene.innerHTML=dungeonWorld(d,'allyLoot',dungeonLootScene('К отряду присоединяется',DUNGEON_ALLIES[d.ally],dungeonAllyDescription(d.ally),'ally-confirm'));
  else if(d.phase==='boss')scene.innerHTML=dungeonWorld(d,'boss');
  else if(d.phase==='battle')scene.innerHTML=dungeonBattleMarkup(d);
  else if(d.phase==='result')scene.innerHTML=dungeonResultMarkup(d);
  scene.onclick=handleDungeonClick;if(!dialog.open)dialog.showModal();
  requestAnimationFrame(()=>scene.querySelectorAll('.battle-log-entries').forEach(log=>{log.scrollTop=log.scrollHeight;}));
}
function dungeonLootScene(title,item,description,action){return `<div class="dungeon-loot-backdrop"><section class="dungeon-loot-pop ui-dialog-panel"><p class="dungeon-kicker">Добыча</p><h2>${title}</h2>${dungeonImg(item.file,item.name,'is-loot')}<h3>${item.name}</h3><p>${description}</p><button type="button" class="primary-btn" data-dungeon-${action}>Подтвердить</button></section></div>`;}
function dungeonWeaponDescription(key){return {dagger:'Быстрые повторы, критические и накапливаемые точные удары.',sword:'Тройной базовый урон и глубокие раны.',hammer:'Случайная мощь и шанс оглушения.',shield:'Поглощение атак и защищённые криты.'}[key];}
function dungeonAllyDescription(key){return {eel:'Каждый третий ход атакует и накапливает статическое электричество.',stonefish:'Каждый третий ход принимает 80% основной атаки.',shark:'Каждый третий ход атакует и усиливает следующий удар.',crab:'Каждый третий ход возвращает основную атаку боссу.'}[key];}
function handleDungeonClick(e){
  const d=state.dungeon?.encounter;if(!d)return;
  if(e.target.closest('[data-dungeon-enter]')){d.phase='weapon';renderDungeon();return;}
  if(e.target.closest('[data-dungeon-chest]')){const button=e.target.closest('[data-dungeon-chest]');d.weaponSlot=Number(button.dataset.dungeonChest);d.weapon=pick(Object.keys(DUNGEON_WEAPONS));d.phase='weaponLoot';renderDungeon();return;}
  if(e.target.closest('[data-dungeon-weapon-confirm]')){d.phase='ally';renderDungeon();return;}
  if(e.target.closest('[data-dungeon-orb]')){const button=e.target.closest('[data-dungeon-orb]');d.allySlot=Number(button.dataset.dungeonOrb);d.ally=pick(Object.keys(DUNGEON_ALLIES));d.phase='allyLoot';renderDungeon();return;}
  if(e.target.closest('[data-dungeon-ally-confirm]')){d.phase='boss';renderDungeon();return;}
  if(e.target.closest('[data-dungeon-fight]')){startDungeonBattle();return;}
  if(e.target.closest('[data-dungeon-speed]')){d.speed=d.speed===1?4:1;e.target.closest('[data-dungeon-speed]').textContent=d.speed===4?'Скорость ×4':'Ускорить ×4';return;}
  if(e.target.closest('[data-dungeon-return]')){finishDungeonReturn();}
}
function battleLogTone(event){if(event?.tone)return event.tone;const text=String(event?.text||'');if(/принимает|перенаправ/i.test(text))return 'mitigation';if(/поглощ|готова|оглушён|блок|защит/i.test(text))return 'positive';if(/^−|−\d|урон|магма/i.test(`${event?.floatText||''} ${text}`))return 'damage';return 'neutral';}
function battleLogColumn(events,side,title){return `<aside class="battle-log battle-log-${side}"><h3>${title}</h3><div class="battle-log-entries">${events.map(x=>`<p class="tone-${battleLogTone(x)}">${x.text}</p>`).join('')}</div></aside>`;}
function dungeonBattleMarkup(d){const playerPct=Math.max(0,d.playerHp/BALANCE.dungeon.playerHealth*100),bossPct=Math.max(0,d.bossHp/BALANCE.dungeon.bossHealth*100),event=d.lastBattleEvent,toPlayer=d.log.filter(x=>x.target==='player'),toBoss=d.log.filter(x=>x.target==='boss');return `<section class="dungeon-battle-world"><div class="dungeon-battle-hud"><span>Раунд ${Math.max(1,d.round)} / ${BALANCE.dungeon.rounds}</span><button type="button" class="secondary-btn battle-speed" data-dungeon-speed>${d.speed===4?'Скорость ×4':'Ускорить ×4'}</button></div><div class="battle-actor boss-actor">${dungeonImg('boss-ballistier.webp','Балистьер','is-battle-boss')}<strong>Балистьер</strong></div><div class="battle-health boss"><span>Балистьер</span><div class="battle-health-track"><i style="width:${bossPct}%"></i></div><strong>${Math.max(0,d.bossHp)} / ${BALANCE.dungeon.bossHealth}</strong></div><div class="battle-actor ally-actor">${dungeonImg(DUNGEON_ALLIES[d.ally].file,DUNGEON_ALLIES[d.ally].name,'is-fighter')}<small>${DUNGEON_ALLIES[d.ally].name}</small></div><div class="battle-actor player-actor">${dungeonImg(DUNGEON_WEAPONS[d.weapon].file,DUNGEON_WEAPONS[d.weapon].name,'is-fighter')}<strong>Игрок</strong></div><div class="battle-health player"><span>Игрок</span><div class="battle-health-track"><i style="width:${playerPct}%"></i></div><strong>${Math.max(0,d.playerHp)} / ${BALANCE.dungeon.playerHealth}</strong></div>${!reduceMotion&&event?`<div class="dungeon-damage-float target-${event.target} is-${event.side}" data-event="${event.id}"><strong>${event.floatText}</strong><small>${event.caption||''}</small></div>`:''}${battleLogColumn(toPlayer,'player','По игроку')}${battleLogColumn(toBoss,'boss','По Балистьеру')}</section>`;}
function battleLog(d,side,text,target='boss',floatText='',tone=''){const event={id:(d.battleEventId||0)+1,side,text,target,floatText:floatText||text,caption:text,tone};d.battleEventId=event.id;d.log.push(event);d.lastBattleEvent=event;if(d.log.length>30)d.log.shift();}
function playerAttack(d,turn){
  const w=Math.max(.1,d.cleanWeight),even=turn%2===0;let damage=0,notes=[];
  if(d.weapon==='dagger'){const crit=even&&chance(.5),hit=w*(crit?2:1);damage=hit*(even?2:1);if(crit)notes.push('крит');if(even)notes.push('повтор');if(turn%3===0&&chance(.5)){const precise=Math.floor(rand(10,21));d.preciseStrikes=(d.preciseStrikes||0)+precise;notes.push(`точные удары +${precise} (всего ${d.preciseStrikes})`);}}
  if(d.weapon==='sword'){const base=w*3,crit=chance(.5);damage=base*(crit?3:1);if(crit)notes.push('крит');if(even&&chance(.5)){d.deepWounds=(d.deepWounds||0)+15;damage+=d.deepWounds;notes.push(`глубокие раны ${d.deepWounds}`);}}
  if(d.weapon==='hammer'){const base=w+pick([10,20,30,40,50]),mult=chance(.5)?2:3;damage=base*mult;notes.push(`крит ×${mult}`);if(even&&chance(.35)){d.bossStunned=true;notes.push('оглушение');}}
  if(d.weapon==='shield'){damage=w+10;if(even&&chance(.5)){damage+=30;notes.push('крит');}if(even&&chance(.5)){d.absorb=true;notes.push('поглощение');}}
  if(d.goblinBoost){damage+=50;d.goblinBoost=false;notes.push('усиление +50');}
  damage=Math.round(damage);d.bossHp=Math.max(0,d.bossHp-damage);battleLog(d,'player',`Игрок: −${damage}${notes.length?` (${notes.join(', ')})`:''}`,'boss',`−${damage}`);
}
function allyAction(d,turn){if(turn%3!==0)return false;d.stoneRedirect=false;d.yetiReflect=false;if(d.ally==='eel'){const damage=Math.floor(rand(50,101)),staticCharge=Math.floor(rand(10,21));d.bossHp=Math.max(0,d.bossHp-damage);d.staticElectricity=(d.staticElectricity||0)+staticCharge;battleLog(d,'ally',`Электрический шок: −${damage} • статическое электричество +${staticCharge} (всего ${d.staticElectricity})`,'boss',`−${damage}`,'ally-electric');}if(d.ally==='stonefish'){d.stoneRedirect=true;battleLog(d,'ally','Каменная стойкость готова','player','80% защиты','ally-stone');}if(d.ally==='shark'){const damage=Math.floor(rand(100,201));d.bossHp=Math.max(0,d.bossHp-damage);d.goblinBoost=true;battleLog(d,'ally',`Терзающий выпад: −${damage}, следующая атака +50`,'boss',`−${damage}`,'ally-shark');}if(d.ally==='crab'){d.yetiReflect=true;battleLog(d,'ally','Хитрый трюк готов','boss','Отражение','ally-crab');}return true;}
function bossAttack(d){if(d.bossStunned){d.bossStunned=false;battleLog(d,'boss','Балистьер оглушён и пропускает атаку','boss','ОГЛУШЁН');return 0;}d.bossAttacks=(d.bossAttacks||0)+1;let damage=40;if(chance(.3))damage+=pick([10,20,30]);if(d.yetiReflect){d.bossHp=Math.max(0,d.bossHp-damage);d.yetiReflect=false;battleLog(d,'ally',`Хитрый трюк возвращает боссу ${damage} урона`,'boss',`−${damage}`,'ally-crab');}else if(d.absorb){d.absorb=false;battleLog(d,'player',`Щит полностью поглощает ${damage} урона`,'player','ПОГЛОЩЕНО');}else if(d.stoneRedirect){const playerDamage=Math.round(damage*.2);d.playerHp=Math.max(0,d.playerHp-playerDamage);d.stoneRedirect=false;battleLog(d,'ally',`Рыба-камень принимает 80%, игрок получает ${playerDamage}`,'player',`−${playerDamage}`,'ally-stone');}else{d.playerHp=Math.max(0,d.playerHp-damage);battleLog(d,'boss',`Балистьер: −${damage}`,'player',`−${damage}`);}return d.bossAttacks>=5&&d.playerHp>0?Math.floor(rand(10,21)):0;}
function applyBossMagma(d,magma){if(!magma||d.playerHp<=0)return;d.playerHp=Math.max(0,d.playerHp-magma);battleLog(d,'boss',`Жидкая магма: −${magma}`,'player',`−${magma}`,'magma');}
function applyDaggerPreciseStrikes(d){const damage=Math.max(0,Math.round(d.preciseStrikes||0));if(d.weapon!=='dagger'||!damage||d.bossHp<=0)return 0;d.bossHp=Math.max(0,d.bossHp-damage);battleLog(d,'player',`Точные удары: −${damage}`,'boss',`−${damage}`);return damage;}
function applyStaticElectricity(d){const damage=Math.max(0,Math.round(d.staticElectricity||0));if(d.ally!=='eel'||!damage||d.bossHp<=0)return 0;d.bossHp=Math.max(0,d.bossHp-damage);battleLog(d,'ally',`Статическое электричество: −${damage}`,'boss',`−${damage}`,'ally-electric');return damage;}
function dungeonBattleDelay(d){return d.speed===4?260:1050;}
function startDungeonBattle(){const d=state.dungeon.encounter;d.phase='battle';d.playerHp=BALANCE.dungeon.playerHealth;d.bossHp=BALANCE.dungeon.bossHealth;d.round=0;d.log=[];d.speed=1;d.bossAttacks=0;d.preciseStrikes=0;d.staticElectricity=0;d.battleEventId=0;d.lastBattleEvent=null;d.battleToken=uid();renderDungeon();runDungeonRound(d.battleToken);}
function runDungeonRound(token){const d=state.dungeon?.encounter;if(!d||d.phase!=='battle'||token!==d.battleToken)return;if(d.round>=BALANCE.dungeon.rounds||d.playerHp<=0||d.bossHp<=0){resolveDungeonBattle();return;}const turn=++d.round;playerAttack(d,turn);renderDungeon();setTimeout(()=>{const active=state.dungeon?.encounter;if(!active||active.phase!=='battle'||active.battleToken!==token)return;if(active.bossHp<=0){resolveDungeonBattle();return;}const allyActed=allyAction(active,turn);if(allyActed)renderDungeon();setTimeout(()=>{const current=state.dungeon?.encounter;if(!current||current.phase!=='battle'||current.battleToken!==token)return;if(current.bossHp<=0){resolveDungeonBattle();return;}const magma=bossAttack(current);applyDaggerPreciseStrikes(current);applyStaticElectricity(current);renderDungeon();const finishBossTurn=()=>setTimeout(()=>runDungeonRound(token),dungeonBattleDelay(current));if(current.bossHp<=0){setTimeout(()=>resolveDungeonBattle(),dungeonBattleDelay(current));return;}if(magma){setTimeout(()=>{const latest=state.dungeon?.encounter;if(!latest||latest.phase!=='battle'||latest.battleToken!==token)return;applyBossMagma(latest,magma);renderDungeon();finishBossTurn();},dungeonBattleDelay(current));}else finishBossTurn();},allyActed?dungeonBattleDelay(active):80);},dungeonBattleDelay(d));}
function rollDungeonAllyWeight(){if(chance(.5))return {weight:rand1(20,40),rarity:'giant'};const rarity=weightedResult({rare:45,epic:30,heavy:15,legendary:8,giant:2}),ranges={rare:[1,9.9],epic:[10,19.9],heavy:[10,19.9],legendary:[20,39.9],giant:[20,40]},range=ranges[rarity];return {weight:rand1(range[0],range[1]),rarity};}
function grantDungeonAlly(d){
  if(d.allyReward)return d.allyReward;
  const roll=rollDungeonAllyWeight(),ally=DUNGEON_ALLIES[d.ally],fish={id:uid(),name:ally.name,category:categoryForWeight(roll.weight),rarity:roll.rarity,originalWeight:roll.weight,weight:roll.weight,source:DUNGEON_NAME,direct:false,removed:false,tags:[],dungeonAlly:true,dungeonAllyKey:d.ally};
  state.fish.push(fish);addFishHistory(fish,fish.source);d.allyReward={fishId:fish.id,name:ally.name,weight:roll.weight,rarity:roll.rarity};return d.allyReward;
}
function resolveDungeonBattle(){
  const d=state.dungeon.encounter;d.phase='result';let outcome,reward=null;
  if(d.playerHp<=0){outcome='wrath';state.dungeon.wrath=true;state.fish.filter(f=>!f.removed).forEach(f=>f.smoldering=true);addHistory('Гнев Балистьера','dungeon','(Все рыбы начинают тлеть • будущий улов срывается с вероятностью 50%)',{numbered:false,dungeonOutcome:'wrath'});}
  else{grantDungeonAlly(d);if(d.bossHp<=0){outcome='victory';reward='eye';grantDungeonReward(reward);}else if(d.bossHp<BALANCE.dungeon.bossHealth*.5){outcome='reward';reward=chance(.5)?'flame':'abyss';grantDungeonReward(reward);}else outcome='ally';}
  const feats=new Set(state.dungeon.feats||[]);if(outcome==='reward')feats.add('eternalDarknessCore');if(outcome==='victory'){feats.add('ballistierEye');if(d.ally==='stonefish')feats.add('pocketTank');}if(d.playerHp>0&&d.round>=BALANCE.dungeon.rounds&&d.playerHp<=50)feats.add('lastBreath');state.dungeon.feats=[...feats];
  d.outcome=outcome;d.reward=reward;state.dungeon.runs=(state.dungeon.runs||0)+1;renderDungeon();saveDailyState();
}
function grantDungeonReward(key){ensureDungeon();const item={id:uid(),key,name:DUNGEON_REWARDS[key].name,used:false},bossHp=state.dungeon.encounter?.bossHp;state.dungeon.rewards.push(item);addHistory(item.name,'dungeon',Number.isFinite(bossHp)?`(Награда Балистьера • здоровье босса: ${bossHp}/${BALANCE.dungeon.bossHealth})`:'(Выдано через тестовую панель)',{numbered:false,dungeonReward:key});}
function dungeonResultMarkup(d){const item=d.reward?DUNGEON_REWARDS[d.reward]:null,ally=DUNGEON_ALLIES[d.ally],survived=d.outcome!=='wrath',title=d.outcome==='victory'?'Балистьер повержен':d.outcome==='reward'?'Испытание пройдено':d.outcome==='ally'?'Отряд возвращается':'Гнев Балистьера',allyCopy=survived?`${ally.name} обрёл вес ${kg(d.allyReward?.weight||0)} и отправляется с вами.`:'',copy=d.outcome==='victory'?`${allyCopy} Получен уникальный трофей — Око Балистьера.`:d.outcome==='reward'?`${allyCopy} Здоровье босса опущено ниже 50%, получена дополнительная награда.`:d.outcome==='ally'?allyCopy:'Вы потеряли сознание и вернулись к обычной рыбалке. Союзник остался в подземелье.',loot=survived?`<div class="dungeon-result-loot"><span>${dungeonImg(ally.file,ally.name,'is-loot')}<strong>${ally.name}</strong></span>${item?`<span>${dungeonImg(item.file,item.name,'is-loot')}<strong>${item.name}</strong></span>`:''}</div>`:dungeonImg('effect-ballistier-wrath.webp','Гнев Балистьера','is-loot');return `<section class="dungeon-result"><p class="dungeon-kicker">Итог сражения</p><h2>${title}</h2>${loot}<p>${copy}</p><button type="button" class="primary-btn" data-dungeon-return>Вернуться к забросам</button></section>`;}
function finishDungeonReturn(){$('dungeonDialog').close();state.dungeon.encounter=null;commitState();if(state.castsLeft<=0)maybeFinalizeSession();}
function smolderFishBeforeCast(){if(!state.dungeon?.wrath)return;state.fish.filter(f=>!f.removed).forEach(f=>{const loss=Math.floor(rand(1,6)),before=f.weight;f.weight=round1(Math.max(0,f.weight-loss));f.smolderLoss=(f.smolderLoss||0)+round1(before-f.weight);if(f.weight<=0){f.removed=true;f.ballistierSkeleton=true;f.skeletonOf=f.name;f.name=`рыбный скелет (${f.name})`;}});}
function applyBallistierWrathToFish(f){if(!state.dungeon?.wrath)return false;if(chance(.5)){f.removed=true;f.ballistierEscaped=true;return true;}f.smoldering=true;return false;}
function renderDungeonHistoryAction(row){const d=state.dungeon?.encounter;if(!d||row.id!==d.historyRowId)return '';if(row.dungeonAction==='sacrifice'&&d.phase==='piranhas')return `<div class="dungeon-history-action"><button type="button" data-dungeon-sacrifice>Выбрать жертву</button><small>До исчезновения: ${Math.max(0,BALANCE.dungeon.trailCasts-d.castsUsed)} забр.</small></div>`;if(row.dungeonAction==='dive'&&d.phase==='trail')return `<div class="dungeon-history-action"><button type="button" data-dungeon-dive>Начать погружение</button><small>Алый след: ${Math.max(0,BALANCE.dungeon.trailCasts-d.castsUsed)} забр.</small></div>`;return '';}
function dungeonHistoryIconMarkup(row){
  if(row.type!=='dungeon')return '';
  if(row.dungeonReward&&DUNGEON_REWARDS[row.dungeonReward]){const item=DUNGEON_REWARDS[row.dungeonReward];return dungeonImg(item.file,item.name,'is-history-icon');}
  if(row.dungeonOutcome==='wrath'||/Гнев Балистьера/i.test(String(row.text||'')))return dungeonImg('effect-ballistier-wrath.webp','Гнев Балистьера','is-history-icon');
  if(row.dungeonDebuffPrediction)return dungeonImg(DUNGEON_REWARDS.eye.file,DUNGEON_REWARDS.eye.name,'is-history-icon');
  return dungeonImg('piranhas-eternal-darkness.webp','Пираньи вечной тьмы','is-history-icon');
}
function renderDungeonPrediction(row){if(!row.dungeonPredictionOpen)return '';return `<div class="dungeon-history-action dungeon-prediction-action"><button type="button" data-dungeon-debuff="accept" data-history-row="${row.id}">Принять</button><button type="button" data-dungeon-debuff="decline" data-history-row="${row.id}">Отказаться</button></div>`;}
function renderBallistierSmolder(fish){if(!fish?.smoldering||fish.removed)return '';return `<small class="history-detail dungeon-smolder-note">Тлеет от Гнева Балистьера${fish.smolderLoss?` • потеряно ${kg(fish.smolderLoss)}`:''}</small>`;}
function ballistierWrathFishBadge(fish){
  if(!fish?.smoldering&&!fish?.ballistierSkeleton&&!fish?.ballistierEscaped)return '';
  const label='Гнев Балистьера';
  return `<span class="fish-effect-badge ballistier-wrath-fish-badge" title="${label}" aria-label="${label}"><img src="${DUNGEON_ASSET_PATH}effect-ballistier-wrath.webp" alt="" aria-hidden="true" decoding="async"></span>`;
}
function resolveDungeonDebuffPrediction(rowId,accept){const row=state.history.find(h=>h.id===rowId&&h.dungeonPredictionOpen);if(!row)return;row.dungeonPredictionOpen=false;row.detail=accept?'(Предсказание принято)':'(Предсказание отвергнуто • заброс израсходован)';if(accept)processDebuff(row.dungeonDebuffPrediction);commitState();}
function useDungeonAbyssCore(id){ensureDungeon();const core=state.dungeon.rewards.find(item=>item.id===id&&item.key==='abyss'&&!item.used);if(!core||state.rifts?.active||state.dungeon.encounter||state.finished){toast('Сейчас Ядро бездны использовать нельзя');return;}core.used=true;makeRift(pick(Object.keys(RIFT_TYPES)),true);state.rifts.active.guaranteedSuccess=true;state.rifts.active.message+='<br><strong>Ядро бездны: все проверки этого Разлома защищены от провала.</strong>';renderRift();saveDailyState();}

function castLine() {
  if (state.finished || state.castsLeft<=0 || $('choiceDialog').open || $('riftDialog')?.open || $('dungeonDialog')?.open || state.islands?.active || hasPendingAbyssalDecision()) return;
  expireDungeonEncounterBeforeCast();
  TelegramApp?.HapticFeedback?.impactOccurred?.('medium');
  if (!state.sessionDate) state.sessionDate=localDayKey();
  playSound('cast');
  animateCast();
  state.castClicks++; state.castsLeft--;
  smolderFishBeforeCast();
  const fishStart=state.fish.length;
  const prepared=state.rifts?.preparedCatch;
  const eyeDescriptor=!prepared?nextEyeDescriptor():null;
  const mythicName=!prepared&&!eyeDescriptor?rollMythicName(state.weather):null;
  const rageCycles=(state.mythic.eyeCycles||[]).filter(x=>x.mode==='rage'&&x.remaining>=0&&x.step>0&&x.step<=4);
  const rageAbyssBoost=rageCycles.reduce((sum,x)=>sum+.10+(x.step-1)*.02,0);
  const abyssalCatch=!prepared&&!eyeDescriptor&&!mythicName&&!abyssalEntity()&&ABYSSAL_WEATHERS.includes(state.weather)&&chance(Math.min(1,BALANCE.abyssal.castChance+rageAbyssBoost));
  const descriptor=eyeDescriptor||(mythicName?{type:'mythic',name:mythicName}:(!prepared&&!abyssalCatch?mythicCatchDescriptor(state.weather,false):null));
  const type=prepared?'prepared':abyssalCatch?'abyssal':descriptor?.type;
  if (prepared) state.rifts.preparedCatch=null;
  if (prepared) {
    if (prepared==='normal'||prepared==='heavy'||prepared==='giant') makeFish(prepared,'Заброс',true);
    else if(prepared==='trash')processTrash();else if(prepared==='bonus')processBonus();else if(prepared==='coin')processCoinCatch();else if(prepared==='epic')processEpic();else if(prepared==='legendary')processLegendary();
  }
  const historyStart=state.history.length;
  if(descriptor)executeCatchDescriptor(descriptor);
  if (type==='abyssal') catchAbyssalLife('cast');
  if(eyeDescriptor&&!abyssalEntity()){
    const extraAbyssChance=rageAbyssBoost+(ABYSSAL_WEATHERS.includes(state.weather)?BALANCE.abyssal.castChance:0);
    if(extraAbyssChance&&chance(Math.min(1,extraAbyssChance)))catchAbyssalLife('cast');
  }
  if(state.mythic.primordialChaos&&state.castClicks===0){commitState();return;}
  maybeTriggerDebuffEvent();
  const angusTrailActive=(state.angusTrailCasts||0)>0,angusAppeared=chance(angusTrailActive ? .05 : BALANCE.events.angusChance);if(angusTrailActive)state.angusTrailCasts--;if(angusAppeared){if(angusTrailActive)state.angusTrailCasts=0;encounterAngus(angusTrailActive);}
  if (!state.mythic.primordialChaos&&chance(BALANCE.events.weatherChangeChance)) changeWeatherRandomly();
  if (state.rifts?.pendingDanger) { state.rifts.pendingDanger=false; processDebuff(chance(.5)?'Касатка':pick(['Чайка','Осьминог'])); appendLatestHistoryDetail('debuff','Пробуждение Левиафана исполнило обещанное опасное событие'); }
  if(type!=='abyssal')advanceAbyssalAfterCast();
  const mainRow=state.history.slice(historyStart).find(row=>row.numbered)||null;
  const castFish=state.fish.slice(fishStart).find(f=>f.source==='Заброс'&&!f.removed&&['normal','heavy','giant'].includes(f.category)),echoRay=state.fish.find(f=>f.islandEchoRay&&!f.removed);if(castFish&&echoRay&&chance(.2)){const echo=makeFish(castFish.category,'Эхо улова',false,{parentHistoryId:mainRow?.id||null});echo.tags.push(`Эхо улова создано ${echoRay.name}`);echoRay.echoCatches=(echoRay.echoCatches||0)+1;addIslandFeat('waterMemory');if(mainRow)appendHistoryDetailById(mainRow.id,`Память течения создала дополнительную рыбу категории «${castFish.category}»`);}
  const sparkRift=advanceMythicAfterCast(mainRow);
  growBottomlessChestFishAfterCast();
  if(state.mythic.primordialChaos)changeWeatherRandomly('Первобытный хаос');
  if(sparkRift&&hasPendingAbyssalDecision())state.mythic.pendingSparkRift=true;
  else if(sparkRift&&!state.rifts.active)makeRift(pick(Object.keys(RIFT_TYPES)),true);
  const riftOpened=sparkRift||maybeOpenRiftAfterCast();
  maybeFindExpeditionItem('Обычный заброс');
  const activeGraniteCatfish=state.fish.find(f=>f.islandGraniteCatfish&&!f.removed);if(activeGraniteCatfish&&chance(.25)){state.castsLeft++;activeGraniteCatfish.graniteSavedCasts=(activeGraniteCatfish.graniteSavedCasts||0)+1;renderHistory();}
  if (!riftOpened&&!hasPendingAbyssalDecision()) maybeScheduleArcadeAfterCast();
  advanceDungeonEncounterAfterCast();
  if (state.castsLeft<=0 && !$('choiceDialog').open) maybeFinalizeSession();
  commitState();
}
function changeWeatherRandomly(source='Случайное течение') {
  const options=Object.keys(DATA.weather).filter(k=>k!==state.weather);
  if(state.rifts?.obsidianArmed){
    const armedId=state.rifts.obsidianArmed;
    const relic=state.rifts.relics.find(item=>item.name==='Обсидиановый ключ'&&(armedId===true||item.id===armedId));
    const pair=sampleUnique(options,2);
    showChoice('Обсидиановый ключ',`Автоматическая смена погоды (${source}). Выберите направление:`,pair.map(k=>DATA.weather[k].name),choice=>{
      const key=pair.find(k=>DATA.weather[k].name===choice);
      state.rifts.obsidianArmed=false;
      applyRandomWeather(key,`Обсидиановый ключ • ${source}`);
      if(relic&&!relic.used)markRelicUsed(relic,`выбрана погода «${choice}» при автоматической смене`);
    });
    return true;
  }
  applyRandomWeather(pick(options),source);
  return false;
}
function applyRandomWeather(key,source='Случайное течение') {
  state.weather=key;
  if (!state.weatherSeen.includes(state.weather)) state.weatherSeen.push(state.weather);
  if (state.weather==='storm') state.stormSeen=true;
  playSound('weather');
  showWeatherTransition(state.weather);
  addHistory(`Погода изменилась: ${DATA.weather[state.weather].name}`,'weather',`(${DATA.weather[state.weather].text} • ${source})`,{weatherKey:state.weather});
}

function finalFishSnapshot() {
  state.fish.forEach(item=>{ delete item.scubaImpact; delete item.maskImpact; delete item.diceImpact;delete item.finalWeight;delete item.finalCategory; });
  state.history.forEach(row=>{ delete row.scubaApplication; delete row.maskApplication; });
  const fish=state.fish.filter(f=>!f.removed).map(f=>({...f}));
  const maskBonuses=activeBonuses('Подводная маска');
  const masks=maskBonuses.length;
  if (masks) {
    const factor=maskBonuses.reduce((total,b)=>total*(b.abyssEnhanced?2:1.5)*(state.nautilus?2:1),1);
    fish.filter(f=>!f.tradeFish&&!f.islandColossus).forEach(f=>{
      const before=f.weight;
      f.weight=round1(f.weight*factor);
      const original=state.fish.find(item=>item.id===f.id);
      if (original) original.maskImpact={before,after:f.weight,factor:Number(factor.toFixed(3)),count:masks,nautilus:state.nautilus};
    });
    maskBonuses.forEach((bonus,index)=>{
      const row=state.history.find(item=>item.id===bonus.historyRowId) || state.history.find(item=>item.type==='bonus'&&item.text==='Подводная маска'&&item.bonusId===bonus.id);
      if (row) row.maskApplication={index:index+1,count:masks,factor:Number(factor.toFixed(3)),affectedCount:fish.filter(f=>!f.tradeFish&&!f.islandColossus).length,nautilus:state.nautilus};
    });
  }
  const scubaBonuses=activeBonuses('Акваланг');
  const tanks=scubaBonuses.length;
  if (tanks) {
    const target=fish.filter(f=>!f.removed&&!f.tradeFish&&!f.islandColossus).sort((a,b)=>b.weight-a.weight)[0];
    if (target) {
      const before=target.weight;
      if (before>=15) state.scubaAppliedTo15=true;
      const scubaFactor=scubaBonuses.reduce((total,b)=>total+(b.abyssEnhanced?4:3),0)*(state.nautilus?2:1);
      target.weight=round1(before*scubaFactor);
      const original=state.fish.find(item=>item.id===target.id);
      const eatenAfterBoost=!target.tradeFish&&activeDebuff('Касатка')&&!state.megalodon&&target.weight>=5.5;
      if (original) original.scubaImpact={before,after:target.weight,factor:scubaFactor,count:tanks,nautilus:state.nautilus,eatenAfterBoost};
      scubaBonuses.forEach((bonus,index)=>{
        const row=state.history.find(item=>item.id===bonus.historyRowId) || state.history.find(item=>item.type==='bonus'&&item.text==='Акваланг'&&item.bonusId===bonus.id);
        if (row) row.scubaApplication={index:index+1,count:tanks,targetId:target.id,targetName:target.name,before,after:target.weight,factor:scubaFactor,nautilus:state.nautilus,eatenAfterBoost};
      });
    }
  }
  if (state.diceFinalMultiplier>1) fish.filter(f=>!f.tradeFish&&!f.islandColossus).forEach(f=>{const before=f.weight;f.weight=round1(f.weight*state.diceFinalMultiplier);const original=state.fish.find(item=>item.id===f.id);if(original)original.diceImpact={before,after:f.weight,factor:state.diceFinalMultiplier};});
  if(state.dungeon?.rewards?.some(item=>item.key==='eye'&&!item.used))fish.forEach(f=>{const before=f.weight;f.weight=round1(f.weight+10);const original=state.fish.find(item=>item.id===f.id);if(original)original.ballistierEyeImpact={before,after:f.weight};});
  if(activeDebuff('Касатка')&&!state.megalodon){
    fish.forEach(f=>{
      if(f.tradeFish||f.weight<5.5||f.finalOrcaProtected)return;
      if(f.islandColossus&&f.orcaChecked)return;
      if(f.islandColossus&&!chance(.5)){f.orcaChecked=true;f.finalOrcaImpact={weight:f.weight,protected:true,islandResistance:true};const original=state.fish.find(item=>item.id===f.id);if(original){original.orcaChecked=true;original.finalOrcaImpact={...f.finalOrcaImpact};}return;}
      const original=state.fish.find(item=>item.id===f.id);
      if(consumeProtection('касаткой после финального усиления',f)){
        f.finalOrcaProtected=true;f.finalOrcaImpact={weight:f.weight,protected:true};
        if(original){original.finalOrcaProtected=true;original.finalOrcaImpact={weight:f.weight,protected:true};}
        return;
      }
      f.removed=true;f.finalOrcaImpact={weight:f.weight,protected:false};
      if(original){original.removed=true;original.finalOrcaImpact={weight:f.weight,protected:false};if(!state.eaten.some(item=>item.id===original.id))state.eaten.push(original);setFishHistoryEaten(original,true);}
      state.fishLostToDebuffs=true;
    });
    refreshUnstablePresence();
  }
  fish.forEach(f=>{const original=state.fish.find(item=>item.id===f.id);if(original){original.finalWeight=f.weight;original.finalCategory=f.category;}});
  return fish.filter(f=>!f.removed);
}
function achievements(finalFish,total) {
  const a=[];
  const fishingFish=finalFish.filter(f=>!f.tradeFish&&!f.islandColossus);
  const activeTrash=state.trash.filter(t=>!t.converted);
  const giantFinal=fishingFish.filter(f=>f.category==='giant');
  const uniqueBonusNames=new Set(state.bonuses.map(b=>b.name));
  const uniqueArtifactNames=new Set(state.artifacts.map(x=>x.name));
  const epicCount=state.artifacts.filter(x=>x.tier==='epic').length;
  const legendaryCount=state.artifacts.filter(x=>x.tier==='legendary').length;
  const activeCoreGear=hasBonus('Подводная маска')&&hasBonus('Ласты')&&hasBonus('Акваланг');
  const trashNames=new Set(state.trashNamesCaught||[]);
  const validDirectHeavy=finalFish.some(f=>f.direct&&f.category==='heavy'&&!f.debuffLimited&&!f.abyssTransformed);
  const validDirectGiant=finalFish.some(f=>f.direct&&f.category==='giant'&&!f.debuffLimited&&!f.riftTransformed&&!f.abyssTransformed);
  const validHeavyFish=fishingFish.filter(f=>f.category==='heavy'&&!f.debuffLimited);
  const loneMightyFish=fishingFish.length===1&&['heavy','giant'].includes(fishingFish[0].category)&&!fishingFish[0].debuffLimited&&fishingFish[0].weight>=20;

  // Базовые достижения
  if (!fishingFish.length && activeTrash.length>0) a.push('Трепетный эколог');
  if (state.smallFishCaught>=7) a.push('Аквариумный мастер');
  if (!state.stormSeen && state.receivedDebuffCount===0 && state.castClicks>=10) a.push('Неуловимый');
  if (validDirectGiant) a.push('Первобытный триумф');
  if (total>=150&&total<300) a.push('Гроза океана');
  if (total>=300) a.push('Повелитель глубин');
  if (state.castClicks>=15) a.push('Марафонец');
  if (giantFinal.length>=3) a.push('Мастер крупных форм');
  if (state.essenceUsed) a.push('Трансмутатор');

  // Рыба и вес
  if (['золотая рыбка','золотая форель'].every(name=>state.fish.some(f=>!f.tradeFish&&f.name===name))) a.push('Золотая чешуя');
  if (validHeavyFish.length>=4) a.push('Тяжёлая артиллерия');
  if (state.exactFortyCaught) a.push('Легенда озера');
  if (total>=99&&total<100) a.push('На волоске');
  if (total===100) a.push('Идеальный баланс');
  if (loneMightyFish) a.push('Один, но могучий');

  // Погода
  if ((state.weatherSeen||[]).length>=5) a.push('Синоптик');
  if (state.compassWeatherChanged) a.push('Повелитель стихий');
  if (state.legendaryInEclipse) a.push('Рыбак во мраке');
  if (state.epicInFog) a.push('Сквозь туман');
  if (state.thunderHeavyCaught) a.push('Гроза не помеха');
  if (state.weather==='storm'&&total>=100) a.push('Штормовой капитан');
  if (state.goldenHourFishCount>=5) a.push('Золотой улов');

  // Бонусы
  if (['Подводная маска','Ласты','Акваланг'].every(x=>uniqueBonusNames.has(x))) a.push('Полное снаряжение');
  if (state.blockedDebuffCount>=2) a.push('Под защитой');
  if (state.luckyFloatSaves>=2) a.push('Вторая попытка');
  if (state.flippersBoostedCount>=4) a.push('Ускоритель глубин');
  if (state.scubaAppliedTo15) a.push('Глубокое погружение');
  const coreGearProven=activeCoreGear
    && fishingFish.length>=5
    && state.flippersBoostedCount>=4
    && state.scubaAppliedTo15;
  if (coreGearProven) a.push('Морская машина');
  if (state.bonuses.filter(b=>b.name==='Акваланг').length>=3) a.push('Тройное погружение');
  if (DATA.bonuses.every(name=>uniqueBonusNames.has(name))) a.push('Арсенал рыбака');

  // Дебафы и восстановление
  if ((state.receivedDebuffNames||[]).length>=4&&total>=100) a.push('Переживший бурю');
  if (state.recoveredByMessage) a.push('Возвращение пропажи');
  if (state.orcaNeutralized) a.push('Не сегодня, касатка');
  if (state.bonusAfterOctopus) a.push('Освобождение от пут');
  if (state.recoveredByMegalodonCount>=2) a.push('Последняя надежда');

  // Артефакты
  if (uniqueArtifactNames.size>=4) a.push('Коллекционер глубин');
  if (epicCount>=3) a.push('Эпическое путешествие');
  if (legendaryCount>=2) a.push('Легендарный рыбак');
  if (state.nautilusActivatedWithTwoBonuses) a.push('Капитан Наутилуса');
  if (state.leviathanFishCount>=5) a.push('Дар Левиафана');
  if (epicCount>0&&legendaryCount>0) a.push('Власть над океаном');

  // Ангус
  if (state.angusEncounters>=2) a.push('Старые друзья');
  if (state.angusLegendaryGift) a.push('Щедрость Ангуса');
  if (state.angusFromCompass) a.push('Зов Компаса');
  if (state.angusGift&&total>=100) a.push('Наследник рыбака');

  // Шуточные и редкие ситуации
  if (['рваный башмак','старый кроссовок','резиновый сапог'].every(name=>trashNames.has(name))) a.push('Обувной магазин');
  if (state.seagullStoleHeaviest) a.push('Ужин чайки');
  if (!fishingFish.length&&state.hadAnyFish&&state.fishLostToDebuffs) a.push('Рыба ушла');
  if (state.maxTrashStreak>=4) a.push('Не мой день');
  if (state.deepThingConvertedCount>=3) a.push('Дар Бездны');
  if (Object.values(state.sessionCategories||{}).every(Boolean)) a.push('Морской хаос');

  // Хранилище вечной тьмы
  const dungeonFeats=new Set(state.dungeon?.feats||[]);
  if(dungeonFeats.has('eternalDarknessCore')) a.push('Сквозь вечную тьму');
  if(dungeonFeats.has('ballistierEye')) a.push('Око за око');
  if(dungeonFeats.has('pocketTank')) a.push('Карманный танк');
  if(dungeonFeats.has('lastBreath')) a.push('На последнем дыхании');

  // Разломы
  if (state.rifts?.maxDepthCompleted) a.push('За гранью');
  if (state.rifts?.feats?.includes('phantomMerge')) a.push('Призрачное слияние');
  if (state.rifts?.feats?.includes('df1Critical')) a.push('На грани имплозии');
  if (state.rifts?.feats?.includes('currentsDistorted')) a.push('Искажённая реальность');
  if (state.rifts?.feats?.includes('singularityTwins')) a.push('Близнецы сингулярности');
  if (state.rifts?.feats?.includes('unstableRevelation')) a.push('Откровение Бездны');
  if (state.rifts?.feats?.includes('leviathanBloodless')) a.push('Ни капли крови');
  if (state.rifts?.feats?.includes('gatesChosen')) a.push('Избранник Врат');
  if (state.rifts?.feats?.includes('crimsonCovenant')) a.push('Багровый завет');

  // Острова
  const islandFeats=new Set(state.islands?.feats||[]);
  if (islandFeats.has('tidesDefied')) a.push('Наперекор приливу');
  if (islandFeats.has('stormSignal')) a.push('Сигнал среди шторма');
  if (islandFeats.has('finalRoute')) a.push('Последний маршрут');
  if (islandFeats.has('fogMaster')) a.push('Хозяин тумана');
  if (islandFeats.has('guardianAccepted')) a.push('Страж признаёт достойного');
  if (islandFeats.has('repeatedRite')) a.push('Обряд повторного пути');
  if (islandFeats.has('currentsBoostClaimed')) a.push('Довериться течению');
  if (islandFeats.has('waterMemory')) a.push('Память воды');

  return [...new Set(a)];
}

function abyssChangeTargetType(change){
  if(change?.toType)return change.toType;
  if(change?.toIcon==='🔘')return 'trash';if(change?.toIcon==='🪙')return 'coin';
  return TRADE_ITEMS.some(item=>item.name===change?.toName)?'trade':'unknown';
}
function renderAbyssChangeResult(change){
  const type=abyssChangeTargetType(change);
  const icon=type==='coin'?coinIconMarkup(change.toCoinType||'copper','coin-icon-small'):type==='trade'?tradeItemIconMarkup(change.toName,'is-compact-icon'):(change.toIcon||'✦');
  return `<span class="abyss-object-result abyss-result-${type}">${icon}<strong>${capitalize(change.toName)}</strong></span>`;
}
function renderTradeItemFind(row) {
  if (!row?.tradeItemId) return '';
  const item=(state.tradeItems||[]).find(entry=>entry.id===row.tradeItemId);
  if (!item) return '';
  const itemCount=(state.tradeItems||[]).filter(entry=>entry.historyRowId===row.id&&entry.key===item.key&&!entry.abyssCreated).length;
  const countBadge=itemCount>1?`<span class="trade-item-find-count" title="Получено предметов: ${itemCount}" aria-label="Получено предметов: ${itemCount}">×${itemCount}</span>`:'';
  const change=item.abyssChange;
  if(change?.kind==='transform')return `<div class="trade-item-find is-abyss-transformed result-${abyssChangeTargetType(change)}"><span class="trade-item-spark">${tradeItemIconMarkup(item)}</span><span class="abyss-object-source">Найден предмет: <strong>${item.name}</strong>${countBadge}</span><span class="abyss-object-arrow">→</span>${renderAbyssChangeResult(change)}<small class="abyss-change-agent">${change.source}</small></div>`;
  const actuallyTraded=item.exchangeReason==='trade'||(state.tradeExchanges||[]).some(exchange=>exchange.itemId===item.id);
  const status=change?`<span class="trade-item-used trade-item-destroyed">${change.label}</span>`:actuallyTraded?'<span class="trade-item-used">обменян</span>':'';
  const notes=(item.abyssNotes||[]).map(note=>`<small class="abyss-object-note">${note}</small>`).join('');
  return `<div class="trade-item-find${change?' is-abyss-removed':''}${actuallyTraded?' is-traded':''}"><span class="trade-item-spark">${tradeItemIconMarkup(item)}</span><span>Найден предмет: <strong>${item.name}</strong>${countBadge}</span>${status}${notes}</div>`;
}
function renderExpeditionAction(row){
  if(!row?.expeditionItemId)return '';
  const item=state.islands?.items?.find(x=>x.id===row.expeditionItemId);if(!item)return '';
  if(item.status==='active')return `<button type="button" class="expedition-study-btn" data-expedition-study="${item.id}">Изучить</button>`;
  if(item.status==='failed')return '<span class="expedition-status is-failed">Расшифровка не удалась</span>';
  const expedition=state.islands?.expeditions?.find(x=>x.id===item.expeditionId),available=expedition?.status==='available';
  return available?`<button type="button" class="expedition-go-btn" data-expedition-go="${expedition.id}">Отправиться на скрытый остров</button>`:'';
}
function eligibleNavigatorForFish(row,fish){if(!row||!fish||fish.source!=='Заброс'||!['normal','heavy','giant'].includes(fish.category)||state.islands?.navigatorCategory)return null;const fishRowIndex=state.history.findIndex(x=>x.id===row.id);return (state.islands?.navigators||[]).find(nav=>!nav.mainlandUsed&&state.history.findIndex(x=>x.id===nav.historyRowId)>=0&&state.history.findIndex(x=>x.id===nav.historyRowId)<fishRowIndex)||null;}
function renderNavigatorAction(row,fish){const nav=eligibleNavigatorForFish(row,fish);if(!nav)return '';const labels={normal:'обычную рыбу',heavy:'тяжеловеса',giant:'гиганта'},icon=islandLootIconMarkup({kind:'navigator',name:'Астральный навигатор'},'is-compact-icon');return `<div class="navigator-lock-action"><span>${icon} Астральный навигатор может запомнить категорию «${labels[fish.category]}» до конца сессии.</span><button type="button" data-navigator-lock="${nav.id}" data-navigator-fish="${fish.id}">Запомнить категорию</button></div>`;}
function activateAstralNavigator(navigatorId,fishId){const nav=(state.islands?.navigators||[]).find(x=>x.id===navigatorId&&!x.mainlandUsed),fish=state.fish.find(x=>x.id===fishId);if(!nav||!fish||!eligibleNavigatorForFish(state.history.find(h=>h.fishId===fish.id),fish))return;nav.mainlandUsed=true;state.islands.navigatorCategory=fish.category;const labels={normal:'обычная рыба',heavy:'тяжеловес',giant:'гигант'};addHistory('Астральный навигатор запомнил категорию','island',`(${labels[fish.category]} • все последующие рыбные результаты обычного заброса сохранят эту категорию до конца сессии)`,{numbered:false});commitState();}
function abyssObjectsForHistoryRow(row){
  const objects=[];
  const tradeItems=(state.tradeItems||[]).filter(item=>item.historyRowId===row.id&&item.id!==row.tradeItemId&&(item.abyssChange||(item.abyssNotes||[]).length));objects.push(...tradeItems.map(item=>({item,icon:tradeItemIconMarkup(item,'is-compact-icon'),name:item.name})));
  const trash=(state.trash||[]).filter(item=>item.historyRowId===row.id&&item.abyssChange);objects.push(...trash.map(item=>({item,icon:trashIconMarkup('is-compact-icon'),name:capitalize(item.name)})));
  const coins=(state.coins||[]).filter(item=>item.historyRowId===row.id&&item.abyssChange);objects.push(...coins.map(item=>({item,icon:coinIconMarkup(item.type,'coin-icon-small'),name:item.name})));
  if(row.bonusId){const item=state.bonuses.find(entry=>entry.id===row.bonusId);if(item?.abyssChange)objects.push({item,icon:bonusIconMarkup(item.name,'is-compact-icon'),name:item.name});}
  const debuff=(state.debuffs||[]).find(item=>item.historyRowId===row.id);if(debuff?.abyssChange)objects.push({item:debuff,icon:debuffIconMarkup(debuff.name,'is-compact-icon'),name:debuff.name});
  return objects;
}
function renderAbyssObjectChanges(row){
  const objects=abyssObjectsForHistoryRow(row);if(!objects.length)return '';
  return objects.map(({item,icon,name})=>{const change=item.abyssChange;
    if(!change)return (item.abyssNotes||[]).map(note=>`<div class="abyss-object-change is-positive"><span>${icon} <strong>${name}</strong></span><b>${note}</b></div>`).join('');
    if(change.kind==='transform')return `<div class="abyss-object-change is-transform result-${abyssChangeTargetType(change)}"><span class="abyss-object-source">${icon} <s>${name}</s></span><span class="abyss-object-arrow">→</span>${renderAbyssChangeResult(change)}<small class="abyss-change-agent">${change.source}</small></div>`;
    const positive=change.kind==='enhanced'||change.kind==='neutralized';
    return `<div class="abyss-object-change ${positive?'is-positive':'is-negative'}"><span>${icon} <strong>${name}</strong></span><b>${change.label}</b></div>`;
  }).join('');
}
function tradeExchangeFishMarkup(exchange){
  const fish=state.fish.find(item=>item.id===exchange.fishId)||{name:exchange.fishName,category:exchange.category,weight:exchange.weight};
  const fishIcon=fishSizeMarker(fish)||`<span class="fish-inline-status status-cast" title="Полученная рыба" aria-label="Полученная рыба">${fishStatusIcon('cast-catch','Полученная рыба')}</span>`;
  return `<span class="trade-history-fish-visuals">${fishCategoryIcons(fish,'is-embedded')}${fishIcon}</span><span class="trade-history-fish-copy">${capitalize(exchange.fishName)} — ${kg(exchange.weight)}</span>`;
}
function tradeExchangeSourceMarkup(exchange){
  const icon=exchange.coinTrade
    ?coinIconMarkup(exchange.coinType||COIN_TYPES.find(type=>type.name===exchange.itemName)?.key||'copper','coin-icon-small')
    :tradeItemIconMarkup(exchange.itemKey,'is-compact-icon');
  return `${icon} ${exchange.itemName}`;
}
function renderTradeShipHistory(row) {
  if (row.type!=='tradeShip') return '';
  const exchanges=(state.tradeExchanges||[]).filter(exchange=>exchange.tradeShipHistoryId===row.id).map(exchange=>`<li><span class="trade-history-source is-exchanged">${tradeExchangeSourceMarkup(exchange)}</span><span class="trade-history-result"><span class="trade-history-arrow">→</span>${tradeExchangeFishMarkup(exchange)}</span></li>`).join('');
  const isCurrent=row.id===state.tradeShipHistoryId&&state.tradeShipArrived&&!state.tradeShipCompleted;
  return `${exchanges?`<ul class="trade-history-results">${exchanges}</ul>`:''}
    ${isCurrent?'<button type="button" class="trade-open-btn" data-open-trade>Торговля</button>':'<span class="trade-closed-status">Торговля завершена</span>'}`;
}
function renderAbyssDecision(row){
  if(!row.abyssDecision)return '';
  return `<div class="abyss-decision"><button type="button" class="abyss-remove-btn" data-abyss-decision="remove">Удалить</button><button type="button" class="abyss-keep-btn" data-abyss-decision="keep">Оставить</button></div>`;
}
function eligibleFinalCastTradeCoin(){
  if(!state.tradeShipArrived||state.tradeShipCompleted)return null;
  return (state.coins||[]).find(coin=>coin.lastCastTradeEligible&&!coin.used&&!coin.expired&&!coin.exchangedForTrade)||null;
}
function createTradeFish(item) {
  const categories=item.key==='firstWaterFlask'?['giant']:item.key==='moonTideShell'?Array.from({length:Math.floor(rand(1,6))},()=>{const r=Math.random();return r<.6?'normal':r<.9?'heavy':'giant';}):[chance(BALANCE.tradeShip.giantChance)?'giant':'heavy'];let first=null;
  categories.forEach(category=>{const original=category==='giant'?rand1(20,40):category==='heavy'?rand1(10,19.9):rand1(.1,9.9),fish={id:uid(),name:pick(category==='giant'?DATA.giants:DATA.fish),category,originalWeight:original,weight:original,source:'Торговое судно',direct:false,tradeFish:true,removed:false,tags:['обмен с торговым судном','защищена от <span class="island-negative-hint">«Нестабильного присутствия»</span>'],debuffLimited:false,islandDistorted:false,islandOriginalWeight:null,islandDistortedWeight:null};applyBallistierWrathToFish(fish);state.fish.push(fish);const exchange={id:uid(),itemId:item.id,itemKey:item.key,itemName:item.name,itemIcon:item.icon,fishId:fish.id,fishName:fish.name,category,weight:fish.weight,tradeShipHistoryId:state.tradeShipHistoryId};state.tradeExchanges.push(exchange);if(!first)first=exchange;});
  item.exchanged=true;item.exchangeReason='trade';if(item.key==='moonTideShell'&&state.islands.moonShellActiveId===item.id)state.islands.moonShellActiveId=null;if(item.key==='fadedRelicFragment')state.islands.fadedRelicFragments=Math.max(0,(state.islands.fadedRelicFragments||0)-1);return first;
}
function exchangeFinalCastCoin(coinId,showEffect=true){
  const coin=eligibleFinalCastTradeCoin();
  if(!coin||coin.id!==coinId)return;
  const unstableActive=Boolean(state.islands?.unstablePresence),unstableApplied=unstableActive&&chance(.5);
  for(let index=0;index<2;index++){
    const naturalWeight=rand1(.1,9.9),baseWeight=unstableApplied?rollIslandDistortedWeight(naturalWeight):naturalWeight;const fish={id:uid(),name:pick(DATA.fish),category:'normal',originalWeight:baseWeight,weight:baseWeight,source:'Торговое судно: монета последнего заброса',direct:false,tradeFish:true,removed:baseWeight===0,tags:['выгодный обмен монеты',...(unstableApplied?['<span class="island-negative-hint">Связь с последним забросом сохранилась: применено «Нестабильное присутствие»</span>']:unstableActive?['Торговый обмен разорвал связь с последним забросом — вес сохранён']:[])],debuffLimited:false,islandDistorted:unstableApplied,islandOriginalWeight:unstableApplied?naturalWeight:null,islandDistortedWeight:unstableApplied?baseWeight:null};if(baseWeight===0){fish.skeletonOf=fish.name;fish.name=`рыбный скелет (${fish.name})`;fish.islandSkeleton=true;fish.mythicSkeleton=true;}else applyBallistierWrathToFish(fish);state.fish.push(fish);
    state.tradeExchanges.push({id:uid(),itemId:coin.id,itemKey:'finalCastCoin',itemName:coin.name,coinType:coin.type,fishId:fish.id,fishName:fish.name,category:'normal',weight:fish.weight,coinTrade:true,tradeShipHistoryId:state.tradeShipHistoryId});
  }
  coin.used=true;coin.exchangedForTrade=true;coin.exchangeReason='trade';
  const row=state.history.find(item=>item.id===coin.historyRowId);
  if(row)row.detail=unstableApplied?'(Монета обменяна на две обычные рыбы • <span class="island-negative-hint">Связь с последним забросом сохранилась — «Нестабильное присутствие» исказило обеих рыб • проверка 50%</span>)':unstableActive?'(Монета обменяна на две обычные рыбы • Торговый обмен разорвал связь с последним забросом — обе рыбы сохранили вес • проверка 50%)':'(Монета обменяна на две обычные рыбы)';
  TelegramApp?.HapticFeedback?.notificationOccurred?.('success');
  if(showEffect)showVisualEffect('bonus','🐟','ВЫГОДНЫЙ ОБМЕН','Монета обменяна на две обычные рыбы',1050,true);
  renderTradeDialog();commitState();
}
function exchangeTradeItem(key) {
  const islandAccepted=ISLAND_TRADE_ITEMS.some(x=>x.key===key);
  if (state.tradeShipCompleted || (!(state.tradeShipOffers||[]).includes(key)&&!islandAccepted)) return;
  const item=availableTradeItemsForKey(key)[0];
  if (!item) return;
  const exchange=createTradeFish(item);
  TelegramApp?.HapticFeedback?.notificationOccurred?.('success');
  showVisualEffect(exchange.category==='giant'?'giant':'bonus',exchange.category==='giant'?'🏆':'🐟',exchange.category==='giant'?'РЫБА-ГИГАНТ':'ТЯЖЕЛОВЕС',`${capitalize(exchange.fishName)} — ${kg(exchange.weight)}`,1000,true,false);
  renderTradeDialog(); commitState();
}
function exchangeAllTradeItems() {
  if (state.tradeShipCompleted) return;
  const offerSet=new Set(state.tradeShipOffers||[]);
  const items=(state.tradeItems||[]).filter(item=>!item.exchanged&&(offerSet.has(item.key)||item.islandTrade));
  const finalCoin=eligibleFinalCastTradeCoin();
  if (!items.length&&!finalCoin) { toast('Нет подходящих предметов для обмена'); return; }
  items.forEach(createTradeFish);
  if(finalCoin){exchangeFinalCastCoin(finalCoin.id);return;}
  TelegramApp?.HapticFeedback?.notificationOccurred?.('success');
  renderTradeDialog(); commitState();
}
function exchangeSiphonophoreThread(id){
  if(state.tradeShipCompleted)return;const artifact=state.artifacts.find(a=>a.id===id&&a.name==='Нить Сифонофоры'&&!a.traded);if(!artifact)return;
  artifact.traded=true;artifact.used=true;const count=Math.floor(rand(5,11));
  for(let i=0;i<count;i++)createTradeFish({id:`${artifact.id}-${i}`,key:'mythicThread',name:'Нить Сифонофоры',icon:entityIcon(artifact.name,'⌁'),exchanged:false});
  addHistory('Нить Сифонофоры отдана капитану','tradeShip',`(Получено рыб: ${count})`,{numbered:false});renderTradeDialog();commitState();
}
function rollRecyclonCategory(){const r=Math.random();return r<.5?'normal':r<.85?'heavy':'giant';}
function createRecyclonFish(category,itemName,itemIcon=shipIconMarkup('recyclon','is-compact-icon')){
  const weight=category==='giant'?rand1(20,40):category==='heavy'?rand1(10,19.9):rand1(.1,9.9),name=pick(category==='giant'?DATA.giants:DATA.fish),fish={id:uid(),name,category,originalWeight:weight,weight,source:'Перерабатывающее судно «Рециклон»',direct:false,tradeFish:true,removed:false,tags:['получена от «Рециклона»','защищена от <span class="island-negative-hint">«Нестабильного присутствия»</span>'],debuffLimited:false,islandDistorted:false,islandOriginalWeight:null,islandDistortedWeight:null};applyBallistierWrathToFish(fish);state.fish.push(fish);state.tradeExchanges.push({id:uid(),itemId:uid(),itemKey:'recyclon',itemName,itemIcon,fishId:fish.id,fishName:fish.name,category,weight:fish.weight,tradeShipHistoryId:state.tradeShipHistoryId});return fish;
}
function recycleAllTrash(){if(state.tradeShipSource!=='recyclon'||state.tradeShipCompleted)return;const trash=state.trash.filter(x=>x.recyclonEligible&&!x.converted&&!x.recycled);trash.forEach(item=>{item.recycled=true;item.converted=true;const row=state.history.find(h=>h.id===item.historyRowId);if(row)row.detail=`${row.detail||''} (Передан «Рециклону»)`.trim();createRecyclonFish(rollRecyclonCategory(),capitalize(item.name),trashIconMarkup('is-compact-icon'));});if(trash.length)addHistory('«Рециклон» переработал хлам','tradeShip',`(${trash.length} шт. → ${trash.length} рыб)`,{numbered:false});renderTradeDialog();commitState();}
function renderRecyclonDialog(){
  $('tradeDialogTitle').innerHTML=`${shipIconMarkup('recyclon','is-dialog-icon')}<span>Перерабатывающее судно «Рециклон»</span>`;
  const tradeItemCount=availableTradeItems().length;
  $('tradeDialogIntro').textContent=`«Рециклон» принимает только хлам обычных забросов. Предметы обмена (${tradeItemCount}) останутся в инвентаре; обычное торговое судно после этого не гарантировано.`;
  const trash=state.trash.filter(x=>x.recyclonEligible&&!x.converted&&!x.recycled),trashOffer=`<article class="trade-offer"><div class="trade-offer-icon">${shipIconMarkup('recyclon','is-offer-icon')}</div><div class="trade-offer-copy"><strong>Хлам обычных забросов</strong><span>Доступно: ${trash.length} • каждая единица станет одной рыбой: 50% обычная / 35% тяжеловес / 15% гигант</span></div></article>`,exchanges=(state.tradeExchanges||[]).filter(x=>x.tradeShipHistoryId===state.tradeShipHistoryId).map(x=>`<li><span>${x.itemIcon} ${x.itemName}</span><strong class="trade-history-result"><span class="trade-history-arrow">→</span>${tradeExchangeFishMarkup(x)}</strong></li>`).join('');$('tradeOffers').innerHTML=trashOffer;$('tradeResults').innerHTML=exchanges?`<h3>Результаты переработки</h3><ul>${exchanges}</ul>`:'';$('tradeAllBtn').textContent=`Переработать весь хлам (${trash.length})`;$('tradeAllBtn').disabled=!trash.length||state.tradeShipCompleted;$('tradeFinishBtn').textContent='Отпустить «Рециклон»';$('tradeFinishBtn').disabled=state.tradeShipCompleted;
}
function renderTradeDialog() {
  const dialog=$('tradeDialog'); if (!dialog) return;
  if(state.tradeShipSource==='recyclon'){renderRecyclonDialog();return;}
  $('tradeDialogTitle').innerHTML=`${shipIconMarkup('trade','is-dialog-icon')}<span>Торговое судно</span>`;$('tradeDialogIntro').textContent='Команда судна готова обменять редкие находки на крупную рыбу.';$('tradeAllBtn').textContent='Обменять всё';$('tradeFinishBtn').textContent='Завершить торговлю';
  const counts=tradeItemCounts();
  const keys=[...(state.tradeShipOffers||[]),...ISLAND_TRADE_ITEMS.map(x=>x.key).filter(key=>(counts[key]||0)>0)];
  const offers=keys.map(key=>{
    const item=tradeItemByKey(key); const count=counts[key]||0;
    return `<article class="trade-offer${count?'':' is-empty'}"><div class="trade-offer-icon">${tradeItemIconMarkup(item)}</div><div class="trade-offer-copy"><strong>${item.name}</strong><span>В наличии: ${count}</span></div><button type="button" data-trade-key="${key}" ${!count||state.tradeShipCompleted?'disabled':''}>Обменять 1</button></article>`;
  }).join('');
  const finalCoin=eligibleFinalCastTradeCoin();
  const coinOffer=finalCoin?`<article class="trade-offer trade-coin-offer"><div class="trade-offer-icon">${coinIconMarkup(finalCoin.type)}</div><div class="trade-offer-copy"><strong>${finalCoin.name}</strong><span>Особый интерес капитана: 2 обычные рыбы</span></div><button type="button" data-trade-coin="${finalCoin.id}">Обменять</button></article>`:'';
  const threadOffers=activeMythics('Нить Сифонофоры').map(a=>`<article class="trade-offer trade-mythic-offer"><div class="trade-offer-icon">${entityIcon(a.name,'⌁')}</div><div class="trade-offer-copy"><strong>${a.name}</strong><span>Капитан предложит 5–10 тяжеловесов и гигантов</span></div><button type="button" data-trade-thread="${a.id}">Отдать артефакт</button></article>`).join('');
  const colossusOffers=state.tradeShipSource==='flare'?state.fish.filter(f=>f.islandColossus&&!f.removed&&!f.islandTraded).map(f=>`<article class="trade-offer trade-colossus-offer"><div class="trade-offer-icon">🐋</div><div class="trade-offer-copy"><strong>${capitalize(f.name)} — ${kg(f.weight)}</strong><span>Особый обмен вызванного судна: 90% тяжеловес, 10% гигант</span></div><button type="button" data-trade-colossus="${f.id}">Обменять исполина</button></article>`).join(''):'';
  const exchanges=(state.tradeExchanges||[]).filter(exchange=>exchange.tradeShipHistoryId===state.tradeShipHistoryId).map(exchange=>`<li><span class="trade-history-source is-exchanged">${tradeExchangeSourceMarkup(exchange)}</span><strong class="trade-history-result"><span class="trade-history-arrow">→</span>${tradeExchangeFishMarkup(exchange)}</strong></li>`).join('');
  $('tradeOffers').innerHTML=offers+coinOffer+threadOffers+(colossusOffers?`<section class="trade-colossus-section"><h3>🐋 Нестабильная добыча</h3><p>Только судно, вызванное Рунической ракетой, принимает исполинов.</p>${colossusOffers}</section>`:'')||'<p class="muted">Предложения ещё не сформированы.</p>';
  $('tradeResults').innerHTML=exchanges?`<h3>Результаты обмена</h3><ul>${exchanges}</ul>`:'';
  const canExchange=(state.tradeItems||[]).some(item=>!item.exchanged&&((state.tradeShipOffers||[]).includes(item.key)||item.islandTrade))||Boolean(finalCoin)||Boolean(threadOffers)||Boolean(colossusOffers);
  $('tradeAllBtn').disabled=!canExchange||state.tradeShipCompleted;
  $('tradeFinishBtn').disabled=state.tradeShipCompleted;
}
function exchangeIslandColossus(id){
  if(state.tradeShipSource!=='flare'||state.tradeShipCompleted)return;const fish=state.fish.find(f=>f.id===id&&f.islandColossus&&!f.removed&&!f.islandTraded);if(!fish)return;
  showChoice('Обменять исполина?','Уже вытесненный и искажённый улов не восстановится. Если это последний исполин, «Нестабильное присутствие» прекратится.',[{label:'Оставить исполина',value:'keep'},{label:'Обменять исполина',value:'trade'}],value=>{
    if(value!=='trade'){openTradeDialog();return;}fish.removed=true;fish.islandTraded=true;fish.tradeVessel='trade';setFishHistoryIslandTraded(fish);
    const remaining=state.fish.filter(f=>f.islandColossus&&!f.removed&&!f.islandTraded);refreshUnstablePresence();
    const exchange=createTradeFish({id:fish.id,key:'islandColossus',name:fish.name,icon:'🐋',exchanged:false});
    addHistory(`${fish.name} передан вызванному торговому судну`,'tradeShip',`(${kg(fish.weight)} → ${exchange.category==='giant'?'рыба-гигант':'тяжеловес'} ${capitalize(exchange.fishName)} — ${kg(exchange.weight)}${remaining.length?' • Нестабильное присутствие сохраняется':' • Нестабильное присутствие прекращено'})`,{numbered:false,tradeShipSource:'flare'});renderTradeDialog();commitState();
  });
  $('choiceText').classList.add('colossus-trade-warning');
}
function openTradeDialog() {
  if (!state.tradeShipArrived) return;
  renderTradeDialog();
  if (!$('tradeDialog').open) $('tradeDialog').showModal();
}
function hasTradeShipChoices() {
  if(!state.tradeShipArrived||state.tradeShipCompleted)return false;
  if(state.tradeShipSource==='recyclon')return state.trash.some(item=>item.recyclonEligible&&!item.converted&&!item.recycled);
  const offerSet=new Set(state.tradeShipOffers||[]);
  const hasItems=(state.tradeItems||[]).some(item=>!item.exchanged&&(offerSet.has(item.key)||item.islandTrade));
  const hasThread=activeMythics('Нить Сифонофоры').length>0;
  const hasColossus=state.tradeShipSource==='flare'&&state.fish.some(fish=>fish.islandColossus&&!fish.removed&&!fish.islandTraded);
  return hasItems||Boolean(eligibleFinalCastTradeCoin())||hasThread||hasColossus;
}
function completeTradeShip() {
  if (state.tradeShipCompleted) return;
  state.tradeShipCompleted=true;
  $('tradeDialog')?.close();
  const visitCount=(state.tradeExchanges||[]).filter(exchange=>exchange.tradeShipHistoryId===state.tradeShipHistoryId).length;addHistory('Торговля с судном завершена','event',`(Получено рыб за этот визит: ${visitCount})`);
  const summonedByFlare=['flare','recyclon'].includes(state.tradeShipSource);
  if(state.castsLeft>0||summonedByFlare){state.tradeShipArrived=false;state.tradeShipSource=null;render();saveDailyState();toast(state.castsLeft>0?'Торговое судно ушло. Рыбалка продолжается.':'Вызванное судно ушло. Проверяем обычное прибытие.');if(state.castsLeft<=0)maybeFinalizeSession();return;}
  finishGame();
}
function beginTradeShip(source='natural') {
  state.tradeShipCompleted=false;
  state.tradeShipArrived=true;
  state.tradeShipSource=source;
  if(['flare','recyclon'].includes(source))setTimeout(()=>playSound('tradeShipArrival'),700);
  else playSound('tradeShipArrival');
  state.tradeShipOffers=sampleUnique(TRADE_ITEMS,BALANCE.tradeShip.offerCount).map(item=>item.key);
  const finalCoin=eligibleFinalCastTradeCoin();
  if(finalCoin){const coinRow=state.history.find(item=>item.id===finalCoin.historyRowId);if(coinRow)coinRow.detail='(Капитан судна заинтересовался монетой и готов предложить выгодный обмен: две обычные рыбы)';}
  const recyclon=source==='recyclon',row=addHistory(recyclon?'Перерабатывающее судно «Рециклон» прибыло по сигналу ракеты':source==='flare'?'Торговое судно прибыло по сигналу ракеты':'Торговое судно прибыло','tradeShip','',{numbered:false,tradeShipSource:source});
  state.tradeShipHistoryId=row.id;
  TelegramApp?.HapticFeedback?.notificationOccurred?.('success');
  render();
  if(hasTradeShipChoices())toast(`${recyclon?'«Рециклон»':'Торговое судно'} прибыло — выберите обмен в хронологии`);
  else completeTradeShip();
}
function maybeFinalizeSession() {
  if (state.finished || state.castsLeft>0 || $('choiceDialog')?.open || state.rifts?.active || state.islands?.active || state.dungeon?.encounter || hasPendingAbyssalDecision()) return;
  if(promptUnusedMessage())return;
  if(promptPendingExpeditions())return;
  if(promptFinalFlare())return;
  if(hasRetainedAbyssal()&&!abyssalEntity().manifested)performAbyssalManifestation(true);
  if (state.tradeShipArrived && !state.tradeShipCompleted) { render(); return; }
  if (!state.tradeShipChecked) {
    state.tradeShipChecked=true;
    if (state.weather!==BALANCE.tradeShip.forbiddenWeather && chance(BALANCE.tradeShip.arrivalChance)) { beginTradeShip(); return; }
  }
  finishGame();
}

function finishGame() {
  state.finished=true;
  (state.mythic.threadPendingBoosts||[]).forEach(boost=>appendHistoryDetailById(boost.rowId,`усиление +${boost.plus} кг не успело примениться`));state.mythic.threadPendingBoosts=[];
  finalizePendingSeagulls();
  expireUnusedCoins();
  resolveEssencesAtFinish();
  const finalFish=finalFishSnapshot();
  let total=round1(finalFish.reduce((s,f)=>s+f.weight,0));
  const burningCores=(state.dungeon?.rewards||[]).filter(item=>item.key==='flame'&&!item.used).length;if(burningCores)total=round1(total*Math.pow(1.05,burningCores));
  const earned=achievements(finalFish,total);
  const ended=new Date();
  state.finalResult={total,earned,finishedAt:ended.toISOString()};
  renderResultCard();
  if (earned.length) playSound('achievement');
  addHistory('Игровая сессия завершена','event');
  TelegramApp?.HapticFeedback?.notificationOccurred?.('success');
  const payload={game:'dropfish',totalWeight:total,achievements:earned,finishedAt:ended.toISOString(),casts:state.castClicks};
  try { if (TelegramApp?.initData && typeof TelegramApp.sendData==='function') TelegramApp.sendData(JSON.stringify(payload)); } catch(e){ console.warn('sendData недоступен для этого способа запуска',e); }
  void window.PublicSession?.finish?.(payload);
  saveDailyState();
}

function renderResultCard() {
  if (!state.finalResult) {
    $('resultCard').classList.add('hidden');
    $('resultCard').innerHTML='';
    return;
  }
  const {total, earned, finishedAt}=state.finalResult;
  const ended=new Date(finishedAt);
  const achievementsExpanded=$('resultCard').dataset.expanded==='true';
  $('resultCard').innerHTML=`
    <div class="result-bubbles" aria-hidden="true">${Array.from({length:10},(_,i)=>`<span style="--i:${i}"></span>`).join('')}</div>
    <h3>Итоговый вес: <span class="result-total-number" data-total="${total}">${kg(total)}</span></h3>
    <div class="result-date">Завершено: ${ended.toLocaleString('ru-RU')}</div>
    ${earned.length
      ? `<button type="button" class="result-achievements-toggle" aria-expanded="${achievementsExpanded}" aria-controls="resultAchievements">🏆 Достижения: ${earned.length}<span aria-hidden="true">${achievementsExpanded?'−':'+'}</span></button>
         <ul id="resultAchievements" class="result-achievements" ${achievementsExpanded?'':'hidden'}>${earned.map((x,i)=>`<li style="--i:${i}">${x}</li>`).join('')}</ul>`
      : '<p class="result-none">🏆 В этой сессии достижений нет</p>'}`;
  $('resultCard').classList.remove('hidden');
  if (!reduceMotion && !$('resultCard').dataset.animated) {
    $('resultCard').dataset.animated='1'; $('resultCard').classList.add('is-revealing');
    const number=$('resultCard').querySelector('.result-total-number');
    const target=Number(number?.dataset.total||0); const start=performance.now(); const duration=900;
    const tick=(now)=>{ const progress=Math.min(1,(now-start)/duration); const eased=1-Math.pow(1-progress,3); if(number)number.textContent=kg(target*eased); if(progress<1)requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    setTimeout(()=>$('resultCard').classList.remove('is-revealing'),1800);
  }
}

function scrollResultCardAfterToggle(expanded){
  const scroller=$('historyScroll'),card=$('resultCard');
  if(!scroller||!card)return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const behavior=reduceMotion?'auto':'smooth';
    if(!expanded){
      scroller.scrollTo({top:Math.max(0,scroller.scrollHeight-scroller.clientHeight),behavior});
      return;
    }
    const achievements=[...card.querySelectorAll('.result-achievements li')];
    const target=achievements[Math.min(2,achievements.length-1)];
    if(!target)return;
    const viewport=scroller.getBoundingClientRect(),targetRect=target.getBoundingClientRect();
    const hiddenBelow=targetRect.bottom-(viewport.bottom-8);
    if(hiddenBelow>0)scroller.scrollTo({top:scroller.scrollTop+hiddenBelow,behavior});
  }));
}

function render() {
  ensureIslands();
  document.body.classList.toggle('test-build', BUILD_CONFIG.unlimitedSessions);
  document.body.classList.toggle('game-finished', Boolean(state.finished));
  const weather=DATA.weather[state.weather];
  document.body.dataset.weather=state.weather;
  $('weatherLabel').textContent=weather.name; $('weatherTitle').textContent=weather.name; $('weatherDescription').textContent=weather.text; $('weatherScene').innerHTML=weatherIconMarkup(state.weather,'is-main-icon');
  $('castsLabel').textContent=state.castsLeft; $('weightLabel').textContent=kg(state.fish.filter(f=>!f.removed).reduce((s,f)=>s+f.weight,0));
  const castRodIcon=state.islands?.sharpFinRod
    ?islandLootIconMarkup({kind:'rod',name:'Удочка племени Острого Плавника'},'is-cast-icon')
    :uiIconMarkup('fishingRod','is-cast-icon');
  $('castBtn').disabled=state.finished||state.castsLeft<=0; $('castBtn').innerHTML=state.finished?'<span>Сессия завершена</span>':`${castRodIcon}<span>Забросить удочку</span>`;
  $('castBtn').classList.toggle('has-sharp-fin-rod',Boolean(state.islands.sharpFinRod)&&!state.finished);
  $('restartBtn').disabled=!BUILD_CONFIG.unlimitedSessions && Boolean(state.sessionDate);
  $('restartBtn').title=(!BUILD_CONFIG.unlimitedSessions && state.sessionDate)?'В сутки доступна только одна игровая сессия':'';
  const effects=[];
  const pushGroupedEffect=(effect,key)=>{
    const groupKey=`${effect.kind}:${key}`;
    const existing=effects.find(item=>item.groupKey===groupKey);
    if(existing){existing.count=(existing.count||1)+1;return existing;}
    const grouped={...effect,groupKey,count:1};effects.push(grouped);return grouped;
  };
  activeBonuses('').forEach(()=>{});
  state.bonuses.forEach(b=>{const disabled=state.disabledBonusIds.has(b.id),enhanced=Boolean(b.abyssEnhanced);pushGroupedEffect({label:`${bonusIconMarkup(b.name,'is-effect-icon')}<span class="effect-chip-copy">${b.name}${enhanced?' (усилен Симбиотом)':''}${disabled?' (отключён)':''}</span>`,kind:'bonus',exhausted:disabled},`${b.name}:${enhanced?'enhanced':'base'}:${disabled?'disabled':'active'}`);});
  state.artifacts.filter(a=>!a.traded).forEach(a=>{const exhausted=a.eyeStatus==='exhausted'||(a.name==='Искра Хаоса'&&a.used),usable=a.name==='Око Шторма'&&!a.used,visualName=artifactVisualName(a);pushGroupedEffect({label:`${artifactIconMarkup(visualName,a.tier,'is-effect-icon')}<span class="effect-chip-copy">${visualName}${exhausted?' (исчерпано)':''}</span>`,kind:a.tier,artifactId:a.id,usable,exhausted},`${visualName}:${usable?'usable':exhausted?'exhausted':'active'}`);});
  state.debuffs.forEach(d=>pushGroupedEffect({label:`${debuffIconMarkup(d.name,'is-effect-icon')}<span class="effect-chip-copy">${d.name}</span>`,kind:'debuff',exhausted:!d.active},`${d.name}:${d.active?'active':'exhausted'}`));
  const tradeCounts=tradeItemCounts();
  const activeTradeEffectKeys=new Set(['moonTideShell','firstWaterFlask','fadedRelicFragment','enchantedIdol','ceremonialMask']);
  const islandTradeOnlyKeys=new Set(['enchantedIdol','ceremonialMask']);
  ISLAND_TRADE_ITEMS.filter(item=>activeTradeEffectKeys.has(item.key)).forEach(item=>{const icon=tradeItemIconMarkup(item,'is-effect-icon');if(tradeCounts[item.key])effects.push({label:`${icon}<span class="effect-chip-copy">${item.name} ×${tradeCounts[item.key]}${islandTradeOnlyKeys.has(item.key)?' • предмет обмена':item.key==='moonTideShell'&&state.islands.moonShellActiveId?' • активно':''}</span>`,kind:'trade',usableTradeKey:['moonTideShell','firstWaterFlask'].includes(item.key)&&!(item.key==='moonTideShell'&&state.islands.moonShellActiveId)});});
  ensureRifts();
  state.rifts.temporaryEffects.filter(e=>e.casts>0).forEach(e=>{
    const effectName=String(e.name||'');
    const compactName=effectName.startsWith('Калибровка DF1')?`Калибровка DF1 ×${e.casts}`:`${effectName} (${e.casts})`;
    effects.push({label:`${riftTemporaryEffectIconMarkup(e,'is-effect-icon')}<span class="effect-chip-copy">${compactName}</span>`,kind:'rift'});
  });
  state.rifts.relics.filter(r=>!r.used).forEach(r=>pushGroupedEffect({label:`<span class="rift-relic-effect-main">${riftRelicIcon(r.name,'is-effect-icon')}<span class="effect-chip-copy">${r.name}</span></span>`,kind:'rift',relicId:r.id,automatic:r.name==='Фантомный осколок',relicHint:r.name==='Око скрытой бездны'?'':r.name==='Обсидиановый ключ'&&state.rifts.obsidianArmed?'ожидает автоматической смены':RIFT_RELIC_ACTIVE_HINTS[r.name]||'использовать'},r.name));
  ensureDungeon();state.dungeon.rewards.filter(item=>!item.used).forEach(item=>{const def=DUNGEON_REWARDS[item.key];pushGroupedEffect({label:`${dungeonImg(def.file,def.name,'is-effect-icon')}<span class="effect-chip-copy">${def.name}</span>`,kind:'dungeon',dungeonRewardId:item.id,usableDungeon:item.key==='abyss'},item.key);});
  {const encounter=activeDungeonPrompt();if(encounter){const casts=Math.max(0,BALANCE.dungeon.trailCasts-(encounter.castsUsed||0)),label=encounter.phase==='piranhas'?'Пираньи вечной тьмы':'Алый след',hint=encounter.phase==='piranhas'?`ожидают жертву • ${casts} забр.`:`вход доступен • ${casts} забр.`;effects.push({label:`${dungeonImg('piranhas-eternal-darkness.webp','Пираньи вечной тьмы','is-effect-icon')}<span class="effect-chip-copy">${label} • ${hint}</span>`,kind:'dungeon'});}}
  if(hasRetainedAbyssal()){const entity=abyssalEntity(),def=ABYSSAL_PERSONALITIES[entity.personality];effects.push({label:entity.manifested?`${abyssalIconMarkup(entity.personality,'is-effect-icon')}<span class="effect-chip-copy">${def.name}</span>`:`${abyssalIconMarkup(null,'is-effect-icon')}<span class="effect-chip-copy">Неизвестная абиссальная форма жизни</span>`,kind:'abyssal'});}
  if(state.rifts.active)effects.push({label:`${fishCategoryIcon('rift','Разлом','is-effect-icon')}<span class="effect-chip-copy">Исследуется: ${RIFT_TYPES[state.rifts.active.type].short}</span>`,kind:'rift'});
  state.islands.items.filter(x=>x.status==='active').forEach(x=>effects.push({label:`${expeditionItemIconMarkup(x.name,'is-effect-icon')}<span class="effect-chip-copy">${x.name}</span>`,kind:'island'}));
  availableExpeditions().forEach((x,i)=>effects.push({label:`🏝️ Координаты острова ${i+1}`,kind:'island'}));
  if(state.islands.unstablePresence)effects.push({
    label:fishEffectBadge('unstable-presence','Нестабильное присутствие','is-active-effect-badge'),
    kind:'island',
    negative:true
  });
  {const granite=state.fish.filter(f=>f.islandGraniteCatfish&&!f.removed);if(granite.length)effects.push({label:`${islandFishIconMarkup(granite[0],'is-effect-icon')}<span class="effect-chip-copy">Гранитный сом: 25% сохранить заброс • сохранено ${granite.reduce((sum,f)=>sum+(f.graniteSavedCasts||0),0)}</span>`,kind:'island'});}
  {const rays=state.fish.filter(f=>f.islandEchoRay&&!f.removed);if(rays.length)effects.push({label:`${islandFishIconMarkup(rays[0],'is-effect-icon')}<span class="effect-chip-copy">Эхоносный скат: эхо-улов 20% • создано ${rays.reduce((sum,f)=>sum+(f.echoCatches||0),0)}</span>`,kind:'island'});}
  if(state.islands.sharpFinRod)effects.push({label:`${islandLootIconMarkup({kind:'rod',name:'Удочка племени Острого Плавника'},'is-effect-icon')}<span class="effect-chip-copy">Удочка племени Острого Плавника</span>`,kind:'island'});
  (state.islands.navigators||[]).filter(x=>!x.mainlandUsed).forEach(()=>effects.push({label:`${islandLootIconMarkup({kind:'navigator',name:'Астральный навигатор'},'is-effect-icon')}<span class="effect-chip-copy">Астральный навигатор</span>`,kind:'island'}));
  if(state.islands.navigatorCategory){const labels={normal:'обычная рыба',heavy:'тяжеловес',giant:'гигант'};effects.push({label:`🔭 Курс навигатора: ${labels[state.islands.navigatorCategory]}`,kind:'island'});}
  if((state.angusTrailCasts||0)>0)effects.push({label:`🧭 След старого рыбака: ${state.angusTrailCasts} забр. • Ангус 5%`,kind:'epic'});
  if(state.islands.flares>0)effects.push({label:`${islandLootIconMarkup({kind:'flare',name:'Руническая сигнальная ракета'},'is-effect-icon')}<span class="effect-chip-copy">Руническая сигнальная ракета ×${state.islands.flares}</span>`,kind:'island',flare:true});
  const effectLabel=e=>{const count=(e.count||1)>1?` ×${e.count}`:'';return count&&/effect-chip-copy/.test(e.label)?e.label.replace(/<\/span>\s*$/,`${count}</span>`):`${e.label}${count}`;};
  $('effectsList').innerHTML=effects.length?effects.map(e=>e.flare?`<button type="button" class="chip effect-island island-flare-btn" data-island-flare>${effectLabel(e)}<small>запустить</small></button>`:e.usableDungeon?`<button type="button" class="chip effect-dungeon dungeon-reward-use-btn" data-dungeon-reward="${e.dungeonRewardId}">${effectLabel(e)}<small>использовать</small></button>`:e.usableTradeKey?`<button type="button" class="chip effect-trade island-item-use-btn" data-island-item-use="${e.usableTradeKey}">${effectLabel(e)}<small>использовать</small></button>`:e.relicId?`<button type="button" class="chip effect-${e.kind} rift-relic-btn" data-rift-relic="${e.relicId}">${e.relicHint?effectLabel(e).replace(/<\/span>\s*<\/span>$/,`<small>${e.relicHint}</small></span></span>`):effectLabel(e)}</button>`:e.usable?`<button type="button" class="chip effect-${e.kind} mythic-use-btn" data-mythic-use="${e.artifactId}">${effectLabel(e)}<small>использовать</small></button>`:`<span class="chip effect-${e.kind}${e.negative?' island-negative-effect':''}${e.exhausted?' is-exhausted':''}">${effectLabel(e)}</span>`).join(''):'<span class="muted">Пока нет</span>';
  $('effectCount').textContent=effects.filter(effect=>!effect.exhausted).length;
  const inventory=document.querySelector('.inventory');
  const kinds=new Set(effects.map(e=>e.kind));
  inventory.classList.toggle('has-effects',effects.length>0);
  inventory.classList.toggle('glow-bonus',kinds.has('bonus'));
  inventory.classList.toggle('glow-debuff',kinds.has('debuff'));
  inventory.classList.toggle('glow-epic',kinds.has('epic'));
  inventory.classList.toggle('glow-legendary',kinds.has('legendary'));
  inventory.classList.toggle('glow-mythic',kinds.has('mythic'));
  renderHistory();
  renderResultCard();
  saveDailyState();
}

function historyAmbientMarkup(h) {
  if(h.type!=='fish')return '';
  const fish=h.fishId?state.fish.find(item=>item.id===h.fishId):null;
  const inactive=Boolean(
    h.eaten||h.stolen||h.islandDisplaced||h.islandTraded||h.riftSacrificeLabel||h.abyssLost||h.threadRemoved||
    fish?.removed||fish?.islandDisplaced||fish?.islandTraded||fish?.riftSacrificeLabel||fish?.abyssLost
  );
  if(!inactive)return '<span class="history-ambient catch-fish-shadow" data-duration="1900" aria-hidden="true"></span>';
  return '';
}

let historyBottomObserver=null;
let historyBottomSyncTimer=null;
function syncNewHistoryRowToBottom(scroller){
  if(!scroller)return;
  historyBottomObserver?.disconnect();
  clearTimeout(historyBottomSyncTimer);
  const align=()=>{scroller.scrollTop=Math.max(0,scroller.scrollHeight-scroller.clientHeight);};
  requestAnimationFrame(()=>requestAnimationFrame(align));
  [80,220,450,750].forEach(delay=>setTimeout(align,delay));
  if(typeof ResizeObserver==='function'){
    historyBottomObserver=new ResizeObserver(align);
    historyBottomObserver.observe(scroller);
    const list=$('historyList');if(list)historyBottomObserver.observe(list);
    historyBottomSyncTimer=setTimeout(()=>{historyBottomObserver?.disconnect();historyBottomObserver=null;},900);
  }
}

function initRiftFuzzyTitles() {
  document.querySelectorAll('.rift-fuzzy-title').forEach(async wrapper=>{
    const source=wrapper.querySelector('.rift-fuzzy-source'),canvas=wrapper.querySelector('.rift-fuzzy-canvas');
    if(!source||!canvas||canvas.dataset.fuzzyReady==='1')return;
    wrapper.classList.remove('is-ready');
    if(reduceMotion)return;
    canvas.dataset.fuzzyReady='1';
    try{await document.fonts?.ready;}catch(_){}
    if(!wrapper.isConnected||reduceMotion){canvas.dataset.fuzzyReady='';return;}
    const style=getComputedStyle(source),fontSize=parseFloat(style.fontSize)||14;
    const font=`${style.fontWeight||800} ${fontSize}px ${style.fontFamily||'sans-serif'}`;
    const measure=document.createElement('canvas').getContext('2d');
    if(!measure){canvas.dataset.fuzzyReady='';return;}
    measure.font=font;
    const text=source.textContent||'',textWidth=Math.ceil(measure.measureText(text).width);
    const lineHeight=Math.ceil(parseFloat(style.lineHeight)||fontSize*1.25);
    const available=Math.max(0,wrapper.parentElement?.getBoundingClientRect().width||0);
    if(!text||textWidth+12>available){canvas.dataset.fuzzyReady='';return;}
    const dpr=Math.min(window.devicePixelRatio||1,2),margin=6,cssWidth=textWidth+margin*2,cssHeight=lineHeight;
    canvas.width=Math.ceil(cssWidth*dpr);canvas.height=Math.ceil(cssHeight*dpr);
    canvas.style.width=`${cssWidth}px`;canvas.style.height=`${cssHeight}px`;
    const offscreen=document.createElement('canvas');offscreen.width=canvas.width;offscreen.height=canvas.height;
    const offCtx=offscreen.getContext('2d'),ctx=canvas.getContext('2d');
    if(!offCtx||!ctx){canvas.dataset.fuzzyReady='';return;}
    offCtx.scale(dpr,dpr);offCtx.font=font;offCtx.textBaseline='middle';offCtx.fillStyle=style.color;
    offCtx.shadowColor='rgba(126,101,255,.45)';offCtx.shadowBlur=4;offCtx.fillText(text,margin,cssHeight/2);
    wrapper.classList.add('is-ready');
    let frameId=0,lastFrame=0;const started=performance.now();
    const draw=timestamp=>{
      if(!canvas.isConnected||reduceMotion){wrapper.classList.remove('is-ready');canvas.dataset.fuzzyReady='';return;}
      if(timestamp-lastFrame<1000/24){frameId=requestAnimationFrame(draw);return;}
      lastFrame=timestamp;
      const glitching=(timestamp-started)%2200<170,intensity=glitching ? .52 : .1,fuzzRange=glitching?14:7;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const rowHeight=Math.max(1,Math.round(dpr));
      for(let y=0;y<canvas.height;y+=rowHeight){
        const dx=Math.round(intensity*(Math.random()-.5)*fuzzRange*dpr);
        ctx.drawImage(offscreen,0,y,offscreen.width,rowHeight,dx,y,offscreen.width,rowHeight);
      }
      frameId=requestAnimationFrame(draw);
    };
    frameId=requestAnimationFrame(draw);
  });
}

function renderHistory() {
  const icons={fish:'🐟',bonus:'✅',debuff:'🛑',epic:'💜',legendary:'🧡',mythic:'◆',trash:'🔘',coin:'🪙',weather:'⚠️',angus:characterIconMarkup('angus','is-history-icon'),rift:'🌀',abyssal:'❓',island:'🗺️'};
  let visibleHistory=state.history.filter(row=>!row.mergedIntoHistoryId);
  const activePrompt=activeDungeonPrompt();
  if(activePrompt){const index=visibleHistory.findIndex(row=>row.id===activePrompt.historyRowId);if(index>=0)visibleHistory=[...visibleHistory.slice(0,index),...visibleHistory.slice(index+1),visibleHistory[index]];}
  $('historyCount').textContent=visibleHistory.length;
  $('emptyHistory').classList.toggle('hidden',visibleHistory.length>0);
  let numberedRow=0;
  $('historyList').innerHTML=visibleHistory.map((h)=>{
    const fish= h.type==='fish' && h.fishId ? state.fish.find(item=>item.id===h.fishId) : null;
     const historyArtifact=h.artifactId?state.artifacts.find(artifact=>artifact.id===h.artifactId):null;
     const historyDebuff=h.type==='debuff'?(state.debuffs||[]).find(debuff=>debuff.historyRowId===h.id):null;
    const expeditionItem=h.expeditionItemId?state.islands?.items?.find(item=>item.id===h.expeditionItemId):null;
    const isPrimordialChaos=h.type==='mythic'&&/^\s*Первобытный хаос\b/i.test(String(h.text||''));
    const historyArtifactVisualName=h.type==='mythic'?(historyArtifact?artifactVisualName(historyArtifact):isPrimordialChaos?'Первобытный хаос':h.text):h.text;
    const entityBasedIcon=['epic','legendary','mythic'].includes(h.type)?artifactIconMarkup(historyArtifactVisualName,h.type,'is-history-icon'):h.type==='bonus'?bonusIconMarkup(h.text,'is-history-icon'):h.type==='trash'?trashIconMarkup('is-history-icon'):h.type==='debuff'?debuffIconMarkup(h.text,'is-history-icon'):null;
    const coinForRow=h.type==='coin'&&h.coinId?state.coins.find(item=>item.id===h.coinId):null;
    const currentAbyss=abyssalEntity();
    const abyssPersonality=h.type==='abyssal'?historyAbyssalPersonality(h,currentAbyss):null;
    const abyssEntityIcon=h.type==='abyssal'?abyssalIconMarkup(abyssPersonality,'is-history-icon'):null;
    const dungeonEventIcon=h.type==='dungeon'?dungeonHistoryIconMarkup(h):null;
    const skeletonHistoryIcon=fish?fishSkeletonMainIcon(fish):'',dungeonSacrificeIcon=fish?fishDungeonSacrificeMainIcon(fish):'',dungeonAllyIcon=fish?.dungeonAlly?dungeonImg(DUNGEON_ALLIES[fish.dungeonAllyKey].file,DUNGEON_ALLIES[fish.dungeonAllyKey].name,'is-history-icon'):'',eatenHistoryIcon=fish?fishEatenMainIcon(h,fish):'';
    const historyShipKind=h.type==='tradeShip'&&(h.tradeShipSource==='recyclon'||/Рециклон/i.test(String(h.text||'')))?'recyclon':'trade';
     const icon=h.type==='fish'&&h.islandDisplaced?'<span class="island-displaced-cross">✖</span>':h.type==='fish'&&fish?(skeletonHistoryIcon||dungeonSacrificeIcon||dungeonAllyIcon||eatenHistoryIcon||fishCategoryIcons(fish)):h.type==='coin'?coinIconMarkup(coinForRow?.type||'copper'):h.type==='weather'?weatherWarningIconMarkup('is-history-icon'):expeditionItem?expeditionItemIconMarkup(expeditionItem.name,'is-history-icon'):h.type==='tradeShip'?shipIconMarkup(historyShipKind,'is-history-icon'):(dungeonEventIcon||abyssEntityIcon||entityBasedIcon||icons[h.type]||'');
     const weatherClass=h.type==='weather'&&h.weatherKey?` weather-${h.weatherKey}`:'';
     const orcaHistoryClass=h.type==='debuff'&&/Касатка/i.test(String(h.text||''))?' is-orca-debuff':'';
    const rowAmbient=historyAmbientMarkup(h);
    const riftLightning=h.type==='rift'?riftLightningMarkup(h):'';
    const abyssPulse=h.type==='abyssal'&&!h.abyssManifestation?abyssalPulseMarkup(h):'';
    const angusGiftRow=h.mergedHistoryRowId?state.history.find(row=>row.id===h.mergedHistoryRowId):null;
    const angusGiftArtifact=angusGiftRow?.artifactId?state.artifacts.find(artifact=>artifact.id===angusGiftRow.artifactId):null;
    const angusGiftArtifactMarkup=angusGiftArtifact?`<div class="angus-gift-artifact"><span class="angus-gift-artifact-icon">${artifactIconMarkup(artifactVisualName(angusGiftArtifact),angusGiftArtifact.tier,'is-history-icon')}</span><span class="angus-gift-artifact-copy">${artifactCategoryBadge(angusGiftArtifact.tier)}<span><strong>${artifactVisualName(angusGiftArtifact)}</strong>${angusGiftRow.detail?`<small class="history-detail">${angusGiftRow.detail}</small>`:''}</span></span></div>`:'';
    const nautilusSummon=renderNautilusSummon(angusGiftRow||h);
    const embeddedFish=renderEmbeddedFishList(angusGiftRow||h);
    const riftLootResults=renderRiftLootResults(h);
    const islandLootResults=renderIslandLootResults(h);
    const dungeonAction=renderDungeonHistoryAction(h);
    const dungeonPrediction=renderDungeonPrediction(h);
    const dungeonSmolder=renderBallistierSmolder(fish);
    const transmutation=renderTransmutation(h);
     const impactNote=h.type==='fish'&&h.islandTraded?'(Обменян особому торговому судну, вызванному Рунической ракетой)':h.type==='fish'&&h.islandDisplaced?`(Вытеснена эффектом ${fishEffectBadge('unstable-presence','Нестабильное присутствие')})`:h.type==='fish'&&fish?.islandSkeleton?`(${fishEffectBadge('unstable-presence','Нестабильное присутствие')} полностью лишило рыбу веса и превратило её в скелет)`:h.type==='fish'&&fish?.mythicSkeleton?'(Пассивное свойство «Искры Хаоса» превратило рыбу в скелет)':h.type==='fish'&&h.riftSacrificeLabel?`(${h.riftSacrificeLabel})`:h.type==='fish'&&h.abyssLost?`(${h.abyssLost})`:h.type==='fish'&&h.eaten&&!fish?.smoldering&&!fish?.ballistierSkeleton&&!fish?.ballistierEscaped?'(Съедена Касаткой)':h.type==='fish'&&h.stolen?'(Украдена Чайкой)':'';
     const wrathFishBadge=h.type==='fish'?ballistierWrathFishBadge(fish):'';
     const impactBadge=wrathFishBadge||(h.type==='fish'&&h.stolen?fishEffectBadge('stolen','Украдена Чайкой'):h.type==='fish'&&h.eaten&&!h.abyssLost&&!h.riftSacrificeLabel?fishEffectBadge('eaten-by-orca','Съедена Касаткой'):'');
    const impactContent=impactBadge||fish?.abyssLost||h.islandDisplaced||h.riftSacrificeLabel?'':impactNote;
    const fishSource=fish?fishHistorySourceLabel(h.fishSource||fish.source):'';
    const visibleText=fish?fishTitleText(fish):h.text;
    const essenceImpact=fish?renderEssenceImpact(fish):'';
    const riftEffectImpact=fish?renderRiftEffectImpact(fish):'';
    const islandDangerImpact=fish?renderIslandDangerImpact(fish):'';
    const firstWaterImpact=fish?renderFirstWaterImpact(fish):'',moonShellImpact=fish?renderMoonShellImpact(fish):'';
    const abyssFishImpacts=fish?renderAbyssFishImpacts(fish):'';
    const singularityImpact=fish?renderSingularityImpact(fish):'';
    const megalodonImpact=fish?renderMegalodonImpact(fish):'';
    const finalOrcaImpact=fish?renderFinalOrcaImpact(fish):'';
    const diceImpact=fish?renderDiceImpact(fish):'';
    const numberPrefix=h.numbered?`${++numberedRow}. `:'';
    const riftOriginIcon=h.type==='rift'?(h.relicName?`<span class="rift-history-relic" title="${h.relicName}" aria-label="${h.relicName}">${riftRelicIcon(h.relicName,'is-history-icon')}</span>`:`<span class="rift-history-origin" title="Добыча Разлома" aria-label="Добыча Разлома">${fishCategoryIcon('rift','Разлом','is-rift-parent')}</span>`):'';
    const islandCompletion=Boolean(h.islandCompletion)||(h.type==='island'&&/Экспедиция завершена:/i.test(String(h.text||'')));
    const artifactTierBadge=['epic','legendary','mythic'].includes(h.type)?artifactCategoryBadge(h.type):h.type==='bonus'?bonusCategoryBadge():h.type==='debuff'?debuffCategoryBadge():'';
    const goldenHourImpact=fish?renderGoldenHourImpact(fish,Number(h.goldenAnimationUntil)>Date.now()):'';
    const leviathanImpact=fish?renderLeviathanImpact(fish):'';
    const flipperImpact=fish?renderFlipperImpact(fish):'';
    const pendingThreadImpact=fish?renderSiphonophoreImpact(fish,'pending'):'';
    const sparkChaosImpact=fish?renderSparkChaosImpact(fish):'';
    const trashThreadImpact=fish?renderSiphonophoreImpact(fish,'trash'):'';
    const maskImpact=fish?renderMaskImpact(fish):'';
    const scubaImpact=fish?renderScubaImpact(fish):'';
    const coinImpacts=fish?renderCoinImpacts(fish):'';
    const luminarImpacts=fish?renderLuminarImpacts(fish):'';
    const debuffWeightImpact=fish?renderDebuffWeightImpact(fish):'';
    const messageImpact=fish?renderMessageImpact(fish):'';
    const tradeItemFind=renderTradeItemFind(h);
    const tradeShipHistory=renderTradeShipHistory(h);
    const coinAction=renderCoinAction(h);
    const gearBonusStatus=renderGearBonusStatus(h);
    const scubaBonusStatus=renderScubaBonusStatus(h);
    const abyssDecision=renderAbyssDecision(h);
    const abyssObjectChanges=renderAbyssObjectChanges(h);
    const expeditionAction=renderExpeditionAction(h),navigatorAction=renderNavigatorAction(h,fish);
    let historyDetailText=fish?compactFishHistoryDetail(h.detail,h.fishSource||fish.source):String(h.detail||'');
    historyDetailText=compactIslandOriginText(historyDetailText);
    if(fish&&!fish.islandColossus)historyDetailText=unstablePresenceVisualText(historyDetailText);
    if(h.type==='abyssal'&&h.abyssPersonality==='predator'){
      historyDetailText=historyDetailText.replace(/Съедена:\s*([^•)]+)/g,'<span class="abyss-negative-hint">Съедена: $1</span>');
    }
    if(h.type==='rift'&&/^\(?Вынесена добыча:/i.test(historyDetailText.trim()))historyDetailText='';
    if(islandCompletion&&/Получен исполин|Нестабильное присутствие/i.test(historyDetailText))historyDetailText='';
    if(fish?.goldenHourImpact)historyDetailText=historyDetailText.replace(/\s*•?\s*<span class="gold-add">[^<]*<\/span>\s*•?\s*/g,' • ').replace(/^\s*•\s*|\s*•\s*$/g,'').trim();
    const hasUnstableBadge=fish?.islandColossus&&/Нестабильное присутствие/i.test(historyDetailText);
    if(hasUnstableBadge)historyDetailText=historyDetailText.replace(/<span class="island-negative-hint">\s*Нестабильное присутствие\s*<\/span>\s*(?:•\s*)?/i,'').trim();
    const negativeHistoryDetail=/Нестабильное присутствие|вытеснен/i.test(historyDetailText)&&!historyDetailText.includes('island-negative-hint');
    const compactEntityHeader=(['bonus','debuff','epic','legendary','mythic','trash'].includes(h.type)&&Boolean(entityBasedIcon))||(h.type==='abyssal'&&Boolean(abyssEntityIcon))||h.type==='angus'||h.type==='tradeShip'||h.type==='coin'||h.type==='weather';
    const compactFishHeader=h.type==='fish'&&Boolean(fish);
    const compactExpeditionHeader=Boolean(expeditionItem);
    const compactEntityDetailText=historyDebuff?.name==='Касатка'
      ? `Съедает всю рыбу весом от 5,5 кг • съедено: ${state.eaten.length}`
      : h.type==='tradeShip'
      ? (historyShipKind==='recyclon'?'«Рециклон» готов переработать хлам обычных забросов.':'Команда судна готова обменять редкие находки на крупную рыбу.')
      : historyDetailText;
    const compactDetail=compactEntityHeader&&compactEntityDetailText?`<small class="history-detail history-entity-detail${negativeHistoryDetail?' island-negative-detail':''}">${compactEntityDetailText}</small>`:'';
    const expeditionDetailText=compactExpeditionHeader&&expeditionItem?.status==='decoded'
      ? historyDetailText.replace(/Координаты обнаружены/gi,'<span class="expedition-status is-decoded">Координаты обнаружены</span>')
      : historyDetailText;
    const expeditionDetail=compactExpeditionHeader&&expeditionDetailText?`<small class="history-detail history-expedition-detail">${expeditionDetailText}</small>`:'';
    const fishDetailBadge=hasUnstableBadge?fishEffectBadge('unstable-presence','Нестабильное присутствие'):'';
    const fishCompactDetail=compactFishHeader&&(historyDetailText||fishDetailBadge)?`<small class="history-detail history-entity-detail${negativeHistoryDetail?' island-negative-detail':''}">${fishDetailBadge}${historyDetailText}</small>`:'';
    const abyssLostDetail=compactFishHeader&&fish?.abyssLost?`<small class="history-detail history-entity-detail fish-abyss-outcome abyss-negative-hint">(${fish.abyssLost})</small>`:'';
    const displacedFishDetail=compactFishHeader&&h.islandDisplaced?`<small class="history-detail history-entity-detail fish-displaced-inline-hint">(Вытеснена эффектом ${fishEffectBadge('unstable-presence','Нестабильное присутствие')})</small>`:'';
    const sacrificeFishDetail=compactFishHeader&&h.riftSacrificeLabel?`<small class="history-detail history-entity-detail fish-abyss-outcome rift-sacrifice-inline-hint">(${h.riftSacrificeLabel})</small>`:'';
    const namedRiftIcon=fish&&!skeletonHistoryIcon&&!eatenHistoryIcon?(riftFishIcon(fish)||islandFishIconMarkup(fish)):'',namedRiftBadges=fish&&!namedRiftIcon?riftFishBadges(fish):'';
    const riftTitle=h.type==='rift'&&/^Открыт .+разлом:/i.test(String(h.text||''))?`<span class="rift-fuzzy-title"><span class="rift-fuzzy-source">${visibleText}</span><canvas class="rift-fuzzy-canvas" aria-hidden="true"></canvas></span>`:'';
    const mainLine=h.transmutation?`${numberPrefix}Трансмутация хлама`:islandCompletion?`<span class="island-completion-title">${numberPrefix}${visibleText}</span>`:compactExpeditionHeader?`<span class="history-expedition-layout"><span class="history-expedition-leading">${icon}</span><span class="history-expedition-copy"><span class="history-expedition-title">${numberPrefix}${visibleText}</span>${expeditionDetail}${expeditionAction}</span></span>`:compactFishHeader?`<span class="history-fish-layout${impactBadge?' has-status-badge':''}${namedRiftIcon?' has-rift-fish-icon':''}${fish?.abyssLost||h.riftSacrificeLabel?' has-abyss-outcome':''}"><span class="history-fish-leading">${namedRiftIcon||icon}</span><span class="history-entity-copy"><span class="history-entity-title">${namedRiftBadges}<span class="history-fish-catch-text">${numberPrefix}${visibleText}</span>${fishSizeMarker(fish)}${fishInlineStatusIcon(h,fish)}${fishSource?` <span class="fish-history-source">(${fishSource})</span>`:''}</span>${fishCompactDetail}${abyssLostDetail}${displacedFishDetail}${sacrificeFishDetail}</span>${impactBadge?`<span class="history-fish-status-badge">${impactBadge}</span>`:''}${rowAmbient}</span>`:compactEntityHeader?`<span class="history-entity-layout"><span class="history-entity-leading">${icon}</span><span class="history-entity-copy"><span class="history-entity-title">${numberPrefix}${visibleText}</span>${compactDetail}</span></span>`:riftTitle||`${numberPrefix}${h.type==='rift'&&h.relicName?'':`${icon} `}${visibleText}`;
    const separateHistoryDetail=!compactEntityHeader&&!compactFishHeader&&!compactExpeditionHeader&&historyDetailText?`<small class="history-detail${negativeHistoryDetail?' island-negative-detail':''}">${historyDetailText}</small>`:'';
    const rowHasExtendedContent=Boolean(
      compactDetail||fishCompactDetail||expeditionDetail||separateHistoryDetail||
      abyssLostDetail||displacedFishDetail||sacrificeFishDetail||impactContent||impactBadge||
      islandDangerImpact||megalodonImpact||singularityImpact||riftEffectImpact||abyssFishImpacts||
      essenceImpact||goldenHourImpact||leviathanImpact||coinImpacts||luminarImpacts||
      debuffWeightImpact||messageImpact||flipperImpact||pendingThreadImpact||sparkChaosImpact||
      trashThreadImpact||firstWaterImpact||moonShellImpact||maskImpact||scubaImpact||diceImpact||
      finalOrcaImpact||gearBonusStatus||scubaBonusStatus||tradeItemFind||abyssObjectChanges||
      tradeShipHistory||coinAction||abyssDecision||expeditionAction||navigatorAction||transmutation||
      angusGiftArtifactMarkup||nautilusSummon||embeddedFish||islandLootResults||riftLootResults||dungeonAction||dungeonPrediction||dungeonSmolder
    );
    const abyssClass=abyssPersonality?` abyss-${abyssPersonality}`:'';
    return `<li data-history-id="${h.id}" class="history-item type-${h.type} is-compact-row${rowHasExtendedContent?' has-extended-content':''}${isPrimordialChaos?' is-primordial-chaos':''}${islandCompletion?' is-island-completion':''}${h.threadRemoved?' is-thread-removed':''}${h.eaten&&!fish?.mythicSkeleton?' is-eaten':''}${fish?.mythicSkeleton&&!fish?.islandSkeleton?' is-chaos-skeleton':''}${fish?.islandSkeleton?' is-island-skeleton':''}${fish?.dungeonAlly?' is-dungeon-ally-catch':''}${fish?.ballistierEscaped?' is-dungeon-escaped':''}${h.stolen?' is-stolen':''}${h.abyssLost?' is-abyss-lost':''}${h.islandDisplaced?' is-island-displaced':''}${h.islandTraded?' is-island-traded':''}${expeditionItem&&expeditionItem.status!=='active'?' is-expedition-inactive':''}${h.abyssManifestation?' is-abyss-manifestation':''}${h.abyssDecision?' has-abyss-decision':''}${h.transmutation?' is-transmutation':''}${weatherClass}${orcaHistoryClass}${abyssClass}${h.id===lastAnimatedHistoryId?' is-new':''}">${riftLightning}${abyssPulse}${riftOriginIcon}${artifactTierBadge}<strong>${mainLine}</strong>${separateHistoryDetail}${impactContent?`<small class="history-impact-note${h.islandDisplaced||fish?.islandSkeleton?' island-displaced-note':''}${h.eaten&&!h.abyssLost&&!h.riftSacrificeLabel?' orca-eaten-hint':''}${h.abyssLost?' abyss-negative-hint':''}">${impactContent}</small>`:''}${islandDangerImpact}${megalodonImpact}${singularityImpact}${riftEffectImpact}${abyssFishImpacts}${essenceImpact}${goldenHourImpact}${leviathanImpact}${coinImpacts}${luminarImpacts}${debuffWeightImpact}${messageImpact}${flipperImpact}${pendingThreadImpact}${sparkChaosImpact}${trashThreadImpact}${firstWaterImpact}${moonShellImpact}${maskImpact}${scubaImpact}${diceImpact}${finalOrcaImpact}${gearBonusStatus}${scubaBonusStatus}${tradeItemFind}${abyssObjectChanges}${tradeShipHistory}${coinAction}${abyssDecision}${compactExpeditionHeader?'':expeditionAction}${navigatorAction}${transmutation}${angusGiftArtifactMarkup}${nautilusSummon}${embeddedFish}${islandLootResults}${riftLootResults}${dungeonAction}${dungeonPrediction}${dungeonSmolder}</li>`;
  }).join('');
  requestAnimationFrame(initRiftFuzzyTitles);
  if (lastAnimatedHistoryId) {
    const latest=$('historyList').querySelector(`[data-history-id="${lastAnimatedHistoryId}"]`);
    const scroller=$('historyScroll');
    syncNewHistoryRowToBottom(scroller);
    setTimeout(()=>latest?.classList.remove('is-new'),700);
    lastAnimatedHistoryId=null;
  }
}

function abyssalPulseMarkup(row){
  const seed=String(row.id||'abyss').split('').reduce((n,ch)=>(n*33+ch.charCodeAt(0))>>>0,5381);
  const delay=-((seed%380)/100).toFixed(2);
  return `<svg class="abyss-organic abyss-dna" viewBox="0 0 100 44" preserveAspectRatio="none" aria-hidden="true"><g class="abyss-dna-helix" style="--dna-delay:${delay}s"><path class="abyss-dna-strand abyss-dna-one" d="M-6 22 C4 5 14 5 24 22 S44 39 54 22 S74 5 84 22 S104 39 110 22"/><path class="abyss-dna-strand abyss-dna-two" d="M-6 22 C4 39 14 39 24 22 S44 5 54 22 S74 39 84 22 S104 5 110 22"/><g class="abyss-dna-rungs"><path d="M1 14 L1 30 M8 8 L8 36 M16 11 L16 33 M24 22 L24 22 M32 33 L32 11 M40 36 L40 8 M48 29 L48 15 M54 22 L54 22 M62 10 L62 34 M70 8 L70 36 M78 15 L78 29 M84 22 L84 22 M92 33 L92 11 M100 36 L100 8"/></g><circle cx="8" cy="8" r="1.25"/><circle cx="40" cy="36" r="1.25"/><circle cx="70" cy="8" r="1.25"/><circle cx="100" cy="36" r="1.25"/></g></svg>`;
}

function riftLightningMarkup(row) {
  let seed=String(row.id||row.text||'rift').split('').reduce((n,ch)=>(n*31+ch.charCodeAt(0))>>>0,2166136261);
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const bolt=(index,yBase)=>{
    const points=[];
    const count=8+Math.floor(random()*4);
    for(let i=0;i<=count;i++){
      const x=-4+i*(108/count);
      const envelope=Math.sin(Math.PI*i/count);
      const y=yBase+(random()-.5)*22*envelope;
      points.push([Number(x.toFixed(1)),Number(y.toFixed(1))]);
    }
    const path=`M ${points.map(([x,y])=>`${x} ${y}`).join(' L ')}`;
    const branchAt=2+Math.floor(random()*(count-4));
    const [bx,by]=points[branchAt];
    const direction=random()>.5?1:-1;
    const branch=`M ${bx} ${by} L ${(bx+6+random()*7).toFixed(1)} ${(by+direction*(5+random()*6)).toFixed(1)} L ${(bx+13+random()*10).toFixed(1)} ${(by+direction*(10+random()*9)).toFixed(1)}`;
    return `<g class="rift-bolt rift-bolt-${index}"><path class="rift-bolt-glow" pathLength="1" d="${path}"/><path class="rift-bolt-core" pathLength="1" d="${path}"/><path class="rift-bolt-branch" pathLength="1" d="${branch}"/></g>`;
  };
  const delay=(random()*-3.7).toFixed(2);
  return `<svg class="rift-lightning" viewBox="0 0 100 44" preserveAspectRatio="none" aria-hidden="true" style="--rift-delay:${delay}s">${bolt(1,13+random()*7)}${bolt(2,29+random()*6)}</svg>`;
}

let fishShadowTimer=null;
function startHistoryAmbient(ambient, delay=0) {
  setTimeout(()=>{
    if (reduceMotion || document.hidden || !ambient?.isConnected || ambient.classList.contains('swim')) return;
    ambient.classList.toggle('from-bottom', !ambient.classList.contains('catch-fish-shadow') && Math.random()<.5);
    const duration=Number(ambient.dataset.duration||1700);
    ambient.classList.add('swim');
    setTimeout(()=>ambient.classList.remove('swim','from-bottom'),duration);
  },delay);
}
function scheduleFishShadow() {
  clearTimeout(fishShadowTimer);
  fishShadowTimer=setTimeout(()=>{
    if (!reduceMotion && !document.hidden) {
      const ambients=[...document.querySelectorAll('.history-ambient:not(.swim)')];
      if (ambients.length) {
        const max=Math.min(3,ambients.length);
        const count=1+Math.floor(Math.random()*max);
        const pool=[...ambients];
        for(let i=0;i<count;i++) {
          const index=Math.floor(Math.random()*pool.length);
          const ambient=pool.splice(index,1)[0];
          startHistoryAmbient(ambient,Math.random()*700);
        }
      }
    }
    scheduleFishShadow();
  },850+Math.random()*1450);
}

function showChoice(title,text,options,onSelect) {
  $('choiceTitle').textContent=title; $('choiceText').textContent=text;$('choiceText').classList.remove('colossus-trade-warning','island-negative-choice');$('choiceText').classList.toggle('island-negative-choice',String(text).includes('Нестабильное присутствие')); const box=$('choiceButtons'); box.innerHTML='';
  options.forEach(option=>{const data=typeof option==='object'?option:{label:option,value:option};const b=document.createElement('button');b.textContent=data.label;if(data.className)b.className=data.className;b.onclick=()=>{$('choiceDialog').close();onSelect(data.value);if(state.castsLeft<=0&&!state.finished)maybeFinalizeSession();commitState();setTimeout(resolveFadedRelicFragment,0);};box.appendChild(b);});
  $('choiceDialog').showModal();
}

const GUIDE = {
  'Погода': Object.entries(DATA.weather).map(([key,value])=>[`${weatherIconMarkup(key,'is-guide-icon')} ${value.name}`,value.text]),
  'Острова': [
    ['Экспедиционные предметы','После обычного заброса или успешного аркадного улова с вероятностью 0,02% находится дополнительный экспедиционный предмет. Расшифровка успешна с вероятностью 50%. Каждые координаты создают отдельную экспедицию.'],
    ['Остров Разрушительных Приливов','На острове доступны 3 исследования из 6 одноразовых локаций. После каждого результата можно продолжить или покинуть остров досрочно.'],
    ['Опасности','Вероятность опасного события равна 30%, 32% и 34% для первого, второго и третьего исследования. Опасность раньше третьего шага завершает экспедицию; на третьем может уменьшить вес случайного исполина на 10–50%.'],
    ['Безопасный маршрут','Компас потерянных глубин полностью исключает опасные события и не расходуется. Уже использованный Компас также защищает экспедицию.'],
    ['Исполины','Абиссалор: 100–200 кг (15%); Древний Абиссалор: 201–300 кг (10%); Первородный Абиссалор: 301–400 кг (5%). Бонусы и артефакты на исполинов не действуют. Чайка их не крадёт, Касатка имеет 50% шанс съесть исполина.'],
    ['Нестабильное присутствие','После возвращения исполин вытесняет всю ранее полученную рыбу. Будущая неторговая рыба, включая рыб Бездонного ларя, обязательно теряет минимум 0,1 кг. Рыба тяжелее 1 кг снижается до 0,1–1,0 кг; рыба весом 0,2–1,0 кг получает меньший вес; рыба весом 0,1 кг превращается в скелет. Рыба за предметы, исполинов и от «Рециклона» защищена от эффекта. Для двух рыб за монету последнего заброса выполняется одна общая проверка 50%: торговый обмен либо разрывает связь с забросом, либо обе рыбы искажаются. Ранее искажённый улов не восстанавливается.'],
    ['Руническая сигнальная ракета','Одноразово гарантирует один выбранный визит даже во время Шторма: обычное судно для предметов обмена и особых предложений либо «Рециклон» только для хлама обычных забросов. Перед вызовом показываются текущие количества и рекомендация. Второе судно не гарантировано: в конце сессии выполняется лишь обычная вероятностная проверка его прибытия. Только вызванное обычное судно принимает исполинов.'],
    ['Удочка племени Острого Плавника','До конца сессии удваивает каждый предмет обмена, найденный обычным забросом. С Люминаром копии складываются: основной предмет + копия Удочки + копия каждого Люминара.']
    ,['Остров Свинцового Тумана','Шесть отдельных локаций и три исследования. Карта последнего маршрута может открыть четвёртую оставшуюся локацию с опасностью 36%. Фон и добыча острова отличаются от Разрушительных Приливов.']
    ,['Остров Каменных Стражей','Шесть локаций и три исследования. Идол один раз отменяет выпавшую опасность, а маска один раз бесплатно повторяет текущую локацию. Здесь встречаются Гранитные сомы и Фрагменты угасшей реликвии.']
    ,['Остров Забытых Течений','После первой опасности можно отступить или продолжить: следующая награда получает дополнительный шанс 35% стать редкой, а следующая опасность возрастает на 15%. Повторная опасность завершает экспедицию.']
    ,['Эхоносный скат','Островная рыба весом 70–120, 121–180 или 181–240 кг. Пока скат остаётся в улове, после обычного рыбного заброса с шансом 20% появляется отдельная рыба той же категории. Чайка ската не крадёт, Касатка и абиссальная форма взаимодействуют с ним по обычным правилам.']
    ,[`${tradeItemIconMarkup('moonTideShell','is-guide-icon')} Раковина лунного прилива`,'Восстанавливает одну искажённую рыбу, защищает её до конца сессии и удваивает будущих обычных рыб, включая эхо-улов. После пяти удвоений призывает одну Чешую Левиафана. Одновременно активна одна Раковина; использованную можно обменять на 1–5 рыб.']
    ,[`${tradeItemIconMarkup('firstWaterFlask','is-guide-icon')} Флакон Первой Воды`,'При Нестабильном присутствии возвращает половину потерянного веса всему искажённому улову, кроме скелетов, и ослабляет будущие искажения до конца сессии. Без Нестабильного присутствия призывает Плавник мегалодона. Неиспользованный Флакон обменивается на одного гиганта.']
    ,['Гранитный сом','Островная рыба трёх категорий весом 80–130, 131–190 и 191–250 кг. Нестабильное присутствие уменьшает вес на 50%. Чайка не может выбрать его целью, Касатка съедает по обычному правилу. Пока сом остаётся в улове, каждый обычный заброс с шансом 25% не расходует лимит.']
    ,[`${tradeItemIconMarkup('fadedRelicFragment','is-guide-icon')} Фрагмент угасшей реликвии`,'При следующем получении артефакта или реликвии превращается в артефакт: эпический 85%, легендарный 12%, мифический 3%. Полученная сила действует по своим обычным правилам.']
    ,['Резонирующая туманная мурена','Островная рыба трёх категорий весом 95–140, 141–180 и 181–200 кг. Чайка её не крадёт, Касатка съедает по обычному правилу. Нестабильное присутствие один раз уменьшает её текущий вес на 50%.']
    ,['Астральный навигатор','Один раз раскрывает закреплённую награду и опасность локации. После острова может запомнить категорию рыбы, пойманной только после получения навигатора; будущие рыбные результаты обычных забросов сохраняют категорию до конца сессии.']
    ,['Припасы ордена Мглистой Дымки','С вероятностью 95% содержат 3–5 стандартных рыб, с вероятностью 5% — одну островную рыбу. Дополнительно с независимым шансом 30% содержат один ресурс для обмена.']
  ],
  'Разломы': [
    ['Общие правила','Разлом может открыться после обычного заброса в Тумане, Затмении, Грозе или Шторме. Он не расходует забросы. После успешного этапа можно забрать накопленное или пойти глубже. Критический провал уничтожает только добычу Разлома и добровольные жертвы.'],
    ...Object.values(RIFT_TYPES).map(r=>[r.name,`${r.description} Уникальная реликвия: ${r.relic}.`])
  ],
  'Торговые суда': [
    [`${shipIconMarkup('trade','is-guide-icon')} Прибытие`,'После последнего заброса в любую погоду, кроме Шторма, судно прибывает с вероятностью 50%. Если подходящей добычи нет, торговля завершается автоматически. Если есть варианты обмена, в хронологии появляется кнопка «Торговля».'],
    [`${tradeItemIconMarkup('tidePearl','is-guide-icon')} Предметы обмена`,'При прямой поимке рыбы удочкой с вероятностью 40% дополнительно находится один специальный предмет. Предмет не расходует заброс и показывается в той же строке хронологии.'],
    [`${shipIconMarkup('trade','is-guide-icon')} Обмен`,'Команда судна принимает три случайных вида предметов из шести. Игрок сам выбирает, какие доступные предметы отдать, или может обменять всё подходящее сразу. За каждый предмет выдаётся тяжеловес с вероятностью 90% или рыба-гигант с вероятностью 10%. Результаты видны в хронологии.'],
    [`${shipIconMarkup('recyclon','is-guide-icon')} Перерабатывающее судно «Рециклон»`,'Вызывается Рунической сигнальной ракетой вместо обычного судна, если накоплен подходящий хлам. «Рециклон» не принимает предметы обмена и перерабатывает только хлам, полученный обычными забросами. Одна кнопка подтверждает переработку всего доступного хлама. Каждая его единица превращается в одну рыбу: 50% обычная, 35% тяжеловес, 15% гигант. Полученные рыбы защищены от «Нестабильного присутствия». После ухода «Рециклона» обычное торговое судно может прибыть по стандартной вероятности, но его визит не гарантирован.']
  ],
  'Абиссальная форма': [
    ['Неизвестная форма','Самостоятельно попадается с шансом 3% в Дождь, Туман, Затмение, Грозу и Шторм. При выходе с добычей из любого Разлома добавляется с шансом 1%. Форму можно удалить или оставить; после оставления избавиться от неё нельзя.'],
    ['Скрытый характер','Характер назначается при поимке и раскрывается первым реальным действием через 1–2 обычных заброса. Затем каждые два заброса выполняется проверка нового действия с шансом 35%. Островные рыбы могут становиться целью свойств формы жизни. Абиссалора нельзя уничтожить: попытка Хищника или Разрушителя вместо этого уменьшает его текущий вес на 30–50%, а «Нестабильное присутствие» сохраняется.'],
    ['Паразит','Внедряется в рыбу, бонусы и предметы: уменьшает вес, понижает категорию гигантов, блокирует бонусы, нейтрализует дебафы и пожирает предметы или монеты.'],
    ['Хищник','Охотится на рыбу, предпочитает ценные экземпляры и гигантов, а иногда полностью уничтожает редкий улов.'],
    ['Симбиот','Увеличивает вес, повышает категории рыб, усиливает бонусы, подавляет дебафы и восстанавливает оставшийся ухудшенный улов.'],
    ['Расхититель','Преобразует хлам, предметы обмена и монеты, а также меняет количество редких находок.'],
    ['Разрушитель','Отключает бонусы и дебафы, хаотично меняет вес и уничтожает часть улова, иногда запуская цепочку негативных эффектов.'],
    ['Метаморф','Меняет категории и вес рыб, преобразует ресурсы и может вызвать цепную мутацию всей структуры улова.']
  ],
  'Бонусы': [
    ['Подводная маска','Каждая Подводная маска последовательно умножает вес каждой оставшейся рыбы в финале на ×1,5. Две Маски дают общий множитель ×2,25, три — ×3,375. В хронологии показываются исходный вес, общий множитель и итог для каждой затронутой рыбы.'],
    ['Ласты','Каждая вторая будущая рыба ×2. Несколько ласт складываются. В строке усиленной рыбы показываются исходный вес, множитель и результат.'],
    ['Акваланг','В финале усиливает одну самую тяжёлую оставшуюся рыбу. Акваланги складываются линейно: 1 — ×3, 2 — ×6, 3 — ×9. Штурвал Наутилуса удваивает силу каждого: 1 — ×6, 2 — ×12, 3 — ×18. Усиление применяется один раз.'],
    ['Счастливый поплавок','Хлам не расходует заброс.'],
    ['Снаряжение дайвера','Блокирует Чайку, Рака и Утку, если получено раньше них.'],
    [`${characterIconMarkup('angus','is-guide-icon')} Старина Ангус`,'После любого заброса имеет 2% шанс появиться без расхода дополнительной попытки. С вероятностью 5% приносит артефакт: эпический в 85% случаев или легендарный в 15%. Если артефакта нет, гарантированно добавляет случайную рыбу-гиганта. Повторный Компас имеет отдельный шанс 2% призвать Ангуса.','angus-guide']
  ],
  'Дебафы': [
    ['Чайка','Крадёт случайную доступную рыбу. Если рыбы ещё нет, ждёт первую пойманную рыбу.'],['Рак','Ограничивает весь будущий улов диапазоном 0,1–2,5 кг.'],['Утка','Повышает шанс хлама и ограничивает рыбу 3 кг.'],['Осьминог','Навсегда отключает все бонусы, полученные до его появления.'],['Касатка','Съедает всю рыбу весом от 5,5 кг.']
  ],
  'Эпические': [
    ['Бездонный ларь','Даёт 1–5 рыб до 19,9 кг с очень низким шансом гиганта. Каждая созданная Ларём рыба после каждого обычного заброса до конца сессии получает +1 кг к текущему весу; другие бонусы и артефакты не прекращают этот рост. Ларь также с общим шансом редкого экспедиционного предмета может содержать одну из страниц, встречающихся в Послании в бутылке.'],['Компас потерянных глубин','Первый Компас один раз меняет погоду и возвращает лимит к 10. Каждый повторный добавляет 2 заброса и сразу проверяет 2% шанс Ангуса. При неудаче добавляет три проверки по 5% на следующих обычных забросах; дополнительные Компасы продлевают след, но не повышают шанс выше 5%.'],['Послание в бутылке','Возвращает украденную Чайкой рыбу и удваивает повреждённый Раком/Уткой улов. Если посланию нечего вернуть или удвоить, перед завершением сессии бутылку можно открыть: внутри находится один из четырёх экспедиционных документов, который затем расшифровывается по обычным правилам.'],['Чешуя Левиафана','+5 забросов; будущие рыбы получают +5, +10, +15 кг и далее.'],['Эссенция «Великан Океанов»','Применяется в конце сессии: две самые лёгкие оставшиеся рыбы получают ×5 каждая; если осталась только одна рыба — она получает ×10. Если рыбы не осталось, Эссенция не применяется. В строках затронутых рыб показываются исходный вес, новый вес и множитель.']
  ],
  'Легендарные': [
    ['Глубоководное нечто','Превращает весь уже пойманный и весь будущий хлам в рыб-гигантов.'],['Гексаэдр пятой грани','Выбор: +5 забросов или ×5 финальный вес.'],['Штурвал Наутилуса','Удваивает силу бонусов и призывает Глубоководное нечто: весь уже пойманный и весь будущий хлам превращается в рыб-гигантов.'],['Плавник мегалодона','Нейтрализует дебафы, восстанавливает улов и повышает шанс гиганта на 50%.']
  ],
  'Мифические': [
    ['Око Шторма','Выпадает только в Грозу и Шторм с шансом 0,5%. Вручную показывает три точных результата. Их можно принять или отвергнуть, пробудив четырёхзабросовое Буйство Шторма.'],
    ['Искра Хаоса','Гарантирует случайный Разлом на пятом следующем забросе и понижает весовую категорию рыб удочки и Разломов. Если пяти попыток нет, Первобытный хаос начинает сессию заново.'],
    ['Люминар Удильщика','Исключает хлам из основного улова, увеличивает шанс гиганта на 30%, усиливает обычных рыб и тяжеловесов обычного, аркадного и разломного улова на 5–10 кг, копирует предметы и повышает удачу монет.'],
    ['Нить Сифонофоры','С растущим шансом добавляет к забросу дополнительную рыбу, преобразует хлам в нарастающие прибавки веса и может быть обменена капитану на 5–10 крупных рыб.']
  ],
  'Достижения': [
    ['Трепетный эколог','В итоговом улове нет рыбы, но остался хотя бы один предмет хлама.'],
    ['Аквариумный мастер','Поймать не менее 7 рыб с исходным весом до 1 кг.'],
    ['Неуловимый','Совершить не менее 10 забросов и не получить ни одного дебафа; недоступно, если за сессию был Шторм.'],
    ['Первобытный триумф','Напрямую выловить и сохранить в итоговом улове настоящую рыбу-гиганта без помощи бонусов и артефактов. Рыба не должна быть ограничена Уткой или Раком.'],
    ['Гроза океана','Получить итоговый вес от 150 до 299,9 кг.'],
    ['Повелитель глубин','Получить итоговый вес от 300 кг.'],
    ['Марафонец','Совершить не менее 15 фактических забросов за одну игру.'],
    ['Мастер крупных форм','Сохранить в итоговом улове не менее 3 гигантов.'],
    ['Трансмутатор','Успешно применить Эссенцию «Великан Океанов».'],
    ['Золотая чешуя','Поймать за одну игру оба золотых вида: золотую рыбку и золотую форель.'],
    ['Тяжёлая артиллерия','Поймать и сохранить в итоговом улове не менее четырёх настоящих рыб-тяжеловесов. Рыбы, ограниченные Уткой или Раком, не учитываются.'],
    ['Легенда озера','Поймать рыбу с исходным весом ровно 40 кг.'],
    ['На волоске','Завершить игру с итоговым весом от 99 до 99,9 кг.'],
    ['Идеальный баланс','Получить итоговый вес ровно 100 кг.'],
    ['Один, но могучий','Завершить игру с одной-единственной настоящей рыбой-тяжеловесом или гигантом весом не менее 20 кг. Ограниченные Уткой или Раком и усиленные из обычных рыб экземпляры не учитываются.'],
    ['Синоптик','Увидеть не менее 5 разных погодных режимов за сессию.'],
    ['Повелитель стихий','Сменить погоду с помощью Компаса потерянных глубин.'],
    ['Рыбак во мраке','Получить легендарный артефакт во время Затмения.'],
    ['Сквозь туман','Получить эпический артефакт во время Тумана.'],
    ['Гроза не помеха','Поймать тяжеловеса во время Грозы.'],
    ['Штормовой капитан','Завершить игру во время Шторма с весом не менее 100 кг.'],
    ['Золотой улов','Поймать не менее 5 рыб во время Золотого часа.'],
    ['Полное снаряжение','Получить Маску, Ласты и Акваланг за одну игру.'],
    ['Под защитой','Заблокировать не менее 2 дебафов Снаряжением дайвера.'],
    ['Вторая попытка','Сохранить не менее 2 забросов благодаря Счастливому поплавку.'],
    ['Ускоритель глубин','Усилить Ластами не менее 4 рыб.'],
    ['Глубокое погружение','Применить Акваланг к рыбе весом не менее 15 кг до усиления.'],
    ['Морская машина','Завершить игру с одновременно активными Маской, Ластами и Аквалангом: Маска должна усилить не менее 5 итоговых рыб, Ласты — не менее 4 рыб, а Акваланг — примениться к рыбе исходным весом от 15 кг.'],
    ['Тройное погружение','Получить не менее 3 Аквалангов за одну игру. Их общий множитель без Штурвала составит ×9, со Штурвалом — ×18.'],
    ['Арсенал рыбака','Получить за одну игру все 5 уникальных бонусов: Подводную маску, Ласты, Акваланг, Счастливый поплавок и Снаряжение дайвера.'],
    ['Переживший бурю','Получить не менее 4 разных дебафов и завершить игру с весом от 100 кг.'],
    ['Возвращение пропажи','Вернуть украденную Чайкой рыбу Посланием в бутылке.'],
    ['Не сегодня, касатка','Нейтрализовать Касатку Плавником мегалодона.'],
    ['Освобождение от пут','После Осьминога получить новый работающий бонус.'],
    ['Последняя надежда','Восстановить Плавником мегалодона не менее 2 последствий дебафов.'],
    ['Коллекционер глубин','Получить не менее 4 разных артефактов.'],
    ['Эпическое путешествие','Получить не менее 3 эпических артефактов.'],
    ['Легендарный рыбак','Получить не менее 2 легендарных артефактов.'],
    ['Капитан Наутилуса','Получить Штурвал при наличии не менее 2 активных бонусов.'],
    ['Дар Левиафана','Поймать не менее 5 рыб после получения Чешуи Левиафана.'],
    ['Власть над океаном','Получить за одну игру эпический и легендарный артефакты.'],
    ['Старые друзья','Встретить Ангуса не менее 2 раз.'],
    ['Щедрость Ангуса','Получить от Ангуса легендарный артефакт.'],
    ['Зов Компаса','Призвать Ангуса повторным Компасом.'],
    ['Наследник рыбака','Получить артефакт от Ангуса и завершить игру с весом не менее 100 кг.'],
    ['Обувной магазин','Выловить полный комплект обуви: рваный башмак, старый кроссовок и резиновый сапог.'],
    ['Ужин чайки','Чайка должна украсть самую тяжёлую на тот момент рыбу с исходным весом не менее 20 кг.'],
    ['Рыба ушла','Поймать рыбу, но завершить игру без рыбы из-за дебафов.'],
    ['Не мой день','Получить хлам 4 раза подряд.'],
    ['Дар Бездны','Превратить не менее 3 единиц хлама в гигантов с помощью Глубоководного нечто — полученного напрямую или призванного Штурвалом Наутилуса.'],
    ['Морской хаос','Получить за сессию бонус, дебаф, эпический и легендарный артефакт.'],
    ['Сквозь вечную тьму','Выжить после 10 раундов в Хранилище вечной тьмы, опустить здоровье Балистьера ниже 50% и получить Пылающее ядро или Ядро бездны.'],
    ['Око за око','Победить Балистьера в Хранилище вечной тьмы и получить Око Балистьера.'],
    ['Карманный танк','Победить Балистьера вместе с союзником Рыба-камень. Вес вынесенного союзника не имеет значения.'],
    ['На последнем дыхании','Достичь 10-го раунда боя с Балистьером, выжить и сохранить не более 50 единиц здоровья.'],
    ['За гранью','Пройти все этапы любого Разлома и вынести добычу с максимальной глубины. Для Сингулярной ямы требуется 4-й этап, для остальных Разломов — 3-й. Спасение защитой на максимальной глубине также учитывается.'],
    ['Призрачное слияние','Выбрать Печать слияния в Призрачном шлейфе, получить легендарную рыбу или гиганта и успешно вынести добычу.'],
    ['На грани имплозии','Извлечь чёрный ящик Батисферы DF‑1 при прочности корпуса не более 20% и успешно вынести добычу.'],
    ['Искажённая реальность','Выбрать Искажённую реальность на третьем этапе Разрыва течений, избежать полного обнуления и успешно вынести добычу.'],
    ['Близнецы сингулярности','Пережить секретный четвёртый этап Сингулярной ямы, получить финальную награду из двух легендарных рыб и успешно вынести их.'],
    ['Откровение Бездны','На третьем этапе Скрытой бездны выбрать Корону откровения или Договор с Пустотой, пережить указанный риск и успешно вынести высшую добычу.'],
    ['Ни капли крови','Пройти все этапы разлома Левиафана, не отдав ему ни одной рыбы в жертву, и успешно вынести добычу.'],
    ['Избранник Врат','Выбрать ведущую руну, успешно подготовить маршрут, затем открыть Врата существа и вынести добычу Обсидианового разлома.'],
    ['Багровый завет','Выбрать Полное насыщение на третьем этапе Багрового разлома, принести третью жертву, пережить риск провала и успешно вынести добычу.']
    ,['Наперекор приливу','Исследовать не менее трёх локаций Острова Разрушительных Приливов, столкнуться с опасностью и завершить экспедицию с Абиссалором.']
    ,['Сигнал среди шторма','Найти Руническую сигнальную ракету на Острове Разрушительных Приливов и использовать её для вызова судна.']
    ,['Последний маршрут','Использовать Карту последнего маршрута на Острове Свинцового Тумана и провести четвёртое исследование за одну экспедицию.']
    ,['Хозяин тумана','Вынести с Острова Свинцового Тумана Древнюю или Первородную резонирующую туманную мурену.']
    ,['Страж признаёт достойного','Использовать Зачарованный идол на Острове Каменных Стражей и полностью предотвратить опасность.']
    ,['Обряд повторного пути','Потратить Церемониальную маску и получить добычу при повторном исследовании посещённой локации Острова Каменных Стражей.']
    ,['Довериться течению','При появлении опасности на Острове Забытых Течений продолжить путь и забрать следующую усиленную награду.']
    ,['Память воды','Вынести Эхоносного ската с Острова Забытых Течений и получить созданный им эхо-улов.']
  ]
};
function openGuide(tab='Погода') {
  $('guideTabs').innerHTML=Object.keys(GUIDE).map(k=>`<button data-tab="${k}" class="${k===tab?'active':''}">${k}</button>`).join('');
  const colorClass={
    'Бонусы':'guide-bonus',
    'Дебафы':'guide-debuff',
    'Эпические':'guide-epic',
    'Легендарные':'guide-legendary',
    'Мифические':'guide-mythic',
    'Достижения':'guide-achievement'
  }[tab]||'';
  const renderItems=(query='')=>{
    const q=query.trim().toLocaleLowerCase('ru-RU');
    const items=GUIDE[tab].filter(([title,text])=>!q||`${title} ${text}`.toLocaleLowerCase('ru-RU').includes(q));
    const cards=items.map(([title,text,extraClass])=>{
      const cleanTitle=String(title).replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu,'').trim();
      const abyssKey=tab==='Абиссальная форма'?({
        'Неизвестная форма':null,
        'Скрытый характер':null,
        'Паразит':'parasite',
        'Хищник':'predator',
        'Симбиот':'symbiote',
        'Расхититель':'raider',
        'Разрушитель':'destroyer',
        'Метаморф':'metamorph'
      })[cleanTitle]:undefined;
      const riftDef=tab==='Разломы'?Object.values(RIFT_TYPES).find(r=>r.name===cleanTitle):null;
      const hasInlineIcon=/<(?:span|img)\b/i.test(cleanTitle);
      const guideIcon=hasInlineIcon?'':
        tab==='Бонусы'?bonusIconMarkup(cleanTitle,'is-guide-icon'):
        tab==='Дебафы'?debuffIconMarkup(cleanTitle,'is-guide-icon'):
        tab==='Эпические'?artifactIconMarkup(cleanTitle,'epic','is-guide-icon'):
        tab==='Легендарные'?artifactIconMarkup(cleanTitle,'legendary','is-guide-icon'):
        tab==='Мифические'?artifactIconMarkup(cleanTitle,'mythic','is-guide-icon'):
        tab==='Абиссальная форма'?abyssalIconMarkup(abyssKey,'is-guide-icon'):
        riftDef?riftRelicIcon(riftDef.relic,'is-guide-icon'):'';
      return `<article class="${extraClass||''}"><h3 class="${colorClass}">${guideIcon?`${guideIcon} `:''}${cleanTitle}</h3><p>${text}</p></article>`;
    }).join('');
    const empty=items.length?'':`<div class="guide-search-empty">Ничего не найдено.</div>`;
    const counter=tab==='Достижения'?`<span class="guide-search-count">Найдено: ${items.length}</span>`:'';
    return `${cards}${empty}${counter}`;
  };
  if(tab==='Достижения') {
    $('guideContent').innerHTML=`<div class="guide-search"><label><input id="achievementSearch" type="search" placeholder="Найти достижение" autocomplete="off" aria-label="Поиск достижения"></label></div><div id="guideResults">${renderItems()}</div>`;
    const input=$('achievementSearch');
    input.addEventListener('input',()=>{$('guideResults').innerHTML=renderItems(input.value);});
  } else {
    $('guideContent').innerHTML=renderItems();
  }
  $('guideTabs').querySelectorAll('button').forEach(b=>b.onclick=()=>openGuide(b.dataset.tab));
  if(!$('guideDialog').open)$('guideDialog').showModal();
}




/* PUBLIC_STRIP_DEBUG_START */
function buildDropfishDebugPanel() {
  const grid=$('dropfishDebugGrid');
  const dialog=$('dropfishDebugDialog');
  const toggle=$('dropfishDebugBtn');
  if(!grid||!dialog||!toggle) return;
  const button=(label,action,cls='')=>`<button type="button" class="${cls}" data-debug-action="${action}">${label}</button>`;
  const debugAssetIcon=(path,label='')=>`<span class="debug-asset-icon"><img src="${path}" alt="" aria-hidden="true" title="${label}" decoding="async"></span>`;
  const categoryIcon=(category)=>{
    const data={
      normal:['normal','Обычная рыба'],
      heavy:['heavy','Тяжеловес'],
      giant:['giant','Рыба-гигант']
    }[category];
    return fishCategoryIcon(data[0],data[1],'is-debug-icon');
  };
  const islandButtonIcon=(island)=>{
    const firstLocation=ISLANDS[island]?.locations?.[0];
    const file=firstLocation&&ISLAND_LOCATION_ICON_FILES[island]?.[firstLocation.id];
    return file?debugAssetIcon(`${ISLAND_LOCATION_ICON_PATH}${file}`,ISLANDS[island].name):fishCategoryIcon('island','Островная добыча','is-debug-icon');
  };
  const groups=[
    ['Погода',Object.entries(DATA.weather).map(([key,value])=>button(`${weatherIconMarkup(key,'is-debug-icon')} ${value.name}`,`weather:${key}`)).join('')],
    ['Улов',[button(`${categoryIcon('normal')} Обычная рыба`,'fish:normal'),button(`${categoryIcon('heavy')} Тяжеловес`,'fish:heavy'),button(`${categoryIcon('giant')} Рыба-гигант`,'fish:giant')].join('')],
    ['Монеты',COIN_TYPES.map(coin=>button(`${coinIconMarkup(coin.key,'is-debug-icon')} ${coin.name}`,`coin:${coin.key}`)).join('')],
    ['Ангус и судно',[button(`${characterIconMarkup('angus','is-debug-icon')} Вызвать Ангуса`,'angus'),button(`${shipIconMarkup('trade','is-debug-icon')} Вызвать торговое судно`,'trade')].join('')],
    ['Бонусы',DATA.bonuses.map(name=>button(`${bonusIconMarkup(name,'is-debug-icon')} ${name}`,`bonus:${encodeURIComponent(name)}`)).join('')],
    ['Дебафы',DATA.debuffs.map(name=>button(`${debuffIconMarkup(name,'is-debug-icon')} ${name}`,`debuff:${encodeURIComponent(name)}`)).join('')],
    ['Эпические',DATA.epics.map(name=>button(`${artifactIconMarkup(name,'epic','is-debug-icon')} ${name}`,`epic:${encodeURIComponent(name)}`)).join('')],
    ['Легендарные',DATA.legendary.map(name=>button(`${artifactIconMarkup(name,'legendary','is-debug-icon')} ${name}`,`legendary:${encodeURIComponent(name)}`)).join('')],
    ['Мифические',DATA.mythic.map(name=>button(`${artifactIconMarkup(name,'mythic','is-debug-icon')} ${name}`,`mythic:${encodeURIComponent(name)}`)).join('')],
    ['Разломы',Object.entries(RIFT_TYPES).map(([key,value])=>button(`${fishCategoryIcon('rift','Разлом','is-debug-icon')} ${value.short}`,`rift:${key}`)).join('')],
    ['Подземелье',[
      button(`${dungeonImg('piranhas-eternal-darkness.webp','Пираньи вечной тьмы','is-debug-icon')} Вызвать пираний`,'dungeon:piranhas'),
      button(`${dungeonImg('loot-ballistier-eye.webp','Око','is-debug-icon')} Выдать Око`,'dungeon:reward:eye'),
      button(`${dungeonImg('loot-burning-core.webp','Ядро','is-debug-icon')} Выдать Пылающее ядро`,'dungeon:reward:flame'),
      button(`${dungeonImg('loot-abyss-core.webp','Ядро','is-debug-icon')} Выдать Ядро бездны`,'dungeon:reward:abyss'),
      button(`${dungeonImg('effect-ballistier-wrath.webp','Гнев','is-debug-icon')} Включить Гнев`,'dungeon:wrath','danger')
    ].join('')],
    ['Острова',[
      button(`${expeditionItemIconMarkup('Тубус неизвестного картографа','is-debug-icon')} Выдать экспедиционный предмет`,'island:item'),
      button(`${expeditionItemIconMarkup('Страница дневника экспедиции','is-debug-icon')} Выдать и расшифровать`,'island:decoded'),
      button(`${islandButtonIcon('destructiveTides')} Остров Приливов`,'island:open'),
      button(`${islandButtonIcon('leadenFog')} Остров Тумана`,'island:fog'),
      button(`${islandButtonIcon('stoneGuardians')} Остров Стражей`,'island:stone'),
      button(`${islandButtonIcon('forgottenCurrents')} Остров Течений`,'island:currents'),
      button(`${islandFishIconMarkup({kind:'colossus',tier:'common',name:'Абиссалор'},'is-debug-icon')} Выдать Абиссалора`,'island:colossus'),
      button(`${islandFishIconMarkup({kind:'moray',tier:'common',name:'Туманная мурена'},'is-debug-icon')} Выдать мурену`,'island:moray'),
      button(`${islandLootIconMarkup({kind:'navigator',name:'Астральный навигатор'},'is-debug-icon')} Выдать навигатор`,'island:navigator'),
      button(`${islandLootIconMarkup({kind:'flare',name:'Руническая сигнальная ракета'},'is-debug-icon')} Выдать ракету`,'island:flare')
    ].join('')],
    ['Абиссальная форма',[
      button(`${abyssalIconMarkup(null,'is-debug-icon')} Поймать форму`,'abyss:catch'),
      ...Object.entries(ABYSSAL_PERSONALITIES).map(([key,value])=>button(`${abyssalIconMarkup(key,'is-debug-icon')} ${value.name}`,`abyss:personality:${key}`)),
      button(`${abyssalIconMarkup(null,'is-debug-icon')} Проявить сейчас`,'abyss:manifest'),
      button(`${trashIconMarkup('is-debug-icon')} Сбросить форму`,'abyss:reset','danger')
    ].join('')],
    ['Сессия',[
      button(`${uiIconMarkup('fishingRod','is-debug-icon')} +1 заброс`,'casts:+1'),
      button(`${uiIconMarkup('fishingRod','is-debug-icon')} Остался 1 заброс`,'casts:1'),
      button(`${uiIconMarkup('menu','is-debug-icon')} Завершить сессию`,'finish','danger'),
      button(`${uiIconMarkup('debug','is-debug-icon')} Новая тестовая сессия`,'reset')
    ].join('')]
  ];
  grid.innerHTML=groups.map(([title,actions])=>`<section class="debug-group"><h3>${title}</h3><div class="debug-actions">${actions}</div></section>`).join('');
  toggle.addEventListener('click',()=>dialog.showModal());
  grid.addEventListener('click',event=>{
    const target=event.target.closest('[data-debug-action]');
    if(!target) return;
    const action=target.dataset.debugAction;
    if(action.startsWith('weather:')){
      const key=action.slice(8); state.weather=key; if(!state.weatherSeen.includes(key)) state.weatherSeen.push(key); if(key==='storm') state.stormSeen=true; showWeatherTransition(key);
    } else if(action.startsWith('fish:')){
      const category=action.slice(5); makeFish(category,'Тестовая панель',true);
    } else if(action.startsWith('coin:')){
      processCoinCatch(action.slice(5));
    } else if(action==='angus') encounterAngus(false);
    else if(action==='trade'){
      state.tradeShipChecked=true; state.tradeShipCompleted=false; if(!state.tradeShipArrived) beginTradeShip(); else openTradeDialog();
    } else if(action.startsWith('bonus:')){
      const name=decodeURIComponent(action.slice(6)); state.bonusArtifactCount++; state.sessionCategories.bonus=true; grantBonus(name,'Выдано через тестовую панель');
    } else if(action.startsWith('debuff:')) processDebuff(decodeURIComponent(action.slice(7)));
    else if(action.startsWith('epic:')) processEpic(decodeURIComponent(action.slice(5)));
    else if(action.startsWith('legendary:')) processLegendary(decodeURIComponent(action.slice(10)));
    else if(action.startsWith('mythic:')) processMythic(decodeURIComponent(action.slice(7)),'Тестовая панель');
    else if(action.startsWith('rift:')){dialog.close();makeRift(action.slice(5),true);}
    else if(action==='dungeon:piranhas'){ensureDungeon();state.dungeon.encounter=null;const row=addHistory('Пираньи вечной тьмы','dungeon','(Тестовый вызов • жертву можно выбрать позже)',{numbered:false,dungeonAction:'sacrifice'});state.dungeon.encounter={id:uid(),phase:'piranhas',historyRowId:row.id,castsUsed:0,sacrifice:null,cleanWeight:null,weapon:null,ally:null,playerHp:BALANCE.dungeon.playerHealth,bossHp:BALANCE.dungeon.bossHealth,round:0,log:[],speed:1};dialog.close();}
    else if(action.startsWith('dungeon:reward:')){grantDungeonReward(action.slice('dungeon:reward:'.length));}
    else if(action==='dungeon:wrath'){ensureDungeon();state.dungeon.wrath=true;state.fish.filter(f=>!f.removed).forEach(f=>f.smoldering=true);}
    else if(action==='island:item')maybeFindExpeditionItem('Тестовая панель',true);
    else if(action==='island:decoded'){dialog.close();const item=maybeFindExpeditionItem('Тестовая панель',true);decodeExpeditionItem(item.id,true);}
    else if(action==='island:open'){const expedition={id:uid(),island:'destructiveTides',status:'available',itemId:null};state.islands.expeditions.push(expedition);dialog.close();startIslandExpedition(expedition.id);}
    else if(action==='island:fog'){const expedition={id:uid(),island:'leadenFog',status:'available',itemId:null};state.islands.expeditions.push(expedition);dialog.close();startIslandExpedition(expedition.id);}
    else if(action==='island:stone'){const expedition={id:uid(),island:'stoneGuardians',status:'available',itemId:null};state.islands.expeditions.push(expedition);dialog.close();startIslandExpedition(expedition.id);}
    else if(action==='island:currents'){const expedition={id:uid(),island:'forgottenCurrents',status:'available',itemId:null};state.islands.expeditions.push(expedition);dialog.close();startIslandExpedition(expedition.id);}
    else if(action==='island:colossus'){const a={id:uid(),island:'destructiveTides',loot:[{id:uid(),kind:'colossus',tier:'common',name:'Абиссалор',icon:'🐋',weight:rand1(100,200)}],visited:[],compassProtected:false},row=addHistory('Тестовая экспедиция завершена: Остров Разрушительных Приливов','island','(<span class="island-negative-hint">Получен исполин: применено «Нестабильное присутствие»</span>)',{numbered:false});commitIslandLoot(a,row.id);}
    else if(action==='island:moray'){const row=addHistory('Тест: найдена резонирующая туманная мурена','island','',{numbered:false});commitIslandLoot({id:uid(),island:'leadenFog',loot:[rollMoray('common')],visited:[],compassProtected:false},row.id);}
    else if(action==='island:navigator'){const row=addHistory('Тест: получен Астральный навигатор','island','(Можно применить только к следующей пойманной рыбе)',{numbered:false});state.islands.navigators.push({id:uid(),islandUsed:false,mainlandUsed:false,historyRowId:row.id});}
    else if(action==='island:flare'){state.islands.flares++;state.islands.flareFinishResolved=false;toast('Руническая ракета добавлена');}
    else if(action==='abyss:catch'){if(!abyssalEntity())catchAbyssalLife('cast');else toast('Форма жизни уже присутствует');}
    else if(action.startsWith('abyss:personality:')){const key=action.slice('abyss:personality:'.length);state.abyssal.entity=null;const entity=catchAbyssalLife('cast',key);entity.status='retained';entity.delayLeft=1;const row=state.history.find(h=>h.id===entity.rowId);if(row){row.abyssDecision=false;row.abyssKept=true;row.detail='(Тест: форма оставлена • характер скрыт до проявления)';}}
    else if(action==='abyss:manifest'){if(hasRetainedAbyssal())performAbyssalManifestation(true);else toast('Сначала оставьте форму жизни');}
    else if(action==='abyss:reset'){state.abyssal.entity=null;toast('Тестовое состояние формы сброшено');}
    else if(action==='casts:+1') state.castsLeft++;
    else if(action==='casts:1'){state.castsLeft=1;state.finished=false;}
    else if(action==='finish'){
      state.castsLeft=0; state.tradeShipChecked=true; state.tradeShipCompleted=true; if(!state.finished) maybeFinalizeSession();
    } else if(action==='reset'){
      removeArcadeCreature(activeArcadeFish); state=initialState(); state.weatherSeen=[state.weather]; if(state.weather==='storm') state.stormSeen=true; localStorage.removeItem(TEST_SESSION_KEY);
    }
    render(); saveDailyState();
  });
}


buildDropfishDebugPanel();
{const preview=new URLSearchParams(location.search).get('dungeonPreview');if(['splash','weapon','weaponLoot','ally','allyLoot','boss','battle'].includes(preview)){ensureDungeon();state.dungeon.encounter={id:uid(),phase:preview,historyRowId:null,castsUsed:0,sacrifice:{id:'preview',name:'карпиодес',weight:7.6,originalWeight:7.6},cleanWeight:76,weapon:['weaponLoot','ally','allyLoot','boss','battle'].includes(preview)?'sword':null,weaponSlot:1,ally:['allyLoot','boss','battle'].includes(preview)?'eel':null,allySlot:2,playerHp:246,bossHp:1840,round:6,log:[],speed:1,bossAttacks:5,battleToken:uid()};if(preview==='battle'){battleLog(state.dungeon.encounter,'player','Игрок: −180 (крит)','boss','−180');}setTimeout(renderDungeon,0);}}
/* PUBLIC_STRIP_DEBUG_END */
$('castBtn').addEventListener('click',castLine);
$('historyList').addEventListener('click',event=>{
  const dungeonDebuff=event.target.closest('[data-dungeon-debuff]');if(dungeonDebuff){resolveDungeonDebuffPrediction(dungeonDebuff.dataset.historyRow,dungeonDebuff.dataset.dungeonDebuff==='accept');return;}
  if(event.target.closest('[data-dungeon-sacrifice]')){openDungeonSacrifice();return;}
  if(event.target.closest('[data-dungeon-dive]')){beginDungeonDive();return;}
  const navigator=event.target.closest('[data-navigator-lock]');if(navigator){activateAstralNavigator(navigator.dataset.navigatorLock,navigator.dataset.navigatorFish);return;}
  const study=event.target.closest('[data-expedition-study]');if(study){decodeExpeditionItem(study.dataset.expeditionStudy);return;}
  const go=event.target.closest('[data-expedition-go]');if(go){startIslandExpedition(go.dataset.expeditionGo);return;}
  const abyssButton=event.target.closest('[data-abyss-decision]');
  if(abyssButton){resolveAbyssalDecision(abyssButton.dataset.abyssDecision==='keep');return;}
  const coinButton=event.target.closest('.coin-luck-btn[data-coin-id]');
  if (coinButton) useCoin(coinButton.dataset.coinId);
  const tradeButton=event.target.closest('[data-open-trade]');
  if (tradeButton) openTradeDialog();
});
$('resultCard').addEventListener('click',event=>{
  const toggle=event.target.closest('.result-achievements-toggle');
  if(!toggle)return;
  const expanded=toggle.getAttribute('aria-expanded')==='true';
  $('resultCard').dataset.expanded=String(!expanded);
  renderResultCard();
  scrollResultCardAfterToggle(!expanded);
});
$('effectsList').addEventListener('click',event=>{const dungeonReward=event.target.closest('[data-dungeon-reward]');if(dungeonReward){useDungeonAbyssCore(dungeonReward.dataset.dungeonReward);return;}if(event.target.closest('[data-island-flare]')){useRunicFlare();return;}const islandItem=event.target.closest('[data-island-item-use]');if(islandItem){if(islandItem.dataset.islandItemUse==='moonTideShell')useMoonTideShell();else if(islandItem.dataset.islandItemUse==='firstWaterFlask')useFirstWaterFlask();return;}const mythic=event.target.closest('[data-mythic-use]');if(mythic){useStormEye(mythic.dataset.mythicUse);return;}const button=event.target.closest('[data-rift-relic]');if(button)useRiftRelic(button.dataset.riftRelic);});
$('effectsList').addEventListener('wheel',event=>{
  const list=event.currentTarget;
  if(list.scrollWidth<=list.clientWidth||Math.abs(event.deltaX)>=Math.abs(event.deltaY))return;
  event.preventDefault();
  list.scrollLeft+=event.deltaY;
},{passive:false});
$('riftLeaveBtn').addEventListener('click',()=>{const r=state.rifts?.active;if(!r)return;r.status==='offer'?declineRift():exitRift();});
$('riftContinueBtn').addEventListener('click',continueRift);
$('islandLocations').addEventListener('click',event=>{const button=event.target.closest('[data-island-location]');if(button)chooseIslandLocation(button.dataset.islandLocation);});
$('islandContinueBtn').addEventListener('click',continueIsland);
$('islandLeaveBtn').addEventListener('click',requestLeaveIsland);
$('islandDialog').addEventListener('cancel',event=>event.preventDefault());
$('dungeonDialog').addEventListener('cancel',event=>event.preventDefault());
$('tradeOffers').addEventListener('click',event=>{
  const colossusButton=event.target.closest('[data-trade-colossus]');if(colossusButton){exchangeIslandColossus(colossusButton.dataset.tradeColossus);return;}
  const threadButton=event.target.closest('[data-trade-thread]');if(threadButton){exchangeSiphonophoreThread(threadButton.dataset.tradeThread);return;}
  const coinButton=event.target.closest('[data-trade-coin]');if(coinButton){exchangeFinalCastCoin(coinButton.dataset.tradeCoin);return;}
  const button=event.target.closest('[data-trade-key]');if(button)exchangeTradeItem(button.dataset.tradeKey);
});
$('tradeAllBtn').addEventListener('click',()=>state.tradeShipSource==='recyclon'?recycleAllTrash():exchangeAllTradeItems());
$('tradeFinishBtn').addEventListener('click',completeTradeShip);
$('motionBtn').addEventListener('click',()=>{playSound('motion');reduceMotion=!reduceMotion;localStorage.setItem(MOTION_KEY,reduceMotion?'1':'0');applyMotionPreference();toast(reduceMotion?'Анимации уменьшены • аркадный режим доступен':'Полные анимации включены • аркадный режим доступен');});
$('restartBtn').addEventListener('click',()=>{if(!BUILD_CONFIG.unlimitedSessions&&state.sessionDate){toast('Доступна только одна игровая сессия в сутки');return;}removeArcadeCreature(activeArcadeFish);state=initialState();state.weatherSeen=[state.weather];if(state.weather==='storm')state.stormSeen=true;if(BUILD_CONFIG.unlimitedSessions)localStorage.removeItem(TEST_SESSION_KEY);render();toast('Началась новая игровая сессия');});
$('guideBtn').addEventListener('click',()=>{playSound('guide');openGuide();});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
$('guideDialog').addEventListener('click',e=>{if(e.target===$('guideDialog'))$('guideDialog').close();});
applyMotionPreference();
render();
if(state.tradeShipArrived&&!state.tradeShipCompleted&&!hasTradeShipChoices())completeTradeShip();
if(state.rifts?.active)renderRift();
if(state.islands?.active){renderIsland();$('islandDialog').showModal();startIslandAmbient();}
if(state.dungeon?.encounter&&!['piranhas','trail'].includes(state.dungeon.encounter.phase)){renderDungeon();if(state.dungeon.encounter.phase==='battle'){state.dungeon.encounter.battleToken=uid();setTimeout(()=>runDungeonRound(state.dungeon?.encounter?.battleToken),500);}}


scheduleFishShadow();
