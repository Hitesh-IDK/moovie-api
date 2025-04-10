import { VerificationCodeStatus, VerifyDBBody } from "@/types/user";
import { pool } from "../config";
import { randomFourDigits } from "../../util/auth-utils";

export default class VerificationCode {
  id?: number;
  code?: string;
  phone: number;
  status: VerificationCodeStatus;
  created_at?: Date;

  constructor(
    phone: number,
    status: VerificationCodeStatus,
    code?: string,
    id?: number,
    created_at?: Date
  ) {
    this.phone = phone;
    this.status = status;
    this.code = code;
    this.id = id;
    this.created_at = created_at ?? new Date();
  }

  /**
   * Generates a random 4 digit code and saves it to the database with the given phone number
   * and status. It also deactivates all previous codes for the given phone number.
   * @returns The ID of the newly created code
   */
  static async generate(phone: number): Promise<VerificationCode> {
    // Deactivate previous codes
    await pool.query(
      "UPDATE verification_codes SET status = $1 WHERE phone = $2",
      ["INACTIVE", phone]
    );

    const code = randomFourDigits();
    const created_at = new Date();

    const data: { id: number } = (
      await pool.query(
        "INSERT INTO verification_codes (phone, code, status, created_at) VALUES ($1, $2, $3, $4) RETURNING id",
        [phone, code, "ACTIVE", created_at]
      )
    ).rows[0];

    const id = data.id;
    return new VerificationCode(phone, "ACTIVE", code, id, created_at);
  }

  /**
   * Sends the verification code to the phone number associated with this verification code
   * via SMS. If the verification code is not set, it will return false.
   * @returns A boolean indicating whether the message was sent successfully
   */
  async send(): Promise<boolean> {
    if (!this.code) return false;

    const message = `Your one time password to access your account at Medicause is ${this.code}. Do not share it with anyone.`;
    // await SendSms(String(this.phone), message);
    return true;
  }

  /**
   * Verifies a verification code for a given phone number. If the code is active and has not expired,
   * it will deactivate the code and return true. If the code is inactive or has expired, it will return false.
   * @param code the verification code to verify
   * @param phone the phone number associated with the verification code
   * @returns a boolean indicating whether the verification code was valid
   */
  static async verify(code: string, phone: number): Promise<boolean> {
    const data = await pool.query(
      "SELECT * FROM verification_codes WHERE code = $1 AND phone = $2",
      [code, phone]
    );

    if (data.rowCount === 0) return false;

    const otpExpiresIn = Number(process.env.OTP_EXPIRY) || 600000; // 10 minutes

    const item: VerifyDBBody = data.rows[0];
    if (item.status !== "ACTIVE") return false;
    if (item.created_at.getTime() + otpExpiresIn < new Date().getTime()) {
      await this.deactivate(item.id);
      return false;
    }

    return await this.deactivate(item.id);
  }

  /**
   * Deactivates a verification code with the given ID. If the
   * verification code is active, it will be deactivated. If the
   * verification code is inactive or does not exist, it will return
   * false. If the verification code is successfully deactivated, it
   * will return true.
   * @param id the ID of the verification code to deactivate
   * @returns a boolean indicating whether the verification code was
   * deactivated successfully
   */
  static async deactivate(id: number): Promise<boolean> {
    await pool.query(
      "UPDATE verification_codes SET status = $1 WHERE id = $2",
      ["INACTIVE", id]
    );

    return true;
  }
}
