"use client";

import { useState, useRef, useEffect } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { getWorkspaceColorsFromTheme } from "@/constants/colors";

interface Workspace {
  _id: Id<"workspaces">;
  name: string;
  color: string;
  index: string;
}

interface WorkspaceTabsProps {
  workspaces: Workspace[];
  activeWorkspaceId: Id<"workspaces"> | null;
  onSelect: (workspaceId: Id<"workspaces">) => void;
  onCreate: (name: string) => void;
  onRename: (workspaceId: Id<"workspaces">, newName: string) => void;
  onChangeColor: (workspaceId: Id<"workspaces">, color: string) => void;
  onDelete: (workspaceId: Id<"workspaces">) => void;
}

/**
 * WorkspaceTabs - Abas de workspaces abaixo do header
 * 
 * Funcionalidades:
 * - Clique para selecionar workspace
 * - Clique duplo para renomear
 * - Botão + para criar novo
 * - Menu de contexto (botão direito) para opções
 */
export function WorkspaceTabs({
  workspaces,
  activeWorkspaceId,
  onSelect,
  onCreate,
  onRename,
  onChangeColor,
  onDelete,
}: WorkspaceTabsProps) {
  // Estado para edição de nome
  const [editingId, setEditingId] = useState<Id<"workspaces"> | null>(null);
  const [editingName, setEditingName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Estado para menu de contexto
  const [contextMenu, setContextMenu] = useState<{
    workspaceId: Id<"workspaces">;
    x: number;
    y: number;
  } | null>(null);

  // Foca no input quando entra em modo de edição
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  // Fecha menu de contexto ao clicar fora
  useEffect(() => {
    if (!contextMenu) return;

    const handleClick = () => setContextMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [contextMenu]);

  // Inicia edição de nome
  const startEditing = (workspace: Workspace) => {
    setEditingId(workspace._id);
    setEditingName(workspace.name);
  };

  // Salva o novo nome
  const saveEdit = () => {
    if (editingId && editingName.trim()) {
      onRename(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName("");
  };

  // Cancela edição
  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  // Abre menu de contexto
  const handleContextMenu = (e: React.MouseEvent, workspaceId: Id<"workspaces">) => {
    e.preventDefault();
    setContextMenu({ workspaceId, x: e.clientX, y: e.clientY });
  };

  // Cria novo workspace
  const handleCreate = () => {
    const name = `Workspace ${workspaces.length + 1}`;
    onCreate(name);
  };

  return (
    <div className="h-10 bg-bg-secondary border-b border-border-primary flex items-center px-2 gap-1 overflow-x-auto">
      {/* Tabs dos workspaces */}
      {workspaces.map((workspace) => {
        const isActive = workspace._id === activeWorkspaceId;
        const isEditing = workspace._id === editingId;

        return (
          <div
            key={workspace._id}
            className={`
              group relative flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer
              transition-colors select-none min-w-[100px] max-w-[200px]
              ${isActive
                ? "bg-bg-primary shadow-sm"
                : "hover:bg-bg-tertiary"
              }
            `}
            onClick={() => !isEditing && onSelect(workspace._id)}
            onDoubleClick={() => startEditing(workspace)}
            onContextMenu={(e) => handleContextMenu(e, workspace._id)}
          >
            {/* Indicador de cor */}
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: workspace.color }}
            />

            {/* Nome (editável ou não) */}
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
                className="flex-1 bg-transparent text-sm font-medium outline-none border-b border-accent min-w-0"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-sm font-medium truncate text-fg-primary">
                {workspace.name}
              </span>
            )}

            {/* Indicador de ativo */}
            {isActive && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent rounded-full" />
            )}
          </div>
        );
      })}

      {/* Botão de adicionar workspace */}
      <button
        onClick={handleCreate}
        className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-bg-tertiary transition-colors shrink-0"
        title="Novo workspace"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-fg-secondary"
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
        >
          <button
            className="w-full px-3 py-2 flex items-center gap-2 text-sm text-fg-primary hover:bg-bg-secondary transition-colors"
            onClick={() => {
              const workspace = workspaces.find((w) => w._id === contextMenu.workspaceId);
              if (workspace) startEditing(workspace);
              setContextMenu(null);
            }}
          >
            <span>✏️</span>
            <span>Renomear</span>
          </button>

          {/* Seletor de cores */}
          <div className="px-3 py-2">
            <div className="text-xs text-fg-muted mb-2">Cor</div>
            <div className="flex gap-1 flex-wrap">
              {getWorkspaceColorsFromTheme().map((color) => (
                <button
                  key={color}
                  className="w-5 h-5 rounded-full border-2 border-transparent hover:border-fg-muted transition-colors"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    onChangeColor(contextMenu.workspaceId, color);
                    setContextMenu(null);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Deletar (apenas se houver mais de 1 workspace) */}
          {workspaces.length > 1 && (
            <>
              <div className="border-t border-border-primary my-1" />
              <button
                className="w-full px-3 py-2 flex items-center gap-2 text-sm text-error hover:bg-bg-secondary transition-colors"
                onClick={() => {
                  onDelete(contextMenu.workspaceId);
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
