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

// Configuração da API MySQL da Hostgator
const MYSQL_CONFIG = {
  baseURL: 'https://www.fundodobaufilmes.com/api-filmes.php', // Domínio da Hostgator
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
};

// Função para salvar imagem base64 como arquivo (via HostGator PHP)
async function salvarImagemComoArquivo(base64Data: string, nomeFilme: string): Promise<string> {
  try {
    console.log('🖼️ Salvando imagem (base64) para:', nomeFilme);

    // Converter base64 em Blob
    const [meta, data] = base64Data.split(',');
    const mimeMatch = /data:(.*?);base64/.exec(meta || '') || [];
    const mime = mimeMatch[1] || 'image/jpeg';
    const binary = atob(data);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime });

    // Montar multipart para o endpoint PHP
    const form = new FormData();
    // Nome de arquivo sugerido baseado no nome do filme e tipo
    const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
    const slug = (nomeFilme || 'filme').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const filename = `poster-${slug}.${ext}`;
    form.append('imagem', blob, filename);
    form.append('nomeFilme', nomeFilme || 'filme');

    const response = await fetch('https://www.fundodobaufilmes.com/api-filmes.php?endpoint=salvar-imagem-filme', {
      method: 'POST',
      body: form,
    });

    let result: any = {};
    try {
      result = await response.json();
    } catch {
      const txt = await response.text().catch(() => '');
      console.error('❌ Upload base64: resposta não-JSON. Status:', response.status, 'Body:', txt);
      return '/images/filmes/default.jpg';
    }
    if (!response.ok || !result || result.success !== true || (!result.caminho && !result.url)) {
      console.error('❌ Erro ao salvar imagem no PHP:', result, 'Status:', response.status);
      return '/images/filmes/default.jpg';
    }

    const base = 'https://www.fundodobaufilmes.com';
    const caminho: string = result.url || (result.caminho?.startsWith('/') ? `${base}${result.caminho}` : result.caminho);
    console.log('✅ Imagem salva no servidor:', caminho);
    return caminho;
  } catch (error) {
    console.error('❌ Erro ao salvar imagem (base64):', error);
    return '/images/filmes/default.jpg';
  }
}

// Função para obter filmes da API
export async function getFilmes(): Promise<Filme[]> {
  console.log('🔍 getFilmes() chamado');
  console.log('🔍 Ambiente:', import.meta.env.DEV ? 'DESENVOLVIMENTO' : 'PRODUÇÃO');
  console.log('🔍 URL da API:', MYSQL_CONFIG.baseURL);
  
  // Durante desenvolvimento, usar MySQL da Hostgator
  if (import.meta.env.DEV) {
    try {
      console.log('🔄 Conectando com MySQL da Hostgator...');
      const response = await fetch(MYSQL_CONFIG.baseURL + '?action=list&t=' + Date.now(), {
        method: 'GET',
        headers: MYSQL_CONFIG.headers,
      });
      
      console.log('🔍 Status da resposta:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Filmes carregados do MySQL:', result);
        console.log('🔍 Número de filmes:', result.filmes ? result.filmes.length : 0);
        
        // Processar imagens base64 para salvar como arquivos
        if (result.filmes) {
          console.log('🖼️ Processando imagens...');
          const BASE_DOMAIN = 'https://www.fundodobaufilmes.com';
          for (const filme of result.filmes) {
            console.log('🖼️ Filme:', filme.nomePortugues, 'Imagem:', filme.imagemUrl ? filme.imagemUrl.substring(0, 50) + '...' : 'Nenhuma');
            
            if (filme.imagemUrl && filme.imagemUrl.startsWith('data:')) {
              try {
                const caminhoImagem = await salvarImagemComoArquivo(filme.imagemUrl, filme.nomePortugues);
                filme.imagemUrl = caminhoImagem;
                console.log('✅ Imagem processada para:', filme.nomePortugues, 'Caminho:', caminhoImagem);
              } catch (error) {
                console.error('❌ Erro ao processar imagem para', filme.nomePortugues, ':', error);
                filme.imagemUrl = '/images/filmes/default.jpg'; // Fallback
              }
            } else if (filme.imagemUrl && filme.imagemUrl.startsWith('/')) {
              // Caminho relativo absoluto (ex.: /images/filmes/...) -> prefixar com domínio público
              filme.imagemUrl = `${BASE_DOMAIN}${filme.imagemUrl}`;
              console.log('✅ Caminho relativo prefixado para domínio público:', filme.nomePortugues, '->', filme.imagemUrl);
            } else if (filme.imagemUrl && !filme.imagemUrl.startsWith('http') && !filme.imagemUrl.startsWith('/')) {
              // Se não tem caminho completo, adicionar prefixo
              filme.imagemUrl = `/images/filmes/${filme.imagemUrl}`;
              console.log('✅ Caminho da imagem ajustado para:', filme.nomePortugues, 'Caminho:', filme.imagemUrl);
            } else {
              console.log('ℹ️ Imagem já tem caminho válido para:', filme.nomePortugues);
            }
          }
        }
        
        return result.filmes || [];
      } else {
        console.error('❌ MySQL retornou status:', response.status);
        const errorText = await response.text();
        console.error('❌ Texto do erro:', errorText);
        throw new Error(`API retornou status ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Erro fatal ao conectar com MySQL:', error);
      console.error('❌ Tipo do erro:', error.constructor.name);
      console.error('❌ Stack trace:', error.stack);
      throw new Error('Não foi possível conectar com o banco de dados MySQL. Verifique a configuração.');
    }
  }
  
  // Em produção, usar a mesma API
  try {
    console.log('🔄 Conectando com MySQL em produção...');
    const response = await fetch(MYSQL_CONFIG.baseURL + '?action=list&t=' + Date.now(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Filmes carregados em produção:', result);
      return result.filmes || [];
    } else {
      throw new Error(`API retornou status ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Erro ao conectar com MySQL:', error);
    throw new Error('Não foi possível conectar com o banco de dados.');
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
  // Processar imagem se for base64
  if (filme.imagemUrl && filme.imagemUrl.startsWith('data:')) {
    try {
      console.log('🖼️ Processando imagem do novo filme...');
      const caminhoImagem = await salvarImagemComoArquivo(filme.imagemUrl, filme.nomePortugues);
      filme.imagemUrl = caminhoImagem;
      console.log('✅ Imagem processada para novo filme:', caminhoImagem);
    } catch (error) {
      console.error('❌ Erro ao processar imagem do novo filme:', error);
      filme.imagemUrl = '/images/filmes/default.jpg'; // Fallback
    }
  }
  
  // Durante desenvolvimento, usar MySQL da Hostgator
  if (import.meta.env.DEV) {
    try {
      console.log('🔄 Adicionando filme via MySQL da Hostgator...');
      const response = await fetch(MYSQL_CONFIG.baseURL + '?action=create', {
        method: 'POST',
        headers: MYSQL_CONFIG.headers,
        body: JSON.stringify(filme),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Filme adicionado via MySQL com sucesso');
        return result.guid || filme.GUID;
      } else {
        console.error('❌ MySQL retornou status:', response.status);
        throw new Error(`API retornou status ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erro fatal ao adicionar filme via MySQL:', error);
      throw new Error('Não foi possível salvar o filme no banco de dados MySQL.');
    }
  } else {
    // Em produção, tentar API PHP/MySQL
    try {
      const response = await api.createFilme(filme);
      if (response.success) {
        console.log('Filme adicionado via API MySQL com sucesso');
        return response.guid;
      }
    } catch (error) {
      console.warn('Erro ao adicionar filme via API MySQL, tentando localStorage:', error);
    }
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
  const guid = typeof id === 'string' ? id : id.toString();
  console.log('🔄 Atualizando filme com GUID:', guid);
  console.log('🔄 Dados para atualizar:', filme);
  
  // Durante desenvolvimento, usar MySQL da Hostgator
  if (import.meta.env.DEV) {
    try {
      console.log('🔄 Atualizando via MySQL da Hostgator...');
      const response = await fetch(MYSQL_CONFIG.baseURL + `?action=update&guid=${guid}`, {
        method: 'PUT',
        headers: MYSQL_CONFIG.headers,
        body: JSON.stringify(filme),
      });
      
      if (response.ok) {
        console.log('✅ Filme atualizado via MySQL com sucesso');
        return true;
      } else {
        console.error('❌ MySQL retornou status:', response.status);
        throw new Error(`API retornou status ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erro fatal ao atualizar filme via MySQL:', error);
      throw new Error('Não foi possível atualizar o filme no banco de dados MySQL.');
    }
  } else {
    // Em produção, tentar API PHP/MySQL
    try {
      const response = await api.updateFilme(guid, filme);
      if (response.success) {
        console.log('Filme atualizado via API MySQL com sucesso');
        return true;
      }
    } catch (error) {
      console.warn('Erro ao atualizar filme via API MySQL, usando localStorage:', error);
    }
  }
  
  // Fallback para localStorage
  try {
    const filmes = await getFilmes();
    const idx = filmes.findIndex(f => f.GUID === id);
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
  const guid = typeof id === 'string' ? id : id.toString();
  
  // Durante desenvolvimento, usar MySQL da Hostgator
  if (import.meta.env.DEV) {
    try {
      console.log('🔄 Deletando filme via MySQL da Hostgator...');
      const response = await fetch(MYSQL_CONFIG.baseURL + `?action=delete&guid=${guid}`, {
        method: 'DELETE',
        headers: MYSQL_CONFIG.headers,
      });
      
      if (response.ok) {
        console.log('✅ Filme deletado via MySQL com sucesso');
        return true;
      } else {
        console.error('❌ MySQL retornou status:', response.status);
        throw new Error(`API retornou status ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erro fatal ao deletar filme via MySQL:', error);
      throw new Error('Não foi possível deletar o filme do banco de dados MySQL.');
    }
  } else {
    // Em produção, tentar API PHP/MySQL
    try {
      const response = await api.deleteFilme(guid);
      if (response.success) {
        console.log('Filme deletado via API MySQL com sucesso');
        return true;
      }
    } catch (error) {
      console.warn('Erro ao deletar filme via API MySQL, usando localStorage:', error);
    }
  }
  
  // Fallback para localStorage
  try {
    const filmes = await getFilmes();
    const filmesFiltrados = filmes.filter(f => f.GUID !== id);
    saveFilmes(filmesFiltrados);
    console.log('Filme deletado via localStorage com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao deletar filme no localStorage:', error);
    return false;
  }
}
