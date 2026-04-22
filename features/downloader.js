const { getBuffer, shorts } = require('../lib/function')
const { dl } = require('../lib/aiovideodl')
const { cekKey, limitAdd, isLimit } = require('../database/db');
const { getInfo, fbdl } = require('../lib/downloader.js')
const { insta } = require('../lib/instagram.js')
const { ytv, yta } = require('../lib/ytdl')
const ch = require('../lib/scraper')
const scraper = require('@bochilteam/scraper')

const fs = require('fs')
const fetch = require('node-fetch')

__path = process.cwd()
     
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
            let result = await scraper.tiktokdl(url)
              res.status(200).json(result)
          } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
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
            let hasil = await ch.ttdownloader(url)
            let nowm = await shorts(hasil.nowm)
            let wm = await shorts(hasil.wm)
            let audio = await shorts(hasil.audio)
             res.status(200).json({ status: 200, result: { url_nowm: nowm, url_wm: wm, url_audio: audio }})
         } catch(err) {
             console.log(err)
             res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
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
            let hasil = await ch.ttdownloader(url)
            let data = await getBuffer(hasil.nowm)
             await fs.writeFileSync(__path +'/tmp/tiktok.mp4', data)
             await res.sendFile(__path +'/tmp/tiktok.mp4')
         } catch(err) {
             console.log(err)
             res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
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
            let yt1 = await yta(url)
            let yt2 = await ytv(url)
            let audioUrl = await shorts('https://velgrynd.herokuapp.com/api/toFile?url='+yt1.dl_link)
            let videoUrl = await shorts('https://velgrynd.herokuapp.com/api/toFile?url='+yt2.dl_link)
              res.json({ status: 200, result: { title: yt1.title, thumb: yt1.thumb, size_audio: yt1.filesizeF, size_video: yt2.filesizeF, audio_url: audioUrl, video_url: videoUrl }})
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
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
            let result = await getInfo(url)
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
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
            let result = await scraper.twitterdl(url)
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
          	console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
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
            let result = await ch.zippyshare(url)
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
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
            let result = await ch.pinterestdl(url)
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
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
            let result = await ch.mediafireDl(url)
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
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
            let result = await ch.scdl(url)
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
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
            let result = await insta(url)
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
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
            let result = await ch.igDownload(url)
              res.status(200).json(result)
          } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
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
            let result = await scraper.instagramdlv2(url)
              res.status(200).json(result)
          } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
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
            let result = await ch.igStory(username)
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
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
            let result = await ch.sfiledl(url)
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
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
            let result = await ch.anonfiledl(url)
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
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
            let result = await ch.stickerDl(url)
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
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
            let result = await ch.telesticker(url)
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
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
            let result = await fbdl(url)
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
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
            let result = await dl(url)
              res.status(200).json({ status: 200, result: result })
          } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
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
              await fs.writeFileSync(__path +'/tmp/image.jpg', data)
              await res.sendFile(__path +'/tmp/image.jpg')
          } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
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