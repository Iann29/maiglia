"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  parentColor: string;
  onSelect: (subId: Id<"workspaces">) => void;
  onCreate: (name: string) => void;
  onRename: (subId: Id<"workspaces">, newName: string) => void;
  onChangeColor: (subId: Id<"workspaces">, color: string) => void;
  onDelete: (subId: Id<"workspaces">) => void;
}

export function SubWorkspaceTabs({
  subWorkspaces,
  activeSubId,
  parentColor,
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
    <div className="h-[56px] bg-bg-secondary border-b border-border-primary flex items-center justify-center px-4 gap-0.5 overflow-x-auto scrollbar-hidden">
      {subWorkspaces.map((sub) => {
        const isActive = sub._id === activeSubId;
        const isEditing = sub._id === editingId;

        return (
          <motion.div
            key={sub._id}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer select-none"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
            onClick={() => !isEditing && onSelect(sub._id)}
            onDoubleClick={() => startEditing(sub)}
            onContextMenu={(e) => handleContextMenu(e, sub)}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-200 ${
                isActive ? "scale-150" : ""
              }`}
              style={{ backgroundColor: sub.color }}
            />

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
              <span
                className={`text-xs font-medium truncate transition-colors duration-150 ${
                  isActive
                    ? "text-fg-primary font-semibold"
                    : "text-fg-secondary hover:text-fg-primary"
                }`}
              >
                {sub.name}
              </span>
            )}

            {isActive && (
              <motion.div
                layoutId="activeSubUnderline"
                className="absolute -bottom-[5px] left-2 right-2 h-[2px] rounded-full"
                style={{ backgroundColor: parentColor }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </motion.div>
        );
      })}

      <motion.button
        onClick={handleCreate}
        className="flex items-center justify-center w-7 h-7 rounded-md text-fg-muted hover:text-fg-secondary hover:bg-bg-primary/60 transition-colors shrink-0"
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
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
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {contextMenu && (
          <motion.div
            key="sub-context-menu"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed z-[10000] backdrop-blur-xl bg-bg-primary/80 border border-border-primary/60 rounded-xl shadow-xl shadow-black/8 py-1.5 min-w-[180px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-1.5">
              <button
                className="w-full px-2.5 py-2 flex items-center gap-2 text-sm text-fg-primary hover:bg-bg-secondary/80 transition-colors rounded-lg"
                onClick={() => {
                  const sub = subWorkspaces.find(
                    (s) => s._id === contextMenu.subId
                  );
                  if (sub) startEditing(sub);
                  setContextMenu(null);
                }}
              >
                <span>✏️</span>
                <span>Renomear</span>
              </button>
            </div>

            <div className="px-3 py-2 border-t border-border-primary/40 mt-1">
              <div className="text-xs text-fg-muted mb-2">Cor</div>
              <div className="flex gap-1.5 flex-wrap">
                {getWorkspaceColorsFromTheme().map((color) => (
                  <button
                    key={color}
                    className="w-5 h-5 rounded-full border-2 border-transparent hover:border-fg-muted/40 transition-all hover:scale-110"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      onChangeColor(contextMenu.subId, color);
                      setContextMenu(null);
                    }}
                  />
                ))}
              </div>
            </div>

            {subWorkspaces.length > 1 && (
              <div className="px-1.5 border-t border-border-primary/40 mt-1 pt-1">
                <button
                  className="w-full px-2.5 py-2 flex items-center gap-2 text-sm text-error hover:bg-error/8 transition-colors rounded-lg"
                  onClick={() => {
                    onDelete(contextMenu.subId);
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
