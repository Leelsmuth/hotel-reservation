# Design system

One visual language for every page. Before you add UI, reuse what's here.

## Foundations

**Colour** (`tailwind.config.js`). Each token has a job; contrast was checked
for every text/background pair used.

| Token       | Use                                                        |
| ----------- | ---------------------------------------------------------- |
| `ink-900`   | Body text, headings, dark surfaces (footer, active states) |
| `ink-600`   | Secondary text (7.8:1 on white)                            |
| `ink-500`   | Lightest allowed for small text on white (5.5:1)           |
| `ink-400`   | Form-control borders (3.6:1; non-text minimum is 3:1)      |
| `ink-100/200` | Dividers and card borders (decorative only)              |
| `gold-400`  | Primary buttons (ink text on it: 8.3:1)                    |
| `gold-700`  | Gold text and links on white (5.6:1), focus outline        |
| `gold-300`  | Gold text on dark backgrounds (10.6:1 on ink-900)          |
| `sand-50/100` | Page-header bands and soft panels                        |

Don't put white text on gold, or body text in `ink-400` or lighter.
Status colours (success/warning/error/info) live only in `Alert`, `Badge`
and `Toast`, which already use AA-compliant shades.

**Type.** Headings use `font-display` (Playfair Display, bundled locally in
`app/fonts`). Everything else uses `font-sans` (Geist). Page titles are set by
`PageHeader`; section titles by `SectionHeading`. Keep body copy to
`max-w-prose` (about 68 characters per line).

**Layout.** `Container` is the only page-width wrapper (max 1280px, 16/24/32px
gutters). Sections use `py-16 sm:py-20`; cards use `p-5 sm:p-6`. Responsive
grids need `grid-cols-1` as their base so long content can't push the page
wider than the screen.

**Images.** Room photos are 3:2. Show them in `aspect-[3/2]` boxes with
`next/image` `fill` + `sizes`. The facility photos are only 167px wide, so
keep them thumbnail-sized.

## Components

| Need                              | Use                                                            |
| --------------------------------- | -------------------------------------------------------------- |
| Any button or button-like link    | `ui/Button` (`primary`, `secondary`, `dark`, `ghost`, `danger`, `danger-outline`, `light`; `href` makes it a link; `loading`) |
| Text input with label/hint/error  | `forms/Field` → `TextField`, or `Field` around a select/phone input |
| Raw controls                      | `.form-input`, `.form-select`, `.form-label`, `.form-hint`, `.form-error` (globals.css) |
| Inline feedback on a page         | `ui/Alert` (`info`, `success`, `warning`, `error`, `neutral`)  |
| Transient feedback                | `useToast().showToast(message, type)`                          |
| Status pill                       | `ui/Badge`                                                     |
| Dialog                            | `ui/Modal` (focus trap, Escape, scroll lock, labelled)         |
| Loading                           | `ui/LoadingState` (inline, or `overlay` while submitting)      |
| Nothing to show                   | `ui/EmptyState`                                                |
| Page title area                   | `ui/PageHeader` (breadcrumbs, eyebrow, title, description)     |
| Icons                             | `ui/Icon` (inherits text colour)                               |
| Room listings                     | `cards/RoomCard`, `cards/RoomGrid`                             |
| Room data (names, URLs, prices)   | `lib/static/roomCatalog.js`; don't hard-code prices             |
| Prices, dates                     | `lib/helpers/formatters.js` (`formatPrice`, `formatStayDate`, …) |
| Booking flow                      | `booking/BookingSteps`, `StaySummary`, `PriceBreakdown`, `PricingExplainer`, `DiscountTiers`, `BookingPolicies` |

The old `StyledButton`, `AltStyledButton`, `StyledLink`, `AltStyledLink` and
`RoomHomeCard` still work; they now render the components above.

## Accessibility checklist

- Every control has a visible label tied to it (`htmlFor`/`id`); errors use
  `aria-invalid` + `aria-describedby` (handled by `Field`).
- Don't remove the global `:focus-visible` outline.
- Interactive targets are at least 44px tall (`Button` sizes `md`/`lg`, form
  controls).
- Keep DOM order = reading order. To move a sidebar on large screens, use
  grid placement (`lg:col-start-2 lg:row-start-1`), not `order-*`.
- Don't leave `tabIndex={-1}` on containers or headings. A click on plain
  text inside them focuses the whole element, and Tab/Shift+Tab then restart
  from its top. To move focus somewhere non-interactive (skip link, a step
  heading), use `focusWithoutTabStop()` from `lib/helpers/focus.js`.
- Dialogs and drawers trap focus with `trapTabKey()` from the same file.
- Respect `prefers-reduced-motion` (global CSS already shortens animations).
