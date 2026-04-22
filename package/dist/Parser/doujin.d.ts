import { CheerioAPI } from 'cheerio';
import { baseURLS } from '../lib';
import { IDoujinInfo } from '../Types';
export declare const parseDoujinInfo: ($: CheerioAPI, site: keyof typeof baseURLS, api_pages?: {
    t: string;
}[]) => Promise<IDoujinInfo>;
