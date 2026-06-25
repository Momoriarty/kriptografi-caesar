/* ================= KRIPTOGRAFI CAESAR CIPHER ================= */
export function caesar(text, shift) {
  let result = "";
  let shiftLetter = ((shift % 26) + 26) % 26;
  let shiftNumber = ((shift % 10) + 10) % 10;

  for (let c of text) {
    if (c >= "A" && c <= "Z") {
      result += String.fromCharCode((c.charCodeAt(0) - 65 + shiftLetter) % 26 + 65);
    } else if (c >= "a" && c <= "z") {
      result += String.fromCharCode((c.charCodeAt(0) - 97 + shiftLetter) % 26 + 97);
    } else if (c >= "0" && c <= "9") {
      result += String.fromCharCode((c.charCodeAt(0) - 48 + shiftNumber) % 10 + 48);
    } else {
      result += c;
    }
  }
  return result;
}