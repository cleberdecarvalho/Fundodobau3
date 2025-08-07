import React, { createContext, useContext, useState, useEffect } from "react";
import { filmeStorage } from "../utils/filmeStorage";

import { Filme } from "../../shared/types";

interface FilmesContextType {
  filmes: Filme[];
  carregarFilmes: () => Promise<void>;
}

const FilmesContext = createContext<FilmesContextType>({
  filmes: [],
  carregarFilmes: async () => {},
});

export const useFilmes = () => useContext(FilmesContext);

export const FilmesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [carregado, setCarregado] = useState(false);

  const carregarFilmes = async () => {
    if (!carregado) {
      try {
        const filmesCarregados = await filmeStorage.obterFilmes();
        setFilmes(filmesCarregados);
        setCarregado(true);
      } catch {
        setFilmes([]);
      }
    }
  };

  useEffect(() => {
    carregarFilmes();
    // eslint-disable-next-line
  }, []);

  return (
    <FilmesContext.Provider value={{ filmes, carregarFilmes }}>
      {children}
    </FilmesContext.Provider>
  );
};
