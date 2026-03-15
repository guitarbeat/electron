# Regression Chronology

Date: March 12, 2026  
Scope: inferred regressions on `HEAD`, ordered by commit date

## What this document is

- This is a chronological inventory of regressions that are explicit in commit subjects or strongly implied by “fix”, “restore”, “guard”, “fallback”, or “post-pull regression” commits.
- It is not a claim that every historical bug is known. It only captures regressions that left a visible trail in `git log` on `HEAD`.
- Pure formatting-only churn is excluded unless it restored a broken build or verification path.

## Executive summary

- The earliest regressions were mostly UI clipping and spin-wheel stability problems.
- January 2026 adds a second class of regressions: richer UI and metadata work created modal, rendering, and structural JSX breakage.
- February 2026 shifts toward state, data, and auth regressions: stale fetches, unstable hooks, PIN flow issues, metadata overwrite risk, and install/build failures.
- March 2026 is the densest recovery period. The shell, profile flow, bubble UI, watchlist actions, fallback behavior, and verification pipeline all show visible regression-and-restore cycles during the Y2K/src-migration phase.

## Current remediation pass

This checklist tracks issues fixed during the March 14, 2026 audit pass.

- [x] Guarded the spin-wheel flow so the modal cannot be dismissed and the wheel mode cannot be changed mid-spin. Related regressions: `20f8e9b`, `9f80407`, `ecee9ad`, `e2df136`.
- [x] Restored safe watchlist add/suggest submission by preventing the browser form from hard-submitting the page. Related regressions: `6856914`, `f821809`, `121a64d`.
- [x] Pulled quiz and matchmaker experiences out of the default page flow and back behind intentional launch actions so the main shell stays cohesive. Related regressions: `ecee9ad`, `ec14329`, `0cd049a`.
- [x] Restored quiz retake/revisit behavior so retakes open as fresh sessions and agree/disagree answers stay in sync when revisiting questions. Related regressions: `baa1636`, `6856914`, `23f0c74`.
- [x] Stopped minigame keyboard input and delayed swipe/match timers from leaking across page state, which restores safer minigame interaction and unmount behavior. Related regressions: `f9a6694`, `20f8e9b`, `8e3459c`, `6763a52`.
- [x] Fixed PIN dialog teardown so profile/security modals always release global page state on close and unmount. Related regressions: `a599e85`, `ecee9ad`, `197e096`.
- [x] Replaced the watchlist metadata repair overlay with the shared dialog flow so “Fix Details” regains Escape handling, focus management, and modal locking. Related regressions: `cf6160c`, `ecee9ad`, `6763a52`.
- [x] Scoped modal Escape handling to the focused layer and added focus management to minigame overlays so nested dialogs no longer dismiss their parent sheets or modals. Related regressions: `ecee9ad`, `23f0c74`, `6763a52`.
- [x] Removed the extra watchlist celebration timeout so confetti resets from its own completion path and can replay cleanly across quick successive matches. Related regressions: `02065e9`, `6856914`, `6763a52`.
- [x] Restored bottom-sheet scroll lock cleanup so closing the mobile sheet preserves any pre-existing body overflow state from other active overlays. Related regressions: `ecee9ad`, `cf6160c`, `6763a52`.
- [x] Preserved existing `modal-open` body locks across stacked confirm/PIN dialogs so nested dialog cleanup no longer re-enables page scroll underneath another active modal. Related regressions: `ecee9ad`, `a599e85`, `197e096`.
- [x] Serialized delayed mobile action-sheet launches so reopening the menu or tapping multiple actions no longer queues stale modal opens after the sheet state changes. Related regressions: `ecee9ad`, `ec14329`, `6763a52`.
- [x] Cleared matchmaker celebration and random-pick timers when a session ends or restarts so old overlay state cannot leak into the next round. Related regressions: `8e3459c`, `20f8e9b`, `6763a52`.
- [x] Repaired the shared support-card pseudo-element rule in `App.css` so the shell stylesheet parses cleanly again and build-time CSS minification warnings disappear. Related regressions: `ec14329`, `5a6c778`, `6763a52`.
- [x] Reset matchmaker match-count tracking between sessions so a fresh round can trigger its celebration overlay on the first new shared pick instead of inheriting the previous round’s count. Related regressions: `8e3459c`, `ec14329`, `6763a52`.
- [x] Restored real submission locking in the places hook so add/delete/visited actions actually disable while writes are in flight instead of allowing duplicate taps and overlapping mutations. Related regressions: `e98b0f8`, `6856914`, `6763a52`.
- [x] Moved PIN state onto the shared polling path so multiple profile pickers stay in sync after PIN changes and no longer start duplicate local refresh intervals. Related regressions: `a599e85`, `02065e9`, `197e096`.
- [x] Tightened the matchmaker mutation lock so rapid repeat taps cannot queue extra session/swipe writes during the same event turn before the submitting state flips on. Related regressions: `8e3459c`, `20f8e9b`, `6763a52`.
- [x] Allowed nullable shared polling results for matchmaker so ending a session can publish the valid “no active game” state instead of surfacing it as a fetch error and leaving stale session UI behind. Related regressions: `8e3459c`, `6763a52`, `5963f7f`.

