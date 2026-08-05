---
name: Electron cute.scss body::before overlay bug
description: The holographic border frame in _cute.scss used z-index 99990 with a solid interior fill, covering all React content. Fix uses CSS mask punch-through.
---

# Electron `body::before` Overlay Bug

## The Rule
`_cute.scss` defines `body::before` for the neon viewport border. Do NOT add a `padding-box` opaque fill to this element — it will act as a full-screen dark curtain covering all React content.

## Why
The original implementation:
```css
body::before {
  position: fixed; inset: 4px;
  border: 2.5px solid transparent;
  background:
    linear-gradient(#060819, #060819) padding-box,   /* ← WRONG: solid fill at z-index 99990 */
    linear-gradient(270deg, ...) border-box;
  z-index: 99990;
}
```
The `padding-box` fill with `z-index: 99990` made the pseudo-element an opaque dark overlay on top of all React content. The neon border was visible around the edges but the interior was a solid `#060819` block hiding everything.

## How to Apply
Use the CSS mask punch-through technique instead:
```css
body::before {
  position: fixed; inset: 4px;
  border-radius: 1.6rem;
  padding: 2.5px;           /* controls border thickness */
  border: none;
  background: linear-gradient(270deg, #ff2d78, #bf5af2, ...);
  pointer-events: none;
  z-index: 99990;
  /* Transparent hole — only the padding strip is visible */
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: destination-out;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
}
```
This keeps the neon border visible and fully transparent interior at any z-index.
