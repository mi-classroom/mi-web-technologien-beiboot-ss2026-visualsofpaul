import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "src/core/index.ts",
		"presets/index": "src/presets/index.ts",
	},
	format: ["esm"],
	clean: true,
	splitting: true,
	sourcemap: true,
	target: "es2022",
	minify: true,
});
