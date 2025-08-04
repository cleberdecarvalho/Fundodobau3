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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'filmes' | 'novo-filme'>('dashboard');
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filmeEditando, setFilmeEditando] = useState<Filme | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  const [novoFilme, setNovoFilme] = useState({
    nomeOriginal: 'Teste',
    nomePortugues: 'Teste',
    ano: '1995',
    categoria: ['Crime'] as string[],
    duracao: '1h30',
    sinopse: 'teste teste teste teste teste teste teste teste teste',
    imagemUrl: '',
    embedLink: '',
    videoGUID: '',
    videoStatus: '',
  });
  const [uploadStatus, setUploadStatus] = useState<'idle'|'uploading'|'processing'|'done'|'error'>('idle');
  const [uploadMsg, setUploadMsg] = useState<string>('');
  const pollingRef = useRef<NodeJS.Timeout|null>(null);

  useEffect(() => {
    // Busca filmes da API e corrige embedLink se necessário
    async function fetchFilmes() {
      setIsLoading(true);
      let filmesApi = await filmeStorage.obterFilmes();
      let alterado = false;
      const corrigidos = await Promise.all(filmesApi.map(async (filme) => {
        if (filme.videoGUID && !filme.embedLink) {
          alterado = true;
          const embedLink = `<iframe src="https://iframe.mediadelivery.net/embed/256964/${filme.videoGUID}?autoplay=false&loop=false&muted=false&preload=true&responsive=true" allowfullscreen="true"></iframe>`;
          await filmeStorage.atualizarFilme(filme.id || filme.GUID, { embedLink, videoStatus: 'Processado' });
          return { ...filme, embedLink, videoStatus: 'Processado' };
        }
        return filme;
      }));
      setFilmes(corrigidos);
      setIsLoading(false);
    }
    fetchFilmes();
  }, []);

  // Salva a key na sessionStorage sempre que mudar
  useEffect(() => {
    if (bunnyApiKey) {
      sessionStorage.setItem('bunnyApiKey', bunnyApiKey);
    } else {
      sessionStorage.removeItem('bunnyApiKey');
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
    if (filmeEditando) {
      // Atualiza filme existente
      const atualizado = { ...filmeEditando, ...novoFilme, videoStatus: (novoFilme.videoGUID && novoFilme.embedLink) ? 'Processado' : 'Processando' };
      await filmeStorage.atualizarFilme(atualizado.id || atualizado.GUID, atualizado);
    } else {
      // Garante embedLink se houver videoGUID
      let embedLink = novoFilme.embedLink;
      if (novoFilme.videoGUID && !embedLink) {
        embedLink = `<iframe src=\"https://iframe.mediadelivery.net/embed/256964/${novoFilme.videoGUID}?autoplay=false&loop=false&muted=false&preload=true&responsive=true\" allowfullscreen=\"true\"></iframe>`;
      }
      const novo = {
        ...novoFilme,
        embedLink,
        videoStatus: (novoFilme.videoGUID && embedLink) ? 'Processado' : 'Processando',
        assistencias: 0,
      };
      await filmeStorage.adicionarFilme(novo);
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
    }
    // Atualiza lista
    const filmesAtualizados = await filmeStorage.obterFilmes();
    setFilmes(filmesAtualizados);
    setFilmeEditando(null);
    setIsLoading(false);
    setActiveTab('filmes');
  };

  const handleDeletarFilme = async (id: string|number) => {
    await filmeStorage.removerFilme(id);
    const filmesAtualizados = await filmeStorage.obterFilmes();
    setFilmes(filmesAtualizados);
    setShowDeleteModal(null);
  };

  // Simulação de estatísticas
  const stats = {
    totalFilmes: filmes.length,
    totalVisualizacoes: filmes.reduce((acc, f) => acc + (f.assistencias || 0), 0),
    totalUsuarios: 1234,
    novasAvaliacoes: 12,
  };

  // Limpa a key ao sair do painel admin
  const handleLogout = () => {
    setBunnyApiKey('');
    sessionStorage.removeItem('bunnyApiKey');
    // Aqui você pode adicionar lógica de logout real, se houver
    window.location.reload();
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          {/* Campo de API key Bunny.net */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-2">
            <div className="flex items-center gap-2">
              <label className="text-vintage-gold font-vintage-serif font-semibold text-sm">Bunny.net API Key:</label>
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
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-red-400 underline"
            >
              Limpar API Key / Sair
            </button>
          </div>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-vintage-serif font-bold text-vintage-gold mb-4 vintage-glow">
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
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-vintage-cream/70 font-vintage-body text-sm">Filmes</p>
                    <p className="text-3xl font-vintage-serif font-bold text-vintage-gold">{stats.totalFilmes}</p>
                  </div>
                  <Film className="h-8 w-8 text-vintage-gold/70" />
                </div>
              </div>
              <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-vintage-cream/70 font-vintage-body text-sm">Visualizações</p>
                    <p className="text-3xl font-vintage-serif font-bold text-vintage-gold">{stats.totalVisualizacoes}</p>
                  </div>
                  <Eye className="h-8 w-8 text-vintage-gold/70" />
                </div>
              </div>
              <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-vintage-cream/70 font-vintage-body text-sm">Usuários</p>
                    <p className="text-3xl font-vintage-serif font-bold text-vintage-gold">{stats.totalUsuarios}</p>
                  </div>
                  <Users className="h-8 w-8 text-vintage-gold/70" />
                </div>
              </div>
              <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-vintage-cream/70 font-vintage-body text-sm">Novas Avaliações</p>
                    <p className="text-3xl font-vintage-serif font-bold text-vintage-gold">{stats.novasAvaliacoes}</p>
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
                <h3 className="text-xl font-vintage-serif font-semibold text-vintage-gold">
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
                  <div key={filme.GUID} className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg overflow-hidden">
                    <img src={filme.imagemUrl} alt={filme.nomePortugues} className="w-full h-48 object-cover" />
                    <div className="p-4">
                      <h4 className="font-vintage-serif font-semibold text-vintage-cream mb-2 line-clamp-1">
                        {filme.nomePortugues}
                      </h4>
                      <p className="text-vintage-cream/70 font-vintage-body text-sm mb-2 italic">
                        "{filme.nomeOriginal}"
                      </p>
                      <p className="text-vintage-cream/60 font-vintage-body text-sm mb-1">
                        {filme.ano} • {filme.duracao} • {filme.assistencias} views
                      </p>
                      {filme.embedLink && filme.videoStatus === 'Processado' && (
                        <span className="inline-block text-xs bg-green-900 text-green-300 px-2 py-1 rounded mb-2">Vídeo pronto</span>
                      )}
                      <div className="flex space-x-2 mt-2">
                        <Button
                          size="sm"
                          onClick={() => setFilmeEditando(filme)}
                          className="flex-1 bg-vintage-gold/20 text-vintage-gold hover:bg-vintage-gold hover:text-vintage-black border-vintage-gold/30"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setShowDeleteModal(filme.GUID)}
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

          {/* Novo Filme / Editar Filme Tab */}
          {(activeTab === 'novo-filme' || filmeEditando) && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-vintage-serif font-semibold text-vintage-gold">
                  {filmeEditando ? 'Editar Filme' : 'Adicionar Novo Filme'}
                </h3>
                {filmeEditando && (
                  <Button
                    onClick={() => setFilmeEditando(null)}
                    variant="outline"
                    className="bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold/20"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Formulário */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                      Nome Original
                    </label>
                    <input
                      type="text"
                      value={filmeEditando?.nomeOriginal || novoFilme.nomeOriginal}
                      onChange={(e) => {
                        if (filmeEditando) {
                          setFilmeEditando({ ...filmeEditando, nomeOriginal: e.target.value });
                        } else {
                          setNovoFilme({ ...novoFilme, nomeOriginal: e.target.value });
                        }
                      }}
                      className="w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-4 py-3 text-vintage-cream placeholder-vintage-cream/50 focus:border-vintage-gold focus:outline-none font-vintage-body"
                      placeholder="Digite o nome original do filme"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                      Nome em Português
                    </label>
                    <input
                      type="text"
                      value={filmeEditando?.nomePortugues || novoFilme.nomePortugues}
                      onChange={(e) => filmeEditando
                        ? setFilmeEditando({ ...filmeEditando, nomePortugues: e.target.value })
                        : setNovoFilme({ ...novoFilme, nomePortugues: e.target.value })
                      }
                      className="w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-4 py-3 text-vintage-cream placeholder-vintage-cream/50 focus:border-vintage-gold focus:outline-none font-vintage-body"
                      placeholder="Digite o nome em português"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                        Ano
                      </label>
                      <input
                        type="text"
                        value={filmeEditando?.ano || novoFilme.ano}
                        onChange={(e) => filmeEditando
                          ? setFilmeEditando({ ...filmeEditando, ano: e.target.value })
                          : setNovoFilme({ ...novoFilme, ano: e.target.value })
                        }
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
                        value={filmeEditando?.duracao || novoFilme.duracao}
                        onChange={(e) => filmeEditando
                          ? setFilmeEditando({ ...filmeEditando, duracao: e.target.value })
                          : setNovoFilme({ ...novoFilme, duracao: e.target.value })
                        }
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
                            checked={(filmeEditando?.categoria || novoFilme.categoria).includes(categoria.nome)}
                            onChange={() => toggleCategoria(categoria.nome, !!filmeEditando)}
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
                    <input
                      type="file"
                      accept="video/*"
                      disabled={!bunnyApiKey}
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!bunnyApiKey) {
                          setUploadStatus('error');
                          setUploadMsg('Cole a Bunny.net API Key para habilitar o upload.');
                          return;
                        }
                        setUploadStatus('uploading');
                        setUploadMsg('Enviando vídeo para Bunny.net...');

                        // 1. Cria vídeo na Bunny.net diretamente
                        let videoId = '';
                        try {
                          const createRes = await fetch('https://video.bunnycdn.com/library/256964/videos', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'AccessKey': bunnyApiKey,
                            },
                            body: JSON.stringify({ title: file.name }),
                          });
                          if (!createRes.ok) throw new Error('Erro ao criar vídeo na Bunny.net');
                          const createData = await createRes.json();
                          videoId = createData.guid;
                        } catch (err) {
                          setUploadStatus('error');
                          setUploadMsg('Erro ao criar vídeo na Bunny.net.');
                          return;
                        }

                        // 2. Upload do arquivo
                        try {
                          const uploadRes = await fetch(`https://video.bunnycdn.com/library/256964/videos/${videoId}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': file.type,
                              'AccessKey': bunnyApiKey,
                            },
                            body: file,
                          });
                          if (!uploadRes.ok) throw new Error('Erro ao enviar vídeo para Bunny.net');
                        } catch (err) {
                          setUploadStatus('error');
                          setUploadMsg('Erro ao enviar vídeo para Bunny.net.');
                          return;
                        }

                        setUploadStatus('processing');
                        setUploadMsg('Processando vídeo na Bunny.net...');

                        // 3. Polling para status do vídeo
                        let tries = 0;
                        const maxTries = 20;
                        const poll = async () => {
                          tries++;
                          try {
                            const statusRes = await fetch(`https://video.bunnycdn.com/library/256964/videos/${videoId}`, {
                              headers: { 'AccessKey': bunnyApiKey },
                            });
                            if (!statusRes.ok) throw new Error('Erro ao consultar status do vídeo');
                            const statusData = await statusRes.json();
                            if (statusData.encodeProgress === 100 && statusData.status === 3) {
                              // Pronto!
                              const iframe = `<iframe src=\"https://iframe.mediadelivery.net/embed/256964/${videoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true\" allowfullscreen=\"true\"></iframe>`;
                              if (filmeEditando) {
                                setFilmeEditando(f => f ? { ...f, videoGUID: videoId, embedLink: iframe, videoStatus: 'Processado' } : null);
                              } else {
                                setNovoFilme(f => ({ ...f, videoGUID: videoId, embedLink: iframe, videoStatus: 'Processado' }));
                                // Atualizar filme salvo localmente, se existir, para status processado
                                const filmesAtuais = filmeStorage.obterFilmes();
                                const idx = filmesAtuais.findIndex(f => f.videoGUID === videoId || (!f.videoGUID && f.nomeOriginal === novoFilme.nomeOriginal));
                                if (idx !== -1) {
                                  // Atualiza apenas os campos de vídeo
                                  filmeStorage.atualizarFilme(filmesAtuais[idx].GUID, {
                                    videoGUID: videoId,
                                    embedLink: iframe,
                                    videoStatus: 'Processado',
                                  }).then(() => {
                                    setFilmes(filmeStorage.obterFilmes());
                                  });
                                }
                              }
                              setUploadStatus('done');
                              setUploadMsg('Vídeo processado com sucesso!');
                              return;
                            } else {
                              setUploadMsg('Aguardando processamento do vídeo na Bunny.net...');
                            }
                          } catch (err) {
                            setUploadStatus('error');
                            setUploadMsg('Erro ao consultar status do vídeo.');
                            return;
                          }
                          if (tries < maxTries) {
                            setTimeout(poll, 2000);
                          } else {
                            setUploadStatus('error');
                            setUploadMsg('Tempo limite ao processar vídeo na Bunny.net.');
                          }
                        };
                        poll();
                      }}
                      className="block w-full text-sm text-vintage-cream bg-vintage-black/50 border border-vintage-gold/30 rounded-lg cursor-pointer focus:outline-none"
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
                      value={filmeEditando?.sinopse || novoFilme.sinopse}
                      onChange={(e) => filmeEditando
                        ? setFilmeEditando({ ...filmeEditando, sinopse: e.target.value })
                        : setNovoFilme({ ...novoFilme, sinopse: e.target.value })
                      }
                      rows={4}
                      className="w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-4 py-3 text-vintage-cream placeholder-vintage-cream/50 focus:border-vintage-gold focus:outline-none font-vintage-body resize-none"
                      placeholder="Digite a sinopse do filme..."
                    />
                  </div>
                  <Button
                    onClick={handleSalvarFilme}
                    disabled={isLoading}
                    className="btn-vintage w-full"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-vintage-black mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {isLoading ? 'Salvando...' : (filmeEditando ? 'Salvar Alterações' : 'Adicionar Filme')}
                  </Button>
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
                        {filmeEditando?.nomePortugues || novoFilme.nomePortugues || 'Nome do filme'}
                      </h5>
                      <p className="text-vintage-cream/70 font-vintage-body text-sm italic mb-2">
                        "{filmeEditando?.nomeOriginal || novoFilme.nomeOriginal || 'Nome original'}"
                      </p>
                      <p className="text-vintage-cream/60 font-vintage-body text-sm mb-3">
                        {filmeEditando?.ano || novoFilme.ano || '2024'} • {filmeEditando?.duracao || novoFilme.duracao || '0h00'}
                      </p>
                      {(filmeEditando?.categoria || novoFilme.categoria).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {(filmeEditando?.categoria || novoFilme.categoria).slice(0, 3).map((cat, index) => (
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
                        {filmeEditando?.sinopse || novoFilme.sinopse || 'Sinopse do filme aparecerá aqui...'}
                      </p>
                    </div>
                  </div>
                </div>
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
                  Tem certeza que deseja excluir este filme? Esta ação não pode ser desfeita.
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
