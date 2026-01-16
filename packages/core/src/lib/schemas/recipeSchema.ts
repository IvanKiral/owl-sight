import { compile, type JSONSchema } from "json-schema-to-typescript";

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
      type: "number",
      description: "Preparation time in minutes",
    },
    cook_time: {
      type: "number",
      description: "Cooking time in minutes",
    },
    total_time: {
      type: "number",
      description: "Total time in minutes",
    },
    servings: {
      type: "number",
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
        enum: [
          "Chicken",
          "Pork",
          "Beef",
          "Fish",
          "Vegan",
          "Dessert",
          "Lactose-free",
          "Low-Sugar",
          "Cake",
        ],
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
} as const satisfies JSONSchema;

export const compileRecipeSchema = (schema: JSONSchema): Promise<string> =>
  compile(schema, schema.title ?? "Schema");
