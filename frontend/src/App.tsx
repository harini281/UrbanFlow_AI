import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppShell from "./components/AppShell";
import Dashboard from "./pages/Dashboard";
import Zones from "./pages/Zones";
import Demand from "./pages/Demand";
import ODFlows from "./pages/ODFlows";
import Predictions from "./pages/Predictions";
import Operations from "./pages/Operations";
import Models from "./pages/Models";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/zones" element={<Zones />} />
          <Route path="/demand" element={<Demand />} />
          <Route path="/flows" element={<ODFlows />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/operations" element={<Operations />} />
          <Route path="/models" element={<Models />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
