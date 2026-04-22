const { cekKey, limitAdd, isLimit } = require('../database/db');
const { getBuffer } = require('../lib/function')
const { dl } = require('../lib/aiovideodl')
const ch = require('../lib/scraper')

const fs = require('fs')
const path = require('path')
const topdf = require('image-to-pdf')
const request = require('request')
const fetch = require('node-fetch')
const axios = require('axios')
const cheerio = require('cheerio')
const { doujinScraper, previewScraper } = require('nhentai-node-api/lib/api/scraper')

__path = process.cwd()

const NHENTAI_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/json,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://nhentai.net/'
}

const NHENTAI_BASE = 'https://nhentai.net'
const IMAGE_BASE = 'https://i.nhentai.net/galleries'
const THUMB_BASE = 'https://t.nhentai.net/galleries'
const JINA_BASE = 'https://r.jina.ai/http://'
const imageToPdf = topdf.convert || topdf.default || topdf
const TMP_DIR = path.join(__path, 'tmp')
const PUBLIC_TMP_DIR = path.join(__path, 'public', 'tmp')
const MELOLO_BASE = 'https://melolo.com'

function cleanText(value = '') {
    return String(value).replace(/\s+/g, ' ').trim()
}

function toAbsoluteUrl(url) {
    if (!url) return null
    try {
        return new URL(url, MELOLO_BASE).toString()
    } catch {
        return url
    }
}

function parseMeloloFeaturedSection($, section) {
    return section.find('div.min-w-82.self-stretch').map((_, el) => {
        const card = $(el)
        const titleAnchor = card.find('a[href*="/dramas/"]').filter((__, anchor) => !/\/ep\d+$/i.test($(anchor).attr('href') || '')).first()
        const watchAnchor = card.find('a[href*="/dramas/"]').filter((__, anchor) => /\/ep\d+$/i.test($(anchor).attr('href') || '')).first()

        return {
            title: cleanText(titleAnchor.text()) || null,
            category: cleanText(card.find('a[href*="/category/"]').first().text()) || null,
            description: cleanText(card.find('div.opacity-90').first().text()) || null,
            detail_url: toAbsoluteUrl(titleAnchor.attr('href')),
            watch_url: toAbsoluteUrl(watchAnchor.attr('href')),
            image: toAbsoluteUrl(card.find('img').last().attr('src'))
        }
    }).get().filter(item => item.title && item.detail_url)
}

function parseMeloloGridSection($, section, cardSelector) {
    return section.find(cardSelector).map((_, el) => {
        const card = $(el)
        const titleAnchor = card.find('a[href*="/dramas/"]').filter((__, anchor) => !/\/ep\d+$/i.test($(anchor).attr('href') || '')).last()
        const watchAnchor = card.find('a[href*="/dramas/"]').filter((__, anchor) => /\/ep\d+$/i.test($(anchor).attr('href') || '')).first()
        const rating = cleanText(card.find('div.text-order-blue.text-xs, div.text-orange-500.font-bold').first().text()) || null
        const episodeText = cleanText(card.find('div').filter((__, div) => /Eps/i.test($(div).text())).first().text()) || null
        const description = cleanText(card.find('div.text-slate-500.text-sm, div.opacity-90.text-sm').last().text()) || null

        return {
            title: cleanText(titleAnchor.text()) || null,
            category: cleanText(card.find('a[href*="/category/"]').first().text()) || null,
            rating,
            episodes: episodeText || null,
            description,
            detail_url: toAbsoluteUrl(titleAnchor.attr('href')),
            watch_url: toAbsoluteUrl(watchAnchor.attr('href')),
            image: toAbsoluteUrl(card.find('img').first().attr('src'))
        }
    }).get().filter(item => item.title && item.detail_url)
}

