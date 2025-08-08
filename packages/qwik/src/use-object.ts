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
import type * as z3 from 'zod/v3';
import type * as z4 from 'zod/v4';
import { useSignal } from '@builder.io/qwik';

export type Experimental_UseObjectOptions<
  SCHEMA extends z4.core.$ZodType | z3.Schema | Schema,
  RESULT,
> = {
  api: string;
  schema: SCHEMA;
  id?: string;
  initialValue?: DeepPartial<RESULT>;
  fetch?: FetchFunction;
  onFinish?: (event: { object: RESULT | undefined; error: Error | undefined }) => Promise<void> | void;
  onError?: (error: Error) => void;
  headers?: Record<string, string> | Headers;
  credentials?: RequestCredentials;
};

export type Experimental_UseObjectHelpers<RESULT, INPUT> = {
  submit: (input: INPUT) => void;
  object: { value: DeepPartial<RESULT> | undefined };
  error: { value: Error | undefined };
  isLoading: { value: boolean };
  stop: () => void;
  clear: () => void;
};

export function experimental_useObject<
  SCHEMA extends z4.core.$ZodType | z3.Schema | Schema,
  RESULT = InferSchema<SCHEMA>,
  INPUT = any,
>({ api, schema, initialValue, fetch, onError, onFinish, headers, credentials }: Experimental_UseObjectOptions<
  SCHEMA,
  RESULT
>): Experimental_UseObjectHelpers<RESULT, INPUT> {
  const object = useSignal<DeepPartial<RESULT> | undefined>(initialValue as DeepPartial<RESULT> | undefined);
  const error = useSignal<Error | undefined>(undefined);
  const isLoading = useSignal<boolean>(false);

  let abortController: AbortController | null = null;

  const stop = () => {
    try {
      abortController?.abort();
    } catch {
    } finally {
      isLoading.value = false;
      abortController = null;
    }
  };

  const clearObject = () => {
    error.value = undefined;
    isLoading.value = false;
    object.value = undefined;
  };

  const submit = async (input: INPUT) => {
    try {
      clearObject();
      isLoading.value = true;

      const ac = new AbortController();
      abortController = ac;

      const actualFetch = fetch ?? globalThis.fetch;
      const response = await actualFetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(headers as any) },
        credentials,
        signal: ac.signal,
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error((await response.text()) ?? 'Failed to fetch the response.');
      }

      if (!response.body) {
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
              object.value = currentObject;
            }
          },
          async close() {
            isLoading.value = false;
            abortController = null;

            if (onFinish != null) {
              const validationResult = await safeValidateTypes({
                value: latestObject,
                schema: asSchema(schema),
              });

              onFinish(
                validationResult.success
                  ? { object: validationResult.value as RESULT, error: undefined }
                  : { object: undefined, error: validationResult.error },
              );
            }
          },
        }),
      );
    } catch (e) {
      if (isAbortError(e)) {
        return;
      }

      const err = e instanceof Error ? e : new Error(String(e));
      onError?.(err);
      isLoading.value = false;
      error.value = err;
    }
  };

  const clear = () => {
    stop();
    clearObject();
  };

  return { submit, object, error, isLoading, stop, clear };
}