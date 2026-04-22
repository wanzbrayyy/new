import axios from 'axios';
import { load } from 'cheerio';
export const clean = (x) => {
    const result = [];
    x.forEach((a) => {
        const text = a.split(/\d/g)[0].trim();
        if (text !== '')
            result.push(text);
    });
    return result;
};
export const getExtension = (type) => {
    switch (type) {
        case 'g':
            return 'gif';
        case 'j':
            return 'jpg';
        default:
            return 'png';
    }
};
export const getAPIGalleryPages = async (axios, data) => {
    const $ = load(data);
    const id = ($('#cover').find('a').attr('href') || 'g/')
        .split('g/')[1]
        .split('/')[0];
    return (await axios.get(`https://nhentai.net/api/gallery/${id}`)).data.images.pages;
};
export const getPageStatus = (url) => axios.head(url)
    .then((res) => res.status)
    .catch((err) => (err.response?.status || 500));
