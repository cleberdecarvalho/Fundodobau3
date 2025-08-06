import { useState, useEffect } from 'react';
import { HeroCarousel } from '../components/HeroCarousel';
import { FilmSlider } from '../components/FilmSlider';
// Removido import de dados mockados
import { filmeStorage } from '../utils/filmeStorage';
import { Filme } from '@shared/types';

export default function Index() {
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [filmesPorCategoria, setFilmesPorCategoria] = useState<Record<string, Filme[]>>({});

  useEffect(() => {
    const carregarFilmes = async () => {
      try {
        const todosFilmes = await filmeStorage.obterFilmes();
        console.log('Filmes carregados:', todosFilmes);
        setFilmes(todosFilmes);

        // Organizar filmes por categoria
        const categorias = {
          'Drama': todosFilmes.filter(f => f.categoria.includes('Drama')),
          'Romance': todosFilmes.filter(f => f.categoria.includes('Romance')),
          'Crime': todosFilmes.filter(f => f.categoria.includes('Crime')),
          'Suspense': todosFilmes.filter(f => f.categoria.includes('Suspense')),
          'Comédia': todosFilmes.filter(f => f.categoria.includes('Comédia')),
          'Musical': todosFilmes.filter(f => f.categoria.includes('Musical')),
        };
        setFilmesPorCategoria(categorias);
      } catch (error) {
        console.error('Erro ao carregar filmes:', error);
        // Não usar dados mock - mostrar erro real
        setFilmes([]);
        setFilmesPorCategoria({});
        console.error('❌ ERRO: Não foi possível carregar filmes do MySQL da Hostgator');
        console.error('❌ Detalhes do erro:', error);
      }
    };

    carregarFilmes();
  }, []);

  const filmesDestaque = filmes.slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Hero Carousel */}
      <HeroCarousel filmes={filmesDestaque} />

      {/* Introdução da plataforma */}
      <section className="py-16 bg-gradient-to-b from-vintage-black to-vintage-sepia/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-vintage-gold mb-6">
            Bem-vindo aos Anos Dourados
          </h2>
          <p className="text-xl text-vintage-cream/90 font-vintage-body max-w-3xl mx-auto leading-relaxed">
            Reviva a magia do cinema clássico com nossa coleção exclusiva de filmes atemporais. 
            De Cary Grant a James Cagney, de comédias mudas a dramas épicos, 
            cada filme é uma jornada pela história da sétima arte.
          </p>
        </div>
      </section>

      {/* Sliders de Filmes por Categoria */}
      <div className="space-y-8 py-6">
        {filmesPorCategoria.Drama && filmesPorCategoria.Drama.length > 0 && (
          <FilmSlider
            titulo="Filmes de Drama"
            filmes={filmesPorCategoria.Drama}
          />
        )}

        {filmesPorCategoria.Romance && filmesPorCategoria.Romance.length > 0 && (
          <FilmSlider
            titulo="Filmes de Romance"
            filmes={filmesPorCategoria.Romance}
          />
        )}

        {filmesPorCategoria.Crime && filmesPorCategoria.Crime.length > 0 && (
          <FilmSlider
            titulo="Filmes de Crime"
            filmes={filmesPorCategoria.Crime}
          />
        )}

        {filmesPorCategoria.Suspense && filmesPorCategoria.Suspense.length > 0 && (
          <FilmSlider
            titulo="Filmes de Suspense"
            filmes={filmesPorCategoria.Suspense}
          />
        )}

        {filmesPorCategoria.Comédia && filmesPorCategoria.Comédia.length > 0 && (
          <FilmSlider
            titulo="Comédias Clássicas"
            filmes={filmesPorCategoria.Comédia}
          />
        )}

        {filmesPorCategoria.Musical && filmesPorCategoria.Musical.length > 0 && (
          <FilmSlider
            titulo="Musicais"
            filmes={filmesPorCategoria.Musical}
          />
        )}
      </div>

      {/* Call to Action */}
      <section className="py-16 bg-vintage-sepia/10">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-vintage-serif font-bold text-vintage-gold mb-4">
            Explore Nossa Coleção Completa
          </h3>
          <p className="text-lg text-vintage-cream/80 font-vintage-body mb-8 max-w-2xl mx-auto">
            Descubra centenas de clássicos organizados por década, gênero e diretor. 
            Cada filme é uma obra-prima cuidadosamente preservada para sua experiência.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/filmes" className="btn-vintage inline-flex items-center px-8 py-4 text-lg">
              Ver Todos os Filmes
            </a>
            <a 
              href="/categorias" 
              className="bg-transparent border-2 border-vintage-gold/50 text-vintage-cream hover:bg-vintage-gold hover:text-vintage-black transition-all duration-300 inline-flex items-center px-8 py-4 text-lg rounded-lg font-semibold font-vintage-serif"
            >
              Explorar por Categoria
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
