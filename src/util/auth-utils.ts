import crypto from "crypto";
import { verify } from "jsonwebtoken";
import { TokenDecoded, TokenTypes } from "../../types/auth";
import User from "../database/models/user";
import { FunctionResponse } from "@/types/global";

/**
 * Generates a random 4-digit code in the range of 0000-9999.
 *
 * @returns A random 4-digit code as a string
 */

export const randomFourDigits = (): string => {
  const newCode: string = crypto.getRandomValues(new Uint16Array(2)).join("");

  const code =
    newCode.length > 4 ? newCode.slice(1, 3) + newCode.slice(4, 6) : newCode;
  return code.length < 4 ? code.padStart(4, "0") : code;
};

/**
 * Verifies a given JWT token. Depending on the type of token, it may
 * also verify that the token was issued to the given account ID and
 * phone number.
 *
 * @param token - The JWT token to verify, in the format of "Bearer <token>".
 * @param type - The type of token to verify, which can be one of "access",
 * "refresh", or "recover".
 * @param phone - The phone number associated with the account that the
 * token was issued to. Only required if type is "recover".
 * @param accountId - The ID of the account that the token was issued to.
 * Only required if type is "access" or "refresh".
 * @returns A promise that resolves to an object with two properties: "success"
 * and "message". If the token is valid, then "success" is true and "message"
 * contains a success message. Otherwise, "success" is false and "message"
 * contains an error message.
 */
export const verifyJwt = async (
  token: string,
  type: TokenTypes,
  phone?: number,
  accountId?: number
): Promise<{ success: boolean; message: string }> => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return {
      success: false,
      message: "JWT secret not found",
    };
  }

  if (!token.startsWith("Bearer"))
    return {
      success: false,
      message: "Invalid token format",
    };

  const slicedToken = token.split(" ")[1];
  const payload = (await jwtVerifyPromisified(
    slicedToken,
    secret
  )) as unknown as TokenDecoded;

  if (type === "access" || type === "refresh") {
    if (!accountId) return { success: false, message: "Account ID not found" };

    const verification = await accessTokenVerify(
      secret,
      slicedToken,
      accountId,
      phone?.toString()
    );
    if (!verification.success) return verification;
  } else if (type === "recover") {
    if (!phone) return { success: false, message: "Phone number not found" };

    const verification = await recoverTokenVerify(
      secret,
      slicedToken,
      phone.toString()
    );
    if (!verification.success) return verification;
  }

  if (type !== (payload as TokenDecoded).type)
    return {
      success: false,
      message: "Invalid token type, does not match the operation!",
    };

  return {
    success: true,
    message: "Token verified successfully",
  };
};

/**
 * Verifies an access token. If the token is valid, it will also verify
 * that the token was issued to the given account ID and phone number.
 *
 * @param secret - The secret used to sign the JWT token.
 * @param token - The JWT access token to verify, in the format of
 * "Bearer <token>".
 * @param accountId - The ID of the account that the token was issued to.
 * @param phone - The phone number associated with the account that the
 * token was issued to. If not given, the phone number in the payload
 * will be used.
 * @returns A promise that resolves to an object with two properties:
 * "success" and "message". If the token is valid, then "success" is
 * true and "message" contains a success message. Otherwise, "success"
 * is false and "message" contains an error message.
 */
const accessTokenVerify = async (
  secret: string,
  token: string,
  accountId: number,
  phone?: string
): Promise<FunctionResponse> => {
  const payload: TokenDecoded = (await jwtVerifyPromisified(
    token,
    secret
  )) as unknown as TokenDecoded;
  // Get the USER if it exists
  const user = await User.getByPhone(Number(payload.phone));

  if (phone && payload.phone.toString() !== phone)
    return {
      success: false,
      message: "Phone number does not belong to this JWT token",
    };

  if (!user)
    return {
      success: false,
      message: "User linked to this JWT token does not exist",
    };

  if (user.deletedAt)
    return {
      success: false,
      message: "User linked to this JWT token is deleted",
    };

  if (user.id !== accountId)
    return {
      success: false,
      message: "User Id provided does not belong to this token",
    };

  return { success: true, message: "Token verified successfully" };
};

/**
 * Verifies a recover token. If the token is valid, it ensures that the token
 * was issued to the given phone number and that the associated user is deleted.
 *
 * @param secret - The secret used to sign the JWT token.
 * @param token - The JWT recover token to verify, in the format of "Bearer <token>".
 * @param phone - The phone number associated with the account that the token was issued to.
 * @returns A promise that resolves to an object with two properties: "success"
 * and "message". If the token is valid, then "success" is true and "message"
 * contains a success message. Otherwise, "success" is false and "message"
 * contains an error message.
 */

const recoverTokenVerify = async (
  secret: string,
  token: string,
  phone: string
): Promise<FunctionResponse> => {
  const payload: TokenDecoded = (await jwtVerifyPromisified(
    token,
    secret
  )) as unknown as TokenDecoded;
  // Get the USER if it exists
  const user = await User.getByPhone(Number(payload.phone));

  if (phone && payload.phone.toString() !== phone)
    return {
      success: false,
      message: "Phone number does not belong to this JWT token",
    };

  if (!user)
    return {
      success: false,
      message: "User linked to this JWT token does not exist",
    };

  if (!user.deletedAt)
    return {
      success: false,
      message: "User linked to this JWT token is not deleted",
    };

  return { success: true, message: "Token verified successfully" };
};

/**
 * A promisified version of the jwt.verify() function. This function takes the same
 * parameters as jwt.verify(), but returns a promise that resolves to the payload
 * if the token is verified successfully, or rejects with an error if the
 * verification fails.
 *
 * @param token - The JWT token to verify.
 * @param secret - The secret used to sign the JWT token.
 * @returns A promise that resolves to the payload if the token is verified
 * successfully, or rejects with an error if the verification fails.
 */
const jwtVerifyPromisified = async (token: string, secret: string) => {
  return new Promise((resolve, reject) => {
    verify(token, secret, {}, (err, payload) => {
      if (err) {
        reject(err);
      } else {
        resolve(payload);
      }
    });
  });
};