async function getMeloloHome() {
    const response = await axios.get(`${MELOLO_BASE}/`, {
        timeout: 20000,
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept-Language': 'en-US,en;q=0.9'
        }
    })
    const $ = cheerio.load(String(response.data))
    const sections = $('main > div')
    const heroSection = sections.eq(0)
    const latestSection = sections.eq(1)
    const romanceSection = sections.eq(2)
    const revengeSection = sections.eq(3)

    return {
        source: MELOLO_BASE,
        title: cleanText($('title').first().text()) || null,
        description: cleanText($('meta[name="description"]').attr('content')) || null,
        hero: {
            title: cleanText(heroSection.find('h1').first().text()) || null,
            description: cleanText(heroSection.find('h1').first().parent().find('div').last().text()) || null
        },
        featured: parseMeloloFeaturedSection($, heroSection),
        latest_releases: parseMeloloGridSection($, latestSection, 'div.self-stretch.bg-white.rounded-xl'),
        popular_romance: parseMeloloGridSection($, romanceSection, 'div.min-w-45.bg-white.rounded-lg'),
        popular_revenge: parseMeloloGridSection($, revengeSection, 'div.w-full.relative.p-4.bg-white.rounded-xl')
    }
}

function detectLanguage(title = '', tags = []) {
    const titleLower = title.toLowerCase()
    if (titleLower.includes('[english]')) return 'english'
    if (titleLower.includes('[chinese]')) return 'chinese'
    if (titleLower.includes('[japanese]')) return 'japanese'

    const languageTag = tags.find(tag => tag.type === 'language')
    if (!languageTag) return 'japanese'

    const languageName = String(languageTag.name || '').toLowerCase()
    if (languageName.includes('english')) return 'english'
    if (languageName.includes('chinese')) return 'chinese'
    if (languageName.includes('japanese')) return 'japanese'
    return 'japanese'
}

function normalizePageExtension(type) {
    if (type === 'p') return 'png'
    if (type === 'g') return 'gif'
    if (type === 'w') return 'webp'
    return 'jpg'
}

function buildGalleryImage(mediaId, page, index, thumbnail = false) {
    const ext = normalizePageExtension(page.t)
    const domain = thumbnail ? THUMB_BASE : IMAGE_BASE
    return `${domain}/${mediaId}/${index}.${ext}`
}

function normalizeNhentaiGallery(data) {
    const title = {
        default: data.title?.english || data.title?.pretty || data.title?.japanese || '',
        pretty: data.title?.pretty || data.title?.english || '',
        native: data.title?.japanese || ''
    }

    const details = {}
    for (const tag of data.tags || []) {
        if (!tag.type) continue
        if (!details[tag.type]) details[tag.type] = []
        details[tag.type].push({
            name: tag.name,
            count: tag.count || null,
            link: `${NHENTAI_BASE}/tag/${tag.url || tag.name}/`
        })
    }

    const pages = (data.images?.pages || []).map((page, index) => buildGalleryImage(data.media_id, page, index + 1))
    const thumbnails = (data.images?.pages || []).map((page, index) => buildGalleryImage(data.media_id, page, index + 1, true))
    const cover = data.images?.cover ? buildGalleryImage(data.media_id, data.images.cover, 1, true) : thumbnails[0] || null

    return {
        id: String(data.id),
        title,
        language: detectLanguage(title.default, data.tags || []),
        cover,
        details,
        pages,
        thumbnails,
        favorites: data.num_favorites || 0,
        uploadedAt: data.upload_date ? new Date(data.upload_date * 1000) : null,
        link: `${NHENTAI_BASE}/g/${data.id}/`
    }
}

function normalizeNhentaiPreview(item) {
    const title = item.title?.english || item.title?.pretty || item.title?.japanese || ''
    return {
        id: Number(item.id),
        title,
        language: detectLanguage(title, item.tags || []),
        thumbnail: item.images?.cover ? buildGalleryImage(item.media_id, item.images.cover, 1, true) : null
    }
}

function buildNhentaiUrl(path, params = {}) {
    const url = new URL(path, NHENTAI_BASE)
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
    })
    return url.toString()
}

