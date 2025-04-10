import { MissingFieldsError } from "../middleware/error-middleware";
import { GenericAPIBody, GenericAPIResponse } from "@/types/global";
import { NextFunction, Request, Response } from "express";

export const InvalidEndpointHandler = (req: Request, res: Response, next: NextFunction): void => {
  const response: GenericAPIResponse<GenericAPIBody> = {
    success: false,
    code: 404,
    data: {
      message: `Route (${req.path}) not found`,
      error: "INVALID_ENDPOINT",
    },
  };

  res.status(404).json(response);
  return;
};

export const ValidatePostBody = (req: Request, res: Response, next: NextFunction): void => {
  const { body } = req;
  if (!body) {
    return next(MissingFieldsError("Request body is empty"));
  }

  return next();
};
