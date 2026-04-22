/* Module */
const { default: axios } = require('axios')
const Util = require('util')
const cheerio = require('cheerio')
const fixNumber = (number) => {
  const str = String(number).split('').reverse().join('');
  const arr = str.match(/\d{1,3}/g);
  let arr2 = arr.join('.').split('').reverse().join('');
  return arr2
}

/* Instagram API */
const highlight = "https://i.instagram.com/api/v1/feed/reels_media/?reel_ids=%s"
const story = "https://i.instagram.com/api/v1/feed/user/%s/reel_media/"
const profile = "https://instagram.com/%s?__a=1"
const cookie = "ig_cb=1; ig_did=40877FEE-57D0-4C55-A8B2-A65E213ECFF6; csrftoken=7a9o80pMOuoEJWQTWKUbGy9pMnloieTA; ; mid=YT95ogALAAHd0oAqeo3MTP3OVBzS; ds_user_id=49516754969; sessionid=49516754969%3AVg1tGjnj5E84zM%3A14"
const UA = "Instagram 10.3.2 (iPhone7,2; iPhone OS 9_3_3; en_US; en-US; scale=2.00; 750x1334) AppleWebKit/420+"
const WEB_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"

const req = async (url, options) => {
    let res = await axios({
        url,
        ...options
    })
    return res.data
}

/**
 * Get all story media based on given user id
 * @param {String} userId Instagram user id
 */
const getStory = async (userId) => {
    let res = await axios.get(Util.format(story, userId), {
        headers: {
            "User-Agent": UA,
            cookie
        }
    })
    return res.data.items
}

/**
 * Get all highlight media based on given highlight id
 * @param {String} highId highlight id
 */
const getHighReels = async (highId) => {
    let res = await axios.get(Util.format(highlight, highId), {
        headers: {
            "User-Agent": UA,
            cookie
        }
    })
    return res.data.reels[highId].items
}

function igStory(url) {
    return new Promise(async (resolve, reject) => {
        try {
            const parsed = new URL(url);
            let media_id = parsed.pathname.split('/').filter(v => v)[2];
            let username = parsed.pathname.split('/').filter(v => v)[1];
            let res = await req(`${parsed.origin}/${username}` + '?__a=1', {
                headers: {
                    cookie
                }
            });
            let res2 = await getStory(res.graphql.user.id);
            let tmp;
            let metadata = {};
            for (const idx in res2) {
                if (res2[idx].id.includes(media_id)) {
                    tmp = res2[idx];
                }
            }
            metadata['uriType'] = 'igStory'
            metadata['type'] = { 1: 'photo', 2: 'video' }[tmp.media_type]
            metadata['media'] = { 1: tmp.image_versions2.candidates, 2: tmp.video_versions }[tmp.media_type]
            resolve(metadata)
        } catch (e) {
            reject(e)
        }
    })
}

function igHighlight(url) {
    return new Promise(async (resolve, reject) => {
        try {
            const parsed = new URL(url);
            let media_id = parsed.searchParams.get('story_media_id');
            let res = await axios.request({
                url,
                headers: {
                    cookie
                }
            });
            let parsed2 = new URL(res.request.res.responseUrl);
            let highId = parsed2.pathname.split('/').filter(v => v)[2];
            const res2 = await getHighReels(`highlight:${highId}`);
            let tmp;
            let metadata = {};
            for (const idx in res2) {
                if (res2[idx].id == media_id) {
                    tmp = res2[idx]
                }
            }
            metadata['uriType'] = 'igHigh'
            metadata['type'] = { 1: 'photo', 2: 'video' }[tmp.media_type];
            metadata['media'] = { 1: tmp.image_versions2.candidates, 2: tmp.video_versions }[tmp.media_type];
            resolve(metadata);
        } catch (e) {
            reject(e);
        }
    })
}

/**
 * Instagram Post
 * @param {String} url IgPost url
 */
