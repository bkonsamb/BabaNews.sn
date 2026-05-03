import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  // CRITIQUE : sans cette ligne, tous les assets sont cherchés
  // à la racine du domaine (github.io/) au lieu de (github.io/BabaNews.sn/)
  base: '/BabaNews.sn/',

  // viteSingleFile a été retiré : il bundlait articles.json dans le HTML
  // au moment du build, rendant les mises à jour du bot invisibles.
  // Vite standard copie public/articles.json → dist/articles.json correctement.
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
