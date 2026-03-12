# A Stroll Through Memory Lane

Date: March 12, 2026  
Scope: milestone-based reading of the `HEAD` history

## Executive summary

- The repo starts on October 29, 2025 as a one-file AI Studio prototype and becomes a 928-commit product arc by March 12, 2026.
- The core product idea stays stable: a shared movie-night app for two people. What changes repeatedly is the presentation layer: Papyrus, spin wheel, message board, iMessage chat, floating bubbles, minigames, and a Y2K shell.
- The core architecture also keeps tightening: Supabase disappears on day one, GitHub Gist becomes the persistence backbone, then Gist access moves behind `server/index.js`.
- The current repo still carries the main historical threads in a small set of anchors: `App.tsx`, `App.css`, `src/components/watchlist/index.tsx`, `src/components/common/UserSelection.tsx`, `src/components/extras/SpinWheelGame.tsx`, `src/components/memories/FloatingMemoriesPanel.tsx`, `src/components/matchmaker/Matchmaker.tsx`, `src/components/food-merge/FoodMergeGame.tsx`, `src/services/gistClient.ts`, `src/services/memoryService.ts`, `src/services/metadataService.ts`, and `src/design-system/tokens.ts`.

## Repo at a glance

- Commit span on `HEAD`: October 29, 2025 → March 12, 2026
- Total commits on `HEAD`: 928
- Contributors on `HEAD`: 18
- Monthly shape of the project:

| Month | Commits | Executive read |
| --- | ---: | --- |
| `2025-10` | 7 | Birth of the app, immediate backend pivot, first playful UI move |
| `2025-11` | 28 | Social layer arrives: message board, stronger app voice, retro chat styling |
| `2025-12` | 9 | Reliability work around spin persistence and cross-device usability |
| `2026-01` | 79 | Metadata, design tokens, denser watchlist UI, more serious product structure |
| `2026-02` | 516 | Expansion month: profiles, PINs, iOS chat, bubbles, games, automation-heavy delivery |
| `2026-03` | 289 | Y2K refactor, file-count reduction, server proxy hardening, dependency upgrades, nostalgia restoration |

## Path crosswalk

This is the shortest path from the early history to the current tree.

| Historical path in commits | Closest current path in repo | Why it matters |
| --- | --- | --- |
| `components/UserSelection.tsx` | `src/components/common/UserSelection.tsx` | The login/profile handoff stays central through every era |
| `components/Watchlist.tsx` | `src/components/watchlist/index.tsx` | The watchlist remains the product core |
| `components/SpinWheel.tsx` | `src/components/extras/SpinWheelGame.tsx` | The wheel survives as the main “chance” mechanic |
| `components/MessageBoard.tsx` | `src/components/memories/FloatingMemoriesPanel.tsx` | The social/chat layer eventually becomes the memory lane surface |
| `components/message-board/MessageList.tsx` | `src/components/memories/MemoryList.tsx` | The thread-style UI survives even as the feature framing changes |
| `components/MessageItem.tsx` | `src/components/memories/FloatingMemoriesPanel.css` | Bubble styling and iMessage cues still shape the presentation |
| `components/MovieItem.tsx` | `src/components/watchlist/components/MovieCard.tsx` | Movie rows evolve into richer cards |
| `components/GuestBubbleAvatar.tsx` | `src/components/common/GelBubbleAvatar.tsx` | Bubble avatars stay part of the app’s visual identity |
| `gistConfig.ts` / `src/config/gistConfig.ts` | `src/services/gistClient.ts` and `server/index.js` | Persistence moved from client config to a guarded server-backed client |
| `design-system/tokens.ts` | `src/design-system/tokens.ts` | Typography and nostalgia styling remain a first-class concern |
| `components/main/Dashboard.tsx` | `App.tsx` and `App.css` | The app shell absorbed the dashboard-era Y2K identity |
| `components/food-drop/FoodDropGame.tsx` | `src/components/food-merge/FoodMergeGame.tsx` | The minigame slot persists even as the game itself changes |

## Era 1 — October 29, 2025: prototype to product skeleton

**Executive summary:** the repo finds its basic shape in a single day. It starts as an AI-generated seed, becomes a React/Vite movie-night app, abandons Supabase almost immediately, and adds the first unmistakably playful feature: the spin wheel.

### `e0df6cf` — Initial commit
- Why it matters: the repo is born as a concept statement rather than an application.
- Milestone files: `README.md`
- Current path tie-in: `README.md` still marks the origin point, but the real descendants now live in `App.tsx` and `src/components/watchlist/index.tsx`.

