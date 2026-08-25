import type { ClientProjectId, ContactDetailId, EmployerId, InstitutionId, InvariantContactDetailId } from '../data/cv.ts';

// The shape of a locale layer's CV content. `fr` and `en` are typed complete: a core entry added without its
// translation fails `astro check`, hence `npm run build` (see ADR 0007 §2).

type ContactDetailText<TId extends ContactDetailId> = TId extends InvariantContactDetailId
  ? { readonly title: string }
  : { readonly title: string; readonly info: string };

/** A name is invariant unless a layer overrides it; the override is optional, entry by entry. */
type NameOverride = { readonly name?: string };

export interface LocaleCv {
  readonly metadata: {
    readonly pageTitle: string;
    readonly pageDescription: string;
    readonly printablePageTitle: string;
  };
  readonly profile: NameOverride & {
    readonly imageAlt: string;
    readonly jobTitle: string;
    readonly contactDetails: { readonly [Id in ContactDetailId]: ContactDetailText<Id> };
    readonly resume: { readonly text: string };
  };
  readonly institutions: { readonly [Id in InstitutionId]: string };
  readonly about: {
    readonly title: string;
    readonly paragraphs: readonly string[];
  };
  readonly professionalExperience: {
    readonly title: string;
    readonly entries: { readonly [Id in EmployerId]: NameOverride & { readonly jobTitle: string } };
  };
  readonly clientProjects: {
    readonly title: string;
    readonly entries: { readonly [Id in ClientProjectId]: NameOverride & { readonly description: readonly string[] } };
  };
}

type DeepPartial<TValue> = TValue extends readonly unknown[]
  ? TValue
  : TValue extends object
    ? { readonly [Key in keyof TValue]?: DeepPartial<TValue[Key]> }
    : TValue;

/** A locale may override any CV leaf while inheriting every omitted value from French. */
export type PartialLocaleCv = DeepPartial<LocaleCv>;
