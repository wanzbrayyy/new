const { cekKey, limitAdd, isLimit } = require('../database/db')
const axios = require('axios')
const cheerio = require('cheerio')

const MELOLO_BASE = 'https://melolo.com'

function cleanText(value = '') {
    return String(value).replace(/\s+/g, ' ').trim()
}

function absoluteUrl(url) {
    if (!url) return null
    try {
        return new URL(url, MELOLO_BASE).toString()
    } catch {
        return url
    }
}

function textOf($root, selector) {
    if (!$root) return null
    if (typeof $root === 'function') {
        return cleanText($root(selector).first().text()) || null
    }
    if (typeof $root.find === 'function') {
        return cleanText($root.find(selector).first().text()) || null
    }
    return null
}

function extractMeta($, property, name = property) {
    return $(`meta[property="${property}"]`).attr('content')
        || $(`meta[name="${name}"]`).attr('content')
        || null
}

async function validateRequest(req, extraFieldName = null) {
    const apikey = req.query.apikey
    if (!apikey) {
        const err = new Error('apikey parameter cannot be empty')
        err.status = 400
        throw err
    }
    const check = await cekKey(apikey)
    if (!check) {
        const err = new Error(`apikey ${apikey} not found, please register first.`)
        err.status = 404
        throw err
    }
    const limit = await isLimit(apikey)
    if (limit) {
        const err = new Error('requests limit exceeded (100 req / day), call owner for an upgrade to premium')
        err.status = 429
        throw err
    }
    limitAdd(apikey)

    if (!extraFieldName) return null
    const value = req.query[extraFieldName]
    if (!value) {
        const err = new Error(`${extraFieldName} parameter cannot be empty`)
        err.status = 400
        throw err
    }
    return value
}

async function loadMelolo(url) {
    const response = await axios.get(url, {
        timeout: 20000,
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept-Language': 'en-US,en;q=0.9'
        }
    })
    return cheerio.load(String(response.data))
}

function meloloCdnHeaders() {
    return {
        'User-Agent': 'Mozilla/5.0',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: `${MELOLO_BASE}/`
    }
}

function parseMeloloCardGrid($, section, selector) {
    return section.find(selector).map((_, el) => {
        const card = $(el)
        const detailAnchor = card.find('a[href*="/dramas/"]').filter((__, anchor) => !/\/ep\d+$/i.test($(anchor).attr('href') || '')).last()
        const watchAnchor = card.find('a[href*="/dramas/"]').filter((__, anchor) => /\/ep\d+$/i.test($(anchor).attr('href') || '')).first()
        const episodeText = cleanText(card.find('div').filter((__, div) => /Eps/i.test($(div).text())).first().text())
        return {
            title: cleanText(detailAnchor.text()) || null,
            category: cleanText(card.find('a[href*="/category/"]').first().text()) || null,
            rating: cleanText(card.find('div.text-order-blue.text-xs, div.text-orange-500.font-bold, div.text-orange-500.text-base.font-bold').first().text()) || null,
            episodes: episodeText || null,
            description: cleanText(card.find('div.text-slate-500.text-sm, div.opacity-90.text-sm, div.text-Text.text-sm').last().text()) || null,
            detail_url: absoluteUrl(detailAnchor.attr('href')),
            watch_url: absoluteUrl(watchAnchor.attr('href')),
            image: absoluteUrl(card.find('img').first().attr('src'))
        }
    }).get().filter(item => item.title && item.detail_url)
}

function parseMeloloFeatured($, section) {
    return section.find('div.min-w-82.self-stretch').map((_, el) => {
        const card = $(el)
        const detailAnchor = card.find('a[href*="/dramas/"]').filter((__, anchor) => !/\/ep\d+$/i.test($(anchor).attr('href') || '')).first()
        const watchAnchor = card.find('a[href*="/dramas/"]').filter((__, anchor) => /\/ep\d+$/i.test($(anchor).attr('href') || '')).first()
        return {
            title: cleanText(detailAnchor.text()) || null,
            category: cleanText(card.find('a[href*="/category/"]').first().text()) || null,
            description: cleanText(card.find('div.opacity-90').first().text()) || null,
            detail_url: absoluteUrl(detailAnchor.attr('href')),
            watch_url: absoluteUrl(watchAnchor.attr('href')),
            image: absoluteUrl(card.find('img').last().attr('src'))
        }
    }).get().filter(item => item.title && item.detail_url)
}

