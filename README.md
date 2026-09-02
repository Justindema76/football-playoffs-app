# Fantasy Football 2026

Canonical source for the Fantasy Football 2026 app.

## Production

https://fantasy-intel-justinnovate.vercel.app/

## Source of truth

- `index.html` — application structure
- `styles.css` — all layout and responsive CSS
- `app.js` — Supabase data loading, filtering, rendering, and target updates

## Layout rules

- Draft is the only wide desktop view, capped at 1500px and centered.
- Intel, Players, Targets, Cowbell, Injuries, and Weather use the normal 980px content width.
- Draft uses 4 tier columns on wide desktop, 3 at <=1320px, 2 at <=1040px, and 1 on mobile.
- Mobile never inherits the desktop-wide Draft container.
- Yahoo rank is the authoritative Draft order. Tags do not reorder players.

## Development rule

Do not add one-off CSS overrides or duplicate HTML entry points. Modify the canonical files above, test the affected desktop and mobile layouts, then deploy the same source to the production alias.
