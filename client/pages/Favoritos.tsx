import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Check, Eye, Star, Calendar, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useFavorites } from '../hooks/useFavorites';
import { FILMES_MOCK } from '@shared/mockData';
import { useAuth } from '../contexts/AuthContext';

function FavoritosPage() {
  const [activeTab, setActiveTab] = useState<'assistidos' | 'para-assistir' | 'avaliacoes'>('assistidos');
  const { user } = useAuth();
  const { 
    preferences, 
    toggleAssistido, 
    toggleParaAssistir, 
    setAvaliacao 
  } = useFavorites();

  // Filtrar filmes baseado nas preferências
  const filmesAssistidos = FILMES_MOCK.filter(filme => 
    preferences.filmesAssistidos.includes(filme.GUID)
  );

  const filmesParaAssistir = FILMES_MOCK.filter(filme => 
    preferences.filmesParaAssistir.includes(filme.GUID)
  );

  const filmesAvaliados = FILMES_MOCK.filter(filme => 
    preferences.avaliacoes[filme.GUID]
  );

  const getAvaliacaoTexto = (avaliacao: string) => {
    switch (avaliacao) {
      case 'gostei-muito': return 'Adorei';
      case 'gostei': return 'Gostei';
      case 'nao-gostei': return 'Não Gostei';
      default: return '';
    }
  };

  const getAvaliacaoIcon = (avaliacao: string) => {
    switch (avaliacao) {
      case 'gostei-muito': return <Heart className="h-4 w-4 text-vintage-gold" />;
      case 'gostei': return <Star className="h-4 w-4 text-vintage-gold" />;
      case 'nao-gostei': return <span className="text-red-400">👎</span>;
      default: return null;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-vintage-serif font-bold text-vintage-gold mb-4 vintage-glow">
              Meus Favoritos
            </h1>
            <p className="text-lg text-vintage-cream/80 font-vintage-body">
              Olá, <span className="text-vintage-gold">{user?.nome}</span>! Aqui estão seus filmes favoritos e listas pessoais.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-card border border-vintage-gold/20 rounded-lg mb-8">
            <div className="flex flex-wrap border-b border-vintage-gold/20">
              <button
                onClick={() => setActiveTab('assistidos')}
                className={`px-6 py-4 font-vintage-body transition-colors ${
                  activeTab === 'assistidos'
                    ? 'text-vintage-gold border-b-2 border-vintage-gold'
                    : 'text-vintage-cream/70 hover:text-vintage-gold'
                }`}
              >
                <Check className="h-4 w-4 inline mr-2" />
                Filmes Assistidos ({filmesAssistidos.length})
              </button>
              <button
                onClick={() => setActiveTab('para-assistir')}
                className={`px-6 py-4 font-vintage-body transition-colors ${
                  activeTab === 'para-assistir'
                    ? 'text-vintage-gold border-b-2 border-vintage-gold'
                    : 'text-vintage-cream/70 hover:text-vintage-gold'
                }`}
              >
                <Heart className="h-4 w-4 inline mr-2" />
                Quero Assistir ({filmesParaAssistir.length})
              </button>
              <button
                onClick={() => setActiveTab('avaliacoes')}
                className={`px-6 py-4 font-vintage-body transition-colors ${
                  activeTab === 'avaliacoes'
                    ? 'text-vintage-gold border-b-2 border-vintage-gold'
                    : 'text-vintage-cream/70 hover:text-vintage-gold'
                }`}
              >
                <Star className="h-4 w-4 inline mr-2" />
                Minhas Avaliações ({filmesAvaliados.length})
              </button>
            </div>

            <div className="p-6">
              {/* Filmes Assistidos */}
              {activeTab === 'assistidos' && (
                <div>
                  {filmesAssistidos.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="mx-auto w-24 h-24 bg-vintage-gold/10 rounded-full flex items-center justify-center mb-6">
                        <Check className="w-12 h-12 text-vintage-gold" />
                      </div>
                      <h3 className="text-2xl font-vintage-serif font-bold text-vintage-gold mb-4">
                        Nenhum filme assistido ainda
                      </h3>
                      <p className="text-vintage-cream/80 font-vintage-body mb-6">
                        Comece explorando nosso catálogo e marque os filmes que você já assistiu.
                      </p>
                      <Link to="/filmes">
                        <Button className="btn-vintage">
                          Explorar Filmes
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filmesAssistidos.map((filme) => (
                        <FilmCard 
                          key={filme.GUID} 
                          filme={filme} 
                          showRemoveButton
                          onRemove={() => toggleAssistido(filme.GUID)}
                          removeText="Remover dos Assistidos"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Para Assistir */}
              {activeTab === 'para-assistir' && (
                <div>
                  {filmesParaAssistir.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="mx-auto w-24 h-24 bg-vintage-gold/10 rounded-full flex items-center justify-center mb-6">
                        <Heart className="w-12 h-12 text-vintage-gold" />
                      </div>
                      <h3 className="text-2xl font-vintage-serif font-bold text-vintage-gold mb-4">
                        Sua lista está vazia
                      </h3>
                      <p className="text-vintage-cream/80 font-vintage-body mb-6">
                        Adicione filmes à sua lista "Quero Assistir" para organizá-los aqui.
                      </p>
                      <Link to="/filmes">
                        <Button className="btn-vintage">
                          Descobrir Filmes
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filmesParaAssistir.map((filme) => (
                        <FilmCard 
                          key={filme.GUID} 
                          filme={filme} 
                          showRemoveButton
                          onRemove={() => toggleParaAssistir(filme.GUID)}
                          removeText="Remover da Lista"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Avaliações */}
              {activeTab === 'avaliacoes' && (
                <div>
                  {filmesAvaliados.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="mx-auto w-24 h-24 bg-vintage-gold/10 rounded-full flex items-center justify-center mb-6">
                        <Star className="w-12 h-12 text-vintage-gold" />
                      </div>
                      <h3 className="text-2xl font-vintage-serif font-bold text-vintage-gold mb-4">
                        Nenhuma avaliação ainda
                      </h3>
                      <p className="text-vintage-cream/80 font-vintage-body mb-6">
                        Avalie os filmes que você assistiu para ajudar outros usuários.
                      </p>
                      <Link to="/filmes">
                        <Button className="btn-vintage">
                          Avaliar Filmes
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filmesAvaliados.map((filme) => (
                        <div key={filme.GUID} className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-4">
                          <div className="flex items-center space-x-4">
                            <Link to={`/filme/${filme.GUID}`}>
                              <img 
                                src={filme.imagemUrl} 
                                alt={filme.nomePortugues} 
                                className="w-16 h-24 object-cover rounded"
                              />
                            </Link>
                            
                            <div className="flex-1">
                              <Link to={`/filme/${filme.GUID}`}>
                                <h4 className="font-vintage-serif font-semibold text-vintage-cream hover:text-vintage-gold transition-colors">
                                  {filme.nomePortugues}
                                </h4>
                              </Link>
                              <p className="text-vintage-cream/70 font-vintage-body text-sm italic">
                                "{filme.nomeOriginal}"
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-vintage-cream/60 mt-2">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{filme.ano}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{filme.duracao}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                {getAvaliacaoIcon(preferences.avaliacoes[filme.GUID])}
                                <span className="text-vintage-gold font-vintage-body font-semibold">
                                  {getAvaliacaoTexto(preferences.avaliacoes[filme.GUID])}
                                </span>
                              </div>
                              
                              <Button
                                size="sm"
                                onClick={() => setAvaliacao(filme.GUID, null)}
                                variant="outline"
                                className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/20"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6 text-center">
              <div className="text-3xl font-vintage-serif font-bold text-vintage-gold mb-2">
                {filmesAssistidos.length}
              </div>
              <p className="text-vintage-cream/80 font-vintage-body">Filmes Assistidos</p>
            </div>

            <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6 text-center">
              <div className="text-3xl font-vintage-serif font-bold text-vintage-gold mb-2">
                {filmesParaAssistir.length}
              </div>
              <p className="text-vintage-cream/80 font-vintage-body">Para Assistir</p>
            </div>

            <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6 text-center">
              <div className="text-3xl font-vintage-serif font-bold text-vintage-gold mb-2">
                {filmesAvaliados.length}
              </div>
              <p className="text-vintage-cream/80 font-vintage-body">Filmes Avaliados</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

interface FilmCardProps {
  filme: any;
  showRemoveButton?: boolean;
  onRemove?: () => void;
  removeText?: string;
}

function FilmCard({ filme, showRemoveButton, onRemove, removeText }: FilmCardProps) {
  return (
    <div className="film-card relative group">
      <Link to={`/filme/${filme.GUID}`}>
        <img
          src={filme.imagemUrl}
          alt={filme.nomePortugues}
          className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>
      
      {showRemoveButton && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            onClick={onRemove}
            className="bg-red-500/80 hover:bg-red-500 text-white"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="p-4">
        <Link to={`/filme/${filme.GUID}`}>
          <h3 className="font-vintage-serif font-semibold text-lg text-vintage-cream mb-2 line-clamp-1 group-hover:text-vintage-gold transition-colors">
            {filme.nomePortugues}
          </h3>
        </Link>
        
        <p className="text-sm text-vintage-cream/70 font-vintage-body italic mb-3 line-clamp-1">
          "{filme.nomeOriginal}"
        </p>

        <div className="flex items-center justify-between text-xs text-vintage-cream/60 mb-3">
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
  );
}

export default FavoritosPage;
