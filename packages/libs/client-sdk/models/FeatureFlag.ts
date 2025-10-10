/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A feature flag configuration at org or workspace scope
 */
export type FeatureFlag = {
    /**
     * Unique identifier for the feature flag
     */
    key: string;
    /**
     * Human-readable description of the feature flag
     */
    description?: string;
    /**
     * Whether the feature flag is enabled
     */
    enabled: boolean;
    /**
     * Scope at which the flag applies
     */
    scope: FeatureFlag.scope;
    /**
     * Workspace ID (required when scope is workspace)
     */
    workspaceId?: string;
    /**
     * ISO timestamp of last update
     */
    updatedAt?: string;
};
export namespace FeatureFlag {
    /**
     * Scope at which the flag applies
     */
    export enum scope {
        ORG = 'org',
        WORKSPACE = 'workspace',
    }
}

