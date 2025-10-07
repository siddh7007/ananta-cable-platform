// OTEL Client Stub (optional)
// To enable tracing, install packages:
//   pnpm add @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
// Then uncomment and call initOtel() early in your process.

/*
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

export function initOtel() {
  const exporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://otel-collector:4318/v1/traces"
  });
  const sdk = new NodeSDK({
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()]
  });
  sdk.start();
  console.log("OTEL initialized");
}
*/
