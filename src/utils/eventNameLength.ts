/**
 * Maximum number of characters allowed in an event's `friendly_name`.
 *
 * The most space-constrained place a title is shown is the portrait card
 * (`src/components/Card.tsx`), a `line-clamp-2` overlay ~128-144px wide at 14px.
 * Beyond ~35 characters the title wraps past two lines and gets truncated with
 * an ellipsis, so keep `friendly_name` at or under this limit.
 */
export const MAX_FRIENDLY_NAME_LENGTH = 35;
