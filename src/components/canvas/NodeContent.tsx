"use client";

import { NODE_BORDER_RADIUS, getCardStyle } from "@/constants/canvas";
import { ChecklistContent, type ChecklistContentData } from "./content/ChecklistContent";
import type { NodeType, NodeStyle } from "./canvas-types";

interface NodeContentProps {
  height: number;
  type?: NodeType;
  style?: NodeStyle;
  content?: unknown;
  onContentChange?: (content: unknown) => void;
}

export function NodeContent({ height, type, style, content, onContentChange }: NodeContentProps) {
  // Obtém o estilo atual do card
  const cardStyle = getCardStyle(style ?? 0);

  // Renderiza conteúdo baseado no tipo do node
  const renderContent = () => {
    switch (type) {
      case "checklist":
        return (
          <ChecklistContent
            content={content as ChecklistContentData | undefined}
            onChange={(newContent) => onContentChange?.(newContent)}
            height={height}
          />
        );
      
      case "note":
        return (
          <div className="p-3">
            <div className="space-y-2">
              <div 
                className="h-2 rounded w-full" 
                style={{ backgroundColor: cardStyle.titleColor, opacity: 0.3 }} 
              />
              <div 
                className="h-2 rounded w-4/5" 
                style={{ backgroundColor: cardStyle.titleColor, opacity: 0.3 }} 
              />
              <div 
                className="h-2 rounded w-3/5" 
                style={{ backgroundColor: cardStyle.titleColor, opacity: 0.3 }} 
              />
            </div>
          </div>
        );

      case "table":
        return (
          <div className="p-2">
            <div 
              className="border rounded overflow-hidden"
              style={{ borderColor: cardStyle.borderColor }}
            >
              {[1, 2, 3].map((row) => (
                <div 
                  key={row}
                  className="flex border-b last:border-b-0"
                  style={{ borderColor: cardStyle.borderColor }}
                >
                  {[1, 2].map((col) => (
                    <div 
                      key={col}
                      className="flex-1 p-2 border-r last:border-r-0"
                      style={{ borderColor: cardStyle.borderColor }}
                    >
                      <div 
                        className="h-2 rounded"
                        style={{ backgroundColor: cardStyle.titleColor, opacity: 0.3 }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        // Placeholder para tipos ainda não implementados
        return (
          <div className="flex items-center justify-center h-full opacity-50">
            <span style={{ color: cardStyle.titleColor, fontSize: 12 }}>
              {/* Placeholder para futuro conteúdo */}
            </span>
          </div>
        );
    }
  };

  return (
    <div
      className="overflow-hidden transition-colors duration-200"
      style={{
        height,
        backgroundColor: cardStyle.bodyBg,
        borderBottomLeftRadius: NODE_BORDER_RADIUS,
        borderBottomRightRadius: NODE_BORDER_RADIUS,
      }}
    >
      {renderContent()}
    </div>
  );
}
