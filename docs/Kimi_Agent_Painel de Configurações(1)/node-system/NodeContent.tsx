"use client";

import { NODE_BORDER_RADIUS, getCardStyle } from "./constants";
import type { CanvasNode, NodeType } from "./canvas-types";

interface NodeContentProps {
  node: CanvasNode;
  height: number;
}

export function NodeContent({ node, height }: NodeContentProps) {
  const styleId = node.style ?? 0;
  const cardStyle = getCardStyle(styleId);

  // Renderiza conteúdo baseado no tipo do node
  const renderContent = () => {
    switch (node.type) {
      case "checklist":
        return (
          <div className="p-3 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded border-2 flex items-center justify-center"
                  style={{ borderColor: cardStyle.borderColor }}
                >
                  {i === 1 && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={cardStyle.titleColor} strokeWidth="3" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div 
                  className={`h-2 rounded flex-1 ${i === 1 ? 'opacity-50' : ''}`}
                  style={{ 
                    backgroundColor: cardStyle.titleColor,
                    opacity: i === 1 ? 0.3 : 0.5
                  }}
                />
              </div>
            ))}
            <button 
              className="flex items-center gap-2 mt-2 text-sm opacity-50 hover:opacity-80 transition-opacity"
              style={{ color: cardStyle.titleColor }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Adicionar item
            </button>
          </div>
        );
      
      case "note":
        return (
          <div className="p-3">
            <div 
              className="space-y-2"
              style={{ color: cardStyle.titleColor, opacity: 0.7 }}
            >
              <div className="h-2 rounded w-full" style={{ backgroundColor: cardStyle.titleColor, opacity: 0.3 }} />
              <div className="h-2 rounded w-4/5" style={{ backgroundColor: cardStyle.titleColor, opacity: 0.3 }} />
              <div className="h-2 rounded w-3/5" style={{ backgroundColor: cardStyle.titleColor, opacity: 0.3 }} />
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
        return (
          <div className="flex items-center justify-center h-full opacity-50">
            <span style={{ color: cardStyle.titleColor, fontSize: 12 }}>
              {node.type || "note"}
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
