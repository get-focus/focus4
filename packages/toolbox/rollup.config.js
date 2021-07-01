// @ts-check
// @ts-ignore
import pkg from "./package.json";
import {onwarn, abortOnError} from "../../scripts/rollup";

import resolve from "@rollup/plugin-node-resolve";
import postcss from "rollup-plugin-postcss";
import typescript from "rollup-plugin-typescript2";
import copy from "rollup-plugin-copy-glob";

import {generateTypings} from "@focus4/styling/lib/generator";

export default (async () => {
    await generateTypings("src");

    /** @type {import("rollup").RollupOptions} */
    const config = {
        input: "src/focus4.toolbox.ts",
        plugins: [
            postcss({extract: true, modules: true}),
            resolve(),
            typescript({abortOnError: false}),
            copy([{files: "src/components/**/*.css.d.ts", dest: "lib/components"}]),
            abortOnError
        ],
        treeshake: {
            moduleSideEffects: false
        },
        output: {
            format: "esm",
            file: pkg.main
        },
        external: [
            ...Object.keys(pkg.dependencies || {}),
            "classnames",
            "lodash",
            "react",
            "react/jsx-runtime",
            "react-dom",
            "tslib"
        ],
        onwarn
    };

    return config;
})();
