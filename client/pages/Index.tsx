import { useState, useEffect } from 'react';
import { HeroCarousel } from '../components/HeroCarousel';
import { FilmSlider } from '../components/FilmSlider';
// Removido import de dados mockados
import { useFilmes } from '../context/FilmesContext';
import { Filme } from '@shared/types';

export default function Index() {
  const { filmes } = useFilmes();
  const [filmesPorCategoria, setFilmesPorCategoria] = useState<Record<string, Filme[]>>({});
  const [sliders, setSliders] = useState<any[]>([]);

  useEffect(() => {
    // Organizar filmes por categoria
    const categorias = {
      'Drama': filmes.filter(f => f.categoria.includes('Drama')),
      'Romance': filmes.filter(f => f.categoria.includes('Romance')),
      'Crime': filmes.filter(f => f.categoria.includes('Crime')),
      'Suspense': filmes.filter(f => f.categoria.includes('Suspense')),
      'Comédia': filmes.filter(f => f.categoria.includes('Comédia')),
      'Musical': filmes.filter(f => f.categoria.includes('Musical')),
    };
    setFilmesPorCategoria(categorias);
  }, [filmes]);

  // Carregar sliders configurados
  useEffect(() => {
    const carregarSliders = async () => {
      try {
        const response = await fetch('http://localhost:8084/api/sliders');
        if (response.ok) {
          const data = await response.json();
          setSliders(data.sliders);
        }
      } catch (error) {
        console.error('Erro ao carregar sliders:', error);
      }
    };
    carregarSliders();
  }, []);

  const filmesDestaque = filmes.slice(0, 3);

  // Função para filtrar filmes baseado no tipo de slider
  const getFilmesDoSlider = (slider: any) => {
    switch (slider.tipo) {
      case 'categoria':
        return filmes.filter(f => f.categoria.includes(slider.filtro));
      case 'decada':
        const decada = slider.filtro;
        return filmes.filter(f => f.ano && f.ano.toString().startsWith(decada.slice(0, 3)));
      case 'personalizado':
        return filmes.filter(f => slider.filmesIds.includes(f.GUID));
      default:
        return [];
    }
  };

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

      {/* Sliders Configurados */}
      <div className="space-y-8 py-6">
        {sliders.map((slider) => {
          const filmesDoSlider = getFilmesDoSlider(slider);
          if (filmesDoSlider.length === 0) return null;
          
          return (
            <FilmSlider
              key={slider.id}
              titulo={slider.titulo}
              filmes={filmesDoSlider}
            />
          );
        })}
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
