/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
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
}
