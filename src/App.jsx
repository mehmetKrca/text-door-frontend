import { Routes, Route, Navigate } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import LandingPage from './pages/LandingPage'
import PvcCizimEkrani from './PvcCizimEkrani' 

// --- YENİ EKLENEN YASAL SÖZLEŞME SAYFALARI ---
import GizlilikSozlesmesi from './pages/GizlilikSozlesmesi'
import KullaniciSozlesmesi from './pages/KullaniciSozlesmesi'

// --- GÜVENLİK DUVARI (KORUMALI ROTA) BİLEŞENİ ---
const KorumaliRota = ({ children }) => {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      {/* --- HERKESE AÇIK ROTALAR --- */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      
      {/* Yasal Sözleşme Sayfaları */}
      <Route path="/gizlilik-sozlesmesi" element={<GizlilikSozlesmesi />} />
      <Route path="/kullanici-sozlesmesi" element={<KullaniciSozlesmesi />} />
      
      {/* --- KORUMALI ROTALAR (Giriş Zorunlu) --- */}
      <Route 
        path="/cizim" 
        element={
          <KorumaliRota>
            <PvcCizimEkrani />
          </KorumaliRota>
        } 
      />

      <Route 
        path="/dashboard" 
        element={
          <KorumaliRota>
            <PvcCizimEkrani /> {/* Dashboard yerine doğrudan zengin çizim ekranına yönlendirdik */}
          </KorumaliRota>
        } 
      />

      {/* Tanımsız bir URL girilirse ana sayfaya (Vitrini) at */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
  
}
export default App;