// Vercel invokes this Express app for every /api/* request.
// This file is created by `npm run build` before Vercel bundles this function.
// @ts-ignore -- the generated CommonJS bundle has no source declaration file.
import serverModule from "../dist/server.cjs";

export default serverModule.app;
