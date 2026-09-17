# Graph Report - DropFish-Rifts-v1.90  (2026-07-31)

## Corpus Check
- 56 files · ~2,166,032 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2952 nodes · 5850 edges · 210 communities (60 shown, 150 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 141 edges (avg confidence: 0.64)
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
- tradeItemIconMarkup
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
- uid
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
- In
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
- buildDropfishDebugPanel
- buildDropfishDebugPanel

## God Nodes (most connected - your core abstractions)
1. `renderHistory()` - 93 edges
2. `renderHistory()` - 88 edges
3. `kg()` - 50 edges
4. `kg()` - 50 edges
5. `pick()` - 48 edges
6. `pick()` - 48 edges
7. `buildDropfishDebugPanel()` - 46 edges
8. `buildDropfishDebugPanel()` - 45 edges
9. `renderEmbeddedFishList()` - 43 edges
10. `chance()` - 41 edges

## Surprising Connections (you probably didn't know these)
- `currentWeights()` --indirect_call--> `v()`  [INFERRED]
  dropfish/script.js → public-release/agroclick/script.public.min.js
- `processDebuff()` --indirect_call--> `f`  [INFERRED]
  dropfish/script.js → public-release/agroclick/script.public.min.js
- `restoreByMessage()` --indirect_call--> `f`  [INFERRED]
  dropfish/script.js → public-release/agroclick/script.public.min.js
- `resolveEssencesAtFinish()` --indirect_call--> `f`  [INFERRED]
  dropfish/script.js → public-release/agroclick/script.public.min.js
- `activateMegalodon()` --indirect_call--> `f`  [INFERRED]
  dropfish/script.js → public-release/agroclick/script.public.min.js

## Import Cycles
- None detected.

## Communities (210 total, 150 thin omitted)

### Community 0 - "pick"
Cohesion: 0.09
Nodes (68): achievements(), activateDeepThing(), activateMegalodon(), activeBonuses(), activeDebuff(), activeEnhancedDiver(), activeMythics(), addFishHistory() (+60 more)

### Community 1 - "renderHistory"
Cohesion: 0.07
Nodes (101): activateBomb(), activateChest(), activateDefenderIfPresent(), activeBombsForDefender(), activeItem(), addHarvest(), addInventory(), appendMoleSummons() (+93 more)

### Community 2 - "renderTradeDialog"
Cohesion: 0.11
Nodes (30): abyssChangeTargetType(), abyssObjectsForHistoryRow(), addRiftRelic(), availableTradeItemsForKey(), coinIconMarkup(), commitRiftLoot(), eligibleFinalCastTradeCoin(), exchangeAllTradeItems() (+22 more)

### Community 3 - "commitState"
Cohesion: 0.06
Nodes (82): abyssalPersonalityKey(), abyssalPulseMarkup(), abyssObjectsForHistoryRow(), artifactCategoryBadge(), artifactIconMarkup(), artifactVisualName(), bonusCategoryBadge(), bonusIconMarkup() (+74 more)

### Community 4 - "buildDropfishDebugPanel"
Cohesion: 0.03
Nodes (94): ABYSSAL_ICON_FILES, ABYSSAL_PERSONALITIES, ABYSSAL_WEATHERS, activateAstralNavigator(), animateCast(), animateElement(), applyMotionPreference(), ARTIFACT_ICON_FILES (+86 more)

### Community 5 - "round1"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 6 - "metamorphBaseActions"
Cohesion: 0.00
Nodes (847): RFC-2253, RFC-3339, RFC-5246, RFC-9440, AgentMemoryGetSummaryOptions, AgentMemoryGetSummaryResponse, AgentMemoryIncomingMemory, AgentMemoryIngestOptions (+839 more)

### Community 7 - "useRiftRelic"
Cohesion: 0.15
Nodes (30): addIslandFeat(), availableExpeditions(), availableIslandNavigator(), chooseIslandLocation(), commitState(), continueIsland(), decodeExpeditionItem(), ensureIslands() (+22 more)

### Community 8 - "renderRift"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Как реализован Обсидиановый ключ для всех автоматических смен погоды?, Source Nodes

### Community 9 - "tradeItemIconMarkup"
Cohesion: 0.15
Nodes (20): abyssChangeTargetType(), islandLootHistoryPurposeLabel(), islandLootIconMarkup(), islandLootLabel(), islandLootPurposeMarkup(), renderAbyssChangeResult(), renderAbyssObjectChanges(), renderFirstWaterImpact() (+12 more)

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
Cohesion: 0.03
Nodes (108): ABYSSAL_ICON_FILES, ABYSSAL_PERSONALITIES, ABYSSAL_WEATHERS, abyssalPulseMarkup(), activateAstralNavigator(), animateCast(), animateElement(), applyMotionPreference() (+100 more)

### Community 18 - "scheduleFishShadow"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Почему шильдик Съедена Касаткой затемнён у дочерней рыбы Ангуса и как сохранить исходный цвет всех шильдиков?, Source Nodes

### Community 19 - "ui-enhancements.js"
Cohesion: 0.33
Nodes (5): DropFish — Разломы, v1.90, Общие правила, Появление, Тестирование

### Community 20 - "uid"
Cohesion: 0.25
Nodes (18): addRiftRelic(), commitRiftFish(), commitRiftLoot(), createRecyclonFish(), rand1(), riftUid(), rollDestructiveTidesReward(), rollEchoRay() (+10 more)

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
Cohesion: 0.18
Nodes (31): abyssFishLabel(), abyssPercent(), abyssSample(), availableAbyssFish(), availableAbyssTrash(), availableTradeItems(), changeAbyssFishWeight(), changeWeatherRandomly() (+23 more)

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
Cohesion: 0.09
Nodes (57): fitBoard(), watchBoard(), fitBoard(), watchBoard(), a(), a0_0x2048(), a0_0x4972(), ae() (+49 more)

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
Cohesion: 0.08
Nodes (73): abyssalIconMarkup(), abyssalPersonalityKey(), abyssFishLabel(), artifactIconMarkup(), artifactVisualName(), bonusIconMarkup(), capitalize(), compactIslandOriginText() (+65 more)

### Community 41 - "renderTradeDialog"
Cohesion: 0.18
Nodes (17): availableTradeItemsForKey(), createTradeFish(), eligibleFinalCastTradeCoin(), exchangeAllTradeItems(), exchangeFinalCastCoin(), exchangeIslandColossus(), exchangeSiphonophoreThread(), exchangeTradeItem() (+9 more)

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
Cohesion: 0.10
Nodes (72): abyssalEntity(), abyssPercent(), abyssSample(), addHistory(), advanceAbyssalAfterCast(), applyRandomWeather(), availableAbyssFish(), availableAbyssTrash() (+64 more)

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
Cohesion: 0.08
Nodes (53): achievements(), activateDeepThing(), activateMegalodon(), activeBonuses(), activeDebuff(), activeEnhancedDiver(), activeMythics(), addFishHistory() (+45 more)

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

### Community 71 - "In"
Cohesion: 0.12
Nodes (34): addIslandFeat(), availableExpeditions(), chooseOwnedFish(), commitState(), continueIsland(), decodeExpeditionItem(), ensureIslands(), finishIslandExpedition() (+26 more)

### Community 75 - "ByteLengthQueuingStrategy"
Cohesion: 0.22
Nodes (3): ByteLengthQueuingStrategy, CountQueuingStrategy, QueuingStrategy

### Community 92 - "DropFish — Разломы"
Cohesion: 0.33
Nodes (5): DropFish — Разломы, v1.90, Общие правила, Появление, Тестирование

### Community 147 - "BasicImageTransformations"
Cohesion: 0.67
Nodes (3): BasicImageTransformations, RequestInitCfPropertiesImage, RequestInitCfPropertiesImageDraw

### Community 164 - "RequestInitCfPropertiesVaryHeader"
Cohesion: 0.67
Nodes (3): RequestInitCfPropertiesVaryAcceptHeader, RequestInitCfPropertiesVaryAcceptLanguageHeader, RequestInitCfPropertiesVaryHeader

### Community 208 - "session-guard.js"
Cohesion: 0.40
Nodes (9): api(), claimSession(), formatDuration(), installId(), localResultAvailable(), openSavedResults(), requestPayload(), showFinishedGate() (+1 more)

### Community 215 - "buildDropfishDebugPanel"
Cohesion: 0.14
Nodes (33): abyssalEntity(), abyssalIconMarkup(), beginTradeShip(), buildDropfishDebugPanel(), catchAbyssalLife(), completeTradeShip(), declineRift(), ensureRifts() (+25 more)

### Community 221 - "buildDropfishDebugPanel"
Cohesion: 0.20
Nodes (21): availableIslandNavigator(), chooseIslandLocation(), createRecyclonFish(), exploreIslandLocation(), exploreIslandMaskRepeat(), islandDangerChance(), islandLocationOutcome(), islandResearchCount() (+13 more)

## Knowledge Gaps
- **1102 isolated node(s):** `BALANCE`, `ICONS`, `BONUS_DESCRIPTIONS`, `BONUS_NAMES`, `CHARACTER_INFO` (+1097 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **150 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `resolveIslandLocationResult()` (2× useful, score=1.999560115) _(code changed — re-verify)_
- `renderHistory()` (2× useful, score=1.999498446) _(code changed — re-verify)_
- `renderEmbeddedFishList()` (2× useful, score=1.999296752) _(code changed — re-verify)_

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ServiceWorkerGlobalScope` connect `viewport-fit.js` to `fishTitleText`, `metamorphBaseActions`?**
  _High betweenness centrality (0.195) - this node is a cross-community bridge._
- **Why does `t()` connect `fishTitleText` to `activateAstralNavigator`, `useStormEye`, `rs`, `scheduleFishShadow`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `renderHistory()` (e.g. with `ge()` and `k()`) actually correct?**
  _`renderHistory()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `BALANCE`, `ICONS`, `BONUS_DESCRIPTIONS` to the rest of the system?**
  _1102 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `pick` be split into smaller, more focused modules?**
  _Cohesion score 0.09174714661984197 - nodes in this community are weakly interconnected._
- **Should `renderHistory` be split into smaller, more focused modules?**
  _Cohesion score 0.07262882748319642 - nodes in this community are weakly interconnected._
- **Should `renderTradeDialog` be split into smaller, more focused modules?**
  _Cohesion score 0.1103448275862069 - nodes in this community are weakly interconnected._