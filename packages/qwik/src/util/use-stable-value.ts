import { useSignal, useVisibleTask$ } from '@builder.io/qwik';

/**
 * A hook that returns a stable reference to a value.
 * In Qwik, we use signals for reactive state management.
 */
export function useStableValue<T>(value: T): T {
  const stableRef = useSignal<T>(value);
  
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => value);
    stableRef.value = value;
  });
  
  return stableRef.value;
}