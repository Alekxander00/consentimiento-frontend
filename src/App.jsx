import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Consentimientos from "./pages/Consentimientos";
import FirmaConsentimiento from "./pages/FirmaConsentimiento";
import FirmaDesdeAccess from "./pages/FirmaDesdeAccess"; // ✅ Importación correcta
import ListaPacientes from './pages/ListaPacientes';
import { checkBackendConnection } from "./utils/apiCheck";
import { FirmaProvider } from "./context/FirmaContext";  

function App() {
  const [connectionStatus, setConnectionStatus] = useState({ loading: true, connected: false });

  useEffect(() => {
    const verifyConnection = async () => {
      const result = await checkBackendConnection();
      setConnectionStatus({
        loading: false,
        connected: result.success,
        details: result
      });
    };

    verifyConnection();
  }, []);

  return (
    <Router>
      {/* 👇 Envolvemos TODO el contenido en el Provider */}
      <FirmaProvider>
        <nav>
          <Link to="/">Inicio</Link>
          <Link to="/consentimientos">Consentimientos</Link>
          {!connectionStatus.loading && (
            <span className={`connection-status ${connectionStatus.connected ? 'connected' : 'disconnected'}`}>
              {connectionStatus.connected ? '✅ Conectado' : '❌ Sin conexión'}
            </span>
          )}
        </nav>

        {connectionStatus.loading && (
          <div className="loading-bar">Verificando conexión con el servidor...</div>
        )}

        {!connectionStatus.loading && !connectionStatus.connected && (
          <div className="error-banner">
            <h3>⚠️ Error de conexión</h3>
            <p>No se pudo conectar con el servidor backend.</p>
            <p>URL intentada: {connectionStatus.details?.apiUrl}</p>
            <p>Error: {connectionStatus.details?.error}</p>
          </div>
        )}

        <Routes>
          <Route path="/" element={
            <div style={{ padding: '20px' }}>
              <h1>Sistema de Consentimientos Médicos</h1>
              <p>Estado del backend: {connectionStatus.connected ? '✅ Conectado' : '❌ Desconectado'}</p>
              {connectionStatus.details && (
                <div>
                  <p><strong>URL del API:</strong> {connectionStatus.details.apiUrl}</p>
                  {connectionStatus.connected && (
                    <p><strong>Consentimientos cargados:</strong> {connectionStatus.details.consentimientosCount}</p>
                  )}
                </div>
              )}
            </div>
          } />
          <Route path="/consentimientos" element={<Consentimientos />} />
          <Route path="/firmaConsentimiento" element={<FirmaConsentimiento />} />
          <Route path="/firma-acces" element={<FirmaDesdeAccess />} />
          <Route path="/firma-access" element={<FirmaDesdeAccess />} />
          <Route path="/firma" element={<FirmaDesdeAccess />} />
          <Route path="/lista-pacientes" element={<ListaPacientes />} />
          <Route path="*" element={
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Página no encontrada</h2>
                <p>La ruta solicitada no existe.</p>
                <a href="/">Volver al inicio</a>
              </div>
            } />
        </Routes>
      </FirmaProvider>
    </Router>
  );
}
function NotFound() {
  const currentPath = window.location.pathname + window.location.search;
  
  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{ color: '#e74c3c', marginBottom: '1rem' }}>⚠️ Página no encontrada</h2>
      <p style={{ marginBottom: '1rem' }}>
        La ruta solicitada: <code style={{ background: '#f8f9fa', padding: '0.2rem 0.4rem', borderRadius: '3px' }}>{currentPath}</code> no existe.
      </p>
      
      <div style={{ marginTop: '2rem' }}>
        <p style={{ marginBottom: '1rem' }}><strong>Rutas disponibles:</strong></p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
          <a href="/" style={{ color: '#007bff', textDecoration: 'none' }}>🏠 / - Lista de pacientes</a>
          <a href="/firma-acces" style={{ color: '#007bff', textDecoration: 'none' }}>📝 /firma-acces - Firma de consentimientos</a>
          <a href="/firma-access" style={{ color: '#007bff', textDecoration: 'none' }}>📝 /firma-access - Firma (alternativa)</a>
          <a href="/firma" style={{ color: '#007bff', textDecoration: 'none' }}>📝 /firma - Firma (simple)</a>
        </div>
      </div>
      
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <button 
          onClick={() => window.history.back()} 
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Volver atrás
        </button>
        <a href="/">
          <button style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            🏠 Ir al inicio
          </button>
        </a>
      </div>
    </div>
  );
}

export default App;