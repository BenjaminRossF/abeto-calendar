import { extname } from "node:path";

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (originalError) {
    if (!specifier.startsWith(".") || extname(specifier)) throw originalError;

    for (const extension of [".ts", ".js", ".mjs"]) {
      try {
        return await nextResolve(`${specifier}${extension}`, context);
      } catch {
        // Try the next extension; preserve Node's original resolution error.
      }
    }

    throw originalError;
  }
}
