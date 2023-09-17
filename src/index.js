const { getTests } = require('find-cypress-specs')
// use child process
// execute changed spec
// write remote spec to system using git show
// compare two results
const { collectTests } = require('../src/testmanager.js')


const { jsonResults, tagTestCounts } = getTests(['remote.spec.js'])

const { jsonResults: newJsonResults, tagTestCounts: newTagTestCount } = getTests(['cypress/e2e/2-advanced-examples/connectors.cy.js'])
console.log(collectTests(newJsonResults['cypress/e2e/2-advanced-examples/connectors.cy.js'].tests))