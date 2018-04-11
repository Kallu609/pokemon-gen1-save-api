export function createArrayN(obj: any, amount: number) {
  return Array(amount).fill(obj);
}

export function dec2hex(num: any) {
  return parseInt(num, 10).toString(16);
}

export function hex2dec(num: any): number {
  return parseInt(parseInt(num, 16).toString(10));
}

export function bufferToArray(buffer: Buffer) {
  // Returns array<string> of hex values from buffer object
  // TO-DO: Better way to convert Buffer to Array<string>
  let byteArray = JSON.parse(JSON.stringify(buffer)).data;

  return byteArray.map((byte: number) => {
    return dec2hex(byte);
  });
}