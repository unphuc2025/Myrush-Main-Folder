/**
 * A safe UUID v4 generator that works in both secure (HTTPS) and
 * non-secure (HTTP) contexts.
 *
 * `crypto.randomUUID()` is only available in secure contexts (HTTPS / localhost).
 * On plain HTTP deployments it throws, crashing the entire app.
 * This helper falls back to a manual RFC 4122 v4 UUID using `crypto.getRandomValues`,
 * which IS available on HTTP.
 */
export function generateUUID(): string {
    // Use native randomUUID if available (secure context)
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    // Fallback: manual UUID v4 using crypto.getRandomValues (works on HTTP)
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        // Set version (4) and variant (RFC 4122) bits
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    // Last resort: Math.random (not cryptographically secure, but never crashes)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}
