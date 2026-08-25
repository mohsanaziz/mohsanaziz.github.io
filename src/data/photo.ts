import profilePhoto from '@/assets/photo.jpg';

// The portrait is invariant, but it is imported through `astro:assets`, which only the Astro build resolves.
// It therefore stays out of the CV core so that the core keeps loading in plain Node — tests included.
export const profileImage = {
  src: profilePhoto,
  width: profilePhoto.width,
  height: profilePhoto.height,
} as const;
