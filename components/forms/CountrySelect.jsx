'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { getCountryCallingCode } from 'react-phone-number-input';
// Same metadata react-phone-number-input already bundles (no extra size)
import metadata from 'libphonenumber-js/metadata.min.json';

/**
 * Country picker for <PhoneInput countrySelectComponent={CountrySelect} />.
 *
 * Unlike the library's default native <select>, the list shows each country's
 * flag and dialling code, and can be searched by name, ISO code or "+code".
 * Keyboard: Enter/Space/ArrowDown opens, type to filter, ArrowUp/ArrowDown
 * to move, Enter to pick, Escape to close.
 *
 * Props are supplied by react-phone-number-input: value, onChange, options
 * ([{ value, label, divider }]), iconComponent (the flag), disabled,
 * readOnly, onFocus, onBlur, name, aria-label.
 */
const callingCodeOf = (country) => {
  try {
    return country ? `+${getCountryCallingCode(country)}` : '';
  } catch {
    return '';
  }
};

// Lower-case and strip accents so "cote" finds "Côte d'Ivoire"
const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

// Main country for a shared dialling code, e.g. +44 -> GB, +1 -> US
const isMainCountryForCode = (country, code) =>
  metadata.country_calling_codes[code.replace('+', '')]?.[0] === country;

/**
 * Ranks an option against the search text (lower is better), or returns
 * null if it doesn't match:
 *   0 exact ISO code ("ca") or main country for a dialling code ("44", "+44")
 *   1 other countries with that dialling code
 *   2 name or a word in it starts with the text ("united", "kingdom")
 *   3 name contains the text
 */
const rank = (option, query) => {
  const q = normalize(query.trim());
  if (!q) return 0;
  const code = callingCodeOf(option.value);
  const name = normalize(option.label);

  if (option.value?.toLowerCase() === q) return 0;
  if (code && (code === q || code === `+${q}`)) {
    return isMainCountryForCode(option.value, code) ? 0 : 1;
  }
  if (name.startsWith(q) || name.split(/[\s(),.-]+/).some((w) => w.startsWith(q))) {
    return 2;
  }
  if (name.includes(q)) return 3;
  return null;
};

const CountrySelect = ({
  value,
  onChange,
  options,
  iconComponent: Flag,
  disabled,
  readOnly,
  onFocus,
  onBlur,
  name,
  'aria-label': ariaLabel = 'Country',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [opensUpward, setOpensUpward] = useState(false);

  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();

  const selected = options.find((o) => !o.divider && o.value === value);
  const selectedCode = callingCodeOf(value);

  // Dividers are only kept while not searching (they separate pinned countries).
  // Sorting is stable, so equally ranked results keep their original order.
  const visibleOptions = useMemo(() => {
    if (!query.trim()) return options;
    return options
      .filter((o) => !o.divider)
      .map((option) => ({ option, score: rank(option, query) }))
      .filter(({ score }) => score !== null)
      .sort((a, b) => a.score - b.score)
      .map(({ option }) => option);
  }, [options, query]);
  const selectable = visibleOptions.filter((o) => !o.divider);
  const optionId = (option) => `${listId}-${option.value ?? 'intl'}`;

  const open = () => {
    if (disabled || readOnly) return;
    setQuery('');
    const selectedIndex = options
      .filter((o) => !o.divider)
      .findIndex((o) => o.value === value);
    setActiveIndex(Math.max(selectedIndex, 0));
    // Open upwards when there isn't room for the list below the field
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpensUpward(spaceBelow < 340 && rect.top > spaceBelow);
    }
    setIsOpen(true);
  };

  const close = ({ restoreFocus = true } = {}) => {
    setIsOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  };

  const choose = (option) => {
    // The phone input takes focus after a country is picked
    // (focusInputOnCountrySelection), so don't move focus back to the button.
    close({ restoreFocus: false });
    onChange(option.value);
  };

  useEffect(() => {
    // preventScroll: focusing must not scroll the page (see below)
    if (isOpen) searchRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        close({ restoreFocus: false });
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  // Keep the highlighted option visible while navigating with the keyboard.
  // Only the list scrolls: element.scrollIntoView() would also scroll the
  // page, sliding the list under a resting mouse pointer.
  useEffect(() => {
    const list = listRef.current;
    const active = selectable[activeIndex];
    if (!isOpen || !list || !active) return;
    const item = document.getElementById(optionId(active));
    if (!item) return;
    if (item.offsetTop < list.scrollTop) {
      list.scrollTop = item.offsetTop;
    } else if (item.offsetTop + item.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = item.offsetTop + item.offsetHeight - list.clientHeight;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeIndex, query]);

  const handleButtonKeyDown = (event) => {
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      open();
    }
  };

  const handleSearchKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, selectable.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(selectable.length - 1);
        break;
      case 'Enter':
        event.preventDefault();
        if (selectable[activeIndex]) choose(selectable[activeIndex]);
        break;
      case 'Escape':
        event.preventDefault();
        close();
        break;
      case 'Tab':
        close({ restoreFocus: false });
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={rootRef}
      className="PhoneInputCountry relative"
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {name && <input type="hidden" name={name} value={value || ''} />}
      <button
        ref={buttonRef}
        type="button"
        className="flex items-center gap-2 rounded-lg pe-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:cursor-not-allowed disabled:opacity-60"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${ariaLabel}: ${selected ? `${selected.label} ${selectedCode}` : 'International'}. Change country`}
        disabled={disabled}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={handleButtonKeyDown}
      >
        <Flag aria-hidden="true" country={value} label={selected?.label ?? 'International'} />
        <span className="text-base text-neutral-600 tabular-nums">
          {selectedCode}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={`h-4 w-4 text-neutral-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="currentColor"
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 z-30 w-[min(20rem,calc(100vw-3rem))] overflow-hidden rounded-xl border border-gray-300 bg-white text-base shadow-xl ${
            opensUpward ? 'bottom-full mb-3' : 'top-full mt-3'
          }`}
        >
          <div className="border-b border-gray-200 p-2">
            <input
              ref={searchRef}
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={
                selectable[activeIndex] ? optionId(selectable[activeIndex]) : undefined
              }
              aria-label="Search countries"
              placeholder="Search country or code"
              autoComplete="off"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            className="relative max-h-64 overflow-y-auto py-1"
          >
            {selectable.length === 0 && (
              <li className="px-3 py-2 text-neutral-500">No countries found</li>
            )}
            {visibleOptions.map((option, index) => {
              if (option.divider) {
                return (
                  <li
                    key={`divider-${index}`}
                    role="separator"
                    className="my-1 border-t border-gray-200"
                  />
                );
              }
              const isActive = selectable[activeIndex] === option;
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value ?? 'intl'}
                  id={optionId(option)}
                  role="option"
                  aria-selected={isSelected}
                  className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${
                    isActive ? 'bg-alternate/30' : ''
                  } ${isSelected ? 'font-bold' : ''}`}
                  // mousemove (not mouseenter) so only real pointer movement
                  // changes the highlight, not the list moving under the mouse
                  onMouseMove={() => {
                    const index = selectable.indexOf(option);
                    if (index !== activeIndex) setActiveIndex(index);
                  }}
                  // mousedown (not click) so the search input doesn't blur first
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(option);
                  }}
                >
                  <Flag aria-hidden="true" country={option.value} label={option.label} />
                  <span className="flex-1 truncate">{option.label}</span>
                  <span className="text-neutral-500 tabular-nums">
                    {callingCodeOf(option.value)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CountrySelect;
