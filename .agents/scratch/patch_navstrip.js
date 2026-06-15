const fs = require('fs');
const path = 'artifacts/electron/src/components/ui/AppNavStrip.tsx';
let content = fs.readFileSync(path, 'utf8');

const importReplacement = `import { type FC, useRef, useEffect, useMemo, useState } from 'react';
import { gsap } from 'gsap';
import { RefreshCw, RotateCw, SatelliteDish, WifiOff, X } from 'lucide-react';
import type { MainTab } from '@/shared/types';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import { MagicToggle } from './MagicToggle';
import './AppNavStrip.css';`;

content = content.replace(/import \{ type FC[\s\S]*?\.\/AppNavStrip\.css';/, importReplacement);

const buttonsSearch = `<button
        type="button"
        className={\`ans__btn\${activeTab === 'movies' ? ' is-active' : ''}\`}
        onClick={() => onTabChange('movies')}
        aria-current={activeTab === 'movies' ? 'page' : undefined}
      >
        <span className="ans__btn-glyph" aria-hidden="true">🎬</span>
        <span className="ans__btn-label">Movies</span>
      </button>

      <span className="ans__sep" aria-hidden="true" />

      <button
        type="button"
        className={\`ans__btn\${activeTab === 'places' ? ' is-active' : ''}\`}
        onClick={() => onTabChange('places')}
        aria-current={activeTab === 'places' ? 'page' : undefined}
      >
        <span className="ans__btn-glyph" aria-hidden="true">📍</span>
        <span className="ans__btn-label">Places</span>
      </button>`;

const toggleReplacement = `<div className="ans__magic-toggle-wrapper">
        <MagicToggle
          options={[
            { value: 'movies', label: '🎬 Movies' },
            { value: 'places', label: '📍 Places' }
          ]}
          activeValue={activeTab}
          onChange={(val) => onTabChange(val as MainTab)}
          ariaLabel="Workspace navigation"
        />
      </div>`;

content = content.replace(buttonsSearch, toggleReplacement);
fs.writeFileSync(path, content);
