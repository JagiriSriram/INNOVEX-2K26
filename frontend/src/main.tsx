import { createRoot } from "react-dom/client";
import App from "./App";

// No StrictMode: the dashboard parts are classic scripts with top-level declarations
// and must be evaluated exactly once (double-invocation would redeclare globals).
createRoot(document.getElementById("root")!).render(<App />);
