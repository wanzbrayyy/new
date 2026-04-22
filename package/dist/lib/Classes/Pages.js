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
var _Pages_title;
import PDFDocument from 'pdfkit';
import { tmpdir } from 'os';
import { writeFile, unlink, readFile, mkdir, stat } from 'fs/promises';
import { createWriteStream, existsSync } from 'fs';
import axios from 'axios';
import JSZip from 'jszip';
import { join } from 'path';
export class Pages {
    /**
     *
     * @param pages An array of URLS of the doujin pages
     */
    constructor(pages, __title) {
        this.pages = pages;
        _Pages_title.set(this, void 0);
        __classPrivateFieldSet(this, _Pages_title, __title, "f");
    }
    /**
     * Getter for the number of pages.
     */
    get length() {
        return this.pages.length;
    }
    async PDF(filename) {
        const pdf = new PDFDocument({ autoFirstPage: false });
        const file = filename
            ? `${filename}${filename.endsWith('.pdf') ? '' : '.pdf'}`
            : `${tmpdir()}/${Math.random().toString(36)}.pdf`;
        const stream = createWriteStream(file);
        pdf.pipe(stream);
        for (const url of this.pages) {
            const { data } = await axios.get(url, {
                headers: url.includes('cdn.dogehls.xyz') ? { 'Referer': 'https://nhentai.to' } : {},
                responseType: 'arraybuffer'
            });
            const img = pdf.openImage(data);
            pdf.addPage({ size: [img.width, img.height] });
            pdf.image(img, 0, 0);
            const index = this.pages.indexOf(url);
            if (index === this.pages.length - 1)
                pdf.end();
        }
        await new Promise((resolve, reject) => {
            stream.on('finish', () => resolve(file));
            stream.on('error', reject);
        });
        if (filename)
            return file;
        const buffer = await readFile(file);
        await unlink(file);
        return buffer;
    }
    async zip(filename) {
        const zip = new JSZip();
        const folder = zip.folder(__classPrivateFieldGet(this, _Pages_title, "f"));
        if (!folder)
            throw new Error("Failed to create zip folder in JSZip.");
        for (const url of this.pages)
            folder.file(`${this.pages.indexOf(url) + 1}.${url.split('.')[url.split('.').length - 1]}`, (await axios.get(url, {
                headers: url.includes('cdn.dogehls.xyz') ? { 'Referer': 'https://nhentai.to' } : {},
                responseType: 'arraybuffer'
            })).data, { binary: true });
        const buffer = await zip.generateAsync({ type: 'nodebuffer' });
        if (filename) {
            await writeFile(`${filename}${filename.endsWith('.zip') ? '' : '.zip'}`, buffer);
            return `${filename}${filename.endsWith('.zip') ? '' : '.zip'}`;
        }
        return buffer;
    }
    /**
     * Downloads the pages of a doujin and saves all of it in a folder
     * @param folderName The name of the folder in which all of the pages should be saved
     */
    async download(folderName) {
        if (!folderName)
            throw new Error('No folder name provided to save the downloaded doujin pages');
        if (!existsSync(folderName))
            await mkdir(folderName, { recursive: true });
        const isDirectory = (await stat(folderName)).isDirectory();
        if (!isDirectory)
            throw new Error('Expected a directory for saving the downloads, but recieved a file.');
        for (const url of this.pages)
            await writeFile(join(folderName, `${this.pages.indexOf(url) + 1}.${url.split('.')[url.split('.').length - 1]}`), (await axios.get(url, {
                responseType: 'arraybuffer'
            })).data);
    }
}
_Pages_title = new WeakMap();
