import { component$, useStyles$, $ } from '@builder.io/qwik';
import { experimental_useObject } from '@ai-sdk/qwik';
import { z } from 'zod';

// Define the schema for a recipe
const recipeSchema = z.object({
  recipe: z.object({
    name: z.string().describe('Name of the recipe'),
    description: z.string().describe('Brief description of the recipe'),
    prepTime: z.string().describe('Preparation time'),
    cookTime: z.string().describe('Cooking time'),
    servings: z.number().describe('Number of servings'),
    difficulty: z.enum(['easy', 'medium', 'hard']).describe('Difficulty level'),
    ingredients: z.array(z.object({
      item: z.string().describe('Ingredient name'),
      amount: z.string().describe('Amount needed'),
    })).describe('List of ingredients'),
    instructions: z.array(z.string()).describe('Step-by-step cooking instructions'),
    tips: z.array(z.string()).optional().describe('Optional cooking tips'),
  }),
});

type Recipe = z.infer<typeof recipeSchema>;

export default component$(() => {
  useStyles$(`
    .object-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      font-family: system-ui, sans-serif;
    }
    
    .input-section {
      margin-bottom: 24px;
    }
    
    .input-field {
      width: 100%;
      padding: 12px;
      border: 1px solid #ccc;
      border-radius: 8px;
      font-size: 16px;
      margin-bottom: 12px;
    }
    
    .button {
      padding: 12px 24px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      margin-right: 8px;
    }
    
    .primary-button {
      background: #007bff;
      color: white;
    }
    
    .primary-button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    .danger-button {
      background: #dc3545;
      color: white;
    }
    
    .secondary-button {
      background: #6c757d;
      color: white;
    }
    
    .recipe-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 24px;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .recipe-header {
      border-bottom: 2px solid #eee;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    
    .recipe-title {
      margin: 0 0 8px 0;
      color: #333;
    }
    
    .recipe-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
      margin: 16px 0;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
    }
    
    .meta-item {
      text-align: center;
    }
    
    .meta-label {
      font-size: 12px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    
    .meta-value {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }
    
    .ingredients-section, .instructions-section {
      margin: 24px 0;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #333;
    }
    
    .ingredient-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    
    .ingredient-item:last-child {
      border-bottom: none;
    }
    
    .instruction-item {
      margin-bottom: 12px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
      border-left: 4px solid #007bff;
    }
    
    .instruction-number {
      font-weight: 600;
      color: #007bff;
      margin-right: 8px;
    }
    
    .tips-section {
      margin-top: 24px;
      padding: 16px;
      background: #fff3cd;
      border-radius: 6px;
      border-left: 4px solid #ffc107;
    }
    
    .tip-item {
      margin-bottom: 8px;
    }
    
    .status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding: 8px 16px;
      background: #e9ecef;
      border-radius: 4px;
    }
    
    .loading-indicator {
      color: #007bff;
      font-weight: 500;
    }
    
    .error {
      color: #dc3545;
      background: #f8d7da;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      border: 1px solid #f5c6cb;
    }
    
    .difficulty-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .difficulty-easy { background: #d4edda; color: #155724; }
    .difficulty-medium { background: #fff3cd; color: #856404; }
    .difficulty-hard { background: #f8d7da; color: #721c24; }
  `);

  const {
    object,
    submit,
    isLoading,
    error,
    stop,
    clear,
  } = experimental_useObject({
    api: '/api/generate-object',
    schema: recipeSchema,
  });

  const prompts = [
    'Generate a recipe for chocolate chip cookies',
    'Create a healthy smoothie bowl recipe',
    'Make a traditional Italian pasta dish',
    'Design a vegan burger recipe',
    'Create a fancy dinner party appetizer',
  ];

  const generateRecipe = $((prompt: string) => {
    submit({ prompt });
  });

  return (
    <div class="object-container">
      <h1>AI Recipe Generator with Qwik</h1>
      <p>This example demonstrates structured object streaming using Zod schemas.</p>
      
      {error && (
        <div class="error">
          <strong>Error:</strong> {error.message}
        </div>
      )}
      
      <div class="input-section">
        <h2>Quick Recipe Ideas</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
          {prompts.map((prompt, index) => (
            <button
              key={index}
              class="button primary-button"
              onClick$={() => generateRecipe(prompt)}
              disabled={isLoading}
            >
              {prompt}
            </button>
          ))}
        </div>
        
        <div style="display: flex; gap: 8px;">
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
            onClick$={clear}
            disabled={isLoading}
          >
            Clear Recipe
          </button>
        </div>
      </div>
      
      <div class="status-bar">
        <h2 style="margin: 0;">Generated Recipe</h2>
        <span class={isLoading ? 'loading-indicator' : ''}>
          {isLoading ? 'Generating...' : object?.recipe ? 'Complete' : 'Ready'}
        </span>
      </div>
      
      {object?.recipe ? (
        <div class="recipe-card">
          <div class="recipe-header">
            <h1 class="recipe-title">{object.recipe.name || 'Untitled Recipe'}</h1>
            <p>{object.recipe.description}</p>
            
            {object.recipe.difficulty && (
              <span class={`difficulty-badge difficulty-${object.recipe.difficulty}`}>
                {object.recipe.difficulty}
              </span>
            )}
          </div>
          
          <div class="recipe-meta">
            {object.recipe.prepTime && (
              <div class="meta-item">
                <div class="meta-label">Prep Time</div>
                <div class="meta-value">{object.recipe.prepTime}</div>
              </div>
            )}
            
            {object.recipe.cookTime && (
              <div class="meta-item">
                <div class="meta-label">Cook Time</div>
                <div class="meta-value">{object.recipe.cookTime}</div>
              </div>
            )}
            
            {object.recipe.servings && (
              <div class="meta-item">
                <div class="meta-label">Servings</div>
                <div class="meta-value">{object.recipe.servings}</div>
              </div>
            )}
          </div>
          
          {object.recipe.ingredients && object.recipe.ingredients.length > 0 && (
            <div class="ingredients-section">
              <h2 class="section-title">Ingredients</h2>
              {object.recipe.ingredients.map((ingredient, index) => (
                <div key={index} class="ingredient-item">
                  <span>{ingredient.item}</span>
                  <span style="font-weight: 500;">{ingredient.amount}</span>
                </div>
              ))}
            </div>
          )}
          
          {object.recipe.instructions && object.recipe.instructions.length > 0 && (
            <div class="instructions-section">
              <h2 class="section-title">Instructions</h2>
              {object.recipe.instructions.map((instruction, index) => (
                <div key={index} class="instruction-item">
                  <span class="instruction-number">{index + 1}.</span>
                  {instruction}
                </div>
              ))}
            </div>
          )}
          
          {object.recipe.tips && object.recipe.tips.length > 0 && (
            <div class="tips-section">
              <h2 class="section-title">💡 Tips</h2>
              {object.recipe.tips.map((tip, index) => (
                <div key={index} class="tip-item">
                  • {tip}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style="text-align: center; padding: 40px; color: #666; background: #f8f9fa; border-radius: 8px;">
          {isLoading ? (
            <div>
              <div style="font-size: 18px; margin-bottom: 8px;">🍳 Generating your recipe...</div>
              <div>This may take a few moments</div>
            </div>
          ) : (
            <div>
              <div style="font-size: 18px; margin-bottom: 8px;">👨‍🍳 Ready to cook!</div>
              <div>Click one of the recipe ideas above to get started</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});