"use client";

import { useEffect, useRef } from "react";

interface RadialMenuItem {
  id: string;
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface RadialMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  items: RadialMenuItem[];
}

export function RadialMenu({ isOpen, position, onClose, items }: RadialMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const radius = 70;
  const startAngle = 45;
  const angleStep = 45;

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        e.stopPropagation();
        e.preventDefault();
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50"
      style={{ left: position.x, top: position.y }}
    >
      {items.map((item, index) => {
        const angle = (startAngle - index * angleStep) * (Math.PI / 180);
        const x = Math.cos(angle) * radius;
        const y = -Math.sin(angle) * radius;

        return (
          <button
            key={item.id}
            className="absolute w-11 h-11 rounded-full bg-bg-primary border border-border-primary shadow-lg flex items-center justify-center text-lg hover:bg-bg-secondary"
            style={{ left: x - 22, top: y - 22 }}
            onClick={(e) => {
              e.stopPropagation();
              item.onClick();
            }}
            title={item.label}
          >
            <span className={item.danger ? "text-error" : ""}>{item.icon}</span>
          </button>
        );
      })}
    </div>
  );
}
