import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  root:fileURLToPath(new URL('./github-pages',import.meta.url)),
  base:'./',
  publicDir:fileURLToPath(new URL('./public',import.meta.url)),
  plugins:[react()],
  define:{__GITHUB_PAGES__:'true'},
  server:{host:'0.0.0.0',port:5173,strictPort:true,allowedHosts:['terminal.local']},
  preview:{host:'0.0.0.0',port:4173,strictPort:true,allowedHosts:['terminal.local']},
  build:{outDir:fileURLToPath(new URL('./dist-pages',import.meta.url)),emptyOutDir:true,
    rolldownOptions:{input:{ver2:fileURLToPath(new URL('./github-pages/index.html',import.meta.url)),ver3:fileURLToPath(new URL('./github-pages/ver3/index.html',import.meta.url)),teacher:fileURLToPath(new URL('./github-pages/ver3/teacher/index.html',import.meta.url))}}},
});
