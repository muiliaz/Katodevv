import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LangProvider } from "../shared/LangContext";
import "./App.css";

const Hub    = lazy(() => import("../pages/hub/Hub"));
const WebDev = lazy(() => import("../pages/web/WebDev"));
const Bots   = lazy(() => import("../pages/bots/Bots"));
const Apps   = lazy(() => import("../pages/apps/Apps"));

function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Hub />} />
            <Route path="/web" element={<WebDev />} />
            <Route path="/bots" element={<Bots />} />
            <Route path="/apps" element={<Apps />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </LangProvider>
  );
}

export default App;
