/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FeatureFlag } from './FeatureFlag';
/**
 * Response from toggling a feature flag
 */
export type FeatureFlagToggleResponse = {
    /**
     * Whether the toggle was successful
     */
    success: boolean;
    /**
     * The updated feature flag
     */
    flag: FeatureFlag;
    /**
     * Human-readable message about the operation
     */
    message?: string;
};

