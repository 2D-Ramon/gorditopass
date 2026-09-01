/** True only on localhost so demo shortcuts never show on the live site. */
export function isLocalDemoHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}
