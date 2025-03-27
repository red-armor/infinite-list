import { afterEach, beforeEach, describe, expect, it, test,vi  } from 'vitest';

import TaskRunner from './TaskRunner';
import * as all from './utils';

const mock = vi.fn();

// https://vitest.dev/guide/mocking#timers
// https://vitest.dev/api/vi.html#vi-advancetimersbytime

describe('scheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('should work', () => {
    const scheduler = new TaskRunner(mock, 50);
    scheduler.schedule();
    vi.useFakeTimers();
    vi.advanceTimersByTime(50);
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('test trailing is true', () => {
    const scheduler = new TaskRunner(mock, 50, {
      trailing: true,
    });
    scheduler.schedule();
    setTimeout(() => {
      scheduler.schedule();
    }, 5);
    vi.advanceTimersByTime(50);
    expect(mock).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(50);
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it('test trailing is false', () => {
    const scheduler = new TaskRunner(mock, 50, {
      trailing: false,
    });
    scheduler.schedule();
    setTimeout(() => {
      scheduler.schedule();
    }, 5);
    vi.useFakeTimers();
    vi.advanceTimersByTime(50);
    expect(mock).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(50);
    expect(mock).toHaveBeenCalledTimes(1);
  });

  /**
   * https://vitest.dev/guide/mocking.html#mocking-pitfalls
   * https://vitest.dev/guide/mocking.html#mock-an-exported-function
   * https://soorria.com/snippets/mocking-classes-vitest#mocking-static-methods
   * https://vitest.dev/guide/mocking#mock-an-exported-class-implementation
   */
  it('test usage of `_hasOverlappedTask`, then it run twice', () => {
    vi.spyOn(all, 'getNow').mockReturnValue(1000);

    // vi.mock('./utils.ts', async (importOriginal) => {
    //   const mod = await importOriginal();
    //   return {
    //     getNow: vi.fn(() => 1000),
    //   };
    // });
    const scheduler = new TaskRunner(mock, 50);
    scheduler.schedule();
    scheduler.schedule();
    vi.advanceTimersByTime(50);
    expect(mock).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(50);
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it('test usage of `_hasOverlappedTask`, comparing has param it only run once', () => {
    // vi.spyOn(all, 'getNow').mockReturnValue(1000);

    /**
     * How to overwrite a method of a class?
     */
    // TaskRunner.prototype.schedule = vi
    //   .fn()
    //   .mockImplementation(function (...args: any[]) {
    //     this._args = args;
    //     const invokeNext = this.shouldInvokeNext();
    //     const now = all.getNow();
    //     this._lastCallTime = now;

    //     if (!invokeNext) return;
    //     this.leadingEdge(now);
    //   });

    const scheduler = new TaskRunner(mock, 50);

    scheduler.schedule = vi.fn().mockImplementation((...args: any[]) => {
      scheduler._args = args;
      const invokeNext = scheduler.shouldInvokeNext();
      const now = all.getNow();
      /**
       * _lastCallTime is updated on every schedule invocation. comparing with _lastInvokeTime,
       * it only updates when `leadingEdge` is invoked.
       *
       */
      scheduler._lastCallTime = now;

      if (!invokeNext) return;
      scheduler.leadingEdge(now);
    });

    scheduler.schedule();
    scheduler.schedule();
    vi.advanceTimersByTime(50);
    expect(mock).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(50);
    expect(mock).toHaveBeenCalledTimes(1);
  });
});

describe('TaskRunner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('should execute immediately with default options', () => {
    const callback = vi.fn();
    const runner = new TaskRunner(callback, 100);

    runner.schedule('arg1', 'arg2');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('arg1', 'arg2');
  });

  test('should debounce multiple calls', () => {
    const callback = vi.fn();
    const runner = new TaskRunner(callback, 100);

    runner.schedule('first');
    runner.schedule('second');
    runner.schedule('third');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('first');

    vi.advanceTimersByTime(101);

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('third');
  });

  test('should respect leading: false option', () => {
    const callback = vi.fn();
    const runner = new TaskRunner(callback, 100, { leading: false });

    runner.schedule('test');

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('test');
  });

  test('should respect trailing: false option', () => {
    const callback = vi.fn();
    const runner = new TaskRunner(callback, 100, { trailing: false });

    runner.schedule('first');
    runner.schedule('second');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('first');

    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('should cancel pending execution', () => {
    const callback = vi.fn();
    const runner = new TaskRunner(callback, 100);

    runner.schedule('test');
    runner.cancel();

    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).not.toHaveBeenCalledTimes(2);
  });

  test('should flush immediately', () => {
    const callback = vi.fn();
    const runner = new TaskRunner(callback, 100);

    runner.schedule('scheduled');
    runner.flush('flushed');

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('flushed');
  });

  test('should handle overlapped tasks', () => {
    const callback = vi.fn();
    const runner = new TaskRunner(callback, 100);

    // Mock the same timestamp for multiple calls
    vi.spyOn(Date, 'now').mockReturnValue(1000);

    runner.schedule('first');
    runner.schedule('second');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('first');

    vi.advanceTimersByTime(200);

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('second');
  });

  test('should dispose and execute final callback when abort is false', () => {
    const callback = vi.fn(() => 'final');
    const runner = new TaskRunner(callback, 100);

    runner.schedule('test');
    const result = runner.dispose({ abort: false });

    expect(callback).toHaveBeenCalledTimes(2);
    expect(result).toBe('final');
  });

  test('should not execute callback on dispose when abort is true', () => {
    const callback = vi.fn();
    const runner = new TaskRunner(callback, 100);

    runner.schedule('test');
    const initialCalls = callback.mock.calls.length;
    runner.dispose({ abort: true });

    expect(callback).toHaveBeenCalledTimes(initialCalls);
  });
});
