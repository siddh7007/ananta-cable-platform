# Deployment Environments

This directory contains the configuration for the various deployment environments of the Ananta Cable Platform. The infrastructure is managed by Terraform.

## Structure

Each subdirectory represents a distinct environment and contains a `main.tfvars` file with the specific variable values for that environment.

- **`dev/`**: The Development environment.
- **`staging/`**: The Staging environment for pre-production testing.
- **`prod/`**: The Production environment.

## General Configuration

- **Cloud Provider:** Oracle Cloud Infrastructure (OCI)
- **Region:** All environments are deployed to the `us-sanjose-1` region.

## Environment-Specific Configurations

### Development (`dev`)
- **Logging:** Full debug-level logging is enabled.
- **Authentication:** Authentication is bypassed to facilitate easier development and testing.

### Staging (`staging`)
- **Logging:** Standard `info`-level logging.
- **Authentication:** Standard authentication is enforced, mirroring production.

### Production (`prod`)
- **Logging:** `warn`-level logging to capture only significant events.
- **Authentication:** Standard authentication is enforced.
