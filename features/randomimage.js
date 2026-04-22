const { getBuffer, sleep } = require('../lib/function')
const { cekKey, limitAdd, isLimit } = require('../database/db');
const ch = require('../lib/scraper')

const fs = require('fs')
const axios = require('axios')
const fetch = require('node-fetch')

__path = process.cwd()
     
     async function husbu(req, res) {
         let apikey = req.query.apikey
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let waif = (await axios.get(`https://raw.githubusercontent.com/Arya-was/endak-tau/main/husbu.json`)).data
         let result = waif[Math.floor(Math.random() * (waif.length))]
         let data = await getBuffer(result)
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         await fs.writeFileSync(__path +'/tmp/husbu.png', data)
         await res.sendFile(__path +'/tmp/husbu.png')
     }
     
     async function loli(req, res) {
         let apikey = req.query.apikey
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let waif = (await axios.get(`https://raw.githubusercontent.com/Arya-was/endak-tau/main/loli.json`)).data
         let result = waif[Math.floor(Math.random() * (waif.length))]
         let data = await getBuffer(result)
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         await fs.writeFileSync(__path +'/tmp/loli.png', data)
         await res.sendFile(__path +'/tmp/loli.png')
     }
     
     async function milf(req, res) {
         let apikey = req.query.apikey
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let waif = (await axios.get(`https://raw.githubusercontent.com/Arya-was/endak-tau/main/milf.json`)).data
         let result = waif[Math.floor(Math.random() * (waif.length))]
         let data = await getBuffer(result)
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         await fs.writeFileSync(__path +'/tmp/milf.png', data)
         await res.sendFile(__path +'/tmp/milf.png')
     }
     
     async function cosplay(req, res) {
         let apikey = req.query.apikey
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let waif = (await axios.get(`https://raw.githubusercontent.com/Arya-was/endak-tau/main/cosplay.json`)).data
         let result = waif[Math.floor(Math.random() * (waif.length))]
         let data = await getBuffer(result)
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         await fs.writeFileSync(__path +'/tmp/cosplay.png', data)
         await res.sendFile(__path +'/tmp/cosplay.png')
     }
     
     async function randomimage(req, res) {
         let apikey = req.query.apikey
         let q = req.query.q
         if (!q) return res.status(400).send({ status: 400, message: 'q parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let result = await ch.akanekoApi(q)
         let data = await getBuffer(result)
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         await fs.writeFileSync(__path +'/tmp/image.png', data)
         await res.sendFile(__path +'/tmp/image.png')
     }
     
     async function waifu(req, res) {
         let apikey = req.query.apikey
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         fetch(encodeURI(`https://waifu.pics/api/sfw/waifu`))
         .then(response => response.json())
         .then(async data => {
             let result = data
             let buffer = await fetch(data.url)
             res.type('png')
             
             res.send(await buffer.buffer())
         }).catch(e => {
         console.log(e)
         res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
      })
     }
     
     async function neko(req, res) {
         let apikey = req.query.apikey
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         fetch(encodeURI(`https://waifu.pics/api/sfw/neko`))
         .then(response => response.json())
         .then(async data => {
             let result = data
             let buffer = await fetch(data.url)
             res.type('png')
             res.send(await buffer.buffer())
         }).catch(e => {
         console.log(e)
         res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
      })
     }
     
     async function shinobu(req, res) {
         let apikey = req.query.apikey
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         fetch(encodeURI(`https://waifu.pics/api/sfw/shinobu`))
         .then(response => response.json())
         .then(async data => {
             let result = data
             let buffer = await fetch(data.url)
             res.type('png')
             res.send(await buffer.buffer())
         }).catch(e => {
         console.log(e)
         res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
      })
     }
     
     async function megumin(req, res) {
         let apikey = req.query.apikey
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         fetch(encodeURI(`https://waifu.pics/api/sfw/megumin`))
         .then(response => response.json())
         .then(async data => {
             let result = data
             let buffer = await fetch(data.url)
             res.type('png')
             res.send(await buffer.buffer())
         }).catch(e => {
         console.log(e)
         res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
      })
     }
     
     async function bully(req, res) {
         let apikey = req.query.apikey
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         fetch(encodeURI(`https://waifu.pics/api/sfw/bully`))
         .then(response => response.json())
         .then(async data => {
             let result = data
             let buffer = await fetch(data.url)
             res.type('png')
             res.send(await buffer.buffer())
         }).catch(e => {
         console.log(e)
         res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
      })
     }
     
     async function cuddle(req, res) {
         let apikey = req.query.apikey
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         fetch(encodeURI(`https://waifu.pics/api/sfw/cuddle`))
         .then(response => response.json())
         .then(async data => {
             let result = data
             let buffer = await fetch(data.url)
             res.type('png')
             res.send(await buffer.buffer())
         }).catch(e => {
         console.log(e)
         res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
      })
     }
     
     async function cry(req, res) {
         let apikey = req.query.apikey
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         fetch(encodeURI(`https://waifu.pics/api/sfw/cry`))
         .then(response => response.json())
         .then(async data => {
             let result = data
             let buffer = await fetch(data.url)
             res.type('png')
             res.send(await buffer.buffer())
         }).catch(e => {
         console.log(e)
         res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
      })
     }
     
     async function hug(req, res) {
         let apikey = req.query.apikey
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         fetch(encodeURI(`https://waifu.pics/api/sfw/hug`))
         .then(response => response.json())
         .then(async data => {
             let result = data
             let buffer = await fetch(data.url)
             res.type('png')
             res.send(await buffer.buffer())
         }).catch(e => {
         console.log(e)
         res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
      })
     }
     
     async function awoo(req, res) {
         let apikey = req.query.apikey
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         fetch(encodeURI(`https://waifu.pics/api/sfw/awoo`))
         .then(response => response.json())
         .then(async data => {
             let result = data
             let buffer = await fetch(data.url)
             res.type('png')
             res.send(await buffer.buffer())
         }).catch(e => {
         console.log(e)
         res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
      })
     }
     
     async function kiss(req, res) {
         let apikey = req.query.apikey
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         fetch(encodeURI(`https://waifu.pics/api/sfw/kiss`))
         .then(response => response.json())
         .then(async data => {
             let result = data
             let buffer = await fetch(data.url)
             res.type('png')
             res.send(await buffer.buffer())
         }).catch(e => {
         console.log(e)
         res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
      })
     }
     
     async function lick(req, res) {
         let apikey = req.query.apikey
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         fetch(encodeURI(`https://waifu.pics/api/sfw/lick`))
         .then(response => response.json())
         .then(async data => {
             let result = data
             let buffer = await fetch(data.url)
             res.type('png')
             res.send(await buffer.buffer())
         }).catch(e => {
         console.log(e)
         res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
      })
     }
     
     async function slap(req, res) {
         let apikey = req.query.apikey
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         fetch(encodeURI(`https://waifu.pics/api/sfw/slap`))
         .then(response => response.json())
         .then(async data => {
             let result = data
             let buffer = await fetch(data.url)
             res.type('png')
             res.send(await buffer.buffer())
         }).catch(e => {
         console.log(e)
         res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
      })
     }
   
module.exports = { 
   husbu, 
   loli, 
   milf,
   cosplay, 
   randomimage, 
   waifu, 
   neko, 
   shinobu,
   megumin,
   bully,
   cuddle,
   cry,
   hug,
   awoo,
   kiss,
   lick,
   slap
}