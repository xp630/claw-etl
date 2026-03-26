declare global {
  interface Window {
    layoutOpenTab?: (options: { id: string; title: string; path: string }) => void;
  }
}

export {};
