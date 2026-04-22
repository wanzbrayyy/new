module.exports = {
    port: process.env.PORT || '5000',
    limitCount: 500,
    limitPremium: 9999,
    tokens: process.env.APP_TOKEN || "wanzofc",
    aiApiKey: process.env.AI_API_KEY || '',
    // ex Mongodb Atlas : mongodb+srv://user:password@cluster.xxx (remove <password> with ur password)
    dbURI: process.env.MONGODB_URI || 'mongodb+srv://wuploadcloud_db_user:sq8TwuX9H9jl25a6@cluster0.jzp6pzl.mongodb.net/awa?appName=Cluster0' 
};