## November 2025

- `2025-11-03` — `12e3108` `Add favicon and fix sparkle character (#1)`
  - Regression: decorative sparkle character rendered incorrectly in the app shell.
  - Affected paths: `index.html`

- `2025-11-18` — `3c26d80` `Fix plus button cutoff on mobile`
  - Regression: the primary add action clipped on mobile layouts.
  - Affected paths: `components/Watchlist.tsx`

- `2025-11-25` — `de5afa5` `Investigate and fix text truncation issues (#15)`
  - Regression: text overflow/truncation across chat, wheel, card, and watchlist surfaces.
  - Affected paths: `components/MessageBoard.tsx`, `components/SpinWheel.tsx`, `components/Watchlist.tsx`, `components/ui/Card.tsx`, `components/ui/IconButton.tsx`, `index.html`

- `2025-11-25` — `6796671` `Fix mobile app styling and spin the wheel (#11)`
  - Regression: mobile styling and spin-wheel presentation broke together.
  - Affected paths: `App.tsx`, `components/Header.tsx`, `components/MessageBoard.tsx`, `components/SpinWheel.tsx`, `components/UserSelection.tsx`, `components/Watchlist.tsx`, `components/ui/Button.tsx`, `components/ui/Card.tsx`

- `2025-11-26` — `20f8e9b` `Fix: Improve spin wheel robustness and date display`
  - Regression: wheel state handling and date rendering were unreliable.
  - Affected paths: `components/SpinWheel.tsx`, `hooks/useSpinWheel.ts`

- `2025-11-26` — `9f80407` `feat: Prevent closing spin wheel during critical states`
  - Regression: the wheel could close mid-flow and leave the interaction in a bad state.
  - Affected paths: `components/SpinWheel.tsx`, `hooks/useSpinWheel.ts`

## December 2025

- `2025-12-03` — `f9a6694` `Fix spin wheel usability and scrolling issues on TV browsers.`
  - Regression: TV-browser input and scrolling behavior broke the wheel UX.
  - Affected paths: `components/SpinWheel.tsx`, `index.html`, `package.json`

- `2025-12-03` — `e3faef2` `Fix race condition in saveDailySpin by using partial Gist PATCH`
  - Regression: daily spin persistence could lose or overwrite state because of concurrent writes.
  - Affected paths: `reproduce_bug.ts`, `services/dailySpinService.ts`

## January 2026

- `2026-01-25` — `ecee9ad` `Fix SpinWheel visibility and site-wide modal blocking issues`
  - Regression: the wheel could become hidden and modals could block unrelated parts of the site.
  - Affected paths: `components/SpinWheel.tsx`, `components/Watchlist.tsx`, `hooks/useSpinWheel.ts`

- `2026-01-25` — `cf6160c` `Fix FixMatchDialog clipping, overhaul dialog UI, and implement smooth refreshes`
  - Regression: the metadata repair dialog clipped and refreshed poorly.
  - Affected paths: `components/FixMatchDialog.tsx`, `components/MovieItem.tsx`, `components/Watchlist.tsx`, `hooks/usePolling.ts`

- `2026-01-26` — `d35e6f2` `Fix incorrect closing JSX tags in the watchlist component`
  - Regression: the watchlist component structure became syntactically invalid.
  - Affected paths: `components/Watchlist.tsx`

- `2026-01-27` — `5d4d048` `Fix MessageBoard IDs`
  - Regression: message/thread identifiers became inconsistent enough to require repair.
  - Affected paths: `components/MessageBoard.tsx`, `components/message-board/MessageList.tsx`, `components/ui/Toast.tsx`, `hooks/useMessages.ts`

