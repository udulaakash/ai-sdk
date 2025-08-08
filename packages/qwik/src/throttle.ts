import throttleit from 'throttleit';

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait?: number,
): T {
  return wait ? throttleit(fn, wait) : fn;
}