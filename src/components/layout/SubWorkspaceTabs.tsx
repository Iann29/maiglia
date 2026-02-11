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
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer select-none"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
            onClick={() => onSelect(sub._id)}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-200 ${
                isActive ? "scale-150" : ""
              }`}
              style={{ backgroundColor: sub.color }}
            />

            <span
              className={`text-xs font-medium truncate transition-colors duration-150 ${
                isActive
                  ? "text-fg-primary font-semibold"
                  : "text-fg-secondary hover:text-fg-primary"
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
