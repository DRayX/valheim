import { iadd, imul, Vector2 } from "./util";

export class Xorshift128 {
  private static readonly f = 1812433253;
  private static readonly tau = 2 * Math.PI;

  private b: number;
  private c: number;
  private d: number;

  constructor(private a: number) {
    this.b = iadd(imul(Xorshift128.f, this.a), 1);
    this.c = iadd(imul(Xorshift128.f, this.b), 1);
    this.d = iadd(imul(Xorshift128.f, this.c), 1);
  }

  next(): number {
    const t = this.a ^ (this.a << 11);
    this.a = this.b;
    this.b = this.c;
    this.c = this.d;
    return this.d ^= (this.d >>> 19) ^ t ^ (t >>> 8);
  }

  rangeInt(min: number, max: number): number {
    const n = this.next();
    return (n < 0 ? n + 0x100000000 : n) % (max - min) + min;
  }

  rangeFloat(min: number, max: number): number {
    const value = this.value;
    return max - value * max + value * min;
  }

  get value(): number {
    return (this.next() & 0x7fffff) / 0x7fffff;
  }

  get insideUnitCircle(): Vector2 {
    const theta = Xorshift128.tau - this.value * Xorshift128.tau;
    const r = Math.sqrt(1 - this.value);
    return new Vector2(Math.cos(theta) * r, Math.sin(theta) * r);
  }
}
