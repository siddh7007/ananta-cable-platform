# Cable DRC Submit Event Spine

Defines the shared contract for tracing and analytics when a design is submitted
for rule checks.

## Event Overview

| Field | Value |
| --- | --- |
| `event` | `cable.drc.submit` |
| Domain | Cable design rule checking |
| Primary producer | API Gateway (`/v1/drc/run`) |
| Upstream producer | DRC service (`/v1/drc/run`) |
| Enablement flag | `OTEL_DRC_ANALYTICS` (defaults to `false`) |

## Lifecycle

1. Portal submits a cable design to the API gateway.
2. Gateway validates payload, forwards to the DRC service, and validates the response.
3. When analytics is enabled, both gateway and service attach span attributes so
   they travel with existing OpenTelemetry traces.

## Attribute Dictionary

| Attribute | Type | Source | Description |
| --- | --- | --- | --- |
| `event` | string | Gateway & DRC service | Always `cable.drc.submit`. Helps downstream processors filter DRC submissions. |
| `design_id` | string | Gateway & DRC service | Cable design identifier taken from the validated request/response. |
| `severity_counts` | string(JSON) | Gateway & DRC service | JSON encoded summary with `info`, `warn`, `error` counts from the upstream response. |
| `upstream.latency_ms` | number | Gateway | Existing upstream latency metric retained for analytics correlation. |

All new attributes stick to OTEL semantic conventions (strings/numbers) so that
batch processors can lift them into the warehouse without schema drift.

## Enablement & Operations

- Disabled by default to avoid cost when telemetry is not provisioned.
- Set `OTEL_ENABLED=true` and `OTEL_DRC_ANALYTICS=true` in the gateway (Node)
  and DRC (FastAPI) services to emit the attributes.
- The DRC service gracefully skips emission when the `opentelemetry-sdk`
  packages are not installed; install them (see README in `services/drc`) before
  enabling analytics in production.

## Sample Span Attributes

```
event = "cable.drc.submit"
design_id = "des-1842"
severity_counts = "{\"info\":0,\"warn\":2,\"error\":1}"
upstream.latency_ms = 182.4
```

This spine should be extended (with the same enablement gate) for future
derivative events such as `cable.drc.retry` or severity rollups.