### `d7b7f0f` — feat: Initialize project structure and dependencies
- Why it matters: the first runnable version lands with React, Vite, Supabase, Gemini, and the core movie-watchlist flow.
- Milestone files: `App.tsx`, `components/Header.tsx`, `components/IntroScreen.tsx`, `components/UserSelection.tsx`, `components/Watchlist.tsx`, `services/geminiService.ts`, `services/movieService.ts`, `supabaseClient.ts`, `package.json`
- Current path tie-in: the surviving backbone is `App.tsx`, `src/components/common/UserSelection.tsx`, `src/components/watchlist/index.tsx`, `src/hooks/useMovies.ts`, and `package.json`.

### `a6446d2` — refactor: Migrate to GitHub Gist for data storage
- Why it matters: the first major architecture decision happens almost immediately. The app chooses a lighter-weight, hackable storage model.
- Milestone files: `context/UserContext.tsx`, `gistConfig.ts`, `hooks/useMovies.ts`, `supabaseClient.ts`
- Current path tie-in: the data story now centers on `src/context/index.tsx`, `src/hooks/useMovies.ts`, `src/services/gistClient.ts`, and `server/index.js`.

### `7244c9d` — feat: Add spin-the-wheel feature for movie selection
- Why it matters: this is where the repo stops being a straightforward utility and starts expressing taste. The wheel also brings early Papyrus energy into the UI.
- Milestone files: `components/SpinWheel.tsx`, `components/Watchlist.tsx`, `components/icons.tsx`, `index.html`
- Current path tie-in: that playful branch survives in `src/components/extras/SpinWheelGame.tsx`, `src/components/watchlist/index.tsx`, `src/design-system/tokens.ts`, and `src/styles/global.css`.

## Era 2 — November to December 2025: the app gets a voice

**Executive summary:** this period adds the social layer. The watchlist becomes a conversation space, the text tone turns deliberately casual, the chat UI becomes retro/iMessage-flavored, and the wheel starts getting persistence rules instead of just flair.

### `96dfea5` — feat: Implement message board and spin wheel enhancements
- Why it matters: the app becomes collaborative in a more human way. It now has both a planning surface and a talking surface.
- Milestone files: `components/MessageBoard.tsx`, `components/MovieSearch.tsx`, `components/SpinWheel.tsx`, `hooks/useMessages.ts`, `hooks/useSpinWheel.ts`, `services/messageService.ts`, `services/tmdb.ts`
- Current path tie-in: the descendants are spread across `src/components/memories/FloatingMemoriesPanel.tsx`, `src/components/memories/MemoryList.tsx`, `src/components/extras/SpinWheelGame.tsx`, `src/services/memoryService.ts`, and `src/hooks/useMovies.ts`.

### `392f54c` — feat: Change user selection prompt to "who dis b?"
- Why it matters: a tiny diff that establishes the repo’s voice. It is one of the clearest early signals that the app is personal, not generic.
- Milestone files: `components/UserSelection.tsx`
- Current path tie-in: the personality thread still routes through `src/components/common/UserSelection.tsx`.

### `c833c43` — Retro iMessage style message board redesign
- Why it matters: the message surface becomes an identity feature, not just a utility panel.
- Milestone files: `components/MessageBoard.tsx`, `components/icons.tsx`
- Current path tie-in: the current memory/chat descendant is `src/components/memories/FloatingMemoriesPanel.tsx` with styling now concentrated in `src/components/memories/FloatingMemoriesPanel.css`.

### `f3572e0` — feat: Add daily spin limit and persistence
- Why it matters: the wheel shifts from novelty to governed behavior. This is the moment game mechanics start getting rules.
- Milestone files: `components/SpinWheel.tsx`, `hooks/useSpinWheel.ts`, `services/dailySpinService.ts`, `types.ts`
- Current path tie-in: the front-end face of that work is still `src/components/extras/SpinWheelGame.tsx`; the persistence discipline later folds into `src/services/gistClient.ts`.

### `e3faef2` — Fix race condition in saveDailySpin by using partial Gist PATCH
- Why it matters: December is mostly stabilization, and this commit is the clearest example. The storage layer starts being treated like production software.
- Milestone files: `reproduce_bug.ts`, `services/dailySpinService.ts`
- Current path tie-in: the same concern now lives in `src/services/gistClient.ts`, `src/hooks/useMovies.ts`, and `server/index.js`.

## Era 3 — January 2026: richer movie intelligence

**Executive summary:** the project matures. Metadata, denser card layouts, and a more deliberate design system make the app feel less like a prototype with personality and more like a product with opinions.

