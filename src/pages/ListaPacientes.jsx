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
      const response = await fetch(`${API_URL}/pacientes-access`);
      
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
    const url = `/firma-acces?id_paciente=${paciente.id_access}`;
    window.location.href = url;
  };

  const handleClickFirmar = (paciente, e) => {
    e?.stopPropagation();
    handleDobleClickPaciente(paciente);
  };

  // Filtrar pacientes según la búsqueda
  const pacientesFiltrados = pacientes.filter(paciente =>
    paciente.paciente_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    paciente.paciente_identificacion?.includes(busqueda) ||
    paciente.nombre_consentimiento?.toLowerCase().includes(busqueda.toLowerCase())
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
        <img 
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhBCSDxk3yzp9ndJpq1YTQKpn3mZiS1MtwdSyB1mi1IyRARG8SC4aSfYRH3AG-NIq7C9o" 
          alt="Logo" 
          className="logo" 
          style={{height: '40px', width: 'auto'}}
        />
        <h1>Consentimientos por firmar</h1>
        <div className="header-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar por nombre, identificación o consentimiento..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
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
          <span className="stat-label">Pendientes por firmar</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{pacientesFiltrados.length}</span>
          <span className="stat-label">Resultados de búsqueda</span>
        </div>
        {/* <div className="stat-card">
          <span className="stat-number">
            {pacientes.filter(p => p.firmado).length}
          </span>
          <span className="stat-label">Total firmados</span>
        </div> */}
      </div>

      <div className="pacientes-content">
        {/* Vista de tabla para desktop */}
        <div className="pacientes-table-container">
          <div className="pacientes-table-wrapper">
            <table className="pacientes-table">
              <thead>
                <tr>
                  <th>Nombre del Paciente</th>
                  <th>Identificación</th>
                  <th>Consentimiento</th>
                  <th>Especialidad</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pacientesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data">
                      {busqueda ? 'No se encontraron pacientes que coincidan con la búsqueda' : 'No hay pacientes pendientes por firmar'}
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
                      <td className="consentimiento-nombre">
                        {paciente.nombre_consentimiento || 'Sin consentimiento asignado'}
                      </td>
                      <td className="especialidad">
                        {paciente.nombre_especialidad || 'No especificada'}
                      </td>
                      <td className="estado">
                        <span className={`badge ${paciente.firmado ? 'badge-completado' : 'badge-pendiente'}`}>
                          {paciente.firmado ? '✅ Firmado' : '⏳ Pendiente'}
                        </span>
                      </td>
                      <td className="acciones">
                        <button 
                          onClick={(e) => handleClickFirmar(paciente, e)}
                          className="btn btn-firmar btn-sm"
                          title="Abrir ventana de firma"
                          disabled={paciente.firmado}
                        >
                          📝 {paciente.firmado ? 'Firmado' : 'Firmar'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vista de tarjetas para móvil */}
        <div className="pacientes-cards">
          {pacientesFiltrados.length === 0 ? (
            <div className="no-data">
              {busqueda ? 'No se encontraron pacientes que coincidan con la búsqueda' : 'No hay pacientes pendientes por firmar'}
            </div>
          ) : (
            pacientesFiltrados.map((paciente) => (
              <div 
                key={paciente.id_access} 
                className="paciente-card"
                onClick={() => handleDobleClickPaciente(paciente)}
              >
                <div className="paciente-card-header">
                  <div>
                    <div className="paciente-card-nombre">{paciente.paciente_nombre}</div>
                    <div className="paciente-card-identificacion">{paciente.paciente_identificacion}</div>
                  </div>
                  <span className={`badge ${paciente.firmado ? 'badge-completado' : 'badge-pendiente'}`}>
                    {paciente.firmado ? 'Firmado' : 'Pendiente'}
                  </span>
                </div>
                
                <div className="paciente-card-body">
                  <div className="paciente-card-row">
                    <span className="paciente-card-label">Consentimiento:</span>
                    <span className="paciente-card-value">
                      {paciente.nombre_consentimiento || 'Sin asignar'}
                    </span>
                  </div>
                  
                  <div className="paciente-card-row">
                    <span className="paciente-card-label">Especialidad:</span>
                    <span className="paciente-card-value">
                      {paciente.nombre_especialidad || 'No especificada'}
                    </span>
                  </div>
                  
                  <div className="paciente-card-actions">
                    <button 
                      onClick={(e) => handleClickFirmar(paciente, e)}
                      className="btn btn-firmar"
                      disabled={paciente.firmado}
                    >
                      📝 {paciente.firmado ? 'Ya firmado' : 'Firmar consentimiento'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="instrucciones">
        <p>
          💡 <strong>Instrucciones:</strong> Haz doble clic en cualquier fila o presiona el botón "Firmar" 
          para abrir la ventana de firma de consentimientos. Solo se muestran pacientes pendientes por firmar.
        </p>
      </div>
    </div>
  );
};

export default ListaPacientes;