function normalizePreviewTitle(title = '') {
    return title.replace(/\s+/g, ' ').trim()
}

function parseMarkdownLinkItems(text = '') {
    const matches = [...text.matchAll(/\[([^\]]+?)\]\((https?:\/\/[^)]+)\)/g)]
    return matches.map(match => {
        const raw = match[1].replace(/\s+/g, ' ').trim()
        const countMatch = raw.match(/^(.*)\s([\d,]+)$/)
        return {
            name: countMatch ? countMatch[1].trim() : raw,
            count: countMatch ? Number(countMatch[2].replace(/,/g, '')) : null,
            link: match[2]
        }
    })
}

function thumbnailToImage(url) {
    if (!url) return null
    return url
        .replace(/^https?:\/\/t\d+\.nhentai\.net\/galleries\//, `${IMAGE_BASE}/`)
        .replace(/^https?:\/\/t\.nhentai\.net\/galleries\//, `${IMAGE_BASE}/`)
        .replace(/\/(\d+)t\.(jpg|jpeg|png|gif|webp)$/i, '/$1.$2')
        .replace(/\/thumb(\.[a-z0-9.]+)$/i, '/cover$1')
}

function parsePreviewCardsFromMarkdown(markdown = '') {
    const cards = []
    const seen = new Set()
    const regex = /\[\!\[Image \d+:\s*([\s\S]*?)\]\((https?:\/\/[^)]+)\)\s*[\s\S]*?\]\((https?:\/\/(?:nhentai\.net|nhentai\.to)\/g\/(\d+)\/)\)/g
    let match
    while ((match = regex.exec(markdown)) !== null) {
        const id = Number(match[4])
        if (!id || seen.has(id)) continue
        seen.add(id)
        const title = normalizePreviewTitle(match[1])
        cards.push({
            id,
            title,
            language: detectLanguage(title),
            thumbnail: match[2]
        })
    }
    return cards
}

function extractMarkdownSection(markdown = '', heading) {
    const marker = `## ${heading}`
    const start = markdown.indexOf(marker)
    if (start === -1) return ''
    const rest = markdown.slice(start + marker.length)
    const nextSection = rest.search(/\n##\s+/)
    return nextSection === -1 ? rest : rest.slice(0, nextSection)
}

function parseGalleryFromMarkdown(markdown = '', fallbackCode = '') {
    const titleMatch = markdown.match(/\n#\s+(.+?)\s+» nhentai/)
    const nativeTitleMatch = markdown.match(/\n##\s+(.+)/)
    const idMatch = markdown.match(/\n###\s+#(\d+)/)
    const coverMatch = markdown.match(/\[!\[Image \d+:.*?\]\((https?:\/\/[^)]+\/cover\.[^)]+)\)\]\((https?:\/\/(?:nhentai\.net|nhentai\.to)\/g\/\d+\/1\/)\)/)
    const pageMatches = [...markdown.matchAll(/\[!\[Image \d+:\s*Page\s+\d+\]\((https?:\/\/[^)]+)\)\]\((https?:\/\/(?:nhentai\.net|nhentai\.to)\/g\/\d+\/\d+\/)\)/g)]

    const details = {}
    const detailLines = markdown.split('\n').map(line => line.trim()).filter(Boolean)
    for (const line of detailLines) {
        const detailMatch = line.match(/^(Parodies|Characters|Tags|Artists|Groups|Languages|Categories):\s*(.+)$/)
        if (!detailMatch) continue
        details[detailMatch[1].toLowerCase()] = parseMarkdownLinkItems(detailMatch[2])
    }

    const uploadedLine = detailLines.find(line => line.startsWith('Uploaded:'))
    const uploadedExactDate = uploadedLine?.match(/\((\d{1,2}\/\d{1,2}\/\d{4})\)/)?.[1]
    const favoriteLine = detailLines.find(line => line.startsWith('Favorite'))
    const favorites = favoriteLine?.match(/Favorite\s+\(([\d,]+)\)/)?.[1]

    const thumbnails = pageMatches.map(match => match[1])
    const pages = thumbnails.map(thumbnailToImage).filter(Boolean)
    const title = {
        default: titleMatch ? titleMatch[1].trim() : '',
        pretty: titleMatch ? titleMatch[1].trim() : '',
        native: nativeTitleMatch ? nativeTitleMatch[1].trim() : ''
    }

    return {
        id: idMatch ? idMatch[1] : String(fallbackCode || ''),
        title,
        language: detectLanguage(title.default, details.languages || []),
        cover: coverMatch ? thumbnailToImage(coverMatch[1]) || coverMatch[1] : thumbnails[0] || null,
        details,
        pages,
        thumbnails,
        favorites: favorites ? Number(favorites.replace(/,/g, '')) : 0,
        uploadedAt: uploadedExactDate ? new Date(uploadedExactDate) : null,
        link: `${NHENTAI_BASE}/g/${idMatch ? idMatch[1] : fallbackCode}/`
    }
}

function parseGalleryFromMarkdownSafe(markdown = '', fallbackCode = '') {
    const parsed = parseGalleryFromMarkdown(markdown, fallbackCode)
    if (parsed.title?.default) return parsed

    const titleMatch = markdown.match(/\n#\s+(.+?)\s+(?:»|Â»)?\s*nhentai/)
    if (!titleMatch) return parsed

    return {
        ...parsed,
        title: {
            default: titleMatch[1].trim(),
            pretty: titleMatch[1].trim(),
            native: parsed.title?.native || ''
        },
        language: detectLanguage(titleMatch[1], parsed.details?.languages || [])
    }
}

async function requestNhentai(url, config = {}) {
    try {
        return await axios.get(url, {
            timeout: 15000,
            headers: NHENTAI_HEADERS,
            validateStatus: () => true,
            ...config
        })
    } catch (err) {
        const error = new Error('Failed to reach nhentai source')
        error.status = 502
        error.cause = err
        throw error
    }
}

async function fetchNhentaiHtml(path, params = {}) {
    try {
        const response = await requestNhentai(`${NHENTAI_BASE}${path}`, { params, responseType: 'text' })
        if (response.status !== 200 || typeof response.data !== 'string') return null
        return cheerio.load(response.data, { decodeEntities: false })
    } catch (err) {
        return null
    }
}

async function fetchNhentaiJson(path, params = {}) {
    try {
        const response = await requestNhentai(`${NHENTAI_BASE}${path}`, { params })
        if (response.status !== 200 || !response.data || typeof response.data !== 'object') return null
        return response.data
    } catch (err) {
        return null
    }
}

async function fetchNhentaiMarkdown(path, params = {}) {
    const targetUrl = buildNhentaiUrl(path, params)
    const response = await axios.get(`${JINA_BASE}${targetUrl}`, {
        timeout: 20000,
        headers: {
            'User-Agent': NHENTAI_HEADERS['User-Agent'],
            'Accept': 'text/plain'
        },
        validateStatus: () => true
    })
    if (response.status !== 200 || typeof response.data !== 'string') return null
    return response.data
}

async function safeFetchNhentaiMarkdown(path, params = {}) {
    try {
        return await fetchNhentaiMarkdown(path, params)
    } catch (err) {
        return null
    }
}

async function getNhentaiGallery(code) {
    const normalizedCode = String(code).trim()
    const jsonResult = await fetchNhentaiJson(`/api/gallery/${normalizedCode}`)
    if (jsonResult) return normalizeNhentaiGallery(jsonResult)

    const $ = await fetchNhentaiHtml(`/g/${normalizedCode}/`)
    if ($) return doujinScraper($, normalizedCode, false)

    const markdown = await safeFetchNhentaiMarkdown(`/g/${normalizedCode}/`)
    if (markdown && !markdown.includes('Page not found')) return parseGalleryFromMarkdownSafe(markdown, normalizedCode)

    const error = new Error('Doujin not found or nhentai is currently unreachable')
    error.status = 404
    throw error
}

async function searchNhentai(query) {
    const jsonResult = await fetchNhentaiJson('/api/galleries/search', { query })
    if (jsonResult?.result) return jsonResult.result.map(normalizeNhentaiPreview)

    const $ = await fetchNhentaiHtml('/search/', { q: query, page: 1, sort: 'popular' })
    if ($) return previewScraper($, 'search')

    const markdown = await safeFetchNhentaiMarkdown('/search/', { q: query })
    const markdownResults = markdown ? parsePreviewCardsFromMarkdown(markdown) : []
    if (markdownResults.length > 0) return markdownResults

    const error = new Error('Search result not available right now')
    error.status = 502
    throw error
}

async function getLatestNhentai(page = 1) {
    const jsonResult = await fetchNhentaiJson('/api/galleries/all', { page })
    if (jsonResult?.result) return jsonResult.result.map(normalizeNhentaiPreview)

    const $ = await fetchNhentaiHtml('/', { page })
    if ($) return previewScraper($, 'latest')

    const markdown = await safeFetchNhentaiMarkdown('/', { page })
    const latestSection = markdown ? extractMarkdownSection(markdown, 'New Uploads') : ''
    const markdownResults = latestSection ? parsePreviewCardsFromMarkdown(latestSection) : []
    if (markdownResults.length > 0) return markdownResults

    const error = new Error('Latest doujin list not available right now')
    error.status = 502
    throw error
}

async function getPopularNhentai() {
    const $ = await fetchNhentaiHtml('/')
    if ($) return previewScraper($, 'popular')

    const jsonResult = await fetchNhentaiJson('/api/galleries/all', { page: 1 })
    if (jsonResult?.result) return jsonResult.result.map(normalizeNhentaiPreview)

    const markdown = await safeFetchNhentaiMarkdown('/')
    const popularSection = markdown ? extractMarkdownSection(markdown, 'Popular Now') : ''
    const markdownResults = popularSection ? parsePreviewCardsFromMarkdown(popularSection) : []
    if (markdownResults.length > 0) return markdownResults

    const error = new Error('Popular doujin list not available right now')
    error.status = 502
    throw error
}

async function getRandomNhentai() {
    try {
        const response = await requestNhentai(`${NHENTAI_BASE}/random/`, {
            maxRedirects: 0,
            validateStatus: status => [200, 301, 302, 303, 307, 308].includes(status)
        })

        const location = response.headers?.location || response.request?.res?.responseUrl || ''
        const match = String(location).match(/\/g\/(\d+)\/?/)
        if (match) return getNhentaiGallery(match[1])
    } catch (err) {
    }

    const randomMarkdown = await safeFetchNhentaiMarkdown('/random/')
    if (randomMarkdown) {
        const randomGallery = parseGalleryFromMarkdownSafe(randomMarkdown)
        if (randomGallery?.id) return randomGallery
    }

    const $ = await fetchNhentaiHtml('/')
    const lastHref = $ ? ($('.pagination .last').attr('href') || $('.last').attr('href')) : null
    const lastPage = lastHref ? Number(new URL(lastHref, NHENTAI_BASE).searchParams.get('page')) : NaN
    if (Number.isFinite(lastPage) && lastPage > 0) {
        const randomPage = Math.floor(Math.random() * lastPage) + 1
        const latest = await getLatestNhentai(randomPage)
        if (latest.length > 0) {
            const pick = latest[Math.floor(Math.random() * latest.length)]
            return getNhentaiGallery(pick.id)
        }
    }

    const error = new Error('Random doujin is not available right now')
    error.status = 502
    throw error
}

function sendNhentaiError(res, err) {
    const status = err.status || 500
    const message = err.message || 'An internal error occurred while fetching nhentai data'
    console.log(err)
    return res.status(status).json({ status, message, result: 'error' })
}

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
}

function sanitizeFilename(value = '') {
    return String(value)
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120) || 'animanga'
}

function formatFileSize(bytes = 0) {
    if (!bytes) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024
        unitIndex++
    }
    return `${size % 1 === 0 ? size : size.toFixed(2)} ${units[unitIndex]}`
}

