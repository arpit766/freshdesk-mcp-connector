# Security and guardrails

## Trust boundaries

| Trusted | Untrusted |
| --- | --- |
| Environment configuration (`FRESHDESK_*`) | Ticket subjects, descriptions, tags |
| Freshdesk REST API responses (authenticated) | User-provided search strings |
| MCP tool input schemas (Zod validation) | Free-text fields returned to the agent |

## Authentication

- API keys are loaded **only** from environment variables.
- Live mode requires HTTPS and a Freshdesk-hosted domain (`*.freshdesk.com`, `*.myfreshworks.com`).
- Authorization headers and API keys are never logged or returned in tool errors.

## Tool permissions

- Three read-only tools: `list_tickets`, `get_ticket`, `search_tickets`.
- No generic HTTP fetch, proxy, SQL, or shell tools.

## Sensitive data handling

- Response normalization bounds description length and redacts common email/phone patterns in text fields.
- Logs use structured JSON on stderr with sensitive key redaction.
- Connector-level redaction **does not** guarantee removal of all sensitive data embedded in arbitrary ticket text.

## Untrusted ticket content

Ticket content may contain prompt-injection patterns. The connector does not execute instructions from tickets and does not change configuration based on ticket text.

## Failure behavior

- Validation failures return tool errors without retries.
- Transient upstream failures use bounded retries with exponential backoff and optional `Retry-After` respect.
- Raw upstream responses, stack traces, and secrets are not exposed to the agent.

## Remaining risks

- API key scope follows the Freshdesk agent profile permissions.
- Client-side rate limiting does not coordinate across multiple server instances.
- Search and list semantics depend on Freshdesk plan and account configuration.
