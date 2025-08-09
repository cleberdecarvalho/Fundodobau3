import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Clock, Calendar, Star, Heart, Eye, Check, Plus, ThumbsUp, ThumbsDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Filme } from '@shared/types';
import { filmeStorage } from '../utils/filmeStorage';
import { avaliacoesStorage, EstatisticasFilme } from '../utils/avaliacoesStorage';
import { useAuth } from '../contexts/AuthContext';

export default function FilmeDetalhes() {
  const { id } = useParams<{ id: string }>();
  const [filme, setFilme] = useState<Filme | null>(null);
  const [estatisticas, setEstatisticas] = useState<EstatisticasFilme | null>(null);
  const [interacoesUsuario, setInteracoesUsuario] = useState<{
    assistido: boolean;
    quero_ver: boolean;
    favorito: boolean;
    avaliacao: number | null;
  }>({
    assistido: false,
    quero_ver: false,
    favorito: false,
    avaliacao: null
  });
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const carregarFilme = async () => {
      if (id) {
        try {
          const filmeEncontrado = await filmeStorage.obterFilmePorGUID(id);
          setFilme(filmeEncontrado || null);
          
          if (filmeEncontrado) {
            // Carregar estatísticas do filme
            const stats = await avaliacoesStorage.obterEstatisticasFilme(filmeEncontrado.GUID);
            setEstatisticas(stats);
            
            // Carregar interações do usuário se estiver logado
            if (isAuthenticated) {
              const interacoes = await avaliacoesStorage.obterInteracoesUsuario();
              const filmeInteracoes = interacoes.filter(i => i.filme_guid === filmeEncontrado.GUID);
              
              setInteracoesUsuario({
                assistido: filmeInteracoes.some(i => i.tipo_interacao === 'assistido'),
                quero_ver: filmeInteracoes.some(i => i.tipo_interacao === 'quero_ver'),
                favorito: filmeInteracoes.some(i => i.tipo_interacao === 'favorito'),
                avaliacao: filmeInteracoes.find(i => i.tipo_interacao === 'avaliacao')?.valor || null
              });
            }
          }
        } catch (error) {
          console.error('Erro ao carregar filme:', error);
          setFilme(null);
        }
      }
    };
    carregarFilme();
  }, [id, isAuthenticated]);

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

  const handleInteracao = async (tipoInteracao: string, valor?: number) => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: { pathname: `/filme/${filme!.GUID}` } } });
      return;
    }

    try {
      const success = await avaliacoesStorage.adicionarInteracao(filme!.GUID, tipoInteracao, valor);
      if (success) {
        // Atualizar estado local
        setInteracoesUsuario(prev => ({
          ...prev,
          [tipoInteracao]: !prev[tipoInteracao as keyof typeof prev]
        }));
        
        // Recarregar estatísticas
        const stats = await avaliacoesStorage.obterEstatisticasFilme(filme!.GUID);
        setEstatisticas(stats);
      }
    } catch (error) {
      console.error('Erro ao processar interação:', error);
    }
  };

  const handleAvaliacao = async (valor: number) => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: { pathname: `/filme/${filme!.GUID}` } } });
      return;
    }

    try {
      const success = await avaliacoesStorage.adicionarInteracao(filme!.GUID, 'avaliacao', valor);
      if (success) {
        setInteracoesUsuario(prev => ({
          ...prev,
          avaliacao: prev.avaliacao === valor ? null : valor
        }));
        
        // Recarregar estatísticas
        const stats = await avaliacoesStorage.obterEstatisticasFilme(filme!.GUID);
        setEstatisticas(stats);
      }
    } catch (error) {
      console.error('Erro ao processar avaliação:', error);
    }
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
                  {filme.embedLink ? (
                    <iframe
                      src={filme.embedLink.match(/src="([^"]*)"/)?.[1] || ''}
                      allowFullScreen
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  ) : (
                    <div className="w-full h-full bg-vintage-black/50 flex items-center justify-center">
                      <p className="text-vintage-cream/60 font-vintage-body">
                        Vídeo não disponível
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Informações do Filme */}
            <div className="lg:col-span-1 flex flex-col justify-between">
              {/* Título e Meta */}
              <div className="mb-6">
                <h1 className="text-3xl lg:text-4xl font-bold text-vintage-gold mb-3">
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
                                            <span className="font-vintage-body">{filme.assistencias || 0} visualizações</span>
                  </div>
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

                {isAuthenticated && (
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      onClick={() => handleInteracao('assistido')}
                      variant={interacoesUsuario.assistido ? "default" : "outline"}
                      className={interacoesUsuario.assistido
                        ? "bg-vintage-gold text-vintage-black hover:bg-vintage-gold-dark w-full"
                        : "bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold hover:text-vintage-black w-full"
                      }
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {interacoesUsuario.assistido ? 'Assistido' : 'Já Assisti'}
                    </Button>

                    <Button
                      onClick={() => handleInteracao('quero_ver')}
                      variant={interacoesUsuario.quero_ver ? "default" : "outline"}
                      className={interacoesUsuario.quero_ver
                        ? "bg-vintage-gold text-vintage-black hover:bg-vintage-gold-dark w-full"
                        : "bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold hover:text-vintage-black w-full"
                      }
                    >
                      {interacoesUsuario.quero_ver ? <Heart className="h-4 w-4 mr-2 fill-current" /> : <Plus className="h-4 w-4 mr-2" />}
                      {interacoesUsuario.quero_ver ? 'Na Lista' : 'Quero Ver'}
                    </Button>
                  </div>
                )}

                {/* Avaliações com Estrelas */}
                <div className="border-t border-vintage-gold/20 pt-4">
                  <p className="text-sm font-vintage-serif font-semibold text-vintage-gold mb-3 text-center">
                    {isAuthenticated ? 'Sua Avaliação' : 'Avalie'}
                  </p>
                  {isAuthenticated ? (
                    <div className="flex justify-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleAvaliacao(star)}
                          className={`p-1 rounded transition-all duration-300 ${
                            interacoesUsuario.avaliacao && interacoesUsuario.avaliacao >= star
                              ? 'text-vintage-gold'
                              : 'text-vintage-cream/30 hover:text-vintage-gold/50'
                          }`}
                          title={`${star} estrela${star > 1 ? 's' : ''}`}
                        >
                          <Star className="h-5 w-5" fill={interacoesUsuario.avaliacao && interacoesUsuario.avaliacao >= star ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex justify-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-5 w-5 text-vintage-cream/30" />
                      ))}
                    </div>
                  )}
                </div>

                {/* Estatísticas do Filme removidas */}
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
                        {filme.avaliacoes?.gosteiMuito || 0}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-vintage-cream/80">
                        <Heart className="h-3 w-3 text-vintage-gold" />
                        <span className="font-vintage-body text-sm">Adoraram</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-vintage-serif font-bold text-vintage-gold mb-1">
                        {filme.avaliacoes?.gostei || 0}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-vintage-cream/80">
                        <ThumbsUp className="h-3 w-3 text-vintage-gold" />
                        <span className="font-vintage-body text-sm">Gostaram</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-vintage-serif font-bold text-vintage-gold mb-1">
                        {filme.avaliacoes?.naoGostei || 0}
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
