// @ts-check
// @ts-ignore
import pkg from "./package.json";
import {onwarn, abortOnError} from "../../scripts/rollup";

import typescript from "rollup-plugin-typescript2";
import postcss from "rollup-plugin-postcss";
import copy from "rollup-plugin-copy-glob";

import {generateTypings} from "@focus4/styling/lib/generator";

export default (async () => {
    await generateTypings("src");

    /** @type {import("rollup").RollupOptions} */
    const config = {
        input: "src/focus4.layout.tsx",
        plugins: [
            // @ts-ignore
            postcss({extract: true, modules: true}),
            typescript({abortOnError: false}),
            copy([
                {files: "src/header/**/*.css.d.ts", dest: "lib/header"},
                {files: "src/menu/**/*.css.d.ts", dest: "lib/menu"},
                {files: "src/presentation/**/*.css.d.ts", dest: "lib/presentation"},
                {files: "src/scrollable/**/*.css.d.ts", dest: "lib/scrollable"},
                {files: "src/utils/**/*.css.d.ts", dest: "lib/utils"}
            ]),
            abortOnError
        ],
        treeshake: {
            moduleSideEffects: ["intersection-observer"]
        },
        output: {
            format: "esm",
            file: "lib/focus4.layout.js"
        },
        external: [
            ...Object.keys(pkg.dependencies || {}),
            "classnames",
            "i18next",
            "lodash",
            "mobx",
            "mobx-react",
            "moment",
            "popmotion",
            "react",
            "react/jsx-runtime",
            "react-dom",
            "tslib"
        ],
        onwarn
    };
    return config;
})();
