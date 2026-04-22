const { cekKey, limitAdd, isLimit } = require('../database/db');
const { sleep } = require('../lib/function')

let knights = null
try {
    knights = require("knights-canvas")
} catch (error) {
    console.warn('[WARN] knights-canvas disabled:', error.message)
}
let DIG = null
try {
    DIG = require('discord-image-generation')
} catch (error) {
    console.warn('[WARN] discord-image-generation disabled:', error.message)
}
let Caxinha = null
try {
    Caxinha = require('caxinha')
} catch (error) {
    console.warn('[WARN] caxinha disabled:', error.message)
}
let removebg = null
try {
    removebg = require('removebg-id')
} catch (error) {
    console.warn('[WARN] removebg-id disabled:', error.message)
}
let yuricanvas = null
try {
    yuricanvas = require("yuri-canvas")
} catch (error) {
    console.warn('[WARN] yuri-canvas disabled:', error.message)
}
const fs = require('fs')
const path = require('path')

__path = process.cwd()
const TMP_DIR = path.join(__path, 'tmp')

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
}

function ensureCaxinha() {
    if (!Caxinha?.canvas) {
        const err = new Error('Creator effect source for this endpoint is unavailable on this server')
        err.status = 503
        throw err
    }
    return Caxinha
}

function ensureKnights() {
    if (!knights) {
        const err = new Error('Creator image engine is unavailable on this server')
        err.status = 503
        throw err
    }
    return knights
}

function ensureDIG() {
    if (!DIG) {
        const err = new Error('Discord image generation engine is unavailable on this server')
        err.status = 503
        throw err
    }
    return DIG
}

function ensureRemoveBg() {
    if (!removebg) {
        const err = new Error('Remove background engine is unavailable on this server')
        err.status = 503
        throw err
    }
    return removebg
}

function ensureYuriCanvas() {
    if (!yuricanvas) {
        const err = new Error('Creator text canvas engine is unavailable on this server')
        err.status = 503
        throw err
    }
    return yuricanvas
}

