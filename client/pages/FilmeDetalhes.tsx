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
  const [filmesRecomendados, setFilmesRecomendados] = useState<Filme[]>([]);
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
            
            // Carregar filmes recomendados da mesma categoria
            const todosFilmes = await filmeStorage.obterFilmes();
            const filmesMesmaCategoria = todosFilmes
              .filter(f => f.GUID !== filmeEncontrado.GUID) // Excluir o filme atual
              .filter(f => f.categoria.some(cat => filmeEncontrado.categoria.includes(cat))) // Mesma categoria
              .slice(0, 6); // Limitar a 6 filmes
            
            setFilmesRecomendados(filmesMesmaCategoria);
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
    <div className="min-h-screen bg-vintage-black">
      {/* Header com navegação */}
      <div className="container mx-auto px-4 pt-6">
        <Link 
          to="/filmes" 
          className="inline-flex items-center text-vintage-cream hover:text-vintage-gold transition-colors font-vintage-body mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar aos Filmes
        </Link>
      </div>

      {/* Hero Section - Player e Informações Principais */}
      <section className="bg-gradient-to-b from-vintage-black via-vintage-black/95 to-vintage-black">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Player de Vídeo - Coluna Esquerda */}
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
                      <div className="text-center">
                        <Play className="h-16 w-16 text-vintage-gold/30 mx-auto mb-4" />
                        <p className="text-vintage-cream/60 font-vintage-body text-lg">
                          Vídeo não disponível
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Informações Principais - Coluna Direita */}
            <div className="lg:col-span-1">
              {/* Título e Meta Informações */}
              <div className="mb-8">
                <h1 className="text-4xl lg:text-5xl font-bold text-vintage-gold mb-3 font-vintage-serif">
                  {filme.nomePortugues}
                </h1>
                <p className="text-xl text-vintage-cream/80 italic mb-6 font-vintage-body">
                  "{filme.nomeOriginal}"
                </p>

                {/* Meta Informações em Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-vintage-black/50 border border-vintage-gold/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-vintage-cream/80 mb-1">
                      <Calendar className="h-4 w-4 text-vintage-gold" />
                      <span className="font-vintage-body text-sm">Ano</span>
                    </div>
                    <p className="text-vintage-gold font-semibold">{filme.ano}</p>
                  </div>
                  
                  <div className="bg-vintage-black/50 border border-vintage-gold/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-vintage-cream/80 mb-1">
                      <Clock className="h-4 w-4 text-vintage-gold" />
                      <span className="font-vintage-body text-sm">Duração</span>
                    </div>
                    <p className="text-vintage-gold font-semibold">{filme.duracao}</p>
                  </div>
                  
                  <div className="bg-vintage-black/50 border border-vintage-gold/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-vintage-cream/80 mb-1">
                      <Eye className="h-4 w-4 text-vintage-gold" />
                      <span className="font-vintage-body text-sm">Views</span>
                    </div>
                    <p className="text-vintage-gold font-semibold">{filme.assistencias || 0}</p>
                  </div>
                  
                  {estatisticas && estatisticas.media_avaliacao > 0 && (
                    <div className="bg-vintage-black/50 border border-vintage-gold/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-vintage-cream/80 mb-1">
                        <Star className="h-4 w-4 text-vintage-gold fill-current" />
                        <span className="font-vintage-body text-sm">Avaliação</span>
                      </div>
                      <p className="text-vintage-gold font-semibold">{estatisticas.media_avaliacao.toFixed(1)}/5</p>
                    </div>
                  )}
                </div>

                {/* Categorias */}
                <div className="mb-8">
                  <h3 className="text-lg font-vintage-serif font-semibold text-vintage-gold mb-3">
                    Categorias
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {filme.categoria.map((cat, index) => (
                      <span
                        key={index}
                        className="bg-vintage-gold/20 text-vintage-gold px-4 py-2 rounded-lg font-vintage-body text-sm border border-vintage-gold/30"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ações do Usuário */}
              <div className="mb-8">
                {!isAuthenticated ? (
                  <div className="bg-vintage-gold/10 border border-vintage-gold/30 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-vintage-gold" />
                      <div>
                        <p className="text-vintage-gold font-vintage-serif font-semibold">Faça login para interagir</p>
                        <p className="text-vintage-cream/80 font-vintage-body text-sm">
                          Avalie, marque como assistido e muito mais
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-vintage-serif font-semibold text-vintage-gold">
                      Suas Ações
                    </h3>
                    
                    {/* Botões de Ação */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button
                        onClick={() => handleInteracao('assistido')}
                        variant={interacoesUsuario.assistido ? "default" : "outline"}
                        className={`h-12 ${
                          interacoesUsuario.assistido
                            ? "bg-vintage-gold text-vintage-black hover:bg-vintage-gold/90"
                            : "bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold hover:text-vintage-black"
                        }`}
                      >
                        <Check className="h-5 w-5 mr-2" />
                        {interacoesUsuario.assistido ? '✓ Assistido' : 'Já Assisti'}
                      </Button>

                      <Button
                        onClick={() => handleInteracao('quero_ver')}
                        variant={interacoesUsuario.quero_ver ? "default" : "outline"}
                        className={`h-12 ${
                          interacoesUsuario.quero_ver
                            ? "bg-vintage-gold text-vintage-black hover:bg-vintage-gold/90"
                            : "bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold hover:text-vintage-black"
                        }`}
                      >
                        {interacoesUsuario.quero_ver ? (
                          <Heart className="h-5 w-5 mr-2 fill-current" />
                        ) : (
                          <Plus className="h-5 w-5 mr-2" />
                        )}
                        {interacoesUsuario.quero_ver ? '♥ Na Lista' : 'Quero Ver'}
                      </Button>
                    </div>

                    {/* Avaliação com Estrelas */}
                    <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-4">
                      <p className="text-sm font-vintage-serif font-semibold text-vintage-gold mb-3 text-center">
                        Sua Avaliação
                      </p>
                      <div className="flex justify-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleAvaliacao(star)}
                            className={`p-2 rounded-lg transition-all duration-300 hover:bg-vintage-gold/10 ${
                              interacoesUsuario.avaliacao && interacoesUsuario.avaliacao >= star
                                ? 'text-vintage-gold bg-vintage-gold/10'
                                : 'text-vintage-cream/30 hover:text-vintage-gold/50'
                            }`}
                            title={`${star} estrela${star > 1 ? 's' : ''}`}
                          >
                            <Star className="h-6 w-6" fill={interacoesUsuario.avaliacao && interacoesUsuario.avaliacao >= star ? 'currentColor' : 'none'} />
                          </button>
                        ))}
                      </div>
                      {interacoesUsuario.avaliacao && (
                        <p className="text-center text-vintage-cream/60 text-sm mt-2">
                          Você avaliou com {interacoesUsuario.avaliacao} estrela{interacoesUsuario.avaliacao > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      

             {/* Seção de Sinopse e Poster */}
       <section className="bg-vintage-black">
         <div className="container mx-auto px-4 py-8">
           <div className="max-w-6xl mx-auto">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Poster do Filme */}
               <div className="lg:col-span-1">
                 <img
                   src={filme.imagemUrl}
                   alt={filme.nomePortugues}
                   className="w-full rounded-lg shadow-2xl border border-vintage-gold/20"
                 />
               </div>
               
               {/* Sinopse */}
               <div className="lg:col-span-2">
                 <h2 className="text-2xl font-vintage-serif font-semibold text-vintage-gold mb-6">
                   Sinopse
                 </h2>
                 <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6">
                   <p className="text-lg text-vintage-cream/90 font-vintage-body leading-relaxed">
                     {filme.sinopse}
                   </p>
                 </div>
               </div>
             </div>
           </div>
         </div>
       </section>



       {/* Seção de Recomendações */}
       {filmesRecomendados.length > 0 && (
         <section className="bg-vintage-black border-t border-vintage-gold/10">
           <div className="container mx-auto px-4 py-8">
             <div className="max-w-6xl mx-auto">
               <h2 className="text-2xl font-vintage-serif font-semibold text-vintage-gold mb-6">
                 Recomendações da Mesma Categoria
               </h2>
               
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                 {filmesRecomendados.map((filmeRec) => (
                   <Link
                     key={filmeRec.GUID}
                     to={`/filme/${filmeRec.GUID}`}
                     className="group block"
                   >
                     <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg overflow-hidden hover:border-vintage-gold/40 transition-all duration-300 hover:scale-105">
                       <div className="aspect-[2/3] relative overflow-hidden">
                         <img
                           src={filmeRec.imagemUrl}
                           alt={filmeRec.nomePortugues}
                           className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-vintage-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                         
                         {/* Overlay com informações */}
                         <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                           <h3 className="text-sm font-vintage-serif font-semibold text-vintage-gold mb-1 line-clamp-2">
                             {filmeRec.nomePortugues}
                           </h3>
                           <p className="text-xs text-vintage-cream/80 font-vintage-body">
                             {filmeRec.ano}
                           </p>
                         </div>
                       </div>
                     </div>
                   </Link>
                 ))}
               </div>
             </div>
           </div>
         </section>
       )}
     </div>
   );
}
