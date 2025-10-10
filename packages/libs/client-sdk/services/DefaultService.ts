/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminDbStats } from '../models/AdminDbStats';
import type { AdminUser } from '../models/AdminUser';
import type { AdminUserList } from '../models/AdminUserList';
import type { FeatureFlags } from '../models/FeatureFlags';
import type { FeatureFlagToggleRequest } from '../models/FeatureFlagToggleRequest';
import type { FeatureFlagToggleResponse } from '../models/FeatureFlagToggleResponse';
import type { Project } from '../models/Project';
import type { ProjectList } from '../models/ProjectList';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * API health
     * @returns any OK
     * @throws ApiError
     */
    public static getHealth(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health',
        });
    }
    /**
     * Current user
     * @returns any OK
     * @throws ApiError
     */
    public static getV1Me(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/me',
        });
    }
    /**
     * Run DRC
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postV1DrcRun(
        requestBody: {
            id: string;
            name: string;
            cores: number;
        },
    ): CancelablePromise<{
        design_id: string;
        findings: Array<{
            code: string;
            message: string;
            severity: 'info' | 'warn' | 'error';
            path?: string;
        }>;
        severity_summary: {
            info?: number;
            warn?: number;
            error?: number;
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/drc/run',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * List projects
     * Get paginated list of projects
     * @returns ProjectList Projects retrieved successfully
     * @throws ApiError
     */
    public static getV1Projects(): CancelablePromise<ProjectList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/projects',
        });
    }
    /**
     * Get project
     * Get a specific project by ID
     * @param id Project ID
     * @returns Project Project retrieved successfully
     * @throws ApiError
     */
    public static getV1Projects1(
        id: string,
    ): CancelablePromise<Project> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/projects/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Project not found`,
            },
        });
    }
    /**
     * List admin users
     * Get paginated list of admin users with optional search
     * @param query Search query for name or email (case-insensitive substring)
     * @param limit Maximum number of users to return
     * @param offset Number of users to skip
     * @returns AdminUserList List of admin users
     * @throws ApiError
     */
    public static getAdminUsers(
        query?: string,
        limit: number = 25,
        offset?: number,
    ): CancelablePromise<AdminUserList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/users',
            query: {
                'query': query,
                'limit': limit,
                'offset': offset,
            },
            errors: {
                400: `Bad request - invalid parameters`,
                403: `Forbidden - admin access required`,
            },
        });
    }
    /**
     * Deactivate admin user
     * Deactivate an admin user account
     * @param id User ID to deactivate
     * @returns AdminUser User deactivated successfully
     * @throws ApiError
     */
    public static postAdminUsersDeactivate(
        id: string,
    ): CancelablePromise<AdminUser> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/users/{id}/deactivate',
            path: {
                'id': id,
            },
            errors: {
                403: `Forbidden - admin access required`,
                404: `User not found`,
            },
        });
    }
    /**
     * Reactivate admin user
     * Reactivate a deactivated admin user account
     * @param id User ID to reactivate
     * @returns AdminUser User reactivated successfully
     * @throws ApiError
     */
    public static postAdminUsersReactivate(
        id: string,
    ): CancelablePromise<AdminUser> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/users/{id}/reactivate',
            path: {
                'id': id,
            },
            errors: {
                403: `Forbidden - admin access required`,
                404: `User not found`,
            },
        });
    }
    /**
     * Database statistics
     * Get database connection health and entity counts
     * @returns AdminDbStats Database statistics retrieved successfully
     * @throws ApiError
     */
    public static getAdminDbStats(): CancelablePromise<AdminDbStats> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/db/stats',
            errors: {
                403: `Forbidden - admin access required`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * List feature flags
     * Get feature flags filtered by scope and optional workspaceId
     * @param scope Scope of feature flags to retrieve
     * @param workspaceId Workspace ID (required when scope is workspace)
     * @returns FeatureFlags Feature flags retrieved successfully
     * @throws ApiError
     */
    public static getAdminFlags(
        scope: 'org' | 'workspace' = 'org',
        workspaceId?: string,
    ): CancelablePromise<FeatureFlags> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/flags',
            query: {
                'scope': scope,
                'workspaceId': workspaceId,
            },
            errors: {
                403: `Forbidden - admin access required`,
            },
        });
    }
    /**
     * Toggle feature flag
     * Enable or disable a feature flag
     * @param requestBody
     * @returns FeatureFlagToggleResponse Feature flag toggled successfully
     * @throws ApiError
     */
    public static postAdminFlagsToggle(
        requestBody: FeatureFlagToggleRequest,
    ): CancelablePromise<FeatureFlagToggleResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/flags/toggle',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request - flag not found or invalid parameters`,
                403: `Forbidden - admin access required`,
            },
        });
    }
}
