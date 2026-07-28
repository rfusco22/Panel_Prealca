export function calculateIVA(amount: number, percentage: number = 16): number {
  return (amount * percentage) / 100;
}

export function calculateRetention(ivaAmount: number, percentage: number = 75): number {
  return (ivaAmount * percentage) / 100;
}
