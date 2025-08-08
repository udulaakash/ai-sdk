import {
  FetchFunction,
  InferSchema,
  isAbortError,
  safeValidateTypes,
} from '@ai-sdk/provider-utils';
import {
  asSchema,
  DeepPartial,
  isDeepEqualData,
  parsePartialJson,
  Schema,
} from 'ai';
import { useSignal, useStore, $ } from '@builder.io/qwik';
import * as z3 from 'zod/v3';
import * as z4 from 'zod/v4';

// use function to allow for mocking in tests:
const getOriginalFetch = () => fetch;

export type Experimental_UseObjectOptions<
  SCHEMA extends z4.core.$ZodType | z3.Schema | Schema,
  RESULT,
> = {
  /**
   * The API endpoint. It should stream JSON that matches the schema as chunked text.
   */
  api: string;

  /**
   * A Zod schema that defines the shape of the complete object.
   */
  schema: SCHEMA;

  /**
   * An unique identifier. If not provided, a random one will be
   * generated. When provided, the `useObject` hook with the same `id` will
   * have shared states across components.
   */
  id?: string;

  /**
   * An optional value for the initial object.
   */
  initialValue?: DeepPartial<RESULT>;

  /**
   * Custom fetch implementation. You can use it as a middleware to intercept requests,
   * or to provide a custom fetch implementation for e.g. testing.
   */
  fetch?: FetchFunction;

  /**
   * Callback that is called when the stream has finished.
   */
  onFinish?: (event: {
    /**
     * The generated object (typed according to the schema).
     * Can be undefined if the final object does not match the schema.
     */
    object: RESULT | undefined;

    /**
     * Optional error object. This is e.g. a TypeValidationError when the final object does not match the schema.
     */
    error: Error | undefined;
  }) => Promise<void> | void;

  /**
   * Callback function to be called when an error is encountered.
   */
  onError?: (error: Error) => void;

  /**
   * Additional HTTP headers to be included in the request.
   */
  headers?: Record<string, string> | Headers;

  /**
   * The credentials mode to be used for the fetch request.
   * Possible values are: 'omit', 'same-origin', 'include'.
   * Defaults to 'same-origin'.
   */
  credentials?: RequestCredentials;
};

export type Experimental_UseObjectHelpers<RESULT, INPUT> = {
  /**
   * Calls the API with the provided input as JSON body.
   */
  submit: (input: INPUT) => void;

  /**
   * The current value for the generated object. Updated as the API streams JSON chunks.
   */
  object: DeepPartial<RESULT> | undefined;

  /**
   * The error object of the API request if any.
   */
  error: Error | undefined;

  /**
   * Flag that indicates whether an API request is in progress.
   */
  isLoading: boolean;

  /**
   * Abort the current request immediately, keep the current partial object if any.
   */
  stop: () => void;

  /**
   * Clear the object state.
   */
  clear: () => void;
};

function useObject<
  SCHEMA extends z4.core.$ZodType | z3.Schema | Schema,
  RESULT = InferSchema<SCHEMA>,
  INPUT = any,
>({
  api,
  id,
  schema,
  initialValue,
  fetch,
  onError,
  onFinish,
  headers,
  credentials,
}: Experimental_UseObjectOptions<
  SCHEMA,
  RESULT
>): Experimental_UseObjectHelpers<RESULT, INPUT> {
  // Generate a unique id if not provided
  const completionId = useSignal(id ?? `object-${Math.random().toString(36).slice(2)}`);

  // Store object state
  const objectState = useStore({
    object: initialValue as DeepPartial<RESULT> | undefined,
    error: undefined as Error | undefined,
    isLoading: false,
  });

  // Abort controller to cancel the current API call
  const abortControllerRef = useSignal<AbortController | null>(null);

  const stop = $(() => {
    try {
      abortControllerRef.value?.abort();
    } catch (ignored) {
      // Ignore abort errors
    } finally {
      objectState.isLoading = false;
      abortControllerRef.value = null;
    }
  });

  const submit = $(async (input: INPUT) => {
    try {
      clearObject();

      objectState.isLoading = true;

      const abortController = new AbortController();
      abortControllerRef.value = abortController;

      const actualFetch = fetch ?? getOriginalFetch();
      const response = await actualFetch(api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        credentials,
        signal: abortController.signal,
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(
          (await response.text()) ?? 'Failed to fetch the response.',
        );
      }

      if (response.body == null) {
        throw new Error('The response body is empty.');
      }

      let accumulatedText = '';
      let latestObject: DeepPartial<RESULT> | undefined = undefined;

      await response.body.pipeThrough(new TextDecoderStream()).pipeTo(
        new WritableStream<string>({
          async write(chunk) {
            accumulatedText += chunk;

            const { value } = await parsePartialJson(accumulatedText);
            const currentObject = value as DeepPartial<RESULT>;

            if (!isDeepEqualData(latestObject, currentObject)) {
              latestObject = currentObject;
              objectState.object = currentObject;
            }
          },

          async close() {
            objectState.isLoading = false;
            abortControllerRef.value = null;

            if (onFinish != null) {
              const validationResult = await safeValidateTypes({
                value: latestObject,
                schema: asSchema(schema),
              });

              onFinish(
                validationResult.success
                  ? { object: validationResult.value, error: undefined }
                  : { object: undefined, error: validationResult.error },
              );
            }
          },
        }),
      );
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      if (onError && error instanceof Error) {
        onError(error);
      }

      objectState.isLoading = false;
      objectState.error = error instanceof Error ? error : new Error(String(error));
    }
  });

  const clear = $(() => {
    stop();
    clearObject();
  });

  const clearObject = $(() => {
    objectState.error = undefined;
    objectState.isLoading = false;
    objectState.object = undefined;
  });

  return {
    submit,
    object: objectState.object,
    error: objectState.error,
    isLoading: objectState.isLoading,
    stop,
    clear,
  };
}

export const experimental_useObject = useObject;