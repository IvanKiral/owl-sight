import type { WithError } from "shared";
import type { CommandModule } from "yargs";
import {
  checkFileExists,
  checkWhisper,
  checkYtDlp,
  type DependencyCheckResult,
} from "../../lib/doctor/checks.js";
import { userRecipeConfigSchemaPath } from "../../lib/recipeSchema.js";

export const doctorCommand: CommandModule = {
  command: "doctor",
  describe: "Check system dependencies and configuration",

  handler: async () => {
    console.log("🩺 Running diagnostics...\n");

    const dependencies = [
      { name: "whisper", checkFn: checkWhisper },
      { name: "yt-dlp", checkFn: checkYtDlp },
    ];

    const [dependencyResults, schemaResult] = await Promise.all([
      Promise.all(dependencies.map(async (dep) => checkDependency(dep.name, dep.checkFn))),
      checkRecipeSchema(),
    ]);

    const allResults = [...dependencyResults, schemaResult];

    printResults(allResults);

    const exitCode = printSummary(allResults);
    process.exit(exitCode);
  },
};

type CheckResult = Readonly<{
  name: string;
  isHealthy: boolean;
  message: string;
}>;

const checkDependency = async (
  name: string,
  checkFn: () => Promise<WithError<DependencyCheckResult, string>>,
): Promise<CheckResult> => {
  const result = await checkFn();

  if (!result.success) {
    return {
      name,
      isHealthy: false,
      message: `❌ Error checking ${name}: ${result.error}`,
    };
  }

  const { installed, version } = result.result;

  if (!installed) {
    return {
      name,
      isHealthy: false,
      message: `❌ ${name}: Not found`,
    };
  }

  return {
    name,
    isHealthy: true,
    message: `✅ ${name}${version ? `: ${version}` : ""}`,
  };
};

const checkRecipeSchema = async (): Promise<CheckResult> => {
  const result = await checkFileExists(userRecipeConfigSchemaPath);

  if (!result) {
    return {
      name: "Recipe Schema",
      isHealthy: false,
      message: "❌ Status: Not created",
    };
  }

  return {
    name: "Recipe Schema",
    isHealthy: true,
    message: "✅ Status: Created",
  };
};

const printResults = (results: ReadonlyArray<CheckResult>) => {
  const dependencyResults = results.filter((r) => r.name !== "Recipe Schema");
  const schemaResult = results.find((r) => r.name === "Recipe Schema");

  console.log("Dependencies:");
  dependencyResults.forEach((result) => {
    console.log(`  ${result.message}`);
  });

  if (schemaResult) {
    console.log("\nRecipe Schema:");
    console.log(`  📁 Path: ${userRecipeConfigSchemaPath}`);
    console.log(`  ${schemaResult.message}`);
  }
};

const printSummary = (results: ReadonlyArray<CheckResult>) => {
  const issueCount = results.filter((r) => !r.isHealthy).length;

  console.log(`\n${"─".repeat(50)}`);

  if (issueCount === 0) {
    console.log("✨ All checks passed!");
    return 0;
  }

  console.log(`⚠️  Summary: ${issueCount} issue${issueCount > 1 ? "s" : ""} found`);
  return 1;
};
