interface ContactDetail {
  id: string;
}

interface SocialLink {
  href: string;
}

interface Profile<TContactDetail extends ContactDetail, TSocialLink extends SocialLink> {
  contactDetails: readonly TContactDetail[];
  socialLinks: readonly TSocialLink[];
}

export function resolveProfileDetails<TContactDetail extends ContactDetail, TSocialLink extends SocialLink>(
  profile: Profile<TContactDetail, TSocialLink>,
): {
  githubProfile: TSocialLink;
  linkedinProfile: TSocialLink;
  profileLocation: TContactDetail;
} {
  const profileLocation = profile.contactDetails.find(({ id }) => id === 'location');
  const githubProfile = profile.socialLinks.find(({ href }) => new URL(href).hostname === 'github.com');
  const linkedinProfile = profile.socialLinks.find(({ href }) => new URL(href).hostname.endsWith('linkedin.com'));

  if (!githubProfile || !linkedinProfile || !profileLocation) {
    throw new Error('The page requires the GitHub profile, LinkedIn profile and location from the CV data.');
  }

  return { githubProfile, linkedinProfile, profileLocation };
}

export function urlPathSegments(href: string, baseUrl?: string | URL): string[] {
  return new URL(href, baseUrl).pathname.split('/').filter(Boolean);
}
