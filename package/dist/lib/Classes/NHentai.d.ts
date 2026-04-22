import { IDoujinInfo, TSite, IList } from '../../Types';
export declare class NHentai {
    #private;
    private readonly _options;
    /**
     * Constructs an instance of the NHentai class
     * @param _options Options of the NHentai class
     */
    constructor(_options?: {
        site: TSite | `https://${TSite}`;
        user_agent?: string;
        cookie_value?: string;
    });
    /**
     * Ganti cookie secara dinamis saat runtime
     */
    setCookie(cookie: string): void;
    /**
     * Ganti user-agent secara dinamis
     */
    setUserAgent(ua: string): void;
    /**
     * Gets a random doujin
     * @returns Info of the random doujin
     */
    getRandom: () => Promise<IDoujinInfo>;
    /**
     * Explores the list of doujin
     * @param page Page number of the list
     * @returns The doujin list
     */
    explore: (page?: number) => Promise<IList>;
    /**
     * Searches for a doujin by a query
     * @param query Query of the doujin to search
     * @param options Options for searching
     * @returns The result of the search
     */
    search: (query: string, options?: {
        page?: number;
    }) => Promise<IList>;
    /**
     * Gets the info of a doujin by its ID
     * @param id ID of the doujin
     * @returns Info of the doujin
     */
    getDoujin: (id: string | number) => Promise<IDoujinInfo>;
    /**
     * Validates the ID of a doujin
     * @param id ID of the doujin to check
     */
    validate: (id: string | number) => Promise<boolean>;
}
