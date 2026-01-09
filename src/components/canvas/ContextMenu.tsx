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
  const submenuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [submenuIndex, setSubmenuIndex] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsideMenu = menuRef.current?.contains(target);
      const isInsideSubmenu = submenuRef.current?.contains(target);
      
      if (!isInsideMenu && !isInsideSubmenu) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleMouseEnterItem = (item: MenuItem, index: number) => {
    if (item.submenu) {
      setActiveSubmenu(item.id);
      setSubmenuIndex(index);
    } else {
      setActiveSubmenu(null);
    }
  };

  const activeItem = items.find((item) => item.id === activeSubmenu);

  return (
    <>
      <div ref={menuRef} className="fixed z-50" style={{ left: position.x, top: position.y }}>
        <div className="bg-bg-primary border border-border-primary rounded-lg shadow-xl py-1 min-w-[160px]">
          {items.map((item, index) => (
            <div key={item.id}>
              {item.danger && index > 0 && (
                <div className="border-t border-border-primary my-1" />
              )}

              <button
                className={`w-full px-3 py-2 flex items-center gap-3 text-sm hover:bg-bg-secondary transition-colors ${item.danger ? "text-error" : "text-fg-primary"}`}
                onMouseEnter={() => handleMouseEnterItem(item, index)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.onClick) item.onClick();
                }}
              >
                <span className="text-base">{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.submenu && <span className="text-fg-muted">›</span>}
              </button>
            </div>
          ))}
        </div>
      </div>

      {activeItem?.submenu && (
        <div
          ref={submenuRef}
          className="fixed z-50 bg-bg-primary border border-border-primary rounded-lg shadow-xl py-1 min-w-[180px]"
          style={{ 
            left: position.x + 168,
            top: position.y + submenuIndex * 40
          }}
        >
          {activeItem.submenu.map((subItem) => (
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
    </>
  );
}
