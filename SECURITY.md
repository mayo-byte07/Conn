# Security Policy

## Security Overview

The **Conn** project takes security concerns seriously. We appreciate the work of security researchers and open-source contributors in helping us maintain a safe environment for all users.

---

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Main (`main` branch) | :white_check_mark: |
| Development branches | :x: |

---

## Reporting a Vulnerability

If you discover a security vulnerability or sensitive information disclosure within this repository, **please do not open a public issue**. 

Instead, report it responsibly through one of the following methods:

1. **GitHub Security Advisory**: Submit a private security advisory directly on GitHub under the **Security** tab of the repository.
2. **Direct Contact**: Reach out to the maintainers privately via email or direct message.

### What to Include in Your Report
- Detailed description of the vulnerability or disclosure.
- Steps to reproduce the issue (proof-of-concept script, request payload, or screenshots).
- Potential impact of the issue.
- Any suggested remediations if available.

We will acknowledge receipt of your report within 48 hours and provide updates on the resolution timeline.

---

## Sensitive Files & Credential Guidelines

- **Never Commit Secrets**: Never commit passwords, private keys, API keys, session tokens, `.env` files, or cookie dumps (`cookies.txt`, `*.cookie`) to the repository.
- **Immediate Credential Rotation**: If any secret, token, or session cookie is accidentally exposed in a commit or pull request, **consider it compromised immediately** and rotate/invalidate the credential on all active deployment environments.

---

## Purging Secrets from Git History (For Maintainers & Forks)

If sensitive files (such as `cookies.txt` or `.env`) were historically committed to Git:

1. Install `git-filter-repo` (Python-based tool recommended by Git):
   ```bash
   pip install git-filter-repo
   ```

2. Scrub the file from all commits, tags, and refs:
   ```bash
   git filter-repo --invert-paths --path cookies.txt
   ```

3. Force-push the sanitized repository history (coordinating with all contributors):
   ```bash
   git push origin --force --all
   git push origin --force --tags
   ```

4. Notify all active forks to rebase or re-clone the repository to prevent re-introducing purged history.
