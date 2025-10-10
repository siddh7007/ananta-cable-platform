/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to toggle a feature flag
 */
export type FeatureFlagToggleRequest = {
    /**
     * Feature flag key to toggle
     */
    key: string;
    /**
     * New enabled state
     */
    enabled: boolean;
    /**
     * Scope of the flag
     */
    scope: FeatureFlagToggleRequest.scope;
    /**
     * Workspace ID (required when scope is workspace)
     */
    workspaceId?: string;
};
export namespace FeatureFlagToggleRequest {
    /**
     * Scope of the flag
     */
    export enum scope {
        ORG = 'org',
        WORKSPACE = 'workspace',
    }
}

