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
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [posicion, setPosicion] = useState({ x: 0, y: 0 });
  const busquedaRef = useRef(null);

  // Cargar profesionales al abrir el modal
  useEffect(() => {
    const cargarProfesionales = async () => {
  try {
    const response = await fetch('http://localhost:4000/profesionales');
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    setProfesionales(data);
  } catch (error) {
    console.error('Error al cargar profesionales:', error);
    // Puedes mostrar un mensaje al usuario si lo deseas
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
  }, []);

  // Filtrar profesionales según la búsqueda
  const profesionalesFiltrados = busquedaProfesional
    ? profesionales.filter(p =>
        p.nombre.toLowerCase().includes(busquedaProfesional.toLowerCase()) ||
        p.especialidad.toLowerCase().includes(busquedaProfesional.toLowerCase())
      )
    : profesionales;

  // Iniciar dibujo de firma
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
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
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(posicion.x, posicion.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setPosicion({ x, y });
  };

  // Finalizar dibujo
  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    setFirmaData(canvas.toDataURL());
  };

  // Limpiar firma
  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setFirmaData(null);
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
      // Convertir la firma de dataURL a Blob
      const response = await fetch(firmaData);
      const firmaBlob = await response.blob();

      // Crear FormData
      const formData = new FormData();
      formData.append('idconsto', consentimiento.idconsto);
      formData.append('paciente_nombre', datosPaciente.nombre);
      formData.append('paciente_identificacion', datosPaciente.identificacion);
      formData.append('paciente_telefono', datosPaciente.telefono);
      formData.append('paciente_direccion', datosPaciente.direccion);
      formData.append('paciente_firma', firmaBlob, 'firma.png');
      formData.append('aceptacion', datosPaciente.aceptacion);
      formData.append('declaracion', datosPaciente.declaracion);
      formData.append('observaciones', datosPaciente.observaciones);
      formData.append('profesional_id', profesionalSeleccionado.id);

      const responseBackend = await fetch('http://localhost:4000/consentimientos-firmados', {
        method: 'POST',
        body: formData,
      });

      if (responseBackend.ok) {
        const resultado = await responseBackend.json();
        
        // Descargar el PDF desde el backend
        window.open(`http://localhost:4000/generar-pdf/${resultado.id}`, '_blank');
        
        alert('Consentimiento firmado y guardado correctamente. El PDF se está descargando.');
        if (onSave) onSave();
        if (onClose) onClose();
      } else {
        const errorData = await responseBackend.json();
        alert(`Error al guardar: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión con el servidor');
    }
  };

  return (
    <div className="firma-modal-overlay">
      <div className="firma-modal">
        <div className="modal-header">
          <h2>Firmar Consentimiento: {consentimiento.nombre}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
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
                />
              </div>
              
              <div className="form-group">
                <label>Identificación *</label>
                <input
                  type="text"
                  value={datosPaciente.identificacion}
                  onChange={(e) => setDatosPaciente({...datosPaciente, identificacion: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={datosPaciente.telefono}
                  onChange={(e) => setDatosPaciente({...datosPaciente, telefono: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Dirección</label>
                <input
                  type="text"
                  value={datosPaciente.direccion}
                  onChange={(e) => setDatosPaciente({...datosPaciente, direccion: e.target.value})}
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
              />
              <div className="firma-acciones">
                <button onClick={clearSignature} className="btn-limpiar">
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
              />
            </div>
            
            <div className="form-group">
              <label>Declaración de información</label>
              <input
                type="text"
                value={datosPaciente.declaracion}
                onChange={(e) => setDatosPaciente({...datosPaciente, declaracion: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Observaciones adicionales</label>
              <textarea
                value={datosPaciente.observaciones}
                onChange={(e) => setDatosPaciente({...datosPaciente, observaciones: e.target.value})}
                rows="3"
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancelar">
            Cancelar
          </button>
          <button 
            onClick={guardarConsentimientoFirmado} 
            className="btn-guardar"
            disabled={!firmaData || !datosPaciente.nombre || !datosPaciente.identificacion || !profesionalSeleccionado}
          >
            Guardar y Generar PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirmaConsentimiento;