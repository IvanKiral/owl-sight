import type { JSONSchema4 } from "json-schema";
export const DEFAULT_RECIPE_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "Recipe Schema",
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Recipe title",
    },
    description: {
      type: "string",
      description: "Brief description",
    },
    prep_time: {
      type: "string",
      description: "Preparation time (e.g., '15 minutes')",
    },
    cook_time: {
      type: "string",
      description: "Cooking time (e.g., '30 minutes')",
    },
    total_time: {
      type: "string",
      description: "Total time (e.g., '45 minutes')",
    },
    servings: {
      type: ["string", "number"],
      description: "Number of servings",
    },
    ingredients: {
      type: "array",
      description: "List of ingredients",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          amount: { type: ["string", "number"] },
          unit: { type: "string" },
        },
        required: ["name"],
      },
    },
    instructions: {
      type: "array",
      description: "Step-by-step instructions",
      items: { type: "string" },
      minItems: 1,
    },
    tags: {
      type: "array",
      description: "Custom tags for classification",
      items: {
        type: "string",
      },
      uniqueItems: true,
    },
    difficulty: {
      type: "string",
      description: "Difficulty level",
      enum: ["easy", "medium", "hard"],
    },
    cuisine: {
      type: "string",
      description: "Type of cuisine (e.g., Italian, Indian)",
    },
  },
  required: ["title", "ingredients", "instructions"],
  additionalProperties: false,
} as const satisfies JSONSchema4;
