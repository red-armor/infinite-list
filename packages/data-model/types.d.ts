interface IdleRequestCallback {
  (deadline: IdleDeadline): void;
}
/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/IdleDeadline) */
interface IdleDeadline {
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/IdleDeadline/didTimeout) */
  readonly didTimeout: boolean;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/IdleDeadline/timeRemaining) */
  timeRemaining(): DOMHighResTimeStamp;
}
interface IdleRequestOptions {
  timeout?: number;
}

declare function requestIdleCallback(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number;
