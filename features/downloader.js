const { getBuffer, shorts } = require('../lib/function')
const { dl } = require('../lib/aiovideodl')
const { cekKey, limitAdd, isLimit } = require('../database/db');
const { getInfo, fbdl } = require('../lib/downloader.js')
const { insta } = require('../lib/instagram.js')
const { ytv, yta } = require('../lib/ytdl')
const ch = require('../lib/scraper')
const scraper = require('@bochilteam/scraper')

const fs = require('fs')
const path = require('path')
const axios = require('axios')
const cheerio = require('cheerio')
const fetch = require('node-fetch')

__path = process.cwd()
const TMP_DIR = path.join(__path, 'tmp')

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
}

function createDownloaderError(message, status = 500, cause) {
    const err = new Error(message)
    err.status = status
    if (cause) err.cause = cause
    return err
}

function sendDownloaderError(res, err) {
    const status = err.status || err.response?.status || 500
    const message = err.message || 'An internal error occurred while processing downloader request'
    console.log(err)
    return res.status(status).send({ status, message, result: 'error' })
}

function ensureValue(value, message, status = 404) {
    if (value == null) throw createDownloaderError(message, status)
    if (Array.isArray(value) && value.length === 0) throw createDownloaderError(message, status)
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) throw createDownloaderError(message, status)
    return value
}

function extractYouTubeId(url) {
    const match = String(url || '').match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:shorts\/|watch\?(?:.*&)?v=|embed\/|v\/))([A-Za-z0-9_-]{11})/)
    return match?.[1] || null
}

function extractTweetId(url) {
    return String(url || '').match(/status\/(\d+)/)?.[1] || null
}

