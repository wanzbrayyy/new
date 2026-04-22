const ch = require('../lib/scraper')
const { getBuffer } = require('../lib/function')
const { cekKey, limitAdd, isLimit } = require('../database/db');
const { igProfile } = require('../lib/instagram.js')

const fs = require('fs')
const request = require('request')
const fetch = require('node-fetch')

__path = process.cwd()

function sendStalkError(res, err) {
    const status = err.status || err.response?.status || 500
    const message = err.message || 'An internal error occurred while fetching stalk data'
    console.log(err)
    return res.status(status).send({ status, message, result: 'error' })
}

     async function ghstalk(req, res) {
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
            let result = await ch.ghstalk(username)
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              return sendStalkError(res, err)
         }
     }
     
     async function igstalk(req, res) {
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
            let result = await igProfile(username)
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              return sendStalkError(res, err)
         }
     }
     
     async function wattpad(req, res) {
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
            let result = await ch.WattpadUser(username)
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              return sendStalkError(res, err)
         }
     }
     
     async function npminfo(req, res) {
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
            fetch(encodeURI(`https://registry.npmjs.org/${query}`))
           .then(response => response.json())
           .then(result => {
              res.status(200).json({ status: 200, result: result })
            })
         } catch(err) {
              return sendStalkError(res, err)
         }
     }
    
    
module.exports = { 
   ghstalk, 
   wattpad, 
   igstalk,
   npminfo
}
