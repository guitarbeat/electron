# Import Path Fixes Checklist

## Files needing updates for new service module structure:

### ✅ COMPLETED
- [x] `api/_lib/state.ts` - Fixed stateSchemas and stateTypes imports
- [x] `components/ui/syncBannerContent.ts` - Fixed stateClient import to state module
- [x] `components/movies/WatchlistTopControls.tsx` - Fixed metadataService import to metadata module
- [x] `hooks/movies/useMovies.ts` - Fixed metadataService import to metadata module
- [x] `components/movies/lib/watchlistAutocomplete.ts` - Fixed metadataService import to metadata module
- [x] `components/movies/lib/watchlistAutocomplete.test.ts` - Fixed metadataService import to metadata module
- [x] `components/ui/SyncBanner.test.ts` - Fixed stateClient import to state module
- [x] `components/memories/FloatingMemoriesPanel.tsx` - Fixed memoryService and stateClient imports
- [x] `components/movies/Watchlist.tsx` - Fixed metadataService import to metadata module
- [x] `hooks/movies/useWatchlist.ts` - Fixed providers and analyticsService imports

### 🔄 CRITICAL FIXES NEEDED (from type check)

#### 1. `src/services/content/memoryService.ts`
- **Issue**: Importing from `./stateClient.ts` and `./stateSchemas.ts`
- **Fix**: Change to `../state/stateSchemas.ts` and `../state`
- **Lines**: 2, 3

#### 2. `src/services/content/messageService.ts`
- **Issue**: Importing from `./stateClient.ts`, `./stateSchemas.ts`, and `../utils/shared.ts`
- **Fix**: Change to `../state/stateSchemas.ts`, `../state`, and `../../utils/shared.ts`
- **Lines**: 1, 6, 8

#### 3. `src/services/content/pinHelpers.ts`
- **Issue**: TypeScript implicit any types
- **Fix**: Add proper type annotations
- **Lines**: 30

#### 4. `src/services/state/stateTypes.ts`
- **Issue**: Importing from `../components/quiz/types.ts` and `../shared/types.ts`
- **Fix**: Change to `../../components/quiz/types.ts` and `../../shared/types.ts`
- **Lines**: 1, 11

#### 5. `src/services/metadata/omdb.ts`
- **Issue**: TypeScript implicit any types
- **Fix**: Add proper type annotations
- **Lines**: 105, 106

#### 6. `src/services/metadata/tvmaze.ts`
- **Issue**: Property access on string type
- **Fix**: Add proper type guards
- **Lines**: 31

#### 7. `hooks/movies/useMovies.ts`
- **Issue**: Importing from `./useCollection`
- **Fix**: Change to `../useCollection`
- **Line**: 14

#### 8. Multiple test files
- **Issue**: Importing from old service paths
- **Fix**: Update to new module structure

## Priority Order:
1. **🔥 CRITICAL**: Core service imports (memoryService, messageService, stateTypes)
2. **HIGH**: Hook imports and metadata services
3. **MEDIUM**: Test files
4. **LOW**: Component imports

## Expected New Module Structure:
- `@/services/state` - Consolidated state management ✅
- `@/services/metadata` - Consolidated metadata services ✅
- `@/services/content` - Consolidated content services (memory, message, pinHelpers) ✅
- `@/services/polling` - Consolidated polling services ✅
