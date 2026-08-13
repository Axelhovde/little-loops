import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Client-side HTTP → HTTPS fallback (GitHub Pages enforces it server-side, this covers edge cases)
if (import.meta.env.PROD && window.location.protocol === "http:") {
  window.location.replace(
    `https://${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`
  );
}
import { CartProvider } from "./contexts/cartContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </React.StrictMode>
);
