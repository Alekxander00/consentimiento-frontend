import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './FirmaConsentimiento.css';

const FirmaDesdeAccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [pacienteData, setPacienteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [firmaData, setFirmaData] = useState('');
  const [temaOscuro, setTemaOscuro] = useState(false);

  // Obtener parámetros de la URL
  const pacienteId = searchParams.get('id_paciente');
  const consentimientoId = searchParams.get('id_consentimiento');

  // Efecto para aplicar el tema al documento
  useEffect(() => {
    if (temaOscuro) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [temaOscuro]);

  

  // Efecto para cargar datos del paciente
  useEffect(() => {
    if (pacienteId) {
      cargarDatosPaciente(pacienteId);
    } else {
      setError("No se proporcionó ID del paciente");
      setLoading(false);
    }
  }, [pacienteId]);

  const cargarDatosPaciente = async (id) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${API_URL}/access-integration/paciente/${id}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar datos del paciente');
      }
      
      const data = await response.json();
      setPacienteData(data);
    } catch (err) {
      setError('No se pudieron cargar los datos del paciente');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const manejarFirma = (firmaBase64) => {
    setFirmaData(firmaBase64);
  };

  const guardarConsentimiento = async () => {
    if (!firmaData || !pacienteData) {
      alert("Debe realizar la firma primero");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('idconsto', pacienteData.consentimiento_id || pacienteData.idconsto);
      formData.append('paciente_nombre', pacienteData.paciente_nombre);
      formData.append('paciente_identificacion', pacienteData.paciente_identificacion);
      formData.append('paciente_telefono', pacienteData.paciente_telefono || '');
      formData.append('paciente_direccion', pacienteData.paciente_direccion || '');
      formData.append('profesional_id', pacienteData.id_profesional || '');
      formData.append('aceptacion', 'Acepto el procedimiento');
      formData.append('declaracion', 'Declaro que he entendido la información');
      formData.append('id_access', pacienteId);
      
      // Convertir base64 a blob para la firma
      const byteCharacters = atob(firmaData.split(',')[1]);
      const byteArrays = [];
      
      for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
        const slice = byteCharacters.slice(offset, offset + 1024);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      const blob = new Blob(byteArrays, { type: 'image/png' });
      formData.append('paciente_firma', blob, 'firma.png');

      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${API_URL}/consentimientos-firmados`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error al guardar el consentimiento');
      }

      const resultado = await response.json();
      alert("Consentimiento firmado y guardado exitosamente");
      
      // Redirigir a la página de PDF o cerrar
      window.open(`${API_URL}/generar-pdf/${resultado.id}`, '_blank');
      
    } catch (err) {
      console.error("Error al guardar:", err);
      alert("Error al guardar el consentimiento");
    }
  };

  const toggleTema = () => {
    setTemaOscuro(!temaOscuro);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando datos del paciente...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Volver al inicio</button>
      </div>
    );
  }

  if (!pacienteData) {
    return (
      <div className="error-container">
        <p>No se encontraron datos del paciente</p>
        <button onClick={() => navigate('/')}>Volver al inicio</button>
      </div>
    );
  }

  return (
    <div className="firma-container">
      <header className="firma-header">
        <h1>Firmar Consentimiento - {pacienteData.paciente_nombre}</h1>
        <div className="header-actions">
          <button 
            className="btn btn-outline theme-toggle"
            onClick={toggleTema}
            title={temaOscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            {temaOscuro ? '☀️' : '🌙'}
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/lista-pacientes')}>Volver a la lista</button>
        </div>
      </header>

      <div className="firma-content">
        <div className="content-left">
          <div className="paciente-info">
            <h3>Datos del Paciente</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Nombre:</span>
                <span className="info-value">{pacienteData.paciente_nombre}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Identificación:</span>
                <span className="info-value">{pacienteData.paciente_identificacion}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Teléfono:</span>
                <span className="info-value">{pacienteData.paciente_telefono || 'No especificado'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Dirección:</span>
                <span className="info-value">{pacienteData.paciente_direccion || 'No especificado'}</span>
              </div>
            </div>
          </div>

          <div className="consentimiento-info">
            <h3>Consentimiento: {pacienteData.nombre || 'Consentimiento Médico'}</h3>
            <div className="consentimiento-content">
              {pacienteData.inf_gral && (
                <section className="content-section">
                  <h4>Información General</h4>
                  <p>{pacienteData.inf_gral}</p>
                </section>
              )}
              
              {pacienteData.enque_consiste && (
                <section className="content-section">
                  <h4>En qué consiste</h4>
                  <p>{pacienteData.enque_consiste}</p>
                </section>
              )}
              
              {pacienteData.beneficios && (
                <section className="content-section">
                  <h4>Beneficios</h4>
                  <p>{pacienteData.beneficios}</p>
                </section>
              )}
              
              {pacienteData.riesgos && (
                <section className="content-section">
                  <h4>Riesgos</h4>
                  <p>{pacienteData.riesgos}</p>
                </section>
              )}
            </div>
          </div>
        </div>

        <div className="content-right">
          <div className="firma-section">
            <h3>Firma del Paciente</h3>
            <CanvasFirma onFirmaComplete={manejarFirma} />
            {firmaData && (
              <div className="firma-preview">
                <p>Vista previa de la firma:</p>
                <img src={firmaData} alt="Firma del paciente" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="actions">
        <button onClick={guardarConsentimiento} className="btn btn-guardar">
          ✅ Guardar Consentimiento Firmado
        </button>
        <button className="btn btn-cancelar" onClick={() => navigate('/lista-pacientes')}>❌ Cancelar</button>
      </div>
    </div>
  );
};

// Componente de canvas para firma (sin cambios)
const CanvasFirma = ({ onFirmaComplete }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
  }, []);

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e) => {
  setIsDrawing(true);
  const { x, y } = getCoords(e);
  const ctx = canvasRef.current.getContext('2d');
  ctx.beginPath();
  ctx.moveTo(x, y);
};

const draw = (e) => {
  if (!isDrawing) return;
  const { x, y } = getCoords(e);
  const ctx = canvasRef.current.getContext('2d');
  ctx.lineTo(x, y);
  ctx.stroke();
};

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    onFirmaComplete(canvas.toDataURL());
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onFirmaComplete('');
  };

  return (
    <div className="canvas-container">
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={600}
          height={300}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          onTouchCancel={endDrawing}
          style={{ touchAction: "none", cursor: "crosshair" }} // 👈 clave en móviles
        />
      </div>
      <div className="canvas-actions">
        <button onClick={clearCanvas} className="btn btn-limpiar">
          🧹 Limpiar Firma
        </button>
      </div>
    </div>
  );
};


export default FirmaDesdeAccess;