- `2026-01-27` — `892b1f5` `Update suggestion form to improve user experience and fix display issues`
  - Regression: the suggestion form rendered incorrectly.
  - Affected paths: `components/SuggestionForm.tsx`

## February 2026

- `2026-02-04` — `baa1636` `Fix runtime error in QuizFlow when questions are missing`
  - Regression: quiz execution crashed when question data was incomplete.
  - Affected paths: `components/quiz/QuizFlow.tsx`, `services/quizService.ts`, `pnpm-lock.yaml`

- `2026-02-06` — `ee985cd` `Fix truncated text in SuggestionForm inputs on mobile`
  - Regression: mobile input text was visibly clipped in the suggestion form.
  - Affected paths: `components/SuggestionForm.tsx`

- `2026-02-12` — `e98b0f8` `Improve data fetching reliability and fix potential stale data issues`
  - Regression: polling and quiz fetch paths could serve stale data.
  - Affected paths: `hooks/usePolling.ts`, `services/quizService.ts`

- `2026-02-12` — `dd200fd` `Fix unstable hook calls and improve data fetching with error fallbacks`
  - Regression: hook ordering/stability issues combined with weak fallback handling.
  - Affected paths: `services/quizService.ts`

- `2026-02-13` — `a599e85` `Fix PIN login mode and add shake animation on error (#105)`
  - Regression: the PIN login flow entered the wrong mode or failed to recover cleanly on error.
  - Affected paths: `components/PinDialog.tsx`, `components/UserSelection.tsx`

- `2026-02-16` — `6856914` `Restore movie watchlist functionality and improve quiz data handling`
  - Regression: watchlist behavior broke badly enough to require explicit restoration.
  - Affected paths: `hooks/useMovies.ts`, `hooks/usePolling.ts`, `services/quizService.ts`

- `2026-02-17` — `f2e5105` `Fix chat bubble disappearing on hover and button styling`
  - Regression: chat bubbles vanished on hover, and the related button styling drifted.
  - Affected paths: `components/MessageItem.tsx`, `components/ui/Button.tsx`

- `2026-02-17` — `7a20ca2` `Fix: Prevent metadata updates from overwriting critical movie fields (#118)`
  - Regression: metadata refreshes could corrupt core movie data.
  - Affected paths: `hooks/useMovies.ts`

- `2026-02-19` — `4959d23` `fix: resolve CI lint errors and restore missing icon imports`
  - Regression: icon imports went missing and CI broke at the same time.
  - Affected paths: `App.tsx`, `components/DashboardCards.tsx`, `components/FixMatchDialog.tsx`, `components/Watchlist.tsx`, `components/main/ProfileSheet.tsx`, `hooks/useUserColors.ts`

- `2026-02-20` — `02065e9` `Improve application stability and fix various bugs`
  - Regression: multiple surfaces were unstable at once, including watchlist, PIN flow, snake, memories, and polling.
  - Affected paths: `components/MovieItem.tsx`, `components/PinDialog.tsx`, `components/Watchlist.tsx`, `components/snake/SnakeGame.tsx`, `components/snake/useSnakeAudio.ts`, `components/watchlist/components/WatchlistMemories.tsx`, `hooks/usePolling.ts`

- `2026-02-21` — `8e3459c` `Restore and improve the draggable chat bubble functionality`
  - Regression: the draggable chat-bubble launcher stopped working or degraded enough to require restoration.
  - Affected paths: `components/MessageBoard.tsx`

- `2026-02-22` — `277c32a` `Fix errors by adding missing design tokens to application`
  - Regression: recent UI work referenced tokens that were no longer defined.
  - Affected paths: `App.tsx`, `components/watchlist/components/WatchlistContent.tsx`

- `2026-02-25` — `ae64610` `[dyad] Fixed TS errors by cleaning duplicate imports and missing brace in services/dailySpinService.test.ts, and by adding missing components components/snake/SnakeBoard.tsx and components/matchmaker/SwipeCard.tsx. Type-checked edited files with no errors.`
  - Regression: TypeScript/build health broke because components went missing and a test file became syntactically invalid.
  - Affected paths: `components/matchmaker/SwipeCard.tsx`, `components/snake/SnakeBoard.tsx`, `services/dailySpinService.test.ts`

