import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Grid, List, Star, Calendar, Clock, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getImageSrc } from '@/utils/images';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CATEGORIAS, DECADAS } from '@shared/types';
import { useFilmes } from '@/contexts/FilmesContext';

export default function Filmes() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategorias, setSelectedCategorias] = useState<string[]>([]);
  const [selectedDecada, setSelectedDecada] = useState<string>('');
  const [sortBy, setSortBy] = useState<'nome' | 'ano' | 'assistencias'>('nome');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { filmes, isLoading } = useFilmes();

  // Carregar parâmetros da URL
  useEffect(() => {
    const queryFromUrl = searchParams.get('q');
    const categoriaFromUrl = searchParams.get('categoria');
    
    if (queryFromUrl) {
      setSearchQuery(queryFromUrl);
    }
    
    if (categoriaFromUrl) {
      setSelectedCategorias([categoriaFromUrl]);
    }
  }, [searchParams]);

  // filmes agora vem do contexto com cache + SWR

  // Filtrar filmes
  const filmesFiltrados = useMemo(() => {
    let filmesParaFiltrar = [...filmes];

    // Filtro por busca
    if (searchQuery) {
      filmesParaFiltrar = filmesParaFiltrar.filter(filme =>
        filme.nomePortugues.toLowerCase().includes(searchQuery.toLowerCase()) ||
        filme.nomeOriginal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        filme.sinopse.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por categorias
    if (selectedCategorias.length > 0) {
      filmesParaFiltrar = filmesParaFiltrar.filter(filme =>
        selectedCategorias.some(cat => filme.categoria.includes(cat))
      );
    }

    // Filtro por década
    if (selectedDecada && selectedDecada !== 'todas') {
      filmesParaFiltrar = filmesParaFiltrar.filter(filme => filme.ano.startsWith(selectedDecada));
    }

    // Ordenação
    filmesParaFiltrar.sort((a, b) => {
      switch (sortBy) {
        case 'ano':
          return parseInt(b.ano) - parseInt(a.ano);
        case 'assistencias':
          return (b.assistencias || 0) - (a.assistencias || 0);
        default:
          return a.nomePortugues.localeCompare(b.nomePortugues);
      }
    });

    return filmesParaFiltrar;
  }, [filmes, searchQuery, selectedCategorias, selectedDecada, sortBy]);

  const toggleCategoria = (categoria: string) => {
    setSelectedCategorias(prev => 
      prev.includes(categoria) 
        ? prev.filter(c => c !== categoria)
        : [...prev, categoria]
    );
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header da Página */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-vintage-gold mb-4">
            Catálogo de Filmes
          </h1>
          <p className="text-lg text-vintage-cream/80 font-vintage-body max-w-3xl">
            Explore nossa coleção completa de clássicos do cinema. Use os filtros para encontrar exatamente o que procura.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar com Filtros */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="bg-card border border-vintage-gold/20 rounded-lg p-6 sticky top-24">
              {/* Toggle Filtros Mobile */}
              <div className="lg:hidden mb-4">
                <Button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  variant="outline"
                  className="w-full bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold hover:text-vintage-black"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {isFilterOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                </Button>
              </div>

              <div className={`space-y-6 ${!isFilterOpen && 'hidden lg:block'}`}>
                {/* Busca */}
                <div>
                  <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                    Buscar Filmes
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Digite o nome do filme..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-4 py-2 pl-10 text-vintage-cream placeholder-vintage-cream/50 focus:border-vintage-gold focus:outline-none font-vintage-body"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vintage-gold/70 h-4 w-4" />
                  </div>
                </div>

                {/* Filtro por Década */}
                <div>
                  <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                    Década
                  </label>
                  <Select value={selectedDecada} onValueChange={setSelectedDecada}>
                    <SelectTrigger className="bg-vintage-black/50 border-vintage-gold/30 text-vintage-cream">
                      <SelectValue placeholder="Todas as décadas" />
                    </SelectTrigger>
                    <SelectContent className="bg-vintage-black border-vintage-gold/30">
                      <SelectItem value="todas">Todas as décadas</SelectItem>
                      {DECADAS.map((decada) => (
                        <SelectItem key={decada.decada} value={decada.decada}>
                          {decada.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Categorias */}
                <div>
                  <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                    Categorias
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto vintage-scrollbar">
                    {CATEGORIAS.map((categoria) => (
                      <div key={categoria.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={categoria.id}
                          checked={selectedCategorias.includes(categoria.nome)}
                          onCheckedChange={() => toggleCategoria(categoria.nome)}
                          className="border-vintage-gold/30 text-vintage-gold"
                        />
                        <label 
                          htmlFor={categoria.id} 
                          className="text-sm text-vintage-cream/80 font-vintage-body cursor-pointer hover:text-vintage-gold transition-colors"
                        >
                          {categoria.nome}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TOP 5 Mais Assistidos */}
                <div className="border-t border-vintage-gold/20 pt-6">
                  <h3 className="text-lg font-vintage-serif font-semibold text-vintage-gold mb-4">
                    TOP 5 Mais Assistidos
                  </h3>
                  <div className="space-y-3">
                    {filmes.length > 0 ? (
                      filmes
                        .sort((a, b) => (b.assistencias || 0) - (a.assistencias || 0))
                        .slice(0, 5)
                        .map((filme, index) => (
                          <Link 
                            key={filme.GUID} 
                            to={`/filme/${filme.GUID}`}
                            className="block group"
                          >
                            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-vintage-gold/10 transition-colors">
                              <span className="text-vintage-gold font-vintage-serif font-bold text-lg w-6">
                                {index + 1}
                              </span>
                              <img 
                                src={getImageSrc(filme.imagemUrl)} 
                                alt={filme.nomePortugues}
                                loading="lazy"
                                className="w-10 h-14 object-cover rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-vintage-cream group-hover:text-vintage-gold transition-colors font-vintage-body truncate">
                                  {filme.nomePortugues}
                                </p>
                                <p className="text-xs text-vintage-cream/60 font-vintage-body">
                                  {filme.ano} • {filme.assistencias || 0} views
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-vintage-cream/60 font-vintage-body">
                          Nenhum filme disponível
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Conteúdo Principal */}
          <main className="flex-1">
            {/* Controles de Visualização */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center space-x-4">
                <span className="text-vintage-cream/80 font-vintage-body">
                  {filmesFiltrados.length} filme{filmesFiltrados.length !== 1 ? 's' : ''} encontrado{filmesFiltrados.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center space-x-4">
                {/* Ordenação */}
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="bg-vintage-black/50 border-vintage-gold/30 text-vintage-cream w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-vintage-black border-vintage-gold/30">
                    <SelectItem value="nome">Ordenar por Nome</SelectItem>
                    <SelectItem value="ano">Ordenar por Ano</SelectItem>
                    <SelectItem value="assistencias">Mais Assistidos</SelectItem>
                  </SelectContent>
                </Select>

                {/* Modo de Visualização */}
                <div className="flex border border-vintage-gold/30 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-vintage-gold text-vintage-black' 
                        : 'text-vintage-cream hover:bg-vintage-gold/20'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-vintage-gold text-vintage-black' 
                        : 'text-vintage-cream hover:bg-vintage-gold/20'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Grid/Lista de Filmes */}
            {filmesFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-vintage-gold/10 rounded-full flex items-center justify-center mb-6">
                  <Search className="w-12 h-12 text-vintage-gold" />
                </div>
                <h3 className="text-2xl font-vintage-serif font-bold text-vintage-gold mb-4">
                  Nenhum filme encontrado
                </h3>
                <p className="text-vintage-cream/80 font-vintage-body">
                  Tente ajustar os filtros ou termos de busca para encontrar o que procura.
                </p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
                : 'space-y-4'
              }>
                {filmesFiltrados.map((filme) => (
                  viewMode === 'grid' ? (
                    <FilmGridCard key={filme.GUID} filme={filme} />
                  ) : (
                    <FilmListCard key={filme.GUID} filme={filme} />
                  )
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function FilmGridCard({ filme }: { filme: any }) {
  return (
    <Link to={`/filme/${filme.GUID}`} className="group">
      <div className="film-card">
        <div className="relative overflow-hidden">
          <img
            src={getImageSrc(filme.imagemUrl)}
            alt={filme.nomePortugues}
            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-vintage-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-vintage-gold rounded-full p-3 transform transition-transform duration-300 hover:scale-110">
              <Play className="h-6 w-6 text-vintage-black" />
            </div>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-vintage-serif font-semibold text-lg text-vintage-cream mb-1 line-clamp-1 group-hover:text-vintage-gold transition-colors">
            {filme.nomePortugues}
          </h3>
          <p className="text-sm text-vintage-cream/70 font-vintage-body italic mb-2 line-clamp-1">
            "{filme.nomeOriginal}"
          </p>
          <div className="flex items-center justify-between text-xs text-vintage-cream/60 mb-2">
            <span className="font-vintage-body">{filme.ano}</span>
            <span className="font-vintage-body">{filme.duracao}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {filme.categoria.slice(0, 2).map((cat: string, index: number) => (
              <span
                key={index}
                className="text-xs bg-vintage-gold/20 text-vintage-gold px-2 py-1 rounded font-vintage-body"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

function FilmListCard({ filme }: { filme: any }) {
  return (
    <Link to={`/filme/${filme.GUID}`} className="group">
      <div className="film-card flex">
        <div className="relative overflow-hidden">
          <img
            src={getImageSrc(filme.imagemUrl)}
            alt={filme.nomePortugues}
            className="w-24 h-36 object-cover flex-shrink-0"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-vintage-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-vintage-gold rounded-full p-2 transform transition-transform duration-300 hover:scale-110">
              <Play className="h-4 w-4 text-vintage-black" />
            </div>
          </div>
        </div>
        <div className="p-4 flex-1">
          <h3 className="font-vintage-serif font-semibold text-xl text-vintage-cream mb-2 group-hover:text-vintage-gold transition-colors">
            {filme.nomePortugues}
          </h3>
          <p className="text-sm text-vintage-cream/70 font-vintage-body italic mb-2">
            "{filme.nomeOriginal}"
          </p>
          <div className="flex items-center space-x-4 text-sm text-vintage-cream/60 mb-3">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span className="font-vintage-body">{filme.ano}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span className="font-vintage-body">{filme.duracao}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {filme.categoria.map((cat: string, index: number) => (
              <span
                key={index}
                className="text-xs bg-vintage-gold/20 text-vintage-gold px-2 py-1 rounded font-vintage-body"
              >
                {cat}
              </span>
            ))}
          </div>
          <p className="text-sm text-vintage-cream/80 font-vintage-body line-clamp-2 leading-relaxed">
            {filme.sinopse}
          </p>
        </div>
      </div>
    </Link>
  );
}
