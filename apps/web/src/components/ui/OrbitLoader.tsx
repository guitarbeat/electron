import { USER_PHOTOS } from "@/shared/types";
import "@/app/styles/orbit-loader.css";

export function OrbitLoader({ fullViewport = false }: { fullViewport?: boolean }) {
  return (
    <div className={`orbit-loader${fullViewport ? " orbit-loader--viewport" : ""}`} role="status" aria-live="polite">
      <div className="orbit-loader__scene" aria-hidden="true">
        <div className="orbit-loader__track" />
        <svg className="orbit-loader__reel" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="29" stroke="currentColor" strokeWidth="3" />
          <circle cx="32" cy="32" r="5" fill="currentColor" />
          {[ [32, 14], [50, 32], [32, 50], [14, 32] ].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="7" stroke="currentColor" strokeWidth="3" />)}
        </svg>
        <div className="orbit-loader__orbit">
          <div className="orbit-loader__face orbit-loader__face--aaron"><img src={USER_PHOTOS.Aaron} alt="" width="56" height="56" /></div>
          <div className="orbit-loader__face orbit-loader__face--electra"><img src={USER_PHOTOS.Electra} alt="" width="56" height="56" /></div>
        </div>
      </div>
      <p className="orbit-loader__names" aria-hidden="true">Aaron &amp; Electra</p>
      <p className="orbit-loader__label">Loading movie night<span aria-hidden="true" className="orbit-loader__dots">...</span></p>
    </div>
  );
}
