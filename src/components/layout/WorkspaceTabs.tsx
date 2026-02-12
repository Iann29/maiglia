"use client";

import { motion } from "framer-motion";
import {
  House,
  CurrencyDollar,
  BookOpen,
  Heartbeat,
  Star,
} from "@phosphor-icons/react";
import { Id } from "../../../convex/_generated/dataModel";
import { FIXED_WORKSPACES } from "@/constants/workspaces";

const ICON_MAP: Record<string, typeof House> = {
  House,
  CurrencyDollar,
  BookOpen,
  Heartbeat,
  Star,
};

const CATEGORY_ICONS = Object.fromEntries(
  FIXED_WORKSPACES.map((cat) => [cat.name, ICON_MAP[cat.iconName]])
) as Record<string, typeof House>;

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
}

export function WorkspaceTabs({
  workspaces,
  activeWorkspaceId,
  onSelect,
}: WorkspaceTabsProps) {
  return (
    <div className="flex items-center justify-center gap-1 overflow-x-auto scrollbar-hidden">
      {workspaces.map((workspace) => {
        const isActive = workspace._id === activeWorkspaceId;
        const IconComponent = CATEGORY_ICONS[workspace.name];

        return (
          <motion.div
            key={workspace._id}
            className="group relative flex items-center gap-2 px-3.5 py-2 rounded-lg cursor-pointer select-none"
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onClick={() => onSelect(workspace._id)}
          >
            {!isActive && (
              <div
                className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{ backgroundColor: workspace.color + "0F" }}
              />
            )}
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

            {IconComponent && (
              <IconComponent
                weight="duotone"
                size={isActive ? 22 : 20}
                color={workspace.color}
                className={`relative z-10 shrink-0 transition-all duration-200 ${
                  isActive ? "scale-110" : "group-hover:scale-105"
                }`}
              />
            )}

            <span
              className={`relative z-10 text-sm truncate transition-colors duration-200 ${
                isActive
                  ? "text-fg-primary font-semibold"
                  : "text-fg-secondary font-medium group-hover:text-fg-primary"
              }`}
            >
              {workspace.name}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
