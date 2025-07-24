/// <reference types="monaco-editor" />

declare global {
  interface Window {
    monaco?: any;
  }
}

// This is needed to make the file a module and allow the global augmentation above.
export {};