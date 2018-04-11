import charset from "./charset";

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

export function bytesToString(bytes: Buffer): string {
  let str = '';

  for (let i = 0; i < bytes.length; i++) {
    const hexByte = dec2hex(bytes[i]);
    const character = charset[hex2dec(hexByte)];
    
    // 0x50 is string terminator
    if (hexByte === '50') break;
    str += character;
  }
  
  return str;
}

export function bcdToNumber(bcd: Buffer): number {
  // bcd = Binary-coded decimal 
  // https://en.wikipedia.org/wiki/Binary-coded_decimal
  var n = 0;
  var m = 1;

  for(let i = 0; i < bcd.length; i+=1) {
      n += (bcd[bcd.length-1-i] & 0x0F) * m;
      n += ((bcd[bcd.length-1-i]>>4) & 0x0F) * m * 10;
      m *= 100;
  }

  return n;
}