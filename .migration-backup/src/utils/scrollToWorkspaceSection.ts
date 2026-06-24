/** Scroll a workspace collection section into view below the bento control panel. */
export function scrollToWorkspaceSection(sectionId: string): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const section = document.getElementById(sectionId);
  if (!section) {
    return false;
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  section.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });

  if (!section.hasAttribute("tabindex")) {
    section.setAttribute("tabindex", "-1");
  }

  window.requestAnimationFrame(() => {
    section.focus({ preventScroll: true });
  });

  return true;
}
