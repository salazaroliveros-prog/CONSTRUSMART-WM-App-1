import { createRoot } from 'react-dom/client';
import './index.css';

const root = document.getElementById('root')!;

// Diagnóstico: mostrar algo inmediatamente
root.innerHTML = '<div style="color:white;background:#1e3a8a;padding:20px;font-family:sans-serif">Cargando app...</div>';

async function boot() {
  try {
    const { default: App } = await import('./App.tsx');
    const { createElement } = await import('react');
    const { createRoot: cr } = await import('react-dom/client');
    root.innerHTML = '';
    cr(root).render(createElement(App));
  } catch (err: any) {
    root.innerHTML = `
      <div style="color:white;background:#7f1d1d;padding:24px;font-family:monospace;min-height:100vh">
        <h2 style="font-size:18px;margin-bottom:12px">❌ Error al cargar la aplicación</h2>
        <pre style="font-size:12px;white-space:pre-wrap;word-break:break-all;background:#450a0a;padding:16px;border-radius:8px">${err?.stack || err?.message || String(err)}</pre>
        <button onclick="location.reload()" style="margin-top:16px;padding:8px 16px;background:#2563eb;color:white;border:none;border-radius:6px;cursor:pointer">Recargar</button>
      </div>`;
  }
}

boot();
