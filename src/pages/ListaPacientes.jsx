import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ListaPacientes.css';

const ListaPacientes = () => {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [temaOscuro, setTemaOscuro] = useState(false);
  const navigate = useNavigate();

  // Efecto para aplicar el tema
  useEffect(() => {
    if (temaOscuro) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [temaOscuro]);

  // Cargar pacientes desde la base de datos
  useEffect(() => {
    cargarPacientes();
  }, []);

  const cargarPacientes = async () => {
    try {
            setLoading(true);
            const API_URL = import.meta.env.VITE_API_URL || '/api';
            // Cambia esta línea:
            const response = await fetch(`${API_URL}/pacientes-access`);
            // O si usas la ruta directa:
            // const response = await fetch(`/api/pacientes-access`);
            
            if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            setPacientes(data);
        } catch (err) {
            setError('No se pudieron cargar los pacientes: ' + err.message);
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };
  const toggleTema = () => {
    setTemaOscuro(!temaOscuro);
  };

  const handleDobleClickPaciente = (paciente) => {
    // Abrir ventana de firma con los datos del paciente
    const url = `/firma-access?id_paciente=${paciente.id_access}`; //&id_consentimiento=${paciente.consentimiento_id  || ''}`
    window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes');
  };

  const handleEditarPaciente = (paciente, e) => {
    e.stopPropagation(); // Evitar que se active el doble clic
    // Aquí puedes implementar la edición del paciente si es necesario
    console.log('Editar paciente:', paciente);
  };

  // Filtrar pacientes según la búsqueda
  const pacientesFiltrados = pacientes.filter(paciente =>
    paciente.paciente_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    paciente.paciente_identificacion?.includes(busqueda) ||
    paciente.paciente_telefono?.includes(busqueda)
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando pacientes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={cargarPacientes} className="btn btn-primary">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="lista-pacientes-container">
      <header className="lista-pacientes-header">
        <h1>Lista de Pacientes</h1>
        <div className="header-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="search-input"
            />
            <span className="search-icon"></span>
          </div>
          <button 
            className="btn btn-outline theme-toggle"
            onClick={toggleTema}
            title={temaOscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            {temaOscuro ? '☀️' : '🌙'}
          </button>
          <button onClick={cargarPacientes} className="btn btn-outline">
            🔄 Actualizar
          </button>
        </div>
      </header>

      <div className="pacientes-stats">
        <div className="stat-card">
          <span className="stat-number">{pacientes.length}</span>
          <span className="stat-label">Total de pacientes</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{pacientesFiltrados.length}</span>
          <span className="stat-label">Resultados de búsqueda</span>
        </div>
      </div>

      <div className="pacientes-table-container">
        <table className="pacientes-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Identificación</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th>ID Consentimiento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pacientesFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  {busqueda ? 'No se encontraron pacientes que coincidan con la búsqueda' : 'No hay pacientes registrados'}
                </td>
              </tr>
            ) : (
              pacientesFiltrados.map((paciente) => (
                <tr 
                  key={paciente.id_access} 
                  className="paciente-row"
                  onDoubleClick={() => handleDobleClickPaciente(paciente)}
                  title="Doble clic para abrir ventana de firma"
                >
                  <td className="paciente-nombre">{paciente.paciente_nombre}</td>
                  <td className="paciente-identificacion">{paciente.paciente_identificacion}</td>
                  <td className="paciente-telefono">{paciente.paciente_telefono || 'No especificado'}</td>
                  <td className="paciente-direccion">{paciente.paciente_direccion || 'No especificado'}</td>
                  <td className="consentimiento-id">{paciente.consentimiento_id || 'No asignado'}</td>
                  <td className="acciones">
                    <button 
                      onClick={() => handleDobleClickPaciente(paciente)}
                      className="btn btn-primary btn-sm"
                      title="Abrir ventana de firma"
                    >
                      📝 Firmar
                    </button>
                    <button 
                      onClick={(e) => handleEditarPaciente(paciente, e)}
                      className="btn btn-outline btn-sm"
                      title="Editar paciente"
                    >
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="instrucciones">
        <p>💡 <strong>Instrucciones:</strong> Haz doble clic en cualquier fila o presiona el botón "Firmar" para abrir la ventana de firma de consentimientos.</p>
      </div>
    </div>
  );
};

export default ListaPacientes;