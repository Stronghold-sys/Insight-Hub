import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig({});

config.buildCommand = "npx next build";

config.cloudflare = {
  useWorkerdCondition: true,
};

export default config;