async function getHealthyInvidiousInstance() {
    const { data } = await axios.get('https://api.invidious.io/instances.json?sort_by=health', {
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const candidates = data
        .filter(([, meta]) => meta?.api)
        .map(([host, meta]) => meta.uri || `${meta.type}://${host}`)
    for (const instance of candidates.slice(0, 12)) {
        try {
            const response = await axios.get(`${instance}/api/v1/videos/dQw4w9WgXcQ`, {
                timeout: 12000,
                headers: { 'User-Agent': 'Mozilla/5.0' },
                validateStatus: () => true
            })
            if (response.status === 200 && response.data?.title) return instance
        } catch {
        }
    }
    throw createDownloaderError('Failed to reach YouTube source', 502)
}

async function downloadYouTube(url) {
    const videoId = extractYouTubeId(url)
    if (!videoId) throw createDownloaderError('Invalid YouTube URL', 400)
    const instance = await getHealthyInvidiousInstance()
    const { data } = await axios.get(`${instance}/api/v1/videos/${videoId}`, {
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const audioStreams = (data.adaptiveFormats || [])
        .filter(item => /^audio\//i.test(item.type || ''))
        .sort((a, b) => Number(b.bitrate || 0) - Number(a.bitrate || 0))
    const videoStreams = [
        ...(data.formatStreams || []),
        ...(data.adaptiveFormats || []).filter(item => /^video\//i.test(item.type || ''))
    ]
        .filter(item => /^video\//i.test(item.type || ''))
        .sort((a, b) => Number(b.width || 0) - Number(a.width || 0))
    const bestAudio = ensureValue(audioStreams[0], 'YouTube audio stream not found')
    const bestVideo = ensureValue(videoStreams[0], 'YouTube video stream not found')
    const thumb = (data.videoThumbnails || []).sort((a, b) => Number(b.width || 0) - Number(a.width || 0))[0]?.url || null
    return {
        title: data.title,
        thumb,
        size_audio: bestAudio.clen ? `${(Number(bestAudio.clen) / 1048576).toFixed(2)} MB` : null,
        size_video: bestVideo.clen ? `${(Number(bestVideo.clen) / 1048576).toFixed(2)} MB` : null,
        audio_url: bestAudio.url,
        video_url: bestVideo.url,
        source: instance
    }
}

async function downloadSfile(url) {
    const normalizedUrl = String(url || '').replace('sfile.mobi/', 'sfile.co/')
    const { data } = await axios.get(normalizedUrl, {
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const $ = cheerio.load(data)
    const button = $('#download')
    const link = button.attr('data-dw-url')
    const wait = button.attr('data-wait-seconds')
    const title = $('meta[property="og:title"]').attr('content') || $('title').text().trim()
    const description = $('meta[name="description"]').attr('content') || ''
    const size = description.match(/size\s+([\d.]+\s*(?:KB|MB|GB))/i)?.[1]?.trim() || null
    const uploaded = description.match(/uploaded by .* on ([^.]+?) in folder/i)?.[1]?.trim() || null
    return {
        title,
        size,
        uploaded,
        wait_seconds: wait ? Number(wait) : null,
        link: ensureValue(link, 'Sfile direct download link not found')
    }
}

async function downloadTelegramSticker(url) {
    const { data } = await axios.get(url, {
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const $ = cheerio.load(data)
    const tgUrl = $('a[href^="tg://addstickers"]').attr('href')
    const packName = String(url).split('/').filter(Boolean).pop()
    return {
        title: $('meta[property="og:title"]').attr('content') || $('title').text().trim(),
        description: $('meta[property="og:description"]').attr('content') || $('.tgme_page_description').text().trim(),
        pack: packName,
        url,
        tg_url: ensureValue(tgUrl, 'Telegram sticker pack metadata not found')
    }
}

async function downloadTikTok(url) {
    const { data } = await axios.post('https://www.tikwm.com/api/', { url }, {
        timeout: 20000,
        headers: {
            'content-type': 'application/json',
            'User-Agent': 'Mozilla/5.0'
        }
    })
    if (data?.code !== 0 || !data?.data) {
        throw createDownloaderError(data?.msg || 'TikTok video not found', 404)
    }
    const result = data.data
    return {
        title: result.title,
        cover: result.cover,
        author: result.author,
        nowm: result.play || result.hdplay,
        wm: result.wmplay || result.play,
        audio: result.music,
        duration: result.duration,
        stats: {
            likes: result.digg_count,
            comments: result.comment_count,
            shares: result.share_count,
            downloads: result.download_count
        }
    }
}

async function downloadTwitter(url) {
    const tweetId = extractTweetId(url)
    if (!tweetId) throw createDownloaderError('Invalid Twitter/X URL', 400)
    const apis = [
        `https://api.vxtwitter.com/Twitter/status/${tweetId}`,
        `https://api.fxtwitter.com/i/status/${tweetId}`
    ]
    let payload = null
    for (const apiUrl of apis) {
        try {
            const response = await axios.get(apiUrl, {
                timeout: 20000,
                headers: { 'User-Agent': 'Mozilla/5.0' },
                validateStatus: () => true
            })
            if (response.status === 200 && response.data) {
                payload = response.data
                break
            }
        } catch {
        }
    }
    if (!payload) throw createDownloaderError('Twitter/X media not found', 404)
    if (payload.media_extended) {
        const mediaItems = payload.media_extended.map(item => item.url || item.thumbnail_url).filter(Boolean)
        return {
            type: payload.media_extended.every(item => /^video|gif$/i.test(item.type || '')) ? 'video' : 'photo',
            full_text: payload.text || payload.tweet?.text || '',
            variants: mediaItems
        }
    }
    const tweet = payload.tweet || payload
    const media = tweet.media?.all || []
    const variants = media.flatMap(item => item.variants ? item.variants.map(variant => variant.url).filter(Boolean) : [item.url]).filter(Boolean)
    return {
        type: media.some(item => item.type === 'video' || item.type === 'gif') ? 'video' : 'photo',
        full_text: tweet.text || payload.text || '',
        variants: ensureValue(variants, 'Twitter/X media stream not found')
    }
}

async function downloadPinterest(url) {
    const { data } = await axios.get(url, {
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const matches = [...String(data).matchAll(/https:\/\/i\.pinimg\.com\/[^\s"'`)}]+/g)]
        .map(match => match[0])
        .filter(link => /\.(?:jpg|jpeg|png|webp)(?:\?|$)/i.test(link))
        .map(link => link.replace(/\/(?:75x75_RS|236x)\//, '/originals/'))
    const result = [...new Set(matches)]
    return { result: ensureValue(result, 'Pinterest media not found') }
}
     
     async function tiktok(req, res) {
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
            let result = await downloadTikTok(url)
              res.status(200).json({ status: 200, result })
          } catch(err) {
              return sendDownloaderError(res, err)
         }
     }
     
     async function tiktok2(req, res) {
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
            let hasil = await downloadTikTok(url)
            let nowm = await shorts(hasil.nowm)
            let wm = await shorts(hasil.wm)
            let audio = await shorts(hasil.audio)
             res.status(200).json({ status: 200, result: { url_nowm: nowm, url_wm: wm, url_audio: audio }})
         } catch(err) {
             return sendDownloaderError(res, err)
         }
     }
     
     async function tiktoknowm(req, res) {
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
            let hasil = await downloadTikTok(url)
            let data = await getBuffer(hasil.nowm)
             ensureDir(TMP_DIR)
             await fs.writeFileSync(path.join(TMP_DIR, 'tiktok.mp4'), data)
             await res.sendFile(path.join(TMP_DIR, 'tiktok.mp4'))
         } catch(err) {
             return sendDownloaderError(res, err)
         }
     }
     
     async function youtube(req, res) {
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
            let result = await downloadYouTube(url)
              res.json({ status: 200, result })
         } catch(err) {
              return sendDownloaderError(res, err)
         }
     }
     
     async function twitter(req, res) {
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
            let result = await downloadTwitter(url)
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              return sendDownloaderError(res, err)
         }
     }
     
     async function twitter2(req, res) {
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
            let result = await downloadTwitter(url)
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              return sendDownloaderError(res, err)
          }
      }
      
      async function zippyshare(req, res) {
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
            throw createDownloaderError('Zippyshare has been permanently shut down, this endpoint is no longer available', 410)
            let result = await ch.zippyshare(url)
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              return sendDownloaderError(res, err)
          }
     }
     
     async function xnxxdl(req, res) {
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
            let result = await ch.xnxxDl(url)
            let urlnya = await shorts(result.files.high)
              res.status(200).json({ status: 200, result: { title: result.title, url: urlnya }})
          } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
          }
     }
     
     async function xnxxsearch(req, res) {
         try {
            let query = req.query.query
            let apikey = req.query.apikey
            if (!query) return res.status(400).send({ status: 400, message: 'query parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.json({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let hasil = await ch.xnxxSearch(query)
              res.status(200).json(hasil)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function pindl(req, res) {
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
            let result = await downloadPinterest(url)
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              return sendDownloaderError(res, err)
          }
     }
     
     async function mediafire(req, res) {
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
            let result = ensureValue(await ch.mediafireDl(url), 'MediaFire file not found')
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              return sendDownloaderError(res, err)
          }
     }
     
     async function soundcloud(req, res) {
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
            let result = ensureValue(await ch.scdl(url), 'SoundCloud media not found')
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              return sendDownloaderError(res, err)
          }
     }
     
     async function instagram(req, res) {
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
            let result = ensureValue(await insta(url), 'Instagram media not found')
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              return sendDownloaderError(res, err)
          }
     }
     
     async function instagram2(req, res) {
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
            let result = ensureValue(await insta(url), 'Instagram media not found')
              res.status(200).json({ status: 200, result })
          } catch(err) {
              return sendDownloaderError(res, err)
          }
     }
    
     async function instagram3(req, res) {
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
            let result = ensureValue(await insta(url), 'Instagram media not found')
              res.status(200).json({ status: 200, result })
          } catch(err) {
              return sendDownloaderError(res, err)
          }
     }
     
     async function instastory(req, res) {
         try {
            let username = req.query.username
            let apikey = req.query.apikey
            if (!username) return res.status(400).send({ status: 400, message: 'username parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = ensureValue(await ch.igStory(username), 'Instagram story not found')
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              return sendDownloaderError(res, err)
          }
     }
     
     async function sfiledl(req, res) {
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
            let result = await downloadSfile(url)
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              return sendDownloaderError(res, err)
          }
     }
     
     async function anonfiledl(req, res) {
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
            throw createDownloaderError('AnonFiles has been shut down, this endpoint is no longer available', 410)
            let result = await ch.anonfiledl(url)
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              return sendDownloaderError(res, err)
          }
     }
     
     async function stickerDl(req, res) {
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
            let result = ensureValue(await ch.stickerDl(url), 'Sticker pack not found')
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              return sendDownloaderError(res, err)
          }
     }
     
     async function telesticker(req, res) {
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
            let result = await downloadTelegramSticker(url)
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              return sendDownloaderError(res, err)
          }
     }
     
     async function facebook(req, res) {
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
            let result = ensureValue(await fbdl(url), 'Facebook media not found')
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              return sendDownloaderError(res, err)
          }
     }
     
     async function aiovideodl(req, res) {
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
            let result
            if (/tiktok\.com|vt\.tiktok\.com/i.test(url)) {
                result = await downloadTikTok(url)
            } else if (/youtu\.be|youtube\.com/i.test(url)) {
                result = await downloadYouTube(url)
            } else if (/twitter\.com|x\.com/i.test(url)) {
                result = await downloadTwitter(url)
            } else {
                result = await dl(url)
            }
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              return sendDownloaderError(res, err)
          }
     }
     
     async function pixiv(req, res) {
         try {
            let id = req.query.id
            let ext = req.query.ext
            let apikey = req.query.apikey
            if (!id) return res.status(400).send({ status: 400, message: 'id parameter cannot be empty', result: 'error' })
            if (!ext) return res.status(400).send({ status: 400, message: 'ext parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let hasil = await ch.pixivDl(id, ext)
            let data = await getBuffer(hasil)
              ensureDir(TMP_DIR)
              await fs.writeFileSync(path.join(TMP_DIR, 'image.jpg'), data)
              await res.sendFile(path.join(TMP_DIR, 'image.jpg'))
          } catch(err) {
              return sendDownloaderError(res, err)
          }
     }
     

module.exports = { 
   tiktok, 
   tiktok2,
   tiktoknowm, 
   youtube, 
   twitter, 
   twitter2, 
   zippyshare,
   xnxxdl,
   xnxxsearch,
   pindl, 
   mediafire,
   soundcloud,
   instagram,
   instagram2,
   instagram3,
   instastory,
   sfiledl,
   anonfiledl,
   stickerDl,
   telesticker,
   facebook,
   aiovideodl,
   pixiv
}
