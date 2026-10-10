# Limitations

## Freshdesk API and plan dependencies

- Available fields and search behavior depend on your Freshdesk plan and API key permissions.
- Default status codes (2=Open, 3=Pending, 4=Resolved, 5=Closed) may differ if custom statuses are configured.

## Search API

- Search uses Freshdesk query syntax; not every field supports full-text search.
- Combined keyword + filter queries are translated to Freshdesk search expressions; complex queries may need manual adjustment for advanced accounts.

## Pagination

- List endpoint pagination uses `page` and `per_page` (max 100).
- Search endpoint pagination uses `page`; result totals depend on Freshdesk returning `total`.
- `has_more` is inferred when totals are absent.

## Rate limits

- Freshdesk enforces per-plan per-minute API limits.
- This connector adds a **local** token-bucket throttle and retries on HTTP 429; multiple processes do not share state.

## Personal data

- Ticket descriptions may still contain PII despite redaction helpers.
- Conversations, full contact records, and email addresses are intentionally omitted from normalized ticket payloads.

## Write operations

- Not implemented by design (read-only assignment scope).

## MCP vs Agent Studio

- **MCP compatibility ≠ Razorpay Agent Studio integration.** Agent Studio must support your MCP transport/version and be configured manually.
- Mock-mode demo success does not prove production merchant integration without live credentials and permission validation.
