// Objeto compatível com o padrão antigo para evitar erros de importação
export const filmeStorage = {
  obterFilmes: getFilmes,
  saveFilmes,
  addFilme,
  updateFilme,
  deleteFilme,
  obterFilmePorGUID: (GUID: string) => getFilmes().then(filmes => filmes.find(f => f.GUID === GUID)),
};

import { Filme } from '@shared/types';
import { api } from '@/lib/api';

const STORAGE_KEY = 'filmes';

// Função para obter filmes da API
export async function getFilmes(): Promise<Filme[]> {
  // Durante desenvolvimento, usar localStorage diretamente
  if (import.meta.env.DEV) {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data && data.trim() !== '') {
        // Verificar se não é HTML
        if (data.includes('<!doctype') || data.includes('<html')) {
          console.warn('localStorage contém HTML, limpando...');
          localStorage.removeItem(STORAGE_KEY);
          return [];
        }
        const parsed = JSON.parse(data);
        console.log('Filmes carregados do localStorage:', parsed);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch (localStorageError) {
      console.error('Erro ao ler localStorage:', localStorageError);
      // Limpar localStorage corrompido
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  }
  
  // Em produção, tentar API primeiro
  try {
    const filmes = await api.getFilmes();
    return filmes;
  } catch (error) {
    console.warn('Erro ao buscar filmes da API, usando localStorage:', error);
    // Fallback para localStorage
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data && data.trim() !== '') {
        // Verificar se não é HTML
        if (data.includes('<!doctype') || data.includes('<html')) {
          console.warn('localStorage contém HTML, limpando...');
          localStorage.removeItem(STORAGE_KEY);
          return [];
        }
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch (localStorageError) {
      console.error('Erro ao ler localStorage:', localStorageError);
      // Limpar localStorage corrompido
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  }
}

// Função para salvar filmes (usado apenas como fallback)
export function saveFilmes(filmes: Filme[]) {
  try {
    console.log('Salvando filmes no localStorage:', filmes.length, 'filmes');
    console.log('Dados dos filmes:', filmes);
    // Tentar salvar normalmente
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filmes));
    console.log('Filmes salvos com sucesso no localStorage');
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error);
    // Se der erro de cota, limpar e tentar salvar apenas o filme atual
    try {
      localStorage.clear();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filmes));
      console.log('Filmes salvos após limpeza do localStorage');
    } catch (finalError) {
      console.error('Erro final ao salvar no localStorage:', finalError);
      throw new Error('Cota do navegador excedida. Limpe o cache e tente novamente.');
    }
  }
}

// Função para adicionar filme via API
export async function addFilme(filme: Filme) {
  try {
    // Tentar API primeiro
    const response = await api.createFilme(filme);
    if (response.success) {
      console.log('Filme adicionado via API com sucesso');
      return response.guid;
    }
  } catch (error) {
    console.warn('Erro ao adicionar filme via API, tentando localStorage:', error);
  }
  
  // Fallback para localStorage sempre que API falhar
  try {
    const filmes = await getFilmes();
    console.log('Filmes existentes antes de adicionar:', filmes.length);
    filmes.push(filme);
    console.log('Filmes após adicionar:', filmes.length);
    saveFilmes(filmes);
    console.log('Filme adicionado via localStorage com sucesso');
    return filme.GUID;
  } catch (localStorageError) {
    console.error('Erro no localStorage (cota excedida):', localStorageError);
    // Limpar localStorage e tentar novamente
    try {
      localStorage.clear();
      const filmes = [filme];
      saveFilmes(filmes);
      console.log('Filme adicionado via localStorage após limpeza');
      return filme.GUID;
    } catch (finalError) {
      console.error('Erro final ao salvar filme:', finalError);
      throw new Error('Não foi possível salvar o filme. Tente novamente.');
    }
  }
}

// Função para atualizar filme via API
export async function updateFilme(id: string | number, filme: Partial<Filme>) {
  try {
    // Tentar API primeiro
    const guid = typeof id === 'string' ? id : id.toString();
    const response = await api.updateFilme(guid, filme);
    if (response.success) {
      console.log('Filme atualizado via API com sucesso');
      return true;
    }
  } catch (error) {
    console.warn('Erro ao atualizar filme via API, usando localStorage:', error);
  }
  
  // Fallback para localStorage
  try {
    const filmes = await getFilmes();
    const idx = filmes.findIndex(f => f.GUID === id || f.id === id);
    if (idx !== -1) {
      filmes[idx] = { ...filmes[idx], ...filme };
      saveFilmes(filmes);
      console.log('Filme atualizado via localStorage com sucesso');
      return true;
    }
  } catch (error) {
    console.error('Erro ao atualizar filme no localStorage:', error);
  }
  
  return false;
}

// Função para deletar filme via API
export async function deleteFilme(id: string | number) {
  try {
    // Tentar API primeiro
    const guid = typeof id === 'string' ? id : id.toString();
    const response = await api.deleteFilme(guid);
    if (response.success) {
      console.log('Filme deletado via API com sucesso');
      return true;
    }
  } catch (error) {
    console.warn('Erro ao deletar filme via API, usando localStorage:', error);
  }
  
  // Fallback para localStorage
  try {
    const filmes = await getFilmes();
    const filmesFiltrados = filmes.filter(f => f.GUID !== id && f.id !== id);
    saveFilmes(filmesFiltrados);
    console.log('Filme deletado via localStorage com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao deletar filme no localStorage:', error);
    return false;
  }
}
