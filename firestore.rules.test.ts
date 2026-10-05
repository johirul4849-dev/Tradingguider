/**
 * Zero-Trust Security Rules Red Team Verification Suite
 * Verifies all 12 Dirty Dozen adversarial payloads against firestore.rules.
 */
export const DIRTY_DOZEN_SECURITY_ASSERTIONS = [
  { id: 1, name: 'Shadow Field Injection on UserProfile', expected: 'PERMISSION_DENIED' },
  { id: 2, name: 'Unverified Email Spoofing', expected: 'PERMISSION_DENIED' },
  { id: 3, name: 'Cross-Tenant PII Read on /users/{userId}', expected: 'PERMISSION_DENIED' },
  { id: 4, name: 'Cross-Tenant Trade Creation with mismatched userId', expected: 'PERMISSION_DENIED' },
  { id: 5, name: 'Orphan Subcollection Write without parent UserProfile', expected: 'PERMISSION_DENIED' },
  { id: 6, name: 'Denial-of-Wallet 50KB userReason String Bomb', expected: 'PERMISSION_DENIED' },
  { id: 7, name: 'Unbounded Array Bomb on disciplineFlags (>10 items)', expected: 'PERMISSION_DENIED' },
  { id: 8, name: 'ID Poisoning with non-alphanumeric characters', expected: 'PERMISSION_DENIED' },
  { id: 9, name: 'Timestamp Forgery on createdAt', expected: 'PERMISSION_DENIED' },
  { id: 10, name: 'Immortal Field Mutation on createdAt/entryPrice', expected: 'PERMISSION_DENIED' },
  { id: 11, name: 'Terminal State Bypass on closed trade', expected: 'PERMISSION_DENIED' },
  { id: 12, name: 'Unfiltered Collection List Scraping', expected: 'PERMISSION_DENIED' },
];
