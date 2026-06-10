/**
 * Input.types.ts
 *
 * Type definitions for the FormInput component.
 * Provides a discriminated union so that "textarea" mode
 * receives textarea-specific HTML props while every other
 * mode receives standard input props.
 */

import React from "react";

// ────────────────────────────────────────────────────────────
// Shared props that apply to every variant of FormInput
// ────────────────────────────────────────────────────────────

export interface FormInputBaseProps {
  /** Visible label rendered above the field */
  label?: string;

  /** Small text rendered below the field (hidden when `error` is present) */
  helperText?: string;

  /** Error message rendered below the field in destructive color */
  error?: string;

  /** Marks the field as required and shows an asterisk next to the label */
  required?: boolean;

  /** Icon element rendered inside the input (left side) */
  icon?: React.ReactNode;

  /** Show a live character counter (requires `maxLength` to be set) */
  showCharCount?: boolean;

  /** Unique id used to associate label ↔ input via htmlFor / id */
  id?: string;
}

// ────────────────────────────────────────────────────────────
// Textarea variant
// ────────────────────────────────────────────────────────────

export interface FormTextareaProps
  extends Omit<React.ComponentProps<"textarea">, "id">,
    FormInputBaseProps {
  /** Render a <textarea> instead of an <input> */
  inputType: "textarea";
}

// ────────────────────────────────────────────────────────────
// Standard input variant (text, email, password, number, date …)
// ────────────────────────────────────────────────────────────

export interface FormInputFieldProps
  extends Omit<React.ComponentProps<"input">, "id">,
    FormInputBaseProps {
  /**
   * HTML input type — every value except "textarea".
   * Defaults to "text" when omitted.
   */
  inputType?: Exclude<React.HTMLInputTypeAttribute, "textarea">;
}

// ────────────────────────────────────────────────────────────
// Discriminated union — consumers pass either variant
// ────────────────────────────────────────────────────────────

export type FormInputAllProps = FormInputFieldProps | FormTextareaProps;
