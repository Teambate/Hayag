/// <reference types="vite/client" />

// Explicitly declare import.meta.env to fix TypeScript errors
interface ImportMeta {
  readonly env: {
    readonly [key: string]: string | boolean | undefined;
    readonly MODE: string;
    readonly BASE_URL: string;
    readonly PROD: boolean;
    readonly DEV: boolean;
    readonly VITE_API_URL?: string;
    readonly VITE_BACKEND_URL?: string;
    readonly VITE_SOCKET_URL?: string;
  };
}

// SVG declarations
declare module "*.svg" {
  import React = require("react");
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

// Image declarations
declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}

declare module "*.jpeg" {
  const content: string;
  export default content;
}

declare module "*.gif" {
  const content: string;
  export default content;
}

// CSS modules
declare module "*.css" {
  const classes: { [key: string]: string };
  export default classes;
}
