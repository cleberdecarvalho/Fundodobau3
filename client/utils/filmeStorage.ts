// Objeto compatível com o padrão antigo para evitar erros de importação
export const filmeStorage = {
  obterFilmes: getFilmes,
  saveFilmes,
  addFilme,
  updateFilme,
  deleteFilme,
  obterFilmePorGUID: (GUID: string) => getFilmes().find(f => f.GUID === GUID),
};


import { Filme } from '@shared/types';

const STORAGE_KEY = 'filmes';

export function getFilmes(): Filme[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveFilmes(filmes: Filme[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filmes));
}

export function addFilme(filme: Filme) {
  const filmes = getFilmes();
  filmes.push(filme);
  saveFilmes(filmes);
}


export function updateFilme(filme: Filme) {
  const filmes = getFilmes();
  const idx = filmes.findIndex(f => f.GUID === filme.GUID);
  if (idx !== -1) {
    filmes[idx] = filme;
    saveFilmes(filmes);
  }
}


export function deleteFilme(GUID: string) {
  const filmes = getFilmes().filter(f => f.GUID !== GUID);
  saveFilmes(filmes);
}
