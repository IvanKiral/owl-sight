import { describe, it, expect } from "vitest";
import type { Argv } from "yargs";
import { compose, type OptionBuilder } from "../../src/commands/helpers/commandOptionsComposer.js";

type A = { a: number };
type B = { b: string };
type C = { c: boolean };

function withA<I>(argv: Argv<I>): Argv<I & A> {
  return argv as unknown as Argv<I & A>;
}

function withB<I>(argv: Argv<I>): Argv<I & B> {
  return argv as unknown as Argv<I & B>;
}

function withC<I>(argv: Argv<I>): Argv<I & C> {
  return argv as unknown as Argv<I & C>;
}

describe("compose", () => {
  it("composes multiple option builders preserving types", () => {
    const composed = compose(withA, withB, withC);

    // Type-only check: ensure result type includes A & B & C when applied
    const _assertType = <I>(fn: (argv: Argv<I>) => Argv<I & A & B & C>) => fn;
    _assertType(composed);

    // Runtime: call with a minimal dummy Argv-like object
    const dummyArgv = {
      // Only properties touched by the test are needed; keep minimal
    } as unknown as Argv<{}>;

    const result = composed(dummyArgv);

    expect(result).toBeDefined();
  });

  it("works with no mixins (identity)", () => {
    const composed = compose();
    const dummyArgv = {} as unknown as Argv<{}>;
    const result = composed(dummyArgv);
    expect(result).toBe(dummyArgv);
  });

  it("composes simple yargs-like option builders", () => {
    type WithFoo = { foo: string };
    type WithBar = { bar: number };

    const withFoo: OptionBuilder<WithFoo> = <I>(argv: Argv<I>): Argv<I & WithFoo> =>
      argv.option("foo", { type: "string", describe: "Foo option" }) as unknown as Argv<
        I & WithFoo
      >;

    const withBar: OptionBuilder<WithBar> = <I>(argv: Argv<I>): Argv<I & WithBar> =>
      argv.option("bar", { type: "number", default: 1 }) as unknown as Argv<I & WithBar>;

    const calls: Array<{ key: string; opts: unknown }> = [];

    const dummyArgv = {
      option(key: string, opts?: unknown) {
        calls.push({ key, opts });
        return this;
      },
    } as unknown as Argv<{}>;

    const composed = compose(withFoo, withBar);
    const result = composed(dummyArgv);

    expect(result).toBe(dummyArgv);
    expect(calls.map((c) => c.key)).toEqual(["foo", "bar"]);
  });
});
