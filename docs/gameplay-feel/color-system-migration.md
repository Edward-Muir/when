# Color System Migration

## Overview

Migrated from scattered hardcoded colors to a centralized CSS custom property system, making future palette changes trivial.

## Before

Colors were defined in multiple places:

- `tailwind.config.js` had separate `light-*` and `dark-*` tokens
- Components used paired classes like `bg-light-bg dark:bg-dark-bg`
- Some colors were hardcoded (e.g., `bg-blue-500`)
- Changing the palette required editing many files

## After

Colors are now defined in one place (`src/index.css`) as CSS custom properties:

```css
:root {
  --color-bg: #e4e4e4;
  --color-surface: #f0f0f0;
  --color-text: #001524;
  --color-text-muted: #4a5568;
  --color-border: #c8c8c8;
  --color-accent: #b8860b;
  --color-accent-secondary: #15616d;
  --color-success: #6aaa64;
  --color-error: #e57373;
}

.dark {
  --color-bg: #0d1b2a;
  --color-surface: #1b2838;
  --color-text: #e4e4e4;
  --color-text-muted: #94a3b8;
  --color-border: #2d3f50;
  --color-accent: #d4a84b;
  --color-accent-secondary: #22a0b0;
  --color-success: #7abf70;
  --color-error: #f87171;
}
```

Tailwind references these variables:

```javascript
colors: {
  'bg': 'var(--color-bg)',
  'surface': 'var(--color-surface)',
  'text': 'var(--color-text)',
  // etc.
}
```

## Color Roles

| Token              | Purpose                          | Light   | Dark    |
| ------------------ | -------------------------------- | ------- | ------- |
| `bg`               | Page background                  | #e4e4e4 | #0d1b2a |
| `surface`          | Cards, modals, elevated surfaces | #f0f0f0 | #1b2838 |
| `text`             | Primary text                     | #001524 | #e4e4e4 |
| `text-muted`       | Secondary/helper text            | #4a5568 | #94a3b8 |
| `border`           | Dividers, borders                | #c8c8c8 | #2d3f50 |
| `accent`           | Primary accent (goldenrod)       | #b8860b | #d4a84b |
| `accent-secondary` | Secondary accent (teal)          | #15616d | #22a0b0 |
| `success`          | Correct placement feedback       | #6aaa64 | #7abf70 |
| `error`            | Wrong placement feedback         | #e57373 | #f87171 |

## Migration Pattern

### Before

```tsx
<div className="bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
  <button className="bg-blue-500 dark:bg-blue-400">
```

### After

```tsx
<div className="bg-bg text-text">
  <button className="bg-accent-secondary">
```

## Files Changed

### Configuration

- `src/index.css` - Added CSS custom properties, updated body/scrollbar styles
- `tailwind.config.js` - Replaced colors object to reference CSS variables

### Components (16 files)

- ModeSelect.tsx
- Game.tsx
- Menu.tsx
- SettingsPopup.tsx
- Timeline/Timeline.tsx
- Timeline/TimelineEvent.tsx
- TopBar.tsx
- Card.tsx
- Toast.tsx
- GamePopup.tsx
- ResultBanner.tsx
- GameStartTransition.tsx
- GameOverControls.tsx
- PlayerInfo.tsx
- ActiveCardDisplay.tsx

## Benefits

1. **Single source of truth** - All colors defined in one place
2. **Easy palette swapping** - Change colors in `:root` and `.dark` blocks only
3. **No class duplication** - `bg-bg` instead of `bg-light-bg dark:bg-dark-bg`
4. **Runtime theme switching** - CSS variables update instantly
5. **Simpler component code** - Fewer conditional dark mode classes

## How to Change Colors

1. Open `src/index.css`
2. Find the `:root` block for light mode colors
3. Find the `.dark` block for dark mode colors
4. Update the hex values
5. Changes apply immediately across the entire app

## Category Colors

Category colors (conflict=red, disasters=gray, exploration=teal, etc.) were intentionally left as standard Tailwind colors. They're only used in EventModal.tsx for small category badges and don't need to be part of the theming system.
