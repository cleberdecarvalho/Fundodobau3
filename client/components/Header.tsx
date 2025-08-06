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
    <header className="bg-vintage-black/90 backdrop-blur-md border-b border-vintage-gold/10 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-4 group">
            <div className="p-3 bg-gradient-to-br from-vintage-gold to-yellow-600 rounded-xl group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-vintage-gold/25">
              <Film className="h-7 w-7 text-vintage-black" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-vintage-gold to-yellow-400 bg-clip-text text-transparent font-cinema-title">
                Fundo Do Baú
              </h1>
              <span className="text-sm text-vintage-cream/80 font-cinema-body -mt-1 tracking-wide">
                Cinema dos Anos Dourados
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className="relative text-vintage-cream hover:text-vintage-gold transition-all duration-300 font-cinema-accent text-lg px-4 py-2 rounded-lg hover:bg-vintage-gold/10 group"
            >
              Início
              <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-vintage-gold to-yellow-400 group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
            </Link>
            <Link 
              to="/filmes" 
              className="relative text-vintage-cream hover:text-vintage-gold transition-all duration-300 font-cinema-accent text-lg px-4 py-2 rounded-lg hover:bg-vintage-gold/10 group"
            >
              Filmes
              <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-vintage-gold to-yellow-400 group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
            </Link>
          </nav>

          {/* Search and User Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden sm:block">
              <SearchBox className="w-72" />
            </div>

            {/* User Menu */}
            {isAuthenticated ? (
              <div ref={userMenuRef} className="relative hidden sm:block">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 bg-gradient-to-r from-vintage-gold/10 to-yellow-400/10 border border-vintage-gold/30 rounded-xl px-4 py-2.5 text-vintage-cream hover:bg-gradient-to-r hover:from-vintage-gold/20 hover:to-yellow-400/20 transition-all duration-300 shadow-lg hover:shadow-vintage-gold/25"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-vintage-gold to-yellow-600 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-sm font-vintage-serif font-bold text-vintage-black">
                      {user?.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-cinema-accent">{user?.nome.split(' ')[0]}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-14 w-72 bg-vintage-black/95 backdrop-blur-md border border-vintage-gold/20 rounded-xl p-4 z-50 shadow-2xl">
                    <div className="border-b border-vintage-gold/20 pb-4 mb-4">
                      <p className="font-vintage-serif font-semibold text-vintage-gold text-lg">{user?.nome}</p>
                      <p className="text-sm text-vintage-cream/70 font-vintage-body mt-1">{user?.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-2 text-xs bg-gradient-to-r from-vintage-gold/20 to-yellow-400/20 text-vintage-gold px-3 py-1.5 rounded-full font-vintage-body font-semibold border border-vintage-gold/30">
                          Administrador
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Link
                        to="/perfil"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-3 w-full text-left px-4 py-3 text-vintage-cream hover:bg-gradient-to-r hover:from-vintage-gold/10 hover:to-yellow-400/10 rounded-lg transition-all duration-200 font-cinema-body group"
                      >
                        <User className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                        <span>Meu Perfil</span>
                      </Link>

                      <Link
                        to="/favoritos"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-3 w-full text-left px-4 py-3 text-vintage-cream hover:bg-gradient-to-r hover:from-vintage-gold/10 hover:to-yellow-400/10 rounded-lg transition-all duration-200 font-cinema-body group"
                      >
                        <Heart className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                        <span>Meus Favoritos</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-3 w-full text-left px-4 py-3 text-vintage-cream hover:bg-gradient-to-r hover:from-vintage-gold/10 hover:to-yellow-400/10 rounded-lg transition-all duration-200 font-cinema-body group"
                        >
                          <Settings className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                          <span>Painel Admin</span>
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                          navigate('/');
                        }}
                        className="flex items-center space-x-3 w-full text-left px-4 py-3 text-vintage-cream hover:bg-gradient-to-r hover:from-red-500/20 hover:to-red-600/20 rounded-lg transition-all duration-200 font-cinema-body group"
                      >
                        <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
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
