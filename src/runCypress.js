const cypress = require("cypress");
const yargs = require("yargs");
const fs = require("fs").promises;

const cypressArgs = process.argv.slice(2);

const { tests } = yargs.option("tests", {
  type: "string",
  default: "",
  describe:
    "	The name (or path) of a FILE containing a list of tests and specs to run",
}).argv;

function removeTestsArgFromCypressArgs() {
  const testsPos = cypressArgs.findIndex((a) => a === "--tests");
  if (testsPos !== -1) {
    cypressArgs.splice(testsPos, 2);
  }
}

function getCypressArgs() {
  const cypressCommandIndex = cypressArgs.indexOf("cypress");

  return cypressArgs.slice(cypressCommandIndex);
}

async function getCypressRunOptions() {
  removeTestsArgFromCypressArgs();

  return await cypress.cli.parseRunArguments(getCypressArgs());
}

async function parseFile() {
  const isFilePresent = await fs
    .access(tests)
    .then(() => true)
    .catch(() => false);
  if (isFilePresent) {
    const content = await fs.readFile(tests, "utf-8");

    try {
      return JSON.parse(content);
    } catch (err) {
      console.log(`Error while parsing the content of a file ${tests}`);
      process.exit(1);
    }
  }
}

async function run() {
  const options = await getCypressRunOptions();
  const testsData = await parseFile();
  if (testsData) {
    options.spec = testsData.specs;
    options.env = {
      grep: testsData.testTitles,
      grepFilterSpecs: true,
      grepOmitFiltered: true,
    };
  }

  cypress.run(options).then((results) => {
    if (results.totalFailed > 0 || results.totalSkipped > 0) {
      console.log("Some tests failed. Please review");
      process.exit(1);
    }
  });
}

run().catch((err) => {
  console.log(`Error ${err.message}`);
  process.exit(1);
});
