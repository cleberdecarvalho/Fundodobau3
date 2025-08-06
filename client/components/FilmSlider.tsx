import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Calendar, Clock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Filme } from '@shared/types';

interface FilmSliderProps {
  titulo: string;
  filmes: Filme[];
}

export function FilmSlider({ titulo, filmes }: FilmSliderProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;

    const cardWidth = 280; // largura do card + gap
    const scrollAmount = cardWidth * 3; // rola 3 cards por vez

    let newPosition = scrollPosition;
    if (direction === 'left') {
      newPosition = Math.max(0, scrollPosition - scrollAmount);
    } else {
      const maxScroll = sliderRef.current.scrollWidth - sliderRef.current.clientWidth;
      newPosition = Math.min(maxScroll, scrollPosition + scrollAmount);
    }

    sliderRef.current.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
    setScrollPosition(newPosition);
  };

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = sliderRef.current 
    ? scrollPosition < sliderRef.current.scrollWidth - sliderRef.current.clientWidth 
    : true;

  if (!filmes.length) return null;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        {/* Título da Seção */}
        <div className="flex items-center justify-between mb-6">
                      <h2 className="text-3xl font-bold text-vintage-gold">
            {titulo}
          </h2>
          
          {/* Navigation Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`p-2 rounded-full transition-all duration-300 ${
                canScrollLeft
                  ? 'bg-vintage-gold/20 hover:bg-vintage-gold text-vintage-cream hover:text-vintage-black'
                  : 'bg-vintage-black/20 text-vintage-cream/30 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`p-2 rounded-full transition-all duration-300 ${
                canScrollRight
                  ? 'bg-vintage-gold/20 hover:bg-vintage-gold text-vintage-cream hover:text-vintage-black'
                  : 'bg-vintage-black/20 text-vintage-cream/30 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Films Slider */}
        <div className="relative">
          <div
            ref={sliderRef}
            className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filmes.map((filme) => (
              <FilmCard key={filme.GUID} filme={filme} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

interface FilmCardProps {
  filme: Filme;
}

function FilmCard({ filme }: FilmCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="flex-shrink-0 w-64 group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={filme.GUID ? `/filme/${filme.GUID}` : '#'}>
        <div className="film-card relative">
          {/* Imagem do Filme */}
          <div className="relative overflow-hidden">
            <img
              src={filme.imagemUrl}
              alt={filme.nomePortugues}
              className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-110"
            />
            
            {/* Overlay com botão play */}
            <div className={`absolute inset-0 bg-vintage-black/60 flex items-center justify-center transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              <div className="bg-vintage-gold rounded-full p-4 transform transition-transform duration-300 hover:scale-110">
                <Play className="h-8 w-8 text-vintage-black" />
              </div>
            </div>

            {/* Rating Badge */}
            {filme.avaliacoes && (
              <div className="absolute top-3 right-3 bg-vintage-black/80 backdrop-blur-sm rounded-lg px-2 py-1">
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 text-vintage-gold fill-current" />
                  <span className="text-xs text-vintage-cream font-vintage-body">
                    {Math.round(
                      (filme.avaliacoes.gosteiMuito * 5 + filme.avaliacoes.gostei * 3) /
                      (filme.avaliacoes.gostei + filme.avaliacoes.gosteiMuito + filme.avaliacoes.naoGostei) * 100
                    ) / 100}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Informações do Filme */}
          <div className="p-4">
            <h3 className="font-vintage-serif font-semibold text-lg text-vintage-cream mb-2 line-clamp-1 group-hover:text-vintage-gold transition-colors">
              {filme.nomePortugues}
            </h3>
            
            <p className="text-sm text-vintage-cream/70 font-vintage-body italic mb-3 line-clamp-1">
              "{filme.nomeOriginal}"
            </p>

            {/* Meta Info */}
            <div className="flex items-center justify-between text-xs text-vintage-cream/60 mb-3">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span className="font-vintage-body">{filme.ano}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span className="font-vintage-body">{filme.duracao}</span>
              </div>
            </div>

            {/* Categorias */}
            <div className="flex flex-wrap gap-1 mb-3">
                          {filme.categoria.slice(0, 2).map((cat, index) => (
              <span
                key={`${filme.GUID}-cat-${index}`}
                className="text-xs bg-vintage-gold/20 text-vintage-gold px-2 py-1 rounded font-vintage-body"
              >
                {cat}
              </span>
            ))}
              {filme.categoria.length > 2 && (
                <span className="text-xs text-vintage-cream/50 font-vintage-body">
                  +{filme.categoria.length - 2}
                </span>
              )}
            </div>

            {/* Sinopse Preview */}
            <p className="text-sm text-vintage-cream/80 font-vintage-body line-clamp-2 leading-relaxed">
              {filme.sinopse}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
