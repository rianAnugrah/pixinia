# Pixinia product redesign

The reader experience uses a shared ink, paper, and amber theme. Editorial typography distinguishes story titles from interface labels; existing story artwork remains the primary visual content.

## Main changes

- Home adapts its primary action to existing progress: returning readers can resume directly.
- Explore has one cover-led results grid, combined title/genre/tag search, format and genre filters, alphabetical sorting, result feedback, and reset states.
- Story detail presents reading and saving before synopsis and rating. The story title is the page's single main heading.
- Studio presents every story available to the current role. Admins see all stories; creators retain ownership filtering and existing authorization.
- Studio supports title search, publication-state filters, cover previews, direct editor links, and a native modal for creating drafts. Escape and focus containment use the browser's dialog behavior.
- On mobile, the Studio introduction and summary are compact. Large chapter lists scroll within the editor sidebar.
- Existing reader paper/night preferences are retained. Motion respects reduced-motion preferences.

## Theme maintenance

Colors and aliases live in `tokens/product-theme.json`; the CSS layer is `src/app/product-design.css`. The established reader and editor styles consume these aliases.

Run `node scripts/check-product-theme.mjs` after palette changes. It verifies CSS/source consistency and 15 actual foreground/background contrast pairs, including paper and night reading surfaces. These source checks do not establish complete WCAG conformance.

## Validation

- `pnpm typecheck`: passed.
- `pnpm lint`: no errors; the existing `loading-image.tsx` native image warning remains.
- `pnpm test`: 31 tests passed, including combined Studio and discovery filtering/reset behavior.
- Browser checks: authenticated Studio lists six stories; title search and reset; draft modal open/Escape; discovery search; story detail and admin access to another story's editor.
- Layout inspected at 1280 and 390 pixels. Studio document overflow checked at 280 and 390 pixels.
- Adversarial screenshot review prompted a compact mobile Studio header, visible mobile result feedback, and larger bottom-navigation labels.

The external skill kit's `accuracy_report.mjs` expects its own example files and script layout. Running it from this repository returned 0/52 because those fixtures are absent; it is not an application verification result. Application checks above are reported separately. No complete screen-reader audit, production build, publishing, purchasing, or live content mutation was performed.
