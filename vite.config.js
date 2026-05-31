import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so assets load correctly from the Android WebView (file:// + capacitor)
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
