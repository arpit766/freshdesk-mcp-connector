## Learned User Preferences

- Create git commits and push to GitHub only when explicitly asked; do not commit proactively.
- For hiring submissions, prefer a public GitHub repo when reviewers need link-only access without collaborator invites.

## Learned Workspace Facts

- TypeScript/Node MCP server for Freshdesk; separate from the Go `ccis-rbl` repo under `/Users/arpitkumar/credit_card/`.
- Public repository on `main`: https://github.com/arpit766/freshdesk-mcp-connector (GitHub user `arpit766`).
- Read-only MCP tools: `list_tickets`, `get_ticket`, `search_tickets` (Zod-validated, stdio transport).
- Local dev without credentials: `FRESHDESK_MODE=mock`; verify with `npm test` (unit, MCP integration, evaluation scenarios).
- Live mode uses `FRESHDESK_API_KEY`, `FRESHDESK_BASE_URL`, and `FRESHDESK_MODE=live`; secrets stay in `.env` (gitignored).
- Built for Razorpay Forward-Deployed Engineer / Agent Studio take-home (Option 3: Freshdesk connector); standard MCP only—no claimed Agent Studio–specific integration beyond docs.
- `.cursor/` is gitignored; do not commit editor metadata or secrets.
