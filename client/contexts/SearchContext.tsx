import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { filmeStorage } from '../utils/filmeStorage';

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
  performDirectSearch: (query: string) => void;
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

  // Função de busca real na base de dados
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    
    try {
      // Buscar todos os filmes
      const filmes = await filmeStorage.obterFilmes();
      const searchTerm = query.toLowerCase().trim();
      
      const results: SearchResult[] = [];
      
      filmes.forEach(filme => {
        let score = 0;
        let matchType: SearchResult['matchType'] = 'title';
        
        // Busca por título em português (maior peso)
        if (filme.nomePortugues.toLowerCase().includes(searchTerm)) {
          score += 100;
          matchType = 'title';
        }
        
        // Busca por título original (alto peso)
        if (filme.nomeOriginal.toLowerCase().includes(searchTerm)) {
          score += 90;
          matchType = 'original';
        }
        
        // Busca por ano (médio peso)
        if (filme.ano.includes(searchTerm)) {
          score += 50;
          matchType = 'year';
        }
        
        // Busca por categoria (baixo peso)
        if (filme.categoria.some(cat => cat.toLowerCase().includes(searchTerm))) {
          score += 30;
          matchType = 'category';
        }
        
        // Busca por sinopse (baixo peso)
        if (filme.sinopse.toLowerCase().includes(searchTerm)) {
          score += 20;
          matchType = 'synopsis';
        }
        
        // Se encontrou algum resultado, adicionar à lista
        if (score > 0) {
          results.push({ filme, score, matchType });
        }
      });
      
      // Ordenar por relevância (score)
      results.sort((a, b) => b.score - a.score);
      
      // Limitar a 10 resultados
      const limitedResults = results.slice(0, 10);
      
      setSearchResults(limitedResults);
      setShowResults(true);
      
    } catch (error) {
      console.error('Erro na busca:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
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

  // Função para busca direta (quando pressiona Enter)
  const performDirectSearch = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      const filmes = await filmeStorage.obterFilmes();
      const searchTerm = query.toLowerCase().trim();
      
      // Buscar filme exato primeiro
      const exactMatch = filmes.find(filme => 
        filme.nomePortugues.toLowerCase() === searchTerm ||
        filme.nomeOriginal.toLowerCase() === searchTerm
      );
      
      if (exactMatch) {
        // Navegar direto para a página do filme
        navigate(`/filme/${exactMatch.GUID}`);
        clearSearch();
        return;
      }
      
      // Se não encontrou match exato, buscar por similaridade
      const similarMatches = filmes.filter(filme => 
        filme.nomePortugues.toLowerCase().includes(searchTerm) ||
        filme.nomeOriginal.toLowerCase().includes(searchTerm) ||
        filme.ano.includes(searchTerm) ||
        filme.categoria.some(cat => cat.toLowerCase().includes(searchTerm))
      );
      
      if (similarMatches.length === 1) {
        // Se encontrou apenas um resultado similar, navegar para ele
        navigate(`/filme/${similarMatches[0].GUID}`);
        clearSearch();
        return;
      }
      
      // Se encontrou múltiplos resultados ou nenhum, navegar para página de filmes com busca
      navigate(`/filmes?q=${encodeURIComponent(query)}`);
      clearSearch();
      
    } catch (error) {
      console.error('Erro na busca direta:', error);
      // Em caso de erro, navegar para página de filmes
      navigate(`/filmes?q=${encodeURIComponent(query)}`);
      clearSearch();
    }
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
        performDirectSearch,
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
