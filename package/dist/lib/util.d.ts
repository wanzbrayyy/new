import { AxiosInstance } from 'axios';
export declare const clean: (x: string[]) => string[];
export declare const getExtension: (type: string) => 'jpg' | 'png' | 'gif';
export declare const getAPIGalleryPages: (axios: AxiosInstance, data: string) => Promise<{
    t: string;
}[]>;
export declare const getPageStatus: (url: string) => Promise<number>;
