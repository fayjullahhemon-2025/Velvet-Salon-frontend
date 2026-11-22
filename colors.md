# Color Palette 

## Raw Foundation Tokens
- `color.text.primary` = `#666666`
- `color.text.secondary` = `#333333`
- `color.text.tertiary` = `#ffffff`
- `color.text.inverse` = `#212529`
- `color.surface.base` = `#000000`
- `color.surface.muted` = `#d9842f`
- `color.surface.strong` = `#f1e7df`

---

## Semantic Color Tokens & Contrast Guardrails

All component stylesheets **must** reference semantic tokens below rather than raw hex values. Pairings enforce WCAG 2.2 AA contrast requirements ($\ge 4.5:1$ for normal text; $\ge 3.0:1$ for large text and UI components).

| Semantic Token | Mapped Source Token | Resolved Hex | Role & WCAG 2.2 AA Contrast Rule |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `color.surface.strong` | `#f1e7df` | Primary light storefront background. |
| `--bg-surface-card` | `color.text.tertiary` | `#ffffff` | Elevated product and service card surface. |
| `--bg-surface-dark` | `color.surface.base` | `#000000` | Hero banners, dark headers, and footer blocks. |
| `--bg-accent-brand` | `color.surface.muted` | `#d9842f` | Primary CTA fill, active badges, and highlights. |
| `--fg-primary` | `color.text.secondary` | `#333333` | Primary body copy on `--bg-canvas` (`10.7:1`) and `--bg-surface-card` (`12.6:1`). |
| `--fg-muted` | `color.text.primary` | `#666666` | Secondary metadata on `--bg-surface-card` (`5.74:1`). **Must not** be used on `--bg-canvas` for sub-`16px` regular text. |
| `--fg-inverse` | `color.text.tertiary` | `#ffffff` | Primary text on `--bg-surface-dark` (`21:1`). |
| `--fg-on-accent` | `color.text.inverse` | `#212529` | Text on `--bg-accent-brand` (`6.3:1`). |
| `--border-subtle` | Derived from `color.text.primary` (20%) | `rgba(102, 102, 102, 0.2)` | Card dividers and default input strokes. |
| `--border-focus` | `color.surface.muted` | `#d9842f` | Keyboard `:focus-visible` ring (`3.1:1` against `--bg-surface-dark`). |

---

## Prohibited Color Pairings
- **Do not** place `--fg-inverse` (`#ffffff`) on `--bg-accent-brand` (`#d9842f`) — achieves only `2.9:1` and fails WCAG 2.2 AA. Always pair `--fg-on-accent` (`#212529`) on `--bg-accent-brand`.
- **Do not** use raw hex values in component rules; always consume `--bg-*`, `--fg-*`, and `--border-*` semantic variables.