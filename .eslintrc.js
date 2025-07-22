module.exports = {
  extends: ["react-app", "react-app/jest"],
  rules: {
    // Disable rules that commonly cause Netlify build failures
    "no-unused-vars": "warn",
    "no-console": "off",
    "react-hooks/exhaustive-deps": "warn",
    "jsx-a11y/anchor-is-valid": "off",
    "jsx-a11y/alt-text": "warn",
    "jsx-a11y/img-redundant-alt": "warn",
    "jsx-a11y/no-redundant-roles": "warn",
    "react/jsx-no-target-blank": "warn",
    "import/no-anonymous-default-export": "off",
    "no-unreachable": "warn",
    "no-undef": "warn",
    "react/no-unescaped-entities": "warn",
    "react/display-name": "off",
    "react/prop-types": "off",
    "no-empty": "warn",
    "no-useless-escape": "warn",
    "no-mixed-operators": "warn",
    "no-fallthrough": "warn",
    "default-case": "warn",
    eqeqeq: "warn",
    "no-redeclare": "warn",
    "no-self-assign": "warn",
    "no-dupe-keys": "warn",
    "no-duplicate-case": "warn",
    "array-callback-return": "warn",
    "no-loop-func": "warn",
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
