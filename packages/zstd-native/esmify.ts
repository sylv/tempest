import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import dedent from "dedent";

const input = join(import.meta.dir, "./dist/index.js");
let content = readFileSync(input, "utf8");

// define require() in ESM, this is necessary because replacing require() imports
// with await import() breaks .node files.
const createRequire = dedent`
  import { createRequire } from 'node:module';
  const require = createRequire(import.meta.url);
  const __dirname = new URL(".", import.meta.url).pathname;
`;
content = createRequire + "\n" + content;

// replace top level require() with import, kinda unnecessary but it's cleaner
const TOP_LEVEL_REQUIRE_REGEX = /^const ([\w\{\}, ]+) = require\((['"])(.+?)\2\)/gm;
const TOP_LEVEL_REQUIRE_REPLACE = `import $1 from "$3"`;
content = content.replace(TOP_LEVEL_REQUIRE_REGEX, TOP_LEVEL_REQUIRE_REPLACE);

// replace module.export.foo = foo with export { foo }
const MODULE_EXPORTS_REGEX = /module\.exports\.(\w+) = (\w+)/g;
const MODULE_EXPORTS_REPLACE = `export { $1 }`;
content = content.replace(MODULE_EXPORTS_REGEX, MODULE_EXPORTS_REPLACE);

writeFileSync(input, content, "utf8");
