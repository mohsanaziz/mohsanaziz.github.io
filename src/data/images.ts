import type { ImageSource } from '@/data/cv';
import profilePhoto from '@/assets/photo.jpg';
import type { ImageMetadata } from 'astro';

// Astro side of the invariant core: the core names an image, this resolves it to the metadata `astro:assets`
// produces. The import is only resolvable by the Astro build, which is why the core names the file instead of
// importing it — the core, and the view that merges it with a locale layer, must keep loading in plain Node.
const IMAGE_ASSETS = {
  'photo.jpg': profilePhoto,
} as const satisfies Record<ImageSource, ImageMetadata>;

export function imageAsset(source: ImageSource): ImageMetadata {
  return IMAGE_ASSETS[source];
}
