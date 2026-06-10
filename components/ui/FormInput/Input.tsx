/**
 * FormInput.tsx
 *
 * A reusable, accessible form input component that wraps the existing
 * shadcn Input and Textarea primitives. It adds:
 *
 *  1. Label rendering with optional required indicator (*)
 *  2. Error message display
 *  3. Helper text display (hidden when error is shown)
 *  4. Password visibility toggle
 *  5. Character counter
 *  6. Icon slot (left side)
 *  7. Full ref forwarding for React Hook Form compatibility
 *  8. Prop spreading — all standard HTML input/textarea props pass through
 *
 * The original shadcn Input (components/ui/input.tsx) is NOT modified.
 * FormInput is a higher-level wrapper around it.
 *
 * @example
 * <FormInput
 *   label="Task Name"
 *   inputType="text"
 *   placeholder="Enter task name"
 *   required
 *   value={taskName}
 *   onChange={handleChange}
 *   error={errors.taskName}
 * />
 */

"use client";

import React, { useState, useCallback, useId } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCharacterCount } from "./inputHelpers";
import type {
  FormInputAllProps,
  FormInputFieldProps,
  FormTextareaProps,
} from "./Input.types";
import styles from "./Input.module.css";

// ────────────────────────────────────────────────────────────
// Helper: Render the label element
// ────────────────────────────────────────────────────────────

/**
 * Renders the <label> element with an optional required indicator (*).
 * Associates the label with the input via `htmlFor` for accessibility.
 */
function renderLabel(
  label: string | undefined,
  htmlFor: string,
  required: boolean | undefined,
) {
  if (!label) return null;
  return (
    <label htmlFor={htmlFor} className={styles.label}>
      {label}
      {required && (
        <span className={styles.requiredIndicator} aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

// ────────────────────────────────────────────────────────────
// Helper: Render the footer (error / helper text + char count)
// ────────────────────────────────────────────────────────────

/**
 * Renders the footer row containing:
 * - Error message (takes priority over helper text)
 * - Helper text (shown only when there is no error)
 * - Character counter (shown when `showCharCount` and `maxLength` are set)
 */
function renderFooter(
  error: string | undefined,
  helperText: string | undefined,
  showCharCount: boolean | undefined,
  currentLength: number,
  maxLength: number | undefined,
  errorId: string,
  helperId: string,
) {
  const hasFooterContent = error || helperText || (showCharCount && maxLength);
  if (!hasFooterContent) return null;

  // Determine if the character count is near the limit (>90%)
  const isNearLimit = maxLength ? currentLength / maxLength > 0.9 : false;

  return (
    <div className={styles.footer}>
      {/* Error takes priority over helper text */}
      {error ? (
        <p id={errorId} className={styles.errorText} role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className={styles.helperText}>
          {helperText}
        </p>
      ) : (
        // Spacer to keep char counter right-aligned
        <span />
      )}

      {/* Character counter */}
      {showCharCount && maxLength != null && (
        <span
          className={cn(
            styles.charCounter,
            isNearLimit && styles.charCounterWarning,
          )}
        >
          {formatCharacterCount(currentLength, maxLength)}
        </span>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────

/**
 * FormInput — a reusable form field that wraps shadcn Input / Textarea.
 *
 * Uses React.forwardRef so that React Hook Form can attach its ref
 * directly to the underlying <input> or <textarea> element.
 */
export const FormInput = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  FormInputAllProps
>((props, ref) => {
  // ── Determine variant ──────────────────────────────────
  const isTextarea = props.inputType === "textarea";

  // ── Destructure shared + discriminant props ────────────
  // `inputType` is extracted here so it does NOT leak into the
  // HTML element spread (it is not a valid HTML attribute).
  const {
    label,
    helperText,
    error,
    required,
    icon,
    showCharCount,
    inputType,
    id: externalId,
    className,
    ...restProps
  } = props;

  // ── Generate stable ids for accessibility linking ──────
  const autoId = useId();
  const inputId = externalId || `form-input-${autoId}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  // ── Password visibility toggle state ───────────────────
  // Only relevant when inputType is "password"
  const isPasswordField = !isTextarea && inputType === "password";
  const [showPassword, setShowPassword] = useState(false);

  /** Toggles password field between plain text and masked */
  const handlePasswordToggle = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // ── Compute the current character length for the counter ─
  const currentValue = String(
    (restProps as Record<string, unknown>).value ?? "",
  );
  const currentLength = currentValue.length;

  // ── Build aria-describedby for screen readers ──────────
  const ariaDescribedBy = [
    error ? errorId : undefined,
    helperText && !error ? helperId : undefined,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  // ── Shared accessibility props for the underlying element ─
  const a11yProps = {
    id: inputId,
    required,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": ariaDescribedBy,
  };

  // ── Render ─────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      {/* Label */}
      {renderLabel(label, inputId, required)}

      {/* Input container */}
      <div
        className={cn(
          styles.inputWrapper,
          icon && styles.hasIcon,
          isPasswordField && styles.hasToggle,
        )}
      >
        {/* Icon slot (left) */}
        {icon && <span className={styles.iconWrapper}>{icon}</span>}

        {/* Render underlying shadcn primitive */}
        {isTextarea ? (
          <Textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={className}
            {...a11yProps}
            {...(restProps as React.ComponentProps<"textarea">)}
          />
        ) : (
          <Input
            ref={ref as React.Ref<HTMLInputElement>}
            // For password fields, toggle between "password" and "text"
            type={
              isPasswordField
                ? showPassword
                  ? "text"
                  : "password"
                : inputType || "text"
            }
            className={className}
            {...a11yProps}
            {...(restProps as React.ComponentProps<"input">)}
          />
        )}

        {/* Password visibility toggle button */}
        {isPasswordField && (
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={handlePasswordToggle}
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Footer: error / helper text + character counter */}
      {renderFooter(
        error,
        helperText,
        showCharCount,
        currentLength,
        (restProps as Record<string, unknown>).maxLength as number | undefined,
        errorId,
        helperId,
      )}
    </div>
  );
});

// Display name for React DevTools
FormInput.displayName = "FormInput";
