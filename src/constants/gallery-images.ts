/**
 * Imagens da Galeria - Maiglia
 * 
 * URLs públicas gratuitas do Unsplash para a galeria de imagens.
 * Usuários podem usar essas imagens nos nodes de imagem.
 */

export interface GalleryImage {
  id: string;
  url: string;
  thumbnail: string; // Versão menor para preview na galeria
  alt: string;
}

// Imagens gratuitas da galeria (Unsplash)
export const GALLERY_IMAGES: GalleryImage[] = [
  {
    id: "nature-1",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=60",
    alt: "Montanhas com neve",
  },
  {
    id: "nature-2",
    url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&q=60",
    alt: "Paisagem com sol",
  },
  {
    id: "abstract-1",
    url: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=200&q=60",
    alt: "Gradiente abstrato roxo",
  },
  {
    id: "abstract-2",
    url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=60",
    alt: "Gradiente colorido",
  },
  {
    id: "pattern-1",
    url: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=200&q=60",
    alt: "Padrão geométrico",
  },
  {
    id: "pattern-2",
    url: "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=200&q=60",
    alt: "Ondas neon",
  },
  {
    id: "minimal-1",
    url: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=200&q=60",
    alt: "Minimal branco",
  },
  {
    id: "minimal-2",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=60",
    alt: "Folha verde",
  },
  {
    id: "city-1",
    url: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=200&q=60",
    alt: "Cidade à noite",
  },
  {
    id: "ocean-1",
    url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=200&q=60",
    alt: "Oceano azul",
  },
  {
    id: "space-1",
    url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=200&q=60",
    alt: "Nebulosa espacial",
  },
  {
    id: "texture-1",
    url: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=200&q=60",
    alt: "Textura de papel",
  },
];
