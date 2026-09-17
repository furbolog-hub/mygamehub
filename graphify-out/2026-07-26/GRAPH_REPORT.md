# Graph Report - C:\Users\ss\Desktop\DropFish-Rifts-v1.90  (2026-07-26)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 399 nodes · 1596 edges · 21 communities (16 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- pick
- renderHistory
- script.js
- commitState
- buildDropfishDebugPanel
- round1
- metamorphBaseActions
- useRiftRelic
- renderRift
- riftRelicIcon
- islandLootIconMarkup
- catchArcadeCreature
- triggerHeaderPresence
- runRiftStage
- viewport-fit.js
- abyssalPersonalityKey
- animateCast
- useStormEye
- scheduleFishShadow

## God Nodes (most connected - your core abstractions)
1. `renderHistory()` - 87 edges
2. `kg()` - 52 edges
3. `pick()` - 48 edges
4. `buildDropfishDebugPanel()` - 45 edges
5. `capitalize()` - 42 edges
6. `chance()` - 41 edges
7. `addHistory()` - 39 edges
8. `renderEmbeddedFishList()` - 39 edges
9. `makeFish()` - 39 edges
10. `castLine()` - 37 edges

## Surprising Connections (you probably didn't know these)
- `performAbyssalManifestation()` --indirect_call--> `parasiteAction()`  [INFERRED]
  script.js → script.js  _Bridges community 6 → community 4_
- `showChoice()` --indirect_call--> `resolveFadedRelicFragment()`  [INFERRED]
  script.js → script.js  _Bridges community 0 → community 3_
- `renderHistory()` --indirect_call--> `initRiftFuzzyTitles()`  [INFERRED]
  script.js → script.js  _Bridges community 12 → community 1_
- `beginTradeShip()` --calls--> `playSound()`  [EXTRACTED]
  script.js → script.js  _Bridges community 0 → community 4_
- `processDebuff()` --calls--> `playSound()`  [EXTRACTED]
  script.js → script.js  _Bridges community 0 → community 5_

## Import Cycles
- None detected.

## Communities (21 total, 5 thin omitted)

### Community 0 - "pick"
Cohesion: 0.09
Nodes (75): ABYSSAL_WEATHERS, activateDeepThing(), activateMegalodon(), activeDebuff(), activeMythics(), addFishHistory(), addHistory(), addRiftRelic() (+67 more)

### Community 1 - "renderHistory"
Cohesion: 0.09
Nodes (70): abyssChangeTargetType(), abyssFishLabel(), abyssObjectsForHistoryRow(), artifactIconMarkup(), bonusIconMarkup(), capitalize(), coinIconMarkup(), compactIslandOriginText() (+62 more)

### Community 2 - "script.js"
Cohesion: 0.03
Nodes (55): ABYSSAL_ICON_FILES, ABYSSAL_PERSONALITIES, abyssalPulseMarkup(), ARTIFACT_ICON_FILES, artifactCategoryBadge(), availableTradeItemsForKey(), BALANCE, BONUS_ICON_FILES (+47 more)

### Community 3 - "commitState"
Cohesion: 0.10
Nodes (43): availableExpeditions(), availableIslandNavigator(), chooseIslandLocation(), chooseOwnedFish(), commitState(), continueIsland(), createRecyclonFish(), decodeExpeditionItem() (+35 more)

### Community 4 - "buildDropfishDebugPanel"
Cohesion: 0.14
Nodes (31): abyssalEntity(), abyssalIconMarkup(), artifactVisualName(), beginTradeShip(), buildDropfishDebugPanel(), catchAbyssalLife(), completeTradeShip(), consumeRiftFishEffects() (+23 more)

### Community 5 - "round1"
Cohesion: 0.12
Nodes (26): achievements(), activeBonuses(), activeEnhancedDiver(), availableRiftRelic(), categoryForWeight(), consumeProtection(), diverBlocks(), enforceOrca() (+18 more)

### Community 6 - "metamorphBaseActions"
Cohesion: 0.17
Nodes (25): abyssPercent(), abyssSample(), availableAbyssFish(), availableAbyssTrash(), availableTradeItems(), changeAbyssFishWeight(), changeWeatherRandomly(), createAbyssCoin() (+17 more)

### Community 7 - "useRiftRelic"
Cohesion: 0.16
Nodes (16): chooseCoinType(), chooseDebuff(), isNaturalHeavy(), isOrdinaryFish(), isRiftFish(), isRiftRare(), markRelicUsed(), randomRiftFish() (+8 more)

### Community 8 - "renderRift"
Cohesion: 0.18
Nodes (15): availableSacrificeFish(), declineRift(), failRift(), renderRift(), resolveRiftHistory(), riftChoiceButton(), riftGaugeText(), riftHistoryRow() (+7 more)

### Community 9 - "riftRelicIcon"
Cohesion: 0.48
Nodes (7): renderRiftLootResults(), riftLootCategoryIcons(), riftLootEffectIcon(), riftLootText(), riftRelicIcon(), riftTemporaryEffectIconMarkup(), riftTradeLootIcon()

### Community 10 - "islandLootIconMarkup"
Cohesion: 0.40
Nodes (5): activateAstralNavigator(), eligibleNavigatorForFish(), islandLootIconMarkup(), renderNavigatorAction(), tradeItemByKey()

### Community 11 - "catchArcadeCreature"
Cohesion: 0.50
Nodes (5): catchArcadeCreature(), chooseArcadeFishCategory(), removeArcadeCreature(), showArcadeCatchStatus(), spawnArcadeCreature()

### Community 12 - "triggerHeaderPresence"
Cohesion: 0.50
Nodes (4): applyMotionPreference(), initRiftFuzzyTitles(), scheduleHeaderPresence(), triggerHeaderPresence()

### Community 13 - "runRiftStage"
Cohesion: 0.67
Nodes (4): beginRift(), continueRift(), runRiftStage(), startRiftAmbient()

## Knowledge Gaps
- **40 isolated node(s):** `isRealTelegramContext`, `SOUND_PATHS`, `sounds`, `ISLAND_AMBIENT_SOUNDS`, `storedMotionPreference` (+35 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `renderHistory()` connect `renderHistory` to `pick`, `script.js`, `commitState`, `buildDropfishDebugPanel`, `round1`, `renderRift`, `riftRelicIcon`, `islandLootIconMarkup`, `triggerHeaderPresence`, `abyssalPersonalityKey`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `kg()` connect `renderHistory` to `pick`, `script.js`, `commitState`, `buildDropfishDebugPanel`, `round1`, `metamorphBaseActions`, `useRiftRelic`, `renderRift`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `pick()` connect `pick` to `script.js`, `commitState`, `buildDropfishDebugPanel`, `round1`, `metamorphBaseActions`, `useRiftRelic`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `isRealTelegramContext`, `SOUND_PATHS`, `sounds` to the rest of the system?**
  _40 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `pick` be split into smaller, more focused modules?**
  _Cohesion score 0.08828828828828829 - nodes in this community are weakly interconnected._
- **Should `renderHistory` be split into smaller, more focused modules?**
  _Cohesion score 0.09026915113871635 - nodes in this community are weakly interconnected._
- **Should `script.js` be split into smaller, more focused modules?**
  _Cohesion score 0.03333333333333333 - nodes in this community are weakly interconnected._