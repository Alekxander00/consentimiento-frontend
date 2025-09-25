import { useState, useEffect } from 'react';
import './Consentimientos.css';
import FirmaConsentimiento from './FirmaConsentimiento';

const Consentimientos = () => {
  const [consentimientos, setConsentimientos] = useState([]);
  const [consentimientoSeleccionado, setConsentimientoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [temaOscuro, setTemaOscuro] = useState(false);
  const [mostrarFirmaModal, setMostrarFirmaModal] = useState(false);
  const [consentimientoAFirmar, setConsentimientoAFirmar] = useState(null);

  const abrirModalFirma = (consentimiento) => {
  setConsentimientoAFirmar(consentimiento);
  setMostrarFirmaModal(true);
  };

   const handleGuardarFirma = () => {
    // Recargar o actualizar la interfaz después de guardar
    setMostrarFirmaModal(false);
    // Puedes recargar los consentimientos si es necesario
  };

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTemaOscuro(prefersDark);
    fetchConsentimientos();
  }, []);

  useEffect(() => {
    if (temaOscuro) {
      document.body.classList.add('tema-oscuro');
    } else {
      document.body.classList.remove('tema-oscuro');
    }
  }, [temaOscuro]);

  const fetchConsentimientos = async () => {
    try {
      setError('');
      const response = await fetch('http://localhost:4000/consentimientos');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setConsentimientos(data);
    } catch (error) {
      console.error('Error fetching consentimientos:', error);
      setError('No se pudieron cargar los consentimientos. Verifica que el servidor esté funcionando.');
    } finally {
      setLoading(false);
    }
  };

  const consentimientosFiltrados = consentimientos.filter(consentimiento =>
    consentimiento.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    consentimiento.especialidad?.toString().includes(busqueda)
  );

  const toggleTema = () => {
    setTemaOscuro(!temaOscuro);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando consentimientos...</p>
      </div>
    );
  }

  return (
    <div className="consentimientos-container">
      <header className="app-header">
        <h1>Gestión de Consentimientos Médicos</h1>
        <button 
          className="tema-toggle"
          onClick={toggleTema}
          aria-label="Cambiar tema"
        >
          {temaOscuro ? '☀️' : '🌙'}
        </button>
      </header>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={fetchConsentimientos}>Reintentar</button>
        </div>
      )}

      <div className="layout-principal">
        <aside className="panel-lateral">
          <div className="busqueda-container">
            <div className="busqueda-input">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar por nombre o especialidad..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="input-busqueda"
              />
              {busqueda && (
                <button 
                  className="clear-search"
                  onClick={() => setBusqueda('')}
                  aria-label="Limpiar búsqueda"
                >
                  ×
                </button>
              )}
            </div>
            <span className="resultados-count">
              {consentimientosFiltrados.length} resultado(s)
            </span>
          </div>

          <div className="lista-consentimientos">
            {consentimientosFiltrados.map(consentimiento => (
        <div
          key={consentimiento.idconsto}
          className={`consentimiento-item ${
            consentimientoSeleccionado?.idconsto === consentimiento.idconsto ? 'seleccionado' : ''
          }`}
          onClick={() => setConsentimientoSeleccionado(consentimiento)}
        >
          <h3 className="item-titulo">{consentimiento.nombre}</h3>
          <p className="item-especialidad">
            Especialidad: {consentimiento.especialidad}
          </p>
          
          {/* Botón para abrir modal de firma */}
          <div className="card-actions">
            <button 
              className="btn-firmar"
              onClick={(e) => {
                e.stopPropagation(); // Evita que se seleccione el consentimiento
                abrirModalFirma(consentimiento);
              }}
            >
              ✏️ Firmar Consentimiento
            </button>
          </div>
        </div>
      ))}

       {/* Modal de firma */}
      {mostrarFirmaModal && (
        <FirmaConsentimiento
          consentimiento={consentimientoAFirmar}
          onClose={() => setMostrarFirmaModal(false)}
          onSave={handleGuardarFirma}
        />
      )}
          </div>
        </aside>

        <main className="panel-detalles">
          {consentimientoSeleccionado ? (
            <div className="detalles-container">
              <div className="detalles-header">
                <h2>{consentimientoSeleccionado.nombre}</h2>
                <span className="especialidad-badge">
                  Especialidad: {consentimientoSeleccionado.especialidad}
                </span>
              </div>

              <div className="detalles-content">
                {consentimientoSeleccionado.inf_gral && (
                  <section className="detalle-seccion">
                    <h3>📋 Información General</h3>
                    <p>{consentimientoSeleccionado.inf_gral}</p>
                  </section>
                )}

                {consentimientoSeleccionado.enque_consiste && (
                  <section className="detalle-seccion">
                    <h3>🔍 En qué consiste</h3>
                    <p>{consentimientoSeleccionado.enque_consiste}</p>
                  </section>
                )}

                {consentimientoSeleccionado.dosis && (
                  <section className="detalle-seccion">
                    <h3>💊 Dosis</h3>
                    <p>{consentimientoSeleccionado.dosis}</p>
                  </section>
                )}

                {consentimientoSeleccionado.como_aplica && (
                  <section className="detalle-seccion">
                    <h3>⚕️ Cómo se aplica</h3>
                    <p>{consentimientoSeleccionado.como_aplica}</p>
                  </section>
                )}

                {consentimientoSeleccionado.beneficios && (
                  <section className="detalle-seccion">
                    <h3>✅ Beneficios</h3>
                    <p>{consentimientoSeleccionado.beneficios}</p>
                  </section>
                )}

                {consentimientoSeleccionado.riesgos && (
                  <section className="detalle-seccion">
                    <h3>⚠️ Riesgos</h3>
                    <p>{consentimientoSeleccionado.riesgos}</p>
                  </section>
                )}

                {consentimientoSeleccionado.otras_alt_hay && (
                  <section className="detalle-seccion">
                    <h3>🔄 Otras alternativas</h3>
                    <p>{consentimientoSeleccionado.otras_alt_hay}</p>
                  </section>
                )}

                {consentimientoSeleccionado.vac_etapa && (
                  <section className="detalle-seccion">
                    <h3>🦠 Etapa de vacunación</h3>
                    <p>{consentimientoSeleccionado.vac_etapa}</p>
                  </section>
                )}

                {consentimientoSeleccionado.vac_estrategia && (
                  <section className="detalle-seccion">
                    <h3>🎯 Estrategia de vacunación</h3>
                    <p>{consentimientoSeleccionado.vac_estrategia}</p>
                  </section>
                )}

                {consentimientoSeleccionado.vac_bio && (
                  <section className="detalle-seccion">
                    <h3>🧪 Biológico</h3>
                    <p>{consentimientoSeleccionado.vac_bio}</p>
                  </section>
                )}

                {consentimientoSeleccionado.vac_dosis && (
                  <section className="detalle-seccion">
                    <h3>📊 Dosis de vacuna</h3>
                    <p>{consentimientoSeleccionado.vac_dosis}</p>
                  </section>
                )}


                
              </div>
            </div>
          ) : (
            <div className="empty-details">
              <div className="empty-icon">📄</div>
              <h3>Selecciona un consentimiento</h3>
              <p>Elige un consentimiento de la lista para ver sus detalles completos</p>
            </div>
          )}
        </main>
        
      </div>
      
    </div>
    
  );

  

};



export default Consentimientos;