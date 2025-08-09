import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { filmeStorage } from '@/utils/filmeStorage';
import { Filme } from '@shared/types';

type FilmesState = {
  filmes: Filme[];
  isLoading: boolean;
  error: string | null;
  prefetchFilmes: () => Promise<void>;
  refresh: () => Promise<void>;
};

const FilmesContext = createContext<FilmesState | undefined>(undefined);

const SESSION_KEY = 'filmesCache:v1';
const SESSION_TS_KEY = 'filmesCacheTs:v1';
const STALE_MS = 60_000; // 1 min para revalidar em background

export function FilmesProvider({ children }: { children: React.ReactNode }) {
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const hydrateFromSession = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          setFilmes(list);
          return true;
        }
      }
    } catch {}
    return false;
  }, []);

  const saveToSession = useCallback((list: Filme[]) => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(list));
      sessionStorage.setItem(SESSION_TS_KEY, String(Date.now()));
    } catch {}
  }, []);

  const loadFilmes = useCallback(async () => {
    try {
      const data = await filmeStorage.obterFilmes();
      if (Array.isArray(data)) {
        setFilmes(data);
        saveToSession(data);
      } else {
        setFilmes([]);
      }
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar filmes');
    }
  }, [saveToSession]);

  const prefetchFilmes = useCallback(async () => {
    // Não bloquear UI; apenas garante que teremos cache quente
    try {
      const ts = Number(sessionStorage.getItem(SESSION_TS_KEY) || 0);
      const isStale = Date.now() - ts > STALE_MS;
      if (!hasLoadedRef.current || isStale) {
        const data = await filmeStorage.obterFilmes();
        if (Array.isArray(data)) {
          setFilmes(data);
          saveToSession(data);
        }
      }
    } catch {}
  }, [saveToSession]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadFilmes();
    setIsLoading(false);
  }, [loadFilmes]);

  // Montagem: hidratar instantaneamente e revalidar em background
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const had = hydrateFromSession();
    setIsLoading(!had); // se tem cache, não mostrar loading

    // Revalidação em background
    loadFilmes().finally(() => {
      setIsLoading(false);
    });
  }, [hydrateFromSession, loadFilmes]);

  const value = useMemo(() => ({ filmes, isLoading, error, prefetchFilmes, refresh }), [filmes, isLoading, error, prefetchFilmes, refresh]);

  return (
    <FilmesContext.Provider value={value}>
      {children}
    </FilmesContext.Provider>
  );
}

export function useFilmes() {
  const ctx = useContext(FilmesContext);
  if (!ctx) throw new Error('useFilmes deve ser usado dentro de FilmesProvider');
  return ctx;
}
