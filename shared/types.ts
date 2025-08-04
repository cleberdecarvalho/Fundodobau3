export interface Filme {
  GUID: string;
  nomeOriginal: string;
  nomePortugues: string;
  ano: string;
  categoria: string[];
  duracao: string;
  sinopse: string;
  embedLink: string;
  imagemUrl: string;
  assistencias?: number;
  avaliacoes?: {
    gostei: number;
    gosteiMuito: number;
    naoGostei: number;
  };
  videoGUID?: string;
  videoStatus?: 'Processando' | 'Processado';
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  avatar?: string;
  filmesAssistidos: string[];
  filmesParaAssistir: string[];
  avaliacoes: Record<string, 'gostei' | 'gostei-muito' | 'nao-gostei'>;
}

export interface CategoriaFilme {
  id: string;
  nome: string;
  slug: string;
}

export interface DecadaFilme {
  decada: string;
  label: string;
}

export const CATEGORIAS: CategoriaFilme[] = [
  { id: '1', nome: 'Ação', slug: 'acao' },
  { id: '2', nome: 'Aventura', slug: 'aventura' },
  { id: '3', nome: 'Biografia', slug: 'biografia' },
  { id: '4', nome: 'Comédia', slug: 'comedia' },
  { id: '5', nome: 'Crime', slug: 'crime' },
  { id: '6', nome: 'Documentário', slug: 'documentario' },
  { id: '7', nome: 'Drama', slug: 'drama' },
  { id: '8', nome: 'Fantasia', slug: 'fantasia' },
  { id: '9', nome: 'Guerra', slug: 'guerra' },
  { id: '10', nome: 'Mistério', slug: 'misterio' },
  { id: '11', nome: 'Mudo', slug: 'mudo' },
  { id: '12', nome: 'Musical', slug: 'musical' },
  { id: '13', nome: 'Policial', slug: 'policial' },
  { id: '14', nome: 'Romance', slug: 'romance' },
  { id: '15', nome: 'Suspense', slug: 'suspense' },
  { id: '16', nome: 'Terror', slug: 'terror' },
  { id: '17', nome: 'Western', slug: 'western' },
];

export const DECADAS: DecadaFilme[] = [
  { decada: '1920', label: 'Anos 20' },
  { decada: '1930', label: 'Anos 30' },
  { decada: '1940', label: 'Anos 40' },
  { decada: '1950', label: 'Anos 50' },
  { decada: '1960', label: 'Anos 60' },
  { decada: '1970', label: 'Anos 70' },
  { decada: '1980', label: 'Anos 80' },
];