- `2026-02-25` — `d62a63b` `[dyad] Investigated npm error 'Cannot read properties of null (reading matches)' and removed lovable-tagger from Vite config and package.json to prevent install/start failures.`
  - Regression: the dependency/tooling stack prevented install or startup.
  - Affected paths: `package.json`, `vite.config.ts`

- `2026-02-27` — `737ca3f` `Fix race condition in pinService.ts`
  - Regression: PIN writes or reads could race and produce inconsistent state.
  - Affected paths: `services/pinService.ts`

## March 2026

- `2026-03-01` — `fc77a43` `SnakeGame paused on embed`
  - Regression: embedded Snake sessions paused incorrectly.
  - Affected paths: `components/snake/SnakeGame.tsx`, `vite.config.ts`

- `2026-03-02` — `e2df136` `Fix spin loading guard`
  - Regression: wheel loading state was not properly guarded.
  - Affected paths: `components/extras/spin-wheel/SpinWheel.tsx`

- `2026-03-03` — `5a6c778` `Restore app visibility by importing missing design tokens`
  - Regression: the app became visually broken or invisible because design tokens stopped resolving.
  - Affected paths: `App.tsx`

- `2026-03-03` — `af7adf1` `Add graceful fallbacks for missing GitHub credentials`
  - Regression: the app failed hard when GitHub credentials were absent.
  - Affected paths: `services/messageService.ts`, `services/movieService.ts`, `services/placesService.ts`

- `2026-03-03` — `f0f7be2` `Handle auth errors gracefully with fallback mock data`
  - Regression: auth failures propagated as app failures instead of graceful degradation.
  - Affected paths: `services/messageService.ts`, `services/movieService.ts`, `services/placesService.ts`

- `2026-03-03` — `74bde54` `fix: Resolve typescript errors causing CI failure`
  - Regression: the repo stopped type-checking cleanly.
  - Affected paths: `services/movieService.ts`, `services/placesService.ts`, `vite.config.ts`

- `2026-03-03` — `23f0c74` `Restore profile sheet and first-run user selection`
  - Regression: profile entry and first-run onboarding flow disappeared or stopped rendering correctly.
  - Affected paths: `App.tsx`, `components/common/UserSelection.tsx`, `components/ui/ConfirmDialog.tsx`

- `2026-03-04` — `3ce9c2c` `Fix draggable bubble merge drop`
  - Regression: bubble drag/drop behavior broke after merge activity.
  - Affected paths: `App.css`, `App.tsx`, `components/food-drop/FoodDropGame.tsx`, `components/food-drop/foodDropEngine.ts`, `components/layout/AppHeader.tsx`, `components/ui/TabBar.css`

- `2026-03-04` — `ec14329` `Restore cohesive bubble homepage UI`
  - Regression: the home page lost its intended bubble-based visual coherence.
  - Affected paths: `App.css`, `App.tsx`, `components/common/GelBubbleAvatar.css`, `components/common/GelBubbleAvatar.tsx`, `components/common/UserSelection.css`, `components/common/UserSelection.tsx`, `components/food-drop/FoodDropGame.tsx`

- `2026-03-04` — `c8310c4` `Restore streak and fever badges`
  - Regression: game/status badges disappeared from the UI.
  - Affected paths: `components/extras/spin-wheel/SpinWheel.tsx`, `components/food-drop/FoodDropGame.tsx`

- `2026-03-05` — `6b598a3` `Guarded food drop rendering`
  - Regression: Food Drop could render in invalid states and needed stronger guards.
  - Affected paths: `components/food-drop/foodDropEngine.ts`

- `2026-03-06` — `6763a52` `Fix post-pull regressions and align scripts with src layout`
  - Regression: a pull/rebase sequence introduced multi-file breakage during the `src/` layout transition.
  - Affected paths: `package.json`, `src/components/common/ErrorBoundary.tsx`, `src/components/common/FixMatchDialog.tsx`, `src/components/common/MinecraftBubble.tsx`, `src/components/common/UserSelection.tsx`, `src/components/enhanced/EnhancedMatchmaker.tsx`, `src/components/quiz/QuizFlow.tsx`, `src/components/watchlist/index.tsx`

- `2026-03-06` — `197e096` `Fix UserContext mismatch by using src context providers`
  - Regression: app state providers drifted out of sync during the move to `src/`.
  - Affected paths: `App.tsx`

