const { getTests } = require('find-cypress-specs')
const { execSync } = require('child_process')
const { collectTests, getDifferenceBetweenBranches } = require('../src/testmanager.js')
const arg = require('arg')
const fs = require('fs')

const args = arg({
    '--branch': string
})

const remoteBranch = arsg['--branch'] || main
const tempSpecFile = 'temp.spec.js'

const currentBranch = execSync('git branch --show-current').toString()
const changedSpecs = execSync('npx find-cypress-specs --branch main')
    .toString()
    .trim()
    .split(',')
    .filter(Boolean)
if (!changedSpecs)
{
    // add debug line here
    console.log(`There are no changed spec files in the current branch: ${currentBranch}`)
}

// print spec files
console.log(changedSpecs)

// debug git
execSync('git fetch origin main:main')
const results = {}
changedSpecs.forEach(changedSpec =>
{
    const { jsonResults, tagTestCounts } = getTests([changedSpec])

    // debug git
    const checkIfSpecExists = execSync(`git ls-tree -r main --name-only | grep ${changedSpec} || true`).toString()
    if (checkIfSpecExists)
    {
        // debug
        console.log(`Spec file ${changedSpec} exist on remote. Comparing results`)
        const tempRemote = execSync(`git show main:${changedSpec}`).toString()

        // debug
        fs.writeFileSync(tempSpecFile, tempRemote, 'utf8')
        const { jsonResults: remoteJsonResults, tagTestCounts: remoteTagTestCounts } = getTests([tempSpecFile])

        const diff = getDifferenceBetweenBranches(
            collectTests(remoteJsonResults[tempSpecFile].tests),
            collectTests(jsonResults[changedSpec].tests))
        results[changedSpec] = diff
    } else
    {
        // debug
        console.log(`Spec file doesn't exist on remote. Don't need to compare results with remote as we need to run whole spec. Spec file ${changedSpec}`)
        results[changedSpec] = collectTests(jsonResults[changedSpec].tests)
    }
})

try
{
    // debug
    fs.unlinkSync(tempSpecFile);
    console.log(`File "${tempSpecFile}" has been deleted.`);
} catch (err)
{
    console.error(`Error deleting file "${tempSpecFile}":`, err);
}

// debug - writing to file?
console.log(JSON.stringify(results, null, 2))