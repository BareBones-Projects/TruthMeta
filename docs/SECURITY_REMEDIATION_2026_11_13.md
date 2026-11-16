# // TruthMeta security remediation

## Immediate findings
The repository formerly tracked `portal/data/metatruth.db-wal` and `portal/data/metatruth.db-shm`. These are SQLite runtime journals, not source files. They may contain recoverable application data and must not ship in a source package. This PR removes them from the current tree and adds ignore rules plus a CI assertion. **Removing paths does not erase their contents from Git history.** Treat historical commits as potentially sensitive and assess incident response and coordinated history sanitation separately.

## Blockers before any public deployment
1. The current server contains a default admin email/password fallback. Require unique credentials from secrets and first-run bootstrap before production.
2. The current server exposes wildcard CORS headers. Restrict origins, methods, and headers to validated consumers.
3. Add request-body limits, centralized error handling, CSRF/origin checks as appropriate, login throttling and account lockout protection.
4. Validate server-side authorization for every case, evidence, appeal and decision operation, not solely client UI controls.
5. Test session expiration/revocation, evidence provenance and audit-chain verification with negative cases.
6. Keep the portal bound to loopback for local alpha and do not advertise it as externally hardened.

## Local validation
- `python3 test_release.py`
- `git ls-files 'portal/data/*.db*'` should return nothing.
- Extension manual smoke test in Chromium and API negative-path checks are still required.

**Release decision:** HOLD until these security gates are proven.
