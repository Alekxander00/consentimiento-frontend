import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Consentimientos from "./pages/Consentimientos";
import FirmaConsentimiento from "./pages/FirmaConsentimiento";



function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Inicio</Link>
        <Link to="/consentimientos">Consentimientos</Link>
        {/* <Link to="/firmaConsentimiento">Firmar</Link> */}
      </nav>

      <Routes>
        <Route path="/" element={<h1>Página principal</h1>} />
        <Route path="/consentimientos" element={<Consentimientos />} />
        <Route path="/firmaConsentimiento" element={<FirmaConsentimiento />} />
      </Routes>
    </Router>

    
  );

  
}

export default App;

