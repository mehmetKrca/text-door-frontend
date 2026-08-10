import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/tokens.css'
import './styles/base.css'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import { GoogleOAuthProvider } from '@react-oauth/google'

// Google Cloud Client ID:
const CLIENT_ID = "273557532184-h6b4637fd9tl8tu5j61lndvf1ag3v7j8.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
// eWindoore PWA Service Worker Kaydı
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(
      (registration) => {
        console.log('eWindoore PWA Servisi Hazır:', registration.scope);
      },
      (err) => {
        console.log('ServiceWorker Hatası:', err);
      }
    );
  });
}