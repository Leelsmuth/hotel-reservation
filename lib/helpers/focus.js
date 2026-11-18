/**
 * Focus helpers for keyboard users.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Visible, enabled, tabbable elements inside `container`, in DOM order. */
export const getFocusable = (container) =>
  container
    ? [...container.querySelectorAll(FOCUSABLE)].filter(
        (el) => el.getClientRects().length > 0
      )
    : [];

/**
 * Moves focus to an element that isn't normally focusable (a heading, or
 * <main> for the skip link) so screen readers start reading there.
 *
 * The temporary tabindex="-1" is removed again on blur. If it stayed, every
 * mouse click on plain text inside the element would focus the element
 * itself, and Tab / Shift+Tab would then restart from its top instead of
 * from where the user clicked.
 */
export const focusWithoutTabStop = (
  element,
  { preventScroll = false } = {}
) => {
  if (!element) return;
  if (!element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '-1');
    element.addEventListener(
      'blur',
      () => element.removeAttribute('tabindex'),
      { once: true }
    );
  }
  element.focus({ preventScroll });
};

/**
 * Keeps Tab and Shift+Tab inside `container` (modal dialogs, the mobile
 * menu). Call from a keydown handler; returns true if it moved focus.
 *
 * Wraps from the last element to the first and back, and also handles focus
 * being on the container itself or outside it (e.g. after clicking plain
 * text in a dialog), where the browser would otherwise move focus to the
 * page behind.
 */
export const trapTabKey = (event, container) => {
  if (event.key !== 'Tab' || !container) return false;
  const focusable = getFocusable(container);
  if (focusable.length === 0) {
    event.preventDefault();
    return true;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  const isInside = container.contains(active) && active !== container;

  if (event.shiftKey && (!isInside || active === first)) {
    event.preventDefault();
    last.focus();
    return true;
  }
  if (!event.shiftKey && (!isInside || active === last)) {
    event.preventDefault();
    first.focus();
    return true;
  }
  return false;
};
