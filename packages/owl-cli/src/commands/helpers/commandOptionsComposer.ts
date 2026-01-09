import type { Argv } from "yargs";

export type OptionBuilder<T> = <I>(argv: Argv<I>) => Argv<T>;
type OutputOf<M> = M extends OptionBuilder<infer T> ? T : never;
type UnionOfOutputs<M extends readonly OptionBuilder<unknown>[]> = OutputOf<M[number]>;

type UnionToIntersection<U> = (U extends unknown ? (arg: U) => void : never) extends (
  arg: infer I,
) => void
  ? I
  : never;

// biome-ignore lint/suspicious/noExplicitAny: intentional any
export function compose<M extends readonly OptionBuilder<any>[]>(
  ...mixins: M
): <I>(argv: Argv<I>) => Argv<I & UnionToIntersection<UnionOfOutputs<M>>> {
  return (argv) => mixins.reduce((acc, m) => m(acc), argv);
}
