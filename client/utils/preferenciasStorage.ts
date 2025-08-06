const baseURL = 'https://www.fundodobaufilmes.com/api-filmes.php';

export interface PreferenciasUsuario {
  tema: 'vintage' | 'dark' | 'light';
  idioma: 'pt-BR' | 'en' | 'es';
  qualidade_video: 'baixa' | 'media' | 'alta';
  autoplay: boolean;
  legendas: boolean;
  notificacoes_email: boolean;
  notificacoes_push: boolean;
  privacidade_perfil: 'publico' | 'privado' | 'amigos';
  compartilhar_historico: boolean;
  mostrar_estatisticas: boolean;
}

export const preferenciasStorage = {
  // Obter preferências do usuário
  async obterPreferencias(): Promise<PreferenciasUsuario> {
    try {
      const url = `${baseURL}/preferencias`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });

      if (!response.ok) {
        // Retornar preferências padrão se não existirem
        return this.getPreferenciasPadrao();
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao obter preferências:', error);
      return this.getPreferenciasPadrao();
    }
  },

  // Salvar preferências do usuário
  async salvarPreferencias(preferencias: Partial<PreferenciasUsuario>): Promise<boolean> {
    try {
      const url = `${baseURL}/preferencias`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(preferencias)
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      return false;
    }
  },

  // Preferências padrão
  getPreferenciasPadrao(): PreferenciasUsuario {
    return {
      tema: 'vintage',
      idioma: 'pt-BR',
      qualidade_video: 'media',
      autoplay: false,
      legendas: true,
      notificacoes_email: true,
      notificacoes_push: false,
      privacidade_perfil: 'publico',
      compartilhar_historico: true,
      mostrar_estatisticas: true
    };
  },

  // Aplicar tema
  aplicarTema(tema: string) {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem('tema', tema);
  },

  // Obter tema atual
  obterTemaAtual(): string {
    return localStorage.getItem('tema') || 'vintage';
  }
};
