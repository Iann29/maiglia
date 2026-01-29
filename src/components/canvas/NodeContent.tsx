"use client";

import { NODE_BORDER_RADIUS } from "./canvas-types";
import { ChecklistContent, type ChecklistContentData } from "./content/ChecklistContent";
import type { NodeType } from "./canvas-types";

interface NodeContentProps {
  height: number;
  type?: NodeType;
  content?: unknown;
  onContentChange?: (content: unknown) => void;
}

export function NodeContent({ height, type, content, onContentChange }: NodeContentProps) {
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
      case "table":
      default:
        // Placeholder para tipos ainda não implementados
        return (
          <div className="flex items-center justify-center text-fg-muted text-sm h-full">
            {/* Placeholder para futuro conteúdo */}
          </div>
        );
    }
  };

  return (
    <div
      className="bg-bg-primary overflow-hidden"
      style={{
        height,
        borderBottomLeftRadius: NODE_BORDER_RADIUS,
        borderBottomRightRadius: NODE_BORDER_RADIUS,
      }}
    >
      {renderContent()}
    </div>
  );
}
