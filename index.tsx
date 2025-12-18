import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// WalletConnect / Wagmi Polyfills
import { Buffer } from 'buffer';
window.Buffer = Buffer;
window.global = window;
if (!window.process) {
  // @ts-ignore
  window.process = { env: {} };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);