// Walks a locale layer and yields every string it carries, with the path that leads to it.
export function flattenStrings(value, prefix = '') {
  if (typeof value === 'string') {
    return [[prefix, value]];
  }

  if (value === null || typeof value !== 'object') {
    return [];
  }

  return Object.entries(value).flatMap(([key, nested]) =>
    flattenStrings(nested, prefix ? `${prefix}${Array.isArray(value) ? `[${key}]` : `.${key}`}` : key),
  );
}

/** The paths alone, list indices collapsed: two layers are symmetric whatever the length of their lists. */
export function stringPaths(value) {
  return [...new Set(flattenStrings(value).map(([path]) => path.replaceAll(/\[\d+]/g, '[]')))].sort();
}
