import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Film, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const success = await login(formData.email, formData.senha);
        if (success) {
          navigate(from, { replace: true });
        } else {
          setError('Email ou senha incorretos');
        }
      } else {
        if (formData.senha !== formData.confirmarSenha) {
          setError('Senhas não coincidem');
          setLoading(false);
          return;
        }
        
        const success = await register(formData.nome, formData.email, formData.senha);
        if (success) {
          navigate(from, { replace: true });
        } else {
          setError('Email já cadastrado ou erro no registro');
        }
      }
    } catch (error) {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="p-3 bg-vintage-gold rounded-lg">
              <Film className="h-8 w-8 text-vintage-black" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-vintage-gold">
                Fundo Do Baú
              </h1>
              <span className="text-sm text-vintage-cream/70 font-vintage-body -mt-1">
                Cinema dos Anos Dourados
              </span>
            </div>
          </div>
          
          <h2 className="text-3xl font-vintage-serif font-bold text-vintage-cream mb-2">
            {isLogin ? 'Bem-vindo de Volta' : 'Junte-se a Nós'}
          </h2>
          <p className="text-vintage-cream/80 font-vintage-body">
            {isLogin 
              ? 'Entre em sua conta para continuar sua jornada cinematográfica'
              : 'Crie sua conta e descubra os clássicos do cinema'
            }
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-card border border-vintage-gold/20 rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vintage-gold/70 h-4 w-4" />
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    required={!isLogin}
                    className="w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-10 py-3 text-vintage-cream placeholder-vintage-cream/50 focus:border-vintage-gold focus:outline-none font-vintage-body"
                    placeholder="Digite seu nome completo"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vintage-gold/70 h-4 w-4" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-10 py-3 text-vintage-cream placeholder-vintage-cream/50 focus:border-vintage-gold focus:outline-none font-vintage-body"
                  placeholder="Digite seu email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vintage-gold/70 h-4 w-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="senha"
                  value={formData.senha}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-10 pr-12 py-3 text-vintage-cream placeholder-vintage-cream/50 focus:border-vintage-gold focus:outline-none font-vintage-body"
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-vintage-gold/70 hover:text-vintage-gold transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vintage-gold/70 h-4 w-4" />
                  <input
                    type="password"
                    name="confirmarSenha"
                    value={formData.confirmarSenha}
                    onChange={handleInputChange}
                    required={!isLogin}
                    className="w-full bg-vintage-black/50 border border-vintage-gold/30 rounded-lg px-10 py-3 text-vintage-cream placeholder-vintage-cream/50 focus:border-vintage-gold focus:outline-none font-vintage-body"
                    placeholder="Confirme sua senha"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm font-vintage-body">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-vintage text-lg py-3"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-vintage-black mr-2"></div>
                  {isLogin ? 'Entrando...' : 'Criando conta...'}
                </div>
              ) : (
                isLogin ? 'Entrar' : 'Criar Conta'
              )}
            </Button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
            <p className="text-vintage-cream/70 font-vintage-body">
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setFormData({ nome: '', email: '', senha: '', confirmarSenha: '' });
                }}
                className="ml-2 text-vintage-gold hover:text-vintage-gold-dark transition-colors font-semibold"
              >
                {isLogin ? 'Criar conta' : 'Fazer login'}
              </button>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-vintage-black/30 border border-vintage-gold/10 rounded-lg">
            <p className="text-xs text-vintage-cream/60 font-vintage-body mb-2 text-center">
              <strong className="text-vintage-gold">Credenciais de Demo:</strong>
            </p>
            <div className="text-xs text-vintage-cream/60 font-vintage-body space-y-1">
              <p><strong>Admin:</strong> admin@fundodobau.com.br / admin123</p>
              <p><strong>Usuário:</strong> joao@email.com / 123456</p>
            </div>
          </div>
        </div>

        {/* Voltar */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-vintage-cream/70 hover:text-vintage-gold transition-colors font-vintage-body"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao início
          </button>
        </div>
      </div>
    </div>
  );
}
