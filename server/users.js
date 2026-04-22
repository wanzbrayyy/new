const express = require('express');
const router = express.Router();
const passport = require('passport');

const { getHashedPassword, randomText } = require('../lib/function');
const { InviteLink } = require('../database/model');
const { checkUsername, addUser, checkNomor, checkEmail, sendEmail, checkVerify, findUserByUsernameOrEmail, checkApiKey } = require('../database/db');
const { notAuthenticated } = require('../lib/auth');

router.get('/', notAuthenticated, (req, res) => {
    res.render('login', {
    layout: 'login'
  })
})

router.get('/login', notAuthenticated, (req, res) => {
    res.render('login', {
    layout: 'login'
  })
})

router.post('/login', async(req, res, next) => {
    let { username, password } = req.body;
    let check = await checkVerify(username);
    if(check) {
    req.flash('error_msg', 'Your account has not been verified');
    return res.redirect(303, '/users/login');
    } else {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            if (info && info.message) {
                req.flash('error', info.message);
            }
            return res.redirect(303, '/users/login');
        }

        req.logIn(user, (loginErr) => {
            if (loginErr) {
                return next(loginErr);
            }
            return res.redirect(303, '/docs');
        });
    })(req, res, next);
    };
});

router.get('/register', notAuthenticated, async (req, res) => {
    let invite = null;
    if (req.query.invite) {
        invite = await InviteLink.findOne({ code: req.query.invite, isActive: true });
        if (!invite || invite.usedCount >= invite.maxUses) {
            invite = null;
            req.flash('error_msg', 'Link undangan tidak valid atau sudah habis.');
        }
    }
    res.render('register', {
      layout: 'register',
      invite
    })
})

router.post('/register', async (req, res) => {
    try {
        let { username, nomorWa, email, password, confirmPassword, inviteCode, customKey } = req.body;
        let invite = null;
        if (inviteCode) {
            invite = await InviteLink.findOne({ code: inviteCode, isActive: true });
            if (!invite || invite.usedCount >= invite.maxUses) {
                req.flash('error_msg', 'Link undangan tidak valid atau sudah habis.');
                return res.redirect(303, '/users/register' + (inviteCode ? `?invite=${inviteCode}` : ''));
            }
        }
        if (username.length < 3) {
            req.flash('error_msg', 'Username must be at least 3 characters');
            return res.redirect(303, '/users/register' + (inviteCode ? `?invite=${inviteCode}` : ''));
        }
        if (password.length < 6 || confirmPassword < 6) {
            req.flash('error_msg', 'Password must be at least 6 characters');
            return res.redirect(303, '/users/register' + (inviteCode ? `?invite=${inviteCode}` : ''));
        }
        if (password === confirmPassword) {
            let checkUser = await checkUsername(username);
            let checkEmails = await checkEmail(email);
            let checkNomors = await checkNomor(nomorWa);
            if (checkUser || checkEmails || checkNomors) {
                req.flash('error_msg', 'A user with the same Account already exists');
                return res.redirect(303, '/users/register' + (inviteCode ? `?invite=${inviteCode}` : ''));
            } else {
                let hashedPassword = getHashedPassword(password);
                let apikey = randomText(25);
                if (invite && invite.allowCustomKey && customKey && customKey.trim()) {
                    const exists = await checkApiKey(customKey.trim());
                    if (exists) {
                        req.flash('error_msg', 'Custom API key sudah dipakai.');
                        return res.redirect(303, '/users/register?invite=' + inviteCode);
                    }
                    apikey = customKey.trim();
                }
                let id = randomText(200);
                await addUser(username, email, hashedPassword, apikey, id, nomorWa, {
                    limit: invite ? invite.limit : undefined
                });
                if (invite) {
                    invite.usedCount += 1;
                    if (invite.usedCount >= invite.maxUses) {
                        invite.isActive = false;
                    }
                    await invite.save();
                }
                let emailResult = await sendEmail(email, id, req.protocol, req.get('host'));
                if (!emailResult.success) {
                    req.flash('error_msg', 'Akun berhasil dibuat, tetapi email verifikasi gagal dikirim. Gunakan menu resend verification setelah SMTP diperbaiki.');
                    return res.redirect(303, '/users/login');
                }
                req.flash('success_msg', 'You have registered please check the email spam folder for email verification');
                return res.redirect(303, '/users/login');
            }
        } else {
            req.flash('error_msg', 'Password does not match.');
            return res.redirect(303, '/users/register');
        }
    } catch(err) {
        console.log(err);
    }
})

router.post('/resend-verification', notAuthenticated, async (req, res) => {
    try {
        let { identity } = req.body;
        if (!identity) {
            req.flash('error_msg', 'Username atau email wajib diisi.');
            return res.redirect(303, '/users/login');
        }

        let user = await findUserByUsernameOrEmail(identity);
        if (!user) {
            req.flash('error_msg', 'User tidak ditemukan.');
            return res.redirect(303, '/users/login');
        }

        if (user.status !== null) {
            req.flash('success_msg', 'Akun ini sudah terverifikasi.');
            return res.redirect(303, '/users/login');
        }

        let emailResult = await sendEmail(user.email, user.jid, req.protocol, req.get('host'));
        if (!emailResult.success) {
            req.flash('error_msg', 'Gagal mengirim ulang email verifikasi: ' + emailResult.message);
            return res.redirect(303, '/users/login');
        }

        req.flash('success_msg', 'Email verifikasi berhasil dikirim ulang.');
        return res.redirect(303, '/users/login');
    } catch (err) {
        console.log(err);
        req.flash('error_msg', 'Terjadi kesalahan saat mengirim ulang verifikasi.');
        return res.redirect(303, '/users/login');
    }
});

router.get('/logout', (req,res, next) => {
    req.logout(function(err) {
        if (err) {
            return next(err);
        }
        req.flash('success_msg', 'logout success');
        return res.redirect(303, '/users/login');
    });
});

module.exports = router;
