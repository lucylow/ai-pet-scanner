/**
 * Normalizes known provider enum-like values for localization lookup.
 * Unknown values must still be rendered from their original text so provider
 * evidence is never silently rewritten.
 */
export function normalizeProviderToken(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_]+/g, "-");
}

export function providerCopyKey<Key extends string>(value: string, knownKeys: Readonly<Record<string, Key>>): Key | undefined {
  return knownKeys[normalizeProviderToken(value)];
}
