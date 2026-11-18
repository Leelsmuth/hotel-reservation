'use client';

import { focusWithoutTabStop } from '@/lib/helpers/focus';

/**
 * "Skip to main content" link, shown when focused. Moves focus into the
 * target without leaving a permanent tabindex on it (see focusWithoutTabStop).
 */
const SkipLink = ({
  targetId = 'main-content',
  children = 'Skip to main content',
}) => (
  <a
    href={`#${targetId}`}
    onClick={(event) => {
      const target = document.getElementById(targetId);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView();
      focusWithoutTabStop(target, { preventScroll: true });
    }}
    className="sr-only z-[80] rounded-lg bg-ink-900 px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:px-4 focus:py-3 focus:shadow-popover"
  >
    {children}
  </a>
);

export default SkipLink;
