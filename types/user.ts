// Extra Types
export type VerificationCodeStatus = "ACTIVE" | "INACTIVE";

// Database and user related types

export interface UserDBbody {
  id: number;
  name: string;
  phone: number;
  email?: string;
  image?: string;

  deleted_at?: Date;
  updated_at?: Date;
  created_at?: Date;
}

export interface VerifyDBBody {
  id: number;
  code: string;
  phone: number;
  status: VerificationCodeStatus;
  created_at: Date;
}
