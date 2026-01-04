import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"; // 1. Import ini

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 2. Tambahkan ini di sini
  ],
});
