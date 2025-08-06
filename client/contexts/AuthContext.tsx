import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: number;
  nome: string;
  email: string;
  avatar?: string;
  tipo: 'admin' | 'usuario';
}

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

// Dados mock temporários para desenvolvimento
const MOCK_USERS = [
  {
    id: 1,
    nome: 'Administrador',
    email: 'admin@fundodobau.com.br',
    tipo: 'admin' as const,
  },
  {
    id: 2,
    nome: 'João Cinéfilo',
    email: 'joao@email.com',
    tipo: 'usuario' as const,
  }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (email: string, senha: string): Promise<boolean> => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock de autenticação
      const mockUser = MOCK_USERS.find(u => u.email === email);
      if (mockUser && (email === 'admin@fundodobau.com.br' && senha === 'admin123' || 
                       email === 'joao@email.com' && senha === '123456')) {
        setUser(mockUser);
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar se email já existe
      const emailExists = MOCK_USERS.some(u => u.email === email);
      if (emailExists) {
        return false;
      }

      // Criar novo usuário
      const newUser: User = {
        id: Date.now(),
        nome,
        email,
        tipo: 'usuario'
      };

      setUser(newUser);
      return true;
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
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
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
