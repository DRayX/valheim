import { fadd, fdiv, fmul, fsub, iadd, imul } from "./math";
import { Vector2 } from "./util";

export class Xorshift128 {
  private static readonly f = 1812433253;
  private static readonly tau = Math.fround(6.283185);

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
    return fadd(fmul(fsub(1, value), max), fmul(value, min));
  }

  get value(): number {
    return fdiv(this.next() & 0x7fffff, 0x7fffff);
  }

  get insideUnitCircle(): Vector2 {
    const theta = fmul(fsub(1, this.value), Xorshift128.tau);
    const r = Math.fround(Math.sqrt(fsub(1, this.value)));
    const x = fmul(Math.fround(Math.cos(theta)), r);
    const y = fmul(Math.fround(Math.sin(theta)), r);
    return new Vector2(x, y);
  }
}
