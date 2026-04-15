import { useEffect, useRef } from 'react';

/**
 * Dan Abramov's useInterval hook.
 * Stores the latest callback in a ref so the interval always calls the
 * most-recent version without needing to be reset.
 *
 * @param {Function} callback - Function to call on each tick
 * @param {number|null} delay  - Interval in ms; pass null to pause
 */
export default function useInterval(callback, delay) {
  const savedCallback = useRef(callback);

  // Keep the ref up-to-date with the latest callback on every render
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval; clear and reset when delay changes, clear on unmount
  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => {
      savedCallback.current();
    }, delay);

    return () => clearInterval(id);
  }, [delay]);
}
