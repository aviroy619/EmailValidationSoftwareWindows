const app = require("./app");
const env = require("./config/env");
const { connectDb } = require("./config/db");
const { scheduleCreditResetJob } = require("./jobs/creditResetJob");

async function start() {
  await connectDb();
  scheduleCreditResetJob();

  app.listen(env.port, () => {
    console.log(`API listening on port ${env.port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
