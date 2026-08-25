// The repository shell quotes the GitHub interface, which exists in English only: this vocabulary stays in
// English in every locale and out of the translation store (see ADR 0007 §2). Visible consequence on the
// French page: “Languages”, “Contributors” and “Summary” replace their French equivalents.
export const GITHUB_LEXICON = {
  readme: 'README.md',
  repository: 'cv',
  visibility: 'Public',
  default: 'default',
  releases: 'Releases',
  latest: 'Latest',
  languages: 'Languages',
  contributors: 'Contributors',
  stack: 'Stack',
  summary: 'Summary',
} as const;
