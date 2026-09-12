/** Register once and return the matching cleanup, including capture semantics. */
export function listen<E extends Event>(target: EventTarget, type: string, handler: (event: E) => void, capture = false): () => void {
  target.addEventListener(type, handler as EventListener, capture);
  return () => target.removeEventListener(type, handler as EventListener, capture);
}
