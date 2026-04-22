const { limitCount, limitPremium } = require('../lib/settings');
const { User } = require('./model');
const nodemailer = require('nodemailer')
const halaman = require('../lib/email')

const smtpUser = process.env.SMTP_USER || 'zanssxploit@gmail.com';
const smtpPass = process.env.SMTP_PASS || 'hvtj nfkr vfwg yfnt';

function createMailer() {
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: smtpUser,
            pass: smtpPass
        }
    });
}

    async function addUser(username, email, password, apikey, id, nomorWa, options = {}) {
        let obj = {
            username,
            email,
            password,
            apikey,
            defaultKey: apikey,
            jid: id,
            nomorWa,
            status: null,
            premium: null,
            admin: false,
            limit: options.limit ?? limitCount,
            totalreq: 0
        };
        return await User.create(obj);
    }
    module.exports.addUser = addUser

    async function checkUsername(username) {
        let users = await User.findOne({username: username});
        if(users !== null) {
            return users.username;
        } else {
            return false;
        }
    }
    module.exports.checkUsername = checkUsername;
    
    async function checkEmail(email) {
        let users = await User.findOne({email: email});
        if(users !== null) {
            return users.email;
        } else {
            return false;
        }
    }
    module.exports.checkEmail = checkEmail;
    
    async function checkNomor(nomor) {
        let users = await User.findOne({nomorWa: nomor});
        if(users !== null) {
            return users.nomorWa;
        } else {
            return false;
        }
    }
    module.exports.checkNomor = checkNomor;
    
    async function checkAdmin(admin) {
        let users = await User.findOne({admin: admin});
        if(users !== null) {
            return users.admin;
        } else {
            return false;
        }
    }
    module.exports.checkNomor = checkAdmin;

    async function checkApiKey(apikey) {
        let user = await User.findOne({ apikey: apikey });
        return Boolean(user);
    }
    module.exports.checkApiKey = checkApiKey;

    async function getApikey(id) {
        let users = await User.findOne({_id: id});
        return { apikey: users.apikey, username: users.username };
    }
    module.exports.getApikey = getApikey;

    async function cekKey(apikey) {
        let db = await User.findOne({apikey: apikey});
        if(db === null) {
            return false;
        } else {
            return db.apikey;
        }
    }
    module.exports.cekKey = cekKey;
    
    async function limitAdd(apikey) {
        let key = await User.findOne({apikey: apikey});
        let min = key.limit - 1;
        let plus = key.totalreq + 1;
        await User.updateOne({apikey: apikey}, {limit: min, totalreq: plus});
    }
    module.exports.limitAdd = limitAdd

    async function checkLimit(apikey) {
        let key = await User.findOne({apikey: apikey});
        return key.limit;
    }
    module.exports.checkLimit = checkLimit;

    async function isLimit(apikey) {
        let key = await User.findOne({apikey: apikey});
        if (key.limit <= 0){
            return true;
        } else {
            return false;
        }
    }
    module.exports.isLimit = isLimit

    async function resetAllLimit() {
        let users = await User.find({});
        for (const data of users) {
            let { premium, username } = data
            if (premium !== null) {
                await User.updateOne({username: username}, {limit: limitPremium});
            } else {
                await User.updateOne({username: username}, {limit: limitCount});
            }
        }
    }
    
    module.exports.resetAllLimit = resetAllLimit
    
    //send email
    
    function buildBaseUrl(protocol, host) {
        if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/$/, '');
        if (!host) return 'http://localhost:5000';
        const safeProtocol = protocol || (host.includes('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
        return `${safeProtocol}://${host}`;
    }

    async function sendEmail(email, idnya, protocol, host) {
    const verifykan = buildBaseUrl(protocol, host) + "/verification/verify?id=" + idnya
    const mailer = createMailer()
    try {
        await mailer.sendMail({
            from: `"WANZOFC Rest Api's" <${smtpUser}>`,
            to: email,
            subject: "Please Verify",
            html: halaman.email(verifykan)
        })
        console.log("Succes Send Email ke " + email)
        return { success: true }
    } catch (err) {
        console.log(err)
        return { success: false, message: err.message }
    }
    }
    module.exports.sendEmail = sendEmail;

    async function findUserByUsernameOrEmail(identity) {
        let users = await User.findOne({
            $or: [
                { username: identity },
                { email: identity }
            ]
        });
        return users;
    }
    module.exports.findUserByUsernameOrEmail = findUserByUsernameOrEmail;
    
    async function verifyUser(id) {
        let users = await User.findOne({jid: id});
        if (users && users.jid !== null) {
            return await User.updateOne({jid: id}, {status: "Terverifikasi"});
        } else {
            return false
        };
    };
    module.exports.verifyUser = verifyUser;

   async function checkVerify(username) {
        let users = await User.findOne({username: username});
        if (users.status !== null) {
            return false;
        } else {
            return users.username;
        };
    };
    module.exports.checkVerify = checkVerify;
