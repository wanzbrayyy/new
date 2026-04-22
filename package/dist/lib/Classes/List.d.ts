import { IListData, IDoujinInfo } from '../../Types';
export declare class List implements IListData {
    title: string;
    id: string;
    cover: string | null;
    url: IListData['url'];
    constructor(title: string, id: string, cover: string | null, url: IListData['url']);
    /**
     * Gets the contents of a doujin
     * @returns The contents of the doujin
     */
    getContents(): Promise<IDoujinInfo>;
}