async function getMeloloHomeData() {
    const $ = await loadMelolo(`${MELOLO_BASE}/`)
    const sections = $('main > div')
    return {
        source: MELOLO_BASE,
        title: cleanText($('title').first().text()) || null,
        description: extractMeta($, 'og:description', 'description'),
        hero: {
            title: textOf(sections.eq(0), 'h1'),
            description: cleanText(sections.eq(0).find('h1').first().parent().find('div').last().text()) || null
        },
        featured: parseMeloloFeatured($, sections.eq(0)),
        latest_releases: parseMeloloCardGrid($, sections.eq(1), 'div.self-stretch.bg-white.rounded-xl'),
        popular_romance: parseMeloloCardGrid($, sections.eq(2), 'div.min-w-45.bg-white.rounded-lg'),
        popular_revenge: parseMeloloCardGrid($, sections.eq(3), 'div.w-full.relative.p-4.bg-white.rounded-xl')
    }
}

function parseEpisodes($) {
    const groups = []
    const labels = $('div').map((_, el) => cleanText($(el).text())).get().filter(text => /^\d+\-\d+$/.test(text))
    const episodeAnchors = $('a[href*="/ep"]').map((_, el) => {
        const href = $(el).attr('href')
        const label = cleanText($(el).text())
        if (!href || !/\/ep\d+$/i.test(href) || !/^\d+$/.test(label)) return null
        return {
            number: Number(label),
            url: absoluteUrl(href)
        }
    }).get().filter(Boolean)

    for (const label of [...new Set(labels)]) groups.push(label)
    return {
        total_label: cleanText($('div').filter((_, el) => /^All Episodes \(\d+\)$/.test(cleanText($(el).text()))).first().text()) || null,
        groups,
        list: episodeAnchors
    }
}

