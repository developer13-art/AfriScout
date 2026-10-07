import type { DnaCreateInput } from "../../validators/dna.validator";
import { ValidationError } from "../../utils/errors";
import { isKnownCurrency } from "../../utils/currency";

export function validateDnaCreate(input: DnaCreateInput): void {
  if (input.minValue !== null && input.minValue !== undefined
    && input.maxValue !== null && input.maxValue !== undefined
    && input.minValue > input.maxValue) {
    throw new ValidationError("minValue cannot be greater than maxValue");
  }

  if (input.currency && !isKnownCurrency(input.currency)) {
    throw new ValidationError(`Unknown currency code: ${input.currency}`);
  }

  if (input.preferredCountries.some((code) => code.length !== 2)) {
    throw new ValidationError("Preferred country codes must be 2 letters");
  }
}