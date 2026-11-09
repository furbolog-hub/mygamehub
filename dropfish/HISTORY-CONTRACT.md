# DropFish chronology contract (before mobile row adapter)

This document freezes the presentation contract that existed before stage 3 of
the mobile redesign. The machine-readable source is
`dropfish/history-contract.json`; `scripts/test-dropfish-history-contract.js`
checks it against the renderer, delegated handlers and the new view-model.

## Shared invariants

- `state.history` remains the source of truth. The adapter may read records but
  must not replace them or derive gameplay outcomes.
- A row view-model always exposes `icon`, `title`, `badge`, `result`, `time`,
  `tone`, `filterGroup`, `motionTier`, `detailFields`, `expandable`, `details`,
  `actions`, and `media`.
- Detail builders and action builders remain the existing functions listed in
  the matrix. Their `data-*` attributes are part of the contract.
- Required decisions stay visible without opening disclosure and resolving one
  decision must not resolve or disable sibling decisions.
- Terminal fish visuals (`sacrifice`, `eaten`, `skeleton`, `replaced`) replace
  the main fish icon. The same terminal state or former size category is not
  repeated beside the title; only an independent acquisition origin may remain.
- New rows receive `createdAt`. The view-model keeps a stable em-dash fallback
  for legacy records without a timestamp, but compact chronology rows do not
  render a timestamp column and never fabricate gameplay time.

## Stage 7 presentation matrix

Every type in the matrix below also has a complete machine-readable presentation
entry in `history-contract.json`: `icon`, `badge`, `collapsedResult`,
`filterGroup`, `details`, `optionalMedia`, `tone`, and `motionTier`. Runtime uses
the matching `CHRONOLOGY_TYPE_META` entry and exposes filter/tone/motion as row
`data-*` metadata. `motionTier` is classification only; stage 7 does not add the
stage-8 animations.

The automated matrix compares all 26 recorded entries with runtime metadata and
renders every type in Chromium and WebKit. Blank collapsed results and absent
media are explicit `none` strategies rather than adapter fallbacks.

## Type matrix

| Type | Significant variants / status | Existing detail sources | Existing action sources | Terminal / required-decision rules |
| --- | --- | --- | --- | --- |
| `fish` | ordinary/heavy/giant; arcade; Rift; deep; island; radioactive; dungeon ally; trade/Recyclon | fish impacts, item find, embedded effects, `row.detail` | radioactive discard, navigator, Dark Ether, Chronocrystal | stolen/eaten/sacrificed/skeleton/replaced/displaced/traded/discarded/escaped; actions never alter sibling rows |
| `nonFishCatch` | weighted unusual catch; transformed/affected | `renderNonFishCatchImpacts`, `row.detail` | Dark Ether, Chronocrystal | removed/rolled-back flags remain record driven |
| `trash` | ordinary; radioactive; removed by Thread; transformed/recycled | trash/item/abyss changes, `row.detail` | radioactive trash discard, Dark Ether, Chronocrystal | discarded/destroyed/transformed/recycled are terminal |
| `bonus` | active, disabled, consumed/changed | mechanic/detail, gear status, abyss changes | Chronocrystal where eligible | disabled/neutralized/transformed are terminal presentation states |
| `debuff` | active, blocked, driven off, neutralized | compact debuff outcome, weight/outcome detail | Chronocrystal where eligible | neutralized/driven-off are terminal |
| `epic` | normal artifact, merged reward, transformed | artifact detail, embedded fish/objects | cross-cutting actions where eligible | removed/transformed/consumed are terminal |
| `legendary` | normal artifact, merged reward, transformed | artifact detail, embedded fish/objects | cross-cutting actions where eligible | removed/transformed/consumed are terminal |
| `mythic` | normal, Primordial Chaos, form change, transformed | artifact detail, embedded fish/objects | cross-cutting actions where eligible | removed/transformed/consumed are terminal |
| `coin` | available, used-success, used-fail, expired, trade-reserved, exchanged | coin impacts/status | `renderCoinAction` | used/expired/exchanged are terminal |
| `flowSphere` | fish, bonus, trade item, coin, final kg, final multiplier, extra casts | embedded fish/item or `row.detail` | `renderCoinAction` when the reward is a coin | one unnumbered row is committed only after a successful pop; a miss creates no row |
| `weather` | weather key and warning tone | `row.detail` | none | informational |
| `angus` | encounter; merged gift artifact/fish | gift artifact, Nautilus, embedded fish | none | informational after reward commit |
| `rift` | opening; relic source; loot; embedded fish | Rift loot, embedded fish, `row.detail` | nested expedition study | loot is immutable after commit; nested decision stays independent |
| `abyssal` | pending unknown form; kept/removed; manifested personality | abyss object/fish changes, `row.detail` | `renderAbyssDecision` | keep/remove is required and terminal for the pending row |
| `island` | expedition item active/decoded/failed; completion; cache; consumable result | island loot/cache, embedded fish, `row.detail` | expedition study/go, cache open | each cache/expedition decision is independent |
| `deadWaters` | available/playing/committing; escaped/dead/expired | `renderDeadWatersHistory(..., "details")` | `renderDeadWatersHistory(..., "action")`, nested expedition study | escaped/dead/expired are terminal |
| `dungeon` | sacrifice prompt; dive trail; abandon; prediction; reward; wrath | dungeon detail, smolder/reward status | sacrifice/dive/abandon/prediction, cross-cutting reward actions | prediction accept/decline and prompt decisions are required and independent |
| `tradeShip` | active trade; completed; Recyclon; flare; Vexinon time shift | `renderTradeShipHistory(..., "details")` | `renderTradeShipHistory(..., "action")` | completed/time-shift are terminal |
| `radioactive` | outbreak prompt/countdown; completion | `row.detail` | live countdown (non-button) | completion is terminal |
| `radioactiveCore` | formed, destroyed, exploded, transformed | isotope/object detail | cross-cutting action where eligible | destroyed/exploded/transformed are terminal |
| `deepEquipment` | ranks I–III; optional bonus cast | `renderDeepEquipmentDetail` | none | committed equipment container is informational |
| `assemblyBlueprint` | incomplete/ready/skipped/assembled | blueprint detail | actions live in ActiveEffectsRail/dialog, not the row | skipped/assembled are terminal |
| `assemblyDevice` | created/used/skipped | device detail | actions live in ActiveEffectsRail/dialog, not the row | used/skipped are terminal |
| `catastrophe` | Viaxalior attack | destroyed-row count and lost catch | none | attack is resolved and immutable |
| `trophy` | Viaxalior spike | 200% relationship hint without numeric weight | none | immutable trophy |
| `event` | generic; Golden Gear alternative; session finish | `row.detail` | `renderGoldenGearAction` | each Golden Gear row requires its own keep/reject decision |

