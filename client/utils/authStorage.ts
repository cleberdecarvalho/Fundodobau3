// Utilitário para autenticação com a API

const API_BASE_URL = 'https://www.fundodobaufilmes.com/api-filmes.php';

export interface User {
  id: number;
  nome: string;
  email: string;
  avatar?: string;
  tipo: 'admin' | 'usuario';
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface RegisterResponse {
  success: boolean;
  user?: User;
  error?: string;
}

// Função para fazer login
export const loginUser = async (email: string, senha: string): Promise<LoginResponse> => {
  try {
    console.log('🔐 Tentando login para:', email);
    console.log('🌐 URL da API:', API_BASE_URL);
    
    const requestBody = { 
      endpoint: 'auth/login',
      email, 
      senha 
    };
    console.log('📤 Dados enviados:', requestBody);
    
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📡 Status da resposta:', response.status);
    console.log('📡 Headers da resposta:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('📄 Dados recebidos:', data);

    if (response.ok && data.success) {
      console.log('✅ Login realizado com sucesso!');
      return {
        success: true,
        user: data.user
      };
    } else {
      console.log('❌ Erro no login:', data.error);
      return {
        success: false,
        error: data.error || 'Erro no login'
      };
    }
  } catch (error) {
    console.error('❌ Erro na requisição de login:', error);
    return {
      success: false,
      error: 'Erro de conexão'
    };
  }
};

// Função para registrar usuário
export const registerUser = async (nome: string, email: string, senha: string): Promise<RegisterResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        endpoint: 'auth/register',
        nome, 
        email, 
        senha 
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        success: true,
        user: data.user
      };
    } else {
      return {
        success: false,
        error: data.error || 'Erro no registro'
      };
    }
  } catch (error) {
    console.error('Erro na requisição de registro:', error);
    return {
      success: false,
      error: 'Erro de conexão'
    };
  }
};

// Função para fazer logout
export const logoutUser = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        endpoint: 'auth/logout'
      }),
    });

    const data = await response.json();
    return response.ok && data.success;
  } catch (error) {
    console.error('Erro na requisição de logout:', error);
    return false;
  }
};

// Função para verificar se o usuário está logado
export const checkAuthStatus = async (): Promise<User | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        endpoint: 'auth/me'
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.user || null;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao verificar status de autenticação:', error);
    return null;
  }
};

// Função para atualizar dados do usuário
export const updateUserProfile = async (updates: Partial<User>): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        endpoint: 'auth/profile',
        ...updates
      }),
    });

    const data = await response.json();
    return response.ok && data.success;
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return false;
  }
};
