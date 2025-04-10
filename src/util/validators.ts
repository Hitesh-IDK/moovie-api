import { FunctionResponse } from "@/types/global";

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

export interface RangeField {
  min: number;
  max?: number;
  value: number;
  variableName: string;
}

export const rangeValidityCheck = (fields: RangeField[]): FunctionResponse => {
  const errors: string[] = [];

  for (const field of fields) {
    if (field.min > field.value) {
      errors.push(
        `Field ${field.variableName} must be greater than ${field.min}`
      );
    }
    if (field.max && field.max < field.value) {
      errors.push(`Field ${field.variableName} must be less than ${field.max}`);
    }
  }
  return { success: errors.length === 0, message: errors.join(", ") };
};
