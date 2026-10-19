# CHANGES

Modifications to drawDB (drawdb-io/drawdb, base commit 7683bdf, 2026-10-16), as required by AGPL-3.0 section 5a.
The modified source is in `upstream/`. Build and deploy scripts are in `scripts/`.

drawDB 수정 내역입니다(AGPL-3.0 제5조 a항). 수정한 소스는 `upstream/` 에 있고 빌드와 배포 스크립트는 `scripts/` 에 있습니다.

## 2026-10-19

### Network calls removed (a)

- `src/api/gists.js` and `src/api/email.js` are replaced by stubs that throw a "device-only" error. No axios.
- The share window (`EditorHeader/Modal/Share.jsx`) now only says that this build has no server sharing.
- The header Share button and the versions toolbar button are removed.
- `src/config/index.js`: backend URLs are empty. `src/data/socials.js`: the GitHub star count call is gone.
- `@vercel/analytics` and `axios` are removed from `package.json`.
- Result: opening the editor and drawing a table and a relation makes 0 network requests (other than our one step counter, see below).

### Routing (b)

- `src/App.jsx`: HashRouter instead of BrowserRouter. `/` and unknown paths go to `/editor`.
- `vite.config.js`: `base: "/open/"`.
- The landing page, bug report page, templates page, not-found page, navbar and migration banner are removed.

### Language (c)

- `src/i18n/i18n.js`: default language is the saved choice, else Korean for a Korean browser, else English.
- Items the upstream Korean translation leaves empty stay English. The About window says so.

### Names and logos (d)

- `index.html`, titles, meta tags, favicon, logos and the social card image are replaced. The upstream name appears only in this file set (NOTICE, CHANGES.md, LICENSE) and in the About window.
- `package.json` name is `erd-editor`. The IndexedDB name is `erd-local`. The dismissed-banner key is `erd:dismissedBanners`.

### About and License window (e)

- New `EditorHeader/Modal/About.jsx`. It shows the original author, the AGPL-3.0 notice, no warranty, the `/LICENSE.txt` link, the source link and the deployed commit hash. Korean and English strings are in `src/i18n/locales/ko.js` and `en.js`.
- The Help menu now has only this item. Hotkey `mod+h` opens it.

### Self-hosting and instrumentation

- Monaco Editor is served from `/open/vs` (`src/main.jsx`, `loader.config`) instead of a CDN.
- Font Awesome Free 6.5.2 and Bootstrap Icons 1.11.1 are bundled from npm instead of CDN links.
- New `src/utils/erdStep.js`: after an export it dispatches a DOM event `erd:step` with the step name `export`. It carries no diagram data. The page shell counts it with one request to `/api/track`.
- `Modal.jsx` and `ControlPanel.jsx` call it after image, file and PDF exports.
- `Workspace.jsx`: document title is `ERD`.

### Build

- `scripts/build-editor.mjs` overlays `upstream/` on a clean upstream clone, builds with vite, copies `dist` and the Monaco files to `public/open/`, and writes the deployed commit hash into `index.html` and the About window.
