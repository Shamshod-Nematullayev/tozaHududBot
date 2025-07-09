export function isValidAccountNumber(text: string): boolean {
  return /^\d{12,}$/.test(text);
}
