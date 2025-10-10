/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminUser } from '../models/AdminUser';
import type { AdminUserList } from '../models/AdminUserList';
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
    public static postAdminUsers-:deactivate(
        id: string,
    ): CancelablePromise<AdminUser> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/users/{id}:deactivate',
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
    public static postAdminUsers-:reactivate(
        id: string,
    ): CancelablePromise<AdminUser> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/users/{id}:reactivate',
            path: {
                'id': id,
            },
            errors: {
                403: `Forbidden - admin access required`,
                404: `User not found`,
            },
        });
    }
}
