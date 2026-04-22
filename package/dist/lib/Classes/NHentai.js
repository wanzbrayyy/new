var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _NHentai_axios;
import axios from 'axios';
import { load } from 'cheerio';
import { CookieJar } from 'tough-cookie';
import { HttpsCookieAgent } from 'http-cookie-agent/http';
import { parseDoujinList, parseDoujinInfo } from '../../Parser';
import { sites } from '../constants';
import { getAPIGalleryPages } from '../util';
import fs from 'fs';
import path from 'path';
export class NHentai {
    /**
     * Constructs an instance of the NHentai class
     * @param _options Options of the NHentai class
     */
    constructor(_options = {
        site: 'https://nhentai.to'
    }) {
        this._options = _options;
        _NHentai_axios.set(this, void 0);
        /**
         * Gets a random doujin
         * @returns Info of the random doujin
         */
        this.getRandom = async () => await __classPrivateFieldGet(this, _NHentai_axios, "f")
            .get(`${this._options.site}/random`)
            .then(async ({ data }) => parseDoujinInfo(load(data), this._options.site.split('nhentai.')[1], this._options.site.includes('net')
            ? await getAPIGalleryPages(__classPrivateFieldGet(this, _NHentai_axios, "f"), data)
            : undefined))
            .catch((err) => {
            throw new Error(err.message);
        });
        /**
         * Explores the list of doujin
         * @param page Page number of the list
         * @returns The doujin list
         */
        this.explore = async (page = 1) => {
            if (isNaN(page) || page < 1)
                page = 1;
            return await __classPrivateFieldGet(this, _NHentai_axios, "f")
                .get(`${this._options.site}?page=${page}`)
                .then(({ data }) => parseDoujinList(load(data), this._options.site.split('nhentai.')[1]))
                .catch((err) => {
                throw new Error(err.message);
            });
        };
        /**
         * Searches for a doujin by a query
         * @param query Query of the doujin to search
         * @param options Options for searching
         * @returns The result of the search
         */
        this.search = async (query, options) => {
            if (!query)
                throw new Error("The 'query' parameter shouldn't be undefined");
            let page = 1;
            if (options?.page && options.page > 0)
                page = options.page;
            return await __classPrivateFieldGet(this, _NHentai_axios, "f")
                .get(`${this._options.site}/search?q=${query}&page=${page}`)
                .then((res) => {
                const results = parseDoujinList(load(res.data), this._options.site.split('nhentai.')[1]);
                if (!results.data.length)
                    throw new Error('No doujin results found');
                return results;
            });
        };
        /**
         * Gets the info of a doujin by its ID
         * @param id ID of the doujin
         * @returns Info of the doujin
         */
        this.getDoujin = async (id) => {
            if (!id)
                throw new Error("The 'id' parameter shouldn't be undefined");
            const valid = await this.validate(id);
            if (!valid)
                throw new Error('Invalid doujin ID');
            return await __classPrivateFieldGet(this, _NHentai_axios, "f")
                .get(`${this._options.site}/g/${id}`)
                .then(async (res) => parseDoujinInfo(load(res.data), this._options.site.split('nhentai.')[1], this._options.site.includes('net')
                ? await getAPIGalleryPages(__classPrivateFieldGet(this, _NHentai_axios, "f"), res.data)
                : undefined))
                .catch((err) => {
                throw new Error(err.message);
            });
        };
        /**
         * Validates the ID of a doujin
         * @param id ID of the doujin to check
         */
        this.validate = (id) => __classPrivateFieldGet(this, _NHentai_axios, "f")
            .get(`${this._options.site}/g/${id}`)
            .then(() => true)
            .catch(() => false);
        __classPrivateFieldSet(this, _NHentai_axios, axios, "f");
        // Validasi domain
        if (!sites.includes(this._options.site
            .replace('https:', '')
            .replace(/\//g, '')))
            this._options.site = 'https://nhentai.to';
        if (!this._options.site.startsWith('https://'))
            this._options.site =
                `https://${this._options.site}`;
        // ✅ Ambil cookie default dari file jika tidak diberikan user
        let defaultCookie = '';
        const cookiePath = path.resolve(__dirname, '../lib/cookies.txt');
        if (fs.existsSync(cookiePath)) {
            defaultCookie = fs.readFileSync(cookiePath, 'utf8').trim();
        }
        // ✅ Gunakan defaultCookie kalau site nhentai.net tapi user tidak kasih cookie
        if (this._options.site.includes('nhentai.net') &&
            (!this._options.cookie_value || !this._options.user_agent)) {
            if (!this._options.cookie_value && defaultCookie) {
                this._options.cookie_value = defaultCookie;
            }
            else {
                throw new Error(`Assign the 'user_agent' in the instance of the class to use this site.`);
            }
        }
        // Set cookie dan agent
        if (this._options.cookie_value) {
            const jar = new CookieJar();
            jar.setCookie(this._options.cookie_value, this._options.site);
            const httpsAgent = new HttpsCookieAgent({ cookies: { jar } });
            __classPrivateFieldSet(this, _NHentai_axios, axios.create({ httpsAgent }), "f");
        }
        if (this._options.user_agent)
            __classPrivateFieldGet(this, _NHentai_axios, "f").defaults.headers.common['User-Agent'] =
                this._options.user_agent;
    }
    /**
     * Ganti cookie secara dinamis saat runtime
     */
    setCookie(cookie) {
        const jar = new CookieJar();
        jar.setCookieSync(cookie, this._options.site);
        const httpsAgent = new HttpsCookieAgent({ cookies: { jar } });
        __classPrivateFieldSet(this, _NHentai_axios, axios.create({ httpsAgent }), "f");
        if (this._options.user_agent)
            __classPrivateFieldGet(this, _NHentai_axios, "f").defaults.headers.common['User-Agent'] =
                this._options.user_agent;
        this._options.cookie_value = cookie;
    }
    /**
     * Ganti user-agent secara dinamis
     */
    setUserAgent(ua) {
        __classPrivateFieldGet(this, _NHentai_axios, "f").defaults.headers.common['User-Agent'] = ua;
        this._options.user_agent = ua;
    }
}
_NHentai_axios = new WeakMap();
