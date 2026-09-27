import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "../..");

// Executes actual route/service code with only external boundaries replaced.
export function routeLoader(mocks = {}) {
  const cache = new Map();
  function load(name, parent = root) {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (!name.startsWith(".") && !name.startsWith("@/") && !path.isAbsolute(name)) return require(name);
    let file = name.startsWith("@/") ? path.join(root, name.slice(2)) : path.resolve(parent, name);
    if (!path.extname(file)) file += ".ts";
    if (cache.has(file)) return cache.get(file).exports;
    const loadedModule = { exports: {} }; cache.set(file, loadedModule);
    const source = fs.readFileSync(file, "utf8");
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    new Function("require", "module", "exports", code)(n => load(n, path.dirname(file)), loadedModule, loadedModule.exports);
    return loadedModule.exports;
  }
  return entry => load(path.join(root, entry));
}
