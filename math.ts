export const imul = Math.imul;
export function iadd(a: number, b: number): number {
  return (a + b) | 0;
}
export function idiv(a: number, b: number): number {
  return (a / b) | 0;
}
export function isub(a: number, b: number): number {
  return (a - b) | 0;
}