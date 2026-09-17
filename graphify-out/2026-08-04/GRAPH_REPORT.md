# Graph Report - DropFish-Rifts-v1.90  (2026-08-04)

## Corpus Check
- 57 files · ~2,160,513 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3036 nodes · 6023 edges · 214 communities (63 shown, 151 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.53)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7a4a689d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- pick
- renderHistory
- renderTradeDialog
- commitState
- buildDropfishDebugPanel
- round1
- metamorphBaseActions
- useRiftRelic
- renderRift
- maybeFinalizeSession
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
- buildDropfishDebugPanel
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
- renderTradeDialog
- islandLootOrigin
- triggerHeaderPresence
- currentWeights
- hasBonus
- islandLootOrigin
- scheduleFishShadow
- maybeTriggerDebuffEvent
- scheduleFishShadow
- URL
- index.ts
- Правила визуального оформления DropFish
- URLSearchParams
- DurableObjectStorage
- rs
- Container
- Element
- Headers
- SubtleCrypto
- package.json
- compilerOptions
- Blob
- Body
- FormData
- URLPattern
- DurableObjectState
- WorkerEntrypoint
- StreamError
- agroclick/script.public.min.js
- Flagship
- R2ObjectBody
- AgentMemoryProfile
- ByteLengthQueuingStrategy
- WritableStream
- DurableObject
- DurableObjectTransaction
- ReadableStream
- Socket
- WritableStreamDefaultWriter
- AiSearchInstance
- DurableObjectNamespace
- R2Bucket
- SqlStorageCursor
- Vectorize
- Ai
- AiSearchNamespace
- ReadableStreamBYOBReader
- VectorizeIndex
- WorkflowInstance
- DropFish — Разломы
- AiSearchItem
- AiSearchItems
- Artifacts
- ArtifactsRepo
- D1Database
- D1PreparedStatement
- KVNamespace
- ReadableByteStreamController
- ReadableStreamDefaultReader
- TextDecoder
- AiGateway
- Comment
- DurableObjectFacets
- ForwardableEmailMessage
- HTMLRewriter
- HTMLRewriterDocumentContentHandlers
- ImageHandle
- ReadableStreamBYOBRequest
- ReadableStreamDefaultController
- StreamScopedCaptions
- StreamVideoHandle
- StreamWatermarks
- SyncKvStorage
- Table
- Text
- TextEncoder
- TransformStreamDefaultController
- round1
- AbortController
- AiSearchJob
- AiSearchJobs
- AutoRAG
- Cache
- Crypto
- D1DatabaseSession
- EndTag
- HostedImagesBinding
- HTMLRewriterElementContentHandlers
- ImageTransformationResult
- ImageTransformer
- MediaTransformationResult
- Module
- Performance
- Queue
- R2MultipartUpload
- Span
- StreamBinding
- StreamScopedDownloads
- WebSocketRequestResponsePair
- Workflow
- WorkflowEntrypoint
- agroclick/viewport-fit.min.js
- dropfish/viewport-fit.min.js
- AgentMemoryNamespace
- BasicImageTransformations
- BrowserRun
- ColoLocalActorNamespace
- StubBase
- DOMException
- DurableObjectId
- ExecProcess
- ExecutionContext
- Global
- HelloWorldBinding
- ImagesBinding
- MediaTransformer
- Memory
- Message
- MessageBatch
- NodeStyleServer
- PipelineTransformationEntrypoint
- RequestInitCfPropertiesVaryHeader
- SqlStorage
- ToMarkdownService
- Tracing
- WorkerLoader
- WorkerStub
- WorkflowStep
- WritableStreamDefaultController
- public-release/dropfish/assets/audio/README.md
- public-release/dropfish/README-TRADE-SHIP.md
- AnalyticsEngineDataset
- __BaseEnv_Env
- CacheContext
- CacheStorage
- CloudflareAccessContext
- CompileError
- DispatchNamespace
- DocumentEnd
- EventListenerObject
- Hyperdrive
- IncomingRequestCfPropertiesBotManagement
- Instance
- JsonWebKey
- MediaBinding
- MediaTransformationGenerator
- MessageChannel
- Navigator
- NonRetryableError
- Pipeline
- ProcessEnv
- R2Checksums
- RateLimit
- ResponseFunctionToolCall
- RpcTarget
- RuntimeError
- ScheduledController
- Scheduler
- SecretsStoreSecret
- SendEmail
- StreamVideos
- TraceItemFetchEventInfoRequest
- UnsafeTraceMetrics
- WebSearch
- session-guard.js
- chooseIslandLocation
- agroclick/viewport-fit.js
- dropfish/viewport-fit.js
- ensureRifts

