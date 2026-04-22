const express = require('express');
const router = express.Router();

const { randomText } = require('../lib/function');
const { User, Changelog, InviteLink } = require('../database/model');
const { isAuthenticated, isAdmin } = require('../lib/auth');

function getBaseUrl(req) {
    if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/$/, '');
    return `${req.protocol}://${req.get('host')}`;
}

router.get('/index', isAuthenticated, isAdmin, async (req, res) => {
    const entries = await Changelog.find({}).sort({ updatedAt: -1, createdAt: -1 });
    const invites = await InviteLink.find({}).sort({ createdAt: -1 });
    res.render('admin/index', {
        layout: false,
        username: req.user.username,
        email: req.user.email,
        entries,
        invites,
        baseUrl: getBaseUrl(req)
    });
});

router.get('/listuser', isAuthenticated, isAdmin, async (req, res) => {
    const list = await User.find({}).sort({ createdAt: -1, username: 1 });
    res.render('admin/listuser', {
        layout: false,
        List: list,
        username: req.user.username,
        email: req.user.email
    });
});

router.post('/changelog/add', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { title, category, details } = req.body;
        const lines = String(details || '')
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        if (!title || lines.length === 0) {
            req.flash('error_msg', 'Title dan detail changelog wajib diisi.');
            return res.redirect('/admin/index');
        }

        await Changelog.create({
            title: String(title).trim(),
            category: String(category || 'update').trim().toLowerCase(),
            details: lines,
            createdBy: req.user.username
        });

        req.flash('success_msg', 'Changelog berhasil ditambahkan.');
        return res.redirect('/admin/index');
    } catch (error) {
        console.log(error);
        req.flash('error_msg', 'Gagal menambahkan changelog.');
        return res.redirect('/admin/index');
    }
});

router.post('/changelog/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { title, category, details } = req.body;
        const lines = String(details || '')
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        if (!title || lines.length === 0) {
            req.flash('error_msg', 'Title dan detail changelog wajib diisi.');
            return res.redirect('/admin/index');
        }

        await Changelog.findByIdAndUpdate(req.params.id, {
            title: String(title).trim(),
            category: String(category || 'update').trim().toLowerCase(),
            details: lines,
            createdBy: req.user.username
        });

        req.flash('success_msg', 'Changelog berhasil diperbarui.');
        return res.redirect('/admin/index');
    } catch (error) {
        console.log(error);
        req.flash('error_msg', 'Gagal memperbarui changelog.');
        return res.redirect('/admin/index');
    }
});

router.post('/changelog/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        await Changelog.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Changelog berhasil dihapus.');
        return res.redirect('/admin/index');
    } catch (error) {
        console.log(error);
        req.flash('error_msg', 'Gagal menghapus changelog.');
        return res.redirect('/admin/index');
    }
});

router.post('/invite/add', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { title, limit, maxUses, allowCustomKey } = req.body;
        await InviteLink.create({
            code: randomText(18),
            title: String(title || '').trim() || 'invite link',
            limit: Number(limit || 500),
            maxUses: Number(maxUses || 1),
            allowCustomKey: String(allowCustomKey || 'false') === 'true',
            createdBy: req.user.username
        });
        req.flash('success_msg', 'Invite link berhasil dibuat.');
        return res.redirect('/admin/index');
    } catch (error) {
        console.log(error);
        req.flash('error_msg', 'Gagal membuat invite link.');
        return res.redirect('/admin/index');
    }
});

router.post('/invite/toggle/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const invite = await InviteLink.findById(req.params.id);
        if (!invite) {
            req.flash('error_msg', 'Invite link tidak ditemukan.');
            return res.redirect('/admin/index');
        }
        invite.isActive = !invite.isActive;
        await invite.save();
        req.flash('success_msg', 'Status invite link diperbarui.');
        return res.redirect('/admin/index');
    } catch (error) {
        console.log(error);
        req.flash('error_msg', 'Gagal mengubah status invite link.');
        return res.redirect('/admin/index');
    }
});

router.post('/invite/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        await InviteLink.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Invite link berhasil dihapus.');
        return res.redirect('/admin/index');
    } catch (error) {
        console.log(error);
        req.flash('error_msg', 'Gagal menghapus invite link.');
        return res.redirect('/admin/index');
    }
});

module.exports = router;