async function downloadFile(url, destination) {
    await new Promise((resolve, reject) => {
        request({
            url,
            headers: {
                'User-Agent': NHENTAI_HEADERS['User-Agent'],
                'Referer': NHENTAI_BASE
            }
        })
            .on('error', reject)
            .pipe(fs.createWriteStream(destination))
            .on('finish', resolve)
            .on('error', reject)
    })
}

async function writePdf(imagePaths, pdfPath) {
    await new Promise((resolve, reject) => {
        imageToPdf(imagePaths, 'A4')
            .pipe(fs.createWriteStream(pdfPath))
            .on('finish', resolve)
            .on('error', reject)
    })
}

async function buildPublicPdf(imageUrls, rawTitle, prefix = 'animanga') {
    ensureDir(TMP_DIR)
    ensureDir(PUBLIC_TMP_DIR)

    const safeTitle = sanitizeFilename(rawTitle)
    const token = `${prefix}-${Date.now()}`
    const imagePaths = []

    try {
        for (let i = 0; i < imageUrls.length; i++) {
            const imagePath = path.join(TMP_DIR, `${token}-${i + 1}.jpg`)
            await downloadFile(imageUrls[i], imagePath)
            imagePaths.push(imagePath)
        }

        const pdfFilename = `${token}-${safeTitle}.pdf`
        const pdfPath = path.join(PUBLIC_TMP_DIR, pdfFilename)
        await writePdf(imagePaths, pdfPath)
        const stats = fs.statSync(pdfPath)

        return {
            filename: pdfFilename,
            filepath: pdfPath,
            filesize: formatFileSize(stats.size),
            sizeBytes: stats.size
        }
    } finally {
        for (const imagePath of imagePaths) {
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath)
        }
    }
}

     async function nh(req, res) {
         try {
             let code = req.query.code
             let apikey = req.query.apikey
             if (!code) return res.status(400).send({ status: 400, message: 'code parameter cannot be empty', result: 'error' })
             if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
             let check = await cekKey(apikey)
             if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
             let limit = await isLimit(apikey);
             if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
             limitAdd(apikey);
             let result = await getNhentaiGallery(code)
             res.status(200).json({ status: 200, result: result })
         } catch (err) {
             return sendNhentaiError(res, err)
         }
     }
     
     async function nhpdf(req, res) {
         try {
             let code = req.query.code
             let apikey = req.query.apikey
             if (!code) return res.status(400).send({ status: 400, message: 'code parameter cannot be empty', result: 'error' })
             if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
             let check = await cekKey(apikey)
             if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
             let limit = await isLimit(apikey);
             if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
             limitAdd(apikey);

             const doujin = await getNhentaiGallery(code)
             const title = doujin.title.default || doujin.title.pretty || doujin.title.native || `nh-${code}`
             const pdf = await buildPublicPdf(doujin.pages, title, 'nhpdf')
             const fileUrl = `${req.protocol}://${req.get('host')}/tmp/${encodeURIComponent(pdf.filename)}`

             res.status(200).json({
                 status: 200,
                 result: {
                     filename: pdf.filename,
                     filesize: pdf.filesize,
                     cover: doujin.cover,
                     url: fileUrl
                 }
             })
         } catch (err) {
             return sendNhentaiError(res, err)
         }
     }
     
     async function nhsearch(req, res) {
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
            let result = await searchNhentai(query)
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              return sendNhentaiError(res, err)
         }
     }
     
     async function nhpopular(req, res) {
         try {
            let apikey = req.query.apikey
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await getPopularNhentai()
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              return sendNhentaiError(res, err)
         }
     }
     
     async function nhlatest(req, res) {
         try {
            let apikey = req.query.apikey
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await getLatestNhentai()
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              return sendNhentaiError(res, err)
         }
     }
     
     async function nhrandom(req, res) {
         try {
            let apikey = req.query.apikey
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await getRandomNhentai()
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              return sendNhentaiError(res, err)
         }
     }
     
     async function doujindesu(req, res) {
         try {
             let url = req.query.url
             let apikey = req.query.apikey
             if (!url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
             if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
             let check = await cekKey(apikey)
             if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
             let limit = await isLimit(apikey);
             if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
             limitAdd(apikey);

             const doujin = await ch.doujindesuDl(url)
             const title = doujin.title || 'doujindesu'
             const pdf = await buildPublicPdf(doujin.image, title, 'doujindesu')
             const fileUrl = `${req.protocol}://${req.get('host')}/tmp/${encodeURIComponent(pdf.filename)}`

             res.status(200).json({
                 status: 200,
                 result: {
                     filename: pdf.filename,
                     filesize: pdf.filesize,
                     cover: doujin.image[1] || doujin.image[0] || null,
                     url: fileUrl
                 }
             })
         } catch (err) {
             return sendNhentaiError(res, err)
         }
     }
     
     async function doujinsearch(req, res) {
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
            let result = await ch.doujindesuSearch(query)
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function doujinlatest(req, res) {
         try {
            let apikey = req.query.apikey
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await ch.doujindesuLatest()
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function komiklatest(req, res) {
         try {
            let apikey = req.query.apikey
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await ch.getLatestKomik()
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function komikdl(req, res) {
         try {
            let url = req.query.url
            let apikey = req.query.apikey
            if (!url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await ch.KomikDl(url)
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function mynimesearch(req, res) {
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
            let result = await ch.mynimeSearch(query)
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function mynimelatest(req, res) {
         try {
            let apikey = req.query.apikey
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await ch.getLatestAnime()
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function hanimelatest(req, res) {
         try {
            let apikey = req.query.apikey
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await ch.getLatestHanime()
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }

     async function melolohome(req, res) {
         try {
            let apikey = req.query.apikey
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await getMeloloHome()
              res.status(200).json({ status: 200, result })
         } catch(err) {
              console.log(err)
              const status = err.response?.status || 500
              const message = err.message || 'An internal error occurred while fetching Melolo home'
              res.status(status).send({ status, message, result: 'error' })
         }
     }
     
     async function animeinfo(req, res) {
         try {
            let url = req.query.url
            let apikey = req.query.apikey
            if (!url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await ch.getInfoAnime(url)
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function kusonime(req, res) {
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
            let result = await ch.kusoNime(query)
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function storyanime(req, res) {
         let apikey = req.query.apikey
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let res_ = await fetch('https://raw.githubusercontent.com/Arya-was/endak-tau/main/storyanime.json')
         let data = await res_.json()
         let json = data[Math.floor(Math.random() * data.length)]
         let dl_link = await dl(json)
         let buffer = await getBuffer(dl_link.medias[0].url)
         await fs.writeFileSync(__path +`/tmp/audio.mp4`, buffer)
         await res.sendFile(__path +`/tmp/audio.mp4`)
     }
     
     async function nekopoi(req, res) {
         try {
            let apikey = req.query.apikey
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await ch.getLatest()
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function nekopoiLatest(req, res) {
         try {
            let q = req.query.q
            let apikey = req.query.apikey
            if (!q) return res.status(400).send({ status: 400, message: 'q parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await ch.getLatest(q)
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }

module.exports = { 
   nh, 
   nhpdf, 
   nhsearch,
   nhpopular, 
   nhlatest, 
   nhrandom,
   doujindesu, 
   doujinsearch, 
   doujinlatest, 
   komiklatest,
   komikdl,
   mynimesearch,
   mynimelatest,
   hanimelatest,
   melolohome,
   animeinfo,
   kusonime,
   storyanime,
   nekopoi,
   nekopoiLatest
}
