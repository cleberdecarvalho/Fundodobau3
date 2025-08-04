import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Clock, Calendar, Star, Heart, Eye, Check, Plus, ThumbsUp, ThumbsDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Filme } from '@shared/types';
import { filmeStorage } from '../utils/filmeStorage';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../hooks/useFavorites';

export default function FilmeDetalhes() {
  const { id } = useParams<{ id: string }>();
  const [filme, setFilme] = useState<Filme | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const {
    jaAssistiu,
    queroAssistir,
    getAvaliacao,
    toggleAssistido,
    toggleParaAssistir,
    setAvaliacao
  } = useFavorites();

  const avaliacao = filme ? getAvaliacao(filme.GUID) : null;
  const filmeJaAssistido = filme ? jaAssistiu(filme.GUID) : false;
  const filmeParaAssistir = filme ? queroAssistir(filme.GUID) : false;

  useEffect(() => {
    if (id) {
      const filmeEncontrado = filmeStorage.obterFilmePorGUID(id);
      setFilme(filmeEncontrado || null);
    }
  }, [id]);

  if (!filme) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-vintage-gold mx-auto mb-4"></div>
          <p className="text-vintage-cream font-vintage-body text-lg">Carregando filme...</p>
        </div>
      </div>
    );
  }

  const handleAvaliacao = (tipo: 'gostei' | 'gostei-muito' | 'nao-gostei') => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: { pathname: `/filme/${filme.GUID}` } } });
      return;
    }
    setAvaliacao(filme.GUID, avaliacao === tipo ? null : tipo);
  };

  const handleToggleAssistido = () => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: { pathname: `/filme/${filme.GUID}` } } });
      return;
    }
    toggleAssistido(filme.GUID);
  };

  const handleToggleParaAssistir = () => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: { pathname: `/filme/${filme.GUID}` } } });
      return;
    }
    toggleParaAssistir(filme.GUID);
  };

  const calcularNota = () => {
    if (!filme.avaliacoes) return 0;
    const total = filme.avaliacoes.gostei + filme.avaliacoes.gosteiMuito + filme.avaliacoes.naoGostei;
    if (total === 0) return 0;
    return Math.round(
      (filme.avaliacoes.gosteiMuito * 5 + filme.avaliacoes.gostei * 3) / total * 100
    ) / 100;
  };

  return (
    <div className="min-h-screen">
      {/* Header com botão voltar */}
      <div className="container mx-auto px-4 pt-8">
        <Link 
          to="/filmes" 
          className="inline-flex items-center text-vintage-cream hover:text-vintage-gold transition-colors font-vintage-body mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar aos Filmes
        </Link>
      </div>

      {/* Hero Section com Player */}
      <section className="relative">
        <div className="container mx-auto px-4 pb-16">
          {/* Seção Principal: Player + Informações do Filme */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Player de Vídeo */}
            <div className="lg:col-span-2">
              <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-4">
                <div className="aspect-video rounded-lg overflow-hidden border border-vintage-gold/10">
                  <iframe
                    src={filme.embedLink.match(/src="([^"]*)"/)![1]}
                    allowFullScreen
                    className="w-full h-full"
                    style={{ border: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Informações do Filme */}
            <div className="lg:col-span-1 flex flex-col justify-between">
              {/* Título e Meta */}
              <div className="mb-6">
                <h1 className="text-3xl lg:text-4xl font-vintage-serif font-bold text-vintage-gold mb-3 vintage-glow">
                  {filme.nomePortugues}
                </h1>
                <p className="text-lg text-vintage-cream/80 italic mb-4 font-vintage-body">
                  "{filme.nomeOriginal}"
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-vintage-cream/80">
                    <Calendar className="h-4 w-4 text-vintage-gold" />
                    <span className="font-vintage-body">{filme.ano}</span>
                  </div>
                  <div className="flex items-center gap-2 text-vintage-cream/80">
                    <Clock className="h-4 w-4 text-vintage-gold" />
                    <span className="font-vintage-body">{filme.duracao}</span>
                  </div>
                  <div className="flex items-center gap-2 text-vintage-cream/80">
                    <Eye className="h-4 w-4 text-vintage-gold" />
                    <span className="font-vintage-body">{filme.assistencias} visualizações</span>
                  </div>
                  {filme.avaliacoes && (
                    <div className="flex items-center gap-2 text-vintage-cream/80">
                      <Star className="h-4 w-4 text-vintage-gold fill-current" />
                      <span className="font-vintage-body">{calcularNota()}/5</span>
                    </div>
                  )}
                </div>

                {/* Categorias */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {filme.categoria.map((cat, index) => (
                    <span
                      key={index}
                      className="bg-vintage-gold/20 text-vintage-gold px-3 py-1 rounded-lg font-vintage-body text-sm"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ações do Usuário */}
              <div className="space-y-4">
                {!isAuthenticated && (
                  <div className="bg-vintage-gold/10 border border-vintage-gold/30 rounded-lg p-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-vintage-gold" />
                      <div>
                        <p className="text-vintage-gold font-vintage-serif font-semibold text-sm">Faça login</p>
                        <p className="text-vintage-cream/80 font-vintage-body text-xs">
                          Para interagir com o filme
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  <Button
                    onClick={handleToggleAssistido}
                    variant={filmeJaAssistido ? "default" : "outline"}
                    className={filmeJaAssistido
                      ? "bg-vintage-gold text-vintage-black hover:bg-vintage-gold-dark w-full"
                      : "bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold hover:text-vintage-black w-full"
                    }
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {filmeJaAssistido ? 'Assistido' : 'Já Assisti'}
                  </Button>

                  <Button
                    onClick={handleToggleParaAssistir}
                    variant={filmeParaAssistir ? "default" : "outline"}
                    className={filmeParaAssistir
                      ? "bg-vintage-gold text-vintage-black hover:bg-vintage-gold-dark w-full"
                      : "bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold hover:text-vintage-black w-full"
                    }
                  >
                    {filmeParaAssistir ? <Heart className="h-4 w-4 mr-2 fill-current" /> : <Plus className="h-4 w-4 mr-2" />}
                    {filmeParaAssistir ? 'Na Lista' : 'Quero Ver'}
                  </Button>
                </div>

                {/* Avaliações Compactas */}
                <div className="border-t border-vintage-gold/20 pt-4">
                  <p className="text-sm font-vintage-serif font-semibold text-vintage-gold mb-3 text-center">
                    {isAuthenticated ? 'Sua Avaliação' : 'Avalie'}
                  </p>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => handleAvaliacao('nao-gostei')}
                      className={`p-2 rounded-full transition-all duration-300 ${
                        avaliacao === 'nao-gostei'
                          ? 'bg-red-500 text-white'
                          : 'bg-vintage-black/50 text-vintage-cream hover:bg-red-500/20'
                      }`}
                      title={!isAuthenticated ? "Faça login para avaliar" : "Não gostei"}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleAvaliacao('gostei')}
                      className={`p-2 rounded-full transition-all duration-300 ${
                        avaliacao === 'gostei'
                          ? 'bg-vintage-gold text-vintage-black'
                          : 'bg-vintage-black/50 text-vintage-cream hover:bg-vintage-gold/20'
                      }`}
                      title={!isAuthenticated ? "Faça login para avaliar" : "Gostei"}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleAvaliacao('gostei-muito')}
                      className={`p-2 rounded-full transition-all duration-300 ${
                        avaliacao === 'gostei-muito'
                          ? 'bg-vintage-gold text-vintage-black'
                          : 'bg-vintage-black/50 text-vintage-cream hover:bg-vintage-gold/20'
                      }`}
                      title={!isAuthenticated ? "Faça login para avaliar" : "Adorei"}
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>
                  {!isAuthenticated && (
                    <p className="text-center text-vintage-cream/60 font-vintage-body text-xs mt-2">
                      <button
                        onClick={() => navigate('/auth')}
                        className="text-vintage-gold hover:text-vintage-gold-dark transition-colors"
                      >
                        Login
                      </button> para salvar
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Seção Inferior: Poster + Sinopse */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Poster do Filme */}
            <div className="lg:col-span-1">
              <img
                src={filme.imagemUrl}
                alt={filme.nomePortugues}
                className="w-full max-w-sm mx-auto lg:mx-0 rounded-lg shadow-2xl"
              />
            </div>

            {/* Sinopse e Estatísticas */}
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h3 className="text-2xl font-vintage-serif font-semibold text-vintage-gold mb-4">
                  Sinopse
                </h3>
                <p className="text-base text-vintage-cream/90 font-vintage-body leading-relaxed">
                  {filme.sinopse}
                </p>
              </div>

              {/* Estatísticas e Avaliações */}
              {filme.avaliacoes && (
                <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6">
                  <h3 className="text-lg font-vintage-serif font-semibold text-vintage-gold mb-4">
                    Avaliações da Comunidade
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-vintage-serif font-bold text-vintage-gold mb-1">
                        {filme.avaliacoes.gosteiMuito}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-vintage-cream/80">
                        <Heart className="h-3 w-3 text-vintage-gold" />
                        <span className="font-vintage-body text-sm">Adoraram</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-vintage-serif font-bold text-vintage-gold mb-1">
                        {filme.avaliacoes.gostei}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-vintage-cream/80">
                        <ThumbsUp className="h-3 w-3 text-vintage-gold" />
                        <span className="font-vintage-body text-sm">Gostaram</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-vintage-serif font-bold text-vintage-gold mb-1">
                        {filme.avaliacoes.naoGostei}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-vintage-cream/80">
                        <ThumbsDown className="h-3 w-3 text-vintage-gold" />
                        <span className="font-vintage-body text-sm">Não Gostaram</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
