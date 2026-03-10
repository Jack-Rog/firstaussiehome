import { promises as fs } from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const projectRoot = process.cwd();
const schemaPath = path.join(projectRoot, "src", "lib", "stampDuty", "schema", "stampDutyRules.schema.json");
const rulesDirs = [
  path.join(projectRoot, "src", "lib", "stampDuty", "rules", "current"),
  path.join(projectRoot, "src", "lib", "stampDuty", "rules", "history"),
];

const optionalLegacySchemaPath = path.join(projectRoot, "stamp-duty-ruleset.schema.json");
const optionalLegacyExamplePath = path.join(projectRoot, "stamp-duty-example-ruleset.json");

async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function collectJsonFiles(targetDir) {
  const entries = await fs.readdir(targetDir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(targetDir, entry.name);

      if (entry.isDirectory()) {
        return collectJsonFiles(fullPath);
      }

      if (entry.isFile() && fullPath.endsWith(".json")) {
        return [fullPath];
      }

      return [];
    }),
  );

  return files.flat();
}

function formatAjvErrors(errors = []) {
  return errors.map((error) => {
    const pathLabel = error.instancePath || "/";
    return `${pathLabel} ${error.message ?? "validation error"}`;
  });
}

async function validateRulesSchema() {
  const schema = await readJson(schemaPath);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  const ruleFiles = (await Promise.all(rulesDirs.map((dir) => collectJsonFiles(dir)))).flat();
  const validationFailures = [];

  for (const ruleFile of ruleFiles) {
    const ruleJson = await readJson(ruleFile);
    const valid = validate(ruleJson);

    if (!valid) {
      validationFailures.push({
        file: path.relative(projectRoot, ruleFile),
        errors: formatAjvErrors(validate.errors ?? []),
      });
    }
  }

  if (validationFailures.length > 0) {
    console.error("Stamp duty rules validation failed:");

    for (const failure of validationFailures) {
      console.error(`- ${failure.file}`);
      for (const error of failure.errors) {
        console.error(`  * ${error}`);
      }
    }

    process.exit(1);
  }

  console.log(`Validated ${ruleFiles.length} stamp duty rules files against src/lib/stampDuty/schema/stampDutyRules.schema.json`);
}

async function validateLegacyReferenceFiles() {
  try {
    await fs.access(optionalLegacySchemaPath);
    await fs.access(optionalLegacyExamplePath);
  } catch {
    return;
  }

  const schema = await readJson(optionalLegacySchemaPath);
  const example = await readJson(optionalLegacyExamplePath);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const valid = validate(example);

  if (!valid) {
    console.error("Legacy reference ruleset validation failed (stamp-duty-example-ruleset.json):");
    for (const error of formatAjvErrors(validate.errors ?? [])) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("Validated legacy reference files: stamp-duty-example-ruleset.json");
}

await validateRulesSchema();
await validateLegacyReferenceFiles();
