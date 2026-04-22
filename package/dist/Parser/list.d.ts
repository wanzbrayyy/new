import { CheerioAPI } from 'cheerio';
import { baseURLS } from '../lib';
import { IList } from '../Types';
export declare const parseDoujinList: ($: CheerioAPI, site: keyof typeof baseURLS) => IList;
