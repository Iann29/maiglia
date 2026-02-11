"use client";

import { useState, useRef, useEffect } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { getWorkspaceColorsFromTheme } from "@/constants/colors";

interface SubWorkspace {
  _id: Id<"workspaces">;
  name: string;
  color: string;
  index: string;
}

interface SubWorkspaceTabsProps {
  subWorkspaces: SubWorkspace[];
  activeSubId: Id<"workspaces"> | null;
  onSelect: (subId: Id<"workspaces">) => void;
  onCreate: (name: string) => void;
  onRename: (subId: Id<"workspaces">, newName: string) => void;
  onChangeColor: (subId: Id<"workspaces">, color: string) => void;
  onDelete: (subId: Id<"workspaces">) => void;
}

/**
 * SubWorkspaceTabs - Abas de sub-workspaces (páginas dentro de uma categoria)
 *
 * Segunda linha de tabs, mais sutil que as tabs pai.
 * Mostra cor + nome para cada sub-workspace.
 */
export function SubWorkspaceTabs({
  subWorkspaces,
  activeSubId,
  onSelect,
  onCreate,
  onRename,
  onChangeColor,
  onDelete,
}: SubWorkspaceTabsProps) {
  const [editingId, setEditingId] = useState<Id<"workspaces"> | null>(null);
  const [editingName, setEditingName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [contextMenu, setContextMenu] = useState<{
    subId: Id<"workspaces">;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (!contextMenu) return;

    const handleClick = () => setContextMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [contextMenu]);

  const startEditing = (sub: SubWorkspace) => {
    setEditingId(sub._id);
    setEditingName(sub.name);
  };

  const saveEdit = () => {
    if (editingId && editingName.trim()) {
      onRename(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleContextMenu = (e: React.MouseEvent, sub: SubWorkspace) => {
    e.preventDefault();
    setContextMenu({ subId: sub._id, x: e.clientX, y: e.clientY });
  };

  const handleCreate = () => {
    const name = `Página ${subWorkspaces.length + 1}`;
    onCreate(name);
  };

  return (
    <div className="h-9 bg-bg-primary border-b border-border-primary flex items-center px-3 gap-0.5 overflow-x-auto">
      {subWorkspaces.map((sub) => {
        const isActive = sub._id === activeSubId;
        const isEditing = sub._id === editingId;

        return (
          <div
            key={sub._id}
            className={`
              group relative flex items-center gap-1.5 px-2.5 py-1 rounded-md cursor-pointer
              transition-colors select-none min-w-[80px] max-w-[180px]
              ${isActive
                ? "bg-bg-secondary text-fg-primary"
                : "text-fg-secondary hover:text-fg-primary hover:bg-bg-secondary/50"
              }
            `}
            onClick={() => !isEditing && onSelect(sub._id)}
            onDoubleClick={() => startEditing(sub)}
            onContextMenu={(e) => handleContextMenu(e, sub)}
          >
            {/* Indicador de cor */}
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: sub.color }}
            />

            {/* Nome */}
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
                className="flex-1 bg-transparent text-xs font-medium outline-none border-b border-accent min-w-0"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-xs font-medium truncate">
                {sub.name}
              </span>
            )}

            {/* Indicador de ativo */}
            {isActive && (
              <div className="absolute bottom-0 left-1.5 right-1.5 h-0.5 bg-accent rounded-full" />
            )}
          </div>
        );
      })}

      {/* Botão de adicionar sub-workspace */}
      <button
        onClick={handleCreate}
        className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-bg-secondary transition-colors shrink-0"
        title="Nova página"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-fg-muted"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Menu de contexto */}
      {contextMenu && (
        <div
          className="fixed z-[10000] bg-bg-primary border border-border-primary rounded-lg shadow-xl py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-3 py-2 flex items-center gap-2 text-sm text-fg-primary hover:bg-bg-secondary transition-colors"
            onClick={() => {
              const sub = subWorkspaces.find((s) => s._id === contextMenu.subId);
              if (sub) startEditing(sub);
              setContextMenu(null);
            }}
          >
            <span>✏️</span>
            <span>Renomear</span>
          </button>

          {/* Seletor de cores */}
          <div className="px-3 py-2 border-t border-border-primary">
            <div className="text-xs text-fg-muted mb-2">Cor</div>
            <div className="flex gap-1 flex-wrap">
              {getWorkspaceColorsFromTheme().map((color) => (
                <button
                  key={color}
                  className="w-5 h-5 rounded-full border-2 border-transparent hover:border-fg-muted transition-colors"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    onChangeColor(contextMenu.subId, color);
                    setContextMenu(null);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Deletar (apenas se houver mais de 1 sub-workspace) */}
          {subWorkspaces.length > 1 && (
            <>
              <div className="border-t border-border-primary my-1" />
              <button
                className="w-full px-3 py-2 flex items-center gap-2 text-sm text-error hover:bg-bg-secondary transition-colors"
                onClick={() => {
                  onDelete(contextMenu.subId);
                  setContextMenu(null);
                }}
              >
                <span>🗑️</span>
                <span>Deletar</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
