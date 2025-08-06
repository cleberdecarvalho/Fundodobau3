import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Interface simplificada para evitar problemas de importação
interface Filme {
  GUID: string;
  nomeOriginal: string;
  nomePortugues: string;
  ano: string;
  categoria: string[];
  duracao: string;
  sinopse: string;
  embedLink: string;
  imagemUrl: string;
  assistencias?: number;
}

interface SearchResult {
  filme: Filme;
  score: number;
  matchType: 'title' | 'original' | 'synopsis' | 'category' | 'year';
}

interface SearchContextType {
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;
  showResults: boolean;
  setSearchQuery: (query: string) => void;
  performSearch: (query: string) => void;
  clearSearch: () => void;
  hideResults: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  // Função de busca simplificada
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    
    // Simular delay de busca
    await new Promise(resolve => setTimeout(resolve, 300));

    // Por enquanto, retornar resultados vazios
    // A busca será implementada quando necessário
    setSearchResults([]);
    setShowResults(false);
    setIsSearching(false);
  };

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const hideResults = () => {
    setShowResults(false);
  };

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        searchResults,
        isSearching,
        showResults,
        setSearchQuery,
        performSearch,
        clearSearch,
        hideResults
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch deve ser usado dentro de SearchProvider');
  }
  return context;
}
