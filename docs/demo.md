# Demo

Mock-mode demo (no network or credentials):

```bash
cd freshdesk-mcp-connector
npm install
npm run demo
```

The script:

1. Lists open tickets (page 1).
2. Lists high-priority ticket IDs.
3. Fetches ticket `1003`.
4. Searches for `webhook`.
5. Demonstrates a handled not-found error for ticket `999999`.

All output is written to stderr so stdout remains available for MCP stdio transport in server mode.
