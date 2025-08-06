import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Eye, Users, Film, BarChart3, Upload, Save, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { CATEGORIAS } from '@shared/types';
import { Filme } from '@shared/types';
import { ImageUpload } from '../components/ImageUpload';
import { VideoUpload } from '../components/VideoUpload';
import { filmeStorage } from '../utils/filmeStorage';

function AdminDashboard() {
  // Bunny.net API key (runtime, session only)
  const [bunnyApiKey, setBunnyApiKey] = useState<string>(() => typeof window !== 'undefined' ? sessionStorage.getItem('bunnyApiKey') || '' : '');
  const [showApiKey, setShowApiKey] = useState(false);
  // Para preview local de imagem
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'filmes' | 'novo-filme' | 'carrossel'>('dashboard');
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filmeEditando, setFilmeEditando] = useState<Filme | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [carrossel, setCarrossel] = useState([
    { posicao: 0, filmeId: null, imagemUrl: null, ativo: false },
    { posicao: 1, filmeId: null, imagemUrl: null, ativo: false },
    { posicao: 2, filmeId: null, imagemUrl: null, ativo: false }
  ]);

  const [novoFilme, setNovoFilme] = useState({
    nomeOriginal: '',
    nomePortugues: '',
    ano: '',
    categoria: [] as string[],
    duracao: '',
    sinopse: '',
    imagemUrl: '',
    embedLink: '',
    videoGUID: '',
    videoStatus: '',
  });
  const [uploadStatus, setUploadStatus] = useState<'idle'|'uploading'|'processing'|'done'|'error'>('idle');
  const [uploadMsg, setUploadMsg] = useState<string>('');
  const pollingRef = useRef<NodeJS.Timeout|null>(null);
  


  // Função para limpar formulário
  const limparFormulario = () => {
    setNovoFilme({
      nomeOriginal: '',
      nomePortugues: '',
      ano: '',
      categoria: [],
      duracao: '',
      sinopse: '',
      imagemUrl: '',
      embedLink: '',
      videoGUID: '',
      videoStatus: '',
    });
    setPosterPreview(null);
    setUploadStatus('idle');
    setUploadMsg('');
  };

  useEffect(() => {
    // Busca filmes da API
    async function fetchFilmes() {
      setIsLoading(true);
      try {
        const filmesApi = await filmeStorage.obterFilmes();
        console.log('Filmes carregados:', filmesApi);
        setFilmes(filmesApi);
      } catch (error) {
        console.error('Erro ao buscar filmes:', error);
        setFilmes([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFilmes();
  }, []);

  // Carregar configuração do carrossel
  useEffect(() => {
    async function fetchCarrossel() {
      try {
        const response = await fetch('/api/carrossel');
        if (response.ok) {
          const data = await response.json();
          setCarrossel(data.carrossel);
        }
      } catch (error) {
        console.error('Erro ao carregar carrossel:', error);
      }
    }
    fetchCarrossel();
  }, []);

  // Salva a key na sessionStorage sempre que mudar
  useEffect(() => {
    if (bunnyApiKey) {
      sessionStorage.setItem('bunnyApiKey', bunnyApiKey);
      console.log('API Key salva:', bunnyApiKey.substring(0, 10) + '...');
    } else {
      sessionStorage.removeItem('bunnyApiKey');
      console.log('API Key removida');
    }
  }, [bunnyApiKey]);

  // Resetar status de upload ao trocar de tab ou editar
  useEffect(() => {
    setUploadStatus('idle');
    setUploadMsg('');
    setPosterPreview(null);
    if (!filmeEditando) {
      setNovoFilme(f => ({ ...f, videoGUID: '', embedLink: '', videoStatus: '' }));
    }
  }, [activeTab, filmeEditando]);

  // Limpar formulário quando entrar na aba "Novo Filme"
  useEffect(() => {
    if (activeTab === 'novo-filme' && !filmeEditando) {
      limparFormulario();
    }
  }, [activeTab]);

  // Funções utilitárias
  const toggleCategoria = (categoria: string, isEditando: boolean) => {
    if (isEditando && filmeEditando) {
      setFilmeEditando({
        ...filmeEditando,
        categoria: filmeEditando.categoria.includes(categoria)
          ? filmeEditando.categoria.filter((c) => c !== categoria)
          : [...filmeEditando.categoria, categoria],
      });
    } else {
      setNovoFilme({
        ...novoFilme,
        categoria: novoFilme.categoria.includes(categoria)
          ? novoFilme.categoria.filter((c) => c !== categoria)
          : [...novoFilme.categoria, categoria],
      });
    }
  };

  const handleImageUploadPreview = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPosterPreview(reader.result as string);
      if (filmeEditando) {
        setFilmeEditando(f => ({ ...f!, imagemUrl: reader.result as string }));
      } else {
        setNovoFilme(f => ({ ...f, imagemUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSalvarFilme = async () => {
    setIsLoading(true);
    try {
      // Garante embedLink se houver videoGUID
      let embedLink = novoFilme.embedLink;
      if (novoFilme.videoGUID && !embedLink) {
        embedLink = `<iframe src=\"https://iframe.mediadelivery.net/embed/256964/${novoFilme.videoGUID}?autoplay=false&loop=false&muted=false&preload=true&responsive=true\" allowfullscreen=\"true\"></iframe>`;
      }
      // O GUID deve vir do Bunny.net (videoGUID), se não existir, gerar um local
      const guidFinal = novoFilme.videoGUID || novoFilme.GUID || `filme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('GUID final:', guidFinal, 'VideoGUID do Bunny.net:', novoFilme.videoGUID);
      
      const novo = {
        ...novoFilme,
        GUID: guidFinal,
        videoGUID: novoFilme.videoGUID || guidFinal, // Manter videoGUID se existir
        embedLink: embedLink || novoFilme.embedLink,
        videoStatus: 'Enviando', // Sempre começa como "Enviando" para novos vídeos
        assistencias: 0,
      };
      const guidSalvo = await filmeStorage.addFilme(novo);
      console.log('Filme salvo com GUID:', guidSalvo);
      console.log('Dados completos do filme salvo:', novo);
      limparFormulario();
      
      // Atualiza lista
      const filmesAtualizados = await filmeStorage.obterFilmes();
      setFilmes(filmesAtualizados);
    } catch (error) {
      console.error('Erro ao salvar filme:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao salvar filme: ${errorMessage}. Tente novamente.`);
    }
    setIsLoading(false);
    setActiveTab('filmes');
  };

  const handleDeletarFilme = async (id: string|number) => {
    try {
      // Primeiro, buscar o filme para obter o videoGUID
      const filmesAtuais = await filmeStorage.obterFilmes();
      const filmeParaDeletar = filmesAtuais.find(f => f.GUID === id || f.id === id);
      
      if (!filmeParaDeletar) {
        throw new Error('Filme não encontrado');
      }

      // Se tem videoGUID, deletar do Bunny.net primeiro
      if (filmeParaDeletar.videoGUID && bunnyApiKey) {
        try {
          console.log('Deletando vídeo do Bunny.net:', filmeParaDeletar.videoGUID);
          console.log('API Key:', bunnyApiKey.substring(0, 10) + '...');
          
          const deleteResponse = await fetch(`https://video.bunnycdn.com/library/256964/videos/${filmeParaDeletar.videoGUID}`, {
            method: 'DELETE',
            headers: {
              'AccessKey': bunnyApiKey,
              'Content-Type': 'application/json',
            },
          });

          console.log('Status da resposta:', deleteResponse.status);
          console.log('Headers da resposta:', Object.fromEntries(deleteResponse.headers.entries()));

          if (deleteResponse.ok) {
            console.log('✅ Vídeo deletado do Bunny.net com sucesso');
          } else {
            const errorText = await deleteResponse.text();
            console.error('❌ Erro ao deletar vídeo do Bunny.net:', deleteResponse.status, deleteResponse.statusText);
            console.error('Resposta do erro:', errorText);
          }
        } catch (bunnyError) {
          console.error('❌ Erro ao deletar do Bunny.net:', bunnyError);
          // Continua mesmo se falhar no Bunny.net
        }
      } else {
        console.log('⚠️ Não foi possível deletar do Bunny.net:', {
          temVideoGUID: !!filmeParaDeletar.videoGUID,
          temApiKey: !!bunnyApiKey,
          videoGUID: filmeParaDeletar.videoGUID
        });
      }

      // Deletar da base local
      await filmeStorage.deleteFilme(id);
      
      // Atualizar lista
      const filmesAtualizados = await filmeStorage.obterFilmes();
      setFilmes(filmesAtualizados);
      setShowDeleteModal(null);
      
      console.log('Filme deletado com sucesso da base local');
    } catch (error) {
      console.error('Erro ao deletar filme:', error);
      alert(`Erro ao deletar filme: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Tente novamente.`);
    }
  };

  // Simulação de estatísticas
  const stats = {
    totalFilmes: filmes.length,
    totalVisualizacoes: filmes.reduce((acc, f) => acc + (f.assistencias || 0), 0),
    totalUsuarios: 1234,
    novasAvaliacoes: 12,
  };

  // Funções para gerenciar o carrossel
  const handleCarrosselImageUpload = async (file: File, posicao: number, nomeFilme: string) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        const response = await fetch('/api/salvar-imagem-carrossel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imagemBase64: base64,
            nomeFilme: nomeFilme,
            posicao: posicao
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          const novoCarrossel = [...carrossel];
          novoCarrossel[posicao].imagemUrl = result.caminho;
          setCarrossel(novoCarrossel);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao fazer upload da imagem do carrossel:', error);
    }
  };

  const handleSalvarCarrossel = async () => {
    try {
      const response = await fetch('/api/carrossel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ carrossel }),
      });
      
      if (response.ok) {
        alert('Carrossel salvo com sucesso!');
      } else {
        alert('Erro ao salvar carrossel');
      }
    } catch (error) {
      console.error('Erro ao salvar carrossel:', error);
      alert('Erro ao salvar carrossel');
    }
  };



  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          {/* Campo de API key Bunny.net */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-2">
            <div className="flex items-center gap-2">
              <label className="text-vintage-gold font-semibold text-sm">Bunny.net API Key:</label>
              <input
                type={showApiKey ? 'text' : 'password'}
                value={bunnyApiKey}
                onChange={e => setBunnyApiKey(e.target.value)}
                placeholder="Cole sua Bunny.net API Key aqui"
                className="bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-3 py-2 text-vintage-cream placeholder-vintage-cream/50 focus:border-vintage-gold focus:outline-none font-vintage-body w-64"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(v => !v)}
                className="text-xs text-vintage-gold underline ml-1"
              >
                {showApiKey ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>

          </div>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-vintage-gold mb-4">
              Painel Administrativo
            </h1>
            <p className="text-lg text-vintage-cream/80 font-vintage-body">
              Gerencie filmes, visualize estatísticas e administre o conteúdo da plataforma.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-4 mb-8">
            <button
              className={`px-4 py-2 rounded font-vintage-body font-semibold ${activeTab === 'dashboard' ? 'bg-vintage-gold text-vintage-black' : 'bg-vintage-black/40 text-vintage-gold border border-vintage-gold/30'}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`px-4 py-2 rounded font-vintage-body font-semibold ${activeTab === 'filmes' ? 'bg-vintage-gold text-vintage-black' : 'bg-vintage-black/40 text-vintage-gold border border-vintage-gold/30'}`}
              onClick={() => setActiveTab('filmes')}
            >
              Gerenciar Filmes
            </button>
            <button
              className={`px-4 py-2 rounded font-vintage-body font-semibold ${activeTab === 'novo-filme' ? 'bg-vintage-gold text-vintage-black' : 'bg-vintage-black/40 text-vintage-gold border border-vintage-gold/30'}`}
              onClick={() => { setFilmeEditando(null); setActiveTab('novo-filme'); }}
            >
              Novo Filme
            </button>
            <button
              className={`px-4 py-2 rounded font-vintage-body font-semibold ${activeTab === 'carrossel' ? 'bg-vintage-gold text-vintage-black' : 'bg-vintage-black/40 text-vintage-gold border border-vintage-gold/30'}`}
              onClick={() => setActiveTab('carrossel')}
            >
              Carrossel Superior
            </button>
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-vintage-cream/70 font-vintage-body text-sm">Filmes</p>
                    <p className="text-3xl font-bold text-vintage-gold">{stats.totalFilmes}</p>
                  </div>
                  <Film className="h-8 w-8 text-vintage-gold/70" />
                </div>
              </div>
              <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-vintage-cream/70 font-vintage-body text-sm">Visualizações</p>
                    <p className="text-3xl font-bold text-vintage-gold">{stats.totalVisualizacoes}</p>
                  </div>
                  <Eye className="h-8 w-8 text-vintage-gold/70" />
                </div>
              </div>
              <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-vintage-cream/70 font-vintage-body text-sm">Usuários</p>
                    <p className="text-3xl font-bold text-vintage-gold">{stats.totalUsuarios}</p>
                  </div>
                  <Users className="h-8 w-8 text-vintage-gold/70" />
                </div>
              </div>
              <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-vintage-cream/70 font-vintage-body text-sm">Novas Avaliações</p>
                    <p className="text-3xl font-bold text-vintage-gold">{stats.novasAvaliacoes}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-vintage-gold/70" />
                </div>
              </div>
            </div>
          )}

          {/* Gerenciar Filmes Tab */}
          {activeTab === 'filmes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-vintage-gold">
                  Lista de Filmes ({filmes.length})
                </h3>
                                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        const dataStr = JSON.stringify(filmes, null, 2);
                        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                        const exportFileDefaultName = 'filmes.json';
                        const linkElement = document.createElement('a');
                        linkElement.setAttribute('href', dataUri);
                        linkElement.setAttribute('download', exportFileDefaultName);
                        linkElement.click();
                      }}
                      variant="outline"
                      className="bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold/20"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Dados
                    </Button>
                    <Button
                      onClick={() => setActiveTab('novo-filme')}
                      className="btn-vintage"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Filme
                    </Button>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filmes.map((filme) => (
                  <div key={filme.GUID || filme.id || Math.random()} className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg overflow-hidden">
                    <img 
                      src={filme.imagemUrl || 'https://images.pexels.com/photos/22483588/pexels-photo-22483588.jpeg'} 
                      alt={filme.nomePortugues || filme.nomeOriginal || 'Filme'} 
                      className="w-full h-48 object-cover" 
                    />
                    <div className="p-4">
                      <h4 className="font-vintage-serif font-semibold text-vintage-cream mb-2 line-clamp-1">
                        {filme.nomePortugues || filme.nomeOriginal || 'Sem título'}
                      </h4>
                      <p className="text-vintage-cream/70 font-vintage-body text-sm mb-2 italic">
                        "{filme.nomeOriginal || filme.nomePortugues || 'Sem título original'}"
                      </p>
                      <p className="text-vintage-cream/60 font-vintage-body text-sm mb-1">
                        {filme.ano || 'N/A'} • {filme.duracao || 'N/A'} • {filme.assistencias || 0} views
                      </p>
                      <div className="flex space-x-2 mt-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            console.log('🔄 Carregando filme para edição:', filme);
                            setFilmeEditando(filme);
                            setShowEditModal(true);
                          }}
                          className="flex-1 bg-vintage-gold/20 text-vintage-gold hover:bg-vintage-gold hover:text-vintage-black border-vintage-gold/30"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setShowDeleteModal(filme.GUID || filme.id)}
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
            </div>
          )}

          {/* Novo Filme Tab */}
          {activeTab === 'novo-filme' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-vintage-gold">
                  Adicionar Novo Filme
                </h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Formulário */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                      Nome em Português
                    </label>
                    <input
                      type="text"
                      value={novoFilme.nomePortugues}
                      onChange={(e) => setNovoFilme({ ...novoFilme, nomePortugues: e.target.value })}
                      className="w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-4 py-3 text-vintage-cream placeholder-vintage-cream/50 focus:border-vintage-gold focus:outline-none font-vintage-body"
                      placeholder="Digite o nome em português"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                      Nome Original
                    </label>
                    <input
                      type="text"
                      value={novoFilme.nomeOriginal}
                      onChange={(e) => setNovoFilme({ ...novoFilme, nomeOriginal: e.target.value })}
                      className="w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-4 py-3 text-vintage-cream placeholder-vintage-cream/50 focus:border-vintage-gold focus:outline-none font-vintage-body"
                      placeholder="Digite o nome original do filme"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                        Ano
                      </label>
                      <input
                        type="text"
                        value={novoFilme.ano}
                        onChange={(e) => setNovoFilme({ ...novoFilme, ano: e.target.value })}
                        className="w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-4 py-3 text-vintage-cream placeholder-vintage-cream/50 focus:border-vintage-gold focus:outline-none font-vintage-body"
                        placeholder="1925"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                        Duração
                      </label>
                      <input
                        type="text"
                        value={novoFilme.duracao}
                        onChange={(e) => setNovoFilme({ ...novoFilme, duracao: e.target.value })}
                        className="w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-4 py-3 text-vintage-cream placeholder-vintage-cream/50 focus:border-vintage-gold focus:outline-none font-vintage-body"
                        placeholder="1h30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                      Categorias
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto vintage-scrollbar">
                      {CATEGORIAS.map((categoria) => (
                        <label key={categoria.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={novoFilme.categoria.includes(categoria.nome)}
                            onChange={() => toggleCategoria(categoria.nome, false)}
                            className="rounded border-vintage-gold/30 text-vintage-gold focus:ring-vintage-gold focus:ring-offset-0"
                          />
                          <span className="text-sm text-vintage-cream font-vintage-body">{categoria.nome}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                      Imagem do Filme (Poster)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUploadPreview(file);
                      }}
                      className="block w-full text-sm text-vintage-cream bg-vintage-black/50 border border-vintage-gold/30 rounded-lg cursor-pointer focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                      Vídeo do Filme
                    </label>
                    <VideoUpload
                      onVideoUploaded={(embedLink, guid) => {
                        console.log('VideoUpload callback - GUID:', guid, 'EmbedLink:', embedLink);
                        if (filmeEditando) {
                          setFilmeEditando(f => f ? { ...f, GUID: guid, videoGUID: guid, embedLink, videoStatus: 'Enviando' } : null);
                        } else {
                          setNovoFilme(f => ({ ...f, GUID: guid, videoGUID: guid, embedLink, videoStatus: 'Enviando' }));
                        }
                        setUploadStatus('done');
                        setUploadMsg('Vídeo enviado! Monitorando processamento...');
                      }}
                      onVideoUploading={(guid) => {
                        console.log('VideoUpload iniciado - GUID:', guid);
                        if (filmeEditando) {
                          setFilmeEditando(f => f ? { ...f, GUID: guid, videoGUID: guid, videoStatus: 'Enviando' } : null);
                        } else {
                          setNovoFilme(f => ({ ...f, GUID: guid, videoGUID: guid, videoStatus: 'Enviando' }));
                        }
                      }}
                      currentEmbedLink={filmeEditando?.embedLink || novoFilme.embedLink}
                      filmeName={filmeEditando?.nomeOriginal || novoFilme.nomeOriginal}
                      bunnyApiKey={bunnyApiKey}
                    />
                    {!bunnyApiKey && (
                      <div className="text-xs text-yellow-300 bg-yellow-900/60 rounded px-2 py-1 mt-1">
                        Cole a Bunny.net API Key acima para habilitar o upload de vídeo.
                      </div>
                    )}
                    {uploadStatus !== 'idle' && (
                      <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-4 mt-2">
                        <span className="text-vintage-gold font-vintage-body">{uploadMsg}</span>
                        {novoFilme.videoGUID && (
                          <div className="mt-2 text-xs text-vintage-cream">
                            GUID: {novoFilme.videoGUID}<br />
                            <span className="break-all">Iframe: {novoFilme.embedLink}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                      Sinopse
                    </label>
                    <textarea
                      value={novoFilme.sinopse}
                      onChange={(e) => setNovoFilme({ ...novoFilme, sinopse: e.target.value })}
                      rows={4}
                      className="w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-4 py-3 text-vintage-cream placeholder-vintage-cream/50 focus:border-vintage-gold focus:outline-none font-vintage-body resize-none"
                      placeholder="Digite a sinopse do filme..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSalvarFilme}
                      disabled={isLoading}
                      className="btn-vintage flex-1"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-vintage-black mr-2"></div>
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {isLoading ? 'Salvando...' : 'Adicionar Filme'}
                    </Button>
                    <Button
                      onClick={limparFormulario}
                      variant="outline"
                      className="bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold/20"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar
                    </Button>
                  </div>
                </div>
                {/* Preview */}
                <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6">
                  <h4 className="text-lg font-vintage-serif font-semibold text-vintage-gold mb-4">Preview</h4>
                  <div className="film-card">
                    <div className="flex justify-center items-center w-full" style={{ height: '220px' }}>
                      <img
                        src={filmeEditando?.imagemUrl || posterPreview || 'https://images.pexels.com/photos/22483588/pexels-photo-22483588.jpeg'}
                        alt="Preview"
                        style={{
                          maxWidth: '180px',
                          maxHeight: '200px',
                          objectFit: 'contain',
                          display: 'block',
                          margin: '0 auto',
                          borderRadius: '12px',
                          background: '#222',
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h5 className="font-vintage-serif font-semibold text-vintage-cream mb-2">
                        {novoFilme.nomePortugues || 'Nome do filme'}
                      </h5>
                      <p className="text-vintage-cream/70 font-vintage-body text-sm italic mb-2">
                        "{novoFilme.nomeOriginal || 'Nome original'}"
                      </p>
                      <p className="text-vintage-cream/60 font-vintage-body text-sm mb-3">
                        {novoFilme.ano || '2024'} • {novoFilme.duracao || '0h00'}
                      </p>
                      {novoFilme.categoria.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {novoFilme.categoria.slice(0, 3).map((cat, index) => (
                            <span
                              key={index}
                              className="text-xs bg-vintage-gold/20 text-vintage-gold px-2 py-1 rounded font-vintage-body"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-sm text-vintage-cream/80 font-vintage-body line-clamp-3">
                        {novoFilme.sinopse || 'Sinopse do filme aparecerá aqui...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Edição */}
          {showEditModal && filmeEditando && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-vintage-black border border-vintage-gold/30 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-vintage-serif font-bold text-vintage-gold">
                    Editar Filme
                  </h3>
                  <Button
                    onClick={() => {
                      setShowEditModal(false);
                      setFilmeEditando(null);
                    }}
                    variant="outline"
                    className="bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Formulário */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                        Nome em Português
                      </label>
                      <input
                        type="text"
                        value={filmeEditando.nomePortugues}
                        onChange={(e) => setFilmeEditando({ ...filmeEditando, nomePortugues: e.target.value })}
                        className="w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-4 py-3 text-vintage-cream placeholder-vintage-cream/50 focus:border-vintage-gold focus:outline-none font-vintage-body"
                        placeholder="Digite o nome em português"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                        Nome Original
                      </label>
                      <input
                        type="text"
                        value={filmeEditando.nomeOriginal}
                        onChange={(e) => setFilmeEditando({ ...filmeEditando, nomeOriginal: e.target.value })}
                        className="w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-4 py-3 text-vintage-cream placeholder-vintage-cream/50 focus:border-vintage-gold focus:outline-none font-vintage-body"
                        placeholder="Digite o nome original do filme"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                          Ano
                        </label>
                        <input
                          type="text"
                          value={filmeEditando.ano}
                          onChange={(e) => setFilmeEditando({ ...filmeEditando, ano: e.target.value })}
                          className="w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-4 py-3 text-vintage-cream placeholder-vintage-cream/50 focus:border-vintage-gold focus:outline-none font-vintage-body"
                          placeholder="1925"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                          Duração
                        </label>
                        <input
                          type="text"
                          value={filmeEditando.duracao}
                          onChange={(e) => setFilmeEditando({ ...filmeEditando, duracao: e.target.value })}
                          className="w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-4 py-3 text-vintage-cream placeholder-vintage-cream/50 focus:border-vintage-gold focus:outline-none font-vintage-body"
                          placeholder="1h30"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                        Categorias
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto vintage-scrollbar">
                        {CATEGORIAS.map((categoria) => (
                          <label key={categoria.id} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filmeEditando.categoria.includes(categoria.nome)}
                              onChange={() => {
                                const novasCategorias = filmeEditando.categoria.includes(categoria.nome)
                                  ? filmeEditando.categoria.filter(c => c !== categoria.nome)
                                  : [...filmeEditando.categoria, categoria.nome];
                                setFilmeEditando({ ...filmeEditando, categoria: novasCategorias });
                              }}
                              className="rounded border-vintage-gold/30 text-vintage-gold focus:ring-vintage-gold focus:ring-offset-0"
                            />
                            <span className="text-sm text-vintage-cream font-vintage-body">{categoria.nome}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                        Sinopse
                      </label>
                      <textarea
                        value={filmeEditando.sinopse}
                        onChange={(e) => setFilmeEditando({ ...filmeEditando, sinopse: e.target.value })}
                        rows={4}
                        className="w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-4 py-3 text-vintage-cream placeholder-vintage-cream/50 focus:border-vintage-gold focus:outline-none font-vintage-body resize-none"
                        placeholder="Digite a sinopse do filme..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          try {
                            setIsLoading(true);
                            const atualizado = { 
                              ...filmeEditando,
                              videoStatus: (filmeEditando.videoGUID && filmeEditando.embedLink) ? 'Processado' : 'Processando' 
                            };
                            await filmeStorage.updateFilme(atualizado.GUID, atualizado);
                            const filmesAtualizados = await filmeStorage.obterFilmes();
                            setFilmes(filmesAtualizados);
                            setShowEditModal(false);
                            setFilmeEditando(null);
                          } catch (error) {
                            console.error('Erro ao atualizar filme:', error);
                            alert('Erro ao atualizar filme. Tente novamente.');
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        disabled={isLoading}
                        className="btn-vintage flex-1"
                      >
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-vintage-black mr-2"></div>
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowEditModal(false);
                          setFilmeEditando(null);
                        }}
                        variant="outline"
                        className="bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold/20"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                  
                  {/* Preview */}
                  <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6">
                    <h4 className="text-lg font-vintage-serif font-semibold text-vintage-gold mb-4">Preview</h4>
                    <div className="film-card">
                      <div className="flex justify-center items-center w-full" style={{ height: '220px' }}>
                        <img
                          src={filmeEditando.imagemUrl || 'https://images.pexels.com/photos/22483588/pexels-photo-22483588.jpeg'}
                          alt="Preview"
                          style={{
                            maxWidth: '180px',
                            maxHeight: '200px',
                            objectFit: 'contain',
                            display: 'block',
                            margin: '0 auto',
                            borderRadius: '12px',
                            background: '#222',
                          }}
                        />
                      </div>
                      <div className="p-4">
                        <h5 className="font-vintage-serif font-semibold text-vintage-cream mb-2">
                          {filmeEditando.nomePortugues || 'Nome do filme'}
                        </h5>
                        <p className="text-vintage-cream/70 font-vintage-body text-sm italic mb-2">
                          "{filmeEditando.nomeOriginal || 'Nome original'}"
                        </p>
                        <p className="text-vintage-cream/60 font-vintage-body text-sm mb-3">
                          {filmeEditando.ano || '2024'} • {filmeEditando.duracao || '0h00'}
                        </p>
                        {filmeEditando.categoria.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {filmeEditando.categoria.slice(0, 3).map((cat, index) => (
                              <span
                                key={index}
                                className="text-xs bg-vintage-gold/20 text-vintage-gold px-2 py-1 rounded font-vintage-body"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-vintage-cream/80 font-vintage-body line-clamp-3">
                          {filmeEditando.sinopse || 'Sinopse do filme aparecerá aqui...'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Carrossel Superior Tab */}
          {activeTab === 'carrossel' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-vintage-gold">
                  Gerenciar Carrossel Superior
                </h3>
                <Button
                  onClick={handleSalvarCarrossel}
                  className="btn-vintage"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Carrossel
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {carrossel.map((item, index) => (
                  <div key={index} className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-vintage-gold mb-4">
                      Posição {index + 1}
                    </h4>
                    
                    {/* Seleção do Filme */}
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-vintage-gold mb-2">
                        Filme
                      </label>
                      <select
                        value={item.filmeId || ''}
                        onChange={(e) => {
                          const novoCarrossel = [...carrossel];
                          novoCarrossel[index].filmeId = e.target.value || null;
                          setCarrossel(novoCarrossel);
                        }}
                        className="w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-3 py-2 text-vintage-cream focus:border-vintage-gold focus:outline-none"
                      >
                        <option value="">Selecione um filme</option>
                        {filmes.map((filme) => (
                          <option key={filme.GUID} value={filme.GUID}>
                            {filme.nomePortugues}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Upload da Imagem */}
                    {item.filmeId && (
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-vintage-gold mb-2">
                          Imagem do Carrossel (Full Width)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const filmeSelecionado = filmes.find(f => f.GUID === item.filmeId);
                              if (filmeSelecionado) {
                                handleCarrosselImageUpload(file, index, filmeSelecionado.nomePortugues);
                              }
                            }
                          }}
                          className="block w-full text-sm text-vintage-cream bg-vintage-black/50 border border-vintage-gold/30 rounded-lg cursor-pointer focus:outline-none"
                        />
                      </div>
                    )}

                    {/* Preview da Imagem */}
                    {item.imagemUrl && (
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-vintage-gold mb-2">
                          Preview
                        </label>
                        <div className="w-full h-32 bg-vintage-black/50 border border-vintage-gold/20 rounded-lg overflow-hidden">
                          <img
                            src={item.imagemUrl}
                            alt="Preview do carrossel"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {/* Ativar/Desativar */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={item.ativo}
                        onChange={(e) => {
                          const novoCarrossel = [...carrossel];
                          novoCarrossel[index].ativo = e.target.checked;
                          setCarrossel(novoCarrossel);
                        }}
                        className="rounded border-vintage-gold/30 text-vintage-gold focus:ring-vintage-gold focus:ring-offset-0"
                      />
                      <label className="text-sm text-vintage-cream">
                        Ativo no carrossel
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal de Confirmação de Exclusão */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-vintage-black border border-vintage-gold/30 rounded-lg p-6 max-w-md w-full">
                <h3 className="text-xl font-vintage-serif font-bold text-vintage-gold mb-4">
                  Confirmar Exclusão
                </h3>
                <p className="text-vintage-cream/80 font-vintage-body mb-6">
                  Tem certeza que deseja excluir este filme? Esta ação irá:
                  <br />• Deletar o filme da base de dados local
                  <br />• Deletar o vídeo do Bunny.net (se existir)
                  <br />• Esta ação não pode ser desfeita.
                </p>
                <div className="flex space-x-4">
                  <Button
                    onClick={() => handleDeletarFilme(showDeleteModal)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  >
                    Excluir
                  </Button>
                  <Button
                    onClick={() => setShowDeleteModal(null)}
                    variant="outline"
                    className="flex-1 bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold/20"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default AdminDashboard;
