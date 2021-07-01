// @ts-check
// @ts-ignore
import pkg from "./package.json";
import {onwarn, abortOnError} from "../../scripts/rollup";

import postcssImport from "postcss-import";
import typescript from "rollup-plugin-typescript2";
import postcss from "rollup-plugin-postcss";

/** @type {import("rollup").RollupOptions[]} */
const configs = [
    {
        input: "src/focus4.styling.ts",
        // @ts-ignore
        plugins: [typescript({abortOnError: false}), postcss({extract: true}), abortOnError],
        treeshake: {
            moduleSideEffects: false
        },
        output: {
            format: "esm",
            file: pkg.main
        },
        external: [...Object.keys(pkg.dependencies || {}), "i18next", "lodash", "react", "react/jsx-runtime", "tslib"],
        onwarn
    },
    {
        input: "src/variables/index.css",
        output: {file: "lib/variables.css"},
        plugins: [postcss({extract: true, plugins: [postcssImport()]})],
        onwarn
    },
    {
        input: "src/generator.ts",
        plugins: [typescript({abortOnError: false}), abortOnError],
        output: {
            format: "cjs",
            file: "lib/generator.js"
        },
        external: [...Object.keys(pkg.dependencies || {}), "fs", "lodash"],
        onwarn
    }
];

export default configs;
