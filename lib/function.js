const fs = require('fs')
const crypto = require('crypto');
const axios = require('axios')
const fetch = require('node-fetch');
const pool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ23456789'.split('');
let fileTypeModulePromise = null;

async function detectFileTypeFromBuffer(buffer) {
    if (!fileTypeModulePromise) {
        fileTypeModulePromise = import('file-type');
    }
    const { fileTypeFromBuffer } = await fileTypeModulePromise;
    return fileTypeFromBuffer(buffer);
}

const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
}

const generateAuthToken = () => {
    return crypto.randomBytes(30).toString('hex');
}

function randomText(len) {
    const result = [];
    for (let i = 0; i < len; i++) result.push(pool[Math.floor(Math.random() * pool.length)]);
    return result.join('');
}

function readFileTxt(file) {
    return new Promise((resolve, reject) => {
        const data = fs.readFileSync(file, 'utf8');
        const array = data.toString().split('\n') ;
        const random = array[Math.floor(Math.random() * array.length)];
        resolve(random.replace('\r', ''));
    })
}

function readFileJson(file) {
    return new Promise((resolve, reject) => {
        const jsonData = JSON.parse(fs.readFileSync(file));
        const index = Math.floor(Math.random() * jsonData.length);
        const random = jsonData[index];
        resolve(random);
    })
}

const getBuffer = async (url, options) => {
    try {
        options ? options : {}
        const res = await axios({
            method: "get",
            url,
            headers: {
                'DNT': 1,
                'Upgrade-Insecure-Request': 1
            },
            ...options,
            responseType: 'arraybuffer'
        })
        return res.data
    } catch (e) {
        console.log(`Error : ${e}`)
    }
}

const getFile = async(path) => {
    let res
      let data = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (res = await fetch(path)).buffer() : fs.existsSync(path) ? fs.readFileSync(path) : typeof path === 'string' ? path : Buffer.alloc(0)
      if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
      let type = await detectFileTypeFromBuffer(data) || {
        mime: 'application/octet-stream',
        ext: '.bin'
      }

      return {
        res,
        ...type,
        data
      }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function shorts(url) {
  const res = await axios.get('https://tinyurl.com/api-create.php?url='+url)
  return res.data
}

module.exports = { readFileTxt, readFileJson, getHashedPassword, generateAuthToken, randomText, getBuffer, getFile, sleep, shorts };
