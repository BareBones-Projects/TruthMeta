# MetaTruth — Bones & Remedy
**Version:** 0.10.0-alpha  
**Codename:** The Internet's Tiniest Courtroom  
**Status:** Staging Ready / Manual Review Required

---

## 1. System Overview
MetaTruth is a localized investigative evidence pipeline. It allows a user (Bones) to capture explicit web page snapshots, hash them, and submit them to a human reviewer (Remedy) via a secure local portal. 

The system is designed around **Zero Trust** and **Human-in-the-Loop** principles:
*   **No Auto-Guilt:** The system never assumes a claim is true or false; it only documents evidence.
*   **Explicit Capture:** The extension does not scrape background data. A user must manually click "Capture" on an active tab.
*   **Audit Chain:** Every action (case creation, evidence capture, judge review) is cryptographically hashed and appended to an unalterable audit log.

---

## 2. Quick Start Guide

### A. Start the Admin Portal
1. Ensure Node.js (v18+) is installed.
2. Open a terminal and run:
   ```bash
   cd portal
   node server.mjs

---

## // Alpha readiness · 2026-10-31

This repository is undergoing pre-alpha verification. The presence of source files, illustrative screenshots, or release notes is **not** evidence that every platform build, deployment, security property, or runtime feature has passed testing.

See [the repository-specific alpha audit](docs/ALPHA_READINESS_AUDIT.md) for verified source-inventory findings, unresolved gaps, suggested pull requests, testing requirements, packaging criteria, and related project conversation topics. Review the checked-in implementation and passing test results before promoting the current work to an alpha release.

**Contribution workflow:** work on review branches, attach test evidence and sample artifacts to pull requests, and merge only after acceptance. Avoid committing credentials, transient databases, real personal information, or generated caches.
