const { cekKey, limitAdd, isLimit } = require('../database/db');
const ch = require('../lib/scraper')

const fs = require('fs')
let knights = null
try {
    knights = require('knights-canvas')
} catch (error) {
    console.warn('[WARN] Primbon image feature disabled:', error.message)
}
const { Primbon } = require('scrape-primbon')
const primbon = new Primbon()

__path = process.cwd()

     async function artinama(req, res) {
         try {
            let name = req.query.name
            let apikey = req.query.apikey
            if (!name) return res.status(400).send({ status: 400, message: 'name parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await ch.artinama(name)
              res.status(200).json({ status: 200, result: result })
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function artimimpi(req, res) {
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
            let result = await ch.artimimpi(query)
              res.status(200).json(result)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function ramaljodoh(req, res) {
         try {
            let name = req.query.name
            let apikey = req.query.apikey
            let pasangan = req.query.pasangan
            if (!name) return res.status(400).send({ status: 400, message: 'name parameter cannot be empty', result: 'error' })
            if (!pasangan) return res.status(400).send({ status: 400, message: 'pasangan parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let hasil = await ch.ramalanJodoh(name, pasangan)
              res.status(200).json(hasil)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function nomorhoki(req, res) {
         try {
            let no = req.query.no
            let apikey = req.query.apikey
            if (!no) return res.status(400).send({ status: 400, message: 'no parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await primbon.nomer_hoki(no)
              res.status(200).json(result)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function zodiak(req, res) {
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
            let result = await primbon.zodiak(query)
              res.status(200).json(result)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function kecocokan_nama(req, res) {
         try {
            let name = req.query.name
            let tanggal = req.query.tanggal
            let bulan = req.query.bulan
            let tahun = req.query.tahun
            let apikey = req.query.apikey
            if (!name) return res.status(400).send({ status: 400, message: 'name parameter cannot be empty', result: 'error' })
            if (!tanggal) return res.status(400).send({ status: 400, message: 'tanggal parameter cannot be empty', result: 'error' })
            if (!bulan) return res.status(400).send({ status: 400, message: 'bulan parameter cannot be empty', result: 'error' })
            if (!tahun) return res.status(400).send({ status: 400, message: 'tahun parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await primbon.kecocokan_nama(name, tanggal, bulan, tahun)
              res.status(200).json(result)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function kecocokan_nama_pasangan(req, res) {
         try {
            let name = req.query.name
            let pasangan = req.query.pasangan
            let apikey = req.query.apikey
            if (!name) return res.status(400).send({ status: 400, message: 'name parameter cannot be empty', result: 'error' })
            if (!pasangan) return res.status(400).send({ status: 400, message: 'pasangan parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await primbon.kecocokan_nama(name, pasangan)
              res.status(200).json(result)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function tanggal_jadian_pernikahan(req, res) {
         try {
            let tanggal = req.query.tanggal
            let bulan = req.query.bulan
            let tahun = req.query.tahun
            let apikey = req.query.apikey
            if (!tanggal) return res.status(400).send({ status: 400, message: 'tanggal parameter cannot be empty', result: 'error' })
            if (!bulan) return res.status(400).send({ status: 400, message: 'bulan parameter cannot be empty', result: 'error' })
            if (!tahun) return res.status(400).send({ status: 400, message: 'tahun parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await primbon.tanggal_jadian_pernikahan(tanggal, bulan, tahun)
              res.status(200).json(result)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function sifat_usaha_bisnis(req, res) {
         try {
            let tanggal = req.query.tanggal
            let bulan = req.query.bulan
            let tahun = req.query.tahun
            let apikey = req.query.apikey
            if (!tanggal) return res.status(400).send({ status: 400, message: 'tanggal parameter cannot be empty', result: 'error' })
            if (!bulan) return res.status(400).send({ status: 400, message: 'bulan parameter cannot be empty', result: 'error' })
            if (!tahun) return res.status(400).send({ status: 400, message: 'tahun parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await primbon.sifat_usaha_bisnis(tanggal, bulan, tahun)
              res.status(200).json(result)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function rejeki_hoki_weton(req, res) {
         try {
            let tanggal = req.query.tanggal
            let bulan = req.query.bulan
            let tahun = req.query.tahun
            let apikey = req.query.apikey
            if (!tanggal) return res.status(400).send({ status: 400, message: 'tanggal parameter cannot be empty', result: 'error' })
            if (!bulan) return res.status(400).send({ status: 400, message: 'bulan parameter cannot be empty', result: 'error' })
            if (!tahun) return res.status(400).send({ status: 400, message: 'tahun parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await primbon.rejeki_hoki_weton(tanggal, bulan, tahun)
              res.status(200).json(result)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function pekerjaan_weton_lahir(req, res) {
         try {
            let tanggal = req.query.tanggal
            let bulan = req.query.bulan
            let tahun = req.query.tahun
            let apikey = req.query.apikey
            if (!tanggal) return res.status(400).send({ status: 400, message: 'tanggal parameter cannot be empty', result: 'error' })
            if (!bulan) return res.status(400).send({ status: 400, message: 'bulan parameter cannot be empty', result: 'error' })
            if (!tahun) return res.status(400).send({ status: 400, message: 'tahun parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await primbon.pekerjaan_weton_lahir(tanggal, bulan, tahun)
              res.status(200).json(result)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function ramalan_nasib(req, res) {
         try {
            let tanggal = req.query.tanggal
            let bulan = req.query.bulan
            let tahun = req.query.tahun
            let apikey = req.query.apikey
            if (!tanggal) return res.status(400).send({ status: 400, message: 'tanggal parameter cannot be empty', result: 'error' })
            if (!bulan) return res.status(400).send({ status: 400, message: 'bulan parameter cannot be empty', result: 'error' })
            if (!tahun) return res.status(400).send({ status: 400, message: 'tahun parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await primbon.ramalan_nasib(tanggal, bulan, tahun)
              res.status(200).json(result)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function cek_potensi_penyakit(req, res) {
         try {
            let tanggal = req.query.tanggal
            let bulan = req.query.bulan
            let tahun = req.query.tahun
            let apikey = req.query.apikey
            if (!tanggal) return res.status(400).send({ status: 400, message: 'tanggal parameter cannot be empty', result: 'error' })
            if (!bulan) return res.status(400).send({ status: 400, message: 'bulan parameter cannot be empty', result: 'error' })
            if (!tahun) return res.status(400).send({ status: 400, message: 'tahun parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await primbon.cek_potensi_penyakit(tanggal, bulan, tahun)
              res.status(200).json(result)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function arti_kartu_tarot(req, res) {
         try {
            let tanggal = req.query.tanggal
            let bulan = req.query.bulan
            let tahun = req.query.tahun
            let apikey = req.query.apikey
            if (!tanggal) return res.status(400).send({ status: 400, message: 'tanggal parameter cannot be empty', result: 'error' })
            if (!bulan) return res.status(400).send({ status: 400, message: 'bulan parameter cannot be empty', result: 'error' })
            if (!tahun) return res.status(400).send({ status: 400, message: 'tahun parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await primbon.arti_kartu_tarot(tanggal, bulan, tahun)
              res.status(200).json(result)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function petung_hari_baik(req, res) {
         try {
            let tanggal = req.query.tanggal
            let bulan = req.query.bulan
            let tahun = req.query.tahun
            let apikey = req.query.apikey
            if (!tanggal) return res.status(400).send({ status: 400, message: 'tanggal parameter cannot be empty', result: 'error' })
            if (!bulan) return res.status(400).send({ status: 400, message: 'bulan parameter cannot be empty', result: 'error' })
            if (!tahun) return res.status(400).send({ status: 400, message: 'tahun parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await primbon.petung_hari_baik(tanggal, bulan, tahun)
              res.status(200).json(result)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function hari_sangar_taliwangke(req, res) {
         try {
            let tanggal = req.query.tanggal
            let bulan = req.query.bulan
            let tahun = req.query.tahun
            let apikey = req.query.apikey
            if (!tanggal) return res.status(400).send({ status: 400, message: 'tanggal parameter cannot be empty', result: 'error' })
            if (!bulan) return res.status(400).send({ status: 400, message: 'bulan parameter cannot be empty', result: 'error' })
            if (!tahun) return res.status(400).send({ status: 400, message: 'tahun parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await primbon.hari_sangar_taliwangke(tanggal, bulan, tahun)
              res.status(200).json(result)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function primbon_hari_naas(req, res) {
         try {
            let tanggal = req.query.tanggal
            let bulan = req.query.bulan
            let tahun = req.query.tahun
            let apikey = req.query.apikey
            if (!tanggal) return res.status(400).send({ status: 400, message: 'tanggal parameter cannot be empty', result: 'error' })
            if (!bulan) return res.status(400).send({ status: 400, message: 'bulan parameter cannot be empty', result: 'error' })
            if (!tahun) return res.status(400).send({ status: 400, message: 'tahun parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await primbon.primbon_hari_naas(tanggal, bulan, tahun)
              res.status(200).json(result)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function rahasia_naga_hari(req, res) {
         try {
            let tanggal = req.query.tanggal
            let bulan = req.query.bulan
            let tahun = req.query.tahun
            let apikey = req.query.apikey
            if (!tanggal) return res.status(400).send({ status: 400, message: 'tanggal parameter cannot be empty', result: 'error' })
            if (!bulan) return res.status(400).send({ status: 400, message: 'bulan parameter cannot be empty', result: 'error' })
            if (!tahun) return res.status(400).send({ status: 400, message: 'tahun parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await primbon.rahasia_naga_hari(tanggal, bulan, tahun)
              res.status(200).json(result)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function primbon_arah_rejeki(req, res) {
         try {
            let tanggal = req.query.tanggal
            let bulan = req.query.bulan
            let tahun = req.query.tahun
            let apikey = req.query.apikey
            if (!tanggal) return res.status(400).send({ status: 400, message: 'tanggal parameter cannot be empty', result: 'error' })
            if (!bulan) return res.status(400).send({ status: 400, message: 'bulan parameter cannot be empty', result: 'error' })
            if (!tahun) return res.status(400).send({ status: 400, message: 'tahun parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await primbon.primbon_arah_rejeki(tanggal, bulan, tahun)
              res.status(200).json(result)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function ramalan_peruntungan(req, res) {
         try {
            let tanggal = req.query.tanggal
            let bulan = req.query.bulan
            let tahun = req.query.tahun
            let apikey = req.query.apikey
            if (!tanggal) return res.status(400).send({ status: 400, message: 'tanggal parameter cannot be empty', result: 'error' })
            if (!bulan) return res.status(400).send({ status: 400, message: 'bulan parameter cannot be empty', result: 'error' })
            if (!tahun) return res.status(400).send({ status: 400, message: 'tahun parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await primbon.ramalan_peruntungan(tanggal, bulan, tahun)
              res.status(200).json(result)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function weton_jawa(req, res) {
         try {
            let tanggal = req.query.tanggal
            let bulan = req.query.bulan
            let tahun = req.query.tahun
            let apikey = req.query.apikey
            if (!tanggal) return res.status(400).send({ status: 400, message: 'tanggal parameter cannot be empty', result: 'error' })
            if (!bulan) return res.status(400).send({ status: 400, message: 'bulan parameter cannot be empty', result: 'error' })
            if (!tahun) return res.status(400).send({ status: 400, message: 'tahun parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await primbon.weton_jawa(tanggal, bulan, tahun)
              res.status(200).json(result)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function sifat_karakter_tanggal_lahir(req, res) {
         try {
            let name = req.query.name
            let tanggal = req.query.tanggal
            let bulan = req.query.bulan
            let tahun = req.query.tahun
            let apikey = req.query.apikey
            if (!name) return res.status(400).send({ status: 400, message: 'name parameter cannot be empty', result: 'error' })
            if (!tanggal) return res.status(400).send({ status: 400, message: 'tanggal parameter cannot be empty', result: 'error' })
            if (!bulan) return res.status(400).send({ status: 400, message: 'bulan parameter cannot be empty', result: 'error' })
            if (!tahun) return res.status(400).send({ status: 400, message: 'tahun parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await primbon.sifat_karakter_tanggal_lahir(name, tanggal, bulan, tahun)
              res.status(200).json(result)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function potensi_keberuntungan(req, res) {
         try {
            let name = req.query.name
            let tanggal = req.query.tanggal
            let bulan = req.query.bulan
            let tahun = req.query.tahun
            let apikey = req.query.apikey
            if (!name) return res.status(400).send({ status: 400, message: 'name parameter cannot be empty', result: 'error' })
            if (!tanggal) return res.status(400).send({ status: 400, message: 'tanggal parameter cannot be empty', result: 'error' })
            if (!bulan) return res.status(400).send({ status: 400, message: 'bulan parameter cannot be empty', result: 'error' })
            if (!tahun) return res.status(400).send({ status: 400, message: 'tahun parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await primbon.potensi_keberuntungan(name, tanggal, bulan, tahun)
              res.status(200).json(result)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function primbon_memancing_ikan(req, res) {
         try {
            let tanggal = req.query.tanggal
            let bulan = req.query.bulan
            let tahun = req.query.tahun
            let apikey = req.query.apikey
            if (!tanggal) return res.status(400).send({ status: 400, message: 'tanggal parameter cannot be empty', result: 'error' })
            if (!bulan) return res.status(400).send({ status: 400, message: 'bulan parameter cannot be empty', result: 'error' })
            if (!tahun) return res.status(400).send({ status: 400, message: 'tahun parameter cannot be empty', result: 'error' })
            if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
            let check = await cekKey(apikey)
            if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
            let limit = await isLimit(apikey);
            if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
            limitAdd(apikey);
            let result = await primbon.primbon_memancing_ikan(tanggal, bulan, tahun)
              res.status(200).json(result)
         } catch(err) {
              console.log(err)
              res.status(500).send({ status: 500, message: 'An internal error occurred. Please report via telegram at https://t.me/maverick_dark or wa.me/6288801074059', result: 'error' })
         }
     }
     
     async function seberapagay(req, res) {
         if (!knights) return res.status(500).send({ status: 500, message: 'Feature temporarily unavailable because optional image dependency is missing.', result: 'error' })
         let apikey = req.query.apikey
         if (!req.query.image) return res.status(400).send({ status: 400, message: 'image parameter cannot be empty', result: 'error' })
         if (!req.query.name) return res.status(400).send({ status: 400, message: 'name parameter cannot be empty', result: 'error' })
         if (!req.query.num) return res.status(400).send({ status: 400, message: 'num parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let image = await new knights.Gay()
            .setName(req.query.name)
            .setAvatar(req.query.image)
            .setNum(req.query.num)
            .toAttachment()
            let data = image.toBuffer()
            await fs.writeFileSync(__path +'/tmp/sgay.png', data)
            await res.sendFile(__path+'/tmp/sgay.png')
     }
  
module.exports = { 
   artinama, 
   artimimpi, 
   ramaljodoh,
   nomorhoki,
   zodiak,
   kecocokan_nama,
   kecocokan_nama_pasangan,
   tanggal_jadian_pernikahan,
   sifat_usaha_bisnis,
   rejeki_hoki_weton,
   pekerjaan_weton_lahir,
   ramalan_nasib,
   cek_potensi_penyakit,
   arti_kartu_tarot,
   petung_hari_baik,
   hari_sangar_taliwangke,
   primbon_hari_naas,
   rahasia_naga_hari,
   primbon_arah_rejeki,
   ramalan_peruntungan,
   weton_jawa,
   sifat_karakter_tanggal_lahir,
   potensi_keberuntungan,
   primbon_memancing_ikan,
   seberapagay
}
