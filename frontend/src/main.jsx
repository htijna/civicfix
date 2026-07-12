import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><BrowserRouter><App /><Toaster position="top-right" /></BrowserRouter></React.StrictMode>
);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(registrations => Promise.all(registrations.map(registration => registration.unregister())))
    .catch(() => {});
}

if ('caches' in window) {
  caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('civicfix')).map(key => caches.delete(key))))
    .catch(() => {});
}
