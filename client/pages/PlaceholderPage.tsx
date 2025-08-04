import { Construction, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-vintage-gold/10 rounded-full flex items-center justify-center mb-6">
            <Construction className="w-12 h-12 text-vintage-gold" />
          </div>
          <h1 className="text-4xl font-vintage-serif font-bold text-vintage-gold mb-4">
            {title}
          </h1>
          <p className="text-vintage-cream/80 font-vintage-body text-lg leading-relaxed">
            {description || `A página ${title} está sendo desenvolvida. Em breve você poderá acessar todo o conteúdo desta seção.`}
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-vintage-cream/60 font-vintage-body">
            Continue explorando nosso catálogo de filmes clássicos enquanto trabalhamos nesta página.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button className="btn-vintage">
                Voltar ao Início
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/filmes">
              <Button 
                variant="outline" 
                className="bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold hover:text-vintage-black transition-all duration-300"
              >
                Ver Filmes
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-12 p-6 bg-vintage-black/30 border border-vintage-gold/20 rounded-lg">
          <p className="text-vintage-cream/70 font-vintage-body text-sm">
            <strong className="text-vintage-gold">Dica:</strong> Continue explorando para descobrir novos filmes clássicos ou use o menu de navegação para acessar outras seções já disponíveis.
          </p>
        </div>
      </div>
    </div>
  );
}
