#!/bin/bash

# Contract Compatibility Check Script
# Checks OpenAPI spec compatibility against a baseline using openapi-diff

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
OPENAPI_SPEC="shared/contracts/openapi/v1/platform.v1.yaml"  # Adjust path as needed
DOCKER_IMAGE="openapitools/openapi-diff:latest"
CONTAINER_NAME="openapi-diff-check"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if file exists
check_file_exists() {
    local file="$1"
    if [[ ! -f "$file" ]]; then
        log_error "File not found: $file"
        exit 1
    fi
}

# Get latest git tag
get_latest_tag() {
    local latest_tag
    latest_tag=$(git tag --sort=-version:refname | head -n 1)
    echo "$latest_tag"
}

# Check if current commit has breaking changes
check_breaking_changes() {
    local baseline="$1"
    local current="$2"

    log_info "Comparing OpenAPI specs..."
    log_info "Baseline: $baseline"
    log_info "Current: $current"

    # Copy baseline to a local file for Docker mounting
    local baseline_local="/tmp/baseline-openapi.yaml"
    cp "$baseline" "$baseline_local"

    # Run openapi-diff in Docker
    if docker run --rm \
        -v "$(pwd):/specs" \
        -v "$baseline_local:/specs/baseline.yaml" \
        --name "$CONTAINER_NAME" \
        "$DOCKER_IMAGE" \
        /specs/baseline.yaml \
        /specs/"$current"; then

        log_success "No breaking changes detected!"
        rm -f "$baseline_local"
        return 0
    else
        local exit_code=$?
        log_error "Breaking changes detected! (exit code: $exit_code)"
        log_warn "Please review the changes above and update your API consumers accordingly."
        rm -f "$baseline_local"
        return $exit_code
    fi
}

# Main function
main() {
    log_info "Starting OpenAPI contract compatibility check..."

    # Check if OpenAPI spec exists
    check_file_exists "$OPENAPI_SPEC"

    # Get latest tag
    local latest_tag
    latest_tag=$(get_latest_tag)

    if [[ -z "$latest_tag" ]]; then
        log_warn "No git tags found in repository."
        log_info "This appears to be a new repository or the first time running compatibility checks."
        log_info ""
        log_info "To enable breaking change detection, you have a few options:"
        echo "  1. Create an initial baseline tag:"
        echo "     git tag -a v0.1.0 -m 'Initial API baseline'"
        echo "     git push origin v0.1.0"
        echo ""
        echo "  2. Use a specific commit as baseline:"
        echo "     git tag -a baseline-$(git rev-parse --short HEAD) -m 'API baseline'"
        echo ""
        echo "  3. Skip compatibility checks for now (not recommended for production)"
        echo ""
        log_info "Running in informational mode - no baseline comparison performed."
        log_success "OpenAPI spec validation completed (no breaking changes to check)."
        exit 0
    fi

    log_info "Found latest tag: $latest_tag"

    # Get the OpenAPI spec from the baseline tag
    local baseline_spec
    baseline_spec=$(mktemp)

    if ! git show "$latest_tag:$OPENAPI_SPEC" > "$baseline_spec" 2>/dev/null; then
        log_error "Could not retrieve OpenAPI spec from tag $latest_tag"
        log_warn "The tagged version may not contain the expected OpenAPI spec file."
        log_info "Falling back to informational mode."
        rm -f "$baseline_spec"
        exit 0
    fi

    # Check for breaking changes
    local result
    if check_breaking_changes "$baseline_spec" "$OPENAPI_SPEC"; then
        result=0
    else
        result=$?
    fi

    # Cleanup
    rm -f "$baseline_spec"

    exit $result
}

# Run main function
main "$@"