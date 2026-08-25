import type { Contract } from '../data/cv.ts';
import type { MissionStatus } from '../data/missions.ts';

// A message carrying named placeholders declares them once, in its own type: the layers cannot write a
// message without them, and `formatMessage` reads the parameters back from the literal at every call site.
export type MessageWith<TPlaceholder extends string> = `${string}{${TPlaceholder}}${string}`;

export type PlaceholderNames<TMessage extends string> = TMessage extends `${string}{${infer Name}}${infer Rest}`
  ? Name | PlaceholderNames<Rest>
  : never;

// Declaring a placeholder is one half of the contract; the other half is naming no other. `MessageWith` only
// demands a presence, so this walks the schema beside the written messages and refuses any leaf that names a
// placeholder its own type does not — which nothing else would catch, since the callers that fill a message
// in read their parameters from the schema. A rejected leaf collapses to `never` and the layer fails to
// compile on the offending key.
export type ExactPlaceholders<TSchema, TMessages> = {
  readonly [Key in keyof TSchema]: Key extends keyof TMessages
    ? TSchema[Key] extends string
      ? TMessages[Key] extends string
        ? [PlaceholderNames<TMessages[Key]>] extends [PlaceholderNames<TSchema[Key]>]
          ? TMessages[Key]
          : never
        : never
      : ExactPlaceholders<TSchema[Key], TMessages[Key]>
    : never;
};

// `Intl.PluralRules` selects the form; `other` is the fallback for the categories a locale leaves out,
// which is what will carry the six Arabic forms without changing a single call site.
export type PluralMessage = { readonly [Category in Intl.LDMLPluralRule]?: MessageWith<'count'> } & {
  readonly one: MessageWith<'count'>;
  readonly other: MessageWith<'count'>;
};

export interface LocaleMessages {
  readonly navigation: {
    readonly additionalInformation: string;
  };
  readonly languageSelector: {
    readonly switchLanguage: string;
    readonly interfaceOnly: string;
  };
  readonly labels: {
    readonly contact: string;
    readonly contract: string;
    readonly period: string;
    readonly duration: string;
    readonly missions: string;
    readonly client: string;
    readonly status: string;
    readonly employer: string;
    readonly version: string;
  };
  readonly contract: { readonly [Token in Contract]: string };
  readonly missionStatus: { readonly [Token in MissionStatus]: string };
  readonly dates: {
    readonly present: string;
  };
  readonly counts: {
    readonly employer: PluralMessage;
    readonly year: PluralMessage;
    readonly month: PluralMessage;
    readonly mission: PluralMessage;
    readonly version: PluralMessage;
  };
  readonly accessibility: {
    readonly missionStack: MessageWith<'mission'>;
  };
  readonly punctuation: {
    /** Colon closing a field label, with the spacing its locale demands. */
    readonly labelColon: string;
  };
  readonly print: {
    readonly contactDetails: string;
    readonly experienceAndClientProjects: string;
    readonly client: string;
    readonly environment: string;
  };
}

export type CountKey = keyof LocaleMessages['counts'];

/** Declares a locale's messages: complete against the schema, literal-typed, and exact on placeholders. */
export function defineMessages<const TMessages extends LocaleMessages>(
  messages: TMessages & ExactPlaceholders<LocaleMessages, TMessages>,
): TMessages {
  return messages;
}

export function formatMessage<TMessage extends string>(
  message: TMessage,
  values: Readonly<Record<PlaceholderNames<TMessage>, string | number>>,
): string {
  return message.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = (values as Readonly<Record<string, string | number | undefined>>)[name];

    if (value === undefined) {
      throw new Error(`The message "${message}" has no value for the placeholder "${placeholder}".`);
    }

    return String(value);
  });
}
