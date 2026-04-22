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
let TiktokApiFacade = null
try {
    ({ TiktokApiFacade } = require('tiktok-hks'))
} catch (error) {
    console.log('TikTok realtime package unavailable:', error.message)
}

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
    if (err.code === 'ECONNABORTED') {
        console.log('Search timeout:', message)
    } else {
        console.log(err)
    }
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

function decodeHtmlEntities(value) {
    return String(value || '')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
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

async function quickSearchRequest(url, parser, timeout = 8000) {
    const { data } = await axios.get(url, {
        timeout,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    return parser(data)
}

async function tiktokSearch(query) {
    try {
        if (!TiktokApiFacade) throw new Error('tiktok-hks package is not installed')
        const results = await TiktokApiFacade.getVideoByKeyword('GET', query, 10, 0)
        if (Array.isArray(results) && results.length) {
            return results.map(item => ({
                id: item.video_id || null,
                title: item.title || null,
                url: item.author?.unique_id && item.video_id ? `https://www.tiktok.com/@${item.author.unique_id}/video/${item.video_id}` : null,
                description: item.title || '',
                type: 'video',
                region: item.region || null,
                duration: item.duration || null,
                play_count: item.play_count || 0,
                like_count: item.digg_count || 0,
                comment_count: item.comment_count || 0,
                share_count: item.share_count || 0,
                download_count: item.download_count || 0,
                create_time: item.create_time || null,
                thumbnail: item.cover || null,
                author: item.author ? {
                    id: item.author.id || null,
                    unique_id: item.author.unique_id || null,
                    nickname: item.author.nickname || null,
                    avatar: item.author.avatar || null
                } : null,
                music: item.music_info ? {
                    id: item.music_info.id || null,
                    title: item.music_info.title || null,
                    play: item.music_info.play || null,
                    cover: item.music_info.cover || null,
                    author: item.music_info.author || null,
                    duration: item.music_info.duration || null
                } : null,
                source: 'tiktok-hks'
            }))
        }
    } catch (error) {
        console.log('TikTok search source failed:', error.message)
    }

    return [{
        id: null,
        title: `TikTok search for ${query}`,
        url: `https://www.tiktok.com/search?q=${encodeURIComponent(query)}`,
        description: 'Structured TikTok results are temporarily unavailable from this server',
        type: 'search',
        source: 'tiktok-public-fallback'
    }]
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

function getSocialHandleCandidates(query, platform) {
    const raw = String(query || '').trim()
    if (!raw) return []
    let normalized = raw
    if (/^https?:\/\//i.test(normalized)) {
        try {
            const parsed = new URL(normalized)
            const parts = parsed.pathname.split('/').filter(Boolean)
            if (platform === 'threads' && parts[0]?.startsWith('@')) {
                normalized = parts[0].slice(1)
            } else {
                normalized = parts[parts.length - 1] || raw
            }
        } catch {
        }
    }
    normalized = normalized
        .replace(/^@/, '')
        .replace(/[?#].*$/, '')
        .trim()

    const compact = normalized.replace(/\s+/g, '')
    const hyphenated = normalized.replace(/\s+/g, '-')
    const underscored = normalized.replace(/\s+/g, '_')
    return [...new Set([normalized, compact, hyphenated, underscored].filter(Boolean))]
}

function extractMetaContent($, property, fallbackName = property) {
    return $(`meta[property="${property}"]`).attr('content')
        || $(`meta[name="${fallbackName}"]`).attr('content')
        || null
}

function stripHtmlTags(value) {
    return String(value || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function parseRssItems(xml) {
    const $ = cheerio.load(String(xml), { xmlMode: true })
    const channel = $('channel').first()
    const feedTitle = channel.find('> title').first().text().trim() || null
    const feedDescription = channel.find('> description').first().text().trim() || null
    const feedLink = channel.find('> link').first().text().trim() || null
    const feedImage = channel.find('image > url').first().text().trim() || null
    const items = $('item').map((_, el) => {
        const item = $(el)
        return {
            title: item.find('title').first().text().trim() || null,
            url: item.find('link').first().text().trim() || null,
            author: item.find('author').first().text().trim()
                || item.find('dc\\:creator').first().text().trim()
                || null,
            pubDate: item.find('pubDate').first().text().trim() || null,
            description: stripHtmlTags(item.find('description').first().text() || item.find('content\\:encoded').first().text())
        }
    }).get()

    return {
        title: feedTitle,
        description: feedDescription,
        link: feedLink,
        image: feedImage,
        items
    }
}

async function instagramRealtimeSearch(query) {
    const candidates = getSocialHandleCandidates(query, 'instagram')
    for (const username of candidates) {
        try {
            const response = await axios.get('https://www.instagram.com/api/v1/users/web_profile_info/', {
                timeout: 12000,
                params: { username },
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'X-IG-App-ID': '936619743392459',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                validateStatus: () => true
            })
            const user = response.data?.data?.user
            if (!user?.username) continue
            return [{
                id: user.id || null,
                username: user.username || username,
                full_name: user.full_name || null,
                biography: user.biography || null,
                profile_url: `https://www.instagram.com/${user.username}/`,
                profile_pic_url: user.profile_pic_url_hd || user.profile_pic_url || null,
                followers: user.edge_followed_by?.count ?? null,
                following: user.edge_follow?.count ?? null,
                posts: user.edge_owner_to_timeline_media?.count ?? null,
                highlight_count: user.highlight_reel_count ?? null,
                is_private: Boolean(user.is_private),
                is_verified: Boolean(user.is_verified),
                external_url: user.external_url || null,
                category_name: user.category_name || user.business_category_name || null,
                source: 'instagram-web-profile-info',
                recent_posts: (user.edge_owner_to_timeline_media?.edges || []).slice(0, 6).map(edge => ({
                    id: edge?.node?.id || null,
                    shortcode: edge?.node?.shortcode || null,
                    url: edge?.node?.shortcode ? `https://www.instagram.com/p/${edge.node.shortcode}/` : null,
                    caption: edge?.node?.edge_media_to_caption?.edges?.[0]?.node?.text || null,
                    thumbnail: edge?.node?.thumbnail_src || edge?.node?.display_url || null,
                    comments: edge?.node?.edge_media_to_comment?.count ?? null,
                    likes: edge?.node?.edge_liked_by?.count ?? null,
                    is_video: Boolean(edge?.node?.is_video)
                }))
            }]
        } catch (error) {
            console.log('Instagram realtime source failed:', error.message)
        }
    }
    return socialSiteSearch(query, ['instagram.com'], 'instagram')
}

async function facebookRealtimeSearch(query) {
    const candidates = getSocialHandleCandidates(query, 'facebook')
    for (const slug of candidates) {
        try {
            const response = await axios.get(`https://www.facebook.com/${encodeURIComponent(slug)}`, {
                timeout: 12000,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                validateStatus: () => true
            })
            if (response.status !== 200) continue
            const $ = cheerio.load(String(response.data))
            const title = extractMetaContent($, 'og:title') || $('title').text().trim()
            const description = extractMetaContent($, 'og:description')
            const pageUrl = extractMetaContent($, 'og:url') || `https://www.facebook.com/${slug}`
            const image = extractMetaContent($, 'og:image')
            const appUrl = extractMetaContent($, 'al:android:url') || extractMetaContent($, 'al:ios:url')
            const idMatch = String(appUrl || '').match(/profile\/(\d+)/)
            if (!title || (!description && title === 'Facebook')) continue
            const likeMatch = String(description || '').match(/([\d,.\s]+)\s+likes/i)
            const talkingMatch = String(description || '').match(/([\d,.\s]+)\s+talking about this/i)
            return [{
                id: idMatch?.[1] || null,
                name: title,
                username: slug,
                url: pageUrl,
                description: description || null,
                image: image || null,
                likes: likeMatch?.[1]?.trim() || null,
                talking_about: talkingMatch?.[1]?.trim() || null,
                source: 'facebook-og-meta'
            }]
        } catch (error) {
            console.log('Facebook realtime source failed:', error.message)
        }
    }
    return socialSiteSearch(query, ['facebook.com', 'fb.com'], 'facebook')
}

async function xRealtimeSearch(query) {
    const candidates = getSocialHandleCandidates(query, 'x')
    for (const handle of candidates) {
        try {
            const rssResponse = await axios.get(`https://nitter.net/${encodeURIComponent(handle)}/rss`, {
                timeout: 12000,
                headers: { 'User-Agent': 'Mozilla/5.0' },
                validateStatus: () => true
            })
            if (rssResponse.status !== 200 || !String(rssResponse.data).includes('<rss')) continue
            const feed = parseRssItems(rssResponse.data)
            const match = String(feed.title || '').match(/^(.*?)\s*\/\s*@([A-Za-z0-9_]+)$/)
            return [{
                id: null,
                name: match?.[1] || handle,
                username: match?.[2] || handle,
                url: `https://x.com/${handle}`,
                avatar: feed.image || null,
                description: (feed.description || '').replace(/^Twitter feed for:\s*/i, '').replace(/\.\s*Generated by.*$/i, '').trim() || null,
                source: 'nitter-rss',
                recent_posts: (feed.items || []).slice(0, 8).map(item => ({
                    title: item.title,
                    url: item.url ? item.url.replace('https://nitter.net/', 'https://x.com/') : null,
                    author: item.author || null,
                    published_at: item.pubDate || null,
                    text: item.description || null
                }))
            }]
        } catch (error) {
            console.log('X realtime source failed:', error.message)
        }
    }
    return socialSiteSearch(query, ['x.com', 'twitter.com'], 'x')
}

async function threadsRealtimeSearch(query) {
    const candidates = getSocialHandleCandidates(query, 'threads')
    for (const username of candidates) {
        try {
            const response = await axios.get(`https://www.threads.net/@${encodeURIComponent(username)}`, {
                timeout: 12000,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                validateStatus: () => true
            })
            if (response.status !== 200) continue
            const $ = cheerio.load(String(response.data))
            const title = extractMetaContent($, 'og:title') || $('title').text().trim()
            const description = extractMetaContent($, 'og:description')
            const image = extractMetaContent($, 'og:image')
            if (!title) continue
            const followersMatch = String(description || '').match(/([\d.,A-Za-z]+)\s+Followers/i)
            const threadsMatch = String(description || '').match(/([\d.,A-Za-z]+)\s+Threads/i)
            return [{
                id: null,
                username,
                title,
                description: description || null,
                followers: followersMatch?.[1] || null,
                threads_count: threadsMatch?.[1] || null,
                url: `https://www.threads.net/@${username}`,
                image: image || null,
                source: 'threads-og-meta'
            }]
        } catch (error) {
            console.log('Threads realtime source failed:', error.message)
        }
    }
    return socialSiteSearch(query, ['threads.net'], 'threads')
}

async function telegramRealtimeSearch(query) {
    const candidates = getSocialHandleCandidates(query, 'telegram')
    for (const handle of candidates) {
        try {
            const response = await axios.get(`https://t.me/s/${encodeURIComponent(handle)}`, {
                timeout: 12000,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                validateStatus: () => true
            })
            if (response.status !== 200) continue
            const $ = cheerio.load(String(response.data))
            const title = extractMetaContent($, 'og:title') || $('title').text().trim()
            const description = extractMetaContent($, 'og:description')
            const image = extractMetaContent($, 'og:image')
            if (!title) continue
            const messages = $('.tgme_widget_message_wrap').map((_, el) => {
                const item = $(el)
                const text = stripHtmlTags(item.find('.tgme_widget_message_text').html())
                const date = item.find('time').attr('datetime') || null
                const url = item.find('.tgme_widget_message_date').attr('href') || null
                return {
                    text: text || null,
                    date,
                    url
                }
            }).get().filter(item => item.text || item.url).slice(0, 8)

            return [{
                id: null,
                username: handle,
                title,
                description: description || null,
                url: `https://t.me/${handle}`,
                image: image || null,
                source: 'telegram-public-page',
                recent_messages: messages
            }]
        } catch (error) {
            console.log('Telegram realtime source failed:', error.message)
        }
    }
    return socialSiteSearch(query, ['t.me'], 'telegram')
}

async function linkedinRealtimeSearch(query) {
    const candidates = getSocialHandleCandidates(query, 'linkedin')
    for (const slug of candidates) {
        try {
            const response = await axios.get(`https://www.linkedin.com/company/${encodeURIComponent(slug)}/`, {
                timeout: 12000,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                validateStatus: () => true
            })
            if (response.status !== 200) continue
            const $ = cheerio.load(String(response.data))
            const title = extractMetaContent($, 'og:title') || $('title').text().trim()
            const description = extractMetaContent($, 'og:description')
            const image = extractMetaContent($, 'og:image')
            if (!title) continue
            const followersMatch = String(description || '').match(/([\d,.\s]+)\s+followers/i)
            return [{
                id: null,
                slug,
                title,
                description: description || null,
                followers: followersMatch?.[1]?.trim() || null,
                url: `https://www.linkedin.com/company/${slug}`,
                image: image || null,
                source: 'linkedin-og-meta'
            }]
        } catch (error) {
            console.log('LinkedIn realtime source failed:', error.message)
        }
    }
    return socialSiteSearch(query, ['linkedin.com'], 'linkedin')
}

async function redditRealtimeSearch(query) {
    const candidates = getSocialHandleCandidates(query, 'reddit')
    for (const candidate of candidates) {
        const normalized = candidate.replace(/^\/+/, '')
        const subreddit = normalized.replace(/^r\//i, '')
        const username = normalized.replace(/^(u|user)\//i, '')

        try {
            const subredditResponse = await axios.get(`https://redlib.perennialte.ch/r/${encodeURIComponent(subreddit)}.rss`, {
                timeout: 12000,
                headers: { 'User-Agent': 'Mozilla/5.0' },
                validateStatus: () => true
            })
            if (subredditResponse.status === 200 && String(subredditResponse.data).includes('<rss')) {
                const feed = parseRssItems(subredditResponse.data)
                return [{
                    id: null,
                    type: 'subreddit',
                    name: subreddit,
                    title: feed.title || `r/${subreddit}`,
                    description: feed.description || null,
                    url: `https://www.reddit.com/r/${subreddit}/`,
                    source: 'redlib-rss',
                    recent_posts: (feed.items || []).slice(0, 8).map(item => ({
                        title: item.title,
                        url: item.url ? item.url.replace('https://redlib.perennialte.ch//', 'https://www.reddit.com/') : null,
                        author: item.author || null,
                        published_at: item.pubDate || null,
                        text: item.description || null
                    }))
                }]
            }
        } catch (error) {
            console.log('Reddit subreddit source failed:', error.message)
        }

        try {
            const userResponse = await axios.get(`https://redlib.perennialte.ch/user/${encodeURIComponent(username)}.rss`, {
                timeout: 12000,
                headers: { 'User-Agent': 'Mozilla/5.0' },
                validateStatus: () => true
            })
            if (userResponse.status === 200 && String(userResponse.data).includes('<rss')) {
                const feed = parseRssItems(userResponse.data)
                return [{
                    id: null,
                    type: 'user',
                    name: username,
                    title: feed.title || `u/${username}`,
                    description: feed.description || null,
                    url: `https://www.reddit.com/user/${username}/`,
                    source: 'redlib-rss',
                    recent_activity: (feed.items || []).slice(0, 8).map(item => ({
                        title: item.title,
                        url: item.url ? item.url.replace('https://redlib.perennialte.ch//', 'https://www.reddit.com/') : null,
                        author: item.author || null,
                        published_at: item.pubDate || null,
                        text: item.description || null
                    }))
                }]
            }
        } catch (error) {
            console.log('Reddit user source failed:', error.message)
        }
    }
    return socialSiteSearch(query, ['reddit.com'], 'reddit')
}

async function socialSiteSearch(query, domains, platform) {
    const settled = await Promise.allSettled(
        domains.map(domain => googleSearch(`site:${domain} ${query}`))
    )
    const merged = []
    for (const result of settled) {
        if (result.status !== 'fulfilled' || !Array.isArray(result.value)) continue
        for (const item of result.value) {
            if (!item?.url) continue
            if (!domains.some(domain => item.url.includes(domain))) continue
            if (merged.some(existing => existing.url === item.url)) continue
            merged.push({
                title: item.title,
                url: item.url,
                description: item.description,
                platform
            })
        }
    }
    if (!merged.length) {
        const encodedQuery = encodeURIComponent(query)
        const fallbackUrls = {
            x: `https://x.com/search?q=${encodedQuery}`,
            instagram: `https://www.instagram.com/explore/search/keyword/?q=${encodedQuery}`,
            facebook: `https://www.facebook.com/search/top/?q=${encodedQuery}`,
            threads: `https://www.threads.net/search?q=${encodedQuery}`,
            reddit: `https://www.reddit.com/search/?q=${encodedQuery}`,
            telegram: `https://t.me/s/${encodedQuery}`,
            linkedin: `https://www.linkedin.com/search/results/all/?keywords=${encodedQuery}`
        }
        return [{
            title: `${platform} search for ${query}`,
            url: fallbackUrls[platform] || null,
            description: `${platform} direct search fallback. Use username/handle queries for richer realtime results.`,
            platform,
            query,
            source: 'platform-fallback'
        }]
    }
    return merged
}

async function validateQueryRequest(req) {
    let query = req.query.query
    let apikey = req.query.apikey
    if (!query) {
        const err = new Error('query parameter cannot be empty')
        err.status = 400
        throw err
    }
    if (!apikey) {
        const err = new Error('apikey parameter cannot be empty')
        err.status = 400
        throw err
    }
    let check = await cekKey(apikey)
    if (!check) {
        const err = new Error(`apikey ${apikey} not found, please register first.`)
        err.status = 404
        throw err
    }
    let limit = await isLimit(apikey);
    if (limit) {
        const err = new Error('requests limit exceeded (100 req / day), call owner for an upgrade to premium')
        err.status = 429
        throw err
    }
    limitAdd(apikey);
    return query
}

function createSocialSearchHandler(searchFn, notFoundMessage) {
    return async function socialSearchHandler(req, res) {
        try {
            const query = await validateQueryRequest(req)
            const result = await searchFn(query)
            return res.status(200).json({ status: 200, result })
        } catch (err) {
            return sendSearchError(res, err)
        }
    }
}

const xsearch = createSocialSearchHandler(
    query => xRealtimeSearch(query),
    'X/Twitter result not found'
)

const instagramsearch = createSocialSearchHandler(
    query => instagramRealtimeSearch(query),
    'Instagram result not found'
)

const facebooksearch = createSocialSearchHandler(
    query => facebookRealtimeSearch(query),
    'Facebook result not found'
)

const threadssearch = createSocialSearchHandler(
    query => threadsRealtimeSearch(query),
    'Threads result not found'
)

const redditsearch = createSocialSearchHandler(
    query => redditRealtimeSearch(query),
    'Reddit result not found'
)

const telegramsearch = createSocialSearchHandler(
    query => telegramRealtimeSearch(query),
    'Telegram result not found'
)

const linkedinsearch = createSocialSearchHandler(
    query => linkedinRealtimeSearch(query),
    'LinkedIn result not found'
)

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

     async function tiktoksearch(req, res) {
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
            let result = ensureResult(await tiktokSearch(query), 'TikTok result not found')
              res.status(200).json({ status: 200, result })
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
   tiktoksearch,
   xsearch,
   instagramsearch,
   facebooksearch,
   threadssearch,
   redditsearch,
   telegramsearch,
   linkedinsearch,
   wiki,
   spotifysearch
}