## God Nodes (most connected - your core abstractions)
1. `renderHistory()` - 89 edges
2. `renderHistory()` - 87 edges
3. `kg()` - 50 edges
4. `kg()` - 50 edges
5. `pick()` - 48 edges
6. `pick()` - 48 edges
7. `buildDropfishDebugPanel()` - 45 edges
8. `chance()` - 41 edges
9. `renderEmbeddedFishList()` - 41 edges
10. `capitalize()` - 41 edges

## Surprising Connections (you probably didn't know these)
- `showChoice()` --indirect_call--> `resolveFadedRelicFragment()`  [INFERRED]
  dropfish/script.js → dropfish/script.js  _Bridges community 0 → community 7_
- `useRiftRelic()` --indirect_call--> `isNaturalHeavy()`  [INFERRED]
  dropfish/script.js → dropfish/script.js  _Bridges community 4 → community 120_
- `commitIslandLoot()` --indirect_call--> `markFishDisplaced()`  [INFERRED]
  dropfish/script.js → dropfish/script.js  _Bridges community 4 → community 0_
- `renderHistory()` --indirect_call--> `initRiftFuzzyTitles()`  [INFERRED]
  dropfish/script.js → dropfish/script.js  _Bridges community 4 → community 3_
- `useRiftRelic()` --indirect_call--> `isNaturalHeavy()`  [INFERRED]
  public-release/dropfish/script.public.min.js → public-release/dropfish/script.public.min.js  _Bridges community 17 → community 20_

## Import Cycles
- None detected.

## Communities (214 total, 151 thin omitted)

### Community 0 - "pick"
Cohesion: 0.15
Nodes (41): activateDeepThing(), activeMythics(), addFishHistory(), addHistory(), addRiftRelic(), appendHistoryDetailById(), applyRandomWeather(), attachFishToHistoryRow() (+33 more)

### Community 1 - "renderHistory"
Cohesion: 0.07
Nodes (101): activateBomb(), activateChest(), activateDefenderIfPresent(), activeBombsForDefender(), activeItem(), addHarvest(), addInventory(), appendMoleSummons() (+93 more)

### Community 2 - "renderTradeDialog"
Cohesion: 0.13
Nodes (26): abyssChangeTargetType(), abyssObjectsForHistoryRow(), addRiftRelic(), coinIconMarkup(), commitRiftLoot(), exchangeIslandColossus(), islandLootHistoryPurposeLabel(), islandLootIconMarkup() (+18 more)

### Community 3 - "commitState"
Cohesion: 0.09
Nodes (67): abyssalIconMarkup(), abyssalPersonalityKey(), abyssObjectsForHistoryRow(), artifactIconMarkup(), bonusIconMarkup(), capitalize(), compactIslandOriginText(), consumeProtection() (+59 more)

### Community 4 - "buildDropfishDebugPanel"
Cohesion: 0.02
Nodes (107): ABYSSAL_ICON_FILES, ABYSSAL_PERSONALITIES, ABYSSAL_WEATHERS, abyssalPulseMarkup(), achievements(), activateAstralNavigator(), activeBonuses(), activeEnhancedDiver() (+99 more)

### Community 5 - "round1"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 6 - "metamorphBaseActions"
Cohesion: 0.00
Nodes (847): RFC-2253, RFC-3339, RFC-5246, RFC-9440, AgentMemoryGetSummaryOptions, AgentMemoryGetSummaryResponse, AgentMemoryIncomingMemory, AgentMemoryIngestOptions (+839 more)

### Community 7 - "useRiftRelic"
Cohesion: 0.13
Nodes (33): addIslandFeat(), availableExpeditions(), availableIslandNavigator(), chooseIslandLocation(), commitState(), continueIsland(), decodeExpeditionItem(), ensureIslands() (+25 more)

### Community 8 - "renderRift"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Как реализован Обсидиановый ключ для всех автоматических смен погоды?, Source Nodes

### Community 9 - "maybeFinalizeSession"
Cohesion: 0.09
Nodes (40): abyssalEntity(), artifactVisualName(), beginRift(), beginTradeShip(), commitRiftLoot(), completeTradeShip(), continueRift(), declineRift() (+32 more)

### Community 10 - "islandLootIconMarkup"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Применить рекомендованный набор из восьми островных достижений., Source Nodes

### Community 11 - "catchArcadeCreature"
Cohesion: 0.11
Nodes (18): Абиссальная форма жизни, Активные эффекты, Важно: подготовить технические шильдики, Дополнения от 24 июля 2026, Завершение сессии и торговля, Общий принцип, Обязательная сквозная проверка иконок, Обязательный стандарт компоновки строк (+10 more)

