"use client";

import { useRef, useEffect } from "react";
import type { CanvasNode, TitleAlign, TitleSize } from "./canvas-types";
import { NODE_BORDER_RADIUS, getCardStyle } from "@/constants/canvas";

// Altura extra quando há ícone (para acomodar emoji + título)
const ICON_AREA_HEIGHT = 32;

interface NodeHeaderProps {
  node: CanvasNode;
  isEditing: boolean;
  isHovered: boolean;
  onStartEdit: () => void;
  onSaveTitle: (title: string, align: TitleAlign) => void;
  onCancelEdit: () => void;
  onConfigClick: (e: React.MouseEvent) => void;
  onIconClick?: (e: React.MouseEvent) => void;
}

export function NodeHeader({
  node,
  isEditing,
  isHovered,
  onStartEdit,
  onSaveTitle,
  onCancelEdit,
  onConfigClick,
  onIconClick,
}: NodeHeaderProps) {
  const hasIcon = !!node.icon;
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Obtém o estilo atual do card
  const cardStyle = getCardStyle(node.style ?? 0);

  // Foca no input quando entra em modo de edição
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.value = node.title;
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isEditing, node.title]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSaveTitle(e.currentTarget.value, node.titleAlign);
    } else if (e.key === "Escape") {
      onCancelEdit();
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onSaveTitle(e.currentTarget.value, node.titleAlign);
  };

  const textAlign = node.titleAlign;
  const titleSize = node.titleSize ?? "M";
  
  // Classes de tamanho de fonte baseadas no titleSize
  const titleSizeClasses: Record<TitleSize, string> = {
    hidden: "", // Não renderiza
    S: "text-xs",
    M: "text-sm",
    L: "text-lg",
    XL: "text-xl font-bold",
  };
  
  // Altura dinâmica do header baseada na presença de ícone
  const headerHeight = hasIcon ? cardStyle.headerHeight + ICON_AREA_HEIGHT : cardStyle.headerHeight;

  return (
    <div
      className="relative flex flex-col select-none transition-all duration-200"
      style={{
        height: headerHeight,
        backgroundColor: cardStyle.headerBg,
        borderTopLeftRadius: NODE_BORDER_RADIUS,
        borderTopRightRadius: NODE_BORDER_RADIUS,
        borderBottom: cardStyle.hasHeaderSeparator ? `1px solid ${cardStyle.borderColor}` : "none",
      }}
    >
      {/* Área do ícone (se existir ou hover para mostrar botão de adicionar) */}
      {(hasIcon || isHovered) && (
        <div 
          className="flex items-center justify-center pt-2 px-3 transition-all"
          style={{ height: hasIcon ? ICON_AREA_HEIGHT : 0, overflow: 'hidden' }}
        >
          {hasIcon ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onIconClick?.(e);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="text-2xl hover:scale-110 transition-transform cursor-pointer drop-shadow-sm"
              title="Clique para mudar o ícone"
            >
              {node.icon}
            </button>
          ) : isHovered && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onIconClick?.(e);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="text-sm transition-colors opacity-50 hover:opacity-80"
              style={{ color: cardStyle.titleColor }}
              title="Adicionar ícone"
            >
              + ícone
            </button>
          )}
        </div>
      )}

      {/* Área do título */}
      {titleSize !== "hidden" && (
        <div className="flex-1 flex items-center px-3">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              className={`w-full bg-transparent font-semibold outline-none placeholder:opacity-50 ${titleSizeClasses[titleSize]}`}
              style={{ 
                textAlign,
                color: cardStyle.titleColor,
              }}
              defaultValue={node.title}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="Digite o título..."
            />
          ) : (
            <div
              className="flex-1 overflow-hidden whitespace-nowrap cursor-text"
              style={{ textAlign }}
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit();
              }}
            >
              {node.title ? (
                <span 
                  className={`font-semibold ${titleSizeClasses[titleSize]}`}
                  style={{ color: cardStyle.titleColor }}
                >
                  {node.title}
                </span>
              ) : (
                <span 
                  className={`opacity-50 ${titleSizeClasses[titleSize]}`}
                  style={{ color: cardStyle.titleColor }}
                >
                  Clique para título
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Config Icon - Sempre no canto superior direito */}
      {(isHovered || isEditing) && (
        <button
          className="absolute right-2 top-2 w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.2)',
          }}
          onClick={onConfigClick}
          onMouseDown={(e) => e.stopPropagation()}
          title="Configurações"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={cardStyle.titleColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      )}
    </div>
  );
}
