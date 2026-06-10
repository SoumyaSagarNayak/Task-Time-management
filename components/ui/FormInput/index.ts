/**
 * Barrel export for the FormInput component.
 * Re-exports the component, types, and helper utilities
 * for convenient imports.
 *
 * @example
 * import { FormInput } from "@/components/ui/Input";
 * import { validateEmail } from "@/components/ui/Input";
 */

export { FormInput } from "./Input";
export type {
  FormInputAllProps,
  FormInputFieldProps,
  FormTextareaProps,
  FormInputBaseProps,
} from "./Input.types";
export {
  validateRequired,
  validateEmail,
  validateMinLength,
  validateMaxLength,
  validateNumber,
  formatCharacterCount,
  generateInputId,
} from "./inputHelpers";
