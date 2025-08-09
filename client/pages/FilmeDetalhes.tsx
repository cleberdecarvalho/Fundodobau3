import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Star, Heart, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Filme } from '@shared/types';
import { filmeStorage } from '../utils/filmeStorage';
import { avaliacoesStorage, EstatisticasFilme } from '../utils/avaliacoesStorage';
import { useAuth } from '../contexts/AuthContext';
import { FilmSlider } from '@/components/FilmSlider';

export default function FilmeDetalhes() {
  const { id } = useParams<{ id: string }>();
  const [filme, setFilme] = useState<Filme | null>(null);
  const [estatisticas, setEstatisticas] = useState<EstatisticasFilme | null>(null);
  const [recomendados, setRecomendados] = useState<Filme[]>([]);
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

  // Carregar recomendados (mesma(s) categoria(s)) quando o filme estiver disponível
  useEffect(() => {
    const carregarRecomendados = async () => {
      if (!filme) return;
      try {
        const todos = await filmeStorage.obterFilmes();
        const categorias = new Set(filme.categoria || []);
        const recs = (todos || [])
          .filter(f => f.GUID !== filme.GUID && (f.categoria || []).some(c => categorias.has(c)));
        setRecomendados(recs.slice(0, 12));
      } catch (e) {
        console.warn('Não foi possível carregar recomendados:', e);
      }
    };
    carregarRecomendados();
  }, [filme]);

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

      {/* Seção do Player */}
      <section className="relative">
        <div className="container mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 gap-8 mb-12">
            <div>
              <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-4 max-w-[928px] mx-auto">
                <div className="aspect-video rounded-lg overflow-hidden border border-vintage-gold/10">
                  {filme.embedLink ? (
                    <iframe
                      src={filme.embedLink.match(/src=\"([^\"]*)\"/)?.[1] || ''}
                      allowFullScreen
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  ) : (
                    <div className="w-full h-full bg-vintage-black/50 flex items-center justify-center">
                      <p className="text-vintage-cream/60 font-vintage-body">Vídeo não disponível</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pôster + Infos + Sinopse + Avaliação */}
          <div className="max-w-[928px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-2">
            <div className="lg:col-span-1">
              <img
                src={filme.imagemUrl}
                alt={filme.nomePortugues}
                className="w-full max-w-[169px] md:max-w-[273px] mx-auto lg:mx-0 rounded-lg shadow-2xl"
              />
            </div>

            <div className="lg:col-span-2">
              <div className="mb-6">
                <h1 className="text-3xl lg:text-4xl font-bold text-vintage-gold mb-2">{filme.nomePortugues}</h1>
                <p className="text-lg text-vintage-cream/80 italic mb-3 font-vintage-body">"{filme.nomeOriginal}"</p>
                <div className="flex flex-wrap items-center gap-3 text-vintage-cream/80 font-vintage-body">
                  <span>{filme.ano}</span>
                  <span className="opacity-50">•</span>
                  <span>{filme.duracao}</span>
                  {filme.categoria?.length ? (
                    <>
                      <span className="opacity-50">•</span>
                      <div className="flex flex-wrap items-center gap-2">
                        {filme.categoria.map((cat, index) => (
                          <span key={index} className="bg-vintage-gold/20 text-vintage-gold px-2 py-0.5 rounded-md text-xs">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-vintage-serif font-semibold text-vintage-gold mb-4">Sinopse</h3>
                <p className="text-base text-vintage-cream/90 font-vintage-body leading-relaxed break-words whitespace-pre-line max-w-3xl">
                  {filme.sinopse}
                </p>
              </div>

              {/* Avaliação oculta temporariamente. Reativar futuramente. */}
            </div>
          </div>
        </div>
      </section>

      {/* Recomendados (slider com mesma categoria) - usa largura padrão da página */}
      {recomendados.length > 0 && (
        <FilmSlider titulo="Recomendados" filmes={recomendados} />
      )}
    </div>
  );
}
