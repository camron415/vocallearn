export const MIN_PASSWORD = 10;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function nameError(value: string) {
  if (!value.trim()) return "Enter your name.";
  return null;
}

export function emailError(value: string) {
  const email = normalizeEmail(value);
  if (!email) return "Enter your email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email, like name@email.com.";
  }
  return null;
}

export function passwordError(value: string) {
  if (value.length < MIN_PASSWORD) {
    return `Use at least ${MIN_PASSWORD} characters.`;
  }
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    return "Include a letter and a number.";
  }
  return null;
}

export function authErrorMessage(raw: string) {
  const text = raw.toLowerCase();
  if (text.includes("already") || text.includes("registered")) {
    return "That email already has an account. Sign in from the login page.";
  }
  if (text.includes("invalid login") || text.includes("invalid credentials")) {
    return "Email or password is wrong.";
  }
  if (text.includes("confirm")) {
    return "Cove couldn’t sign you in yet. Open the login page with this email, or ask Camron.";
  }
  if (text.includes("database") || text.includes("invite")) {
    return "This invite could not be used. Ask Camron for a new link.";
  }
  if (text.includes("password")) {
    return `Use at least ${MIN_PASSWORD} characters, with a letter and a number.`;
  }
  return "Could not finish that. Try again.";
}
