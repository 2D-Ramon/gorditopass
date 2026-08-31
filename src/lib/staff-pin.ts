export const SCAN_PIN_EMAIL = "__scan_pin__";

export function randomStaffPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}
