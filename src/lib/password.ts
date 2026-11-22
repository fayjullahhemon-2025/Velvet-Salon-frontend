export const PASSWORD_RULES = [
  {
    id: "length",
    label: "At least 6 characters",
    test: (value: string) => value.length >= 6,
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    test: (value: string) => /[a-z]/.test(value),
  },
] as const;

export const PASSWORD_REQUIREMENT_MESSAGE =
  "Password must be at least 6 characters and include an uppercase and a lowercase letter.";

export function isStrongPassword(value: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}
