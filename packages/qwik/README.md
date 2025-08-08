# AI SDK Qwik

The AI SDK Qwik package provides Qwik hooks and utilities for building AI-powered user interfaces.

## Installation

```bash
pnpm install @ai-sdk/qwik
```

## Hooks

### `useChat`

Provides functionality for building chat interfaces with AI models.

```tsx
import { component$ } from '@builder.io/qwik';
import { useChat } from '@ai-sdk/qwik';

export default component$(() => {
  const { messages, input, setInput, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
  });

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>
          {m.role}: {m.content}
        </div>
      ))}
      
      <form onSubmit$={handleSubmit}>
        <input
          value={input}
          placeholder="Say something..."
          onChange$={handleInputChange}
        />
      </form>
    </div>
  );
});
```

### `useCompletion`

Provides functionality for building text completion interfaces.

```tsx
import { component$ } from '@builder.io/qwik';
import { useCompletion } from '@ai-sdk/qwik';

export default component$(() => {
  const { completion, input, setInput, handleInputChange, handleSubmit } = useCompletion({
    api: '/api/completion',
  });

  return (
    <div>
      <div>{completion}</div>
      
      <form onSubmit$={handleSubmit}>
        <input
          value={input}
          placeholder="Enter prompt..."
          onChange$={handleInputChange}
        />
      </form>
    </div>
  );
});
```

### `useObject` (experimental)

Provides functionality for streaming structured object generation.

```tsx
import { component$ } from '@builder.io/qwik';
import { experimental_useObject } from '@ai-sdk/qwik';
import { z } from 'zod';

const schema = z.object({
  recipe: z.object({
    name: z.string(),
    ingredients: z.array(z.string()),
    steps: z.array(z.string()),
  }),
});

export default component$(() => {
  const { object, submit } = experimental_useObject({
    api: '/api/object',
    schema,
  });

  return (
    <div>
      <button onClick$={() => submit({ prompt: "Generate a recipe for chocolate cake" })}>
        Generate Recipe
      </button>
      
      {object && (
        <div>
          <h2>{object.recipe?.name}</h2>
          <h3>Ingredients:</h3>
          <ul>
            {object.recipe?.ingredients?.map((ingredient, i) => (
              <li key={i}>{ingredient}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});
```

## API Compatibility

This package provides the same API as `@ai-sdk/react` but adapted for Qwik's reactive system using signals and stores.

All hooks support the same options and return the same interface as their React counterparts.