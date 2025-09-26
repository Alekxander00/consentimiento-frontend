import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Consentimientos from "./pages/Consentimientos";
import FirmaConsentimiento from "./pages/FirmaConsentimiento";
import FirmaDesdeAccess from "./pages/FirmaDesdeAccess"; // ✅ Importación correcta
import ListaPacientes from './pages/ListaPacientes';
import { checkBackendConnection } from "./utils/apiCheck";

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
        <Route path="/firma-access" element={<FirmaDesdeAccess />} /> {/* ✅ Ruta agregada */}
        <Route path="/lista-pacientes" element={<ListaPacientes />} />
      </Routes>
    </Router>
  );
}

export default App;