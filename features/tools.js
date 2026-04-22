const { cekKey, limitAdd, isLimit } = require('../database/db')
const JsConfuser = require('js-confuser')

const NEW_CODING_JS_CONFUSER_PRESET = {
    target: 'node',
    preset: 'high',
    calculator: true,
    compact: true,
    hexadecimalNumbers: true,
    controlFlowFlattening: 0.5,
    deadCode: 0.25,
    dispatcher: true,
    duplicateLiteralsRemoval: 0.75,
    flatten: true,
    globalConcealing: true,
    identifierGenerator: 'randomized',
    minify: true,
    movedDeclarations: true,
    objectExtraction: true,
    opaquePredicates: 0.75,
    renameVariables: true,
    renameGlobals: true,
    shuffle: true,
    variableMasking: 0.75,
    stringConcealing: true,
    stringCompression: true,
    stringEncoding: true,
    stringSplitting: 0.75,
    astScrambler: true,
    pack: true
}

function sendToolsError(res, err) {
    const status = err.status || 500
    const message = err.message || 'An internal error occurred while processing tools request'
    console.log(err)
    return res.status(status).send({ status, message, result: 'error' })
}

async function validateApiKey(apikey) {
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
    let limit = await isLimit(apikey)
    if (limit) {
        const err = new Error('requests limit exceeded (100 req / day), call owner for an upgrade to premium')
        err.status = 429
        throw err
    }
    limitAdd(apikey)
}

async function emailvalidate(req, res) {
    try {
        const apikey = req.query.apikey
        const email = req.query.email
        if (!email) return res.status(400).send({ status: 400, message: 'email parameter cannot be empty', result: 'error' })
        await validateApiKey(apikey)
        const normalized = String(email).trim()
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
        const domain = normalized.includes('@') ? normalized.split('@')[1].toLowerCase() : null
        return res.status(200).json({
            status: 200,
            result: {
                email: normalized,
                valid: isValid,
                domain
            }
        })
    } catch (err) {
        return sendToolsError(res, err)
    }
}

async function jsonvalidate(req, res) {
    try {
        const apikey = req.query.apikey
        const text = req.query.text
        if (!text) return res.status(400).send({ status: 400, message: 'text parameter cannot be empty', result: 'error' })
        await validateApiKey(apikey)
        try {
            const parsed = JSON.parse(text)
            return res.status(200).json({
                status: 200,
                result: {
                    valid: true,
                    type: Array.isArray(parsed) ? 'array' : typeof parsed,
                    data: parsed
                }
            })
        } catch (error) {
            return res.status(200).json({
                status: 200,
                result: {
                    valid: false,
                    error: error.message
                }
            })
        }
    } catch (err) {
        return sendToolsError(res, err)
    }
}

async function base64encode(req, res) {
    try {
        const apikey = req.query.apikey
        const text = req.query.text
        if (!text) return res.status(400).send({ status: 400, message: 'text parameter cannot be empty', result: 'error' })
        await validateApiKey(apikey)
        return res.status(200).json({
            status: 200,
            result: {
                text,
                base64: Buffer.from(String(text), 'utf8').toString('base64')
            }
        })
    } catch (err) {
        return sendToolsError(res, err)
    }
}

async function base64decode(req, res) {
    try {
        const apikey = req.query.apikey
        const text = req.query.text
        if (!text) return res.status(400).send({ status: 400, message: 'text parameter cannot be empty', result: 'error' })
        await validateApiKey(apikey)
        return res.status(200).json({
            status: 200,
            result: {
                base64: text,
                text: Buffer.from(String(text), 'base64').toString('utf8')
            }
        })
    } catch (err) {
        return sendToolsError(res, err)
    }
}

async function jsconfuser(req, res) {
    try {
        const apikey = req.query.apikey
        const text = req.query.text
        if (!text) return res.status(400).send({ status: 400, message: 'text parameter cannot be empty', result: 'error' })
        await validateApiKey(apikey)
        const target = String(req.query.target || NEW_CODING_JS_CONFUSER_PRESET.target).toLowerCase()
        const config = {
            ...NEW_CODING_JS_CONFUSER_PRESET,
            target: target === 'browser' ? 'browser' : 'node'
        }
        const result = await JsConfuser.obfuscate(String(text), config)
        return res.status(200).json({
            status: 200,
            result: {
                name: 'new-coding新しいコーディング',
                subtitle: 'super high js-confuser preset',
                preset: 'super-high',
                target: config.target,
                config,
                code: result.code
            }
        })
    } catch (err) {
        return sendToolsError(res, err)
    }
}

module.exports = {
    emailvalidate,
    jsonvalidate,
    base64encode,
    base64decode,
    jsconfuser
}
