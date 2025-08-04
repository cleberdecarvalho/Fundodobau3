import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  nome: string;
  email: string;
  avatar?: string;
  tipo: 'admin' | 'usuario';
  filmesAssistidos: string[];
  filmesParaAssistir: string[];
  avaliacoes: Record<string, 'gostei' | 'gostei-muito' | 'nao-gostei'>;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  register: (nome: string, email: string, senha: string) => Promise<boolean>;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuários mock para demonstração
const USERS_MOCK = [
  {
    id: '1',
    nome: 'Administrador',
    email: 'admin@fundodobau.com.br',
    senha: 'admin123',
    avatar: '',
    tipo: 'admin' as const,
    filmesAssistidos: [],
    filmesParaAssistir: [],
    avaliacoes: {}
  },
  {
    id: '2',
    nome: 'João Cinéfilo',
    email: 'joao@email.com',
    senha: '123456',
    avatar: '',
    tipo: 'usuario' as const,
    filmesAssistidos: ['b3c9e480-26bf-4cc2-b7f6-e64d8870f7b6'],
    filmesParaAssistir: ['d5e9g602-48ch-6ee4-d9h8-g86f0092h9d8'],
    avaliacoes: {
      'b3c9e480-26bf-4cc2-b7f6-e64d8870f7b6': 'gostei-muito'
    }
  }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há usuário logado no localStorage
    const savedUser = localStorage.getItem('fundodobau_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('fundodobau_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, senha: string): Promise<boolean> => {
    try {
      // Simular chamada de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const foundUser = USERS_MOCK.find(u => u.email === email && u.senha === senha);
      if (foundUser) {
        const { senha: _, ...userWithoutPassword } = foundUser;
        const userData = userWithoutPassword as User;
        
        setUser(userData);
        localStorage.setItem('fundodobau_user', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const register = async (nome: string, email: string, senha: string): Promise<boolean> => {
    try {
      // Verificar se email já existe
      const emailExists = USERS_MOCK.some(u => u.email === email);
      if (emailExists) {
        return false;
      }

      // Simular criação do usuário
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser: User = {
        id: Date.now().toString(),
        nome,
        email,
        tipo: 'usuario',
        filmesAssistidos: [],
        filmesParaAssistir: [],
        avaliacoes: {}
      };

      // Em um app real, salvaria no backend
      USERS_MOCK.push({ ...newUser, senha } as any);
      
      setUser(newUser);
      localStorage.setItem('fundodobau_user', JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error('Erro no registro:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fundodobau_user');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('fundodobau_user', JSON.stringify(updatedUser));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vintage-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-vintage-gold mx-auto mb-4"></div>
          <p className="text-vintage-cream font-vintage-body text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        updateUser,
        isAuthenticated: !!user,
        isAdmin: user?.tipo === 'admin'
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
