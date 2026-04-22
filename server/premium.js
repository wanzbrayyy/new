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
        return res.redirect(303, '/admin/index');
    }
    let checking = await checkUsername(username);
    if (!checking) {
        req.flash('error_msg', 'Username is not registered');
        return res.redirect(303, '/admin/index');
    } else {
        let checkPrem = await checkPremium(username)
        if (checkPrem) {
            req.flash('error_msg', 'Username is alredy Premium before');
            return res.redirect(303, '/admin/index');
        } else {
            addPremium(username, customKey, expired)
            req.flash('success_msg', `Succes Added Premium ${username}`);
            return res.redirect(303, '/admin/index');
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
        return res.redirect(303, '/admin/index');
    } else {
        let checkPrem = await checkPremium(username)
        if (checkPrem) {
            deletePremium(username);
            req.flash('success_msg', `Succes Delete Premium ${username}`);
            return res.redirect(303, '/admin/index');
        } else {
            req.flash('error_msg', 'Username is not Premium');
            return res.redirect(303, '/admin/index');
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
        return res.redirect(303, '/profile');
    } else {
        req.flash('error_msg', 'You are not a premium user');
        return res.redirect(303, '/profile');
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
        return res.redirect(303, '/admin/index');
    } else {
        req.flash('error_msg', 'Cannot Reset Premium Apikey');
        return res.redirect(303, '/admin/index');
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
        return res.redirect(303, '/admin/index');
    }
})

module.exports = router;
