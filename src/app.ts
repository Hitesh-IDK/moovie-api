import express from "express";
import cors from "cors";
import morgan from "morgan";

const app = express();
export default app;

// Base URL where all the logics are handled
const baseURL: string = "/api/v1";

// Body parser middleware
app.options("/{*any}", cors());
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
