/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ResilientImage, Y2kImage, Y2kPlaceholderGraphic } from '@/ui';
import { useResilientImage } from '@/hooks';

describe('useResilientImage Hook', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('initializes with primary source if valid', () => {
    const { result } = renderHook(() =>
      useResilientImage({
        src: 'https://example.com/poster.jpg',
        seed: 'Test Movie',
      })
    );

    expect(result.current.currentSrc).toBe('https://example.com/poster.jpg');
    expect(result.current.isPrimary).toBe(true);
    expect(result.current.isCatFallback).toBe(false);
    expect(result.current.isGraphicPlaceholder).toBe(false);
  });

  it('falls back to Cat API poster when primary source errors', () => {
    const { result } = renderHook(() =>
      useResilientImage({
        src: 'https://example.com/broken-poster.jpg',
        seed: 'Sci-Fi Classic',
      })
    );

    // Simulate image error event
    act(() => {
      result.current.handleError({} as React.SyntheticEvent<HTMLImageElement>);
    });

    expect(result.current.isPrimary).toBe(false);
    expect(result.current.isCatFallback).toBe(true);
    expect(result.current.currentSrc).toMatch(/cdn2\.thecatapi\.com/);
    expect(result.current.isGraphicPlaceholder).toBe(false);
  });

  it('falls back to graphic placeholder when fallback also errors', () => {
    const { result } = renderHook(() =>
      useResilientImage({
        src: 'https://example.com/broken.jpg',
        seed: 'Lost Media 1957',
      })
    );

    // Primary fails
    act(() => {
      result.current.handleError({} as React.SyntheticEvent<HTMLImageElement>);
    });

    // Cat fallback fails
    act(() => {
      result.current.handleError({} as React.SyntheticEvent<HTMLImageElement>);
    });

    expect(result.current.isGraphicPlaceholder).toBe(true);
    expect(result.current.status).toBe('fallback-error');
  });

  it('defaults to cat fallback immediately if src is N/A or empty', () => {
    const { result } = renderHook(() =>
      useResilientImage({
        src: 'N/A',
        seed: 'Retro Sci-Fi',
      })
    );

    expect(result.current.isPrimary).toBe(false);
    expect(result.current.isCatFallback).toBe(true);
    expect(result.current.currentSrc).toMatch(/cdn2\.thecatapi\.com/);
  });
});

describe('ResilientImage / Y2kImage Component', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders primary image correctly', () => {
    render(
      <ResilientImage
        src="https://example.com/good-movie.jpg"
        alt="Good Movie"
        title="Good Movie"
        year="1999"
      />
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/good-movie.jpg');
    expect(img).toHaveAttribute('alt', 'Good Movie');
  });

  it('automatically swaps to Cat API poster on image error', () => {
    render(
      <Y2kImage
        src="https://example.com/dead-link.jpg"
        alt="The Brain from Planet Arous"
        title="The Brain from Planet Arous"
        year="1957"
      />
    );

    const img = screen.getByRole('img');
    fireEvent.error(img);

    const updatedImg = screen.getByRole('img');
    expect(updatedImg.getAttribute('src')).toMatch(/cdn2\.thecatapi\.com/);
    expect(updatedImg).toHaveAttribute('data-is-cat-fallback', 'true');
  });

  it('renders Y2K placeholder graphic when all sources fail', () => {
    render(
      <ResilientImage
        src="https://example.com/dead-link.jpg"
        alt="Ultra Rare Movie"
        title="Ultra Rare Movie"
        year="1957"
      />
    );

    const img = screen.getByRole('img');
    // First error: swaps to Cat API
    fireEvent.error(img);

    const catImg = screen.getByRole('img');
    // Second error: Cat API also fails
    fireEvent.error(catImg);

    // Should now show Y2K placeholder graphic
    expect(screen.getByTestId('y2k-placeholder-graphic')).toBeInTheDocument();
    expect(screen.getByText('Ultra Rare Movie')).toBeInTheDocument();
    expect(screen.getByText('[1957]')).toBeInTheDocument();
  });
});

describe('Y2kPlaceholderGraphic', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders themed HUD scanlines, title, and year', () => {
    render(
      <Y2kPlaceholderGraphic
        title="Plan 9 From Outer Space"
        year="1959"
        badgeLabel="Y2K // VHS"
      />
    );

    expect(screen.getByText('Plan 9 From Outer Space')).toBeInTheDocument();
    expect(screen.getByText('[1959]')).toBeInTheDocument();
    expect(screen.getByText('Y2K // VHS')).toBeInTheDocument();
    expect(screen.getByText('SIGNAL LOST // RECOVERY MODE')).toBeInTheDocument();
  });
});
