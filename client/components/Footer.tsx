import { Link } from 'react-router-dom';
import { Film, Heart, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-vintage-black border-t border-vintage-gold/20 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e Descrição */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-vintage-gold rounded-lg">
                <Film className="h-6 w-6 text-vintage-black" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-bold text-vintage-gold">
                  Fundo Do Baú
                </h3>
                <span className="text-xs text-vintage-cream/70 font-vintage-body -mt-1">
                  Cinema dos Anos Dourados
                </span>
              </div>
            </div>
            <p className="text-vintage-cream/80 font-vintage-body leading-relaxed mb-4">
              Reviva a magia do cinema clássico com nossa coleção exclusiva de filmes dos anos 20 aos 80. 
              Uma viagem nostálgica pelos grandes momentos da sétima arte.
            </p>
            <div className="flex items-center text-vintage-cream/60 font-vintage-body">
              <Heart className="h-4 w-4 mr-2 text-vintage-gold" />
              Feito com paixão pelos clássicos do cinema
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h4 className="font-vintage-serif font-semibold text-vintage-gold mb-4">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-vintage-cream/80 hover:text-vintage-gold transition-colors font-vintage-body">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/filmes" className="text-vintage-cream/80 hover:text-vintage-gold transition-colors font-vintage-body">
                  Filmes
                </Link>
              </li>
              <li>
                <Link to="/categorias" className="text-vintage-cream/80 hover:text-vintage-gold transition-colors font-vintage-body">
                  Categorias
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="text-vintage-cream/80 hover:text-vintage-gold transition-colors font-vintage-body">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link to="/contato" className="text-vintage-cream/80 hover:text-vintage-gold transition-colors font-vintage-body">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-vintage-serif font-semibold text-vintage-gold mb-4">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-center text-vintage-cream/80 font-vintage-body">
                <Mail className="h-4 w-4 mr-3 text-vintage-gold" />
                contato@fundodobau.com.br
              </li>
              <li className="flex items-center text-vintage-cream/80 font-vintage-body">
                <Phone className="h-4 w-4 mr-3 text-vintage-gold" />
                (11) 9999-9999
              </li>
              <li className="flex items-center text-vintage-cream/80 font-vintage-body">
                <MapPin className="h-4 w-4 mr-3 text-vintage-gold" />
                São Paulo, Brasil
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-vintage-gold/20 mt-8 pt-8 text-center">
          <p className="text-vintage-cream/60 font-vintage-body">
            © 2024 Fundo Do Baú. Todos os direitos reservados. | 
            <span className="text-vintage-gold"> Uma jornada pelos clássicos do cinema</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
