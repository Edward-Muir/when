/**
 * Device fingerprinting utility for leaderboard submissions.
 * Generates a stable device ID that persists across sessions.
 */

const DEVICE_ID_KEY = 'when-device-id';

/**
 * Get the device fingerprint, generating one if it doesn't exist.
 */
export async function getDeviceFingerprint(): Promise<string> {
  // Check for existing fingerprint
  const stored = localStorage.getItem(DEVICE_ID_KEY);
  if (stored) return stored;

  // Generate new fingerprint
  const fingerprint = await generateFingerprint();
  localStorage.setItem(DEVICE_ID_KEY, fingerprint);
  return fingerprint;
}

/**
 * Generate a fingerprint from browser-available signals.
 * Combines stable device properties with a random component for uniqueness.
 */
async function generateFingerprint(): Promise<string> {
  const components: string[] = [];

  // Screen properties (stable across sessions)
  components.push(`${window.screen.width}x${window.screen.height}`);
  components.push(`${window.screen.colorDepth}`);
  components.push(`${window.devicePixelRatio}`);

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Language
  components.push(navigator.language);

  // Platform
  components.push(navigator.platform);

  // Hardware concurrency (number of CPU cores)
  components.push(`${navigator.hardwareConcurrency || 0}`);

  // Touch support
  components.push(`${navigator.maxTouchPoints || 0}`);

  // Random component for uniqueness (ensures different users with same hardware get different IDs)
  const randomPart = crypto.randomUUID().slice(0, 8);
  components.push(randomPart);

  // Hash all components together
  const data = components.join('|');
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  // Return first 32 characters of the hash
  return hashHex.slice(0, 32);
}

/**
 * Clear the stored device fingerprint (for testing purposes).
 */
export function clearDeviceFingerprint(): void {
  localStorage.removeItem(DEVICE_ID_KEY);
}
