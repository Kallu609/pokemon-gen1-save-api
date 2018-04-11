export function dec2hex(num: string | number): string {
  const str = num.toString();
  const hex = parseInt(str, 10).toString(16);

  return hex;
}

export function hex2dec(num: string | number): number {
  const str = num.toString().replace(' ', '');
  const dec = parseInt(str, 16).toString(10);

  return parseInt(dec);
}