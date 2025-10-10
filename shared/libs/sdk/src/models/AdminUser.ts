/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AdminUser = {
    id: string;
    name: string;
    email: string;
    roles: Array<string>;
    status: AdminUser.status;
    createdAt?: string;
    updatedAt?: string;
    lastLoginAt?: string;
};
export namespace AdminUser {
    export enum status {
        ACTIVE = 'active',
        DEACTIVATED = 'deactivated',
    }
}