### Community 12 - "triggerHeaderPresence"
Cohesion: 0.04
Nodes (12): CloseEvent, CustomEvent, EmailEvent, ErrorEvent, Event, ExtendableEvent, FetchEvent, MessageEvent (+4 more)

### Community 13 - "runRiftStage"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 14 - "viewport-fit.js"
Cohesion: 0.04
Nodes (7): AbortSignal, EventSource, EventTarget, MessagePort, ServiceWorkerGlobalScope, WebSocket, WorkerGlobalScope

### Community 15 - "abyssalPersonalityKey"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 16 - "renderRift"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Где добавить Рециклон во вкладку торговых судов и убрать emoji-заглушки справочника?, Source Nodes

### Community 17 - "useStormEye"
Cohesion: 0.02
Nodes (125): a0_0x367f(), a0_0x5d4f(), ABYSSAL_ICON_FILES, ABYSSAL_ICON_PATH, ABYSSAL_PERSONALITIES, ABYSSAL_WEATHERS, activateAstralNavigator(), animateCast() (+117 more)

### Community 18 - "scheduleFishShadow"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Почему шильдик Съедена Касаткой затемнён у дочерней рыбы Ангуса и как сохранить исходный цвет всех шильдиков?, Source Nodes

### Community 19 - "ui-enhancements.js"
Cohesion: 0.33
Nodes (5): DropFish — Разломы, v1.90, Общие правила, Появление, Тестирование

### Community 20 - "buildDropfishDebugPanel"
Cohesion: 0.09
Nodes (48): achievements(), activateDeepThing(), activateMegalodon(), activeBonuses(), activeDebuff(), activeEnhancedDiver(), activeMythics(), addFishHistory() (+40 more)

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

### Community 28 - "AGENTS.md"
Cohesion: 0.40
Nodes (4): Canonical project workspace, graphify, Mandatory public-release protection, Test-first release workflow

### Community 29 - "README.md"
Cohesion: 0.10
Nodes (54): abyssFishLabel(), abyssPercent(), abyssSample(), activateMegalodon(), activeDebuff(), advanceAbyssalAfterCast(), advanceMythicAfterCast(), appendLatestHistoryDetail() (+46 more)

### Community 32 - "README-TRADE-SHIP.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Почему иконки артефактов обрезались во вкладках справочника?, Source Nodes

### Community 33 - "Q: Где реализована хронология, добавление Ангуса вместе с рыбой или артефактом и автоматическая высота строки рыбы?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Где реализована хронология, добавление Ангуса вместе с рыбой или артефактом и автоматическая высота строки рыбы?, Source Nodes

### Community 34 - "runRiftStage"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Где централизованно управлять динамической высотой основных и дочерних строк хронологии?, Source Nodes

### Community 35 - "fishTitleText"
Cohesion: 0.57
Nodes (6): d(), l(), m(), r(), s(), u()

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
Cohesion: 0.09
Nodes (66): abyssalIconMarkup(), abyssalPersonalityKey(), abyssalPulseMarkup(), artifactIconMarkup(), bonusIconMarkup(), compactIslandOriginText(), debuffCategoryBadge(), debuffIconMarkup() (+58 more)

### Community 41 - "renderTradeDialog"
Cohesion: 0.15
Nodes (21): abyssChangeTargetType(), coinIconMarkup(), createRecyclonFish(), exchangeIslandColossus(), islandLootHistoryPurposeLabel(), islandLootIconMarkup(), islandLootLabel(), islandLootPurposeMarkup() (+13 more)

### Community 42 - "islandLootOrigin"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Как лучше согласовать Обсидиановый ключ со всеми источниками смены погоды?, Source Nodes

### Community 44 - "currentWeights"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Почему справочник связывает Рециклон с муреной?, Source Nodes

### Community 45 - "hasBonus"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Как исправлена механика Рециклона без связи с муренами?, Source Nodes

### Community 47 - "scheduleFishShadow"
Cohesion: 0.11
Nodes (56): abyssFishLabel(), abyssPercent(), abyssSample(), availableAbyssFish(), availableAbyssTrash(), availableTradeItems(), chance(), changeAbyssFishWeight() (+48 more)

### Community 49 - "scheduleFishShadow"
Cohesion: 0.10
Nodes (7): CompressionStream, DecompressionStream, FixedLengthStream, IdentityTransformStream, TextDecoderStream, TextEncoderStream, TransformStream

### Community 53 - "index.ts"
Cohesion: 0.25
Nodes (18): ALLOWED_ORIGINS, claim(), ClientPayload, corsHeaders(), encoder, fetch(), finish(), Game (+10 more)

