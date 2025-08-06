// =====================================================
// Configuração da API - Fundo Do Baú
// =====================================================

// Detectar ambiente
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// URLs base da API
const API_CONFIG = {
  // Desenvolvimento: Backend Node.js/Express
  development: {
    baseURL: 'http://localhost:3333/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    }
  },
  
  // Produção: Backend PHP/MySQL (Hostgator)
  production: {
    baseURL: '/api-filmes.php', // Relativo ao domínio
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    }
  }
};

// Configuração atual baseada no ambiente
const currentConfig = isDevelopment ? API_CONFIG.development : API_CONFIG.production;

// =====================================================
// Cliente HTTP
// =====================================================

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = currentConfig.baseURL;
    this.timeout = currentConfig.timeout;
    this.defaultHeaders = currentConfig.headers;
  }

  // Função para fazer requisições HTTP
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}/${endpoint}`.replace(/\/+/g, '/');
    
    const config: RequestInit = {
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    // Adicionar timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    config.signal = controller.signal;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Timeout: A requisição demorou muito para responder');
        }
        throw error;
      }
      
      throw new Error('Erro desconhecido na requisição');
    }
  }

  // =====================================================
  // Métodos da API
  // =====================================================

  // Autenticação
  async login(email: string, senha: string) {
    return this.request<{ success: boolean; user: any }>('auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });
  }

  async register(nome: string, email: string, senha: string) {
    return this.request<{ success: boolean; user: any }>('auth/register', {
      method: 'POST',
      body: JSON.stringify({ nome, email, senha }),
    });
  }

  async logout() {
    return this.request<{ success: boolean }>('auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request<any>('auth/me');
  }

  // Filmes
  async getFilmes() {
    return this.request<any[]>('filmes');
  }

  async getFilme(guid: string) {
    return this.request<any>(`filmes/${guid}`);
  }

  async createFilme(filme: any) {
    return this.request<{ success: boolean; guid: string }>('filmes', {
      method: 'POST',
      body: JSON.stringify(filme),
    });
  }

  async updateFilme(guid: string, filme: any) {
    return this.request<{ success: boolean }>(`filmes/${guid}`, {
      method: 'PUT',
      body: JSON.stringify(filme),
    });
  }

  async deleteFilme(guid: string) {
    return this.request<{ success: boolean }>(`filmes/${guid}`, {
      method: 'DELETE',
    });
  }

  // Busca e filtros
  async buscarFilmes(query: string) {
    return this.request<any[]>(`filmes/buscar?q=${encodeURIComponent(query)}`);
  }

  async getFilmesPorCategoria(categoria: string) {
    return this.request<any[]>(`filmes/categoria/${encodeURIComponent(categoria)}`);
  }

  // Interações do usuário
  async marcarComoAssistido(guid: string) {
    return this.request<{ success: boolean }>(`filmes/${guid}/assistir`, {
      method: 'POST',
    });
  }

  async removerAssistido(guid: string) {
    return this.request<{ success: boolean }>(`filmes/${guid}/assistir`, {
      method: 'DELETE',
    });
  }

  async adicionarParaAssistir(guid: string) {
    return this.request<{ success: boolean }>(`filmes/${guid}/para-assistir`, {
      method: 'POST',
    });
  }

  async removerParaAssistir(guid: string) {
    return this.request<{ success: boolean }>(`filmes/${guid}/para-assistir`, {
      method: 'DELETE',
    });
  }

  async avaliarFilme(guid: string, avaliacao: 'gostei' | 'gostei-muito' | 'nao-gostei') {
    return this.request<{ success: boolean }>(`filmes/${guid}/avaliar`, {
      method: 'POST',
      body: JSON.stringify({ avaliacao }),
    });
  }

  // Categorias
  async getCategorias() {
    return this.request<any[]>('categorias');
  }

  // Estatísticas
  async getStats() {
    return this.request<any>('stats');
  }
}

// =====================================================
// Instância global da API
// =====================================================

export const api = new ApiClient();

// =====================================================
// Utilitários
// =====================================================

// Função para verificar se a API está online
export async function checkApiHealth(): Promise<boolean> {
  try {
    await api.getFilmes();
    return true;
  } catch (error) {
    console.error('API não está respondendo:', error);
    return false;
  }
}

// Função para obter informações do ambiente
export function getApiInfo() {
  return {
    environment: isDevelopment ? 'development' : 'production',
    baseURL: currentConfig.baseURL,
    timeout: currentConfig.timeout,
  };
}

// =====================================================
// Tipos TypeScript
// =====================================================

export interface Filme {
  GUID: string;
  nomeOriginal: string;
  nomePortugues: string;
  ano: string;
  categoria: string[];
  duracao: string;
  sinopse: string;
  embedLink?: string;
  imagemUrl?: string;
  assistencias: number;
  avaliacoes?: Record<string, string>;
  videoGUID?: string;
  videoStatus?: string;
  assistido?: boolean;
  para_assistir?: boolean;
  avaliacao?: string;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: 'admin' | 'usuario';
  avatar?: string;
}

export interface Categoria {
  id: number;
  nome: string;
  descricao?: string;
  cor: string;
}

export interface Stats {
  total_filmes: number;
  mais_assistidos: Array<{ nomePortugues: string; assistencias: number }>;
  por_categoria: Array<{ categoria: string; total: number }>;
  meus_assistidos?: number;
  meus_para_assistir?: number;
}

// =====================================================
// Exportações
// =====================================================

export default api; 