export type PasswordCheck = {
  score: number; // 0-4
  label: 'Too short' | 'Weak' | 'Fair' | 'Strong';
  hints: string[];
  valid: boolean; // meets the server's minimum bar
};

export function checkPassword(password: string): PasswordCheck {
  const hints: string[] = [];
  if (password.length < 8) hints.push('At least 8 characters');
  if (!/[a-z]/.test(password)) hints.push('A lowercase letter');
  if (!/[A-Z]/.test(password)) hints.push('An uppercase letter');
  if (!/[0-9]/.test(password)) hints.push('A number');

  const metCount = 4 - hints.length;
  const valid = hints.length === 0;
  const hasLength = password.length >= 8;

  let score = 0;
  let label: PasswordCheck['label'] = 'Too short';
  if (hasLength) {
    score = metCount; // 1-4
    label = metCount <= 1 ? 'Weak' : metCount <= 3 ? 'Fair' : 'Strong';
  }

  return { score, label, hints, valid };
}
