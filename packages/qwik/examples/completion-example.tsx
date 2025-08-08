import { component$, useStyles$, $ } from '@builder.io/qwik';
import { useCompletion } from '@ai-sdk/qwik';

export default component$(() => {
  useStyles$(`
    .completion-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: system-ui, sans-serif;
    }
    
    .prompt-section {
      margin-bottom: 24px;
    }
    
    .prompt-textarea {
      width: 100%;
      min-height: 120px;
      padding: 12px;
      border: 1px solid #ccc;
      border-radius: 8px;
      font-size: 16px;
      font-family: inherit;
      resize: vertical;
    }
    
    .controls {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      align-items: center;
    }
    
    .button {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }
    
    .primary-button {
      background: #007bff;
      color: white;
    }
    
    .primary-button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    .secondary-button {
      background: #6c757d;
      color: white;
    }
    
    .danger-button {
      background: #dc3545;
      color: white;
    }
    
    .completion-section {
      margin-top: 24px;
    }
    
    .completion-output {
      min-height: 200px;
      padding: 16px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #f8f9fa;
      white-space: pre-wrap;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding: 8px 12px;
      background: #e9ecef;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .error {
      color: #dc3545;
      background: #f8d7da;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      border: 1px solid #f5c6cb;
    }
    
    .loading-indicator {
      color: #007bff;
      font-weight: 500;
    }
  `);

  const {
    completion,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    setCompletion,
  } = useCompletion({
    api: '/api/completion',
    initialInput: 'Write a short story about a robot who discovers emotions...',
  });

  const clearCompletion = $(() => {
    setCompletion('');
  });

  const handleClear = $(() => {
    setInput('');
    setCompletion('');
  });

  return (
    <div class="completion-container">
      <h1>AI Text Completion with Qwik</h1>
      
      {error && (
        <div class="error">
          <strong>Error:</strong> {error.message}
        </div>
      )}
      
      <div class="prompt-section">
        <h2>Prompt</h2>
        <textarea
          class="prompt-textarea"
          value={input}
          placeholder="Enter your prompt here..."
          onChange$={handleInputChange}
          disabled={isLoading}
        />
        
        <div class="controls">
          <button
            class="button primary-button"
            onClick$={handleSubmit}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? 'Generating...' : 'Generate Completion'}
          </button>
          
          {isLoading && (
            <button
              class="button danger-button"
              onClick$={stop}
            >
              Stop Generation
            </button>
          )}
          
          <button
            class="button secondary-button"
            onClick$={handleClear}
            disabled={isLoading}
          >
            Clear All
          </button>
        </div>
      </div>
      
      <div class="completion-section">
        <div class="status-bar">
          <h3 style="margin: 0;">Completion</h3>
          <span class={isLoading ? 'loading-indicator' : ''}>
            {isLoading ? 'Generating...' : completion ? 'Complete' : 'Ready'}
          </span>
        </div>
        
        <div class="completion-output">
          {completion || (isLoading ? 'Generating response...' : 'No completion yet. Enter a prompt and click "Generate Completion" to start.')}
        </div>
        
        {completion && !isLoading && (
          <div class="controls" style="margin-top: 12px;">
            <button
              class="button secondary-button"
              onClick$={clearCompletion}
            >
              Clear Completion
            </button>
          </div>
        )}
      </div>
    </div>
  );
});