- `2026-03-07` — `3626d97` `chore: clean up repo and restore avatar bubble logins`
  - Regression: cleanup work broke the bubble-based login flow.
  - Affected paths: `App.css`, `App.tsx`, `config/firebaseConfig.ts`, `config/gistConfig.ts`, `config/googlePlaces.ts`, `config/imageConfig.ts`

- `2026-03-07` — `7635a79` `feat: restore legacy avatar bubble login and remove duplicate selectors`
  - Regression: avatar login behavior and selector rendering diverged after prior UI changes.
  - Affected paths: `App.css`, `App.tsx`, `src/components/common/GelBubbleAvatar.css`, `src/components/common/GelBubbleAvatar.tsx`, `src/components/common/PinDialog.css`, `src/components/common/PinDialog.tsx`, `src/components/common/UserSelection.css`, `src/components/common/UserSelection.tsx`

- `2026-03-07` — `9ea6ed4` `fix: restore watchlist delete action and rebuild unit test suite`
  - Regression: delete behavior disappeared from the watchlist.
  - Affected paths: `package.json`, `src/components/watchlist/index.tsx`, `src/tests/memoryUtils.test.ts`, `src/tests/pollingManager.test.ts`, `src/tests/security.test.ts`, `src/tests/snakeGameLogic.test.ts`

- `2026-03-07` — `79f3040` `fix: render watchlist load errors as strings`
  - Regression: watchlist load errors were not rendering safely or legibly.
  - Affected paths: `src/components/watchlist/index.tsx`

- `2026-03-09` — `df8679b` `Add fallback functionality to user pin fetching`
  - Regression: PIN retrieval could fail without a local or secondary path.
  - Affected paths: `src/hooks/usePins.ts`

- `2026-03-11` — `a739157` `Restore full repo verification checks`
  - Regression: lint/type/build/test verification coverage had been weakened or broken.
  - Affected paths: `package.json`, `src/services/gistClient.ts`, `vite.config.ts`

- `2026-03-12` — `f821809` `Fix watchlist regressions after rebase`
  - Regression: a rebase introduced fresh watchlist breakage.
  - Affected paths: `src/components/watchlist/components/MovieCard.tsx`, `src/hooks/useMovies.ts`

- `2026-03-12` — `121a64d` `Restore watchlist controls on mobile`
  - Regression: mobile watchlist controls disappeared or became unusable.
  - Affected paths: `src/components/watchlist/index.tsx`

- `2026-03-12` — `5963f7f` `Isolate PollingManager listener errors`
  - Regression: listener failures could cascade through the polling layer.
  - Affected paths: `src/services/PollingManager.ts`, `tests/pollingManager.test.ts`

- `2026-03-12` — `0cd049a` `Restore papyrus imessage y2k`
  - Regression: the nostalgic visual stack had been flattened or diluted enough to require explicit restoration.
  - Affected paths: `App.css`, `App.tsx`, `src/components/memories/FloatingMemoriesPanel.css`, `src/components/memories/FloatingMemoriesPanel.tsx`, `src/components/ui/BottomSheet.tsx`, `src/components/ui/MinigameModal.tsx`, `src/components/watchlist/components/controls/WatchlistTopControls.tsx`, `src/design-system/tokens.ts`

## Patterns behind the regressions

- **Spin-wheel fragility:** November through March repeatedly shows wheel-specific regressions in visibility, persistence, loading, closing guards, TV usability, and badge state.
- **Shell/UI churn risk:** the largest cluster happens when home screen, bubble login, Y2K shell, and profile-selection flows are being reshaped.
- **State and fallback risk:** quiz data, PIN state, auth credentials, polling, and metadata writes all required later hardening.
- **Migration risk:** the shift into `src/` and later rebases produced several explicit “restore” commits, especially around watchlist and context wiring.

## Righting the wrong on `HEAD`

This section ties each historical regression to the current tree that carries the corrected behavior now.

### November 2025

