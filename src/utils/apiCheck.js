export const checkBackendConnection = async () => {
  const API_URL = import.meta.env.VITE_API_URL;
  
  
  console.log('🔗 Verificando conexión con el backend...');
  console.log('📡 URL del backend:', API_URL);
  
  try {
    // Verificar health check
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json(); // ahora sí devuelve JSON

    
    console.log('✅ Health check:', healthData);
    
    // Verificar consentimientos
    const consentimientosResponse = await fetch(`${API_URL}/consentimientos`);
    const consentimientosData = await consentimientosResponse.json();
    
    console.log('📋 Consentimientos cargados:', consentimientosData.length);
    
    return {
      success: true,
      health: healthData,
      consentimientosCount: consentimientosData.length,
      apiUrl: API_URL
    };
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    return {
      success: false,
      error: error.message,
      apiUrl: API_URL
    };
  }
};