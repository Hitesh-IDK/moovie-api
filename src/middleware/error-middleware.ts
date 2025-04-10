import { NextFunction, Request, Response } from "express";
import { Errors } from "../../types/global";

/**
 * Sends the error in development mode.
 * @param {AppError} err Error object
 * @param {Response} res Express response object
 * @returns {Response} Returns the response object with the error details
 */
const SendDevError = (err: AppError, res: Response) => {
  const statusCode = err.statusCode || 500;
  const { message, name } = err;

  return res.status(statusCode).json({
    success: false,
    code: statusCode,
    data: {
      message,
      error: name,
      err,
    },
  });
};

/**
 * Sends the error in production mode. Always returns a generic error message
 * unless the error is operational, in which case it returns the error message.
 * @param {AppError} err Error object
 * @param {Response} res Express response object
 * @returns {Response} Returns the response object with the error details
 */
const SendProdError = (err: AppError, res: Response) => {
  const statusCode = err.statusCode || 500;
  const { message, name } = err;

  return res.status(statusCode).json({
    success: false,
    code: statusCode,
    data: {
      message: err.isOperational ? message : "Something went wrong",
      error: err.isOperational ? name : "SERVER_ERROR",
    },
  });
};

/**
 * Global error handling middleware for Express applications.
 * Handles specific errors like token expiration and sends appropriate
 * error responses based on the environment (development or production).
 *
 * @param {AppError} err The error object to handle.
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function in the stack.
 * @returns {Response} The response object with the error details.
 */
export default (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err.name === "TokenExpiredError") {
    err = new AppError("Token expired", "AUTHENTICATION_ERROR", 401);
  }

  if (process.env.ENVIRONMENT === "production") {
    SendProdError(err, res);
    return;
  } else {
    SendDevError(err, res);
    return;
  }
};

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, name: Errors, statusCode: number) {
    super(message);

    this.name = name;
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// PRE DEFINED ERRORS

export const MissingFieldsError = (message: string): AppError => {
  return new AppError(message, "MISSING_FIELDS", 400);
};

export const InvalidRequestError = (message: string): AppError => {
  return new AppError(message, "INVALID_REQUEST", 400);
};

export const InvalidEndpointError = (message: string): AppError => {
  return new AppError(message, "INVALID_ENDPOINT", 404);
};

export const UncaughtError = (message: string): AppError => {
  return new AppError(message, "UNCAUGHT_ERROR", 500);
};

export const QueryError = (message: string): AppError => {
  return new AppError(message, "QUERY_ERROR", 500);
};

export const AuthenticationError = (message: string): AppError => {
  return new AppError(message, "AUTHENTICATION_ERROR", 401);
};

export const DoesntExistError = (message: string): AppError => {
  return new AppError(message, "DOESNT_EXIST_ERROR", 404);
};

export const InvalidParametersError = (message: string): AppError => {
  return new AppError(message, "INVALID_PARAMETERS", 400);
};

/**
 * Catches any errors in the given async function and passes them to the next
 * middleware, which should be an error-handling middleware.
 * @param {function} fn Async function to be wrapped
 * @returns {function} Wrapped function
 */
export const catchAsync = (
  fn: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void | Response>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
