/// <reference types="node" />
export declare class Pages {
    #private;
    pages: string[];
    /**
     *
     * @param pages An array of URLS of the doujin pages
     */
    constructor(pages: string[], __title: string);
    /**
     * Getter for the number of pages.
     */
    get length(): number;
    /**
     * Builds a PDF from the doujin pages
     * @returns Buffer of the PDF
     */
    PDF(): Promise<Buffer>;
    /**
     * Builds a PDF from the doujin pages
     * @param filename Filename of the PDF
     * @returns The filename where the PDF is saved
     */
    PDF(filename: string): Promise<string>;
    /**
     * Builds a zip of doujin pages
     * @returns Buffer of the result zip
     */
    zip(): Promise<Buffer>;
    /**
     * Builds a zip of doujin pages and saves it locally
     * @param filename Filename of the zip where it should be saved
     * @returns The filename of the saved zip
     */
    zip(filename: string): Promise<string>;
    /**
     * Downloads the pages of a doujin and saves all of it in a folder
     * @param folderName The name of the folder in which all of the pages should be saved
     */
    download(folderName: string): Promise<void>;
}