### `91b5e1d` — feat: Implement movie metadata fetching, display, and management with new UI components and services
- Why it matters: this is the strongest “grown-up product” milestone in the history. The watchlist becomes information-rich instead of title-only.
- Milestone files: `components/FixMatchDialog.tsx`, `components/MessageItem.tsx`, `components/MovieItem.tsx`, `components/Watchlist.tsx`, `components/ui/MasonryGrid.tsx`, `components/ui/Menu.tsx`, `design-system/tokens.ts`, `services/metadataService.ts`
- Current path tie-in: the surviving feature centers are `src/components/watchlist/components/MovieCard.tsx`, `src/components/watchlist/index.tsx`, `src/components/watchlist/components/controls/WatchlistTopControls.tsx`, `src/design-system/tokens.ts`, and `src/services/metadataService.ts`.

## Era 4 — February 2026: identity, access, and playful expansion

**Executive summary:** February is the explosion month. The repo adds user boundaries, chat polish, bubble avatars, and more “little world” energy. This is where the app most clearly stops being only a movie tool and becomes a shared environment.

### `e6db31f` — Migrate to iOS chat UI
- Why it matters: the messaging layer gets a full visual rethink toward iPhone chat grammar.
- Milestone files: `components/MessageBoard.tsx`, `components/MessageItem.tsx`, `components/message-board/ChatWindow.tsx`, `components/message-board/MessageInput.tsx`, `components/message-board/MessageList.tsx`
- Current path tie-in: the styling DNA survives in `src/components/memories/FloatingMemoriesPanel.tsx`, `src/components/memories/FloatingMemoriesPanel.css`, `src/components/memories/MemoryList.tsx`, and `src/components/memories/MemoryComposer.tsx`.

### `c565123` — Add user profile selection and pin verification to the application
- Why it matters: the app gains boundaries. Profiles, access checks, and user-specific behavior become part of the normal flow.
- Milestone files: `App.tsx`, `components/UserSelection.tsx`, `components/Watchlist.tsx`, `hooks/useMovies.ts`
- Current path tie-in: this story now runs through `App.tsx`, `src/components/common/UserSelection.tsx`, `src/components/common/PinDialog.tsx`, and `src/hooks/useMovies.ts`.

### `e564c51` — Update guest bubble to show a random cat image
- Why it matters: small commit, strong signal. The bubble/cat aesthetic becomes part of the repo’s personality, not just a temporary flourish.
- Milestone files: `components/GuestBubbleAvatar.tsx`
- Current path tie-in: that visual line now lives in `src/components/common/GelBubbleAvatar.tsx` and the bubble-heavy shell styles in `App.css` and `src/styles/global.css`.

## Era 5 — March 2026: Y2K shell, consolidation, and hardening

**Executive summary:** March is both maximalist and disciplined. The UI leans hard into Y2K nostalgia and floating-bubble theatrics while the codebase simultaneously shrinks, the storage layer gets safer, and tooling catches up.

### `a2225c2` — Refactor Dashboard to Y2K UI
- Why it matters: this is the most explicit visual thesis statement in the repo. The app doubles down on gel bubbles, dashboard chrome, and retro-futurist framing.
- Milestone files: `components/main/Dashboard.tsx`, `components/main/Dashboard.css`, `components/common/GelBubbleAvatar.tsx`, `components/extras/spin-wheel/SpinWheel.tsx`, `components/matchmaker/Matchmaker.tsx`, `components/snake/SnakeGame.tsx`, `design-system/tokens.ts`
- Current path tie-in: the live descendants are `App.tsx`, `App.css`, `src/components/common/GelBubbleAvatar.tsx`, `src/components/extras/SpinWheelGame.tsx`, `src/components/matchmaker/Matchmaker.tsx`, `src/design-system/tokens.ts`, and `src/styles/global.css`.

### `3c90643` — Add Food Drop bubble
- Why it matters: the bubble shell becomes a launcher for side activities, not just a decoration.
- Milestone files: `components/common/UserSelection.tsx`, `components/food-drop/FoodDropGame.tsx`, `components/food-drop/foodDropEngine.ts`
- Current path tie-in: the same “minigame in the shell” idea survives in `src/components/common/UserSelection.tsx`, `src/components/food-merge/FoodMergeGame.tsx`, and `src/components/ui/MinigameModal.tsx`.

### `4c00bac` — Add interactive floating bubbles back to the application interface
- Why it matters: this is the clearest example of the repo returning to its favorite motif on purpose.
- Milestone files: `App.tsx`
- Current path tie-in: the shell-level bubble choreography now lives in `App.tsx` and `App.css`.

