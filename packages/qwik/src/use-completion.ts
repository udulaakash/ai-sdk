import type { CompletionRequestOptions, UseCompletionOptions } from 'ai';
import { callCompletionApi } from 'ai';
import { useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { throttle } from './throttle';

export type { UseCompletionOptions };

export type UseCompletionHelpers = {
  completion: { value: string };
  complete: (
    prompt: string,
    options?: CompletionRequestOptions,
  ) => Promise<string | null | undefined>;
  error: { value: undefined | Error };
  stop: () => void;
  setCompletion: (completion: string) => void;
  input: { value: string };
  handleInputChange: (event: { target: { value: string } }) => void;
  handleSubmit: (event?: { preventDefault?: () => void }) => void;
  isLoading: { value: boolean };
};

// Module-level keyed stores to share completion state across components with same key.
const completionStore = new Map<string, { value: string; subs: Set<(v: string) => void> }>();
const loadingStore = new Map<string, { value: boolean; subs: Set<(v: boolean) => void> }>();
const errorStore = new Map<string, { value: Error | undefined; subs: Set<(v: Error | undefined) => void> }>();

function getOrCreateStore<T>(
  map: Map<string, { value: T; subs: Set<(v: T) => void> }>,
  key: string,
  initial: T,
) {
  let entry = map.get(key);
  if (!entry) {
    entry = { value: initial, subs: new Set() };
    map.set(key, entry);
  }
  return entry;
}

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
}: UseCompletionOptions & { experimental_throttle?: number } = {}): UseCompletionHelpers {
  const completionId = id ?? 'qwik-completion';
  const key = `${api}|${completionId}`;

  const completionSig = useSignal<string>('');
  const loadingSig = useSignal<boolean>(false);
  const errorSig = useSignal<Error | undefined>(undefined);

  // keep latest extra options in closure
  let currentCredentials = credentials;
  let currentHeaders = headers;
  let currentBody = body;

  useVisibleTask$(({ cleanup }) => {
    const cStore = getOrCreateStore(completionStore, key, initialCompletion);
    const lStore = getOrCreateStore(loadingStore, `${completionId}-loading`, false);
    const eStore = getOrCreateStore(errorStore, `${completionId}-error`, undefined);

    // initialize local signals from shared state
    completionSig.value = cStore.value;
    loadingSig.value = lStore.value ?? false;
    errorSig.value = eStore.value;

    const cSub = (v: string) => (completionSig.value = v);
    const lSub = (v: boolean) => (loadingSig.value = v);
    const eSub = (v: Error | undefined) => (errorSig.value = v);

    cStore.subs.add(cSub);
    lStore.subs.add(lSub);
    eStore.subs.add(eSub);

    cleanup(() => {
      cStore.subs.delete(cSub);
      lStore.subs.delete(lSub);
      eStore.subs.delete(eSub);
    });
  });

  let abortController: AbortController | null = null;

  const mutate = (value: string) => {
    const cStore = getOrCreateStore(completionStore, key, value);
    cStore.value = value;
    completionSig.value = value;
    // notify subscribers
    cStore.subs.forEach(fn => fn(value));
  };

  const setLoading = (value: boolean) => {
    const lStore = getOrCreateStore(loadingStore, `${completionId}-loading`, value);
    lStore.value = value;
    loadingSig.value = value;
    lStore.subs.forEach(fn => fn(value));
  };

  const setError = (err: Error | undefined) => {
    const eStore = getOrCreateStore(errorStore, `${completionId}-error`, err);
    eStore.value = err;
    errorSig.value = err;
    eStore.subs.forEach(fn => fn(err));
  };

  const triggerRequest = async (prompt: string, options?: CompletionRequestOptions) =>
    callCompletionApi({
      api,
      prompt,
      credentials: currentCredentials,
      headers: { ...(currentHeaders as any), ...options?.headers },
      body: { ...(currentBody as any), ...options?.body },
      streamProtocol,
      fetch,
      setCompletion: throttle((v: string) => mutate(v), throttleWaitMs),
      setLoading,
      setError,
      setAbortController: controller => (abortController = controller),
      onFinish,
      onError,
    });

  const complete: UseCompletionHelpers['complete'] = async (prompt, options) => {
    return triggerRequest(prompt, options);
  };

  const stop = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  };

  const setCompletion = (value: string) => mutate(value);

  const input = useSignal<string>(initialInput);

  const handleSubmit = (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();
    return input.value ? complete(input.value) : undefined;
  };

  const handleInputChange = (e: { target: { value: string } }) => {
    input.value = e.target.value;
  };

  return {
    completion: completionSig,
    complete,
    error: errorSig,
    stop,
    setCompletion,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: loadingSig,
  };
}