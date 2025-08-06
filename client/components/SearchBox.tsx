import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, Calendar, Star, X } from 'lucide-react';
import { useSearch } from '../contexts/SearchContext';

interface SearchBoxProps {
  className?: string;
  placeholder?: string;
  showResults?: boolean;
}

export function SearchBox({ className = '', placeholder = 'Buscar filmes...', showResults = true }: SearchBoxProps) {
  const {
    searchQuery,
    searchResults,
    isSearching,
    showResults: showResultsContext,
    setSearchQuery,
    performDirectSearch,
    clearSearch,
    hideResults
  } = useSearch();

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fechar resultados ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        hideResults();
      }
    }

    if (showResultsContext && showResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showResultsContext, showResults, hideResults]);

  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case 'title': return 'Título';
      case 'original': return 'Título Original';
      case 'synopsis': return 'Sinopse';
      case 'category': return 'Categoria';
      case 'year': return 'Ano';
      default: return '';
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const searchTerms = query.toLowerCase().split(' ');
    let result = text;
    
    searchTerms.forEach(term => {
      if (term.length > 1) {
        const regex = new RegExp(`(${term})`, 'gi');
        result = result.replace(regex, '<mark class="bg-vintage-gold/30 text-vintage-gold">$1</mark>');
      }
    });
    
    return result;
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              performDirectSearch(searchQuery);
            }
          }}
          className="w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-4 py-2 pl-10 pr-10 text-vintage-cream placeholder-vintage-cream/50 focus:border-vintage-gold focus:outline-none font-cinema-body"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vintage-gold/70 h-4 w-4" />
        
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-vintage-gold/70 hover:text-vintage-gold transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        
        {isSearching && (
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-vintage-gold"></div>
          </div>
        )}
      </div>

      {/* Resultados da Busca */}
      {showResults && showResultsContext && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-vintage-black/95 backdrop-blur-sm border border-vintage-gold/30 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto vintage-scrollbar">
          <div className="p-2">
            <div className="flex items-center justify-between px-3 py-2 border-b border-vintage-gold/20">
              <span className="text-sm text-vintage-gold font-cinema-accent">
                {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
              </span>
              <Link
                to={`/filmes?q=${encodeURIComponent(searchQuery)}`}
                onClick={() => hideResults()}
                className="text-xs text-vintage-cream/70 hover:text-vintage-gold transition-colors font-cinema-body"
              >
                Ver todos →
              </Link>
            </div>
            
            <div className="py-2">
              {searchResults.map(({ filme, matchType }) => (
                <Link
                  key={filme.GUID}
                  to={`/filme/${filme.GUID}`}
                  onClick={() => hideResults()}
                  className="flex items-center space-x-3 p-3 hover:bg-vintage-gold/10 rounded-lg transition-colors group"
                >
                  <img
                    src={filme.imagemUrl}
                    alt={filme.nomePortugues}
                    className="w-12 h-16 object-cover rounded flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h4 
                      className="font-cinema-accent text-vintage-cream group-hover:text-vintage-gold transition-colors line-clamp-1"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightMatch(filme.nomePortugues, searchQuery) 
                      }}
                    />
                    <p 
                      className="text-sm text-vintage-cream/70 italic line-clamp-1 font-cinema-body"
                      dangerouslySetInnerHTML={{ 
                        __html: `"${highlightMatch(filme.nomeOriginal, searchQuery)}"` 
                      }}
                    />
                    
                    <div className="flex items-center space-x-3 mt-1">
                      <div className="flex items-center space-x-1 text-xs text-vintage-cream/60">
                        <Calendar className="h-3 w-3" />
                        <span className="font-cinema-body">{filme.ano}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-vintage-cream/60">
                        <Clock className="h-3 w-3" />
                        <span className="font-cinema-body">{filme.duracao}</span>
                      </div>
                      {filme.avaliacoes && (
                        <div className="flex items-center space-x-1 text-xs text-vintage-cream/60">
                          <Star className="h-3 w-3" />
                          <span className="font-cinema-body">
                            {Math.round(
                              (filme.avaliacoes.gosteiMuito * 5 + filme.avaliacoes.gostei * 3) /
                              (filme.avaliacoes.gostei + filme.avaliacoes.gosteiMuito + filme.avaliacoes.naoGostei) * 100
                            ) / 100}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs bg-vintage-gold/20 text-vintage-gold px-2 py-0.5 rounded font-cinema-body">
                        {getMatchTypeLabel(matchType)}
                      </span>
                      {filme.categoria.slice(0, 2).map((cat, index) => (
                        <span
                          key={index}
                          className="text-xs bg-vintage-black/30 text-vintage-cream/60 px-2 py-0.5 rounded font-cinema-body"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sem resultados */}
      {showResults && showResultsContext && searchQuery && searchResults.length === 0 && !isSearching && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-vintage-black/95 backdrop-blur-sm border border-vintage-gold/30 rounded-lg shadow-xl z-50">
          <div className="p-6 text-center">
            <Search className="h-8 w-8 text-vintage-gold/50 mx-auto mb-3" />
            <h4 className="text-lg font-cinema-accent text-vintage-gold mb-2">
              Nenhum resultado encontrado
            </h4>
            <p className="text-vintage-cream/70 font-cinema-body text-sm">
              Tente buscar por título, ator, diretor, ano ou gênero do filme.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
