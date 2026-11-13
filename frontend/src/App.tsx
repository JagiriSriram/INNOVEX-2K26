import { useEffect } from "react";
import { SKELETON } from "./dashboard/skeleton";
import { PARTS } from "./dashboard/parts";

let booted = false;

function loadScript(src: string) {
  return new Promise<void>((resolve) => {
    const el = document.createElement("script");
    el.src = src;
    el.async = false; // keep execution order
    el.onload = () => resolve();
    el.onerror = () => resolve(); // never block the chain
    document.body.appendChild(el);
  });
}

/**
 * Thin mount shell. Renders the original dashboard's body markup verbatim, then loads the
 * original app's JavaScript — split into ordered parts — as classic scripts (shared global
 * scope, so inline onclick handlers keep working). React never re-renders after mount, so it
 * does not fight the original render() which writes into #app / #bottomNav.
 */
export default function App() {
  useEffect(() => {
    if (booted) return;
    booted = true;
    (async () => {
      for (const part of PARTS) {
        await loadScript(`/dashboard/${part}`);
      }
    })();
  }, []);

  return <div id="dashboard-root" dangerouslySetInnerHTML={{ __html: SKELETON }} />;
}
