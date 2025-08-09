import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { 
  User, 
  Heart, 
  Eye, 
  Star, 
  LogOut, 
  Film,
  Calendar,
  Clock,
  ArrowLeft,
  Home,
  List,
  BookOpen,
  UserCheck
} from 'lucide-react';
import { Filme } from '@shared/types';
import { filmeStorage } from '../utils/filmeStorage';
import { avaliacoesStorage } from '../utils/avaliacoesStorage';

type TabType = 'painel' | 'favoritos' | 'quero-assistir' | 'notas' | 'ja-assisti' | 'minha-conta';

export default function Perfil() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('painel');
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [loading, setLoading] = useState(true);


  // Carregar dados reais do usuário
  const [interacoesUsuario, setInteracoesUsuario] = useState<any[]>([]);
  const [filmesAssistidos, setFilmesAssistidos] = useState<Filme[]>([]);
  const [filmesFavoritos, setFilmesFavoritos] = useState<Filme[]>([]);
  const [filmesAvaliados, setFilmesAvaliados] = useState<Filme[]>([]);
  const [filmesQueroAssistir, setFilmesQueroAssistir] = useState<Filme[]>([]);

  useEffect(() => {
    const carregarFilmes = async () => {
      try {
        const todosFilmes = await filmeStorage.obterFilmes();
        setFilmes(todosFilmes);
      } catch (error) {
        console.error('Erro ao carregar filmes:', error);
        setFilmes([]);
      } finally {
        setLoading(false);
      }
    };
    carregarFilmes();
  }, []);

  useEffect(() => {
    const carregarInteracoes = async () => {
      if (user) {
        try {
          const interacoes = await avaliacoesStorage.obterInteracoesUsuario();
          
          // Garantir que interacoes é sempre um array
          const interacoesArray = Array.isArray(interacoes) ? interacoes : [];
          setInteracoesUsuario(interacoesArray);
          
          // Filtrar filmes baseado nas interações
          const assistidos = interacoesArray.filter(i => i.tipo_interacao === 'assistido');
          const favoritos = interacoesArray.filter(i => i.tipo_interacao === 'favorito');
          const avaliados = interacoesArray.filter(i => i.tipo_interacao === 'avaliacao');
          const queroAssistir = interacoesArray.filter(i => i.tipo_interacao === 'quero_ver');
          
          // Buscar dados dos filmes
          const filmesAssistidosData = await Promise.all(
            assistidos.map(async (interacao) => {
              const filme = await filmeStorage.obterFilmePorGUID(interacao.filme_guid);
              return filme;
            })
          );
          
          const filmesFavoritosData = await Promise.all(
            favoritos.map(async (interacao) => {
              const filme = await filmeStorage.obterFilmePorGUID(interacao.filme_guid);
              return filme;
            })
          );
          
          const filmesAvaliadosData = await Promise.all(
            avaliados.map(async (interacao) => {
              const filme = await filmeStorage.obterFilmePorGUID(interacao.filme_guid);
              return { ...filme, avaliacao: interacao.valor };
            })
          );

          const filmesQueroAssistirData = await Promise.all(
            queroAssistir.map(async (interacao) => {
              const filme = await filmeStorage.obterFilmePorGUID(interacao.filme_guid);
              return filme;
            })
          );
          
          setFilmesAssistidos(filmesAssistidosData.filter(Boolean));
          setFilmesFavoritos(filmesFavoritosData.filter(Boolean));
          setFilmesAvaliados(filmesAvaliadosData.filter(Boolean));
          setFilmesQueroAssistir(filmesQueroAssistirData.filter(Boolean));
        } catch (error) {
          console.error('Erro ao carregar interações:', error);
        }
      }
    };
    
    carregarInteracoes();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'painel':
        return (
          <div className="space-y-8">
            {/* Informações do Usuário */}
            <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-vintage-gold/20 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-vintage-gold" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-vintage-cream">
                    {user.nome}
                  </h2>
                  <p className="text-vintage-cream/70">
                    {user.email}
                  </p>
                  <p className="text-sm text-vintage-gold">
                    {user.tipo === 'admin' ? 'Administrador' : 'Usuário'}
                  </p>
                </div>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6 text-center">
                <Eye className="h-8 w-8 text-vintage-gold mx-auto mb-2" />
                <p className="text-2xl font-bold text-vintage-cream">{filmesAssistidos.length}</p>
                <p className="text-vintage-cream/70 text-sm">Filmes Assistidos</p>
              </div>
              <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6 text-center">
                <Heart className="h-8 w-8 text-vintage-gold mx-auto mb-2" />
                <p className="text-2xl font-bold text-vintage-cream">{filmesFavoritos.length}</p>
                <p className="text-vintage-cream/70 text-sm">Favoritos</p>
              </div>
              <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6 text-center">
                <Star className="h-8 w-8 text-vintage-gold mx-auto mb-2" />
                <p className="text-2xl font-bold text-vintage-cream">{filmesAvaliados.length}</p>
                <p className="text-vintage-cream/70 text-sm">Avaliações</p>
              </div>
              <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6 text-center">
                <Calendar className="h-8 w-8 text-vintage-gold mx-auto mb-2" />
                <p className="text-2xl font-bold text-vintage-cream">2024</p>
                <p className="text-vintage-cream/70 text-sm">Membro Desde</p>
              </div>
            </div>

            {/* Recomendações */}
            <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6">
              <h3 className="text-xl font-bold text-vintage-gold mb-4 flex items-center">
                <Film className="h-5 w-5 mr-2" />
                Recomendações para Você
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filmes.slice(0, 4).map((filme) => (
                  <div key={filme.GUID} className="bg-vintage-black/20 rounded-lg overflow-hidden">
                    <div className="relative">
                      <img
                        src={filme.imagemUrl}
                        alt={filme.nomePortugues}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-vintage-black/80 to-transparent"></div>
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-vintage-cream text-sm line-clamp-2">{filme.nomePortugues}</p>
                      <p className="text-xs text-vintage-cream/60">{filme.ano}</p>
                      <Button
                        size="sm"
                        className="w-full mt-2 btn-vintage"
                      >
                        Assistir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'quero-assistir':
        return (
          <div>
            <h2 className="text-2xl font-bold text-vintage-gold mb-6">Quero Assistir:</h2>
            {filmesQueroAssistir.length === 0 ? (
              <div className="text-center py-12">
                <Film className="h-16 w-16 text-vintage-gold/50 mx-auto mb-4" />
                <p className="text-vintage-cream/70 mb-2">Nenhum filme na lista</p>
                <p className="text-vintage-cream/50 text-sm">
                  Clique no botão "Quero Ver" na página de um filme para adicioná-lo a esta lista.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {filmesQueroAssistir.map((filme) => (
                  <div key={filme.GUID} className="bg-vintage-black/20 rounded-lg overflow-hidden border border-vintage-gold/10">
                    <img
                      src={filme.imagemUrl}
                      alt={filme.nomePortugues}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3">
                      <p className="font-semibold text-vintage-cream text-sm line-clamp-2">{filme.nomePortugues}</p>
                      <p className="text-xs text-vintage-cream/60">{filme.ano}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'favoritos':
        return (
          <div>
            <h2 className="text-2xl font-bold text-vintage-gold mb-6">Meus Favoritos:</h2>
            {filmesFavoritos.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-16 w-16 text-vintage-gold/50 mx-auto mb-4" />
                <p className="text-vintage-cream/70 mb-2">Nenhum favorito ainda</p>
                <p className="text-vintage-cream/50 text-sm">
                  Marque filmes como favorito na página de detalhes do filme.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {filmesFavoritos.map((filme) => (
                  <div key={filme.GUID} className="bg-vintage-black/20 rounded-lg overflow-hidden border border-vintage-gold/10">
                    <img
                      src={filme.imagemUrl}
                      alt={filme.nomePortugues}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3">
                      <p className="font-semibold text-vintage-cream text-sm line-clamp-2">{filme.nomePortugues}</p>
                      <p className="text-xs text-vintage-cream/60">{filme.ano}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'notas':
        return (
          <div>
            <h2 className="text-2xl font-bold text-vintage-gold mb-6">Minhas Avaliações:</h2>
            {filmesAvaliados.length === 0 ? (
              <div className="text-center py-12">
                <Star className="h-16 w-16 text-vintage-gold/50 mx-auto mb-4" />
                <p className="text-vintage-cream/70 mb-2">Nenhuma avaliação</p>
                <p className="text-vintage-cream/50 text-sm">
                  Avalie os filmes que você assistiu para ajudar outros usuários.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filmesAvaliados.map((filme) => (
                  <div key={filme.GUID} className="flex items-center space-x-4 p-4 bg-vintage-black/20 rounded-lg">
                    <img
                      src={filme.imagemUrl}
                      alt={filme.nomePortugues}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-vintage-cream">{filme.nomePortugues}</p>
                      <p className="text-sm text-vintage-cream/60">{filme.ano}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= (filme as any).avaliacao ? 'text-vintage-gold fill-current' : 'text-vintage-cream/30'}`}
                        />
                      ))}
                    </div>
                    <div className="text-vintage-gold font-bold">
                      {(filme as any).avaliacao}/5
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'ja-assisti':
        return (
          <div>
            <h2 className="text-2xl font-bold text-vintage-gold mb-6">Já Assisti:</h2>
            {filmesAssistidos.length === 0 ? (
              <div className="text-center py-12">
                <Eye className="h-16 w-16 text-vintage-gold/50 mx-auto mb-4" />
                <p className="text-vintage-cream/70 mb-2">Nenhum filme assistido</p>
                <p className="text-vintage-cream/50 text-sm">
                  Comece explorando nosso catálogo e marque os filmes que você já assistiu.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {filmesAssistidos.map((filme) => (
                  <div key={filme.GUID} className="bg-vintage-black/20 rounded-lg overflow-hidden border border-vintage-gold/10">
                    <img
                      src={filme.imagemUrl}
                      alt={filme.nomePortugues}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3">
                      <p className="font-semibold text-vintage-cream text-sm line-clamp-2">{filme.nomePortugues}</p>
                      <p className="text-xs text-vintage-cream/60">{filme.ano}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'minha-conta':
        return (
          <div className="space-y-8">
            {/* Dados Pessoais */}
            <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6">
              <h3 className="text-xl font-bold text-vintage-gold mb-4">Dados Pessoais:</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 px-3 bg-vintage-black/20 rounded">
                  <span className="text-vintage-cream/70">Nome:</span>
                  <span className="text-vintage-cream font-semibold">{user.nome}</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-vintage-black/20 rounded">
                  <span className="text-vintage-cream/70">Email:</span>
                  <span className="text-vintage-cream font-semibold">{user.email}</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-vintage-black/20 rounded">
                  <span className="text-vintage-cream/70">Tipo:</span>
                  <span className="text-vintage-cream font-semibold">{user.tipo === 'admin' ? 'Administrador' : 'Usuário'}</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="mt-4 bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold hover:text-vintage-black"
              >
                Editar Dados
              </Button>
            </div>

            {/* Alterar Senha */}
            <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6">
              <h3 className="text-xl font-bold text-vintage-gold mb-4">Alterar Senha:</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-vintage-cream/70 text-sm mb-2">Senha Atual:</label>
                  <input
                    type="password"
                    className="w-full p-3 bg-vintage-black/20 border border-vintage-gold/30 rounded text-vintage-cream"
                    placeholder="Digite sua senha atual"
                  />
                </div>
                <div>
                  <label className="block text-vintage-cream/70 text-sm mb-2">Nova Senha:</label>
                  <input
                    type="password"
                    className="w-full p-3 bg-vintage-black/20 border border-vintage-gold/30 rounded text-vintage-cream"
                    placeholder="Digite a nova senha"
                  />
                </div>
                <div>
                  <label className="block text-vintage-cream/70 text-sm mb-2">Confirmar Nova Senha:</label>
                  <input
                    type="password"
                    className="w-full p-3 bg-vintage-black/20 border border-vintage-gold/30 rounded text-vintage-cream"
                    placeholder="Confirme a nova senha"
                  />
                </div>
                <Button className="w-full btn-vintage">
                  Enviar
                </Button>
              </div>
            </div>


          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-vintage-black">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-vintage-black border-r border-vintage-gold/20 min-h-screen">
          <div className="p-6">
            <h1 className="text-xl font-bold text-vintage-gold mb-6">Painel</h1>
            
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('painel')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'painel'
                    ? 'bg-vintage-gold text-vintage-black'
                    : 'text-vintage-cream hover:bg-vintage-gold/10'
                }`}
              >
                <Home className="h-5 w-5" />
                <span>Painel</span>
              </button>

              <button
                onClick={() => setActiveTab('favoritos')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'favoritos'
                    ? 'bg-vintage-gold text-vintage-black'
                    : 'text-vintage-cream hover:bg-vintage-gold/10'
                }`}
              >
                <Heart className="h-5 w-5" />
                <span>Favoritos</span>
              </button>

              <button
                onClick={() => setActiveTab('quero-assistir')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'quero-assistir'
                    ? 'bg-vintage-gold text-vintage-black'
                    : 'text-vintage-cream hover:bg-vintage-gold/10'
                }`}
              >
                <List className="h-5 w-5" />
                <span>Quero Assistir</span>
              </button>

              <button
                onClick={() => setActiveTab('notas')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'notas'
                    ? 'bg-vintage-gold text-vintage-black'
                    : 'text-vintage-cream hover:bg-vintage-gold/10'
                }`}
              >
                <Star className="h-5 w-5" />
                <span>Notas</span>
              </button>

              <button
                onClick={() => setActiveTab('ja-assisti')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'ja-assisti'
                    ? 'bg-vintage-gold text-vintage-black'
                    : 'text-vintage-cream hover:bg-vintage-gold/10'
                }`}
              >
                <Eye className="h-5 w-5" />
                <span>Já Assisti</span>
              </button>

              <button
                onClick={() => setActiveTab('minha-conta')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'minha-conta'
                    ? 'bg-vintage-gold text-vintage-black'
                    : 'text-vintage-cream hover:bg-vintage-gold/10'
                }`}
              >
                <UserCheck className="h-5 w-5" />
                <span>Minha Conta</span>
              </button>

              <div className="border-t border-vintage-gold/20 my-4"></div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-vintage-cream hover:bg-red-500/20 hover:text-red-400 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Sair</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </div>


    </div>
  );
}
