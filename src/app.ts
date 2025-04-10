import express from "express";
import cors from "cors";
import morgan from "morgan";
import ErrorMiddleware from "./middleware/error-middleware";
import { SendOtpHandler } from "./handlers/auth";
import { InvalidEndpointHandler, ValidatePostBody } from "./handlers/common-handler";

const app = express();
export default app;

// Base URL where all the logics are handled
const baseURL: string = "/api/v1";
setMiddlewares(app);

// App routes
app.post(`${baseURL}/auth/send-otp`, SendOtpHandler);

app.route("{*any}").all(InvalidEndpointHandler);
app.use(ErrorMiddleware);

function setMiddlewares(app: express.Application): void {
  // Logging middleware
  const rfs = require("rotating-file-stream");

  const rotatingStream = rfs.createStream("server.log", {
    size: "10M",
    compress: "gzip",
    maxFiles: 10,
    path: "logs",
  });

  app.use(
    morgan(process.env.ENVIRONMENT === "development" ? "dev" : "combined", {
      stream: rotatingStream,
    })
  );

  // Body parser middleware
  app.options("/{*any}", cors());
  app.use(cors());

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Check if request body is empty
  app.post(`/{*any}`, ValidatePostBody);
}
