export function iadd(a: number, b: number): number {
  return (a + b) | 0;
}

export function isub(a: number, b: number): number {
  return (a - b) | 0;
}

export function imul(a: number, b: number): number {
  return Math.imul(a, b);
}

export function idiv(a: number, b: number): number {
  return (a / b) | 0;
}

export function fadd(a: number, b: number): number {
  return Math.fround(a + b);
}

export function fsub(a: number, b: number): number {
  return Math.fround(a - b);
}

export function fmul(a: number, b: number): number {
  return Math.fround(a * b);
}

export function fdiv(a: number, b: number): number {
  return Math.fround(a / b);
}

export function lerp(a: number, b: number, t: number): number {
  return fadd(a, fmul(t, fsub(b, a)));
}
