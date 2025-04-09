import dotenv from "dotenv";
dotenv.config({ path: `${process.cwd()}/.env` });

import app from "./src/app";

const server = app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

process.on("uncaughtException", (err: Error) => {
  console.log(`Error: ${err.name} ${err.message}`);

  server.close(() => {
    process.exit(1);
  });
});

process.on("unhandledRejection", (err: Error) => {
  console.log(`Error: ${err.name} ${err.message}`);

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
});