### Community 54 - "Правила визуального оформления DropFish"
Cohesion: 0.11
Nodes (18): Абиссальная форма жизни, Активные эффекты, Важно: подготовить технические шильдики, Дополнения от 24 июля 2026, Завершение сессии и торговля, Общий принцип, Обязательная сквозная проверка иконок, Обязательный стандарт компоновки строк (+10 more)

### Community 57 - "rs"
Cohesion: 0.07
Nodes (84): abyssalEntity(), addHistory(), addIslandFeat(), advanceAbyssalAfterCast(), appendLatestHistoryDetail(), applyRandomWeather(), artifactVisualName(), availableExpeditions() (+76 more)

### Community 62 - "package.json"
Cohesion: 0.15
Nodes (12): devDependencies, typescript, wrangler, name, private, scripts, check, deploy (+4 more)

### Community 63 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, lib, module, moduleResolution, noEmit, skipLibCheck, strict, target (+4 more)

### Community 65 - "Body"
Cohesion: 0.15
Nodes (3): Body, Request, Response

### Community 70 - "StreamError"
Cohesion: 0.18
Nodes (11): AlreadyUploadedError, BadRequestError, ForbiddenError, InternalError, InvalidURLError, MaxFileSizeError, NotFoundError, QuotaReachedError (+3 more)

### Community 71 - "agroclick/script.public.min.js"
Cohesion: 0.07
Nodes (104): a0_0x1d28(), a0_0x53b7(), activateBomb(), activateChest(), activateDefenderIfPresent(), activeBombsForDefender(), activeItem(), addHarvest() (+96 more)

### Community 75 - "ByteLengthQueuingStrategy"
Cohesion: 0.22
Nodes (3): ByteLengthQueuingStrategy, CountQueuingStrategy, QueuingStrategy

### Community 92 - "DropFish — Разломы"
Cohesion: 0.33
Nodes (5): DropFish — Разломы, v1.90, Общие правила, Появление, Тестирование

### Community 120 - "round1"
Cohesion: 0.16
Nodes (24): availableTradeItemsForKey(), chooseOwnedFish(), commitRiftFish(), createTradeFish(), eligibleFinalCastTradeCoin(), exchangeAllTradeItems(), exchangeFinalCastCoin(), exchangeSiphonophoreThread() (+16 more)

### Community 147 - "BasicImageTransformations"
Cohesion: 0.67
Nodes (3): BasicImageTransformations, RequestInitCfPropertiesImage, RequestInitCfPropertiesImageDraw

### Community 164 - "RequestInitCfPropertiesVaryHeader"
Cohesion: 0.67
Nodes (3): RequestInitCfPropertiesVaryAcceptHeader, RequestInitCfPropertiesVaryAcceptLanguageHeader, RequestInitCfPropertiesVaryHeader

### Community 208 - "session-guard.js"
Cohesion: 0.38
Nodes (9): api(), claimSession(), formatDuration(), installId(), localResultAvailable(), openSavedResults(), requestPayload(), showFinishedGate() (+1 more)

### Community 209 - "chooseIslandLocation"
Cohesion: 0.48
Nodes (7): availableIslandNavigator(), chooseIslandLocation(), exploreIslandLocation(), exploreIslandMaskRepeat(), islandDangerChance(), islandLocationOutcome(), islandResearchCount()

### Community 212 - "ensureRifts"
Cohesion: 0.33
Nodes (7): availableRiftRelic(), consumeRiftFishEffects(), ensureRifts(), hydrateState(), initialState(), loadDailyState(), localDayKey()

## Knowledge Gaps
- **1128 isolated node(s):** `BALANCE`, `LOCATIONS`, `ICONS`, `BONUS_DESCRIPTIONS`, `BONUS_NAMES` (+1123 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **151 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Console` connect `maybeTriggerDebuffEvent` to `metamorphBaseActions`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `CustomEvent` connect `triggerHeaderPresence` to `metamorphBaseActions`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `syncDeepThingConversionDetails()` connect `pick` to `buildDropfishDebugPanel`, `triggerHeaderPresence`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **What connects `BALANCE`, `LOCATIONS`, `ICONS` to the rest of the system?**
  _1128 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `renderHistory` be split into smaller, more focused modules?**
  _Cohesion score 0.07124542124542124 - nodes in this community are weakly interconnected._
- **Should `renderTradeDialog` be split into smaller, more focused modules?**
  _Cohesion score 0.12615384615384614 - nodes in this community are weakly interconnected._
- **Should `commitState` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._