export function dec2hex(num: string | number): string {
  let str = num.toString();
  let hex = parseInt(str, 10).toString(16);

  return hex;
}

export function hex2dec(num: string | number): number {
  let str = num.toString().replace(' ', '');
  let dec = parseInt(str, 16).toString(10);

  return parseInt(dec);
}

export function bufferToArray(buffer: Buffer) {
  // Returns array<string> of hex values from buffer object
  let byteArray = Array.from(buffer);

  return byteArray.map((byte: number) => {
    return dec2hex(byte);
  });
}