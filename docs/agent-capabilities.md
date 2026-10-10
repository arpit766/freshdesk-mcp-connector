# Agent capabilities

## What the agent can do (via MCP tools)

- **List tickets** with pagination and optional `status` / `priority` filters.
- **Get a ticket** by numeric ID with normalized, bounded fields.
- **Search tickets** by keyword with optional `status` / `priority` filters.

All tools are **read-only**. They do not create, update, delete, reply to, or close tickets.

## What the agent cannot do

- Modify Freshdesk data or agent workflows.
- Access arbitrary URLs, run shell commands, or query SQL.
- Bypass Freshdesk permissions granted to the API key.
- Guarantee removal of all PII from free-text descriptions (see security doc).

## Operational guardrails

- Page sizes and search query length are capped.
- Responses use field allowlisting and text redaction helpers.
- Ticket body text is untrusted input and must not be treated as instructions.

## Connecting a compatible MCP client

Use stdio transport pointing at the built server binary. Example (syntax varies by client):

```json
{
  "mcpServers": {
    "freshdesk": {
      "command": "node",
      "args": ["/absolute/path/to/freshdesk-mcp-connector/dist/index.js"],
      "env": {
        "FRESHDESK_MODE": "mock"
      }
    }
  }
}
```

**Razorpay Agent Studio compatibility has not been independently verified.** This project implements a standard MCP server interface; connecting Agent Studio requires a client that supports the same MCP version and transport.
