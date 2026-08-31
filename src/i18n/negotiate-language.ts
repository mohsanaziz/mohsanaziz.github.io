// Source of the only script the site ships. It runs inline and synchronously in the <head> of the root,
// minified at build time by `inlineNegotiationScript`, which stringifies the function below: nothing outside
// it survives that stringification, so this module must stay free of value imports and of module scope.
export interface NegotiationConfiguration {
  // Search parameter whose mere presence pins an explicit choice; its value is never read.
  readonly parameter: string;
  // Path of the page carrying the script. A language resolving to it means staying put.
  readonly home: string;
  // Served path per language subtag. This map is the whole configuration: a fourth locale only adds an entry.
  readonly paths: Readonly<Record<string, string | undefined>>;
}

export function negotiateLanguage({ parameter, home, paths }: NegotiationConfiguration): void {
  const { search, hash } = location;

  if (new URLSearchParams(search).has(parameter)) return;

  for (const tag of navigator.languages) {
    const [language = tag] = tag.toLowerCase().split('-');
    const path = paths[language];

    if (path === undefined) continue;
    if (path !== home) location.replace(path + search + hash);

    return;
  }
}
