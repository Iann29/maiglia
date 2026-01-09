"use client";

import { useEffect, useRef, useState } from "react";

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  onClick?: () => void;
  danger?: boolean;
  submenu?: MenuItem[];
}

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  items: MenuItem[];
}

export function ContextMenu({ isOpen, position, onClose, items }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

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
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleMouseEnterItem = (item: MenuItem) => {
    setActiveSubmenu(item.submenu ? item.id : null);
  };

  return (
    <div ref={menuRef} className="fixed z-50" style={{ left: position.x, top: position.y }}>
      <div className="bg-bg-primary border border-border-primary rounded-lg shadow-xl py-1 min-w-[160px]">
        {items.map((item, index) => (
          <div key={item.id} className="relative">
            {item.danger && index > 0 && (
              <div className="border-t border-border-primary my-1" />
            )}

            <button
              className={`w-full px-3 py-2 flex items-center gap-3 text-sm hover:bg-bg-secondary transition-colors ${item.danger ? "text-error" : "text-fg-primary"}`}
              onMouseEnter={() => handleMouseEnterItem(item)}
              onClick={(e) => {
                e.stopPropagation();
                if (item.onClick) item.onClick();
              }}
            >
              <span className="text-base">{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.submenu && <span className="text-fg-muted">›</span>}
            </button>

            {item.submenu && activeSubmenu === item.id && (
              <div className="absolute left-full top-0 ml-1 bg-bg-primary border border-border-primary rounded-lg shadow-xl py-1 min-w-[180px]">
                {item.submenu.map((subItem) => (
                  <button
                    key={subItem.id}
                    className="w-full px-3 py-2 flex items-center gap-3 text-sm text-fg-primary hover:bg-bg-secondary transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (subItem.onClick) subItem.onClick();
                    }}
                  >
                    <span className="text-base">{subItem.icon}</span>
                    <span>{subItem.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
