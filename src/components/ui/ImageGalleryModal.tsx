"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { GALLERY_IMAGES } from "@/constants/gallery-images";

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
}

/**
 * Modal de galeria de imagens
 * Exibe imagens pré-definidas que o usuário pode adicionar ao canvas
 */
export function ImageGalleryModal({
  isOpen,
  onClose,
  onSelectImage,
}: ImageGalleryModalProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  // Fecha modal com Escape
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleImageLoad = (imageId: string) => {
    setLoadedImages((prev) => new Set(prev).add(imageId));
  };

  const handleImageSelect = (imageUrl: string) => {
    onSelectImage(imageUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000001] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-bg-primary rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-primary">
          <h2 className="text-lg font-semibold text-fg-primary">
            Galeria de Imagens
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-secondary rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Grid de imagens */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-140px)]">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {GALLERY_IMAGES.map((image) => (
              <button
                key={image.id}
                onClick={() => handleImageSelect(image.url)}
                className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-accent transition-all hover:scale-105 focus:outline-none focus:border-accent group"
              >
                {!loadedImages.has(image.id) && (
                  <div className="absolute inset-0 bg-bg-secondary animate-pulse" />
                )}
                <Image
                  src={image.thumbnail}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 640px) 33vw, 25vw"
                  className="object-cover"
                  onLoad={() => handleImageLoad(image.id)}
                />
                {/* Overlay com nome no hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                  <span className="text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity truncate w-full">
                    {image.alt}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer com botão premium */}
        <div className="p-4 border-t border-border-primary bg-bg-secondary">
          <button
            disabled
            className="w-full py-3 px-4 bg-bg-primary border border-border-primary rounded-lg text-fg-secondary cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Enviar imagem
            <span className="ml-2 px-2 py-0.5 bg-accent/20 text-accent text-xs font-medium rounded-full">
              Premium
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
