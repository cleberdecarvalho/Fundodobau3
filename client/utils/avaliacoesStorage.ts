const baseURL = 'https://www.fundodobaufilmes.com/api-filmes.php';

export interface InteracaoUsuario {
  filme_guid: string;
  tipo_interacao: 'assistido' | 'quero_ver' | 'favorito' | 'avaliacao';
  valor?: number; // Para avaliações (1-5)
  data_criacao: string;
}

export interface EstatisticasFilme {
  filme_guid: string;
  total_assistidos: number;
  total_quero_ver: number;
  total_favoritos: number;
  total_avaliacoes: number;
  media_avaliacao: number;
}

export const avaliacoesStorage = {
  // Adicionar/atualizar interação do usuário
  async adicionarInteracao(filmeGuid: string, tipoInteracao: string, valor?: number): Promise<boolean> {
    try {
      const url = `${baseURL}/avaliacoes/${filmeGuid}/${tipoInteracao}`;
      const body = tipoInteracao === 'avaliacao' ? JSON.stringify({ valor }) : '';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: tipoInteracao === 'avaliacao' ? body : undefined
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Erro ao adicionar interação:', error);
      return false;
    }
  },

  // Remover interação do usuário
  async removerInteracao(filmeGuid: string, tipoInteracao: string): Promise<boolean> {
    try {
      const url = `${baseURL}/avaliacoes/${filmeGuid}/${tipoInteracao}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Erro ao remover interação:', error);
      return false;
    }
  },

  // Obter interações do usuário
  async obterInteracoesUsuario(): Promise<InteracaoUsuario[]> {
    try {
      const response = await fetch(baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          endpoint: 'avaliacoes/usuario'
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.interacoes || [];
    } catch (error) {
      console.error('Erro ao obter interações:', error);
      return [];
    }
  },

  // Obter estatísticas de um filme
  async obterEstatisticasFilme(filmeGuid: string): Promise<EstatisticasFilme | null> {
    try {
      const url = `${baseURL}/avaliacoes/filme/${filmeGuid}`;
      
      const response = await fetch(url, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return null;
    }
  },

  // Obter filmes mais populares
  async obterFilmesPopulares(): Promise<any[]> {
    try {
      const url = `${baseURL}/avaliacoes/populares`;
      
      const response = await fetch(url, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao obter filmes populares:', error);
      return [];
    }
  },

  // Verificar se usuário tem uma interação específica
  async verificarInteracao(filmeGuid: string, tipoInteracao: string): Promise<boolean> {
    try {
      const interacoes = await this.obterInteracoesUsuario();
      return interacoes.some(interacao => 
        interacao.filme_guid === filmeGuid && 
        interacao.tipo_interacao === tipoInteracao
      );
    } catch (error) {
      console.error('Erro ao verificar interação:', error);
      return false;
    }
  },

  // Obter valor da avaliação do usuário
  async obterAvaliacaoUsuario(filmeGuid: string): Promise<number | null> {
    try {
      const interacoes = await this.obterInteracoesUsuario();
      const avaliacao = interacoes.find(interacao => 
        interacao.filme_guid === filmeGuid && 
        interacao.tipo_interacao === 'avaliacao'
      );
      return avaliacao?.valor || null;
    } catch (error) {
      console.error('Erro ao obter avaliação:', error);
      return null;
    }
  }
};
