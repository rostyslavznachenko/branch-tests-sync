const { getTests } = require('find-cypress-specs')
const { execSync } = require('child_process')
const { collectTests, getDifferenceBetweenBranches } = require('../src/testmanager.js')
const debugGit = (debug)('branch-sync:git')
const debug = (debug)('branch-sync')
const arg = require('arg')
const fs = require('fs')

const args = arg({
    '--branch': string
})

const remoteBranch = arsg['--branch'] || main
const tempSpecFile = 'temp.spec.js'

const currentBranch = execSync('git branch --show-current').toString()
const changedSpecs = execSync(`npx find-cypress-specs --branch ${remoteBranch}`)
    .toString()
    .trim()
    .split(',')
    .filter(Boolean)
if (!changedSpecs)
{
    debug('There are no changed spec files in the current branch %s', currentBranch)
    debug('Exiting...')
    process.exit(0)
}

debug('Changed spec files are %s', changedSpecs)

// debug git
debugGit('Fetching changes from the remote repository \'%s\' and updates the local main branch with those changes.', remoteBranch)
execSync(`git fetch origin ${remoteBranch}:main`)
const results = {}
changedSpecs.forEach(changedSpec =>
{
    const { jsonResults, tagTestCounts } = getTests([changedSpec])

    debugGit('Checking if %s exist on remote repository', changedSpec)
    const checkIfSpecExists = execSync(`git ls-tree -r main --name-only | grep ${changedSpec} || true`).toString()
    if (checkIfSpecExists)
    {
        debug('Spec file %s exist on remote repository. Saving remote version and comparing with local')
        const tempRemote = execSync(`git show main:${changedSpec}`).toString()

        fs.writeFileSync(tempSpecFile, tempRemote, 'utf8')
        const { jsonResults: remoteJsonResults, tagTestCounts: remoteTagTestCounts } = getTests([tempSpecFile])

        const diff = getDifferenceBetweenBranches(
            collectTests(remoteJsonResults[tempSpecFile].tests),
            collectTests(jsonResults[changedSpec].tests))
        results[changedSpec] = diff
    } else
    {
        debug('Spec file %s doesn\'t exist on remote. Don\'t need to compare results with remote as we need to run the whole spec', changedSpec)
        results[changedSpec] = collectTests(jsonResults[changedSpec].tests)
    }
})

// debug - writing to file?
console.log(JSON.stringify(results, null, 2))

try
{
    debug('Deleting temporary spec file used for remote version')
    fs.unlinkSync(tempSpecFile);
} catch (err)
{
    console.error(`Error deleting file "${tempSpecFile}":`, err);
}