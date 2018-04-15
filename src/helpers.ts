import charset from "./charset";

export function dec2hex(num: string | number): string {
  const str = num.toString();

  return parseInt(str, 10).toString(16)
}

export function hex2dec(num: string | number): number {
  const str = num.toString().replace(' ', '');
  const dec = parseInt(str, 16).toString(10);

  return parseInt(dec);
}

export function dec2bin(num: number): string {
  return num.toString(2);
}

export function bin2dec(num: string | number): number {
  const str = num.toString();
  const dec = parseInt(str, 2).toString(10)

  return parseInt(dec);
}

export function bytesToString(bytes: Buffer): string {
  let str = '';

  for (let i = 0; i < bytes.length; i++) {
    const hexByte = dec2hex(bytes[i]);
    const character = charset[hex2dec(hexByte)];
    
    str += character;
  }

  return str;
}

export function bytesToNumber(bytes: Buffer): number {
  let byteStr = '';

  for (let i = 0; i < bytes.length; i++) {
    byteStr += dec2hex(bytes[i]);
  }

  return hex2dec(byteStr);
}

export function byteToBits(byte: number, start: number=0, end: number=8): string {
  const bin = dec2bin(byte).padStart(8, '0');

  return bin.slice(start, end);
}

export function bcdToNumber(bcd: Buffer): number {
  // bcd = Binary-coded decimal 
  // https://en.wikipedia.org/wiki/Binary-coded_decimal
  let num = 0;
  let multiplier = 1;

  for (let i = 0; i < bcd.length; i++) {
      num += (bcd[bcd.length - 1 - i] & 0x0F) * multiplier;
      num += ((bcd[bcd.length - 1 - i] >> 4) & 0x0F) * multiplier * 10;
      multiplier *= 100;
  }

  return num;
}

export function reverseBuffer(src: Buffer): Buffer {
  let buffer = new Buffer(src.length);

  for (let i = 0, j = src.length - 1; i <= j; i++, j--) {
    buffer[i] = src[j];
    buffer[j] = src[i];
  }
  
  return buffer;
}