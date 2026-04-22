const mongoose = require('mongoose');

const Users = mongoose.Schema({
    username: { type: String },
    password: { type: String },
    email: { type: String },
    apikey: { type: String },
    defaultKey: { type: String },
    premium: { type: String },
    admin: { type: Boolean, default: false },
    limit: { type: Number },
    totalreq: { type: Number },
    status: { type: String },
    jid: { type: String },
    nomorWa: { type: String }
}, { versionKey: false });
module.exports.User = mongoose.model('api2', Users);

const Utils = mongoose.Schema({
    total: { type: Number },
    today: { type: Number },
    visitor: { type: Number },
    util: { type: String }
}, { versionKey: false });
module.exports.Utils = mongoose.model('util', Utils);

const ChangelogSchema = mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, default: 'update' },
    details: [{ type: String }],
    createdBy: { type: String, default: 'admin' }
}, {
    versionKey: false,
    timestamps: true
});

module.exports.Changelog = mongoose.model('changelog', ChangelogSchema);

const InviteLinkSchema = mongoose.Schema({
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    limit: { type: Number, default: 500 },
    allowCustomKey: { type: Boolean, default: false },
    maxUses: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, default: 'admin' }
}, {
    versionKey: false,
    timestamps: true
});

module.exports.InviteLink = mongoose.model('invite_link', InviteLinkSchema);
