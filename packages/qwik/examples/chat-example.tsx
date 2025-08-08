import { component$, useStyles$, $ } from '@builder.io/qwik';
import { useChat } from '@ai-sdk/qwik';

export default component$(() => {
  useStyles$(`
    .chat-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      font-family: system-ui, sans-serif;
    }
    
    .messages {
      height: 400px;
      overflow-y: auto;
      border: 1px solid #ccc;
      padding: 16px;
      margin-bottom: 16px;
      border-radius: 8px;
      background: #f9f9f9;
    }
    
    .message {
      margin-bottom: 12px;
      padding: 8px 12px;
      border-radius: 8px;
      max-width: 80%;
    }
    
    .user-message {
      background: #007bff;
      color: white;
      margin-left: auto;
      text-align: right;
    }
    
    .assistant-message {
      background: white;
      border: 1px solid #ddd;
    }
    
    .input-form {
      display: flex;
      gap: 8px;
    }
    
    .input-field {
      flex: 1;
      padding: 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 16px;
    }
    
    .submit-button {
      padding: 12px 24px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    
    .submit-button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    .status {
      margin-bottom: 8px;
      font-size: 14px;
      color: #666;
    }
    
    .error {
      color: #dc3545;
      background: #f8d7da;
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 16px;
    }
  `);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    regenerate,
    setMessages
  } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! How can I help you today?'
      }
    ],
    onError: (error) => {
      console.error('Chat error:', error);
    },
    onFinish: (message) => {
      console.log('Message finished:', message);
    }
  });

  const clearChat = $(() => {
    setMessages([]);
  });

  return (
    <div class="chat-container">
      <h1>AI Chat with Qwik</h1>
      
      {error && (
        <div class="error">
          Error: {error.message}
        </div>
      )}
      
      <div class="status">
        Status: {isLoading ? 'Generating response...' : 'Ready'}
      </div>
      
      <div class="messages">
        {messages.map((message) => (
          <div
            key={message.id}
            class={`message ${
              message.role === 'user' ? 'user-message' : 'assistant-message'
            }`}
          >
            <strong>{message.role}:</strong> {message.content}
          </div>
        ))}
      </div>
      
      <form class="input-form" onSubmit$={handleSubmit}>
        <input
          class="input-field"
          value={input}
          placeholder="Type your message..."
          onChange$={handleInputChange}
          disabled={isLoading}
        />
        <button
          class="submit-button"
          type="submit"
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
      
      <div style="margin-top: 16px; display: flex; gap: 8px;">
        {isLoading && (
          <button
            type="button"
            onClick$={stop}
            style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            Stop
          </button>
        )}
        
        <button
          type="button"
          onClick$={regenerate}
          disabled={isLoading || messages.length === 0}
          style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          Regenerate
        </button>
        
        <button
          type="button"
          onClick$={clearChat}
          style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          Clear Chat
        </button>
      </div>
    </div>
  );
});