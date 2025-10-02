// FirmaContext.jsx
import { createContext, useContext, useState } from "react";

const FirmaContext = createContext();

export function FirmaProvider({ children }) {
  const [firmaData, setFirmaData] = useState(null);
  return (
    <FirmaContext.Provider value={{ firmaData, setFirmaData }}>
      {children}
    </FirmaContext.Provider>
  );
}

export function useFirma() {
  return useContext(FirmaContext);
}
