import type { Dict, Rich } from "./ko";

/**
 * en = English dictionary. Same shape as ko (`Dict`). Not a translation: direct "you", short imperatives,
 * the way people talk about a free ER diagram tool in the browser. Only things we actually clicked are described.
 * There is no notation switch (IE, Barker, Chen) in this upstream, so it is not claimed.
 */
export const en: Dict = {
  title: "ERD Maker, a free ER diagram editor",
  otherLang: { href: "/", label: "한국어" },

  home: {
    h1: "Free ER diagrams with no sign-up",
    lead: "Draw tables and relations in your browser and make an ER diagram, with no sign-up.",
    promise: "Your diagram is saved in this browser only. Nothing is sent to a server.",
    openCta: "Start drawing an ERD",
    openNote: "The first open downloads the editor files. They are sent compressed.",
    howTitle: "How it works",
    howSteps: [
      "Hit Start drawing an ERD. A window asks which database you use.",
      "Hit Add table, then type the columns.",
      "Drag a column dot onto another table to join them with a relation.",
      "Open File, then Export, to get a PNG, PDF or SQL file.",
    ],
    fitTitle: "Good for",
    fitBody: [
      "An ERD for a database class assignment",
      "ERD practice for a certification exam",
      "Sketching a table layout with a small team",
    ],
    limitTitle: "Good to know",
    limitBody: [
      "This is not the official build. It is an unofficial build of the upstream editor that keeps storage on your device.",
      "Server sharing and import links are removed. Export a file to use a diagram elsewhere.",
      "There is no switch for textbook notations (IE, Barker, Chen).",
      "Items the upstream Korean translation left empty show in English.",
      "Clearing browser storage also clears your diagrams. Export the ones that matter.",
    ],
    shareLabel: "ERD Maker, a free ER diagram editor",
    shareCta: "Copy this page link",
    shareDone: "Copied",
    siblingTitle: "More from us",
    siblingDesc: "Other services from the same maker.",
    siblings: [
      { href: "https://grid.gwirae.com/", label: "Gridcraft, a free web spreadsheet" },
      { href: "https://gwirae.com/apps", label: "All apps" },
    ],
    footer: { guide: "Guide", credits: "Credits and licenses", privacy: "Privacy policy", gwirae: "gwirae.com" },
  },

  guide: {
    h1: "How to use ERD Maker",
    lead: "Six steps, in the order we clicked through them.",
    tocLabel: "Contents",
    s1Title: "What this editor does",
    s1Body: [
      "It draws tables and relations into an ER diagram. No sign-up, nothing to install.",
      "The editor is a modified build of an open-source editor. The credits page lists the original and our changes.",
    ],
    s2Title: "Getting started",
    s2Body: [
      "Hit Start drawing an ERD on the home page to open the editor.",
      "A window asks for your database first. Pick MySQL, PostgreSQL, SQLite, MariaDB, MSSQL, Oracle SQL or Generic.",
      "The screen language follows your browser. A Korean browser opens in Korean.",
    ],
    s3Title: "Tables and relations",
    s3Body: [
      "Hit Add table to get a table with an id column. The id is the primary key and cannot be empty.",
      "Drag the dot at the right of a column onto a dot on another table to join them.",
      "Once joined, the relation count goes up in the sidebar tab and a foreign key label appears.",
    ],
    s4Title: "Saving",
    s4Body: [
      "Your diagram saves to this browser by itself. The screen shows the last save time.",
      "Nothing goes to a server. Open the same browser on the same device to keep drawing.",
      "Clearing browser data removes it, so export the ones that matter.",
    ],
    s5Title: "Exporting",
    s5Body: [
      "File, then Export, offers PNG, JPEG, SVG, JSON, DBML, PDF, Mermaid and Markdown.",
      "For an assignment, a PNG or PDF works.",
      "Exporting as SQL has its own item in the File menu.",
    ],
    s6Title: "When you are stuck",
    s6Body: [
      "If the screen goes blank, reload. Very old browsers may not open it.",
      "Items the upstream Korean translation left empty show in English.",
      "Do not report problems from this site to the original project. This build has changes it does not know about.",
    ],
    jsonHeadline: "How to use ERD Maker",
    jsonDesc: "Starting the ER diagram editor, tables and relations, saving, exporting and fixing problems.",
    breadcrumbHome: "ERD Maker, a free ER diagram editor",
    breadcrumbSelf: "Guide",
    footerLink: "Go draw an ERD",
  },

  credits: {
    h1: "Credits and licenses",
    lead: "The ER diagram editor here is a modified open-source project. The notices are copied as they are.",
    unofficialTitle: "Unofficial build notice",
    unofficial: [
      "This is an unofficial build of the upstream drawdb that keeps storage on your device and defaults to Korean. We built it ourselves. It is not an official build.",
      "It has no tie to the upstream project, and we do not use its name or logo.",
    ],
    sourceTitle: "Original and source",
    sourceBody: [
      "The original author is drawdb-io/drawdb. It is distributed under the GNU AGPL-3.0, with no warranty.",
      "You can get the full modified source at https://github.com/okwhrlgma-bit/erd.",
      "Our changes are listed with dates in CHANGES.md in that repository.",
      "The Help menu inside the editor also opens an About and License window.",
    ],
    libTitle: "Open source bundled with it",
    libBody: [
      "The code editor pane is Monaco Editor (MIT). Icons come from Font Awesome Free and Bootstrap Icons (MIT).",
      "The full texts are linked below. All of them are served from this site.",
    ],
    filesTitle: "Full texts",
    files: [
      { href: "/LICENSE.txt", label: "LICENSE (AGPL-3.0)" },
      { href: "/open/LICENSE-monaco-editor.txt", label: "Monaco Editor" },
      { href: "/open/LICENSE-fontawesome-free.txt", label: "Font Awesome Free" },
      { href: "/open/LICENSE-bootstrap-icons.txt", label: "Bootstrap Icons" },
    ],
    backLink: "Back",
    jsonHeadline: "ERD Maker credits and licenses",
    jsonDesc: "Original project, license, source location and bundled open-source notices for the ER diagram editor.",
  },

  privacy: {
    h1: "Privacy policy",
    lead: [
      "This service has no accounts and collects no one's personal data. ",
      "It does not collect data from children under 13 either.",
      " What you draw stays on this device.",
    ] as Rich,
    theme: [
      "This site is served through ",
      "Cloudflare",
      ", which may inject its own visit-log script into our pages. We did not add it, so ",
      "we configured the browser to refuse it.",
      " That log is not sent. We mention it because the tag itself keeps being inserted upstream.",
    ] as Rich,
    record: [
      "What you draw in the editor is handled ",
      "inside your browser only",
      " and never sent to a server. Diagrams are kept in browser storage (IndexedDB and localStorage). Our own storage (localStorage) holds one thing: the date you last opened the site, so we can tell a return visit. The editor files come from our site.",
    ] as Rich,
    server: [
      "The server receives anonymous usage signals only: a step name (visit, start pressed, editor ready, first input, export, return, share), the screen language, a source label from our links or the domain you came from, and ",
      "the date you came",
      " (day only). What you drew is never included. We do not read your IP address, device info (User-Agent) or cookies.",
    ] as Rich,
    adsOn: [
      "These signals are counted in short-lived server logs and are not shared with third parties. To pay for running the site we show ",
      "Google AdSense",
      " ads in one spot on the home page, and in that case Google may use cookies or advertising IDs (Google's policy applies). The editor and the guide have no ads.",
    ] as Rich,
    adsOff: [
      "These signals are counted in short-lived server logs and are not shared with third parties. We use no ads or analytics SDK.",
    ] as Rich,
    link: "If you download a file and send it to someone, they can read it, so be careful with diagrams that others should not see.",
    deleteNote: "You can erase your diagrams and the last-visit date by clearing this browser's site data. No personal record stays on the server.",
    bizNote: "Business details and a contact will be posted here after business registration.",
    backLink: "Back",
  },
};
