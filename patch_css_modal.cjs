const fs = require('fs');

let content = fs.readFileSync('apps/web/src/app/component-styles.css', 'utf8');

// Replace the complex movie-details-modal__dialog
const oldDialog = `.movie-details-modal__dialog {
  position: absolute;
  top: calc(var(--movie-origin-top) + (var(--movie-origin-height) / 2));
  left: calc(var(--movie-origin-left) + (var(--movie-origin-width) / 2));
  width: var(--movie-origin-width);
  height: var(--movie-origin-height);
  max-width: calc(100vw - 2rem);
  max-height: calc(100dvh - 2rem);
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  background: transparent;
  box-shadow: 0 0 0 rgba(0, 0, 0, 0);
  transform: translate(-50%, -50%);
  transform-origin: center;
  transition:
    top 400ms cubic-bezier(0.16, 1, 0.3, 1),
    left 400ms cubic-bezier(0.16, 1, 0.3, 1),
    width 400ms cubic-bezier(0.16, 1, 0.3, 1),
    height 400ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 400ms cubic-bezier(0.16, 1, 0.3, 1),
    border-radius 320ms ease,
    border-color 320ms ease,
    box-shadow 400ms ease;
}`;

const newDialog = `.movie-details-modal__dialog {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(74rem, calc(100vw - 2.5rem));
  height: min(52rem, calc(100dvh - 2.5rem));
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 1.25rem;
  background: transparent;
  box-shadow: none;
  transform: translate(-50%, -50%) scale(0.95);
  transform-origin: center;
  opacity: 0;
  pointer-events: none;
  transition:
    transform 400ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 320ms ease;
}`;

content = content.replace(oldDialog, newDialog);

const oldIsOpen = `.movie-details-modal.is-open .movie-details-modal__dialog {
  top: 50%;
  left: 50%;
  width: min(74rem, calc(100vw - 2.5rem));
  height: min(52rem, calc(100dvh - 2.5rem));
  border-color: transparent;
  border-radius: 1.25rem;
  box-shadow: none;
  transform: translate(-50%, -50%);
}`;

const newIsOpen = `.movie-details-modal.is-open .movie-details-modal__dialog {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
  pointer-events: auto;
}`;

content = content.replace(oldIsOpen, newIsOpen);

fs.writeFileSync('apps/web/src/app/component-styles.css', content, 'utf8');
console.log("Patched CSS modal");
