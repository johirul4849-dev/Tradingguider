# TradePilot AI — Zero-Trust Firestore Security Specification

## 1. Data Invariants
1. **Identity Isolation (`users/{userId}`)**: A user profile document ID `{userId}` must strictly equal `request.auth.uid` and `incoming().uid == request.auth.uid`. PII (`email`, `displayName`, `photoURL`) is strictly readable only by the document owner (`isOwner(userId)`) or a verified administrator (`isAdmin()`).
2. **Relational Parent Gate**: Every subcollection document (`trades`, `disciplineEvents`, `strategies`, `trainingProgress`) under `/users/{userId}` can only be created, updated, or deleted if the parent `/users/{userId}` document exists and `request.auth.uid == userId`.
3. **Strict Schema & Key Whitelisting**: Every `create` and `update` must pass `isValid[Entity](incoming())` which enforces `keys().hasAll(...)`, `keys().hasOnly(...)`, strict types, bounded string lengths, and bounded list sizes (`disciplineFlags.size() <= 10`).
4. **Temporal Integrity**: All `createdAt` fields must equal `request.time` on creation and remain immutable on update. All `updatedAt` fields must equal `request.time` on creation and update.
5. **Secure List Queries**: Every `allow list` rule enforces `resource.data.userId == request.auth.uid` directly without delegating filtering to the client or performing O(n) `get()` lookups.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Shadow Field Injection**: Creating `/users/{uid}` with extra field `{"isAdmin": true}` -> Rejected by `keys().hasOnly(...)`.
2. **Unverified Email Spoofing**: Request with `email: "johirul4891@gmail.com"` and `email_verified: false` -> Rejected by `isVerifiedUser()`.
3. **Cross-Tenant PII Read**: Authenticated user `uid_B` attempting `get` on `/users/uid_A` -> Rejected by `isOwner(userId)`.
4. **Cross-Tenant Trade Creation**: User `uid_A` creating `/users/uid_A/trades/t1` with `userId: "uid_B"` -> Rejected by `data.userId == request.auth.uid`.
5. **Orphan Subcollection Write**: Creating `/users/uid_A/trades/t1` when `/users/uid_A` does not exist -> Rejected by Master Gate `exists(/databases/$(database)/documents/users/$(userId))`.
6. **Denial-of-Wallet String Bomb**: Injecting a 50,000-character `userReason` into `SimulatedTrade` -> Rejected by `data.userReason.size() <= 1000`.
7. **Unbounded Array Bomb**: Passing 50 items in `disciplineFlags` -> Rejected by `data.disciplineFlags.size() <= 10`.
8. **ID Poisoning**: Creating a trade with a 500-char special-character ID -> Rejected by `isValidId(tradeId)`.
9. **Timestamp Forgery on Create**: Setting `createdAt` to a past timestamp -> Rejected by `incoming().createdAt == request.time`.
10. **Immortal Field Mutation**: Modifying `createdAt` or `entryPrice` on an existing trade update -> Rejected by `incoming().createdAt == existing().createdAt` and `affectedKeys().hasOnly(...)`.
11. **Terminal State Bypass**: Updating an already closed trade (`status != 'OPEN'`) -> Rejected by terminal state lock `existing().status == 'OPEN'` (except AI review summary attachment).
12. **Unfiltered Collection List Scraping**: Listing trades without `where('userId', '==', uid)` -> Rejected by `resource.data.userId == request.auth.uid`.
