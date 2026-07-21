# CON-IT-003 — Software Asset Management & Approved Software Policy

**Company:** Contoso Corp  
**Division:** IT & Information Security  
**Policy ID:** CON-IT-003  
**Effective Date:** March 1, 2024  
**Last Reviewed:** February 2024  
**Policy Owner:** Chief Information Officer  
**Applies To:** All Employees, Contractors, and Temporary Workers  

---

## 1. Purpose

This policy establishes requirements for managing software assets at Contoso Corp to ensure license compliance, control security risk introduced by unauthorized software, and optimize software spend. Unauthorized or unlicensed software exposes Contoso Corp to legal liability, security vulnerabilities, and operational risk.

---

## 2. Approved Software Catalog

Contoso Corp maintains an Approved Software Catalog (ASC) updated monthly by the IT team and accessible at **it-portal.contosocorp.com/software-catalog**. Software is categorized as:

| Category | Description | Installation Authority |
|----------|-------------|------------------------|
| **Standard** | Pre-installed or auto-deployed to all employees | IT (automatic) |
| **Role-Based** | Deployed based on job function (e.g., Adobe CC for designers) | IT, upon role assignment |
| **On-Request** | Available via self-service in the IT Portal after manager approval | Employee + Manager |
| **Restricted** | Requires IT Security review and VP approval before use | IT Security |
| **Prohibited** | Never permitted on Contoso Corp systems | N/A — do not install |

### 2.1 Standard Software (All Employees)

- Microsoft 365 (Word, Excel, PowerPoint, Outlook, Teams, SharePoint)
- Microsoft Edge (primary browser) + Chrome (approved secondary)
- CrowdStrike Falcon endpoint protection (IT-managed, cannot be disabled)
- Cisco AnyConnect VPN
- Zoom (company account — do not use personal Zoom accounts for business)
- Workday (HR, Finance, and Procurement)
- LastPass (enterprise password manager)

### 2.2 Prohibited Software

The following categories of software are prohibited on any Contoso Corp system:

- Peer-to-peer file sharing clients (BitTorrent, LimeWire, uTorrent, etc.)
- Personal VPNs or proxy tools (NordVPN, ExpressVPN, Tor Browser, etc.)
- Remote access tools not approved by IT (TeamViewer personal, AnyDesk free, etc.)
- Cryptocurrency mining software of any kind
- Unlicensed or cracked versions of any commercial software
- Any software flagged as malware or PUA (potentially unwanted application) by CrowdStrike
- AI coding or productivity tools not on the approved list (see Section 5)

---

## 3. Requesting New Software

To request software not in the ASC:

1. Search the IT Portal to confirm the software is not already available.
2. Submit a Software Request via the IT Portal, including: business justification, estimated user count, vendor name, and security/data handling information.
3. IT Security conducts a security review (standard: 5 business days; expedited: 2 business days with VP approval).
4. License procurement is handled by IT Procurement; employees must not purchase software licenses on corporate cards without IT pre-approval.
5. Upon approval, IT deploys or grants installation rights through the management platform.

---

## 4. Software License Compliance

Contoso Corp is legally and ethically committed to full software license compliance. Employees must not:

- Install software on more devices than permitted by the license.
- Share or transfer software licenses to unauthorized users.
- Use educational, non-profit, or trial licenses for commercial purposes.
- Copy, reproduce, or distribute proprietary software in violation of the license agreement.

The IT team conducts quarterly automated software inventory scans across all managed devices. Unlicensed or unauthorized software found during scans will be removed remotely, and the employee will be contacted to explain the installation. Repeated violations will be escalated to HR.

---

## 5. AI Tools & Generative AI Policy

The use of generative AI tools for work purposes is governed by a separate AI Acceptable Use Policy (CON-IT-005). In summary:

| Tool | Status | Conditions |
|------|--------|------------|
| Microsoft Copilot (M365) | **Approved** | Do not input confidential client data |
| GitHub Copilot (enterprise license) | **Approved** | Engineers only; review all AI-generated code |
| ChatGPT (personal account) | **Restricted** | Prohibited for confidential or client data |
| ChatGPT Enterprise (via IT) | **On-Request** | Request through IT Portal; approved use cases only |
| Anthropic Claude (anthropic.com) | **On-Request** | Same restrictions as ChatGPT personal |
| Google Gemini (personal) | **Restricted** | Prohibited for confidential data |
| Midjourney / DALL-E | **Restricted** | Creative team only; IP and copyright review required |

> **Never input the following into any AI tool:** Client names or contract details, employee personal data, source code from proprietary systems, financial data, M&A information, or any data classified as Confidential or Restricted per CON-IT-006.

---

## 6. Open Source Software (OSS)

Contoso Corp permits the use of open source software in products and projects, subject to:

- **License review:** All OSS with copyleft licenses (GPL, AGPL, LGPL) must be reviewed by Legal before incorporation into any commercial product. Permissive licenses (MIT, Apache 2.0, BSD) are generally pre-approved.
- **Vulnerability management:** OSS components must be tracked in the Software Composition Analysis (SCA) tool (Snyk). Known critical/high CVEs must be remediated within 14 days.
- **No license laundering:** OSS must not be used to circumvent procurement or license compliance requirements.

Developers must register OSS use in Snyk at the time of first use. Unregistered OSS components discovered in production systems will be flagged as a security finding.

---

## 7. Software at Separation

Employees leaving Contoso Corp must:

- Not copy or retain any company-licensed software, including installer files or license keys.
- Return any physical media containing software.
- Acknowledge that all company software access will be revoked on the separation date.

Contractor access to company software systems is provisioned per the Statement of Work and automatically expires on the contract end date. Extensions require IT request 5 business days in advance.

---

## 8. Enforcement

Violations of this policy are subject to disciplinary action under the Code of Conduct (CON-HR-001), up to and including termination. License violations may also result in personal civil liability where the employee acted outside the scope of their role. Questions about software licensing should be directed to the IT Help Desk (ext. 4357) before installation — not after.

---

*Questions: itsecurity@contosocorp.com | IT Help Desk: ext. 4357 | Contoso Corp Confidential | CON-IT-003*
