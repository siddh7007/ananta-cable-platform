/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Project = {
    id: string;
    name: string;
    status: Project.status;
    createdAt?: string;
    updatedAt?: string;
};
export namespace Project {
    export enum status {
        DRAFT = 'draft',
        ACTIVE = 'active',
        ARCHIVED = 'archived',
    }
}