function sendCreatorError(res, err) {
    const status = err.status || err.response?.status || 500
    const message = err.message || 'An internal error occurred while generating creator asset'
    console.log(err)
    return res.status(status).send({ status, message, result: 'error' })
}

     async function welcome(req, res) {
         let apikey = req.query.apikey
         if (!req.query.picurl) return res.status(400).send({ status: 400, message: 'picurl parameter cannot be empty', result: 'error' })
         if (!req.query.name) return res.status(400).send({ status: 400, message: 'name parameter cannot be empty', result: 'error' })
         if (!req.query.bgurl) return res.status(400).send({ status: 400, message: 'bgurl parameter cannot be empty', result: 'error' })
         if (!req.query.gcname) return res.status(400).send({ status: 400, message: 'gcname parameter cannot be empty', result: 'error' })
         if (!req.query.mem) return res.status(400).send({ status: 400, message: 'mem parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let image = await new knights.Welcome2()
            .setAvatar(req.query.picurl)
            .setUsername(req.query.name)
            .setBg(req.query.bgurl)
            .setGroupname(req.query.gcname)
            .setMember(req.query.mem)
            .toAttachment();
            let data = image.toBuffer()
            await fs.writeFileSync(__path +'/tmp/welcome.png', data)
            await res.sendFile(__path+'/tmp/welcome.png')
            await sleep(3000)
            await fs.unlinkSync(__path + '/tmp/welcome.png')
     }
     
     async function welcome2(req, res) {
         let apikey = req.query.apikey
         if (!req.query.name) return res.status(400).send({ status: 400, message: 'name parameter cannot be empty', result: 'error' })
         if (!req.query.mem) return res.status(400).send({ status: 400, message: 'mem parameter cannot be empty', result: 'error' })
         if (!req.query.gcname) return res.status(400).send({ status: 400, message: 'gcname parameter cannot be empty', result: 'error' })
         if (!req.query.picurl) return res.status(400).send({ status: 400, message: 'picurl parameter cannot be empty', result: 'error' })
         if (!req.query.bgurl) return res.status(400).send({ status: 400, message: 'bgurl parameter cannot be empty', result: 'error' })
         if (!req.query.gcicon) return res.status(400).send({ status: 400, message: 'bgurl parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let image = await new knights.Welcome()
            .setUsername(req.query.name)
            .setGuildName(req.query.gcname)
            .setGuildIcon(req.query.gcicon)
            .setMemberCount(req.query.mem)
            .setAvatar(req.query.picurl)
            .setBackground(req.query.bgurl)
            .toAttachment();
            let data = image.toBuffer()
            await fs.writeFileSync(__path +'/tmp/welcome2.png', data)
            await res.sendFile(__path+'/tmp/welcome2.png')
            await sleep(3000)
            await fs.unlinkSync(__path + '/tmp/welcome2.png')
     }
     
     async function goodbye(req, res) {
         let apikey = req.query.apikey
         if (!req.query.picurl) return res.status(400).send({ status: 400, message: 'picurl parameter cannot be empty', result: 'error' })
         if (!req.query.name) return res.status(400).send({ status: 400, message: 'name parameter cannot be empty', result: 'error' })
         if (!req.query.bgurl) return res.status(400).send({ status: 400, message: 'bgurl parameter cannot be empty', result: 'error' })
         if (!req.query.mem) return res.status(400).send({ status: 400, message: 'mem parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let image = await new knights.Goodbye2()
            .setAvatar(req.query.picurl)
            .setUsername(req.query.name)
            .setBg(req.query.bgurl)
            .setMember(req.query.mem)
            .toAttachment();
            let data = image.toBuffer()
            await fs.writeFileSync(__path +'/tmp/goodbye.png', data)
            await res.sendFile(__path+'/tmp/goodbye.png')
            await sleep(3000)
            await fs.unlinkSync(__path + '/tmp/goodbye.png')
     }
     
     async function goodbye2(req, res) {
         let apikey = req.query.apikey
         if (!req.query.name) return res.status(400).send({ status: 400, message: 'name parameter cannot be empty', result: 'error' })
         if (!req.query.mem) return res.status(400).send({ status: 400, message: 'mem parameter cannot be empty', result: 'error' })
         if (!req.query.gcname) return res.status(400).send({ status: 400, message: 'gcname parameter cannot be empty', result: 'error' })
         if (!req.query.picurl) return res.status(400).send({ status: 400, message: 'picurl parameter cannot be empty', result: 'error' })
         if (!req.query.bgurl) return res.status(400).send({ status: 400, message: 'bgurl parameter cannot be empty', result: 'error' })
         if (!req.query.gcicon) return res.status(400).send({ status: 400, message: 'bgurl parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let image = await new knights.Goodbye()
            .setUsername(req.query.name)
            .setGuildName(req.query.gcname)
            .setGuildIcon(req.query.gcicon)
            .setMemberCount(req.query.mem)
            .setAvatar(req.query.picurl)
            .setBackground(req.query.bgurl)
            .toAttachment();
            let data = image.toBuffer()
            await fs.writeFileSync(__path +'/tmp/goodbye2.png', data)
            await res.sendFile(__path+'/tmp/goodbye2.png')
            await sleep(3000)
            await fs.unlinkSync(__path + '/tmp/goodbye2.png')
     }
     
     async function promote(req, res) {
         let apikey = req.query.apikey
         if (!req.query.name) return res.status(400).send({ status: 400, message: 'name parameter cannot be empty', result: 'error' })
         if (!req.query.mem) return res.status(400).send({ status: 400, message: 'mem parameter cannot be empty', result: 'error' })
         if (!req.query.msg) return res.status(400).send({ status: 400, message: 'msg parameter cannot be empty', result: 'error' })
         if (!req.query.picurl) return res.status(400).send({ status: 400, message: 'picurl parameter cannot be empty', result: 'error' })
         if (!req.query.bgurl) return res.status(400).send({ status: 400, message: 'bgurl parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let canvas = require('discanvas')
         var welcomer = await new canvas.Welcome()
            .setAvatar(req.query.picurl)
            .setUsername(`${req.query.name}#${req.query.mem}`)
            .setBackground("BACKGROUND", req.query.bgurl)
            .setMainText("Promote")
            .setSecondText(req.query.msg)
            .toWelcome() 
            let data = welcomer.toBuffer()
            await fs.writeFileSync(__path +'/tmp/promote.png', data)
            await res.sendFile(__path+'/tmp/promote.png')
            await sleep(3000)
            await fs.unlinkSync(__path + '/tmp/promote.png')
     }
     
     async function demote(req, res) {
         let apikey = req.query.apikey
         if (!req.query.name) return res.status(400).send({ status: 400, message: 'name parameter cannot be empty', result: 'error' })
         if (!req.query.mem) return res.status(400).send({ status: 400, message: 'mem parameter cannot be empty', result: 'error' })
         if (!req.query.msg) return res.status(400).send({ status: 400, message: 'msg parameter cannot be empty', result: 'error' })
         if (!req.query.picurl) return res.status(400).send({ status: 400, message: 'picurl parameter cannot be empty', result: 'error' })
         if (!req.query.bgurl) return res.status(400).send({ status: 400, message: 'bgurl parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let canvas = require('discanvas')
         var welcomer = await new canvas.Welcome()
            .setAvatar(req.query.picurl)
            .setUsername(`${req.query.name}#${req.query.mem}`)
            .setBackground("BACKGROUND", req.query.bgurl)
            .setMainText("Demote")
            .setSecondText(req.query.msg)
            .toWelcome() 
            let data = welcomer.toBuffer()
            await fs.writeFileSync(__path +'/tmp/demote.png', data)
            await res.sendFile(__path+'/tmp/demote.png')
            await sleep(3000)
            await fs.unlinkSync(__path + '/tmp/demote.png')
     }
     
     async function rankcard(req, res) {
         let apikey = req.query.apikey
         if (!req.query.name) return res.status(400).send({ status: 400, message: 'name parameter cannot be empty', result: 'error' })
         if (!req.query.currentxp) return res.status(400).send({ status: 400, message: 'currentxp parameter cannot be empty', result: 'error' })
         if (!req.query.requiredxp) return res.status(400).send({ status: 400, message: 'requiredxp parameter cannot be empty', result: 'error' })
         if (!req.query.level) return res.status(400).send({ status: 400, message: 'level parameter cannot be empty', result: 'error' })
         if (!req.query.picurl) return res.status(400).send({ status: 400, message: 'picurl parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let image = await new knights.Rank()
            .setAvatar(req.query.picurl)
            .setUsername(req.query.name) 
            .setBg(req.query.bgurl)
            .setNeedxp(req.query.requiredxp) 
            .setCurrxp(req.query.currentxp) 
            .setLevel(req.query.level) 
            .setRank("https://i.ibb.co/Wn9cvnv/FABLED.png") 
            .toAttachment()
            let data = image.toBuffer()
            await fs.writeFileSync(__path +'/tmp/card.png', data)
            await res.sendFile(__path+'/tmp/card.png')
            await sleep(3000)
            await fs.unlinkSync(__path + '/tmp/card.png')
     }
     
     async function levelup(req, res) {
         let apikey = req.query.apikey
         if (!req.query.picurl) return res.status(400).send({ status: 400, message: 'picurl parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let image = await new knights.Up()
            .setAvatar(req.query.picurl) 
            .toAttachment()
            let data = image.toBuffer()
            await fs.writeFileSync(__path +'/tmp/level.png', data)
            await res.sendFile(__path+'/tmp/level.png')
            await sleep(3000)
            await fs.unlinkSync(__path + '/tmp/level.png')
     }
     
     async function gfx(req, res) {
         let apikey = req.query.apikey
         if (!req.query.name) return res.status(400).send({ status: 400, message: 'name parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let image = await new knights.Gfx1()
            .setName(req.query.name) 
            .toAttachment()
            let data = image.toBuffer()
            await fs.writeFileSync(__path +'/tmp/gfx.png', data)
            await res.sendFile(__path+'/tmp/gfx.png')
     }
     
     async function gfx2(req, res) {
         let apikey = req.query.apikey
         if (!req.query.name) return res.status(400).send({ status: 400, message: 'name parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let image = await new knights.Gfx2()
            .setName(req.query.name) 
            .toAttachment()
            let data = image.toBuffer()
            await fs.writeFileSync(__path +'/tmp/gfx.png', data)
            await res.sendFile(__path+'/tmp/gfx.png')
     }
     
     async function gfx3(req, res) {
         try {
             let apikey = req.query.apikey
             if (!req.query.text) return res.status(400).send({ status: 400, message: 'text parameter cannot be empty', result: 'error' })
             if (!req.query.text2) return res.status(400).send({ status: 400, message: 'text2 parameter cannot be empty', result: 'error' })
             if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
             let check = await cekKey(apikey)
             if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
             let limit = await isLimit(apikey);
             if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
             limitAdd(apikey);
             let image = await new knights.Gfx3()
                .setName(req.query.text)
                .setName2(req.query.text2)
                .toAttachment()
                let data = image.toBuffer()
                ensureDir(TMP_DIR)
                await fs.writeFileSync(path.join(TMP_DIR, 'gfx.png'), data)
                await res.sendFile(path.join(TMP_DIR, 'gfx.png'))
         } catch (err) {
             return sendCreatorError(res, err)
         }
     }
     
     async function gfx4(req, res) {
         try {
             let apikey = req.query.apikey
             if (!req.query.text) return res.status(400).send({ status: 400, message: 'text parameter cannot be empty', result: 'error' })
             if (!req.query.text2) return res.status(400).send({ status: 400, message: 'text2 parameter cannot be empty', result: 'error' })
             if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
             let check = await cekKey(apikey)
             if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
             let limit = await isLimit(apikey);
             if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
             limitAdd(apikey);
             let image = await new knights.Gfx4()
                .setName(req.query.text)
                .setName2(req.query.text2)
                .toAttachment()
                let data = image.toBuffer()
                ensureDir(TMP_DIR)
                await fs.writeFileSync(path.join(TMP_DIR, 'gfx.png'), data)
                await res.sendFile(path.join(TMP_DIR, 'gfx.png'))
         } catch (err) {
             return sendCreatorError(res, err)
         }
     }
     
     async function gfx5(req, res) {
         let apikey = req.query.apikey
         if (!req.query.text) return res.status(400).send({ status: 400, message: 'text parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let image = await new knights.Gfx5()
            .setText(req.query.text) 
            .toAttachment()
            let data = image.toBuffer()
            await fs.writeFileSync(__path +'/tmp/gfx.png', data)
            await res.sendFile(__path+'/tmp/gfx.png')
     }
     
     async function gura(req, res) {
         let apikey = req.query.apikey
         if (!req.query.name) return res.status(400).send({ status: 400, message: 'name parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let image = await new knights.Gura()
            .setName(req.query.name) 
            .toAttachment()
            let data = image.toBuffer()
            await fs.writeFileSync(__path +'/tmp/gfx.png', data)
            await res.sendFile(__path+'/tmp/gfx.png')
     }
     
     async function burn(req, res) {
         let apikey = req.query.apikey
         if (!req.query.url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let image = await new knights.Burn()
            .setAvatar(req.query.url) 
            .toAttachment()
            let data = image.toBuffer()
            await fs.writeFileSync(__path +'/tmp/burn.png', data)
            await res.sendFile(__path+'/tmp/burn.png')
            await sleep(3000)
            await fs.unlinkSync(__path + '/tmp/burn.png')
     }
     
     async function spongebob(req, res) {
         let apikey = req.query.apikey
         if (!req.query.url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let image = await new knights.Spo()
            .setAvatar(req.query.url) 
            .toAttachment()
            let data = image.toBuffer()
            await fs.writeFileSync(__path +'/tmp/spo.png', data)
            await res.sendFile(__path+'/tmp/spo.png')
            await sleep(3000)
            await fs.unlinkSync(__path + '/tmp/spo.png')
     }
     
     async function patrick(req, res) {
         let apikey = req.query.apikey
         if (!req.query.url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let image = await new knights.Patrick()
            .setAvatar(req.query.url) 
            .toAttachment()
            let data = image.toBuffer()
            await fs.writeFileSync(__path +'/tmp/pat.png', data)
            await res.sendFile(__path+'/tmp/pat.png')
            await sleep(3000)
            await fs.unlinkSync(__path + '/tmp/pat.png')
     }
     
     async function hornycard(req, res) {
         let apikey = req.query.apikey
         if (!req.query.url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let image = await new knights.Horny()
            .setAvatar(req.query.url) 
            .toBuild()
            let data = image.toBuffer()
            await fs.writeFileSync(__path +'/tmp/horny.png', data)
            await res.sendFile(__path+'/tmp/horny.png')
            await sleep(3000)
            await fs.unlinkSync(__path + '/tmp/horny.png')
     }
     
     async function xnxx(req, res) {
         let apikey = req.query.apikey
         if (!req.query.name) return res.status(400).send({ status: 400, message: 'name parameter cannot be empty', result: 'error' })
         if (!req.query.url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let image = await new knights.Xnxx()
            .setImage(req.query.url) 
            .setTitle(req.query.name)
            .toAttachment()
            let data = image.toBuffer()
            await fs.writeFileSync(__path +'/tmp/xnxx.png', data)
            await res.sendFile(__path+'/tmp/xnxx.png')
            await sleep(3000)
            await fs.unlinkSync(__path + '/tmp/xnxx.png')
     }
     
     async function jojo(req, res) {
         let apikey = req.query.apikey
         if (!req.query.url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let image = await new knights.Jo()
            .setImage(req.query.url) 
            .toBuild()
            let data = image.toBuffer()
            await fs.writeFileSync(__path +'/tmp/jojo.png', data)
            await res.sendFile(__path+'/tmp/jojo.png')
            await sleep(3000)
            await fs.unlinkSync(__path + '/tmp/jojo.png')
     }
     
     async function bonk(req, res) {
         let apikey = req.query.apikey
         if (!req.query.url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
         if (!req.query.url2) return res.status(400).send({ status: 400, message: 'url2 parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let image = await new knights.Bonk()
            .setAvatar1(req.query.url) 
            .setAvatar2(req.query.url2)
            .toBuild()
            let data = image.toBuffer()
            await fs.writeFileSync(__path +'/tmp/bonk.png', data)
            await res.sendFile(__path+'/tmp/bonk.png')
            await sleep(3000)
            await fs.unlinkSync(__path + '/tmp/bonk.png')
     }
     
     async function ship(req, res) {
         let apikey = req.query.apikey
         if (!req.query.name) return res.status(400).send({ status: 400, message: 'name parameter cannot be empty', result: 'error' })
         if (!req.query.name2) return res.status(400).send({ status: 400, message: 'name2 parameter cannot be empty', result: 'error' })
         if (!req.query.avatar) return res.status(400).send({ status: 400, message: 'avatar parameter cannot be empty', result: 'error' })
         if (!req.query.avatar2) return res.status(400).send({ status: 400, message: 'avatar2 parameter cannot be empty', result: 'error' })
         if (!req.query.num) return res.status(400).send({ status: 400, message: 'num parameter cannot be empty', result: 'error' })
         if (!req.query.status) return res.status(400).send({ status: 400, message: 'status parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let image = await new knights.Ship()
            .setName1(req.query.name) 
            .setName2(req.query.name2)
            .setAvatar1(req.query.avatar)
            .setAvatar2(req.query.avatar2)
            .setNum(req.query.num)
            .setStatus(req.query.status)
            .toAttachment()
            let data = image.toBuffer()
            await fs.writeFileSync(__path +'/tmp/ship.png', data)
            await res.sendFile(__path+'/tmp/ship.png')
            await sleep(3000)
            await fs.unlinkSync(__path + '/tmp/ship.png')
     }
     
     async function removebeg(req, res) {
         try {
             let apikey = req.query.apikey
             let url = req.query.url
             if (!url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
             if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
             let check = await cekKey(apikey)
             if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
             let limit = await isLimit(apikey);
             if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
             limitAdd(apikey);
             ensureDir(TMP_DIR)
             const outputPath = path.join(TMP_DIR, 'hasil-url.png')
             await removebg.FromUrl(url, 'fsBdYTGGKfRxsYfRPYD5wRDa')
             return res.status(200).sendFile(outputPath)
         } catch (err) {
             return sendCreatorError(res, err)
         }
     }
     
     async function komunis(req, res) {
         try {
             let apikey = req.query.apikey
             let url = req.query.url
             if (!url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
             if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
             let check = await cekKey(apikey)
             if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
             let limit = await isLimit(apikey);
             if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
             limitAdd(apikey);
             let img = await ensureCaxinha().canvas.comunism(`${url}`)
             ensureDir(TMP_DIR)
             await fs.writeFileSync(path.join(TMP_DIR, 'comunis.png'), img)
             await res.sendFile(path.join(TMP_DIR, 'comunis.png'))
             await sleep(3000)
             await fs.unlinkSync(path.join(TMP_DIR, 'comunis.png'))
         } catch (err) {
             return sendCreatorError(res, err)
         }
     }
     
     async function wasted(req, res) {
         try {
             let apikey = req.query.apikey
             let url = req.query.url
             if (!url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
             if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
             let check = await cekKey(apikey)
             if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
             let limit = await isLimit(apikey);
             if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
             limitAdd(apikey);
             let img = await ensureCaxinha().canvas.wasted(`${url}`)
             ensureDir(TMP_DIR)
             await fs.writeFileSync(path.join(TMP_DIR, 'wasted.png'), img)
             await res.sendFile(path.join(TMP_DIR, 'wasted.png'))
             await sleep(3000)
             await fs.unlinkSync(path.join(TMP_DIR, 'wasted.png'))
         } catch (err) {
             return sendCreatorError(res, err)
         }
     }
     
     async function wanted(req, res) {
         try {
             let apikey = req.query.apikey
             let url = req.query.url
             if (!url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
             if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
             let check = await cekKey(apikey)
             if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
             let limit = await isLimit(apikey);
             if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
             limitAdd(apikey);
             let img = await ensureCaxinha().canvas.wanted(`${url}`)
             ensureDir(TMP_DIR)
             await fs.writeFileSync(path.join(TMP_DIR, 'wanted.png'), img)
             await res.sendFile(path.join(TMP_DIR, 'wanted.png'))
             await sleep(3000)
             await fs.unlinkSync(path.join(TMP_DIR, 'wanted.png'))
         } catch (err) {
             return sendCreatorError(res, err)
         }
     }
     
     async function changemymind(req, res) {
         let apikey = req.query.apikey
         let text = req.query.text
         if (!text) return res.status(400).send({ status: 400, message: 'text parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let img = await yuricanvas.changemymind(`${text}`)
         await fs.writeFileSync(__path +'/tmp/cmm.png', img)
         await res.sendFile(__path+'/tmp/cmm.png')
         await sleep(3000)
         await fs.unlinkSync(__path + '/tmp/cmm.png')
     }
     
     async function notstonk(req, res) {
         let apikey = req.query.apikey
         let url = req.query.url
         if (!url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let img = await new DIG.NotStonk().getImage(`${url}`)
         await fs.writeFileSync(__path +'/tmp/notstonk.png', img)
         await res.sendFile(__path+'/tmp/notstonk.png')
         await sleep(3000)
         await fs.unlinkSync(__path + '/tmp/notstonk.png')
     }
     
     async function stonk(req, res) {
         let apikey = req.query.apikey
         let url = req.query.url
         if (!url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let img = await new DIG.Stonk().getImage(`${url}`)
         await fs.writeFileSync(__path +'/tmp/stonk.png', img)
         await res.sendFile(__path+'/tmp/stonk.png')
         await sleep(3000)
         await fs.unlinkSync(__path + '/tmp/stonk.png')
     }
     
     async function rip(req, res) {
         let apikey = req.query.apikey
         let url = req.query.url
         if (!url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let img = await new DIG.Rip().getImage(`${url}`)
         await fs.writeFileSync(__path +'/tmp/rip.png', img)
         await res.sendFile(__path+'/tmp/rip.png')
         await sleep(3000)
         await fs.unlinkSync(__path + '/tmp/rip.png')
     }
     
     async function gay(req, res) {
         let apikey = req.query.apikey
         let url = req.query.url
         if (!url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let img = await new DIG.Gay().getImage(`${url}`)
         await fs.writeFileSync(__path +'/tmp/gay.png', img)
         await res.sendFile(__path+'/tmp/gay.png')
         await sleep(3000)
         await fs.unlinkSync(__path + '/tmp/gay.png')
     }
     
     async function lisa(req, res) {
         let apikey = req.query.apikey
         let text = req.query.text
         if (!text) return res.status(400).send({ status: 400, message: 'text parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let img = await new DIG.LisaPresentation().getImage(`${text}`)
         await fs.writeFileSync(__path +'/tmp/lisa.png', img)
         await res.sendFile(__path+'/tmp/lisa.png')
         await sleep(3000)
         await fs.unlinkSync(__path + '/tmp/lisa.png')
     }
     
     async function discord(req, res) {
         let apikey = req.query.apikey
         let url = req.query.url
         if (!url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let img = await new DIG.DiscordBlue().getImage(`${url}`)
         await fs.writeFileSync(__path +'/tmp/discord.png', img)
         await res.sendFile(__path+'/tmp/discord.png')
         await sleep(3000)
         await fs.unlinkSync(__path + '/tmp/discord.png')
     }
     
     async function trash(req, res) {
         let apikey = req.query.apikey
         let url = req.query.url
         if (!url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let img = await new DIG.Trash().getImage(`${url}`)
         await fs.writeFileSync(__path +'/tmp/trash.png', img)
         await res.sendFile(__path+'/tmp/trash.png')
         await sleep(3000)
         await fs.unlinkSync(__path + '/tmp/trash.png')
     }
     
     async function deletes(req, res) {
         let apikey = req.query.apikey
         let url = req.query.url
         if (!url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let img = await new DIG.Delete().getImage(`${url}`)
         await fs.writeFileSync(__path +'/tmp/delete.png', img)
         await res.sendFile(__path+'/tmp/delete.png')
         await sleep(3000)
         await fs.unlinkSync(__path + '/tmp/delete.png')
     }
     
     async function trigger(req, res) {
         let apikey = req.query.apikey
         let url = req.query.url
         if (!url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let img = await new DIG.Triggered().getImage(`${url}`)
         await fs.writeFileSync(__path +'/tmp/trigger.png', img)
         await res.sendFile(__path+'/tmp/trigger.png')
         await sleep(3000)
         await fs.unlinkSync(__path + '/tmp/trigger.png')
     }
     
     async function blur(req, res) {
         let apikey = req.query.apikey
         let url = req.query.url
         let level = req.query.level
         if (!url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
         if (!level) return res.status(400).send({ status: 400, message: 'level parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let img = await new DIG.Blur().getImage(`${url}`, `${level}`)
         await fs.writeFileSync(__path +'/tmp/blur.png', img)
         await res.sendFile(__path+'/tmp/blur.png')
         await sleep(3000)
         await fs.unlinkSync(__path + '/tmp/blur.png')
     }
     
     async function circle(req, res) {
         let apikey = req.query.apikey
         let url = req.query.url
         if (!url) return res.status(400).send({ status: 400, message: 'url parameter cannot be empty', result: 'error' })
         if (!apikey) return res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' })
         let check = await cekKey(apikey)
         if (!check) return res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` })
         let limit = await isLimit(apikey);
         if (limit) return res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' })
         limitAdd(apikey);
         let img = await new DIG.Circle().getImage(`${url}`)
         await fs.writeFileSync(__path +'/tmp/circle.png', img)
         await res.sendFile(__path+'/tmp/circle.png')
         await sleep(3000)
         await fs.unlinkSync(__path + '/tmp/circle.png')
     }
     
module.exports = { 
   welcome, 
   welcome2, 
   goodbye,
   goodbye2, 
   promote, 
   demote, 
   rankcard, 
   levelup, 
   gfx,
   gfx2,
   gfx3,
   gfx4,
   gfx5,
   gura,
   burn,
   spongebob,
   patrick,
   hornycard,
   xnxx,
   jojo,
   bonk,
   ship,
   removebeg,
   komunis,
   wasted,
   wanted,
   changemymind,
   notstonk,
   stonk,
   rip,
   gay,
   lisa,
   discord,
   trash,
   deletes,
   trigger,
   blur,
   circle
}
