Review the current changes for code quality, security, and correctness.

Steps:
1. Run `git diff` to see all current changes
2. Run `git diff --staged` for staged changes
3. For each changed file, review for:
   - Security issues (SQL injection, XSS, exposed secrets)
   - Missing input validation
   - Hardcoded strings that should use translation system
   - Missing error handling
   - TypeORM gotchas (undefined vs null, unescaped LIKE)
   - Correct terminology (Client not Patient, Coach not Therapist in UI)
4. Run lint: `yarn lint`
5. Identify any files that need tests
6. Provide a structured review with actionable feedback
