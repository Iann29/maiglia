"use client";

import { motion } from "framer-motion";
import { Id } from "../../../convex/_generated/dataModel";

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
}

export function SubWorkspaceTabs({
  subWorkspaces,
  activeSubId,
  parentColor,
  onSelect,
}: SubWorkspaceTabsProps) {
  return (
    <div className="h-[56px] bg-bg-secondary border-b border-border-primary flex items-center justify-center px-4 gap-0.5 overflow-x-auto scrollbar-hidden">
      {subWorkspaces.map((sub) => {
        const isActive = sub._id === activeSubId;

        return (
          <motion.div
            key={sub._id}
            className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer select-none"
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.1 }}
            onClick={() => onSelect(sub._id)}
          >
            <div className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-fg-primary/[0.04] pointer-events-none" />
            <div
              className={`relative z-10 w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-200 ${
                isActive ? "scale-150" : "group-hover:scale-125"
              }`}
              style={{ backgroundColor: sub.color }}
            />

            <span
              className={`relative z-10 text-xs font-medium truncate transition-colors duration-200 ${
                isActive
                  ? "text-fg-primary font-semibold"
                  : "text-fg-secondary group-hover:text-fg-primary"
              }`}
            >
              {sub.name}
            </span>

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
    </div>
  );
}
