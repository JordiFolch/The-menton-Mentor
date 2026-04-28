# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

No build system or package manager. Serve locally with:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

There are no tests, linting tools, or CI configured.

## Architecture

Pure static site: three files, no framework, no dependencies.

- `index.html` — All page structure and content. Contains a `<style>` block with base/layout styles and an inline `mostraIdioma()` function at the bottom of `<body>`.
- `styles.css` — Component-level styles loaded after the inline block: modal, stats, testimonials, expertise grid, floating button.
- `script.js` — Loaded last. Defines `LanguageManager` and `ContactModal` classes, then re-declares and exports `mostraIdioma` via `window.mostraIdioma`, overriding the inline version.

### Multilingual content

All three languages (`ca`, `es`, `en`) are fully duplicated as separate `<div id="ca|es|en" class="idioma">` blocks inside `<main>`. Language switching hides/shows blocks via the `active` CSS class and stores the preference in `localStorage`. The contact modal (`ContactModal`) dynamically updates its own labels from the `LanguageManager.translations` object when opened, so modal strings must be kept in sync with those translations.

The `.stats` animated counter block (with `data-value` / `data-suffix` attributes) only exists in the `#ca` section. If it needs to appear in other languages, the same markup must be duplicated there.

### Dynamic DOM injection

`ContactModal` and the floating contact button are injected into `document.body` at `DOMContentLoaded` — they are not present in `index.html`. The scroll-to-top button is also created dynamically by `addScrollToTop()`.

### Contact form

Form submission is simulated with `setTimeout` — no backend or email service is wired up.

### Keyboard shortcuts

- `1` / `2` / `3` — switch to Català / Castellano / English
- `ESC` — close contact modal
