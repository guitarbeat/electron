import React from 'react';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import Button from '@/ui/Button';

interface GenreHeaderProps {
  gradient: string;
  emoji: string;
  emojiLabel: string;
}

const GenreHeader: React.FC<GenreHeaderProps> = ({ gradient, emoji, emojiLabel }) => (
  <div
    className="h-full w-full flex items-center justify-center transition-transform duration-300 ease-in-out group-hover:scale-105"
    style={{ background: gradient, minHeight: '100%' }}
  >
    <span
      style={{ fontSize: '2.5rem', lineHeight: 1, filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.6))' }}
      role="img"
      aria-label={emojiLabel}
    >
      {emoji}
    </span>
  </div>
);

const GENRE_TILES = [
  {
    title: "Drama & Thrillers",
    description: "Edge-of-your-seat storytelling for a tense movie night.",
    className: "md:col-span-2",
    header: (
      <GenreHeader
        gradient="linear-gradient(135deg, #1a1040 0%, #3b1f6e 45%, #7c3aed 80%, #a78bfa 100%)"
        emoji="🎭"
        emojiLabel="Drama"
      />
    ),
  },
  {
    title: "Sci-Fi & Action",
    description: "Blockbusters built for the big screen.",
    className: "md:col-span-1",
    header: (
      <GenreHeader
        gradient="linear-gradient(135deg, #0c1a2e 0%, #0e3a6e 45%, #0284c7 82%, #38bdf8 100%)"
        emoji="🚀"
        emojiLabel="Sci-Fi"
      />
    ),
  },
  {
    title: "Romance & Comfort",
    description: "Feel-good picks perfect for a cozy night in.",
    className: "md:col-span-1",
    header: (
      <GenreHeader
        gradient="linear-gradient(135deg, #1f0a14 0%, #7f1d3a 40%, #be185d 75%, #fb7185 100%)"
        emoji="🌹"
        emojiLabel="Romance"
      />
    ),
  },
  {
    title: "Comedy & Classics",
    description: "Timeless laughs for any mood.",
    className: "md:col-span-2",
    header: (
      <GenreHeader
        gradient="linear-gradient(135deg, #1a1200 0%, #78350f 42%, #d97706 78%, #fbbf24 100%)"
        emoji="🍿"
        emojiLabel="Comedy"
      />
    ),
  },
];

interface MovieEmptyBentoProps {
  onAddMovieFocus: () => void;
  isMobile?: boolean;
}

const MovieEmptyBento: React.FC<MovieEmptyBentoProps> = ({
  onAddMovieFocus,
  isMobile = false,
}) => {
  return (
    <div className="flex flex-col gap-4 px-1 py-2">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-card-foreground opacity-90">
          Your movie list is wide open
        </h2>
        <p className="text-xs text-muted-foreground">
          Nothing lined up yet. Add something you both want to watch and kick off movie night.
        </p>
      </div>

      <BentoGrid rowHeight={isMobile ? "9rem" : "12rem"} className={isMobile ? "gap-2" : "gap-3"}>
        {GENRE_TILES.map((tile, i) => (
          <BentoGridItem
            key={i}
            title={tile.title}
            description={tile.description}
            header={tile.header}
            className={isMobile ? undefined : tile.className}
          />
        ))}
      </BentoGrid>

      <div className="flex justify-center pt-1">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onAddMovieFocus}
        >
          Add a movie
        </Button>
      </div>
    </div>
  );
};

export default MovieEmptyBento;
