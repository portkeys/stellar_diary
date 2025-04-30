import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";

// Add web fonts
const linkFont = document.createElement("link");
linkFont.rel = "stylesheet";
linkFont.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=Roboto+Mono&display=swap";
document.head.appendChild(linkFont);

// Add FontAwesome
const linkFontAwesome = document.createElement("link");
linkFontAwesome.rel = "stylesheet";
linkFontAwesome.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
document.head.appendChild(linkFontAwesome);

// Add page title
const title = document.createElement("title");
title.innerText = "StellarView - Astronomy Companion";
document.head.appendChild(title);

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Toaster />
  </>
);
