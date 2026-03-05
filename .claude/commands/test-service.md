Run tests for a specific service and analyze results. Service name provided as: $ARGUMENTS

If no service name provided, ask which service to test.

Steps:
1. Build common library first: `yarn workspace @clinic/common build`
2. Run tests: `yarn workspace @clinic/$ARGUMENTS test --coverage`
3. Analyze test results - identify any failures
4. If tests fail, read the failing test file and the source it tests
5. Suggest fixes for any failing tests
6. Report coverage summary
