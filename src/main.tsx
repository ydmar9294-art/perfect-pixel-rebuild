import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import ResetPasswordPage from "./components/auth/ResetPasswordPage.tsx";
import "./index.css";
import { AppProvider } from "@/store/AppContext";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AppProvider>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </AppProvider>
  </BrowserRouter>
);