function collectTests(testData)
{
    const collectedTests = [];

    function collect(suite)
    {
        if (suite.tests)
        {
            collectedTests.push(...suite.tests);
        }

        if (suite.suites)
        {
            for (const innerSuite of suite.suites)
            {
                collect(innerSuite);
            }
        }
    }

    collect(testData[0]);

    return collectedTests;
}

function getDifferenceBetweenBranches(remoteTests, branchTests)
{
    return branchTests.filter(branchTest => !remoteTests.some(remoteTest => remoteTest.name === branchTest.name));
}

module.exports = {
    collectTests,
    getDifferenceBetweenBranches
}