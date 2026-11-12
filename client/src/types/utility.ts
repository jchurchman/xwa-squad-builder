/** The union of an object's value types, e.g. for `as const` objects used as enums. */
export type ValueOf<T> = T[keyof T];
