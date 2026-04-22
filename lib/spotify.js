const axios = require('axios')

const spotifyConfig = {
    clientId: process.env.SPOTIFY_CLIENT_ID || 'd0b7f73c049d4f079d2c42e15f10568f',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '63a72d79d7744e33906c6fb0c048cb82'
}

let cachedToken = null

function createSpotifyError(message, status = 500, cause) {
    const err = new Error(message)
    err.status = status
    if (cause) err.cause = cause
    return err
}

async function getSpotifyToken() {
    const now = Date.now()
    if (cachedToken && cachedToken.expiresAt > now + 5000) {
        return cachedToken.accessToken
    }
    try {
        const response = await axios('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: 'Basic ' + Buffer.from(`${spotifyConfig.clientId}:${spotifyConfig.clientSecret}`).toString('base64')
            },
            data: 'grant_type=client_credentials',
            timeout: 20000
        })
        cachedToken = {
            accessToken: response.data.access_token,
            expiresAt: now + (Number(response.data.expires_in || 3600) * 1000)
        }
        return cachedToken.accessToken
    } catch (error) {
        throw createSpotifyError('Failed to fetch Spotify token', 502, error)
    }
}

function mapTrack(track) {
    return {
        id: track.id,
        name: track.name,
        artist: (track.artists || []).map(artist => artist.name).join(', '),
        album: track.album?.name || null,
        date: track.album?.release_date || null,
        url: track.external_urls?.spotify || null,
        images: track.album?.images || [],
        preview_url: track.preview_url || null,
        duration_ms: track.duration_ms || null,
        explicit: Boolean(track.explicit)
    }
}

async function spotifyRequest(pathname, params = {}) {
    const token = await getSpotifyToken()
    try {
        const response = await axios.get(`https://api.spotify.com/v1${pathname}`, {
            headers: { Authorization: `Bearer ${token}` },
            params,
            timeout: 20000,
            validateStatus: () => true
        })
        if (response.status === 404) {
            throw createSpotifyError('Spotify resource not found', 404)
        }
        if (response.status >= 400) {
            throw createSpotifyError(response.data?.error?.message || 'Spotify request failed', response.status)
        }
        return response.data
    } catch (error) {
        if (error.status) throw error
        throw createSpotifyError('Failed to reach Spotify API', 502, error)
    }
}

async function searchSpotifyTracks(query, limit = 8) {
    if (!query) throw createSpotifyError('Spotify query cannot be empty', 400)
    const data = await spotifyRequest('/search', {
        q: query,
        type: 'track',
        market: 'US',
        limit
    })
    return (data.tracks?.items || []).map(mapTrack)
}

function parseSpotifyUrl(input) {
    const url = String(input || '').trim()
    const match = url.match(/spotify\.com\/(track|album|playlist|artist)\/([A-Za-z0-9]+)/i)
    if (!match) throw createSpotifyError('Invalid Spotify URL', 400)
    return { type: match[1].toLowerCase(), id: match[2] }
}

async function getSpotifyResource(url) {
    const { type, id } = parseSpotifyUrl(url)
    if (type === 'track') {
        const track = await spotifyRequest(`/tracks/${id}`, { market: 'US' })
        return {
            type,
            id: track.id,
            title: track.name,
            artist: (track.artists || []).map(artist => artist.name).join(', '),
            album: track.album?.name || null,
            cover: track.album?.images?.[0]?.url || null,
            url: track.external_urls?.spotify || null,
            tracks: [mapTrack(track)]
        }
    }
    if (type === 'album') {
        const album = await spotifyRequest(`/albums/${id}`, { market: 'US' })
        return {
            type,
            id: album.id,
            title: album.name,
            artist: (album.artists || []).map(artist => artist.name).join(', '),
            cover: album.images?.[0]?.url || null,
            date: album.release_date || null,
            total_tracks: album.total_tracks || 0,
            url: album.external_urls?.spotify || null,
            tracks: (album.tracks?.items || []).map(track => mapTrack({
                ...track,
                album: {
                    name: album.name,
                    release_date: album.release_date,
                    images: album.images
                }
            }))
        }
    }
    if (type === 'playlist') {
        const playlist = await spotifyRequest(`/playlists/${id}`, { market: 'US' })
        return {
            type,
            id: playlist.id,
            title: playlist.name,
            artist: playlist.owner?.display_name || null,
            cover: playlist.images?.[0]?.url || null,
            total_tracks: playlist.tracks?.total || 0,
            url: playlist.external_urls?.spotify || null,
            tracks: (playlist.tracks?.items || [])
                .map(item => item.track)
                .filter(Boolean)
                .map(mapTrack)
        }
    }
    if (type === 'artist') {
        const artist = await spotifyRequest(`/artists/${id}`)
        const topTracks = await spotifyRequest(`/artists/${id}/top-tracks`, { market: 'US' })
        return {
            type,
            id: artist.id,
            title: artist.name,
            artist: artist.name,
            cover: artist.images?.[0]?.url || null,
            followers: artist.followers?.total || 0,
            genres: artist.genres || [],
            url: artist.external_urls?.spotify || null,
            tracks: (topTracks.tracks || []).map(mapTrack)
        }
    }
    throw createSpotifyError('Unsupported Spotify resource type', 400)
}

module.exports = {
    getSpotifyToken,
    searchSpotifyTracks,
    getSpotifyResource
}
