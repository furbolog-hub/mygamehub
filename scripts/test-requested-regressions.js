const fs=require('fs');
const path=require('path');

const source=fs.readFileSync(path.resolve(__dirname,'../dropfish/script.js'),'utf8');
const style=fs.readFileSync(path.resolve(__dirname,'../dropfish/style.css'),'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const between=(start,end)=>{
  const from=source.indexOf(start),to=source.indexOf(end,from+start.length);
  assert(from>=0&&to>from,`Missing section: ${start} ... ${end}`);
  return source.slice(from,to);
};

const leviathan=between('function applyLeviathanScale','function makeFish');
assert(/leviathanFishCount\+\+/.test(leviathan),'Leviathan progression is not centralized');
assert(/fish\.leviathanImpact=/.test(leviathan),'Leviathan impact metadata is missing');
assert(/applyLeviathanScale\(f\)/.test(between('function makeFish','function processTrash')),'Normal/rift fish bypass Leviathan scale');
assert(/slice\(leviWrathFishStart\)\.forEach\(applyLeviathanScale\)/.test(between('function commitIslandLoot','function finishIslandExpedition')),'Island fish bypass Leviathan scale');
assert(/applyLeviathanScale\(fish\)/.test(between('function grantDungeonAlly','function resolveDungeonBattle')),'Dungeon allies bypass Leviathan scale');
assert(/allyReward=\{fishId:fish\.id,name:ally\.name,weight:fish\.weight/.test(between('function grantDungeonAlly','function resolveDungeonBattle')),'Dungeon result does not show the ally weight after Leviathan scale');

const allyRoll=between('function rollDungeonAllyWeight','function grantDungeonAlly');
assert(!/rare:\[1,9\.9\]/.test(allyRoll),'Dungeon allies can still roll below heavyweight');
assert(/rare:\[10,19\.9\]/.test(allyRoll),'Dungeon ally minimum weight guard is missing');

const trade=between('function createTradeFish','function exchangeFinalCastCoin');
assert(/ISLAND_TRADE_KEYS\.has\(item\.key\)/.test(trade),'Island exchange doubling is missing');
assert(/!\['moonTideShell','firstWaterFlask'\]\.includes\(item\.key\)/.test(trade),'Moon shell or first-water flask is not protected from the new exchange rule');
assert(/categories\.push\(categories\[0\]\)/.test(trade),'Island exchange does not create the second fish');

const df1=between('df1(r,d)','currents(r,d)');
assert(/!r\.loot\.some\(item=>item\.kind==='relic'&&item\.name==='Ядро DF1'\)/.test(df1),'DF1 can still award a duplicate core');

assert(/crystalReplaced=true/.test(source),'Crystal replacement state is missing');
assert(!/setFishHistoryEaten\(f,true\);addHistory\('Кристалл расслоения/.test(source),'Crystal replacement is still marked as eaten');
assert(/crystal-replaced-status/.test(source)&&/\.crystal-replaced-status/.test(style),'Compact crystal replacement badge is missing');
assert(!/history-fish-catch-text[^`]*\$\{fishSizeMarker\(fish\)\}/.test(source),'Duplicate size-category icon remains in fish title');
assert(/history-fish-catch-text[^`]*\$\{fishInlineStatusIcon\(h,fish\)\}/.test(source),'Cast and arcade source icons are missing from fish title');
const inlineStatus=between('function fishInlineStatusIcon','function fishSkeletonMainIcon');
assert(/dedicatedRiftFish\|\|islandFishKind\(fish\)/.test(inlineStatus),'Dedicated rift or island fish can still receive ordinary fish icons');
assert(/normal:\{file:'cast-catch'/.test(inlineStatus),'Normal cast does not use the normal fish icon');
assert(/heavy:\{file:'heavyweight'/.test(inlineStatus),'Heavy cast does not use the heavyweight fish icon');
assert(/giant:\{file:'giant'/.test(inlineStatus),'Giant cast does not use the giant fish icon');
assert(/arcade\?\{file:'arcade-catch'/.test(inlineStatus),'Arcade catches do not replace the category fish icon with the arcade icon');
const sizeMarker=between('function fishSizeMarker','function fishCategoryIcons');
assert(/dedicatedRiftFish\|\|islandFishKind\(fish\)/.test(sizeMarker),'Dedicated rift or island fish can still receive heavyweight/giant size markers');
const embeddedFish=between('function renderEmbeddedFishList','function renderIslandLootResults');
assert(/inlineAngusCategoryIcon=row\.type==='angus'[^;]+\?fishSizeMarker\(fish\):''/.test(embeddedFish),'Angus fish does not show its heavyweight/giant status icon');
assert(!/fishInlineStatusIcon\(/.test(embeddedFish),'Embedded fish still duplicates the category icon with a cast marker');
assert(!/suppressOrdinarySourceIcon:row\.type==='rift'/.test(embeddedFish),'Ordinary rift loot category icon is suppressed after its title');
const unstableRift=between("unstable(r,d)","leviathan(r,d)");
assert(!/[⚓🪞👁🔹⚡👑⚫]/u.test(unstableRift),'Emoji placeholders remain in unstable-rift choice buttons');
const arcadeCategory=between('function chooseArcadeFishCategory','function maybeScheduleArcadeAfterCast');
assert(/roll<0\.85\) return 'normal'/.test(arcadeCategory),'Arcade normal-fish chance is not 85%');
assert(/roll<0\.95\) return 'heavy'/.test(arcadeCategory),'Arcade heavyweight chance is not 10%');
assert(/return 'giant'/.test(arcadeCategory),'Arcade giant chance is not the remaining 5%');
const arcadeSpawn=between('function spawnArcadeCreature','function removeArcadeCreature');
assert(/const isOrca=chance\(ARCADE_ORCA_CHANCE\)/.test(arcadeSpawn),'Arcade Orca chance was changed or bypassed');
assert(/effectMarkup\(dungeonImg\(config\.piranhaFile,config\.piranhas,'is-effect-icon',config\.assetPath\),config\.piranhas\)/.test(source),'Piranha active effect contains extra status text');
assert(!/категории «\$\{castFish\.category\}»/.test(source),'Echo-ray history leaks an internal category key');
assert(/\.rift-actions \.primary-btn,\.rift-actions \.secondary-btn \{[\s\S]*?backdrop-filter:blur\(4px\)/.test(style),'Rift action buttons do not share the translucent treatment');

const abyssWeight=between('function changeAbyssFishWeight','function transformAbyssFish');
assert(/ensureChanged&&after===before/.test(abyssWeight),'Abyssal weight changes can still round back to their original value');
const abyssTransform=between('function transformAbyssFish','function neutralizeRandomDebuff');
const abyssImpacts=between('function renderAbyssFishImpacts','function renderEssenceImpact');
assert(/const FISH_CATEGORY_LABELS=Object\.freeze\(\{normal:'обычная рыба',heavy:'тяжеловес',giant:'рыба-гигант'\}\)/.test(source),'Fish category labels are not centralized for user-facing text');
assert(/fish\.tags\.push\(`\$\{source\}: \$\{fishCategoryLabel\(beforeCategory\)\} → \$\{fishCategoryLabel\(category\)\}`\)/.test(abyssTransform),'Abyss transformation tags can leak internal category keys');
assert(/map\(localizeFishCategoryTransition\)/.test(embeddedFish),'Legacy history tags with internal category keys are not localized');
assert(/fish\.tags\.map\(localizeFishCategoryTransition\)/.test(between('function renderTransmutation','function renderNautilusSummon')),'Legacy transmutation tags with internal category keys are not localized');
assert(/historyDetailText=localizeFishCategoryTransition\(historyDetailText\)/.test(source),'Legacy saved history details with internal category keys are not localized');
assert(/const weightDelta=Number\(impact\.after\)-Number\(impact\.before\)/.test(abyssImpacts)&&/weightDelta<-\.05\?'negative':weightDelta>\.05\?'positive':'neutral'/.test(abyssImpacts),'Abyss impact color is not based on the actual weight delta');
assert(!/\|\|impact\.(?:beforeCategory|afterCategory)/.test(abyssImpacts),'Abyss impact category fallback can leak an internal key');
assert(/changeAbyssFishWeight\(f,rand\(\.6,1\.4\),'Метаморф',true\)/.test(source),'Metamorph does not require a visible weight change');
assert(/changeAbyssFishWeight\(f,rand\(\.6,1\.4\),[^,]+,true\)/.test(between('function destroyerAction','function metamorphBaseActions')),'Destroyer does not require a visible weight change');
assert(/if\(fish\.weight===before\)fish\.weight=round1\(before\+\.1\)/.test(source),'Singula can still display an unchanged fish weight after its 30% bonus');
assert(/crimson-shard\.webp/.test(source),'Crimson shard still lacks its own icon');
const riftLootIcons=between('function riftLootCategoryIcons','function fishRarityBadge');
assert(!/fishCategoryIcon\('rift'/.test(riftLootIcons),'Rift loot still repeats the rift-origin icon inside the rift interface');
assert(/noActionHint:a\.name===/.test(source),'Storm Eye active effect still renders the clipped action hint');
const expeditionDecode=between('function decodeExpeditionItem','function islandLootPurposeMarkup');
assert(/if\(state\.castsLeft<=0\)maybeFinalizeSession\(\)/.test(expeditionDecode),'A failed final-cast expedition study does not resume session finalization');
const finalization=between('function maybeFinalizeSession','function finishGame');
assert(/if\(hasPendingExpeditionStudy\(\)\)return/.test(finalization),'Session finalization does not wait for pending expedition-item study');

process.stdout.write('PASS: requested gameplay and compact-history regressions are guarded\n');
