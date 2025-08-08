import {
  CompletionRequestOptions,
  UseCompletionOptions,
  callCompletionApi,
} from 'ai';
import { useSignal, useStore, useVisibleTask$, $ } from '@builder.io/qwik';
import { throttle } from './throttle';

export type { UseCompletionOptions };

export type UseCompletionHelpers = {
  /** The current completion result */
  completion: string;
  /**
   * Send a new prompt to the API endpoint and update the completion state.
   */
  complete: (
    prompt: string,
    options?: CompletionRequestOptions,
  ) => Promise<string | null | undefined>;
  /** The error object of the API request */
  error: undefined | Error;
  /**
   * Abort the current API request but keep the generated tokens.
   */
  stop: () => void;
  /**
   * Update the `completion` state locally.
   */
  setCompletion: (completion: string) => void;
  /** The current value of the input */
  input: string;
  /** setState-powered method to update the input value */
  setInput: (input: string) => void;
  /**
   * An input/textarea-ready onChange handler to control the value of the input
   * @example
   * ```jsx
   * <input onChange$={handleInputChange} value={input} />
   * ```
   */
  handleInputChange: (event: Event) => void;

  /**
   * Form submission handler to automatically reset input and append a user message
   * @example
   * ```jsx
   * <form onSubmit$={handleSubmit}>
   *  <input onChange$={handleInputChange} value={input} />
   * </form>
   * ```
   */
  handleSubmit: (event?: { preventDefault?: () => void }) => void;

  /** Whether the API request is in progress */
  isLoading: boolean;
};

export function useCompletion({
  api = '/api/completion',
  id,
  initialCompletion = '',
  initialInput = '',
  credentials,
  headers,
  body,
  streamProtocol = 'data',
  fetch,
  onFinish,
  onError,
  experimental_throttle: throttleWaitMs,
}: UseCompletionOptions & {
  /**
   * Custom throttle wait in ms for the completion and data updates.
   * Default is undefined, which disables throttling.
   */
  experimental_throttle?: number;
} = {}): UseCompletionHelpers {
  // Generate a unique id for the completion if not provided
  const completionId = useSignal(id || `completion-${Math.random().toString(36).slice(2)}`);

  // Store completion state
  const completionState = useStore({
    completion: initialCompletion,
    isLoading: false,
    error: undefined as Error | undefined,
    input: initialInput,
  });

  // Abort controller to cancel the current API call
  const abortController = useSignal<AbortController | null>(null);

  // Store metadata that can change
  const extraMetadata = useStore({
    credentials,
    headers,
    body,
  });

  // Update metadata when props change
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => credentials);
    track(() => headers);
    track(() => body);
    
    extraMetadata.credentials = credentials;
    extraMetadata.headers = headers;
    extraMetadata.body = body;
  });

  const triggerRequest = $(async (prompt: string, options?: CompletionRequestOptions) =>
    callCompletionApi({
      api,
      prompt,
      credentials: extraMetadata.credentials,
      headers: { ...extraMetadata.headers, ...options?.headers },
      body: {
        ...extraMetadata.body,
        ...options?.body,
      },
      streamProtocol,
      fetch,
      // throttle streamed ui updates:
      setCompletion: throttle(
        (completion: string) => {
          completionState.completion = completion;
        },
        throttleWaitMs,
      ),
      setLoading: (loading: boolean) => {
        completionState.isLoading = loading;
      },
      setError: (error: Error | undefined) => {
        completionState.error = error;
      },
      setAbortController: (controller: AbortController | null) => {
        abortController.value = controller;
      },
      onFinish,
      onError,
    }),
  );

  const stop = $(() => {
    if (abortController.value) {
      abortController.value.abort();
      abortController.value = null;
    }
  });

  const setCompletion = $((completion: string) => {
    completionState.completion = completion;
  });

  const complete = $(async (prompt: string, options?: CompletionRequestOptions) => {
    return triggerRequest(prompt, options);
  });

  const setInput = $((input: string) => {
    completionState.input = input;
  });

  const handleSubmit = $((event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();
    return completionState.input ? complete(completionState.input) : undefined;
  });

  const handleInputChange = $((e: Event) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    completionState.input = target.value;
  });

  return {
    completion: completionState.completion,
    complete,
    error: completionState.error,
    setCompletion,
    stop,
    input: completionState.input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading: completionState.isLoading,
  };
}