# Evaluation

This document records **deterministic connector tests** (not LLM answer quality).

## Commands

```bash
npm run format:check
npm run lint
npm run build
npm test
npm run test:coverage
npm run demo
```

## Observed results (local run)

| Step | Result |
| --- | --- |
| `format:check` | Pass |
| `lint` | Pass |
| `build` | Pass (`tsc`) |
| `npm test` | **46 tests passed** (9 files) |
| `npm run demo` | Completed successfully in mock mode |
| MCP stdio integration | Tools listed; list/get/search/not-found verified |

### Evaluation suite summary

The `tests/evaluation/evaluation-suite.test.ts` file runs **16 scenarios** plus a summary assertion:

```json
{
  "totalScenarios": 16,
  "passedScenarios": 16,
  "failedScenarios": 0,
  "toolCallSuccessRate": 1,
  "note": "Deterministic connector checks — not LLM semantic accuracy."
}
```

Re-run locally to refresh numbers after code changes:

```bash
npm test -- tests/evaluation/evaluation-suite.test.ts
```
