import { type FC, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { RotateCw } from 'lucide-react';
import type { MainTab } from '@/shared/types';
import './FlowNav.css';

interface Props {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onOpenSpin?: () => void;
}

const FlowNav: FC<Props> = ({ activeTab, onTabChange, onOpenSpin }) => {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const btns = Array.from(nav.querySelectorAll<HTMLElement>('.flownav__btn'));
    const cleanups = btns.map((el) => {
      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - r.left - r.width / 2) * 0.3,
          y: (e.clientY - r.top - r.height / 2) * 0.3,
          ease: 'power2.out', duration: 0.35,
        });
      };
      const onLeave = () => gsap.to(el, { x: 0, y: 0, ease: 'elastic.out(1,0.3)', duration: 1.1 });
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
      return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
    });
    return () => cleanups.forEach(fn => fn());
  }, [activeTab]);

  return (
    <nav ref={navRef} className="flownav" aria-label="Primary navigation">
      <span className="flownav__brand" aria-label="Electron">
        <span className="flownav__brand-glyph" aria-hidden="true">◈</span>
        Electron
      </span>

      <span className="flownav__sep" aria-hidden="true" />

      <button
        type="button"
        className={`flownav__btn${activeTab === 'movies' ? ' is-active' : ''}`}
        onClick={() => onTabChange('movies')}
        aria-current={activeTab === 'movies' ? 'page' : undefined}
      >
        <span className="flownav__btn-glyph" aria-hidden="true">🎬</span>
        <span className="flownav__btn-label">Movies</span>
      </button>

      <span className="flownav__sep" aria-hidden="true" />

      <button
        type="button"
        className={`flownav__btn${activeTab === 'places' ? ' is-active' : ''}`}
        onClick={() => onTabChange('places')}
        aria-current={activeTab === 'places' ? 'page' : undefined}
      >
        <span className="flownav__btn-glyph" aria-hidden="true">📍</span>
        <span className="flownav__btn-label">Places</span>
      </button>

      {activeTab === 'movies' && onOpenSpin && (
        <>
          <span className="flownav__sep" aria-hidden="true" />
          <button
            type="button"
            className="flownav__btn flownav__btn--spin"
            onClick={onOpenSpin}
            aria-label="Spin the wheel to pick a movie"
          >
            <RotateCw size={13} strokeWidth={2.4} aria-hidden="true" />
            <span className="flownav__btn-label">Spin</span>
          </button>
        </>
      )}
    </nav>
  );
};

export default FlowNav;
