import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><BrowserRouter><App /><Toaster position="top-right" /></BrowserRouter></React.StrictMode>
);

const clearLegacyOfflineCache = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.unregister()));

    if (navigator.serviceWorker.controller && !sessionStorage.getItem('civicfix_sw_refresh')) {
      sessionStorage.setItem('civicfix_sw_refresh', '1');
      window.location.reload();
      return;
    }
  }

  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
  }
};

clearLegacyOfflineCache().catch(() => {});
