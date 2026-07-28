/**
 * Indian mobile number handling.
 *
 * Numbers are stored in one canonical form — 10 digits, no country code — so
 * that "+91 87140 51245", "918714051245" and "08714051245" all resolve to the
 * same customer record.
 */

export function normalisePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');

  // Strip a leading country code or trunk prefix.
  let local = digits;
  if (local.length === 12 && local.startsWith('91')) local = local.slice(2);
  else if (local.length === 11 && local.startsWith('0')) local = local.slice(1);
  else if (local.length === 13 && local.startsWith('091')) local = local.slice(3);

  // Indian mobile numbers are 10 digits and begin with 6-9.
  if (!/^[6-9]\d{9}$/.test(local)) return null;
  return local;
}

/** International form used by SMS gateways, e.g. "918714051245". */
export function toInternational(phone: string): string {
  return `91${phone}`;
}

/** Display form, e.g. "+91 87140 51245". */
export function formatPhone(phone: string): string {
  if (phone.length !== 10) return phone;
  return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
}

/** Partially masked for display in confirmations, e.g. "+91 87140 •••45". */
export function maskPhone(phone: string): string {
  if (phone.length !== 10) return phone;
  return `+91 ${phone.slice(0, 5)} •••${phone.slice(8)}`;
}
