# Architecture Decision Records (ADRs)

Architecture Wiki: [https://wiki.byting-pandas.ninja/en/Projects/LUNA-Charts/Introduction]

## Purpose

This directory contains the **Architecture Decision Records (ADRs)** for the LUNA Charts project.

An Architecture Decision Record documents a significant architectural decision, the context in which it was made, the chosen solution, and its consequences.

The goal is to preserve the reasoning behind architectural decisions so that future contributors and maintainers understand **why** a decision was made—not only **what** was implemented.

ADRs complement the Architecture Development Method (ADM) documentation and serve as the primary record of architectural decisions throughout the project's lifecycle.

---

## Architecture Documentation

The complete software architecture of LUNA Charts is documented in the official Architecture Wiki.

The wiki follows the **TOGAF Architecture Development Method (ADM)** and describes the project from the initial vision through implementation governance and long-term architecture evolution.

### Architecture Wiki

* Architecture Vision (Phase A)
* Business Architecture (Phase B)
* Information Systems Architecture (Phase C)
* Technology Architecture (Phase D)
* Opportunities & Solutions (Phase E)
* Migration Planning (Phase F)
* Implementation Governance (Phase G)
* Architecture Change Management (Phase H)

The ADRs contained in this directory should always be read together with the Architecture Wiki.

The wiki describes the architecture as a whole, whereas ADRs explain the reasoning behind individual architectural decisions.

---

## Relationship to the Architecture Documentation

| Architecture Wiki                            | Architecture Decision Records                       |
| -------------------------------------------- | --------------------------------------------------- |
| Describes the complete software architecture | Documents individual architectural decisions        |
| Defines the overall system structure         | Explains why a specific solution was selected       |
| Organized according to TOGAF ADM phases      | Organized chronologically by architectural decision |
| Updated when the architecture evolves        | Added whenever a significant decision is made       |

ADRs do **not** replace the Architecture Wiki.

Likewise, the Architecture Wiki should not duplicate ADRs.

Instead, both artifacts complement each other.

---

## When to Create an ADR

An ADR should be created whenever a decision has a significant impact on the architecture of the project.

Typical examples include:

* Selecting a new technology
* Introducing or replacing an architectural pattern
* Changing the public API
* Introducing a new rendering strategy
* Changing accessibility principles
* Modifying the repository structure
* Changing release or governance processes

Small implementation details, bug fixes, refactorings, or coding style decisions do **not** require an ADR.

---

## ADR Lifecycle

Every ADR has one of the following statuses:

| Status     | Description                                             |
| ---------- | ------------------------------------------------------- |
| Proposed   | The decision is under discussion.                       |
| Accepted   | The decision has been approved and adopted.             |
| Deprecated | The decision is no longer recommended but still exists. |
| Superseded | The decision has been replaced by another ADR.          |
| Discarded  | The proposal was rejected.                              |

Only **Accepted** ADRs represent the current architecture.

---

## ADR Structure

Each ADR follows the same structure.

```text
Title

Status

Context

Decision Drivers

Considered Alternatives

Decision

Rationale

Consequences
    Positive
    Negative

Related TOGAF Phases

References
```

This structure ensures that every ADR answers the following questions:

* **What** decision was made?
* **Why** was the decision necessary?
* **When** was it made?
* **Who** approved the decision?
* **What** are the expected consequences?

---

## Naming Convention

ADRs use sequential numbering.

Examples:

```text
0001-repository-structure.md
0002-technology-stack.md
0003-svg-rendering.md
```

The number is never reused.

If an ADR becomes obsolete, its status changes instead of deleting the document.

---

## Decision Process

Architectural decisions follow the governance model defined in **Implementation Governance (Phase G)**.

```text
Proposal
        ↓
Architecture Discussion
        ↓
Architecture Review
        ↓
Maintainer Decision
        ↓
ADR Update
        ↓
Implementation
```

Community members are encouraged to participate in discussions.

Final architectural decisions are made by the project maintainers.

---

## Relationship to Source Code

Source code is expected to reflect accepted ADRs.

If an implementation no longer follows an accepted ADR, one of the following actions should occur:

* Update the implementation to match the ADR.
* Replace the ADR with a new architectural decision.
* Deprecate or supersede the ADR.

Architectural changes should always be documented before or together with the implementation.

---

## References

* TOGAF Architecture Development Method (ADM)
* LUNA Charts Architecture Wiki
* LUNA Charts Implementation Governance (Phase G)
* LUNA Charts Architecture Change Management (Phase H)
