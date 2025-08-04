import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Menu, X, Film, LogOut, Settings, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { SearchBox } from './SearchBox';
import { useAuth } from '../contexts/AuthContext';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fechar menu do usuário ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  return (
    <header className="bg-vintage-black/95 backdrop-blur-sm border-b border-vintage-gold/20 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-vintage-gold rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Film className="h-6 w-6 text-vintage-black" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-vintage-serif font-bold text-vintage-gold vintage-glow">
                Fundo Do Baú
              </h1>
              <span className="text-xs text-vintage-cream/70 font-vintage-body -mt-1">
                Cinema dos Anos Dourados
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-vintage-cream hover:text-vintage-gold transition-colors duration-300 font-vintage-body text-lg"
            >
              Início
            </Link>
            <Link 
              to="/filmes" 
              className="text-vintage-cream hover:text-vintage-gold transition-colors duration-300 font-vintage-body text-lg"
            >
              Filmes
            </Link>
            <Link 
              to="/categorias" 
              className="text-vintage-cream hover:text-vintage-gold transition-colors duration-300 font-vintage-body text-lg"
            >
              Categorias
            </Link>
            <Link 
              to="/sobre" 
              className="text-vintage-cream hover:text-vintage-gold transition-colors duration-300 font-vintage-body text-lg"
            >
              Sobre
            </Link>
          </nav>

          {/* Search and User Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden sm:block">
              <SearchBox className="w-64" />
            </div>

            {/* User Menu */}
            {isAuthenticated ? (
              <div ref={userMenuRef} className="relative hidden sm:block">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 bg-vintage-gold/10 border border-vintage-gold/30 rounded-lg px-3 py-2 text-vintage-cream hover:bg-vintage-gold/20 transition-all duration-300"
                >
                  <div className="w-8 h-8 bg-vintage-gold rounded-full flex items-center justify-center">
                    <span className="text-sm font-vintage-serif font-bold text-vintage-black">
                      {user?.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-vintage-body">{user?.nome.split(' ')[0]}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-12 w-64 bg-vintage-black/95 backdrop-blur-sm border border-vintage-gold/30 rounded-lg p-2 z-50">
                    <div className="border-b border-vintage-gold/20 pb-3 mb-3">
                      <p className="font-vintage-serif font-semibold text-vintage-gold">{user?.nome}</p>
                      <p className="text-sm text-vintage-cream/70 font-vintage-body">{user?.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 text-xs bg-vintage-gold/20 text-vintage-gold px-2 py-1 rounded font-vintage-body">
                          Administrador
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Link
                        to="/perfil"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2 w-full text-left px-3 py-2 text-vintage-cream hover:bg-vintage-gold/10 rounded-lg transition-colors font-vintage-body"
                      >
                        <User className="h-4 w-4" />
                        <span>Meu Perfil</span>
                      </Link>

                      <Link
                        to="/favoritos"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2 w-full text-left px-3 py-2 text-vintage-cream hover:bg-vintage-gold/10 rounded-lg transition-colors font-vintage-body"
                      >
                        <Heart className="h-4 w-4" />
                        <span>Meus Favoritos</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-2 w-full text-left px-3 py-2 text-vintage-cream hover:bg-vintage-gold/10 rounded-lg transition-colors font-vintage-body"
                        >
                          <Settings className="h-4 w-4" />
                          <span>Painel Admin</span>
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                          navigate('/');
                        }}
                        className="flex items-center space-x-2 w-full text-left px-3 py-2 text-vintage-cream hover:bg-red-500/20 rounded-lg transition-colors font-vintage-body"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sair</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button
                onClick={() => navigate('/auth')}
                variant="outline"
                size="sm"
                className="hidden sm:flex bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold hover:text-vintage-black transition-all duration-300"
              >
                <User className="h-4 w-4 mr-2" />
                Entrar
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-vintage-cream hover:text-vintage-gold transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-vintage-black/95 backdrop-blur-sm border-b border-vintage-gold/20 p-4">
            <div className="flex flex-col space-y-4">
              {/* Mobile Search */}
              <SearchBox className="w-full" />

              {/* Mobile Navigation */}
              <Link 
                to="/" 
                className="text-vintage-cream hover:text-vintage-gold transition-colors duration-300 font-vintage-body text-lg py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Início
              </Link>
              <Link 
                to="/filmes" 
                className="text-vintage-cream hover:text-vintage-gold transition-colors duration-300 font-vintage-body text-lg py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Filmes
              </Link>
              <Link 
                to="/categorias" 
                className="text-vintage-cream hover:text-vintage-gold transition-colors duration-300 font-vintage-body text-lg py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Categorias
              </Link>
              <Link 
                to="/sobre" 
                className="text-vintage-cream hover:text-vintage-gold transition-colors duration-300 font-vintage-body text-lg py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Sobre
              </Link>

              {/* Mobile User Actions */}
              {isAuthenticated ? (
                <div className="border-t border-vintage-gold/20 pt-4 mt-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-vintage-gold rounded-full flex items-center justify-center">
                      <span className="text-lg font-vintage-serif font-bold text-vintage-black">
                        {user?.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-vintage-serif font-semibold text-vintage-gold">{user?.nome}</p>
                      <p className="text-sm text-vintage-cream/70 font-vintage-body">{user?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Link
                      to="/perfil"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-2 text-vintage-cream hover:text-vintage-gold transition-colors font-vintage-body text-lg py-2"
                    >
                      <User className="h-4 w-4" />
                      <span>Meu Perfil</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-2 text-vintage-cream hover:text-vintage-gold transition-colors font-vintage-body text-lg py-2"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Painel Admin</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                        navigate('/');
                      }}
                      className="flex items-center space-x-2 text-vintage-cream hover:text-red-400 transition-colors font-vintage-body text-lg py-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sair</span>
                    </button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    navigate('/auth');
                    setIsMenuOpen(false);
                  }}
                  variant="outline"
                  className="bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold hover:text-vintage-black transition-all duration-300 mt-4"
                >
                  <User className="h-4 w-4 mr-2" />
                  Entrar
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