async function igPost(url) {
    try {
        const uri = url.replace(/\?.*$/g, '') + '?__a=1'
        const { data } = await axios.get(uri, {
            headers: {
                cookie
            }
        })
        if (data.hasOwnProperty('graphql')) {
            const type = data.graphql.shortcode_media.__typename
            const metadata = {
                type,
                uriType: "igPost",
                url: []
            }

            if (type === 'GraphImage') {
                metadata.url.push(data.graphql.shortcode_media.display_url)
            } else if (type === 'GraphVideo') {
                metadata.url.push(data.graphql.shortcode_media.video_url)
            } else if (type === 'GraphSidecar') {
                data.graphql.shortcode_media.edge_sidecar_to_children.edges.map((r) => {
                    if (r.node.__typename === 'GraphImage') metadata.url.push(r.node.display_url)
                    if (r.node.__typename === 'GraphVideo') metadata.url.push(r.node.video_url)
                })
            }
            return metadata
        } else if (data.hasOwnProperty("items")) {
            const metadata = { uriType: "igPost", url: [] };
            const mediaTypeMap = {
                1: "image",
                2: "video",
                8: "carousel"
            }[data.items[0].media_type];
            // Filtering Process
            if (mediaTypeMap === "image") {
                const dl_link = data.items[0].image_versions2?.candidates?.sort((a, b) => b.width - a.width)?.sort((c, d) => d.height - c.height)?.[0]?.url;
                metadata['url'].push(dl_link);
            } else if (mediaTypeMap === "video") {
                const dl_link = data.items[0].video_versions?.sort((a, b) => b.width - a.width)?.sort((c, d) => d.height - c.height)?.[0]?.url;
                metadata['url'].push(dl_link);
            } else if (mediaTypeMap === "carousel") {
                const dl_link = data.items[0].carousel_media.map((fd) => {
                    // Filtering Process for Multi-photo/Multi-video
                    const data_1 = {
                        1: fd.image_versions2?.candidates?.sort((a, b) => b.width - a.width)?.sort((c, d) => d.height - c.height)?.[0]?.url,
                        2: fd.video_versions?.sort((a, b) => b.width - a.width)?.sort((c, d) => d.height - c.height)?.[0]?.url
                    }[fd.media_type];
                    return data_1;
                })
                metadata['url'] = dl_link;
            }
            // Result
            return metadata;
        } else {
            throw Error("Post not found or private");
        }
    } catch (e) {
        throw e
    }
}

/**
 * Get Instagram User Profile Info
 * @param {String} username Instagram Username
 */
function igProfile(username) {
    return new Promise(async (resolve, reject) => {
        try {
            const cleanUsername = String(username || '').trim().replace(/^@/, '')
            if (!cleanUsername) throw new Error('Username cannot be empty')

            const res = await axios.get('https://www.instagram.com/api/v1/users/web_profile_info/', {
                method: "GET",
                params: {
                    username: cleanUsername
                },
                headers: {
                    'User-Agent': WEB_UA,
                    'X-IG-App-ID': '936619743392459',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': `https://www.instagram.com/${cleanUsername}/`
                }
            });
            const user = res.data?.data?.user
            if (user) {
                let metadata = {
                    name: user.full_name,
                    username: user.username,
                    bio: user.biography,
                    ex_url: user.external_url,
                    follower: fixNumber(user.edge_followed_by?.count || 0),
                    following: fixNumber(user.edge_follow?.count || 0),
                    private: user.is_private ? 'yes' : 'no',
                    verified: user.is_verified ? 'yes' : 'no',
                    posts: fixNumber(user.edge_owner_to_timeline_media?.count || 0)
                };
                let picUrl = {
                    hd: user.profile_pic_url_hd || user.profile_pic_url,
                    sd: user.profile_pic_url
                };
                resolve({ metadata, picUrl });
            } else {
                const html = await axios.get(`https://www.instagram.com/${cleanUsername}/`, {
                    headers: {
                        'User-Agent': WEB_UA
                    }
                })
                const $ = cheerio.load(html.data)
                const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content')
                const image = $('meta[property="og:image"]').attr('content')
                const title = $('meta[property="og:title"]').attr('content') || ''

                if (!description) {
                    const err = new Error('User not found or profile is unavailable')
                    err.status = 404
                    throw err
                }

                const stats = description.match(/([\d.,KM]+)\s+Followers,\s+([\d.,KM]+)\s+Following,\s+([\d.,KM]+)\s+Posts/i)
                const bioMatch = description.match(/Instagram:\s*"([^"]*)"/i)
                const nameMatch = title.match(/^(.*?)\s+\(@/i)

                resolve({
                    metadata: {
                        name: nameMatch ? nameMatch[1].trim() : cleanUsername,
                        username: cleanUsername,
                        bio: bioMatch ? bioMatch[1] : '',
                        ex_url: null,
                        follower: stats ? stats[1] : '0',
                        following: stats ? stats[2] : '0',
                        private: 'unknown',
                        verified: 'unknown',
                        posts: stats ? stats[3] : '0'
                    },
                    picUrl: {
                        hd: image || null,
                        sd: image || null
                    }
                });
            }
        } catch (e) {
            if (e.response?.status === 404) {
                const err = new Error('User not found')
                err.status = 404
                return reject(err)
            }
            if (e.response?.status === 429) {
                const err = new Error('Instagram rate limit reached, please try again later')
                err.status = 429
                return reject(err)
            }
            reject(e);
        }
    })
}

function insta(url) {
    let rex1 = /(?:\/p\/|\/reel\/|\/tv\/)([^\s&]+)/
    let rex2 = /\/s\/([^\s&]+)/
    let rex3 = /\/stories\/([^\s&]+)/

    if (rex1.test(url)) {
        return igPost(url)
    } else if (rex2.test(url)) {
        return igHighlight(url)
    } else if (rex3.test(url)) {
        return igStory(url)
    } else {
        throw "Invalid URL or not supported"
    }
}

module.exports = {
    insta,
    igProfile
}
