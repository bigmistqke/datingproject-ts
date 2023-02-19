type RawNarrow<T> =
  | (T extends [] ? [] : never)
  | (T extends string | number | bigint | boolean ? T : never)
  | { [K in keyof T]: T[K] extends Function ? T[K] : RawNarrow<T[K]> };

export type Narrow<A extends any> = Try<A, [], RawNarrow<A>>;

type Try<A1 extends any, A2 extends any, Catch = never> = A1 extends A2 ? A1 : Catch;
