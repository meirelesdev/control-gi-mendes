# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

No build tools or npm — this is pure vanilla JS with native ES6 modules. Must be served via HTTP (not `file://`):

- **XAMPP:** Place in `htdocs/` and access at `http://localhost/control-gi-mendes`
- **Python:** `python -m http.server 8000`
- **Node.js:** `npx http-server -p 8000`

## Architecture: Clean Architecture (Strict)

All active code lives under `/src`. The root-level `domain/`, `application/`, `infrastructure/`, `presentation/`, and `app.js` are the **old architecture kept only for reference** — do not modify them.

**Layer rules (never violate cross-layer dependencies):**

| Layer | Path | Rule |
|-------|------|------|
| Domain | `src/domain/` | Pure JS — zero external deps, no DOM, no localStorage |
| Application | `src/application/use-cases/` | Orchestrates domain only; no HTML/CSS/localStorage knowledge |
| Infrastructure | `src/infrastructure/repositories/` | **Only place** where `localStorage` is accessed; maps raw JSON → entities |
| Presentation | `src/presentation/` | Views call use cases only — never repositories directly |

**Dependency injection entry point:** `src/main.js` wires all repositories, use cases, and the `App` controller together on `DOMContentLoaded`.

## Key Business Rules

**Reimbursement vs. Profit distinction:**
- `EXPENSE` transactions = money spent, reimbursable by client (not profit)
- `INCOME` transactions with `isReimbursement: true` = also reimbursable (e.g., KM, travel time, accommodation)
- `INCOME` transactions with `isReimbursement: false` = actual profit (diárias, horas extras)

**Auto-calculated income types** (use Settings rates, calculate in use case not in view):
- KM: `distance × settings.rateKm`
- Travel time: `hours × settings.overtimeRate`

**Event status flow:** `PLANNED → DONE → REPORT_SENT → PAID` (events cannot be edited when `PAID`)

## Entities

- **`Event`** — `Event.create()` for new, `Event.restore()` for deserialization
- **`Transaction`** — `Transaction.createExpense()` / `Transaction.createIncome()`; uses `metadata` object for flexible extra fields (e.g., `hasReceipt`, `category`, `checkIn`, `checkOut`)
- **`Settings`** — singleton with KM rate, overtime rate, daily rate, hotel ceiling, contractor info

## localStorage Keys

```
chef_finance_events        — events
chef_finance_transactions  — all transactions
chef_finance_settings      — app settings
```

## Coding Style

- Use JSDoc for type hints (`@param {Event} event`)
- CSS variables only — defined in `src/presentation/styles/variables.css`, referenced as `var(--name)`
- `export default` for classes, named `export` for utilities
- Files must stay small and single-responsibility
- Never install runtime npm packages — zero-dependency constraint is intentional