- `12e3108`: decorative shell fixes now live through `App.tsx`, `App.css`, and `src/styles/global.css`.
- `3c26d80`: mobile add/control layout is now concentrated in `src/components/watchlist/index.tsx`, `src/components/watchlist/components/controls/WatchlistTopControls.tsx`, and `src/components/ui/BottomSheet.tsx`.
- `de5afa5`: truncation-sensitive UI now resolves through `src/components/watchlist/components/MovieCard.tsx`, `src/components/memories/FloatingMemoriesPanel.tsx`, and `src/components/watchlist/components/controls/WatchlistTopControls.tsx`.
- `6796671`: mobile shell and wheel presentation now route through `App.css`, `src/components/watchlist/index.tsx`, and `src/components/extras/SpinWheelGame.tsx`.
- `20f8e9b`: wheel robustness is carried by `src/components/extras/SpinWheelGame.tsx`.
- `9f80407`: guarded wheel interaction now spans `src/components/extras/SpinWheelGame.tsx` and `src/components/ui/MinigameModal.tsx`.

### December 2025

- `f9a6694`: wheel sizing and scroll behavior now live in `src/components/extras/SpinWheelGame.tsx` and `src/styles/global.css`.
- `e3faef2`: spin persistence is simpler now; the remaining wheel history logic is in `src/components/extras/SpinWheelGame.tsx`, while write-safety patterns moved to `src/services/gistClient.ts`.

### January 2026

- `ecee9ad`: wheel visibility and modal isolation now route through `src/components/extras/SpinWheelGame.tsx`, `src/components/ui/MinigameModal.tsx`, and `src/components/ui/BottomSheet.tsx`.
- `cf6160c`: metadata repair now resolves through `src/components/watchlist/index.tsx`, `src/components/watchlist/components/MovieCard.tsx`, `src/hooks/useMovies.ts`, and `src/services/metadataService.ts`.
- `d35e6f2`: the watchlist surface now lives in `src/components/watchlist/index.tsx`.
- `5d4d048`: thread identity and memory records now center on `src/components/memories/FloatingMemoriesPanel.tsx`, `src/components/memories/MemoryList.tsx`, and `src/services/memoryService.ts`.
- `892b1f5`: suggestions now flow through `src/components/watchlist/index.tsx`, `src/components/watchlist/components/controls/WatchlistTopControls.tsx`, and `src/hooks/useSuggestions.ts`.

### February 2026

- `baa1636`: missing-question handling is now carried by `src/components/quiz/QuizFlow.tsx` and `src/hooks/useQuiz.ts`.
- `ee985cd`: mobile suggestion input behavior is now part of `src/components/watchlist/index.tsx` and `src/components/watchlist/components/controls/WatchlistTopControls.tsx`.
- `e98b0f8`: stale-fetch protection now lives in `src/hooks/usePolling.ts`, `src/services/PollingManager.ts`, and `src/hooks/useQuiz.ts`.
- `dd200fd`: hook stability and fallback handling now route through `src/hooks/useQuiz.ts` and `src/hooks/usePolling.ts`.
- `a599e85`: PIN flow recovery is now centered in `src/components/common/PinDialog.tsx` and `src/components/common/UserSelection.tsx`.
- `6856914`: restored watchlist behavior now lives in `src/components/watchlist/index.tsx`, `src/hooks/useMovies.ts`, and `src/hooks/useQuiz.ts`.
- `f2e5105`: bubble/message interaction styling now lives in `src/components/memories/FloatingMemoriesPanel.tsx`, `src/components/memories/FloatingMemoriesPanel.css`, and `src/components/ui/Button.tsx`.
- `7a20ca2`: safe metadata merging is explicit in `src/hooks/useMovies.ts` and backed by `src/services/metadataService.ts`.
- `4959d23`: icon wiring and shell integrity now depend on `App.tsx`, `src/components/common/icons/index.tsx`, and `src/components/watchlist/index.tsx`.
- `02065e9`: the surviving stability work is now concentrated in `src/components/watchlist/index.tsx`, `src/components/common/PinDialog.tsx`, and `src/hooks/usePolling.ts`.
- `8e3459c`: the descendant of the floating chat surface is `src/components/memories/FloatingMemoriesPanel.tsx`, coordinated from `App.tsx`.
- `277c32a`: token integrity now runs through `src/design-system/tokens.ts`, `src/styles/global.css`, and `App.tsx`.
- `ae64610`: the surviving restored component from that breakage is `src/components/matchmaker/SwipeCard.tsx`; broader type/build hygiene now lives in `package.json` scripts.
- `d62a63b`: install/start correctness is now anchored by `package.json` and `vite.config.ts`.
- `737ca3f`: PIN concurrency is now handled at the hook/client boundary in `src/hooks/usePins.ts` and `src/services/gistClient.ts`.

