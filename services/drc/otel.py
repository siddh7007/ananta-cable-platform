import json
import logging
import os
from typing import Mapping, Optional

logger = logging.getLogger("drc.analytics")

OTEL_DRC_ANALYTICS = (os.getenv("OTEL_DRC_ANALYTICS", "false").lower() == "true")

try:
    from opentelemetry import trace as otel_trace
except ImportError:  # pragma: no cover
    otel_trace = None

_warned_missing_dep = False


def record_drc_submit_span(design_id: Optional[str], severity_counts: Optional[Mapping[str, int]]) -> None:
    """
    Add OTEL span attributes for a DRC submit lifecycle.

    Attributes are emitted only when OTEL_DRC_ANALYTICS is enabled and the
    opentelemetry API is importable.
    """
    global _warned_missing_dep

    if not OTEL_DRC_ANALYTICS:
        return

    if otel_trace is None:
        if not _warned_missing_dep:
            logger.warning(
                "OTEL_DRC_ANALYTICS enabled but opentelemetry packages are missing; skipping span attributes"
            )
            _warned_missing_dep = True
        return

    span = otel_trace.get_current_span()
    if span is None or not span.is_recording():
        return

    span.set_attribute("event", "cable.drc.submit")
    if design_id:
        span.set_attribute("design_id", design_id)

    if severity_counts:
        span.set_attribute("severity_counts", json.dumps(severity_counts))
