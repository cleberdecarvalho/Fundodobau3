import { useState, useRef } from 'react';
import { getImageSrc } from '@/utils/images';
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

    // Medir dinamicamente a largura real do card + gap (space-x-3 ~ 12px)
    const firstChild = sliderRef.current.children[0] as HTMLElement | undefined;
    const cardWidth = firstChild?.clientWidth || 224;
    const gapPx = firstChild ? parseFloat(getComputedStyle(firstChild).marginLeft || '12') : 12;
    const scrollAmount = (cardWidth + gapPx) * 4; // rola 4 cards por vez

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
    <section className="py-6">
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
            className="flex space-x-3 overflow-x-auto scrollbar-hide pb-4"
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
    <div className="flex-shrink-0 w-fit cursor-pointer">
      <Link to={filme.GUID ? `/filme/${filme.GUID}` : '#'}>
        <div className="film-card relative rounded-lg overflow-visible">
          {/* Imagem do Filme (hover só na imagem, sem cortar) */}
          <div
            className="relative inline-flex items-center justify-center group rounded-lg overflow-hidden border border-vintage-gold/20"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <img
              src={getImageSrc(filme.imagemUrl)}
              alt={filme.nomePortugues}
              className="h-60 w-auto object-contain block"
              loading="lazy"
            />
            
            {/* Overlay com Play */}
            <div className={`absolute inset-0 flex items-center justify-center bg-vintage-black/60 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              <Play className="h-10 w-10 text-vintage-gold" />
            </div>

          </div>

          {/* Meta e Categorias (fora da moldura) */}
          <div className="w-full px-2 pt-1 pb-0">
            {/* Título Principal */}
            <h3 className="font-semibold text-lg text-vintage-cream mb-0.5 leading-tight line-clamp-1 transition-colors">
              {filme.nomePortugues}
            </h3>
            
            {/* Título Original removido por solicitação */}
          
          {filme.categoria?.length ? (
            <div className="flex items-center gap-1 min-w-0 mb-0.5">
              {filme.categoria.slice(0, 3).map((cat, index) => (
                <span
                  key={`${filme.GUID}-cat-${index}`}
                  className="text-xs bg-vintage-gold/20 text-vintage-gold px-2 py-1 rounded whitespace-nowrap"
                >
                  {cat}
                </span>
              ))}
              {filme.categoria.length > 3 && (
                <span className="text-xs text-vintage-cream/50 whitespace-nowrap">
                  +{filme.categoria.length - 3}
                </span>
              )}
            </div>
          ) : null}
          <div className="flex items-center text-xs text-vintage-cream/60 gap-2 overflow-hidden leading-none">
            <div className="flex items-center gap-1 whitespace-nowrap">
              <Calendar className="h-3 w-3" />
              <span>{filme.ano}</span>
            </div>
            <span className="opacity-50">•</span>
            <div className="flex items-center gap-1 whitespace-nowrap">
              <Clock className="h-3 w-3" />
              <span>{filme.duracao}</span>
            </div>
          </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
