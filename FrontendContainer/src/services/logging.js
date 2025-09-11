const ENABLE_CONSOLE = true;

// PUBLIC_INTERFACE
export function logEvent(event, payload = {}) {
  /** Frontend event logger; pluggable to external backend in the future. */
  if (ENABLE_CONSOLE) {
    // eslint-disable-next-line no-console
    console.debug('[FlowQuest]', event, payload);
  }
  // Future: send to analytics endpoint
}
