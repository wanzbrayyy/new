const express = require('express');
const { checkUsername, resetAllLimit } = require('../database/db');
const { addPremium, deletePremium, checkPremium, changeKey, resetOneLimit, resetTodayReq } = require('../database/premium');
const { isAuthenticated, isAdmin } = require('../lib/auth');
const { limitCount, tokens } = require('../lib/settings');
const router = express.Router();

router.post('/add', isAuthenticated, isAdmin, async (req, res) => {
    let { username, expired, customKey, token } = req.body;
    if (token != tokens) {
        req.flash('error_msg', 'Invalid Token');
        res.redirect('/admin/index');
    }
    let checking = await checkUsername(username);
    if (!checking) {
        req.flash('error_msg', 'Username is not registered');
        res.redirect('/admin/index');
    } else {
        let checkPrem = await checkPremium(username)
        if (checkPrem) {
            req.flash('error_msg', 'Username is alredy Premium before');
            res.redirect('/admin/index');
        } else {
            addPremium(username, customKey, expired)
            req.flash('success_msg', `Succes Added Premium ${username}`);
            res.redirect('/admin/index');
        }
    }
})

router.post('/delete', isAuthenticated, isAdmin, async  (req, res) => {
    let { username, token } = req.body;
    if (token != tokens) {
        req.flash('error_msg', 'Invalid Token');
        return res.redirect('/admin/index');
    }
    let checking = await checkUsername(username);
    if (!checking) {
        req.flash('error_msg', 'Username is not registered');
        res.redirect('/admin/index');
    } else {
        let checkPrem = await checkPremium(username)
        if (checkPrem) {
            deletePremium(username);
            req.flash('success_msg', `Succes Delete Premium ${username}`);
            res.redirect('/admin/index');
        } else {
            req.flash('error_msg', 'Username is not Premium');
            res.redirect('/admin/index');
        }
    };
});


router.post('/custom', isAuthenticated, async (req, res) => {
    let { customKey } = req.body;
    let { username } = req.user
    let checkPrem = await checkPremium(username);
    if (checkPrem) {
        changeKey(username, customKey)
        req.flash('success_msg', `Succes Custom Apikey ${customKey}`);
        res.redirect('/profile');
    } else {
        req.flash('error_msg', 'You are not a premium user');
        res.redirect('/profile');
    }
})

router.post('/limit',  isAuthenticated, isAdmin, async  (req, res) => {
    let { username, token } = req.body;
    if (token != tokens) {
        req.flash('error_msg', 'Invalid Token');
        return res.redirect('/admin/index');
    }
    let reset = await checkPremium(username);
    if (!reset) {
        resetOneLimit(username)
        req.flash('success_msg', `Succes Reset Limit Apikey User ${username} to ${limitCount}`);
        res.redirect('/admin/index');
    } else {
        req.flash('error_msg', 'Cannot Reset Premium Apikey');
        res.redirect('/admin/index');
    }
})

router.post('/resetall', isAuthenticated, isAdmin, async  (req, res) => {
    let { username } = req.user
    let { token } = req.body;
    if (token != tokens) {
        req.flash('error_msg', 'Invalid Token');
        return res.redirect('/admin/index');
    } else {
        resetAllLimit();
        resetTodayReq();
        req.flash('success_msg', `Succes Reset Limit All Apikey`);
        return res.redirect('/admin/index');
    }
})

module.exports = router;