### March 2026

- `fc77a43`: the old embedded Snake path no longer ships in current `src/`; minigame presentation now routes through `src/components/ui/MinigameModal.tsx` and `src/components/food-merge/FoodMergeGame.tsx`.
- `e2df136`: the current wheel loading guard is in `src/components/extras/SpinWheelGame.tsx`.
- `5a6c778`: app visibility now depends on `App.tsx`, `src/design-system/tokens.ts`, and `src/styles/global.css`.
- `af7adf1`: missing-credential resilience now routes through `src/services/gistClient.ts`, `src/services/mockData.ts`, and fallback-aware hooks such as `src/hooks/useSuggestions.ts`.
- `f0f7be2`: auth-error degradation now follows the same fallback path through `src/services/gistClient.ts`, `src/services/mockData.ts`, and the domain hooks.
- `74bde54`: modern type/build correctness is anchored by `package.json`, `eslint.config.js`, and `vite.config.ts`.
- `23f0c74`: first-run identity flow is now carried by `App.tsx`, `src/components/common/UserSelection.tsx`, and `src/components/common/PinDialog.tsx`.
- `3ce9c2c`: the bubble/minigame shell now lives in `App.tsx`, `App.css`, `src/components/ui/MinigameModal.tsx`, and `src/components/food-merge/FoodMergeGame.tsx`.
- `ec14329`: cohesive bubble-home styling now depends on `App.tsx`, `App.css`, `src/components/common/GelBubbleAvatar.tsx`, and `src/components/common/UserSelection.tsx`.
- `c8310c4`: the surviving game badge/wheel styling path is `src/components/extras/SpinWheelGame.tsx` with supporting visuals in `src/styles/global.css`.
- `6b598a3`: guarded minigame rendering now resolves through `src/components/ui/MinigameModal.tsx` and `src/components/food-merge/FoodMergeGame.tsx`.
- `6763a52`: post-migration recovery work now stabilizes `src/components/watchlist/index.tsx`, `src/components/common/UserSelection.tsx`, `src/components/quiz/QuizFlow.tsx`, and `package.json`.
- `197e096`: context/provider alignment now lives in `src/context/index.tsx` and `App.tsx`.
- `3626d97`: bubble-login restoration now survives in `App.tsx`, `App.css`, `src/components/common/UserSelection.tsx`, and `src/components/common/GelBubbleAvatar.tsx`.
- `7635a79`: the legacy avatar-login path now sits in `App.tsx`, `App.css`, `src/components/common/UserSelection.tsx`, `src/components/common/GelBubbleAvatar.tsx`, and `src/components/common/PinDialog.tsx`.
- `9ea6ed4`: watchlist delete behavior now routes through `src/components/watchlist/index.tsx`; the rebuilt verification layer now lives in `tests/memoryUtils.test.ts`, `tests/pollingManager.test.ts`, and `tests/security.test.ts`.
- `79f3040`: watchlist error rendering now remains in `src/components/watchlist/index.tsx`.
- `df8679b`: PIN fallback logic now lives in `src/hooks/usePins.ts` and `src/services/gistClient.ts`.
- `a739157`: full verification is now anchored by `package.json`, `tests/gistClient.test.ts`, `tests/pollingManager.test.ts`, `tests/security.test.ts`, and `tests/validation.test.ts`.
- `f821809`: the rebase-recovery path now lives in `src/components/watchlist/components/MovieCard.tsx` and `src/hooks/useMovies.ts`.
- `121a64d`: mobile watchlist controls now depend on `src/components/watchlist/index.tsx`, `src/components/watchlist/components/controls/WatchlistTopControls.tsx`, and `src/components/ui/BottomSheet.tsx`.
- `5963f7f`: listener isolation now lives in `src/services/PollingManager.ts` and `tests/pollingManager.test.ts`.
- `0cd049a`: the restored nostalgia stack now lives directly in `App.tsx`, `App.css`, `src/components/memories/FloatingMemoriesPanel.tsx`, `src/design-system/tokens.ts`, and `src/styles/global.css`.

## Source notes

- Built from `git log HEAD --reverse --date=short --pretty=format:'%h %ad %s'` plus targeted `git show --name-only` and `git show --stat` checks.
- Ordering is chronological by commit date.
