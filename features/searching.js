const { getBuffer } = require('../lib/function')
const { cekKey, limitAdd, isLimit } = require('../database/db');
const ch = require('../lib/scraper')
const { searchSpotifyTracks } = require('../lib/spotify')

const fs = require('fs')
const os = require('os')
const path = require('path')
const axios = require('axios')
const cheerio = require('cheerio')
const scraper = require('@bochilteam/scraper')

__path = process.cwd()
const TMP_DIR = path.join(os.tmpdir(), 'ww')

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
}

function isEmptyResult(result) {
    if (result == null) return true
    if (Array.isArray(result)) return result.length === 0
    if (typeof result === 'object') {
        if (Array.isArray(result.result)) return result.result.length === 0
        if (Array.isArray(result.articles)) return result.articles.length === 0
        if (Array.isArray(result.data)) return result.data.length === 0
        return Object.keys(result).length === 0
    }
    return false
}

function ensureResult(result, message = 'No results found') {
    if (isEmptyResult(result)) {
        const err = new Error(message)
        err.status = 404
        throw err
    }
    return result
}

function sendSearchError(res, err) {
    const status = err.status || err.response?.status || 500
    const message = err.message || 'An internal error occurred while fetching search data'
    console.log(err)
    return res.status(status).send({ status, message, result: 'error' })
}

function decodeBingUrl(url) {
    try {
        const parsed = new URL(url)
        if (!parsed.hostname.includes('bing.com')) return url
        const encoded = parsed.searchParams.get('u')
        if (!encoded || encoded.length < 3) return url
        if (!encoded.startsWith('a1')) return url
        return Buffer.from(encoded.slice(2), 'base64').toString('utf8')
    } catch {
        return url
    }
}

