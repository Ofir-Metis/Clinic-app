# TODO: Fix Test and Build Issues

Below are the main issues blocking a successful build/test run. Each item includes a detailed explanation and instructions for fixing or gathering more information.

---

## 1. CSS/Asset Import Errors in Jest
**Error:** SyntaxError: Unexpected token '.' when importing CSS (e.g., 'react-quill/dist/quill.snow.css').
**How to Fix:**
- Add a `moduleNameMapper` entry in your Jest config to mock CSS imports:
  ```js
  // jest.config.js or jest.config.ts
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  ```
- Install the mock package:
  ```sh
  yarn add -D identity-obj-proxy
  ```
- For more info: https://jestjs.io/docs/webpack#mocking-css-modules

---

## 2. TypeScript: `import.meta.env` Errors
**Error:** The 'import.meta' meta-property is only allowed when the '--module' option is 'es2020', 'es2022', 'esnext', 'system', 'node16', or 'nodenext'. Property 'env' does not exist on type 'ImportMeta'.
**How to Fix:**
- In `frontend/tsconfig.json`, set:
  ```json
  "module": "esnext"
  ```
- Add a type declaration for `import.meta.env`:
  1. Create `frontend/src/vite-env.d.ts` with:
     ```ts
     interface ImportMetaEnv {
       VITE_API_URL: string;
       VITE_GOOGLE_CLIENT_ID: string;
       // Add other env vars as needed
     }
     interface ImportMeta {
       readonly env: ImportMetaEnv;
     }
     ```
- For more info: https://vitejs.dev/guide/env-and-mode.html

---

## 3. Missing Type Declarations
**Error:** Could not find a declaration file for module 'zxcvbn' or 'react-big-calendar'.
**How to Fix:**
- Try installing types:
  ```sh
  yarn add -D @types/zxcvbn @types/react-big-calendar
  ```
- If not available, create a file (e.g., `frontend/src/types.d.ts`) and add:
  ```ts
  declare module 'zxcvbn';
  declare module 'react-big-calendar';
  ```
- For more info: https://www.typescriptlang.org/docs/handbook/modules.html#ambient-modules

---

## 4. Jest: SyntaxError for ES Modules in CommonJS Context
**Error:** SyntaxError: Cannot use import statement outside a module (in `libs/common` test files).
**How to Fix:**
- Ensure Jest is set up to handle ES modules or transpile TypeScript properly.
- In your Jest config, set:
  ```js
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  ```
- For more info: https://kulshekhar.github.io/ts-jest/docs/getting-started/installation/

---

## 5. Missing Environment Variable in Tests
**Error:** The OPENAI_API_KEY environment variable is missing or empty.
**How to Fix:**
- Set the variable in your test environment, or mock it in your test setup:
  ```js
  process.env.OPENAI_API_KEY = 'test-key';
  ```
- For more info: https://jestjs.io/docs/environment-variables

---

## 6. Testing Library Query Errors
**Error:** Unable to find an accessible element with the role "heading" and name `/calendar/i` or found multiple elements with the text of: /email/i.
**How to Fix:**
- Update your test queries to use the correct role or label.
- Use `getAllBy*` or `queryAllBy*` if multiple elements are expected.
- For more info: https://testing-library.com/docs/queries/about/

---

## 7. TypeScript Type Errors in Tests
**Error:** Type 'boolean | null' is not assignable to type 'boolean | undefined'. Parameter 'e' implicitly has an 'any' type.
**How to Fix:**
- Update your code to fix the type errors, e.g.:
  - Change `boolean | null` to `boolean | undefined` or handle `null`.
  - Add explicit types to parameters.
- For more info: https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html

---

## 8. Test Setup/Mocking Issues
**Error:** TypeError: Cannot destructure property 'basename' of 'React__namespace.useContext(...)' as it is null.
**How to Fix:**
- Ensure your test renders components within the correct context provider (e.g., `BrowserRouter` for React Router).
- For more info: https://reactrouter.com/en/main/routers/browser-router

---

## 9. Jest Worker/Process Errors
**Error:** Jest worker encountered 4 child process exceptions, exceeding retry limit.
**How to Fix:**
- Usually a symptom of other errors. Fix the above issues first, then re-run tests.
- For more info: https://github.com/facebook/jest/issues/11698

---

## How to Get More Info
- For any error, re-run the test with `--verbose` or check the full stack trace.
- Consult the official docs linked in each section for advanced troubleshooting. 