import React, { useEffect, useRef, useState } from 'react';
import { editor } from 'monaco-editor';
import monaco from 'monaco-editor';


interface IntegratedEditorProps {
  code: string;
  language: string;
  theme?: editor.BuiltinTheme;
  setCode: (value: string) => void;
  setLanguage: (lang: string) => void;
} 

const IntegratedEditor: React.FC<IntegratedEditorProps> = ({
  code = 'console.log("Hello, Monaco!");',
  language = 'javascript',
  theme = 'vs-dark',
  setCode,
  setLanguage,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | undefined>(null);
  const monacoRef = useRef<typeof monaco>(null);

  useEffect(() => {
    const loadMonaco = () => {
      // Check if Monaco is already loaded
      if (typeof window !== 'undefined' && window.monaco) {
        monacoRef.current = window.monaco;
        setIsLoaded(true);
        return;
      }

      // Configure Monaco environment for web workers
      window.MonacoEnvironment = {
        getWorkerUrl: (moduleId, label) => {
          if (label === 'json') {
            return 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/language/json/json.worker.js';
          }
          if (label === 'css' || label === 'scss' || label === 'less') {
            return 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/language/css/css.worker.js';
          }
          if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/language/html/html.worker.js';
          }
          if (label === 'typescript' || label === 'javascript') {
            return 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/language/typescript/ts.worker.js';
          }
          return 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/editor/editor.worker.js';
        }
      };

      // Load the loader script
      const loaderScript = document.createElement('script');
      loaderScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.js';
      loaderScript.onload = () => {
        // Configure require.js
        (window as any).require.config({ 
          paths: { 
            vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' 
          },
          'vs/nls': {
            availableLanguages: {
              '*': 'en'
            }
          }
        });

        // Load Monaco editor
        (window as any).require(['vs/editor/editor.main'], () => {
          (window as Window).monaco = window.monaco;
          monacoRef.current = window.monaco;
          setIsLoaded(true);
        });
      };

      loaderScript.onerror = () => {
        console.error('Failed to load Monaco Editor loader');
      };

      document.head.appendChild(loaderScript);
    };

    loadMonaco();
  
    return () => {
      // Cleanup editor on unmount
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []);
  
  // Initialize editor when Monaco is loaded
  useEffect(() => {
    if (isLoaded && containerRef.current && !editorRef.current) {
      const monaco = monacoRef.current;
      
      // Define custom theme
      monaco?.editor.defineTheme('myCustomTheme', {
        base: theme,
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6A9955' },
          { token: 'keyword', foreground: '569CD6' },
          { token: 'string', foreground: 'CE9178' },
        ],
        colors: {
          'editor.background': '#1e1e1e',
          'editor.foreground': '#d4d4d4',
        }
      });

      // Create the editor
      editorRef.current = monaco?.editor.create(containerRef.current, {
        theme: 'myCustomTheme',
        language,
        tabSize: 2,
        value: code,
        fontSize: 14,
        folding: true,
        wordWrap: 'on',
        readOnly: false,
        lineNumbers: 'on',
        insertSpaces: true,
        cursorStyle: 'line',
        automaticLayout: true,
        matchBrackets: 'always',
        selectOnLineNumbers: true,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        autoClosingQuotes: 'always',
        renderWhitespace: 'selection',
        showFoldingControls: 'always',
        autoClosingBrackets: 'always',
        foldingStrategy: 'indentation',
        autoSurround: 'languageDefined',
      });

      // Listen for content changes
      editorRef.current!.onDidChangeModelContent(() => {
        setCode(editorRef.current!.getValue());
      });
    }
  }, [isLoaded]);

  // Update editor language when changed
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      monacoRef.current.editor.setModelLanguage(model!, language);
    }
  }, [language]);

  // Update editor content when code changes externally
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== code) {
      editorRef.current.setValue(code);
    }
  }, [code]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage?.(e.target.value);
  };

  const handleRunCode = () => {
    // Placeholder: Replace with actual run logic or callback
    alert('Run code: ' + (editorRef.current?.getValue() || ''));
  };

  const formatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')!.run();
    }
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
        <select
          value={language}
          onChange={handleLanguageChange}
          style={{ padding: '0.25rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }}
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="go">Go</option>
          <option value="java">Java</option>
          <option value="csharp">C#</option>
          <option value="cpp">C++</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="json">JSON</option>
          <option value="markdown">Markdown</option>
          <option value="sql">SQL</option>
        </select>

        <button 
          onClick={formatCode}
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#007ACC',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Format Code
        </button>
        
        <button
          className="btn btn-primary"
          style={{ marginLeft: '0.5rem' }}
          onClick={handleRunCode}
        >
          Run Code
        </button>
      </div>
      <div ref={containerRef} className="code-editor" style={{ width: '100%', height: '100%' }} />
    </>
  );
};

export default IntegratedEditor;
