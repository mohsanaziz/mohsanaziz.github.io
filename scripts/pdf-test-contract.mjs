export const PAGINATION_TEST_LOCALES = ['fr', 'ar'];

export function paginationTestMarker(boundary, kind, id) {
  return `PAGINATION_TEST_${kind.toUpperCase()}_${boundary.toUpperCase()}_${id.replaceAll('.', '_')}_X`;
}

export function extractPaginationTestMarkers(text) {
  return Array.from(text.matchAll(/PAGINATION_TEST_(MISSION|EMPLOYER)_(START|END)_(\d+(?:_\d+)?)_X/g), ([marker, kind, boundary, id]) => ({
    marker,
    boundary: boundary.toLowerCase(),
    kind: kind.toLowerCase(),
    id: id.replaceAll('_', '.'),
  }));
}
