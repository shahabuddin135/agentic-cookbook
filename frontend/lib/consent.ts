export type ConsentPref = { essential: true; analytics: boolean };

export function getConsent(): ConsentPref | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie.match(/consent_pref=([^;]+)/);
  return raw ? JSON.parse(decodeURIComponent(raw[1])) : null;
}

export function setConsent(pref: ConsentPref) {
  const value = encodeURIComponent(JSON.stringify(pref));
  document.cookie = `consent_pref=${value}; max-age=${365 * 24 * 3600}; SameSite=Lax; path=/`;
}
