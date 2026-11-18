'use client';

import { useState } from 'react';
import Icon from './Icon';

/** Copies `value` to the clipboard and confirms it (announced to screen readers). */
const CopyButton = ({ value, label = 'Copy' }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (e.g. insecure context): the ID is still selectable
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      disabled={!value}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-ink-300 bg-white px-3 text-sm font-semibold text-ink-800 transition-colors hover:border-ink-900 disabled:opacity-50"
    >
      <Icon name={copied ? 'check' : 'copy'} className="h-4 w-4" />
      <span aria-live="polite">{copied ? 'Copied' : label}</span>
    </button>
  );
};

export default CopyButton;
