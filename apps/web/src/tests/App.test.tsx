/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, renderHook } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import AppWithProviders from '@/app/App';
import { AppProviders } from '@/app/AppProviders';
import { useUser, useViewport, useTheme, useToast } from '@/app/providerContexts';
import { useProfileSelection, usePinPanel } from '@/app/ProfilePinContext';
import { useAppTabNavigation, useCrtEntranceAnimation } from '@/hooks';
import { buildFeatureModals } from '@/app/buildMinigameModals';
import {
  readQuizCompletionState,
  writeQuizCompletionState,
  readUserQuizOutcome,
  writeUserQuizOutcome,
} from '@/app/quizCompletionStorage';
import {
  APP_VIEW_STATE_KEY,
  parseMainTab,
  readInitialAppViewState,
  readStoredAppViewState,
  stripLaunchUrlShortcuts,
  hasLaunchUrlShortcuts,
} from '@/app/appViewState';
import type { QuizResult } from '@/shared/types';

// Mock SpeedInsights to prevent external network interactions during test
vi.mock('@vercel/speed-insights/react', () => ({
  SpeedInsights: () => null,
}));

// Mock lazy feature panels to prevent unmounted asynchronous imports in tests
vi.mock('@/app/lazyFeaturePanels', () => ({
  LibraryWorkspacePanel: () => <div data-testid="mock-library-panel" />,
  MessageBoardPanel: () => <div data-testid="mock-message-board" />,
  SpinSwipeGamePanel: () => <div data-testid="mock-spin-swipe" />,
  SpinWheelGamePanel: () => <div data-testid="mock-spin-wheel" />,
  QuizEditorPanel: () => <div data-testid="mock-quiz-editor" />,
  QuizExperiencePanel: () => <div data-testid="mock-quiz-experience" />,
}));

// Mock browser APIs not natively fully implemented in jsdom
beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, '', '/');

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  window.requestIdleCallback = vi.fn().mockImplementation((cb: () => void) => {
    return setTimeout(cb, 0) as unknown as number;
  });
  window.cancelIdleCallback = vi.fn();

  global.IntersectionObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  } as unknown as typeof IntersectionObserver;

  global.ResizeObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  } as unknown as typeof ResizeObserver;
});

