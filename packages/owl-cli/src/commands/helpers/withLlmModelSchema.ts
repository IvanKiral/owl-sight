import type { Argv } from "yargs";

const USER_FACING_MODELS = ["gemini-flash-lite", "gemini-flash"] as const;

export type UserFacingModel = (typeof USER_FACING_MODELS)[number];

const MODEL_MAP = {
  "gemini-flash-lite": "gemini-flash-lite-latest",
  "gemini-flash": "gemini-flash-latest",
} as const satisfies Record<UserFacingModel, string>;

export const mapToApiModel = (userModel: UserFacingModel): string => {
  return MODEL_MAP[userModel];
};

export const yargsWithModel = <T>(yargs: Argv<T>) => {
  return yargs.option("llm-model", {
    alias: "m",
    describe: "Gemini model to use for recipe generation",
    type: "string",
    choices: USER_FACING_MODELS,
    default: "gemini-flash-lite",
  });
};
