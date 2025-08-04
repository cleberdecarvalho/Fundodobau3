import { Link } from 'react-router-dom';
import { Film, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="mb-8">
          <div className="mx-auto w-32 h-32 bg-vintage-gold/10 rounded-full flex items-center justify-center mb-6">
            <Film className="w-16 h-16 text-vintage-gold" />
          </div>
          <h1 className="text-6xl font-vintage-serif font-bold text-vintage-gold mb-4 vintage-glow">
            404
          </h1>
          <h2 className="text-3xl font-vintage-serif font-bold text-vintage-cream mb-4">
            Filme Não Encontrado
          </h2>
          <p className="text-vintage-cream/80 font-vintage-body text-lg leading-relaxed mb-8">
            Parece que este filme saiu de cartaz ou nunca existiu em nosso catálogo. 
            Que tal explorar nossa coleção de clássicos atemporais?
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button className="btn-vintage">
                <Home className="mr-2 h-4 w-4" />
                Voltar ao Início
              </Button>
            </Link>
            <Link to="/filmes">
              <Button 
                variant="outline" 
                className="bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold hover:text-vintage-black transition-all duration-300"
              >
                <Search className="mr-2 h-4 w-4" />
                Explorar Catálogo
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-12 p-6 bg-vintage-black/30 border border-vintage-gold/20 rounded-lg">
          <p className="text-vintage-cream/70 font-vintage-body text-sm">
            <strong className="text-vintage-gold">Sugestão:</strong> Use nossa busca avançada para encontrar filmes por década, gênero ou ator principal. Temos centenas de clássicos esperando por você!
          </p>
        </div>
      </div>
    </div>
  );
}
