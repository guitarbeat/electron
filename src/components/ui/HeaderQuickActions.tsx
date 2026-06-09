import { type FC, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { RotateCw } from 'lucide-react';
import type { MainTab } from '@/shared/types';
import './HeaderQuickActions.css';

interface Props {
  activeTab: MainTab;
  onOpenSpin?: () => void;
}

const FilmIcon: FC = () => (
  <svg className="hqa__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
    <line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/>
    <line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/>
    <line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/>
    <line x1="17" y1="7" x2="22" y2="7"/>
  </svg>
);

const PinIcon: FC = () => (
  <svg className="hqa__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const HeaderQuickActions: FC<Props> = ({ activeTab, onOpenSpin }) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const items = Array.from(container.querySelectorAll<HTMLElement>('.hqa__item'));
    const cleanups = items.map((el) => {
      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - r.left - r.width / 2) * 0.38,
          y: (e.clientY - r.top - r.height / 2) * 0.38,
          ease: 'power2.out',
          duration: 0.4,
        });
      };
      const onLeave = () => gsap.to(el, { x: 0, y: 0, ease: 'elastic.out(1,0.3)', duration: 1.2 });
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
      return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
    });
    return () => cleanups.forEach((fn) => fn());
  }, [activeTab]);

  return (
    <nav ref={containerRef} className="hqa" aria-label="Quick navigation">
      <a href="#movies" className="hqa__item hqa__item--link">
        <FilmIcon />
        <span className="hqa__label">Browse Movies</span>
      </a>
      <a href="#places" className="hqa__item hqa__item--link">
        <PinIcon />
        <span className="hqa__label">Find Places</span>
      </a>
      {activeTab === 'movies' && onOpenSpin && (
        <button
          type="button"
          className="hqa__item hqa__item--spin"
          onClick={onOpenSpin}
          aria-label="Spin the wheel to pick a movie"
        >
          <RotateCw size={14} strokeWidth={2.2} aria-hidden="true" />
          <span className="hqa__label">Spin</span>
        </button>
      )}
    </nav>
  );
};

export default HeaderQuickActions;
