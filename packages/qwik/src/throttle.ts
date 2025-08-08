import throttleFunction from 'throttleit';

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  waitMs: number | undefined,
): T {
  return waitMs != null ? (throttleFunction as any)(fn, waitMs) : fn;
}