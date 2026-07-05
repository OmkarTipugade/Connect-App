import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import useThemeStore from "./store/themeStore";

// Apply saved theme (light / dark / system) before first render
useThemeStore.getState().initTheme();

createRoot(document.getElementById("root")).render(<App />);
