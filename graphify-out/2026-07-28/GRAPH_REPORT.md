# Graph Report - DropFish-Rifts-v1.90  (2026-07-28)

## Corpus Check
- 39 files · ~1,055,235 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 678 nodes · 2129 edges · 52 communities (40 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7a4a689d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
- renderRift
- useStormEye
- scheduleFishShadow
- ui-enhancements.js
- .play
- Q: Я подключил graphify чтобы ты мог ориентироваться по карте связей. папка в корне проекта лежит. Видишь ее? Сможешь работать с ней чтобы не читать каждый раз код с нуля.
- selectSacrifice
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- AGENTS.md
- README.md
- CLAUDE.md
- extraction-spec.md
- README-TRADE-SHIP.md
- Q: Где реализована хронология, добавление Ангуса вместе с рыбой или артефактом и автоматическая высота строки рыбы?
- runRiftStage
- fishTitleText
- abyssalPersonalityKey
- currentWeights
- useStormEye
- catchArcadeCreature
- activateAstralNavigator
- showWeatherTransition
- islandLootOrigin
- triggerHeaderPresence
- currentWeights
- hasBonus
- islandLootOrigin
- scheduleFishShadow
- maybeTriggerDebuffEvent
- scheduleFishShadow

## God Nodes (most connected - your core abstractions)
1. `renderHistory()` - 88 edges
2. `kg()` - 50 edges
3. `pick()` - 48 edges
4. `buildDropfishDebugPanel()` - 45 edges
5. `chance()` - 41 edges
6. `capitalize()` - 40 edges
7. `renderEmbeddedFishList()` - 39 edges
8. `makeFish()` - 39 edges
9. `addHistory()` - 38 edges
10. `castLine()` - 37 edges

## Surprising Connections (you probably didn't know these)
- `useRiftRelic()` --indirect_call--> `isNaturalHeavy()`  [INFERRED]
  dropfish/script.js → dropfish/script.js  _Bridges community 17 → community 2_
- `renderHistory()` --indirect_call--> `initRiftFuzzyTitles()`  [INFERRED]
  dropfish/script.js → dropfish/script.js  _Bridges community 29 → community 3_
- `commitIslandLoot()` --calls--> `playSound()`  [EXTRACTED]
  dropfish/script.js → dropfish/script.js  _Bridges community 0 → community 2_
- `finishGame()` --calls--> `playSound()`  [EXTRACTED]
  dropfish/script.js → dropfish/script.js  _Bridges community 0 → community 6_
- `resolveIslandLocationResult()` --calls--> `playSound()`  [EXTRACTED]
  dropfish/script.js → dropfish/script.js  _Bridges community 0 → community 7_

## Import Cycles
- None detected.

## Communities (52 total, 12 thin omitted)

### Community 0 - "pick"
Cohesion: 0.07
Nodes (111): abyssalEntity(), activateAstralNavigator(), activateDeepThing(), activeMythics(), addHistory(), addIslandFeat(), addRiftRelic(), advanceAbyssalAfterCast() (+103 more)

### Community 1 - "renderHistory"
Cohesion: 0.07
Nodes (101): activateBomb(), activateChest(), activateDefenderIfPresent(), activeBombsForDefender(), activeItem(), addHarvest(), addInventory(), appendMoleSummons() (+93 more)

### Community 2 - "script.js"
Cohesion: 0.07
Nodes (68): abyssFishLabel(), abyssPercent(), abyssSample(), activateMegalodon(), activeDebuff(), addFishHistory(), attachFishToHistoryRow(), availableAbyssFish() (+60 more)

### Community 3 - "commitState"
Cohesion: 0.09
Nodes (57): abyssalPulseMarkup(), artifactCategoryBadge(), artifactIconMarkup(), bonusCategoryBadge(), bonusIconMarkup(), compactFishHistoryDetail(), compactIslandOriginText(), debuffCategoryBadge() (+49 more)

### Community 4 - "buildDropfishDebugPanel"
Cohesion: 0.04
Nodes (44): ABYSSAL_ICON_FILES, ABYSSAL_PERSONALITIES, ABYSSAL_WEATHERS, ARTIFACT_ICON_FILES, availableTradeItemsForKey(), BALANCE, BONUS_ICON_FILES, BUILD_CONFIG (+36 more)

### Community 5 - "round1"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 6 - "metamorphBaseActions"
Cohesion: 0.13
Nodes (19): achievements(), activeBonuses(), activeEnhancedDiver(), artifactVisualName(), completeTradeShip(), diverBlocks(), expeditionItemIconMarkup(), expireUnusedCoins() (+11 more)

### Community 7 - "useRiftRelic"
Cohesion: 0.17
Nodes (19): availableIslandNavigator(), chooseIslandLocation(), exploreIslandLocation(), exploreIslandMaskRepeat(), islandDangerChance(), islandLocationIconMarkup(), islandLocationOutcome(), islandLootHistoryLabel() (+11 more)

### Community 8 - "renderRift"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Как реализован Обсидиановый ключ для всех автоматических смен погоды?, Source Nodes

### Community 9 - "riftRelicIcon"
Cohesion: 0.16
Nodes (18): abyssChangeTargetType(), abyssObjectsForHistoryRow(), coinIconMarkup(), debuffIconMarkup(), debuffNameForText(), eligibleNavigatorForFish(), islandLootIconMarkup(), renderAbyssChangeResult() (+10 more)

### Community 10 - "islandLootIconMarkup"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Применить рекомендованный набор из восьми островных достижений., Source Nodes

### Community 11 - "catchArcadeCreature"
Cohesion: 0.11
Nodes (17): Абиссальная форма жизни, Активные эффекты, Важно: подготовить технические шильдики, Дополнения от 24 июля 2026, Общий принцип, Обязательная сквозная проверка иконок, Обязательный стандарт компоновки строк, Отменённые расчёты бонусов (+9 more)

### Community 12 - "triggerHeaderPresence"
Cohesion: 0.16
Nodes (17): availableSacrificeFish(), beginRift(), continueRift(), declineRift(), failRift(), renderRift(), resolveRiftHistory(), riftChoiceButton() (+9 more)

### Community 13 - "runRiftStage"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 14 - "viewport-fit.js"
Cohesion: 0.33
Nodes (9): abyssalIconMarkup(), openGuide(), renderRiftLootResults(), riftLootCategoryIcons(), riftLootEffectIcon(), riftLootText(), riftRelicIcon(), riftTemporaryEffectIconMarkup() (+1 more)

### Community 15 - "abyssalPersonalityKey"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 16 - "renderRift"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Где добавить Рециклон во вкладку торговых судов и убрать emoji-заглушки справочника?, Source Nodes

### Community 17 - "useStormEye"
Cohesion: 0.29
Nodes (7): isNaturalHeavy(), isOrdinaryFish(), isRiftFish(), isRiftRare(), riftSacrificeQuality(), setFishHistorySacrificed(), takeSacrifice()

### Community 18 - "scheduleFishShadow"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Почему шильдик Съедена Касаткой затемнён у дочерней рыбы Ангуса и как сохранить исходный цвет всех шильдиков?, Source Nodes

### Community 19 - "ui-enhancements.js"
Cohesion: 0.33
Nodes (5): DropFish — Разломы, v1.90, Общие правила, Появление, Тестирование

### Community 20 - ".play"
Cohesion: 0.47
Nodes (6): randomRiftFish(), resolveGhostLoot(), riftFishReward(), riftReward(), riftTradeReward(), riftWeighted()

### Community 21 - "Q: Я подключил graphify чтобы ты мог ориентироваться по карте связей. папка в корне проекта лежит. Видишь ее? Сможешь работать с ней чтобы не читать каждый раз код с нуля."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Я подключил graphify чтобы ты мог ориентироваться по карте связей. папка в корне проекта лежит. Видишь ее? Сможешь работать с ней чтобы не читать каждый раз код с нуля., Source Nodes

### Community 22 - "selectSacrifice"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Посмотри через Graphify механику островов. Нужно ввести пару достижений для каждого острова. Предложи варианты., Source Nodes

### Community 23 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 24 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 25 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 29 - "README.md"
Cohesion: 0.40
Nodes (5): applyMotionPreference(), initRiftFuzzyTitles(), scheduleHeaderPresence(), triggerHeaderPresence(), uiIconMarkup()

### Community 32 - "README-TRADE-SHIP.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Почему иконки артефактов обрезались во вкладках справочника?, Source Nodes

### Community 33 - "Q: Где реализована хронология, добавление Ангуса вместе с рыбой или артефактом и автоматическая высота строки рыбы?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Где реализована хронология, добавление Ангуса вместе с рыбой или артефактом и автоматическая высота строки рыбы?, Source Nodes

### Community 34 - "runRiftStage"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Где централизованно управлять динамической высотой основных и дочерних строк хронологии?, Source Nodes

### Community 36 - "abyssalPersonalityKey"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Уменьшить иконку хлама до размера обычной рыбы, сжать простую строку и автоматически расширять её при воздействиях., Source Nodes

### Community 37 - "currentWeights"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Почему Обсидиановый ключ разрывается внутри слова в активных эффектах?, Source Nodes

### Community 38 - "useStormEye"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Где настроить фон строк добычи, рыб и реликвий Разлома в хронологии?, Source Nodes

### Community 39 - "catchArcadeCreature"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Почему Обсидиановый ключ не дал выбор после смены погоды?, Source Nodes

### Community 40 - "activateAstralNavigator"
Cohesion: 0.67
Nodes (3): recycleAllTrash(), rollRecyclonCategory(), trashIconMarkup()

### Community 42 - "islandLootOrigin"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Как лучше согласовать Обсидиановый ключ со всеми источниками смены погоды?, Source Nodes

### Community 44 - "currentWeights"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Почему справочник связывает Рециклон с муреной?, Source Nodes

### Community 45 - "hasBonus"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Как исправлена механика Рециклона без связи с муренами?, Source Nodes

## Knowledge Gaps
- **160 isolated node(s):** `BALANCE`, `ICONS`, `BONUS_DESCRIPTIONS`, `BONUS_NAMES`, `CHARACTER_INFO` (+155 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `resolveIslandLocationResult()` (2× useful, score=1.999560115) _(code changed — re-verify)_
- `renderHistory()` (2× useful, score=1.999498446) _(code changed — re-verify)_
- `renderEmbeddedFishList()` (2× useful, score=1.999296752) _(code changed — re-verify)_

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `renderHistory()` connect `commitState` to `pick`, `script.js`, `buildDropfishDebugPanel`, `metamorphBaseActions`, `useRiftRelic`, `activateAstralNavigator`, `riftRelicIcon`, `triggerHeaderPresence`, `viewport-fit.js`, `scheduleFishShadow`, `README.md`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `kg()` connect `commitState` to `pick`, `script.js`, `buildDropfishDebugPanel`, `metamorphBaseActions`, `useRiftRelic`, `riftRelicIcon`, `triggerHeaderPresence`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **Why does `pick()` connect `pick` to `script.js`, `buildDropfishDebugPanel`, `.play`, `useRiftRelic`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **What connects `BALANCE`, `ICONS`, `BONUS_DESCRIPTIONS` to the rest of the system?**
  _160 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `pick` be split into smaller, more focused modules?**
  _Cohesion score 0.06601146601146601 - nodes in this community are weakly interconnected._
- **Should `renderHistory` be split into smaller, more focused modules?**
  _Cohesion score 0.07262882748319642 - nodes in this community are weakly interconnected._
- **Should `script.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06804214223002635 - nodes in this community are weakly interconnected._