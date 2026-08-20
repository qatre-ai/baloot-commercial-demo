export function deferEffect(task: () => void | Promise<void>): void {
  queueMicrotask(() => {
    void task();
  });
}
