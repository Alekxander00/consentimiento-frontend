import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FirmaConsentimiento.css';

const FirmaConsentimiento = ({ consentimiento, onClose, onSave }) => {
  const [datosPaciente, setDatosPaciente] = useState({
    nombre: '',
    identificacion: '',
    telefono: '',
    direccion: '',
    aceptacion: 'Sí acepto el procedimiento',
    declaracion: 'Declaro que he sido informado adecuadamente',
    observaciones: ''
  });
  
  const [profesionales, setProfesionales] = useState([]);
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState(null);
  const [busquedaProfesional, setBusquedaProfesional] = useState('');
  const [mostrarListaProfesionales, setMostrarListaProfesionales] = useState(false);
  const [firmaData, setFirmaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [posicion, setPosicion] = useState({ x: 0, y: 0 });
  const busquedaRef = useRef(null);
  
  const navigate = useNavigate();

  // URL base desde variable de entorno
  const API_URL = 'https://backend-consentimientos-production.up.railway.app';

  // Función de cierre que redirige a lista-pacientes
  const handleClose = () => {
    navigate('/lista-pacientes');
  };

  // Cargar profesionales al abrir el modal
  useEffect(() => {
    const cargarProfesionales = async () => {
      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || '/api';
        const response = await fetch(`${API_URL}/profesionales`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setProfesionales(data);
      } catch (error) {
        console.error('Error al cargar profesionales:', error);
        alert('Error al cargar la lista de profesionales');
      } finally {
        setLoading(false);
      }
    };

    cargarProfesionales();

    // Cerrar la lista de profesionales al hacer clic fuera
    const handleClickOutside = (event) => {
      if (busquedaRef.current && !busquedaRef.current.contains(event.target)) {
        setMostrarListaProfesionales(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [API_URL]);

  // Inicializar canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 3; // Línea más gruesa para mejor visibilidad en móviles
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000';
    }
  }, []);

  // Filtrar profesionales según la búsqueda
  const profesionalesFiltrados = busquedaProfesional
    ? profesionales.filter(p =>
        p.nombre?.toLowerCase().includes(busquedaProfesional.toLowerCase()) ||
        p.especialidad?.toLowerCase().includes(busquedaProfesional.toLowerCase())
      )
    : profesionales;

  // Obtener coordenadas del touch/mouse
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    
    if (e.type.includes('touch')) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // Iniciar dibujo de firma - MEJORADO PARA TÁCTIL
  const startDrawing = (e) => {
    if (loading) return;
    
    // Prevenir comportamiento por defecto en dispositivos táctiles
    if (e.type.includes('touch')) {
      e.preventDefault();
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const { x, y } = getCoordinates(e);
    const ctx = canvas.getContext('2d');
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    setPosicion({ x, y });
    setIsDrawing(true);
  };

  // Dibujar firma - MEJORADO PARA TÁCTIL
  const draw = (e) => {
    if (!isDrawing || loading) return;
    
    // Prevenir comportamiento por defecto en dispositivos táctiles
    if (e.type.includes('touch')) {
      e.preventDefault();
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const { x, y } = getCoordinates(e);
    const ctx = canvas.getContext('2d');
    
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setPosicion({ x, y });
  };

  // Finalizar dibujo
  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setFirmaData(canvas.toDataURL());
    }
  };

  // Limpiar firma
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setFirmaData(null);
    }
  };

  // Función mejorada para convertir dataURL a Blob
  const dataURLtoBlob = (dataURL) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  };

  // Guardar consentimiento firmado
  const guardarConsentimientoFirmado = async () => {
    if (!firmaData) {
      alert('Por favor, proporcione su firma');
      return;
    }

    if (!datosPaciente.nombre || !datosPaciente.identificacion) {
      alert('Por favor, complete todos los campos obligatorios');
      return;
    }

    if (!profesionalSeleccionado) {
      alert('Por favor, seleccione un profesional');
      return;
    }

    try {
      setLoading(true);
      
      // Convertir la firma de dataURL a Blob usando nuestra función
      const firmaBlob = dataURLtoBlob(firmaData);

      // Crear FormData
      const formData = new FormData();
      formData.append('idconsto', consentimiento.idconsto);
      formData.append('paciente_nombre', datosPaciente.nombre);
      formData.append('paciente_identificacion', datosPaciente.identificacion);
      formData.append('paciente_telefono', datosPaciente.telefono || '');
      formData.append('paciente_direccion', datosPaciente.direccion || '');
      formData.append('paciente_firma', firmaBlob, 'firma.png');
      formData.append('aceptacion', datosPaciente.aceptacion);
      formData.append('declaracion', datosPaciente.declaracion);
      formData.append('observaciones', datosPaciente.observaciones || '');
      formData.append('profesional_id', profesionalSeleccionado.id);

      const responseBackend = await fetch(`${API_URL}/consentimientos-firmados`, {
        method: 'POST',
        body: formData,
      });

      if (responseBackend.ok) {
        const resultado = await responseBackend.json();
        
        // Descargar el PDF desde el backend
        window.open(`${API_URL}/generar-pdf/${resultado.id}`, '_blank');
        
        alert('Consentimiento firmado y guardado correctamente. El PDF se está descargando.');
        if (onSave) onSave();
        handleClose();
        
      } else {
        const errorData = await responseBackend.json();
        alert(`Error al guardar: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión con el servidor: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="firma-container">
      <div className="firma-header">
        <h1>Firma Consentimiento - {consentimiento.nombre}</h1>
        <div className="header-actions">
          <button className="btn-volver" onClick={handleClose} disabled={loading}>
            Volver a lista de pacientes
          </button>
          <button onClick={() => navigate('/lista-pacientes')}>Volver a la lista</button>
        </div>
      </div>

      <div className="firma-content">
        {/* Panel izquierdo - Información del paciente y consentimiento */}
        <div className="firma-panel-izquierdo">
          {/* Información del paciente */}
          <div className="paciente-info">
            <h3>Datos del Paciente</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Nombre:</span>
                <span className="info-value">{datosPaciente.nombre || 'No especificado'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Identificación:</span>
                <span className="info-value">{datosPaciente.identificacion || 'No especificado'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Teléfono:</span>
                <span className="info-value">{datosPaciente.telefono || 'No especificado'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Dirección:</span>
                <span className="info-value">{datosPaciente.direccion || 'No especificado'}</span>
              </div>
            </div>
          </div>

          {/* Consentimiento informado */}
          <div className="consentimiento-info">
            <h3>Consentimiento: {consentimiento.nombre}</h3>
            <div className="consentimiento-content">
              <div className="content-section">
                <h4>Información General</h4>
                <p>{consentimiento.descripcion || 'Información detallada sobre el procedimiento...'}</p>
              </div>
              
              <div className="content-section">
                <h4>Contraindicaciones</h4>
                <p>Paciente con glaucoma estrecho sin tratamiento. Paciente con arteriosclerosis severo, enfermedad cardiovascular o cerebrovascular.</p>
              </div>
              
              <div className="content-section">
                <h4>Requisitos para el Procedimiento</h4>
                <p>Debe presentarse en compañía de una persona mayor de edad responsable de su atención, que podrá suministrar información adicional en caso de ser requerido, así mismo acompañar al paciente durante la preparación, prestación del servicio y mientras está presente el efecto del medicamento.</p>
              </div>

              <div className="content-section">
                <h4>Declaraciones del Paciente</h4>
                <p><strong>Aceptación:</strong> {datosPaciente.aceptacion}</p>
                <p><strong>Declaración:</strong> {datosPaciente.declaracion}</p>
                {datosPaciente.observaciones && (
                  <p><strong>Observaciones:</strong> {datosPaciente.observaciones}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho - Área de firma y datos profesionales */}
        <div className="firma-panel-derecho">
          {/* Selección de profesional */}
          <div className="paciente-info">
            <h3>Profesional que Atiende</h3>
            <div className="busqueda-profesional" ref={busquedaRef}>
              <input
                type="text"
                placeholder="Buscar profesional por nombre o especialidad..."
                value={busquedaProfesional}
                onChange={(e) => {
                  setBusquedaProfesional(e.target.value);
                  setMostrarListaProfesionales(true);
                }}
                onFocus={() => setMostrarListaProfesionales(true)}
                disabled={loading}
                className="search-input"
              />
              {mostrarListaProfesionales && profesionalesFiltrados.length > 0 && (
                <div className="lista-profesionales">
                  {profesionalesFiltrados.map(profesional => (
                    <div
                      key={profesional.id}
                      className="opcion-profesional"
                      onClick={() => {
                        setProfesionalSeleccionado(profesional);
                        setBusquedaProfesional(`${profesional.nombre} - ${profesional.especialidad}`);
                        setMostrarListaProfesionales(false);
                      }}
                    >
                      <strong>{profesional.nombre}</strong>
                      <span>{profesional.especialidad}</span>
                      {profesional.registro_profesional && (
                        <small>Registro: {profesional.registro_profesional}</small>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {profesionalSeleccionado && (
              <div className="info-profesional-seleccionado">
                <h4>Profesional Seleccionado:</h4>
                <p><strong>Nombre:</strong> {profesionalSeleccionado.nombre}</p>
                <p><strong>Identificación:</strong> {profesionalSeleccionado.identificacion}</p>
                <p><strong>Especialidad:</strong> {profesionalSeleccionado.especialidad}</p>
                {profesionalSeleccionado.registro_profesional && (
                  <p><strong>Registro profesional:</strong> {profesionalSeleccionado.registro_profesional}</p>
                )}
              </div>
            )}
          </div>

          {/* Área de firma MEJORADA PARA TÁCTIL */}
          <div className="firma-section">
            <h3>Firma del Paciente</h3>
            <div className="canvas-container">
              <div className={`canvas-wrapper ${firmaData ? 'has-signature' : ''}`}>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={300}
                  // Eventos de mouse
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  // Eventos táctiles MEJORADOS
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  onTouchCancel={stopDrawing}
                  className="firma-canvas"
                  style={{ 
                    cursor: loading ? 'not-allowed' : 'crosshair',
                    touchAction: 'none' // Importante: previene el scroll al dibujar
                  }}
                />
              </div>
            </div>
            <div className="canvas-actions">
              <button onClick={clearSignature} className="btn-limpiar" disabled={loading}>
                Limpiar Firma
              </button>
              <div className="firma-instructions">
                <small>En móvil: Deslice el dedo para firmar</small>
              </div>
            </div>
          </div>

          {/* Acciones principales */}
          <div className="actions">
            <button onClick={handleClose} className="btn-cancelar" disabled={loading}>
              Cancelar
            </button>
            <button 
              onClick={guardarConsentimientoFirmado} 
              className="btn-guardar"
              disabled={!firmaData || !datosPaciente.nombre || !datosPaciente.identificacion || !profesionalSeleccionado || loading}
            >
              {loading ? 'Guardando...' : 'Guardar Consentimiento Firmado'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirmaConsentimiento;