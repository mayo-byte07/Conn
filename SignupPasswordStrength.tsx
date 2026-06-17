import React, { useCallback, useMemo, useState } from "react";

export interface PasswordStrengthIndicatorProps {
  password: string;
  show: boolean;
}

const specialCharPattern = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/;

export function PasswordStrengthIndicator({ password, show }: PasswordStrengthIndicatorProps) {
  const checks = useMemo(
    () => ({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: specialCharPattern.test(password),
    }),
    [password],
  );

  const strength = useMemo(
    () => Object.values(checks).filter(Boolean).length,
    [checks],
  );

  return (
    <div
      id="passwordStrength"
      style={{
        marginTop: 8,
        fontSize: "0.75rem",
        display: show ? "block" : "none",
      }}
    >
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className={`strength-bar${index < strength ? " active" : ""}`}
            data-level={index + 1}
          />
        ))}
      </div>

      <ul
        id="passwordRequirements"
        style={{ listStyle: "none", padding: 0, margin: 0, color: "var(--text-secondary)" }}
      >
        <li id="req-length" className={checks.length ? "valid" : ""}>
          At least 8 characters
        </li>
        <li id="req-uppercase" className={checks.uppercase ? "valid" : ""}>
          One uppercase letter
        </li>
        <li id="req-number" className={checks.number ? "valid" : ""}>
          One number
        </li>
        <li id="req-special" className={checks.special ? "valid" : ""}>
          One special character
        </li>
      </ul>
    </div>
  );
}

export interface SignupPasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SignupPasswordField({ value, onChange, className }: SignupPasswordFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.currentTarget.value);
    },
    [onChange],
  );

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  const showStrength = isFocused || value.length > 0;

  return (
    <div className={className}>
      <label className="form-label" htmlFor="signupPassword">
        Password
      </label>
      <input
        id="signupPassword"
        className="form-input"
        type="password"
        placeholder="Min. 8 characters"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoComplete="new-password"
        required
      />

      <PasswordStrengthIndicator password={value} show={showStrength} />
    </div>
  );
}
