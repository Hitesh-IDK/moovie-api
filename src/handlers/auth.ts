import { InvalidParametersError, MissingFieldsError } from "../middleware/error-middleware";
import { isValidPhone } from "../util/validators";
import { NextFunction, Request, Response } from "express";
import VerificationCode from "../database/models/verification-code";
import { GenericAPIBody, GenericAPIResponse } from "@/types/global";

export const SendOtpHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { phone } = req.body;
  const isPhoneValid = isValidPhone(phone);

  if (!isPhoneValid) {
    return next(InvalidParametersError("Phone number is not valid"));
  }

  const verificationCode = await VerificationCode.generate(Number(phone));
  const response: GenericAPIResponse<GenericAPIBody> = {
    success: true,
    code: 200,
    data: { message: `OTP sent successfully (${verificationCode.code})` },
  };

  res.status(response.code).json(response);
  return;
};
