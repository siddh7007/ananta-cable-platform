/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AdminDbStats = {
    supabase: {
        status: AdminDbStats.status;
        latencyMs?: number;
        note?: string;
    };
    pgExtra?: {
        status: AdminDbStats.status;
        latencyMs?: number;
        note?: string;
    };
    oracle?: {
        status: AdminDbStats.status;
        latencyMs?: number;
        note?: string;
    };
    counts: {
        workspaces: number;
        projects: number;
        boms: number;
        orders: number;
        users: number;
    };
    ts: string;
};
export namespace AdminDbStats {
    export enum status {
        OK = 'ok',
        FAIL = 'fail',
        UNKNOWN = 'unknown',
    }
}

