import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// Extract the @typescript-eslint plugin from next's config
const tsPlugin = nextCoreWebVitals.find(
    (c) => c.name === "next/typescript"
)?.plugins?.["@typescript-eslint"];

const eslintConfig = [
    ...nextCoreWebVitals,
    {
        plugins: {
            "@typescript-eslint": tsPlugin,
        },
        rules: {
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/no-explicit-any": "warn",
            "react-hooks/exhaustive-deps": "warn",
            "react/no-unescaped-entities": "off",
            "prefer-const": "warn",
            "no-console": ["warn", { allow: ["warn", "error"] }],
        },
    },
    {
        ignores: ["node_modules/", ".next/", "out/"],
    },
];

export default eslintConfig;
