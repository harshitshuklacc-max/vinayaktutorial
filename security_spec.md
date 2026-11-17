# Security Specification — Vinayak Tutorial Platform

## 1. Data Invariants
1. **Default-Deny Baseline**: Any unlisted path under `/databases/{database}/documents` is rejected (`allow read, write: if false`).
2. **PII Isolation**: `admissions`, `contact_messages`, `students`, `faculty`, `fees`, `payments`, `exam_attempts`, `leave_applications`, `profile_corrections`, and `audit_logs` are never publicly readable.
3. **Role Enforcement (No Client Claims)**: Admin privilege is verified strictly via `request.auth.token.email_verified == true` against `admins/{uid}` or the bootstrapped Super Admin email. Faculty access is verified against `faculty` records (`uid` or verified email) and scoped to their assigned classes.
4. **Immutable Audit Trail**: `audit_logs` entries can only be created with `actorUid == request.auth.uid` and `createdAt == request.time`; updates and deletes are unconditionally blocked.
5. **Temporal & Structural Integrity**: Document IDs must match `^[a-zA-Z0-9_-]{1,128}$`. Every write invokes a dedicated `isValid[Entity]` helper verifying exact required/allowed keys (`hasAll` + `hasOnly`), types, and string/list bounds.
6. **Student Scope**: Students may read/list only their own attendance, fee ledgers, payments, exam attempts, doubts, leave applications, and profile corrections (`resource.data.studentUid == request.auth.uid || resource.data.studentEmail == request.auth.token.email`), and may never modify attendance, fees, payments, or published marks.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Privilege Escalation on Admin Registry**: Unprivileged student sends `setDoc(doc(db, 'admins', uid), { role: 'super_admin', ... })`.
2. **Shadow Field Injection on Admission Enquiry**: Public user submits `admissions` document containing extra field `status: 'Admitted'` or `isVerified: true`.
3. **PII Scraping on Students Collection**: Signed-in student calls `getDocs(collection(db, 'students'))` without filtering to own `studentEmail` / `studentUid`.
4. **Cross-Student Fee Tampering**: Student attempts `updateDoc(doc(db, 'fees', otherFeeId), { paidFee: 999999, remainingFee: 0 })`.
5. **Unverified Email Spoofing**: Attacker with `email_verified: false` matching admin email attempts write to `public_courses`.
6. **ID Poisoning**: Attacker writes document with 500-character or slash-containing document ID (`../admins/x`).
7. **Timestamp Forgery**: Signed-in user submits `audit_logs` or `doubt_requests` with backdated `createdAt`.
8. **Audit Log Erasure**: Even an Admin attempts `deleteDoc(doc(db, 'audit_logs', id))` or `updateDoc(...)`.
9. **Unauthorized Attendance Modification**: Student attempts `setDoc` or `updateDoc` on `attendance/{id}` to mark themselves `Present`.
10. **Exam Answer Key Tampering**: Student attempts `updateDoc` on `examinations/{examId}/questions/{qId}` or attempts to change `obtainedMarks` on `exam_attempts`.
11. **Terminal State Bypass**: Student attempts to reopen or alter an already `Evaluated` `exam_attempts` document or `Approved` `leave_applications` document.
12. **Unbounded Payload / Denial-of-Wallet**: Attacker submits a 2MB string inside `admissions.message` or 500 items inside `courses.subjects`.
