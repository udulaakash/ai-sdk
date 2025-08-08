# Qwik AI SDK Examples

This directory contains comprehensive examples of how to use the `@ai-sdk/qwik` package in your Qwik applications.

## Examples

### 1. Chat Example (`chat-example.tsx`)

A complete chat interface implementation showcasing:

- **Real-time streaming**: Messages stream in as they're generated
- **Message management**: Add, clear, and regenerate messages
- **Error handling**: Displays errors and provides recovery options
- **Input handling**: Form submission and input validation
- **Status indicators**: Shows loading states and generation progress
- **Interactive controls**: Stop generation, regenerate responses, clear chat

**Key Features:**
- Full conversation history
- Responsive UI with styled message bubbles
- Form handling with proper validation
- Stop/start generation controls

### 2. Completion Example (`completion-example.tsx`)

A text completion interface demonstrating:

- **Prompt-based generation**: Submit custom prompts for completion
- **Streaming text**: Real-time text generation display
- **Generation controls**: Start, stop, and clear operations
- **Status tracking**: Loading indicators and completion status
- **Clean UI**: Monospace text display for generated content

**Key Features:**
- Large textarea for prompt input
- Real-time completion streaming
- Generation control buttons
- Clean, readable output display

### 3. Object Example (`object-example.tsx`)

A structured object generation example featuring:

- **Schema-based generation**: Uses Zod schemas for type-safe objects
- **Complex data structures**: Generates detailed recipe objects
- **Partial object streaming**: Updates UI as object properties are received
- **Rich data display**: Beautiful UI for complex nested data
- **Pre-built prompts**: Quick-start buttons for common use cases

**Key Features:**
- TypeScript-first with Zod validation
- Real-time object property updates
- Beautiful recipe card display
- Ingredient lists, instructions, and metadata
- Difficulty badges and cooking tips

## Getting Started

### Installation

```bash
npm install @ai-sdk/qwik @builder.io/qwik zod
```

### Basic Setup

1. **Import the hooks in your Qwik component:**

```tsx
import { component$ } from '@builder.io/qwik';
import { useChat, useCompletion, experimental_useObject } from '@ai-sdk/qwik';
```

2. **Set up your API endpoints** (these examples assume standard AI SDK API routes):

```tsx
// For chat
const chat = useChat({ api: '/api/chat' });

// For completion  
const completion = useCompletion({ api: '/api/completion' });

// For object generation
const object = experimental_useObject({ 
  api: '/api/generate-object', 
  schema: yourZodSchema 
});
```

3. **Use Qwik's reactive patterns:**

```tsx
// All hooks return reactive data that automatically updates your UI
const { messages, input, handleSubmit, isLoading } = useChat();

return (
  <div>
    {messages.map(m => <div key={m.id}>{m.content}</div>)}
    <form onSubmit$={handleSubmit}>
      <input value={input} onChange$={handleInputChange} />
    </form>
  </div>
);
```

## Key Qwik Patterns

### Reactive State Management

The AI SDK Qwik hooks use Qwik's signals and stores for reactive state:

```tsx
// State automatically updates the UI when changed
const { messages, isLoading, error } = useChat();

// Use in JSX - automatically reactive
return <div>Status: {isLoading ? 'Loading...' : 'Ready'}</div>;
```

### Event Handling with $

All event handlers use Qwik's `$` syntax for optimization:

```tsx
const handleClick = $(() => {
  // Event handler logic
});

return <button onClick$={handleClick}>Submit</button>;
```

### Streaming Updates

All hooks support real-time streaming with automatic UI updates:

- **Chat**: Messages stream in word by word
- **Completion**: Text appears as it's generated  
- **Object**: Object properties update as they're received

## API Compatibility

The Qwik AI SDK hooks provide the same API surface as the React versions but adapted for Qwik's reactive system:

- Same function signatures and options
- Same return values and properties
- Qwik-optimized event handlers (`$` syntax)
- Signal-based reactivity instead of React state

## Server Setup

These examples work with standard AI SDK server implementations. Example API routes:

```typescript
// app/routes/api/chat/index.ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const POST = async (request: Request) => {
  const { messages } = await request.json();
  
  const result = await streamText({
    model: openai('gpt-4'),
    messages,
  });
  
  return result.toAIStreamResponse();
};
```

See the [AI SDK documentation](https://ai-sdk.dev) for complete server setup guides.

## Running the Examples

1. Copy any example component to your Qwik project
2. Set up the corresponding API routes  
3. Install dependencies: `@ai-sdk/qwik`, `zod` (for object example)
4. Start your Qwik development server

The examples are fully self-contained and include all necessary styling and logic.