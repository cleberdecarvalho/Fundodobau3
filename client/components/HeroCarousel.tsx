import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Calendar, Clock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Filme } from '@shared/types';

interface CarrosselItem {
  posicao: number;
  filmeId: string | null;
  imagemUrl: string | null;
  ativo: boolean;
}

interface HeroCarouselProps {
  filmes: Filme[];
}

export function HeroCarousel({ filmes }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carrosselData, setCarrosselData] = useState<CarrosselItem[]>([]);
  const [carrosselFilmes, setCarrosselFilmes] = useState<Filme[]>([]);

  // Carregar dados do carrossel
  useEffect(() => {
    async function fetchCarrossel() {
      try {
        const response = await fetch('http://localhost:8084/api/carrossel');
        if (response.ok) {
          const data = await response.json();
          const carrosselAtivo = data.carrossel.filter((item: CarrosselItem) => item.ativo && item.filmeId && item.imagemUrl);
          setCarrosselData(carrosselAtivo);
          
          // Buscar filmes correspondentes
          const filmesCarrossel = carrosselAtivo.map((item: CarrosselItem) => {
            const filme = filmes.find(f => f.GUID === item.filmeId);
            return filme ? { ...filme, imagemUrl: item.imagemUrl } : null;
          }).filter(Boolean) as Filme[];
          
          setCarrosselFilmes(filmesCarrossel);
        }
      } catch (error) {
        console.error('Erro ao carregar carrossel:', error);
      }
    }
    fetchCarrossel();
  }, [filmes]);

  // Auto-play do carousel
  useEffect(() => {
    if (carrosselFilmes.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carrosselFilmes.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [carrosselFilmes.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carrosselFilmes.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carrosselFilmes.length) % carrosselFilmes.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Se não há filmes no carrossel, usar filmes normais como fallback
  const filmesParaExibir = carrosselFilmes.length > 0 ? carrosselFilmes : filmes;
  
  if (!filmesParaExibir.length) return null;

  const filmeAtual = filmesParaExibir[currentSlide];

  return (
    <section className="relative h-[70vh] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={filmeAtual.imagemUrl} 
          alt={filmeAtual.nomePortugues}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-vintage-black/90 via-vintage-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-vintage-black/80 via-transparent to-vintage-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl">
          {/* Título */}
                          <h1 className="text-5xl md:text-6xl font-bold text-vintage-cream mb-4">
            {filmeAtual.nomePortugues}
          </h1>
          
          {/* Título Original */}
          <p className="text-xl md:text-2xl font-vintage-body text-vintage-gold mb-4 italic">
            "{filmeAtual.nomeOriginal}"
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-6 mb-6 text-vintage-cream/80">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-vintage-gold" />
              <span className="font-vintage-body">{filmeAtual.ano}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-vintage-gold" />
              <span className="font-vintage-body">{filmeAtual.duracao}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-vintage-gold" />
              <span className="font-vintage-body">{filmeAtual.categoria.join(', ')}</span>
            </div>
          </div>

          {/* Sinopse */}
          <p className="text-lg font-vintage-body text-vintage-cream/90 mb-8 leading-relaxed line-clamp-3">
            {filmeAtual.sinopse}
          </p>

          {/* Ações */}
          <div className="flex flex-wrap gap-4">
            <Link to={`/filme/${filmeAtual.GUID}`}>
              <Button className="btn-vintage text-lg px-8 py-4">
                <Play className="h-5 w-5 mr-2" />
                Assistir Agora
              </Button>
            </Link>
            <Link to={`/filme/${filmeAtual.GUID}`}>
              <Button 
                variant="outline"
                className="bg-transparent border-vintage-gold/50 text-vintage-cream hover:bg-vintage-gold hover:text-vintage-black transition-all duration-300 text-lg px-8 py-4"
              >
                Mais Detalhes
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-vintage-black/50 hover:bg-vintage-gold/80 text-vintage-cream hover:text-vintage-black p-3 rounded-full transition-all duration-300"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-vintage-black/50 hover:bg-vintage-gold/80 text-vintage-cream hover:text-vintage-black p-3 rounded-full transition-all duration-300"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-3">
        {filmesParaExibir.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentSlide === index
                ? 'bg-vintage-gold'
                : 'bg-vintage-cream/40 hover:bg-vintage-cream/70'
            }`}
          />
        ))}
      </div>

      {/* Film Number Indicator */}
      <div className="absolute top-8 right-8 z-20 bg-vintage-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
        <span className="text-vintage-cream font-vintage-body">
          {currentSlide + 1} / {filmesParaExibir.length}
        </span>
      </div>
    </section>
  );
}
