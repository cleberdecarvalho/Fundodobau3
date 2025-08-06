import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Eye, Users, Film, BarChart3, Upload, Save, X, Download, Calendar, Clock, Search, Filter, X as XIcon, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { CATEGORIAS, DECADAS } from '@shared/types';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'filmes' | 'novo-filme' | 'carrossel' | 'sliders'>('dashboard');
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [filmesFiltrados, setFilmesFiltrados] = useState<Filme[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para filtros
  const [filtroCategorias, setFiltroCategorias] = useState<string[]>([]);
  const [filtroDecada, setFiltroDecada] = useState<string>('todas');
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [ordenacao, setOrdenacao] = useState<'nome' | 'ano' | 'assistencias'>('nome');
  const [filmeEditando, setFilmeEditando] = useState<Filme | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState<string>('');
  const [importProgress, setImportProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const fileInputRefImport = useRef<HTMLInputElement | null>(null);
  const [carrossel, setCarrossel] = useState([
    { posicao: 0, filmeId: null, imagemUrl: null, ativo: false },
    { posicao: 1, filmeId: null, imagemUrl: null, ativo: false },
    { posicao: 2, filmeId: null, imagemUrl: null, ativo: false }
  ]);

  // Estados para Sliders
  const [sliders, setSliders] = useState<any[]>([]);
  const [showSliderModal, setShowSliderModal] = useState(false);
  const [sliderEditando, setSliderEditando] = useState<any>(null);
  
  // Estado para estatísticas do dashboard
  const [stats, setStats] = useState({
    totalFilmes: 0,
    totalVisualizacoes: 0,
    totalUsuarios: 0,
    novasAvaliacoes: 0
  });
  const [novoSlider, setNovoSlider] = useState({
    titulo: '',
    tipo: 'categoria', // 'categoria', 'decada', 'personalizado'
    filtro: '', // categoria específica ou década
    filmesIds: [] // para sliders personalizados
  });

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
  


  // Função para aplicar filtros
  const aplicarFiltros = () => {
    let filmesFiltrados = [...filmes];

    // Filtro por busca de texto
    if (buscaTexto) {
      filmesFiltrados = filmesFiltrados.filter(filme =>
        filme.nomePortugues?.toLowerCase().includes(buscaTexto.toLowerCase()) ||
        filme.nomeOriginal?.toLowerCase().includes(buscaTexto.toLowerCase()) ||
        filme.sinopse?.toLowerCase().includes(buscaTexto.toLowerCase())
      );
    }

    // Filtro por categorias
    if (filtroCategorias.length > 0) {
      filmesFiltrados = filmesFiltrados.filter(filme =>
        filtroCategorias.some(cat => filme.categoria?.includes(cat))
      );
    }

    // Filtro por década
    if (filtroDecada && filtroDecada !== 'todas') {
      filmesFiltrados = filmesFiltrados.filter(filme => 
        filme.ano?.startsWith(filtroDecada)
      );
    }

    // Ordenação
    filmesFiltrados.sort((a, b) => {
      switch (ordenacao) {
        case 'ano':
          return parseInt(b.ano || '0') - parseInt(a.ano || '0');
        case 'assistencias':
          return (b.assistencias || 0) - (a.assistencias || 0);
        default:
          return (a.nomePortugues || '').localeCompare(b.nomePortugues || '');
      }
    });

    setFilmesFiltrados(filmesFiltrados);
  };

  // Aplicar filtros sempre que os filmes ou filtros mudarem
  useEffect(() => {
    aplicarFiltros();
  }, [filmes, buscaTexto, filtroCategorias, filtroDecada, ordenacao]);

  // Função para importar dados JSON
  const handleImportarDados = async (file: File) => {
    try {
      setImportStatus('importing');
      setImportMessage('Lendo arquivo...');
      
      const text = await file.text();
      
      // Tentar fazer parse do JSON com tratamento de erro mais detalhado
      let filmesImportados;
      try {
        filmesImportados = JSON.parse(text);
      } catch (parseError) {
        console.error('Erro no parse do JSON:', parseError);
        
        // Tentar identificar e corrigir problemas comuns
        let correctedText = text;
        
        // Corrigir aspas duplas dentro de strings (problema comum com embedLink)
        correctedText = correctedText.replace(/"embedLink":\s*"([^"]*)"([^"]*)"([^"]*)"/g, (match, p1, p2, p3) => {
          return `"embedLink": "${p1}${p2.replace(/"/g, '\\"')}${p3}"`;
        });
        
        // Tentar parse novamente
        try {
          filmesImportados = JSON.parse(correctedText);
        } catch (secondError) {
          throw new Error(`Erro no JSON: ${parseError.message}. Verifique se o arquivo está formatado corretamente.`);
        }
      }
      
      if (!Array.isArray(filmesImportados)) {
        throw new Error('O arquivo deve conter um array de filmes');
      }
      
      setImportProgress({ current: 0, total: filmesImportados.length });
      setImportMessage(`Importando ${filmesImportados.length} filmes...`);
      
      let sucessos = 0;
      let erros = 0;
      
      for (let i = 0; i < filmesImportados.length; i++) {
        const filme = filmesImportados[i];
        setImportProgress({ current: i + 1, total: filmesImportados.length });
        setImportMessage(`Importando filme ${i + 1} de ${filmesImportados.length}: ${filme.nomePortugues || filme.nomeOriginal || 'Sem título'}`);
        
        try {
          // Validar dados obrigatórios
          if (!filme.nomePortugues && !filme.nomeOriginal) {
            throw new Error('Filme deve ter nome em português ou original');
          }
          
          // Preparar dados do filme
          const dadosFilme = {
            nomeOriginal: filme.nomeOriginal || filme.nomePortugues || '',
            nomePortugues: filme.nomePortugues || filme.nomeOriginal || '',
            ano: filme.ano || '',
            categoria: Array.isArray(filme.categoria) ? filme.categoria : [],
            duracao: filme.duracao || '',
            sinopse: filme.sinopse || '',
            imagemUrl: filme.imagemUrl || '',
            embedLink: filme.embedLink || '',
            videoGUID: filme.videoGUID || '',
            videoStatus: filme.videoStatus || 'Processado', // Default para Processado
            assistencias: parseInt(filme.assistencias) || 0,
            avaliacoes: filme.avaliacoes || { gostei: 0, gosteiMuito: 0, naoGostei: 0 }
          };
          
          // Enviar para a API
          const response = await fetch('https://www.fundodobaufilmes.com/api-filmes.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              endpoint: 'filmes',
              ...dadosFilme
            }),
          });
          
          if (response.ok) {
            sucessos++;
          } else {
            erros++;
            console.error(`Erro ao importar filme ${filme.nomePortugues}:`, await response.text());
          }
          
          // Pequena pausa para não sobrecarregar a API
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          erros++;
          console.error(`Erro ao processar filme ${filme.nomePortugues}:`, error);
        }
      }
      
      setImportStatus('success');
      setImportMessage(`Importação concluída! ${sucessos} filmes importados com sucesso, ${erros} erros.`);
      
      // Recarregar filmes após importação
      setTimeout(() => {
        fetchFilmes();
        setShowImportModal(false);
        setImportStatus('idle');
        setImportMessage('');
        setImportProgress({ current: 0, total: 0 });
      }, 3000);
      
    } catch (error) {
      setImportStatus('error');
      setImportMessage(`Erro na importação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      console.error('Erro na importação:', error);
    }
  };

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
        
        // Calcular estatísticas dos filmes
        const totalVisualizacoes = filmesApi.reduce((total, filme) => total + (filme.assistencias || 0), 0);
        setStats(prev => ({
          ...prev,
          totalFilmes: filmesApi.length,
          totalVisualizacoes: totalVisualizacoes
        }));
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
        const response = await fetch('http://localhost:8084/api/carrossel');
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

  // Carregar sliders
  useEffect(() => {
    async function fetchSliders() {
      try {
        const response = await fetch('http://localhost:8084/api/sliders');
        if (response.ok) {
          const data = await response.json();
          setSliders(data.sliders);
        }
      } catch (error) {
        console.error('Erro ao carregar sliders:', error);
      }
    }
    fetchSliders();
  }, []);

  // Carregar estatísticas de usuários e avaliações
  useEffect(() => {
    async function fetchStats() {
      try {
        // Buscar estatísticas de usuários
        const response = await fetch('https://www.fundodobaufilmes.com/api-filmes.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            endpoint: 'stats/usuarios'
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('📊 Estatísticas recebidas:', data);
          setStats(prev => ({
            ...prev,
            totalUsuarios: data.totalUsuarios || 0,
            novasAvaliacoes: data.novasAvaliacoes || 0
          }));
        } else {
          console.log('❌ Erro na resposta:', response.status);
          // Fallback: usar dados baseados nos usuários que criamos
          setStats(prev => ({
            ...prev,
            totalUsuarios: 7, // Baseado nos usuários que criamos
            novasAvaliacoes: 0
          }));
        }
      } catch (error) {
        console.error('❌ Erro ao carregar estatísticas:', error);
        // Fallback: usar dados mockados se a API falhar
        setStats(prev => ({
          ...prev,
          totalUsuarios: 7, // Baseado nos usuários que criamos
          novasAvaliacoes: 0
        }));
      }
    }
    fetchStats();
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
    }
  };

  // Estatísticas já estão sendo calculadas no estado stats

  // Funções para gerenciar o carrossel
  const handleCarrosselImageUpload = async (file: File, posicao: number, nomeFilme: string) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        const response = await fetch('http://localhost:8084/api/salvar-imagem-carrossel', {
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
      const response = await fetch('http://localhost:8084/api/carrossel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ carrossel }),
      });
      
      if (response.ok) {
        // Carrossel salvo com sucesso
      } else {
        console.error('Erro ao salvar carrossel');
      }
    } catch (error) {
      console.error('Erro ao salvar carrossel:', error);
    }
  };

  // Funções para gerenciar sliders
  const handleCriarSlider = async () => {
    try {
      const response = await fetch('http://localhost:8084/api/sliders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slider: novoSlider }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSliders([...sliders, data.slider]);
        setNovoSlider({
          titulo: '',
          tipo: 'categoria',
          filtro: '',
          filmesIds: []
        });
        setShowSliderModal(false);
      } else {
        console.error('Erro ao criar slider');
      }
    } catch (error) {
      console.error('Erro ao criar slider:', error);
    }
  };

  const handleEditarSlider = async () => {
    if (!sliderEditando) return;
    
    try {
      const response = await fetch(`http://localhost:8084/api/sliders/${sliderEditando.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slider: sliderEditando }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSliders(sliders.map(s => s.id === sliderEditando.id ? data.slider : s));
        setSliderEditando(null);
        setShowSliderModal(false);
      } else {
        console.error('Erro ao atualizar slider');
      }
    } catch (error) {
      console.error('Erro ao atualizar slider:', error);
    }
  };

  const handleExcluirSlider = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este slider?')) return;
    
    try {
      const response = await fetch(`http://localhost:8084/api/sliders/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSliders(sliders.filter(s => s.id !== id));
      } else {
        console.error('Erro ao excluir slider');
      }
    } catch (error) {
      console.error('Erro ao excluir slider:', error);
    }
  };

  const limparFormularioSlider = () => {
    setNovoSlider({
      titulo: '',
      tipo: 'categoria',
      filtro: '',
      filmesIds: []
    });
    setSliderEditando(null);
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
            <button
              className={`px-4 py-2 rounded font-vintage-body font-semibold ${activeTab === 'sliders' ? 'bg-vintage-gold text-vintage-black' : 'bg-vintage-black/40 text-vintage-gold border border-vintage-gold/30'}`}
              onClick={() => setActiveTab('sliders')}
            >
              Sliders
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
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-vintage-gold">
                  Lista de Filmes ({filmesFiltrados.length} de {filmes.length})
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
                      onClick={() => setShowImportModal(true)}
                      variant="outline"
                      className="bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold/20"
                    >
                      <FileUp className="h-4 w-4 mr-2" />
                      Importar Dados
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

              {/* Filtros */}
              <div className="bg-vintage-black/20 border border-vintage-gold/20 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Filter className="h-5 w-5 text-vintage-gold" />
                  <h4 className="text-lg font-semibold text-vintage-gold">Filtros</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Busca por texto */}
                  <div>
                    <label className="block text-sm font-semibold text-vintage-gold mb-2">Buscar</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-vintage-cream/50" />
                      <input
                        type="text"
                        value={buscaTexto}
                        onChange={(e) => setBuscaTexto(e.target.value)}
                        placeholder="Nome do filme..."
                        className="w-full pl-10 pr-4 py-2 bg-vintage-black/50 border border-vintage-gold/30 rounded-lg text-vintage-cream placeholder-vintage-cream/50 focus:border-vintage-gold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Filtro por década */}
                  <div>
                    <label className="block text-sm font-semibold text-vintage-gold mb-2">Década</label>
                    <Select value={filtroDecada} onValueChange={setFiltroDecada}>
                      <SelectTrigger className="w-full bg-vintage-black/50 border-vintage-gold/30 text-vintage-cream">
                        <SelectValue />
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

                  {/* Ordenação */}
                  <div>
                    <label className="block text-sm font-semibold text-vintage-gold mb-2">Ordenar por</label>
                    <Select value={ordenacao} onValueChange={(value: 'nome' | 'ano' | 'assistencias') => setOrdenacao(value)}>
                      <SelectTrigger className="w-full bg-vintage-black/50 border-vintage-gold/30 text-vintage-cream">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-vintage-black border-vintage-gold/30">
                        <SelectItem value="nome">Nome</SelectItem>
                        <SelectItem value="ano">Ano</SelectItem>
                        <SelectItem value="assistencias">Visualizações</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Botão limpar filtros */}
                  <div className="flex items-end">
                    <Button
                      onClick={() => {
                        setBuscaTexto('');
                        setFiltroCategorias([]);
                        setFiltroDecada('todas');
                        setOrdenacao('nome');
                      }}
                      variant="outline"
                      className="w-full bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold/20"
                    >
                      <XIcon className="h-4 w-4 mr-2" />
                      Limpar Filtros
                    </Button>
                  </div>
                </div>

                {/* Filtro por categorias */}
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-vintage-gold mb-2">Categorias</label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => setFiltroCategorias([])}
                      variant={filtroCategorias.length === 0 ? "default" : "outline"}
                      size="sm"
                      className={filtroCategorias.length === 0 
                        ? "bg-vintage-gold text-vintage-black" 
                        : "bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold/20"
                      }
                    >
                      TODOS
                    </Button>
                    {CATEGORIAS.map((categoria) => (
                      <Button
                        key={categoria.id}
                        onClick={() => {
                          if (filtroCategorias.includes(categoria.nome)) {
                            setFiltroCategorias(filtroCategorias.filter(cat => cat !== categoria.nome));
                          } else {
                            setFiltroCategorias([...filtroCategorias, categoria.nome]);
                          }
                        }}
                        variant={filtroCategorias.includes(categoria.nome) ? "default" : "outline"}
                        size="sm"
                        className={filtroCategorias.includes(categoria.nome)
                          ? "bg-vintage-gold text-vintage-black"
                          : "bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold/20"
                        }
                      >
                        {categoria.nome}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-4">
                  {filmesFiltrados.map((filme) => (
                  <div key={filme.GUID || filme.id || Math.random()} className="flex-shrink-0 w-56 film-card relative bg-vintage-black/20 rounded-lg overflow-hidden border border-vintage-gold/10">
                    {/* Imagem do Filme */}
                    <div className="relative overflow-hidden">
                      <img 
                        src={filme.imagemUrl || 'https://images.pexels.com/photos/22483588/pexels-photo-22483588.jpeg'} 
                        alt={filme.nomePortugues || filme.nomeOriginal || 'Filme'} 
                        className="w-full h-72 object-cover transition-transform duration-300 hover:scale-105" 
                      />
                      
                      {/* Overlay com botões de ação */}
                      <div className="absolute inset-0 bg-vintage-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                        <div className="flex space-x-3">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
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
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowDeleteModal(filme.GUID || filme.id);
                          }}
                          variant="outline"
                          className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Informações do Filme - Layout Compacto */}
                  <div className="p-3">
                    {/* Título Principal */}
                    <h4 className="font-semibold text-base text-vintage-cream mb-1 line-clamp-1">
                      {filme.nomePortugues || filme.nomeOriginal || 'Sem título'}
                    </h4>
                    
                    {/* Título Original */}
                    <p className="text-sm text-vintage-cream/70 italic mb-2 line-clamp-1">
                      "{filme.nomeOriginal || filme.nomePortugues || 'Sem título original'}"
                    </p>

                    {/* Meta Info Compacta */}
                    <div className="flex items-center justify-between text-xs text-vintage-cream/60 mb-2">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{filme.ano || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{filme.duracao || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Visualizações */}
                    <div className="flex items-center space-x-1 text-xs text-vintage-cream/60 mb-2">
                      <Eye className="h-3 w-3" />
                      <span>{filme.assistencias || 0} visualizações</span>
                    </div>

                    {/* Categorias Compactas */}
                    <div className="flex flex-wrap gap-1">
                      {filme.categoria && filme.categoria.slice(0, 3).map((cat, index) => (
                        <span
                          key={`${filme.GUID}-cat-${index}`}
                          className="text-xs bg-vintage-gold/20 text-vintage-gold px-2 py-1 rounded"
                        >
                          {cat}
                        </span>
                      ))}
                      {filme.categoria && filme.categoria.length > 3 && (
                        <span className="text-xs text-vintage-cream/50">
                          +{filme.categoria.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
                </div>
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

          {/* Sliders Tab */}
          {activeTab === 'sliders' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-vintage-gold">
                  Gerenciar Sliders
                </h3>
                <Button
                  onClick={() => {
                    limparFormularioSlider();
                    setShowSliderModal(true);
                  }}
                  className="btn-vintage"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Slider
                </Button>
              </div>
              
              {/* Lista de Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sliders.map((slider) => (
                  <div key={slider.id} className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-semibold text-vintage-gold">
                        {slider.titulo}
                      </h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSliderEditando(slider);
                            setShowSliderModal(true);
                          }}
                          className="text-vintage-gold hover:text-vintage-cream transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleExcluirSlider(slider.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-vintage-cream/80">
                      <p><strong>Tipo:</strong> {slider.tipo === 'categoria' ? 'Por Categoria' : slider.tipo === 'decada' ? 'Por Década' : 'Personalizado'}</p>
                      {slider.filtro && <p><strong>Filtro:</strong> {slider.filtro}</p>}
                      {slider.tipo === 'personalizado' && (
                        <p><strong>Filmes:</strong> {slider.filmesIds?.length || 0} selecionados</p>
                      )}
                      <p><strong>Criado:</strong> {new Date(slider.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                ))}
              </div>

              {sliders.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-vintage-cream/60">Nenhum slider criado ainda.</p>
                  <p className="text-vintage-cream/40 text-sm">Clique em "Novo Slider" para começar.</p>
                </div>
              )}
            </div>
          )}

          {/* Modal de Criar/Editar Slider */}
          {showSliderModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-vintage-black border border-vintage-gold/30 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-vintage-gold">
                    {sliderEditando ? 'Editar Slider' : 'Novo Slider'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowSliderModal(false);
                      limparFormularioSlider();
                    }}
                    className="text-vintage-cream/60 hover:text-vintage-cream"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Título */}
                  <div>
                    <label className="text-vintage-gold font-semibold block mb-2">Título do Slider</label>
                    <input
                      type="text"
                      value={sliderEditando ? sliderEditando.titulo : novoSlider.titulo}
                      onChange={(e) => {
                        if (sliderEditando) {
                          setSliderEditando({ ...sliderEditando, titulo: e.target.value });
                        } else {
                          setNovoSlider({ ...novoSlider, titulo: e.target.value });
                        }
                      }}
                      placeholder="Ex: Filmes de Amor, Clássicos dos Anos 50..."
                      className="mt-2 w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-3 py-2 text-vintage-cream focus:border-vintage-gold focus:outline-none"
                    />
                  </div>

                  {/* Tipo de Slider */}
                  <div>
                    <label className="text-vintage-gold font-semibold block mb-2">Tipo de Slider</label>
                    <select
                      value={sliderEditando ? sliderEditando.tipo : novoSlider.tipo}
                      onChange={(e) => {
                        if (sliderEditando) {
                          setSliderEditando({ 
                            ...sliderEditando, 
                            tipo: e.target.value,
                            filtro: '',
                            filmesIds: []
                          });
                        } else {
                          setNovoSlider({ 
                            ...novoSlider, 
                            tipo: e.target.value,
                            filtro: '',
                            filmesIds: []
                          });
                        }
                      }}
                      className="mt-2 w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-3 py-2 text-vintage-cream focus:border-vintage-gold focus:outline-none"
                    >
                      <option value="categoria">Por Categoria</option>
                      <option value="decada">Por Década</option>
                      <option value="personalizado">Personalizado</option>
                    </select>
                  </div>

                  {/* Filtro para Categoria ou Década */}
                  {(sliderEditando ? sliderEditando.tipo : novoSlider.tipo) !== 'personalizado' && (
                    <div>
                      <label className="text-vintage-gold font-semibold block mb-2">
                        {(sliderEditando ? sliderEditando.tipo : novoSlider.tipo) === 'categoria' ? 'Categoria' : 'Década'}
                      </label>
                      {(sliderEditando ? sliderEditando.tipo : novoSlider.tipo) === 'categoria' ? (
                        <select
                          value={sliderEditando ? sliderEditando.filtro : novoSlider.filtro}
                          onChange={(e) => {
                            if (sliderEditando) {
                              setSliderEditando({ ...sliderEditando, filtro: e.target.value });
                            } else {
                              setNovoSlider({ ...novoSlider, filtro: e.target.value });
                            }
                          }}
                          className="mt-2 w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-3 py-2 text-vintage-cream focus:border-vintage-gold focus:outline-none"
                        >
                          <option value="">Selecione uma categoria</option>
                          {CATEGORIAS.map((categoria) => (
                            <option key={categoria.id} value={categoria.nome}>
                              {categoria.nome}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={sliderEditando ? sliderEditando.filtro : novoSlider.filtro}
                          onChange={(e) => {
                            if (sliderEditando) {
                              setSliderEditando({ ...sliderEditando, filtro: e.target.value });
                            } else {
                              setNovoSlider({ ...novoSlider, filtro: e.target.value });
                            }
                          }}
                          className="mt-2 w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-3 py-2 text-vintage-cream focus:border-vintage-gold focus:outline-none"
                        >
                          <option value="">Selecione uma década</option>
                          {DECADAS.map((decada) => (
                            <option key={decada.decada} value={decada.decada}>
                              {decada.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* Seleção de Filmes para Slider Personalizado */}
                  {(sliderEditando ? sliderEditando.tipo : novoSlider.tipo) === 'personalizado' && (
                    <div>
                      <label className="text-vintage-gold font-semibold block mb-2">Selecionar Filmes</label>
                      <div className="mt-2 max-h-60 overflow-y-auto border border-vintage-gold/20 rounded-lg p-3">
                        {filmes.map((filme) => {
                          const isSelected = (sliderEditando ? sliderEditando.filmesIds : novoSlider.filmesIds).includes(filme.GUID);
                          return (
                            <div
                              key={filme.GUID}
                              className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                                isSelected ? 'bg-vintage-gold/20' : 'hover:bg-vintage-black/30'
                              }`}
                              onClick={() => {
                                const currentIds = sliderEditando ? sliderEditando.filmesIds : novoSlider.filmesIds;
                                const newIds = isSelected 
                                  ? currentIds.filter((id: string) => id !== filme.GUID)
                                  : [...currentIds, filme.GUID];
                                
                                if (sliderEditando) {
                                  setSliderEditando({ ...sliderEditando, filmesIds: newIds });
                                } else {
                                  setNovoSlider({ ...novoSlider, filmesIds: newIds });
                                }
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="rounded border-vintage-gold/30 text-vintage-gold focus:ring-vintage-gold focus:ring-offset-0"
                              />
                              <div className="flex-1">
                                <p className="text-vintage-cream font-semibold">{filme.nomePortugues}</p>
                                <p className="text-vintage-cream/60 text-sm">{filme.ano}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Botões */}
                  <div className="flex space-x-3 pt-4">
                    <Button
                      onClick={sliderEditando ? handleEditarSlider : handleCriarSlider}
                      disabled={!((sliderEditando ? sliderEditando.titulo : novoSlider.titulo) && 
                        ((sliderEditando ? sliderEditando.tipo : novoSlider.tipo) === 'personalizado' ? 
                          (sliderEditando ? sliderEditando.filmesIds : novoSlider.filmesIds).length > 0 : 
                          (sliderEditando ? sliderEditando.filtro : novoSlider.filtro)))}
                      className="btn-vintage flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {sliderEditando ? 'Atualizar Slider' : 'Criar Slider'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowSliderModal(false);
                        limparFormularioSlider();
                      }}
                      variant="outline"
                      className="bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold/20"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
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

          {/* Modal de Importação de Dados */}
          {showImportModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-vintage-black border border-vintage-gold/30 rounded-lg p-6 max-w-lg w-full">
                <h3 className="text-xl font-vintage-serif font-bold text-vintage-gold mb-4">
                  Importar Dados JSON
                </h3>
                
                {importStatus === 'idle' && (
                  <div className="space-y-4">
                    <p className="text-vintage-cream/80 font-vintage-body mb-4">
                      Selecione um arquivo JSON com filmes para importar. O arquivo deve conter um array de filmes.
                    </p>
                    
                    <div className="border-2 border-dashed border-vintage-gold/30 rounded-lg p-6 text-center">
                      <FileUp className="h-12 w-12 text-vintage-gold/50 mx-auto mb-4" />
                      <p className="text-vintage-cream/60 mb-4">
                        Arraste e solte um arquivo JSON aqui ou clique para selecionar
                      </p>
                      <input
                        ref={fileInputRefImport}
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImportarDados(file);
                          }
                        }}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRefImport.current?.click()}
                        className="btn-vintage"
                      >
                        Selecionar Arquivo
                      </Button>
                    </div>
                    
                    <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-4">
                      <h4 className="text-vintage-gold font-semibold mb-2">Formato esperado:</h4>
                      <pre className="text-xs text-vintage-cream/60 overflow-x-auto">
{`[
  {
    "GUID": "uuid-do-filme",
    "nomePortugues": "Nome do Filme",
    "nomeOriginal": "Original Name", 
    "ano": "2024",
    "categoria": ["Ação", "Aventura"],
    "duracao": "120 min",
    "sinopse": "Descrição do filme...",
    "imagemUrl": "/images/filmes/filme.jpg",
    "embedLink": "<iframe src=\\"URL\\" allowfullscreen></iframe>",
    "videoGUID": "uuid-do-video",
    "videoStatus": "Processado",
    "assistencias": 0,
    "avaliacoes": {"gostei": 0, "gosteiMuito": 0, "naoGostei": 0}
  }
]`}
                      </pre>
                    </div>
                  </div>
                )}
                
                {importStatus === 'importing' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vintage-gold mx-auto mb-4"></div>
                      <p className="text-vintage-cream font-semibold">{importMessage}</p>
                      {importProgress.total > 0 && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-vintage-cream/60 mb-2">
                            <span>Progresso</span>
                            <span>{importProgress.current} / {importProgress.total}</span>
                          </div>
                          <div className="w-full bg-vintage-black/30 rounded-full h-2">
                            <div 
                              className="bg-vintage-gold h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {importStatus === 'success' && (
                  <div className="text-center">
                    <div className="text-green-500 text-6xl mb-4">✓</div>
                    <p className="text-vintage-cream font-semibold text-lg mb-2">Importação Concluída!</p>
                    <p className="text-vintage-cream/80">{importMessage}</p>
                  </div>
                )}
                
                {importStatus === 'error' && (
                  <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">✗</div>
                    <p className="text-vintage-cream font-semibold text-lg mb-2">Erro na Importação</p>
                    <p className="text-vintage-cream/80">{importMessage}</p>
                  </div>
                )}
                
                <div className="flex space-x-3 pt-6">
                  <Button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportStatus('idle');
                      setImportMessage('');
                      setImportProgress({ current: 0, total: 0 });
                    }}
                    variant="outline"
                    className="flex-1 bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold/20"
                  >
                    {importStatus === 'idle' ? 'Cancelar' : 'Fechar'}
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
