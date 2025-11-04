export function matchAccountNumberFromErrorMessage(
  message: string
): string | null {
  const match = message.match(/(\d{12})(?=\s*(?:ni\s+tekshiring|tekshiring))/i);
  const accountNumber = match ? match[1] : null;
  return accountNumber;
}
