import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface UserPreferences {
  filmesAssistidos: string[];
  filmesParaAssistir: string[];
  avaliacoes: Record<string, 'gostei' | 'gostei-muito' | 'nao-gostei'>;
}

export function useFavorites() {
  const { user, updateUser, isAuthenticated } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({
    filmesAssistidos: [],
    filmesParaAssistir: [],
    avaliacoes: {}
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      setPreferences({
        filmesAssistidos: user.filmesAssistidos || [],
        filmesParaAssistir: user.filmesParaAssistir || [],
        avaliacoes: user.avaliacoes || {}
      });
    } else {
      // Para usuários não logados, usar localStorage
      const savedPrefs = localStorage.getItem('fundodobau_preferences');
      if (savedPrefs) {
        try {
          setPreferences(JSON.parse(savedPrefs));
        } catch (error) {
          console.error('Erro ao carregar preferências:', error);
        }
      }
    }
  }, [user, isAuthenticated]);

  const savePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    
    if (isAuthenticated && user) {
      // Usuário logado: salvar no contexto do usuário
      updateUser(newPrefs);
    } else {
      // Usuário não logado: salvar no localStorage
      localStorage.setItem('fundodobau_preferences', JSON.stringify(newPrefs));
    }
  };

  const toggleAssistido = (filmeId: string) => {
    const newFilmesAssistidos = preferences.filmesAssistidos.includes(filmeId)
      ? preferences.filmesAssistidos.filter(id => id !== filmeId)
      : [...preferences.filmesAssistidos, filmeId];

    savePreferences({
      ...preferences,
      filmesAssistidos: newFilmesAssistidos
    });
  };

  const toggleParaAssistir = (filmeId: string) => {
    const newFilmesParaAssistir = preferences.filmesParaAssistir.includes(filmeId)
      ? preferences.filmesParaAssistir.filter(id => id !== filmeId)
      : [...preferences.filmesParaAssistir, filmeId];

    savePreferences({
      ...preferences,
      filmesParaAssistir: newFilmesParaAssistir
    });
  };

  const setAvaliacao = (filmeId: string, avaliacao: 'gostei' | 'gostei-muito' | 'nao-gostei' | null) => {
    const newAvaliacoes = { ...preferences.avaliacoes };
    
    if (avaliacao === null) {
      delete newAvaliacoes[filmeId];
    } else {
      newAvaliacoes[filmeId] = avaliacao;
    }

    savePreferences({
      ...preferences,
      avaliacoes: newAvaliacoes
    });
  };

  const jaAssistiu = (filmeId: string) => preferences.filmesAssistidos.includes(filmeId);
  const queroAssistir = (filmeId: string) => preferences.filmesParaAssistir.includes(filmeId);
  const getAvaliacao = (filmeId: string) => preferences.avaliacoes[filmeId] || null;

  return {
    preferences,
    toggleAssistido,
    toggleParaAssistir,
    setAvaliacao,
    jaAssistiu,
    queroAssistir,
    getAvaliacao
  };
}
