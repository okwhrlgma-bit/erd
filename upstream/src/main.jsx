import ReactDOM from "react-dom/client";
import { LocaleProvider } from "@douyinfe/semi-ui";
import App from "./App.jsx";
import en_US from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { loader } from "@monaco-editor/react";
import "./index.css";
import "./i18n/i18n.js";

// Monaco is served from our own files (no CDN). See CHANGES.md.
loader.config({ paths: { vs: import.meta.env.BASE_URL + "vs" } });

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <LocaleProvider locale={en_US}>
    <App />
  </LocaleProvider>,
);
