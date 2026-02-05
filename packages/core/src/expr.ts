import { ExpressionParser } from '@tadpolehq/schema';

export function extendExpressionParser(parser: ExpressionParser) {
  parser.functions.chance = chance;
  parser.functions.format = format;
  parser.functions.gauss = gauss;
  parser.functions.jitter = jitter;
  parser.functions.min_to_ms = min_to_ms;
  parser.functions.pick = pick;
  parser.functions.sec_to_ms = sec_to_ms;
}

export function chance(p: number): boolean {
  return Math.random() < p ? true : false;
}

export function format(str: string, ...args: any[]): string {
  return str.replace(/{(\d+)}/g, (_match, num) => {
    const index = parseInt(num);
    if (args[index] === undefined)
      throw new Error(`Format is missing arg at index: ${index}`);

    return args[index].toString();
  });
}

let cachedGauss: number | null = null;

export function gauss(mean: number = 0, stdDev: number = 1): number {
  if (cachedGauss !== null) {
    const result = mean + stdDev * cachedGauss;
    cachedGauss = null;
    return result;
  }

  let u, v, s;
  do {
    u = Math.random() * 2 - 1;
    v = Math.random() * 2 - 1;
    s = u * u + v * v;
  } while (s >= 1 || s === 0);

  const mul = Math.sqrt((-2.0 * Math.log(s)) / s);
  cachedGauss = v * mul;
  return mean + stdDev * u * mul;
}

export function jitter(val: number, amt: number) {
  return val + (Math.random() * amt * 2 - amt);
}

export function min_to_ms(n: number) {
  return n * 60000;
}

export function pick<T>(l: T[]): T | undefined {
  const i = Math.floor(Math.random() * l.length);
  return l[i];
}

export function sec_to_ms(n: number) {
  return n * 1000;
}

const defaultExpressionParser = new ExpressionParser();
extendExpressionParser(defaultExpressionParser);
export { defaultExpressionParser };
