import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, logoutUser, checkAuthStatus, updateUserProfile, User } from '../utils/authStorage';

interface AuthContextType {
  user: User | null;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  register: (nome: string, email: string, senha: string) => Promise<boolean>;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Começar com loading para verificar sessão

  // Verificar se o usuário já está logado ao carregar a aplicação
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await checkAuthStatus();
        setUser(currentUser);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, senha: string): Promise<boolean> => {
    try {
      setLoading(true);
      const result = await loginUser(email, senha);
      
      if (result.success && result.user) {
        setUser(result.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (nome: string, email: string, senha: string): Promise<boolean> => {
    try {
      setLoading(true);
      const result = await registerUser(nome, email, senha);
      
      if (result.success && result.user) {
        setUser(result.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro no registro:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await logoutUser();
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      try {
        const success = await updateUserProfile(updates);
        if (success) {
          const updatedUser = { ...user, ...updates };
          setUser(updatedUser);
        }
      } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        updateUser,
        isAuthenticated: !!user,
        isAdmin: user?.tipo === 'admin',
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
