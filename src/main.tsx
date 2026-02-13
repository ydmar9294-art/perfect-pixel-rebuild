import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { AppProvider } from "@/store/AppContext";
import { applySecurityMeta } from "@/utils/securityHeaders";

// Apply security headers on app load
applySecurityMeta();

// Render app with AppProvider wrapping the entire application
// HashRouter is required for Capacitor/WebView APK compatibility
createRoot(document.getElementById("root")!).render(
  <HashRouter>
    <AppProvider>
      <Routes>
        <Route path="/*" element={<App />} />
      </Routes>
    </AppProvider>
  </HashRouter>
);
