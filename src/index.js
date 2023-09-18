const { getTests } = require('find-cypress-specs')
const { execSync } = require('child_process');
const { collectTests, getDifferenceBetweenBranches } = require('../src/testmanager.js')
const fs = require('fs')

const TEMP_FILE_NAME = 'temp.spec.js'

const currentBranch = execSync('git branch --show-current').toString()
const changedSpecs = execSync('npx find-cypress-specs --branch main')
    .toString()
    .trim()
    .split(',')
    .filter(Boolean)
if (!changedSpecs)
{
    console.log(`There are no changed spec files in the current branch: ${currentBranch}`)
}

console.log(changedSpecs)
execSync('git fetch origin main:main')
const results = {}
changedSpecs.forEach(changedSpec =>
{
    const { jsonResults, tagTestCounts } = getTests([changedSpec])

    const checkIfSpecExists = execSync(`git ls-tree -r main --name-only | grep ${changedSpec} || true`).toString()
    if (checkIfSpecExists)
    {
        console.log(`Spec file ${changedSpec} exist on remote. Comparing results`)
        const tempRemote = execSync(`git show main:${changedSpec}`).toString()

        fs.writeFileSync(TEMP_FILE_NAME, tempRemote, 'utf8')
        const { jsonResults: remoteJsonResults, tagTestCounts: remoteTagTestCounts } = getTests([TEMP_FILE_NAME])


        const diff = getDifferenceBetweenBranches(
            collectTests(remoteJsonResults[TEMP_FILE_NAME].tests),
            collectTests(jsonResults[changedSpec].tests))
        results[changedSpec] = diff
    } else
    {
        console.log(`Spec file doesn't exist on remote. Don't need to compare results with remote as we need to run whole spec. Spec file ${changedSpec}`)
        results[changedSpec] = collectTests(jsonResults[changedSpec].tests)
    }
})

try
{
    fs.unlinkSync(TEMP_FILE_NAME);
    console.log(`File "${TEMP_FILE_NAME}" has been deleted.`);
} catch (err)
{
    console.error(`Error deleting file "${TEMP_FILE_NAME}":`, err);
}
console.log(JSON.stringify(results, null, 2))