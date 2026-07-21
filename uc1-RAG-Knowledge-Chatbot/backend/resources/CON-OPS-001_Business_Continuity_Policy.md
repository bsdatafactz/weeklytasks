# CON-OPS-001 — Business Continuity & Disaster Recovery Policy

**Company:** Contoso Corp  
**Division:** Operations & Risk Management  
**Policy ID:** CON-OPS-001  
**Effective Date:** January 1, 2024  
**Last Reviewed:** October 2023  
**Policy Owner:** Chief Operating Officer  
**Classification:** Internal — All Employees  

---

## 1. Purpose & Scope

This policy establishes Contoso Corp's approach to maintaining business continuity (BC) and recovering critical systems following a disruptive event. It applies to all business units, locations, and critical technology systems. Contoso Corp is committed to minimizing the impact of disruptions on clients, employees, and stakeholders.

A **disruptive event** may include: natural disaster, cybersecurity incident, pandemic, critical infrastructure failure (power, internet, utilities), facility damage, or the loss of key personnel.

---

## 2. Recovery Objectives

### Key Metrics

| Term | Definition | Contoso Corp Standard |
|------|-----------|----------------------|
| **RTO** (Recovery Time Objective) | Maximum tolerable downtime for a system before resumption | See Section 3 |
| **RPO** (Recovery Point Objective) | Maximum acceptable data loss (in time) | See Section 3 |
| **MTTR** (Mean Time to Restore) | Average time to restore after an incident | Target: < RTO |
| **MAD** (Maximum Allowable Downtime) | Longest the business can survive without the system | Drives RTO targets |

---

## 3. System Criticality Tiers

All Contoso Corp systems are classified into one of four tiers:

### Tier 1 — Mission Critical
**RTO: 2 hours | RPO: 15 minutes**

Systems whose failure immediately impacts client deliverables, revenue, or compliance:

- Core production platforms (client-facing applications)
- Payment processing and financial systems
- Azure Active Directory / Identity systems
- Tier 1 client data storage and APIs
- Internal communication (Microsoft Teams, email)

### Tier 2 — Business Critical
**RTO: 8 hours | RPO: 1 hour**

Systems whose failure significantly disrupts operations within the business day:

- ERP and financial reporting systems
- HR systems (Workday)
- Customer relationship management (Salesforce)
- Secondary client data systems

### Tier 3 — Important
**RTO: 24 hours | RPO: 4 hours**

Systems that cause meaningful but manageable disruption:

- Internal collaboration tools (SharePoint, document management)
- IT ticketing and service management
- Analytics and reporting platforms

### Tier 4 — Non-Critical
**RTO: 72 hours | RPO: 24 hours**

Systems whose failure does not immediately impact core operations:

- Development and test environments
- Internal portals and intranet content
- Archive and historical data systems

---

## 4. Business Continuity Plans (BCPs)

Each business unit with a Tier 1 or Tier 2 dependency is required to maintain a Business Continuity Plan. BCPs must include:

1. **Risk Assessment** — Identification of threats specific to the business unit and probability/impact ratings.
2. **Business Impact Analysis (BIA)** — Quantification of the cost of disruption over time (hourly, daily, weekly).
3. **Recovery Procedures** — Step-by-step instructions for continuing or resuming operations.
4. **Alternate Work Arrangements** — Remote work provisions, alternate site procedures, manual workarounds.
5. **Communication Tree** — Contact list for employees, clients, vendors, and regulators during a disruption.
6. **Testing Schedule** — Tabletop exercises (annually), functional tests (every 2 years), full simulation (every 3 years).

BCPs are owned by the relevant VP, maintained in the BCP repository on SharePoint, and reviewed annually by the COO.

---

## 5. Incident Response Integration

Business continuity events with a cybersecurity component (ransomware, data breach, DDoS) are handled under the Security Incident Response Policy (CON-IT-002). The CISO and COO coordinate jointly for such events. Non-security disruptions (facility loss, natural disaster, vendor failure) are led by the COO with IT Operations support.

---

## 6. Employee Responsibilities During a Disruption

All employees must:

- **Know their BCP contact:** Be aware of who to call and how to receive updates. The primary communication channel during a crisis is the Contoso Corp Emergency Notification System (ENS), which sends alerts via SMS, email, and the Teams emergency channel.
- **Work remotely when directed:** Employees must have the equipment and connectivity to work remotely on short notice (see CON-HR-009).
- **Report safety emergencies to 911 first** — then HR and Facilities.
- **Not speak to media or external parties** about an active business disruption without authorization from the Communications team.

### Emergency Contact Information

| Contact | Phone | When to Use |
|---------|-------|-------------|
| Emergency (life/safety) | 911 | Immediate danger |
| Contoso Corp Security Desk | 1-800-555-0200 | Facility security, non-life-threatening |
| IT Security Hotline | 1-800-555-0911 | Cybersecurity incidents |
| HR Emergency Line | 1-888-555-0100 | Employee welfare, travel emergencies |
| Executive On-Call (via Security Desk) | Via 1-800-555-0200 | Crisis escalation |

---

## 7. Backup & Recovery Standards

The IT Operations team is responsible for implementing and validating backup controls:

- **Tier 1 systems:** Continuous replication to secondary Azure region; tested monthly.
- **Tier 2 systems:** Hourly incremental + nightly full backup; tested quarterly.
- **Tier 3 systems:** Daily backup; tested semi-annually.
- **Backup retention:** Minimum 30 days for all tiers; 7 years for financial records.
- **Immutable backups:** All backup copies are protected from modification or deletion for minimum 90 days (ransomware protection).

Backup test results are reported to the COO and CISO quarterly. Failed backup tests must be remediated within 10 business days.

---

## 8. Plan Review & Testing

| Activity | Frequency | Responsible |
|----------|-----------|-------------|
| BCP document review and update | Annually (Q4) | Business Unit VP + COO |
| Tabletop exercise (scenario walkthrough) | Annually | COO + IT + HR |
| Functional test (partial recovery activation) | Every 2 years | IT Operations |
| Full DR simulation (complete failover test) | Every 3 years | COO + CTO + CISO |

Test results, gap findings, and remediation plans are documented and tracked to closure.

---

*Questions: businesscontinuity@contosocorp.com | Contoso Corp Internal | CON-OPS-001*
