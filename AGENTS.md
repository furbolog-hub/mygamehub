## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Canonical project workspace

- The only canonical working directory for this project is `C:\Users\ss\Desktop\DropFish-Rifts-v1.90`.
- Before inspecting, editing, testing, building, or publishing project files, verify that the active workspace is this directory or one of its subdirectories.
- If a different copy of the project or an older game-version folder is open, warn the user immediately, identify the active path, and do not make project changes there unless the user explicitly overrides this rule.
- Never transfer changes from this canonical workspace to another project copy merely because that other folder is open.
- Treat this repository as the shared home for the current DropFish game, the second game, and future games added later.
- Keep each game within this project and integrate current and future games into the common game-selection menu as the project grows.
- Unless the user explicitly says otherwise, references to "the project", "the current version", or "the game workspace" mean this canonical directory.

## Test-first release workflow

- Always make changes to game mechanics, calculations and balance, markup, and visuals in the test versions first.
- Do not copy, rebuild, obfuscate, deploy, or publish those changes to the public versions unless the user gives a separate explicit instruction to update the public versions.
- A request to change or test a feature applies only to the test versions by default.
- Publishing to the public versions is a distinct follow-up task that begins only after the user explicitly requests it.

## Mandatory public-release protection

- These rules apply to every current and future game without exception.
- Never copy a test `index.html` over a public `index.html` wholesale. Public-only Cloudflare integration, cache versions, session limits, and protected asset names must be preserved and merged explicitly.
- Every public game page must set the correct `data-game` value on `<html>` and load `../session-guard.css` plus `../session-guard.min.js` before the game starts.
- Every public game must be supported by the Cloudflare Worker allow-list and session API before it is published. The deployed Worker, active deployment, D1 binding/database, required secrets, and `/v1/session/claim` plus `/v1/session/finish` client calls must be verified.
- Public game JavaScript must never be published as source code or as a merely minified Terser build. Build it from the tested source, minify it, then run `javascript-obfuscator` with the established hexadecimal identifier format and historical `a0_0x...` output (`--identifier-names-generator hexadecimal --identifiers-prefix a`).
- Before every public push, run syntax checks on source and public JavaScript, verify a substantial `_0x...` obfuscation signature in every public game bundle, and audit every public game index for `data-game` and both session-guard includes.
- Update public cache-busting versions whenever a protected script or guard reference changes.
- Publish public files through an isolated Git index based on the current public remote branch. Verify the exact changed-file list before pushing so unrelated working-tree files and test-only markup cannot enter the public repository.
- If any protection, obfuscation, Worker, D1, secret, binding, or audit check fails, stop the release. Do not publish a degraded public build.
