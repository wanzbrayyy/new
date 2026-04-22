import axios from 'axios';
import { load } from 'cheerio';
import { parseDoujinInfo } from '../../Parser';
export class List {
    constructor(title, id, cover, url) {
        this.title = title;
        this.id = id;
        this.cover = cover;
        this.url = url;
    }
    /**
     * Gets the contents of a doujin
     * @returns The contents of the doujin
     */
    async getContents() {
        return await axios
            .get(this.url)
            .then(({ data }) => parseDoujinInfo(load(data), this.url.split('nhentai.')[1].split('/')[0]))
            .catch((err) => {
            throw new Error(err.message);
        });
    }
}
