import { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
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

  // URL base desde variable de entorno
  const API_URL = 'https://backend-consentimientos-production.up.railway.app';

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

  // Filtrar profesionales según la búsqueda
  const profesionalesFiltrados = busquedaProfesional
    ? profesionales.filter(p =>
        p.nombre?.toLowerCase().includes(busquedaProfesional.toLowerCase()) ||
        p.especialidad?.toLowerCase().includes(busquedaProfesional.toLowerCase())
      )
    : profesionales;

  // Iniciar dibujo de firma
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setPosicion({ x, y });
    setIsDrawing(true);
  };

  // Dibujar firma
  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.moveTo(posicion.x, posicion.y);
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
        const pdfWindow = window.open(`${API_URL}/generar-pdf/${resultado.id}`, '_blank');
        
        // Esperar a que se abra la ventana del PDF
        setTimeout(() => {
          alert('Consentimiento firmado y guardado correctamente. El PDF se está descargando.');
          if (onSave) onSave();
          if (onClose) onClose();
        }, 1000);
        
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
    <div className="firma-modal-overlay">
      <div className="firma-modal">
        <div className="modal-header">
          <h2>Firmar Consentimiento: {consentimiento.nombre}</h2>
          <button className="close-btn" onClick={onClose} disabled={loading}>×</button>
        </div>

        <div className="modal-content">
          {/* Sección de selección de profesional */}
          <div className="seccion-profesional">
            <h3>Profesional que atiende *</h3>
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
              <div className="info-profesional">
                <h4>Profesional seleccionado:</h4>
                <p><strong>Nombre:</strong> {profesionalSeleccionado.nombre}</p>
                <p><strong>Identificación:</strong> {profesionalSeleccionado.identificacion}</p>
                <p><strong>Especialidad:</strong> {profesionalSeleccionado.especialidad}</p>
                {profesionalSeleccionado.registro_profesional && (
                  <p><strong>Registro profesional:</strong> {profesionalSeleccionado.registro_profesional}</p>
                )}
                <button 
                  type="button" 
                  className="btn-cambiar-profesional"
                  onClick={() => {
                    setProfesionalSeleccionado(null);
                    setBusquedaProfesional('');
                  }}
                  disabled={loading}
                >
                  Cambiar profesional
                </button>
              </div>
            )}
          </div>

          {/* Datos del paciente */}
          <div className="seccion-datos">
            <h3>Datos del Paciente</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre completo *</label>
                <input
                  type="text"
                  value={datosPaciente.nombre}
                  onChange={(e) => setDatosPaciente({...datosPaciente, nombre: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Identificación *</label>
                <input
                  type="text"
                  value={datosPaciente.identificacion}
                  onChange={(e) => setDatosPaciente({...datosPaciente, identificacion: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={datosPaciente.telefono}
                  onChange={(e) => setDatosPaciente({...datosPaciente, telefono: e.target.value})}
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Dirección</label>
                <input
                  type="text"
                  value={datosPaciente.direccion}
                  onChange={(e) => setDatosPaciente({...datosPaciente, direccion: e.target.value})}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Área de firma */}
          <div className="seccion-firma">
            <h3>Firma del Paciente *</h3>
            <div className="firma-container">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="firma-canvas"
                style={{ cursor: loading ? 'not-allowed' : 'crosshair' }}
                disabled={loading}
              />
              <div className="firma-acciones">
                <button onClick={clearSignature} className="btn-limpiar" disabled={loading}>
                  Limpiar Firma
                </button>
                <span className="firma-instructions">
                  Firme en el área superior
                </span>
              </div>
            </div>
          </div>

          {/* Declaraciones */}
          <div className="seccion-declaraciones">
            <h3>Declaraciones</h3>
            <div className="form-group">
              <label>Aceptación del procedimiento</label>
              <input
                type="text"
                value={datosPaciente.aceptacion}
                onChange={(e) => setDatosPaciente({...datosPaciente, aceptacion: e.target.value})}
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label>Declaración de información</label>
              <input
                type="text"
                value={datosPaciente.declaracion}
                onChange={(e) => setDatosPaciente({...datosPaciente, declaracion: e.target.value})}
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label>Observaciones adicionales</label>
              <textarea
                value={datosPaciente.observaciones}
                onChange={(e) => setDatosPaciente({...datosPaciente, observaciones: e.target.value})}
                rows="3"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancelar" disabled={loading}>
            Cancelar
          </button>
          <button 
            onClick={guardarConsentimientoFirmado} 
            className="btn-guardar"
            disabled={!firmaData || !datosPaciente.nombre || !datosPaciente.identificacion || !profesionalSeleccionado || loading}
          >
            {loading ? 'Guardando...' : 'Guardar y Generar PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirmaConsentimiento;