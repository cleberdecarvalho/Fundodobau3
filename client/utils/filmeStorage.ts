
import { Filme } from '@shared/types';

// Detecta ambiente e define a URL da API
function getApiUrl() {
  if (typeof window !== 'undefined') {
    // Produção: HostGator/PHP
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return '/api/api-filmes.php';
    }
    // Dev: Node.js/Express
    return '/api/filmes';
  }
  return '';
}

const API_URL = getApiUrl();

export const filmeStorage = {
  async obterFilmes(): Promise<Filme[]> {
    const res = await fetch(API_URL);
    const data = await res.json();
    // PHP retorna categoria como string JSON, converter para array
    return data.map((f: any) => ({
      ...f,
      categoria: typeof f.categoria === 'string' ? JSON.parse(f.categoria) : f.categoria,
    }));
  },
  async adicionarFilme(filme: Filme) {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filme),
    });
  },
  async atualizarFilme(id: string|number, filme: Partial<Filme>) {
    await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...filme, id }),
    });
  },
  async removerFilme(id: string|number) {
    await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
  },
};