### `d585fc6` — Reduce src file count below 75
- Why it matters: this is the discipline counterweight to the March visual experimentation. The repo decides to get easier to maintain.
- Milestone files: `src/components/common/GelBubbleAvatar.tsx`, `src/components/watchlist/components/MovieCard.tsx`, `src/hooks/useMovies.ts`, `src/hooks/usePins.ts`, `src/hooks/usePlaces.ts`, `src/hooks/useQuiz.ts`, `src/hooks/useSuggestions.ts`, `src/services/gistClient.ts`, `src/services/memoryService.ts`
- Current path tie-in: most of the important files from this commit are still the live files carrying the app today.

### `28a92ef` — Move gist access behind server proxy
- Why it matters: the persistence model gets a serious security and architecture upgrade without abandoning the Gist-centered workflow.
- Milestone files: `.env.example`, `server/index.js`, `src/hooks/useMatchmaker.ts`, `src/hooks/useMovies.ts`, `src/hooks/usePins.ts`, `src/hooks/usePlaces.ts`, `src/hooks/useQuiz.ts`, `src/hooks/useSuggestions.ts`, `src/services/gistClient.ts`, `src/services/memoryService.ts`, `tests/gistClient.test.ts`
- Current path tie-in: this commit points almost directly at the present-day data layer: `server/index.js`, `src/services/gistClient.ts`, `src/services/memoryService.ts`, and the domain hooks under `src/hooks/`.

### `3ce46e4` — Upgrade project dependencies
- Why it matters: the app’s tooling finally catches up with the product surface. The repo modernizes linting, runtime expectations, and package health.
- Milestone files: `eslint.config.js`, `package.json`, `pnpm-lock.yaml`, `src/components/extras/SpinWheelGame.tsx`, `src/components/matchmaker/Matchmaker.tsx`, `src/services/metadataService.ts`
- Current path tie-in: these are the same files now defining the app’s modern baseline.

### `0cd049a` — Restore papyrus imessage y2k
- Why it matters: the latest commit is a deliberate callback. It confirms that the repo’s strongest visual instincts were never accidental.
- Milestone files: `App.css`, `App.tsx`, `src/components/memories/FloatingMemoriesPanel.tsx`, `src/components/memories/FloatingMemoriesPanel.css`, `src/components/ui/BottomSheet.tsx`, `src/components/ui/MinigameModal.tsx`, `src/components/watchlist/components/controls/WatchlistTopControls.tsx`, `src/design-system/tokens.ts`, `src/styles/global.css`
- Current path tie-in: this commit is not archaeology; it is the present tense of the app.

## Throughlines that never really changed

### 1. The watchlist stayed the center

Even when the repo wandered into chat UI, bubbles, memory walls, or minigames, the product anchor kept returning to the watchlist. The strongest current evidence is `src/components/watchlist/index.tsx`, `src/components/watchlist/components/MovieCard.tsx`, and `src/hooks/useMovies.ts`.

### 2. The app kept getting more personal

The history repeatedly favors voice, inside-joke energy, and identity cues over neutral product language. `components/UserSelection.tsx` turning into `src/components/common/UserSelection.tsx` is the cleanest longitudinal example.

### 3. Nostalgia is not ornamental here

Papyrus, iMessage bubbles, gel avatars, floating chrome, and Y2K gradients are not isolated experiments. They recur often enough that `src/design-system/tokens.ts`, `App.css`, and `src/styles/global.css` should be read as part of the product strategy, not just styling.

### 4. Architecture kept simplifying around the vibe

The frontend got more expressive at the same time the data path got more disciplined. The main proof is the line from `a6446d2` to `28a92ef`: GitHub Gist stays, but its access model improves through `src/services/gistClient.ts` and `server/index.js`.

## Suggested reading order in the current tree

If someone wants to understand the historical layers without reading the full git log, these files give the fastest route:

1. `App.tsx`
2. `App.css`
3. `src/components/common/UserSelection.tsx`
4. `src/components/watchlist/index.tsx`
5. `src/components/watchlist/components/MovieCard.tsx`
6. `src/components/extras/SpinWheelGame.tsx`
7. `src/components/memories/FloatingMemoriesPanel.tsx`
8. `src/components/common/GelBubbleAvatar.tsx`
9. `src/services/gistClient.ts`
10. `server/index.js`
11. `src/services/metadataService.ts`
12. `src/design-system/tokens.ts`

## Source notes

- Commit chronology came from `git log --reverse --date=short --pretty=format:'%h %ad %s'`.
- Milestone filenames came from `git show --name-only <commit>` and targeted `git show --stat` checks for merge commits.
- Commit counts and monthly totals are based on `HEAD`, not every branch in the repository.
