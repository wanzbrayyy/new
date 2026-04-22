import { sites } from '../lib';
export * from './list';
export * from './doujin';
export interface IPagination {
    /** Current page of the list */
    currentPage: number;
    /** Will be true if there is a next page of the list */
    hasNextPage: boolean;
    /** Totoal pages of the list */
    totalPages: number;
}
export declare type TSite = typeof sites[number];
export declare type TURL = `https://${TSite}/${string}`;