## Delegated action contract

| `data-*` | Renderer | Delegated handler | State transition |
| --- | --- | --- | --- |
| `data-open-dead-waters` | `renderDeadWatersHistory` | `openDeadWaters` | opens/resumes matching vortex only |
| `data-island-cache`, `data-island-cache-row` | `renderIslandLootResults` | `openIslandCache` | opens matching cache only |
| `data-golden-decision`, `data-golden-id` | `renderGoldenGearAction` | `resolveGoldenGear` | records one alternative; applies only after all four decisions |
| `data-chrono-row` | `renderChronocrystalAction` | `useChronocrystal` | rolls back matching outcome |
| `data-chrono-keep` | `renderChronocrystalAction` | `keepChronocrystalResult` | keeps matching outcome |
| `data-dark-ether-row` | `renderDarkEtherAction` | `useDarkEtherOnRow` | removes matching eligible result |
| `data-dungeon-debuff`, `data-history-row` | `renderDungeonPrediction` | `resolveDungeonDebuffPrediction` | resolves matching prediction only |
| `data-dungeon-sacrifice` | `renderDungeonHistoryAction` | `openDungeonSacrifice` | opens sacrifice picker |
| `data-dungeon-dive` | `renderDungeonHistoryAction` | `beginDungeonDive` | starts dive |
| `data-dungeon-abandon` | dungeon prompt markup | `abandonDungeonPrompt` | abandons matching prompt |
| `data-navigator-lock`, `data-navigator-fish` | `renderNavigatorAction` | `activateAstralNavigator` | locks selected fish category |
| `data-expedition-study` | expedition/loot renderers | `decodeExpeditionItem` | decodes matching item |
| `data-expedition-go` | `renderExpeditionAction` | `startIslandExpedition` | starts matching expedition |
| `data-abyss-decision` | `renderAbyssDecision` | `resolveAbyssalDecision` | keep/remove pending form |
| `data-coin-id` | `renderCoinAction` | `useCoin` | resolves matching coin |
| `data-open-trade` | `renderTradeShipHistory` | `openTradeDialog` | opens active ship only |
| `data-radioactive-discard` | `renderRadioactiveAction` | `discardRadioactiveSample` | discards matching sample |
| `data-radioactive-trash-discard` | `renderRadioactiveAction` | `discardRadioactiveTrash` | discards matching radioactive trash |
| `data-history-toggle` | row renderer | `setHistoryRowExpanded` (click + Enter/Space) | UI-only disclosure state |

## State fields that must remain authoritative

The complete per-type lists live in `history-contract.json`. The most sensitive
cross-cutting fields are `fishId`, `nonFishCatchId`, `artifactId`, `coinId`,
`expeditionItemId`, `dungeonAction`, `deadWatersEvent`, `tradeShipSource`,
`goldenAlternativeId`, terminal fish flags, `historyUi`, and the owning feature
state (`rifts`, `islands`, `deadWaters`, `dungeon`, `abyssal`).
