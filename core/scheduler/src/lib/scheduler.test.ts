import { describe, it, expect, vi } from 'vitest';
import Scheduler from './Scheduler';

import * as all from './utils';

const mock = vi.fn(() => console.log('executed'));

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
    const scheduler = new Scheduler(mock, 50);
    scheduler.schedule();
    vi.useFakeTimers();
    vi.advanceTimersByTime(50);
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('test trailing is true', () => {
    const scheduler = new Scheduler(mock, 50, {
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
    const scheduler = new Scheduler(mock, 50, {
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
  it('test usage of `_hasOverlappedTask`', () => {
    vi.spyOn(all, 'getNow').mockReturnValue(1000);

    // vi.mock('./Scheduler.ts', async (importOriginal) => {
    //   const mod = await importOriginal();
    //   return {
    //     ...mod,
    //     getNow: vi.fn(() => 1000),
    //   };
    // });
    const scheduler = new Scheduler(mock, 50);
    scheduler.schedule();
    scheduler.schedule();
    vi.advanceTimersByTime(50);
    expect(mock).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(50);
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it('test usage of `_hasOverlappedTask`', () => {
    vi.spyOn(all, 'getNow').mockReturnValue(1000);

    vi.mock('./Scheduler.ts', async (importOriginal) => {
      const mod = await importOriginal();
      return {
        ...mod,
        getNow: vi.fn(() => 1000),
      };
    });
    Scheduler.prototype.schedule = vi
      .fn()
      .mockImplementation(function (...args: any[]) {
        this._args = args;
        const invokeNext = this.shouldInvokeNext();
        const now = all.getNow();
        /**
         * _lastCallTime is updated on every schedule invocation. comparing with _lastInvokeTime,
         * it only updates when `leadingEdge` is invoked.
         *
         */
        this._lastCallTime = now;

        console.log('invokke ', invokeNext, now);

        if (!invokeNext) return;
        this.leadingEdge(now);
      });

    const scheduler = new Scheduler(mock, 50);

    // scheduler.schedule = vi.fn().mockImplementation((...args: any[]) => {
    //   scheduler._args = args;
    //   const invokeNext = scheduler.shouldInvokeNext();
    //   const now = getNow();
    //   /**
    //    * _lastCallTime is updated on every schedule invocation. comparing with _lastInvokeTime,
    //    * it only updates when `leadingEdge` is invoked.
    //    *
    //    */
    //   scheduler._lastCallTime = now;
    //   console.log('invokke ', invokeNext, now)

    //   if (!invokeNext) return;
    //   scheduler.leadingEdge(now);
    // })

    scheduler.schedule();
    scheduler.schedule();
    vi.advanceTimersByTime(50);
    expect(mock).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(50);
    expect(mock).toHaveBeenCalledTimes(1);
  });
});
