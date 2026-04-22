const axios = require('axios')
const cheerio = require('cheerio')
const path = require('path')

function createSpotifyError(message, status = 500, cause) {
    const err = new Error(message)
    err.status = status
    if (cause) err.cause = cause
    return err
}

function decodeHtmlEntities(value) {
    return String(value || '')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
}

function cleanSpotifyUrl(href) {
    if (!href) return null
    if (/^https?:\/\//i.test(href)) return href
    return `https://open.spotify.com${href.startsWith('/') ? '' : '/'}${href}`
}

async function fetchSpotifyPage(url) {
    try {
        const response = await axios.get(url, {
            timeout: 12000,
            headers: { 'User-Agent': 'Mozilla/5.0' },
            validateStatus: () => true
        })
        if (response.status === 404) {
            throw createSpotifyError('Spotify resource not found', 404)
        }
        if (response.status >= 400) {
            throw createSpotifyError('Spotify public page is unavailable', response.status)
        }
        return String(response.data || '')
    } catch (error) {
        if (error.status) throw error
        throw createSpotifyError('Failed to reach Spotify public page', 502, error)
    }
}

async function searchSpotifyTracks(query, limit = 8) {
    if (!query) throw createSpotifyError('Spotify query cannot be empty', 400)
    try {
        const deezerModuleUrl = `file:///${path.resolve(__dirname, '..', 'node_modules', '@soyaxell09', 'zenbot-scraper', 'src', 'scrapers', 'deezer.js').replace(/\\/g, '/')}`
        const deezerModule = await import(deezerModuleUrl)
        const items = await deezerModule.deezerSearch(query, limit)
        if (items.length) {
            return items.map(track => ({
                id: String(track.id || ''),
                name: track.title || track.name || null,
                artist: track.artist?.name || null,
                album: track.album?.title || null,
                date: null,
                url: track.link || null,
                images: track.album?.cover_xl ? [{ url: track.album.cover_xl }] : (track.album?.cover ? [{ url: track.album.cover }] : []),
                preview_url: track.preview || null,
                duration_ms: track.duration ? Number(track.duration) * 1000 : null,
                explicit: Boolean(track.explicit_lyrics),
                source: 'deezer-npm'
            }))
        }
    } catch (error) {
        if (error.status) throw error
    }

    const html = await fetchSpotifyPage(`https://open.spotify.com/search/${encodeURIComponent(query)}`)
    const $ = cheerio.load(html)
    const firstTitle = $('title').text().trim()
    return [{
        id: null,
        name: decodeHtmlEntities(firstTitle || query),
        artist: null,
        album: null,
        date: null,
        url: `https://open.spotify.com/search/${encodeURIComponent(query)}`,
        images: [],
        preview_url: null,
        duration_ms: null,
        explicit: false,
        source: 'spotify-public-search'
    }]
}

function parseSpotifyUrl(input) {
    const url = String(input || '').trim()
    const match = url.match(/spotify\.com\/(track|album|playlist|artist)\/([A-Za-z0-9]+)/i)
    if (!match) throw createSpotifyError('Invalid Spotify URL', 400)
    return { type: match[1].toLowerCase(), id: match[2], url }
}

async function getSpotifyResource(url) {
    const { type, id, url: resourceUrl } = parseSpotifyUrl(url)
    const html = await fetchSpotifyPage(resourceUrl)
    const $ = cheerio.load(html)
    const title = $('title').text().trim() || `${type}:${id}`
    return {
        type,
        id,
        title,
        artist: null,
        cover: $('meta[property="og:image"]').attr('content') || null,
        url: resourceUrl,
        tracks: [],
        source: 'public-page'
    }
}

module.exports = {
    searchSpotifyTracks,
    getSpotifyResource
}
