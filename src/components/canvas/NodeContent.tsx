"use client";

import { NODE_HEADER_HEIGHT, NODE_BORDER_RADIUS } from "./canvas-types";

interface NodeContentProps {
  height: number;
}

export function NodeContent({ height }: NodeContentProps) {
  const contentHeight = height - NODE_HEADER_HEIGHT;

  return (
    <div
      className="bg-bg-primary flex items-center justify-center text-fg-muted text-sm"
      style={{
        height: contentHeight,
        borderBottomLeftRadius: NODE_BORDER_RADIUS,
        borderBottomRightRadius: NODE_BORDER_RADIUS,
      }}
    >
      {/* Placeholder para futuro conteúdo */}
    </div>
  );
}
