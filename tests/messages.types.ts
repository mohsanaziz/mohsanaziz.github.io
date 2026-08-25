// Type tests: `astro check` runs them, `node --test` has nothing to run here. They keep the compile-time
// guarantees of the message layer honest, since a guard that stops biting fails no runtime assertion.
import type { ExactPlaceholders, MessageWith, PlaceholderNames } from '../src/i18n/messages.ts';

type Assert<TCheck extends true> = TCheck;

type Equals<TLeft, TRight> = [TLeft] extends [TRight] ? ([TRight] extends [TLeft] ? true : false) : false;

type Rejected<TSchema, TMessages> = Equals<ExactPlaceholders<TSchema, TMessages>[keyof TSchema], never>;

/** A message reads back exactly the placeholders it names. */
export type PlaceholdersAreRead = Assert<Equals<PlaceholderNames<'{count} versions de {mission}'>, 'count' | 'mission'>>;

/** A message that names no placeholder declares no parameter. */
export type PlainMessageHasNoParameters = Assert<Equals<PlaceholderNames<'Informations complémentaires'>, never>>;

/** A message naming exactly its declared placeholder is accepted. */
export type DeclaredPlaceholderAccepted = Assert<
  Equals<ExactPlaceholders<{ readonly greeting: MessageWith<'name'> }, { readonly greeting: 'Hello {name}' }>['greeting'], 'Hello {name}'>
>;

/** A message naming a placeholder its type does not declare is rejected — the hole this guard closes. */
export type UndeclaredPlaceholderRejected = Assert<
  Rejected<{ readonly greeting: MessageWith<'name'> }, { readonly greeting: 'Hello {name} from {city}' }>
>;

/** The rejection reaches leaves nested under the schema, not only its top level. */
export type UndeclaredPlaceholderRejectedWhenNested = Assert<
  Equals<
    ExactPlaceholders<
      { readonly counts: { readonly year: MessageWith<'count'> } },
      { readonly counts: { readonly year: '{count} ans sur {total}' } }
    >['counts']['year'],
    never
  >
>;