function parseEpisodeListFromHtml(html = '') {
    const matches = [...String(html).matchAll(/\\\"episode_id\\\":(\d+),\\\"url\\\":\\\"(https:[^\\"]+?\.mp4\?[^\\"]+)\\\"/g)]
    return matches.map(match => ({
        episode_id: Number(match[1]),
        url: match[2].replace(/\\u0026/g, '&')
    }))
}

function parseProductionDetails($) {
    const details = {}
    $('table tbody tr').each((_, el) => {
        const row = $(el)
        const key = cleanText(row.find('td').first().text())
        const value = cleanText(row.find('td').last().text())
        if (key) details[key] = value || null
    })
    return details
}

function parseFeaturedComments($) {
    const comments = []
    $('h3').each((_, el) => {
        if (cleanText($(el).text()) !== 'Featured Comments') return
        const section = $(el).parent().parent()
        section.find('img[alt]').each((__, img) => {
            const alt = $(img).attr('alt')
            if (!alt || alt.includes('Photo') || alt === 'melolo logo') return
            const container = $(img).closest('div.w-full.pb-5, div.w-full.border-b')
            const author = cleanText(container.find('div.text-Text.text-base.font-bold').first().text()) || alt
            const score = cleanText(container.find('div').filter((___, node) => /\/\s*10/.test(cleanText($(node).text()))).first().text()) || null
            const content = cleanText(container.find('div.text-Text.text-sm, div.text-slate-500.text-sm').last().text()) || null
            if (author) comments.push({ author, score, content, avatar: absoluteUrl($(img).attr('src')) })
        })
    })
    return comments.slice(0, 10)
}

function parseRecommendedSections($) {
    const sections = []
    $('h2').each((_, el) => {
        const heading = cleanText($(el).text())
        if (!heading || (heading !== 'Find Hot Short Dramas Online on Melolo' && heading !== 'Top Short Drama Lists')) return
        const container = $(el).closest('div').parent().parent()
        const items = []
        container.find('a[href*="/dramas/"], a[href*="/guides/"]').each((__, link) => {
            const href = $(link).attr('href')
            const title = cleanText($(link).text())
            if (!href || !title) return
            if (items.some(item => item.url === absoluteUrl(href))) return
            items.push({
                title,
                url: absoluteUrl(href),
                type: href.includes('/guides/') ? 'guide' : 'drama'
            })
        })
        if (items.length) sections.push({ title: heading, items: items.slice(0, 20) })
    })
    return sections
}

async function getMeloloDetailData(input) {
    const targetUrl = /^https?:\/\//i.test(input)
        ? input
        : `${MELOLO_BASE}/dramas/${String(input).replace(/^\/+|\/+$/g, '')}`
    const response = await axios.get(targetUrl, {
        timeout: 20000,
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept-Language': 'en-US,en;q=0.9'
        }
    })
    const html = String(response.data)
    const $ = cheerio.load(html)

    const title = textOf($, 'h1')
    const breadcrumb = $('a[href]').map((_, el) => {
        const href = $(el).attr('href')
        const text = cleanText($(el).text())
        if (!href || !text) return null
        if (!(href.includes('/category/') || href === MELOLO_BASE || href === 'https://melolo.com')) return null
        return { title: text, url: absoluteUrl(href) }
    }).get().filter(Boolean)

    const category = cleanText($('a[href*="/category/"]').first().text()) || null
    const scoreBox = $('div.text-orange-500.text-2xl.font-bold').first()
    const score = cleanText(scoreBox.text()) || cleanText($('div.text-orange-500.text-base.font-bold').first().text()) || null
    const episodesSummary = cleanText($('div').filter((_, el) => /^\d+\s*Eps$/i.test(cleanText($(el).text()))).first().text()) || null
    const description = cleanText($('meta[name="description"]').attr('content')) || null
    const watchUrl = absoluteUrl($('a[href*="/ep1"]').first().attr('href'))
    const coverImage = absoluteUrl($('meta[property="og:image"]').attr('content') || $('img').filter((_, el) => ($(el).attr('alt') || '') === title).first().attr('src'))

    const plotHeading = $('h2').filter((_, el) => cleanText($(el).text()).startsWith('Plot of ')).first()
    const plot = plotHeading.length
        ? cleanText(plotHeading.parent().find('p, div.text-Text.text-base, div.text-slate-500.text-base').first().text()) || null
        : null

    const photosHeading = $('h2').filter((_, el) => cleanText($(el).text()).includes('Photos')).first()
    const photos = photosHeading.length
        ? photosHeading.parent().parent().find('img[alt*="Photo"]').map((_, el) => absoluteUrl($(el).attr('src'))).get().filter(Boolean)
        : []

    const quickTagsText = cleanText($('div').filter((_, el) => cleanText($(el).text()) === 'QUICK TAGS').parent().text())
    const quickTags = [...new Set((quickTagsText.match(/#[A-Za-z0-9_-]+/g) || []).map(tag => tag.trim()))]

    const productionDetails = parseProductionDetails($)
    const episodes = parseEpisodes($)
    const mp4Episodes = parseEpisodeListFromHtml(html)

    return {
        source: absoluteUrl(targetUrl),
        title,
        category,
        breadcrumb,
        score,
        episodes_summary: episodesSummary,
        description,
        watch_url: watchUrl,
        image: coverImage,
        language: cleanText($('div').filter((_, el) => cleanText($(el).text()) === 'English').first().text()) || null,
        episode_list: episodes,
        episode_mp4_list: mp4Episodes,
        plot,
        photos,
        production_details: productionDetails,
        quick_tags: quickTags,
        featured_comments: parseFeaturedComments($),
        related_sections: parseRecommendedSections($)
    }
}

async function getMeloloDownloadData(input) {
    const targetUrl = /^https?:\/\//i.test(input)
        ? input
        : `${MELOLO_BASE}/dramas/${String(input).replace(/^\/+|\/+$/g, '')}`
    const response = await axios.get(targetUrl, {
        timeout: 20000,
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept-Language': 'en-US,en;q=0.9'
        }
    })
    const html = String(response.data)
    const $ = cheerio.load(html)
    const episodeLinks = parseEpisodeListFromHtml(html)
    const episodeLdJson = $('script[type="application/ld+json"]').map((_, el) => {
        const raw = $(el).html()
        try {
            return JSON.parse(raw)
        } catch {
            return null
        }
    }).get().find(item => item && item['@type'] === 'TVEpisode')

    const currentEpisodeNumber = Number(episodeLdJson?.episodeNumber || (absoluteUrl(targetUrl).match(/\/ep(\d+)$/i)?.[1] || 0)) || null
    const currentEpisode = episodeLinks.find(item => item.episode_id === currentEpisodeNumber) || episodeLinks[0] || null

    return {
        source: absoluteUrl(targetUrl),
        title: textOf($, 'h1'),
        series_title: episodeLdJson?.partOfSeries?.name || cleanText($('title').text().split(' - ')[0]) || null,
        episode_number: currentEpisodeNumber,
        current_mp4_source: currentEpisode ? currentEpisode.url : null,
        episode_mp4_list: episodeLinks,
        image: absoluteUrl(extractMeta($, 'og:image')),
        watch_page: absoluteUrl(targetUrl)
    }
}

async function streamMeloloMedia(mediaUrl, res, downloadName = 'melolo.mp4') {
    const response = await axios.get(mediaUrl, {
        timeout: 30000,
        headers: meloloCdnHeaders(),
        responseType: 'stream',
        validateStatus: () => true
    })

    if (response.status !== 200 || !response.data) {
        const err = new Error('Failed to fetch Melolo media file')
        err.status = response.status || 502
        throw err
    }

    res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4')
    if (response.headers['content-length']) {
        res.setHeader('Content-Length', response.headers['content-length'])
    }
    res.setHeader('Content-Disposition', `inline; filename="${downloadName}"`)
    response.data.pipe(res)
}

async function getMeloloGuidesData() {
    const $ = await loadMelolo(`${MELOLO_BASE}/guides`)
    const items = []
    $('a[href*="/guides/"]').each((_, el) => {
        const link = $(el)
        const href = link.attr('href')
        const title = cleanText(link.text())
        if (!href || !title || href.endsWith('/guides')) return
        if (items.some(item => item.url === absoluteUrl(href))) return
        const card = link.closest('div')
        const image = absoluteUrl(card.find('img').first().attr('src'))
        const description = cleanText(card.find('div.text-Text.text-sm, div.text-slate-500.text-sm').last().text()) || null
        const date = cleanText(card.find('div').filter((__, node) => /\d{4}-\d{2}-\d{2}/.test(cleanText($(node).text()))).first().text()) || null
        items.push({
            title,
            url: absoluteUrl(href),
            image,
            description,
            publish_date: date
        })
    })
    return {
        source: `${MELOLO_BASE}/guides`,
        title: textOf($, 'h1'),
        description: extractMeta($, 'og:description', 'description'),
        guides: items
    }
}

async function getMeloloRankingData() {
    const $ = await loadMelolo(`${MELOLO_BASE}/ranking`)
    const sections = $('main > div')
    return {
        source: `${MELOLO_BASE}/ranking`,
        title: textOf($, 'h1'),
        description: extractMeta($, 'og:description', 'description'),
        weekly_hot: parseMeloloCardGrid($, sections.eq(1), 'div.h-46, div.self-stretch.relative.bg-white.rounded-lg'),
        best_by_platform: parseMeloloCardGrid($, sections.eq(3), 'div.relative.bg-white.rounded-lg'),
        category_links: $('a[href*="/category/"]').map((_, el) => ({
            title: cleanText($(el).text()) || null,
            url: absoluteUrl($(el).attr('href'))
        })).get().filter(item => item.title && item.url).slice(0, 40)
    }
}

async function getMeloloCategoryData(slug, page = 1) {
    const normalizedSlug = String(slug).replace(/^\/+|\/+$/g, '')
    const pageSuffix = Number(page) > 1 ? `/${Number(page)}` : ''
    const url = `${MELOLO_BASE}/category/${normalizedSlug}${pageSuffix}`
    const $ = await loadMelolo(url)

    const categoryLinks = $('a[href*="/category/"]').map((_, el) => ({
        title: cleanText($(el).text()) || null,
        url: absoluteUrl($(el).attr('href'))
    })).get().filter(item => item.title && item.url)

    const dramaItems = []
    $('a[href*="/dramas/"]').each((_, el) => {
        const href = $(el).attr('href')
        if (!href || /\/ep\d+$/i.test(href)) return
        const title = cleanText($(el).text()) || cleanText($(el).attr('aria-label'))
        if (!title) return
        if (dramaItems.some(item => item.detail_url === absoluteUrl(href))) return
        const card = $(el).closest('div')
        dramaItems.push({
            title,
            detail_url: absoluteUrl(href),
            image: absoluteUrl(card.find('img').first().attr('src')),
            rating: cleanText(card.find('div.text-order-blue.text-xs, div.text-orange-500.font-bold, div.text-orange-500.text-base.font-bold').first().text()) || null,
            categories: card.find('a[href*="/category/"]').map((__, link) => cleanText($(link).text())).get().filter(Boolean)
        })
    })

    return {
        source: url,
        title: textOf($, 'h1'),
        description: extractMeta($, 'og:description', 'description'),
        current_page: Number(page) || 1,
        next_page: absoluteUrl($('link[rel="next"]').attr('href')),
        categories: categoryLinks,
        dramas: dramaItems,
        related_guides: $('a[href*="/guides/"]').map((_, el) => ({
            title: cleanText($(el).text()) || null,
            url: absoluteUrl($(el).attr('href'))
        })).get().filter(item => item.title && item.url).slice(0, 20)
    }
}

function sendError(res, err) {
    const status = err.status || err.response?.status || 500
    const message = err.message || 'An internal error occurred while fetching Melolo data'
    console.log(err)
    return res.status(status).json({ status, message, result: 'error' })
}

async function melolohome(req, res) {
    try {
        await validateRequest(req)
        const result = await getMeloloHomeData()
        return res.status(200).json({ status: 200, result })
    } catch (err) {
        return sendError(res, err)
    }
}

async function melolodetail(req, res) {
    try {
        const input = await validateRequest(req, req.query.url ? 'url' : 'slug')
        const result = await getMeloloDetailData(input)
        return res.status(200).json({ status: 200, result })
    } catch (err) {
        return sendError(res, err)
    }
}

async function melologuides(req, res) {
    try {
        await validateRequest(req)
        const result = await getMeloloGuidesData()
        return res.status(200).json({ status: 200, result })
    } catch (err) {
        return sendError(res, err)
    }
}

async function meloloranking(req, res) {
    try {
        await validateRequest(req)
        const result = await getMeloloRankingData()
        return res.status(200).json({ status: 200, result })
    } catch (err) {
        return sendError(res, err)
    }
}

async function melolocategory(req, res) {
    try {
        const slug = await validateRequest(req, 'slug')
        const page = req.query.page || 1
        const result = await getMeloloCategoryData(slug, page)
        return res.status(200).json({ status: 200, result })
    } catch (err) {
        return sendError(res, err)
    }
}

async function melolodownload(req, res) {
    try {
        const input = await validateRequest(req, req.query.url ? 'url' : 'slug')
        const result = await getMeloloDownloadData(input)
        const targetUrl = req.query.url || req.query.slug
        const encodedTarget = encodeURIComponent(targetUrl)
        result.current_mp4 = result.current_mp4_source
            ? `/api/melolodownloadfile?url=${encodedTarget}&episode=${result.episode_number || 1}&apikey=${req.query.apikey}`
            : null
        result.download_url = result.current_mp4
        result.episode_mp4_list = result.episode_mp4_list.map(item => ({
            ...item,
            proxy_url: `/api/melolodownloadfile?url=${encodedTarget}&episode=${item.episode_id}&apikey=${req.query.apikey}`
        }))
        return res.status(200).json({ status: 200, result })
    } catch (err) {
        return sendError(res, err)
    }
}

async function melolodownloadfile(req, res) {
    try {
        const input = await validateRequest(req, req.query.url ? 'url' : 'slug')
        const requestedEpisode = Number(req.query.episode || 1)
        const result = await getMeloloDownloadData(input)
        const media = result.episode_mp4_list.find(item => item.episode_id === requestedEpisode)
            || result.episode_mp4_list[0]

        if (!media?.url) {
            const err = new Error('Melolo episode mp4 not found')
            err.status = 404
            throw err
        }

        const safeSeries = String(result.series_title || 'melolo')
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
            .replace(/\s+/g, '-')
            .slice(0, 80)
        await streamMeloloMedia(media.url, res, `${safeSeries}-ep${media.episode_id}.mp4`)
    } catch (err) {
        if (!res.headersSent) return sendError(res, err)
        console.log(err)
    }
}

module.exports = {
    melolohome,
    melolodetail,
    melologuides,
    meloloranking,
    melolocategory,
    melolodownload,
    melolodownloadfile
}
