// Vercel invokes this Express app for every /api/* request.
import serverModule from "../dist/server.cjs";

export default serverModule.app;
