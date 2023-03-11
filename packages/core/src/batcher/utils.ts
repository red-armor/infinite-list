/**
 * Schedules a microtask.
 * This can be useful to schedule state updates after rendering.
 */
export function scheduleMicrotask(callback: () => void): void {
  Promise.resolve()
    .then(callback)
    .catch((error) =>
      setTimeout(() => {
        throw error;
      })
    );
}
