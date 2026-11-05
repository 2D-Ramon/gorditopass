import { initBotId } from "botid/client/core";

// Basic checks are free. Deep Analysis is a paid Vercel add-on, so keep
// checkLevel on basic here and in blockAutomatedCatalogRead.
const basic = { checkLevel: "basic" as const };

initBotId({
  protect: [
    { path: "/api/listings", method: "GET", advancedOptions: basic },
    { path: "/api/listings/*", method: "GET", advancedOptions: basic },
    { path: "/api/events", method: "GET", advancedOptions: basic },
    { path: "/api/feed", method: "GET", advancedOptions: basic },
    { path: "/api/jobs", method: "GET", advancedOptions: basic },
  ],
});