async function pinterestSearch(query) {
    try {
        const encodedQuery = encodeURIComponent(query)
        const targetUrl = `https://r.jina.ai/http://www.pinterest.com/search/pins/?q=${encodedQuery}`
        const { data } = await axios.get(targetUrl, {
            timeout: 35000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        const matches = [...String(data).matchAll(/https:\/\/i\.pinimg\.com\/[^\s)]+/g)]
            .map(match => match[0].replace(/\/\d+x\//, '/736x/'))
        if (matches.length) return [...new Set(matches)].slice(0, 50)
    } catch (err) {
        console.log('Pinterest primary source failed:', err.message)
    }
    return googleImageSearch(`${query} pinterest`)
}

async function pixivSearch(query) {
    const encodedQuery = encodeURIComponent(query)
    const pixivResponse = await axios.get(`https://www.pixiv.net/ajax/search/artworks/${encodedQuery}`, {
        timeout: 20000,
        params: {
            word: query,
            p: 1,
            order: 'date_d',
            mode: 'all',
            s_mode: 's_tag_full',
            type: 'all',
            lang: 'en'
        },
        headers: {
            'User-Agent': 'Mozilla/5.0',
            Referer: 'https://www.pixiv.net/'
        },
        validateStatus: () => true
    })
    if (pixivResponse.status === 200 && pixivResponse.data && pixivResponse.data.error === false) {
        const items = pixivResponse.data?.body?.illustManga?.data || []
        if (items.length) {
            return items.map(item => ({
                id: item.id,
                title: item.title,
                url: item.url,
                tags: item.tags,
                userId: item.userId,
                userName: item.userName,
                pageCount: item.pageCount,
                width: item.width,
                height: item.height,
                createDate: item.createDate
            }))
        }
    }
    const { data } = await axios.get('https://api.lolicon.app/setu/v2', {
        timeout: 20000,
        params: {
            size: 'regular',
            num: 20,
            keyword: query
        },
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    return data?.data || []
}

async function happymodSearch(query) {
    const { data } = await axios.get(`https://happymod.cloud/search.html?q=${encodeURIComponent(query)}`, {
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const $ = cheerio.load(data)
    const results = []
    $('a[href^="/"]').each((_, el) => {
        const href = $(el).attr('href')
        const text = $(el).text().replace(/\s+/g, ' ').trim()
        if (!href || !text || href.includes('.html') || href === '/') return
        if (!/mod|apk|unlimited|remove ads|free purchase|vip|clash|minecraft|coc/i.test(text)) return
        if (results.some(item => item.link === `https://happymod.cloud${href}`)) return
        const parts = text.split(/\s{2,}|\n/).map(v => v.trim()).filter(Boolean)
        results.push({
            title: parts[0] || text,
            icon: null,
            link: `https://happymod.cloud${href}`,
            rating: parts.slice(1).join(' | ') || null
        })
    })
    return results
}

async function sfileSearch(query, page = 1) {
    const targetUrl = `https://sfile.mobi/search.php?q=${encodeURIComponent(query)}&page=${page}`
    const { data } = await axios.get(`https://r.jina.ai/http://${targetUrl}`, {
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const matches = [...String(data).matchAll(/\[([^\]]+)\]\((https:\/\/sfile\.co\/[^)]+)\)\s+([\d.]+\s(?:KB|MB|GB))\s+•\s+([^\n]+)/g)]
    return matches.map(match => ({
        title: match[1].trim(),
        size: match[3].trim(),
        link: match[2].trim(),
        uploaded: match[4].trim()
    }))
}

async function alphacodersSearch(query) {
    const { data } = await axios.get(`https://wall.alphacoders.com/search.php?search=${encodeURIComponent(query)}`, {
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const $ = cheerio.load(data)
    const results = []
    $('img.thumb').each((_, el) => {
        const src = $(el).attr('src')
        if (!src) return
        results.push(src.replace(/thumb-\d+-/i, ''))
    })
    return [...new Set(results)]
}

async function domainSearch(query) {
    const tlds = ['.com', '.net', '.org', '.id', '.co.id']
    const results = []
    for (const tld of tlds) {
        const domain = `${String(query).toLowerCase()}${tld}`
        try {
            const response = await axios.get(`https://rdap.org/domain/${domain}`, {
                timeout: 15000,
                headers: { 'User-Agent': 'Mozilla/5.0' },
                validateStatus: () => true
            })
            results.push({
                domain,
                price: response.status === 404 ? 'possibly available' : 'registered'
            })
        } catch {
            results.push({
                domain,
                price: 'unknown'
            })
        }
    }
    return results
}

async function whoisLookup(domain) {
    const response = await axios.get(`https://rdap.org/domain/${domain}`, {
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
        validateStatus: () => true
    })
    if (response.status === 404) {
        const err = new Error('Domain not found in RDAP registry')
        err.status = 404
        throw err
    }
    const data = response.data || {}
    return {
        result: {
            domain: data.ldhName || domain,
            status: data.status || [],
            registrar: data.entities?.find(entity => entity.roles?.includes('registrar'))?.vcardArray?.[1]?.find(item => item[0] === 'fn')?.[3] || null,
            nameservers: data.nameservers?.map(item => item.ldhName) || [],
            raw: data
        }
    }
}

async function googleImageSearch(query) {
    const { data } = await axios.get(`https://www.bing.com/images/search?q=${encodeURIComponent(query)}`, {
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const $ = cheerio.load(data)
    const results = []
    $('a.iusc').each((_, el) => {
        const metadata = $(el).attr('m')
        if (!metadata) return
        try {
            const parsed = JSON.parse(metadata)
            if (parsed.murl) results.push(parsed.murl)
        } catch {
        }
    })
    return [...new Set(results)]
}

async function googleSearch(query) {
    const { data } = await axios.get(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, {
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const $ = cheerio.load(data)
    const results = []
    $('li.b_algo').each((_, el) => {
        const title = $(el).find('h2').text().trim()
        const url = decodeBingUrl($(el).find('h2 a').attr('href'))
        const description = $(el).find('.b_caption p').text().trim()
        if (title && url) results.push({ title, url, description })
    })
    return results
}

async function wikipediaSearch(query) {
    const { data } = await axios.get('https://id.wikipedia.org/w/api.php', {
        timeout: 20000,
        params: {
            action: 'query',
            list: 'search',
            srsearch: query,
            format: 'json',
            utf8: 1
        },
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const first = data?.query?.search?.[0]
    if (!first) return null
    return {
        title: first.title,
        snippet: String(first.snippet || '').replace(/<[^>]+>/g, ''),
        pageid: first.pageid,
        url: `https://id.wikipedia.org/?curid=${first.pageid}`
    }
}

async function spotifySearch(query) {
    return searchSpotifyTracks(query, 8)
}

     async function pinterest(req, res) {
         try {
            let query = req.query.query
            let apikey = req.query.apikey
            if (!query) return res.status(400).send({ status: 400, message: 'query parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = ensureResult(await pinterestSearch(query), 'Pinterest result not found')
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              return sendSearchError(res, err)
         }
     }
     
     async function sticker(req, res) {
         try {
            let query = req.query.query
            let apikey = req.query.apikey
            if (!query) return res.status(400).send({ status: 400, message: 'query parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = ensureResult(await ch.stickerSearch(query), 'Sticker pack not found')
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              return sendSearchError(res, err)
         }
     }
     
     async function pixivsearch(req, res) {
         try {
            let query = req.query.query
            let apikey = req.query.apikey
            if (!query) return res.status(400).send({ status: 400, message: 'query parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = ensureResult(await pixivSearch(query), 'Pixiv result not found')
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              return sendSearchError(res, err)
         }
     }
     
     async function happymod(req, res) {
         try {
            let query = req.query.query
            let apikey = req.query.apikey
            if (!query) return res.status(400).send({ status: 400, message: 'query parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = ensureResult(await happymodSearch(query), 'HappyMod result not found')
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              return sendSearchError(res, err)
         }
     }
     
     async function sfilesearch(req, res) {
         try {
            let query = req.query.query
            let apikey = req.query.apikey
            let page = req.query.page
            if (!query) return res.status(400).send({ status: 400, message: 'query parameter cannot be empty', result: 'error' })
            if (!page) return res.status(400).send({ status: 400, message: 'page parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = ensureResult(await sfileSearch(query, page), 'Sfile result not found')
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              return sendSearchError(res, err)
         }
     }
     
     async function konachan(req, res) {
         try {
            let query = req.query.query
            let apikey = req.query.apikey
            if (!query) return res.status(400).send({ status: 400, message: 'query parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let img = ensureResult(await ch.konachan(query), 'Konachan image not found')
              let result = img[Math.floor(Math.random() * (img.length))]
              let data = await getBuffer(result)
              ensureDir(TMP_DIR)
              await fs.writeFileSync(path.join(TMP_DIR, 'konachan.png'), data)
              await res.sendFile(path.join(TMP_DIR, 'konachan.png'))
         } catch(err) {
              return sendSearchError(res, err)
         }
     }
     
     async function alphacoders(req, res) {
         try {
            let query = req.query.query
            let apikey = req.query.apikey
            if (!query) return res.status(400).send({ status: 400, message: 'query parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let img = ensureResult(await alphacodersSearch(query), 'Alphacoders image not found')
              let result = img[Math.floor(Math.random() * (img.length))]
              let data = await getBuffer(result)
              ensureDir(TMP_DIR)
              await fs.writeFileSync(path.join(TMP_DIR, 'image.png'), data)
              await res.sendFile(path.join(TMP_DIR, 'image.png'))
         } catch(err) {
              return sendSearchError(res, err)
         }
     }
     
     async function wallpapercave(req, res) {
         try {
            let query = req.query.query
            let apikey = req.query.apikey
            if (!query) return res.status(400).send({ status: 400, message: 'query parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let img = ensureResult(await ch.wallpapercave(query), 'Wallpapercave image not found')
              let result = img[Math.floor(Math.random() * (img.length))]
              let data = await getBuffer(result)
              ensureDir(TMP_DIR)
              await fs.writeFileSync(path.join(TMP_DIR, 'image.png'), data)
              await res.sendFile(path.join(TMP_DIR, 'image.png'))
         } catch(err) {
              return sendSearchError(res, err)
         }
     }
     
     async function domainsearch(req, res) {
         try {
            let query = req.query.query
            let apikey = req.query.apikey
            if (!query) return res.status(400).send({ status: 400, message: 'query parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = ensureResult(await domainSearch(query), 'Domain suggestion not found')
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              return sendSearchError(res, err)
         }
     }
     
     async function cekdomain(req, res) {
         try {
            let domain = req.query.domain
            let apikey = req.query.apikey
            if (!domain) return res.status(400).send({ status: 400, message: 'domain parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await whoisLookup(domain)
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              return sendSearchError(res, err)
         }
     }
     
     async function steleSearch(req, res) {
         try {
            let query = req.query.query
            let apikey = req.query.apikey
            if (!query) return res.status(400).send({ status: 400, message: 'query parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = ensureResult(await ch.stickerSearch(query), 'Telegram sticker result not found')
              res.status(200).json(result)
         } catch(err) {
              return sendSearchError(res, err)
         }
     }
     
     async function stickerline(req, res) {
         try {
            let query = req.query.query
            let apikey = req.query.apikey
            if (!query) return res.status(400).send({ status: 400, message: 'query parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = ensureResult(await scraper.stickerLine(query), 'Line sticker result not found')
              res.status(200).json(result)
         } catch(err) {
              return sendSearchError(res, err)
         }
     }
     
     async function gimage(req, res) {
         try {
            let query = req.query.query
            let apikey = req.query.apikey
            if (!query) return res.status(400).send({ status: 400, message: 'query parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = ensureResult(await googleImageSearch(query), 'Google image result not found')
              res.status(200).json(result)
         } catch(err) {
              return sendSearchError(res, err)
         }
     }
     
     async function ytsearch(req, res) {
         try {
            let query = req.query.query
            let apikey = req.query.apikey
            if (!query) return res.status(400).send({ status: 400, message: 'query parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = ensureResult(await scraper.youtubeSearch(query), 'Youtube result not found')
              res.status(200).json(result)
         } catch(err) {
              return sendSearchError(res, err)
         }
     }
     
     async function google(req, res) {
         try {
            let query = req.query.query
            let apikey = req.query.apikey
            if (!query) return res.status(400).send({ status: 400, message: 'query parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = ensureResult(await googleSearch(query), 'Google result not found')
              res.status(200).json(result)
         } catch(err) {
              return sendSearchError(res, err)
         }
     }
     
     async function wiki(req, res) {
         try {
            let query = req.query.query
            let apikey = req.query.apikey
            if (!query) return res.status(400).send({ status: 400, message: 'query parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = ensureResult(await wikipediaSearch(query), 'Wikipedia result not found')
              res.status(200).json(result)
         } catch(err) {
              return sendSearchError(res, err)
         }
     }

     async function spotifysearch(req, res) {
         try {
            let query = req.query.query
            let apikey = req.query.apikey
            if (!query) return res.status(400).send({ status: 400, message: 'query parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = ensureResult(await spotifySearch(query), 'Spotify track result not found')
              res.status(200).json({ status: 200, result })
         } catch(err) {
              return sendSearchError(res, err)
         }
     }

module.exports = { 
   pinterest, 
   sticker,
   pixivsearch, 
   happymod, 
   sfilesearch, 
   konachan, 
   alphacoders,
   wallpapercave,
   domainsearch,
   cekdomain,
   steleSearch,
   stickerline,
   gimage,
   ytsearch,
   google,
   wiki,
   spotifysearch
}
