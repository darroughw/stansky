// Build-time reminder for business details that are still missing.
// Runs once per build; nothing is shown to visitors.
import { business } from '../data/business';

let warned = false;

export function warnMissingBusinessInfo() {
  if (warned) return;
  warned = true;
  const missing = (['phone', 'email', 'licenseNumber', 'legalName'] as const).filter((k) => !business[k]);
  if (business.insured === null) missing.push('insured' as never);
  const social = Object.entries(business.social)
    .filter(([, v]) => !v)
    .map(([k]) => `social.${k}`);
  const all = [...missing, ...social];
  if (all.length) {
    console.warn(`\n[stansky] Missing business info in src/data/business.ts: ${all.join(', ')}\n`);
  }
}
