import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useLayoutEffect } from "react";
import Editor from "./pages/Editor";
import SettingsContextProvider from "./context/SettingsContext";

export default function App() {
  const routes = (
    <Routes>
      <Route path="/" element={<Navigate to="/editor" replace />} />
      <Route path="/editor" element={<Editor />} />
      <Route path="/editor/diagrams/:id" element={<Editor />} />
      <Route path="/editor/templates/:id" element={<Editor />} />
      <Route path="*" element={<Navigate to="/editor" replace />} />
    </Routes>
  );

  return (
    <HashRouter>
      <SettingsContextProvider>
        <RestoreScroll />
        {routes}
      </SettingsContextProvider>
    </HashRouter>
  );
}

function RestoreScroll() {
  const location = useLocation();
  useLayoutEffect(() => {
    window.scroll(0, 0);
  }, [location.pathname]);
  return null;
}