describe('App Shell and Core Providers', () => {
  it('renders children with all core context providers accessible', () => {
    const TestConsumer = () => {
      const { currentUser } = useUser();
      const { isMobile, isTv } = useViewport();
      const { currentTheme } = useTheme();
      const { showToast } = useToast();
      const { isDisabled } = useProfileSelection();
      const { pinMode } = usePinPanel();

      return (
        <div data-testid="consumer-output">
          <span data-testid="user">{currentUser ?? 'no-user'}</span>
          <span data-testid="mobile">{String(isMobile)}</span>
          <span data-testid="tv">{String(isTv)}</span>
          <span data-testid="theme">{currentTheme}</span>
          <span data-testid="has-toast">{typeof showToast === 'function' ? 'yes' : 'no'}</span>
          <span data-testid="disabled">{String(isDisabled)}</span>
          <span data-testid="pin-mode">{pinMode}</span>
        </div>
      );
    };

    render(
      <AppProviders themeName="movies">
        <TestConsumer />
      </AppProviders>,
    );

    expect(screen.getByTestId('consumer-output')).toBeInTheDocument();
    expect(screen.getByTestId('theme')).toHaveTextContent('movies');
    expect(screen.getByTestId('mobile')).toHaveTextContent('false');
    expect(screen.getByTestId('tv')).toHaveTextContent('false');
    expect(screen.getByTestId('has-toast')).toHaveTextContent('yes');
    expect(screen.getByTestId('pin-mode')).toHaveTextContent('set');
  });

  it('supports custom theme configuration in AppProviders', () => {
    const ThemeConsumer = () => {
      const { currentTheme } = useTheme();
      return <div data-testid="theme-name">{currentTheme}</div>;
    };

    render(
      <AppProviders themeName="places">
        <ThemeConsumer />
      </AppProviders>,
    );

    expect(screen.getByTestId('theme-name')).toHaveTextContent('places');
  });

  it('renders the complete App shell with accessibility link and canvas container', () => {
    const { container } = render(<AppWithProviders />);

    // Verify skip-to-content accessibility link
    const skipLink = screen.getByRole('link', { name: /skip to content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');

    // Verify app-shell root container
    const appShell = container.querySelector('.app-shell');
    expect(appShell).toBeInTheDocument();

    // Verify main canvas container
    const canvas = container.querySelector('.app-shell__canvas');
    expect(canvas).toBeInTheDocument();
  });
});

describe('Quiz Interaction & State Management Logic', () => {
  it('reads and writes quiz completion state per user', () => {
    expect(readQuizCompletionState('Aaron')).toBe(false);
    expect(readQuizCompletionState('Electra')).toBe(false);
    expect(readQuizCompletionState(null)).toBe(false);

    writeQuizCompletionState('Aaron', true);
    expect(readQuizCompletionState('Aaron')).toBe(true);
    expect(readQuizCompletionState('Electra')).toBe(false);

    writeQuizCompletionState('Electra', true);
    expect(readQuizCompletionState('Aaron')).toBe(true);
    expect(readQuizCompletionState('Electra')).toBe(true);

    writeQuizCompletionState('Aaron', false);
    expect(readQuizCompletionState('Aaron')).toBe(false);
    expect(readQuizCompletionState('Electra')).toBe(true);
  });

  it('persists and removes user quiz outcome data properly', () => {
    const mockOutcome: QuizResult = {
      character: 'Cinephile Pioneer',
      scores: { Aaron: 12, Electra: 8 },
      percentages: { Aaron: 60, Electra: 40 },
    };

    expect(readUserQuizOutcome('Aaron')).toBeNull();

    writeUserQuizOutcome('Aaron', mockOutcome);
    const stored = readUserQuizOutcome('Aaron');
    expect(stored).not.toBeNull();
    expect(stored?.character).toBe('Cinephile Pioneer');
    expect(stored?.percentages.Aaron).toBe(60);

    // Retake or clearing outcome
    writeUserQuizOutcome('Aaron', null);
    expect(readUserQuizOutcome('Aaron')).toBeNull();
  });

  it('handles corrupted localStorage payload gracefully without throwing', () => {
    window.localStorage.setItem('quiz-completed-by-user', 'invalid-json{{{');
    window.localStorage.setItem('quiz-outcome-by-user', 'invalid-json{{{');

    expect(readQuizCompletionState('Aaron')).toBe(false);
    expect(readUserQuizOutcome('Aaron')).toBeNull();
  });

  it('builds modal configs and handles quiz interaction triggers', () => {
    const setShowMessages = vi.fn();
    const setShowQuizEditor = vi.fn();
    const setShowQuizExperience = vi.fn();
    const setShowSpinMatch = vi.fn();
    const onQuizComplete = vi.fn();
    const onQuizRetake = vi.fn();
    const onQuizEdit = vi.fn();

    const modals = buildFeatureModals({
      showMessages: false,
      showQuizEditor: true,
      showQuizExperience: true,
      showSpinMatch: false,
      quizCompleted: false,
      currentUser: 'Aaron',
      setShowMessages,
      setShowQuizEditor,
      setShowQuizExperience,
      setShowSpinMatch,
      onQuizComplete,
      onQuizRetake,
      onQuizEdit,
    });

    const quizExperienceModal = modals.find((m) => m.key === 'quiz-experience');
    expect(quizExperienceModal).toBeDefined();
    expect(quizExperienceModal?.isOpen).toBe(true);

    const quizEditorModal = modals.find((m) => m.key === 'quiz-editor');
    expect(quizEditorModal).toBeDefined();
    expect(quizEditorModal?.isOpen).toBe(true);

    quizExperienceModal?.onClose();
    expect(setShowQuizExperience).toHaveBeenCalledWith(false);

    quizEditorModal?.onClose();
    expect(setShowQuizEditor).toHaveBeenCalledWith(false);
  });

  it('handles global window custom event dispatches for quiz, spin, and chat', () => {
    render(<AppWithProviders />);

    act(() => {
      window.dispatchEvent(new CustomEvent('open-quiz-experience'));
      window.dispatchEvent(new CustomEvent('open-spin-experience'));
      window.dispatchEvent(new CustomEvent('toggle-chat-panel'));
    });

    // Verify localStorage retains active tab state
    const savedState = window.localStorage.getItem(APP_VIEW_STATE_KEY);
    expect(savedState).not.toBeNull();
  });
});

describe('Workspace Tab Switching & Navigation State', () => {
  it('parses valid and legacy workspace tabs correctly', () => {
    expect(parseMainTab('movies')).toBe('movies');
    expect(parseMainTab('places')).toBe('movies');
    expect(parseMainTab('memories')).toBe('movies');
    expect(parseMainTab('messages')).toBe('messages');
    expect(parseMainTab('invalid-tab')).toBeNull();
    expect(parseMainTab('')).toBeNull();
    expect(parseMainTab(null)).toBeNull();
  });

  it('switches tabs and updates hash via useAppTabNavigation', () => {
    const onTabSwitch = vi.fn();
    const { result } = renderHook(() =>
      useAppTabNavigation({
        initialTab: 'movies',
        prefersReducedMotion: true,
        isMobile: false,
        onTabSwitch,
      }),
    );

    expect(result.current.activeTab).toBe('movies');

    act(() => {
      result.current.handleTabChange('messages');
    });

    expect(result.current.activeTab).toBe('messages');
    expect(onTabSwitch).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe('#messages');

    // Switching to the same tab should be a no-op
    act(() => {
      result.current.handleTabChange('messages');
    });
    expect(onTabSwitch).toHaveBeenCalledTimes(1);
  });

  it('responds to window hashchange events', () => {
    const { result } = renderHook(() =>
      useAppTabNavigation({
        initialTab: 'movies',
        prefersReducedMotion: true,
        isMobile: false,
      }),
    );

    act(() => {
      window.location.hash = '#messages';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(result.current.activeTab).toBe('messages');
  });

  it('reads stored app view state from localStorage correctly', () => {
    window.localStorage.setItem(
      APP_VIEW_STATE_KEY,
      JSON.stringify({ activeTab: 'messages', showMessages: true }),
    );

    const stored = readStoredAppViewState();
    expect(stored).toEqual({ activeTab: 'messages', showMessages: true });

    const initial = readInitialAppViewState();
    expect(initial.activeTab).toBe('messages');
  });

  it('identifies and strips launch url shortcuts', () => {
    window.history.pushState({}, '', '/?tab=messages&panel=messages#movies');

    expect(hasLaunchUrlShortcuts()).toBe(true);

    act(() => {
      stripLaunchUrlShortcuts();
    });

    expect(hasLaunchUrlShortcuts()).toBe(false);
  });
});

describe('Y2K CRT Power-On Entrance Animation', () => {
  it('initializes and triggers GSAP CRT power-on timeline on mount', () => {
    const onComplete = vi.fn();

    const TestCrtComponent = () => {
      const { ref } = useCrtEntranceAnimation<HTMLDivElement>({
        enabled: true,
        duration: 0.1,
        onComplete,
      });

      return <div ref={ref} data-testid="crt-screen">Content</div>;
    };

    render(<TestCrtComponent />);
    const screenElement = screen.getByTestId('crt-screen');
    expect(screenElement).toBeInTheDocument();
  });

  it('skips CRT animation and calls onComplete immediately when reduced motion is preferred', () => {
    // Mock reduced motion
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const onComplete = vi.fn();

    const TestCrtComponent = () => {
      const { ref } = useCrtEntranceAnimation<HTMLDivElement>({
        enabled: true,
        onComplete,
      });

      return <div ref={ref} data-testid="crt-screen-reduced">Content</div>;
    };

    render(<TestCrtComponent />);
    expect(screen.getByTestId('crt-screen-reduced')).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

