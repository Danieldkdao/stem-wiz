import {
  LandmarkIcon,
  LayoutDashboardIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";

export const GENERAL_ERROR_MESSAGE =
  "Something went wrong. Please try again or come back later.";
export const UNAUTHED_ERROR_MESSAGE = "Please sign in to continue.";
export const INVALID_DATA_ERROR_MESSAGE = "Invalid data. Please try again.";
export const NO_PERMISSION_DATA_MESSAGE =
  "You do not have permission to do this.";

export const SEARCH_OPTION_ICONS = {
  "layout-dashboard": LayoutDashboardIcon,
  "landmark-icon": LandmarkIcon,
  "users-icon": UsersIcon,
  "sparkles-icon": SparklesIcon,
};

// todo: improve theme
export const CODE_EDITOR_THEME = {
  id: "github-dark",
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "6e7681" },
    { token: "string", foreground: "a5d6ff" },
    { token: "keyword", foreground: "ff7b72" },
    { token: "number", foreground: "79c0ff" },
    { token: "type", foreground: "ffa657" },
    { token: "class", foreground: "ffa657" },
    { token: "function", foreground: "d2a8ff" },
    { token: "variable", foreground: "ffa657" },
    { token: "operator", foreground: "ff7b72" },
  ],
  colors: {
    "editor.background": "#0d1117",
    "editor.foreground": "#c9d1d9",
    "editor.lineHighlightBackground": "#161b22",
    "editorLineNumber.foreground": "#6e7681",
    "editorIndentGuide.background": "#21262d",
    "editor.selectionBackground": "#264f78",
    "editor.inactiveSelectionBackground": "#264f7855",
  },
};
