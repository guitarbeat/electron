// API Hooks
export * from './api/useMovies.js';
export * from './api/useMatchmaker.js';
export * from './api/usePins.js';

// Core Hooks
export * from './useGenericMutation.js';
export * from './usePolling.js';

// UI Hooks
export * from './useAudio.js';
export * from './useMediaQuery.js';
export * from './useRandomCatImage.js';
export * from './useToolHide.js';
export * from './useUndoRedo.js';

// Feature Hooks
export * from './useChatLogic.js';
export * from './useMemories.js';
export * from './useMessages.js';
export * from './usePlaces.js';
export * from './usePlacesAutocomplete.js';
export * from './useQuiz.js';
export * from './useSuggestions.js';
export * from './useUserColors.js';

// Legacy exports for backward compatibility
export { useMovies } from './api/useMovies.js';
export { useMatchmaker } from './api/useMatchmaker.js';
export { usePins } from './api/usePins.js';
export { useGenericMutation } from './useGenericMutation.js';
export { usePolling } from './usePolling.js';
