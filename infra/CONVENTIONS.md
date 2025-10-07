# Infrastructure Conventions

This document outlines the naming and tagging conventions for all infrastructure resources within the Ananta Cable Platform project.

## Naming Convention

All resources are named using a consistent, delimited format to provide immediate insight into their purpose and context.

**Template:** `<app-id>-<env>-<resource-name>`

### Components

-   **`<app-id>`**: A short, lowercase identifier for the application.
    -   **Value:** `acp` (for Ananta Cable Platform)
-   **`<env>`**: A short, lowercase identifier for the deployment environment.
    -   **Values:** `dev`, `stg`, `prd`
-   **`<resource-name>`**: A descriptive, lowercase name for the specific resource, using hyphens for spaces.
    -   **Examples:** `portal-vm`, `orders-db`, `api-gateway`

### Examples

-   **Development VM:** `acp-dev-portal-vm`
-   **Staging Database:** `acp-stg-orders-db`
-   **Production Gateway:** `acp-prd-api-gateway`

## Tagging Convention

Tags are applied to all resources to facilitate cost tracking, automation, and resource management.

### Standard Tags

-   **`Environment`**: The full name of the deployment environment.
    -   **Values:** `development`, `staging`, `production`
-   **`Application`**: The full name of the application.
    -   **Value:** `Ananta Cable Platform`
-   **`Owner`**: The team or business unit responsible for the resource.
    -   **Value:** `SBP`
-   **`ManagedBy`**: The tool used to provision and manage the resource.
    -   **Value:** `Terraform`
