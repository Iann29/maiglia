"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Id } from "../../../convex/_generated/dataModel";
import { getWorkspaceColorsFromTheme } from "@/constants/colors";

const EMOJI_OPTIONS = [
  "📋", "🏠", "💰", "📚", "🏥", "🌱", "💼", "🎯",
  "🗓️", "⭐", "🎨", "🔧", "🏋️", "🍽️", "🎮", "❤️",
];

interface Workspace {
  _id: Id<"workspaces">;
  name: string;
  color: string;
  index: string;
  emoji?: string;
}

interface WorkspaceTabsProps {
  workspaces: Workspace[];
  activeWorkspaceId: Id<"workspaces"> | null;
  onSelect: (workspaceId: Id<"workspaces">) => void;
  onCreate: (name: string) => void;
  onRename: (workspaceId: Id<"workspaces">, newName: string) => void;
  onChangeColor: (workspaceId: Id<"workspaces">, color: string) => void;
  onChangeEmoji: (workspaceId: Id<"workspaces">, emoji: string) => void;
  onDelete: (workspaceId: Id<"workspaces">) => void;
}

export function WorkspaceTabs({
  workspaces,
  activeWorkspaceId,
  onSelect,
  onCreate,
  onRename,
  onChangeColor,
  onChangeEmoji,
  onDelete,
}: WorkspaceTabsProps) {
  const [editingId, setEditingId] = useState<Id<"workspaces"> | null>(null);
  const [editingName, setEditingName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [contextMenu, setContextMenu] = useState<{
    workspaceId: Id<"workspaces">;
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

  const startEditing = (workspace: Workspace) => {
    setEditingId(workspace._id);
    setEditingName(workspace.name);
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

  const handleContextMenu = (e: React.MouseEvent, workspace: Workspace) => {
    e.preventDefault();
    setContextMenu({ workspaceId: workspace._id, x: e.clientX, y: e.clientY });
  };

  const handleCreate = () => {
    const name = `Espaço ${workspaces.length + 1}`;
    onCreate(name);
  };

  return (
    <div className="flex items-center justify-center gap-1 overflow-x-auto scrollbar-hidden">
      {workspaces.map((workspace) => {
        const isActive = workspace._id === activeWorkspaceId;
        const isEditing = workspace._id === editingId;

        return (
          <motion.div
            key={workspace._id}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-lg cursor-pointer select-none"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            onClick={() => !isEditing && onSelect(workspace._id)}
            onDoubleClick={() => startEditing(workspace)}
            onContextMenu={(e) => handleContextMenu(e, workspace)}
          >
            {isActive && (
              <motion.div
                layoutId="activeParentPill"
                className="absolute inset-0 rounded-lg"
                style={{
                  backgroundColor: workspace.color + "15",
                  border: `1px solid ${workspace.color}30`,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}

            <span
              className={`relative z-10 shrink-0 transition-all duration-150 ${
                isActive ? "text-lg scale-110" : "text-base"
              }`}
            >
              {workspace.emoji || "📄"}
            </span>

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
                className="relative z-10 flex-1 bg-transparent text-sm font-medium outline-none border-b border-accent min-w-0"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className={`relative z-10 text-sm truncate transition-colors duration-150 ${
                  isActive
                    ? "text-fg-primary font-semibold"
                    : "text-fg-secondary font-medium"
                }`}
              >
                {workspace.name}
              </span>
            )}
          </motion.div>
        );
      })}

      <motion.button
        onClick={handleCreate}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-fg-muted hover:text-fg-secondary hover:bg-bg-tertiary/60 transition-colors shrink-0"
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        title="Novo espaço"
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
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {contextMenu && (
          <motion.div
            key="parent-context-menu"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed z-[10000] backdrop-blur-xl bg-bg-primary/80 border border-border-primary/60 rounded-xl shadow-xl shadow-black/8 py-1.5 min-w-[200px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-1.5">
              <button
                className="w-full px-2.5 py-2 flex items-center gap-2 text-sm text-fg-primary hover:bg-bg-secondary/80 transition-colors rounded-lg"
                onClick={() => {
                  const workspace = workspaces.find(
                    (w) => w._id === contextMenu.workspaceId
                  );
                  if (workspace) startEditing(workspace);
                  setContextMenu(null);
                }}
              >
                <span>✏️</span>
                <span>Renomear</span>
              </button>
            </div>

            <div className="px-3 py-2 border-t border-border-primary/40 mt-1">
              <div className="text-xs text-fg-muted mb-2">Emoji</div>
              <div className="grid grid-cols-8 gap-0.5">
                {EMOJI_OPTIONS.map((emoji) => (
                  <motion.button
                    key={emoji}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-tertiary transition-colors text-base"
                    whileTap={{ scale: 0.85 }}
                    onClick={() => {
                      onChangeEmoji(contextMenu.workspaceId, emoji);
                      setContextMenu(null);
                    }}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="px-3 py-2 border-t border-border-primary/40">
              <div className="text-xs text-fg-muted mb-2">Cor</div>
              <div className="flex gap-1.5 flex-wrap">
                {getWorkspaceColorsFromTheme().map((color) => (
                  <button
                    key={color}
                    className="w-5 h-5 rounded-full border-2 border-transparent hover:border-fg-muted/40 transition-all hover:scale-110"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      onChangeColor(contextMenu.workspaceId, color);
                      setContextMenu(null);
                    }}
                  />
                ))}
              </div>
            </div>

            {workspaces.length > 1 && (
              <div className="px-1.5 border-t border-border-primary/40 mt-1 pt-1">
                <button
                  className="w-full px-2.5 py-2 flex items-center gap-2 text-sm text-error hover:bg-error/8 transition-colors rounded-lg"
                  onClick={() => {
                    onDelete(contextMenu.workspaceId);
                    setContextMenu(null);
                  }}
                >
                  <span>🗑️</span>
                  <span>Deletar</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
