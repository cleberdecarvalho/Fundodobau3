import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FILMES_MOCK } from '@shared/mockData';
import { Filme } from '@shared/types';

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

  // Função de busca avançada
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    
    // Simular delay de busca
    await new Promise(resolve => setTimeout(resolve, 300));

    const searchTerms = query.toLowerCase().trim().split(' ');
    const results: SearchResult[] = [];

    FILMES_MOCK.forEach(filme => {
      let score = 0;
      let matchType: SearchResult['matchType'] = 'title';

      // Busca no título português (peso maior)
      const titleMatches = searchTerms.filter(term => 
        filme.nomePortugues.toLowerCase().includes(term)
      );
      if (titleMatches.length > 0) {
        score += titleMatches.length * 10;
        matchType = 'title';
      }

      // Busca no título original
      const originalMatches = searchTerms.filter(term => 
        filme.nomeOriginal.toLowerCase().includes(term)
      );
      if (originalMatches.length > 0) {
        score += originalMatches.length * 8;
        if (score < originalMatches.length * 8) matchType = 'original';
      }

      // Busca na sinopse
      const synopsisMatches = searchTerms.filter(term => 
        filme.sinopse.toLowerCase().includes(term)
      );
      if (synopsisMatches.length > 0) {
        score += synopsisMatches.length * 3;
        if (score < synopsisMatches.length * 3) matchType = 'synopsis';
      }

      // Busca nas categorias
      const categoryMatches = searchTerms.filter(term => 
        filme.categoria.some(cat => cat.toLowerCase().includes(term))
      );
      if (categoryMatches.length > 0) {
        score += categoryMatches.length * 5;
        if (score < categoryMatches.length * 5) matchType = 'category';
      }

      // Busca no ano
      if (searchTerms.some(term => filme.ano.includes(term))) {
        score += 6;
        if (score < 6) matchType = 'year';
      }

      // Busca por década
      const decade = filme.ano.substring(0, 3) + '0';
      if (searchTerms.some(term => term.includes(decade) || decade.includes(term))) {
        score += 4;
      }

      if (score > 0) {
        results.push({ filme, score, matchType });
      }
    });

    // Ordenar por relevância
    results.sort((a, b) => b.score - a.score);

    setSearchResults(results.slice(0, 8)); // Limitar a 8 resultados
    setShowResults(true);
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
