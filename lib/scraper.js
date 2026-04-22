const request = require('request')
const cheerio = require('cheerio')
const axios = require('axios')
const fetch = require('node-fetch')
const fs = require('fs')
const { shorts } = require('./function')

function pinterest(query){
	return new Promise(async(resolve,reject) => {
		 axios.get('https://id.pinterest.com/search/pins/?autologin=true&q=' + query, {
			headers: {
			"cookie" : "_auth=1; _b=\"AVna7S1p7l1C5I9u0+nR3YzijpvXOPc6d09SyCzO+DcwpersQH36SmGiYfymBKhZcGg=\"; _pinterest_sess=TWc9PSZHamJOZ0JobUFiSEpSN3Z4a2NsMk9wZ3gxL1NSc2k2NkFLaUw5bVY5cXR5alZHR0gxY2h2MVZDZlNQalNpUUJFRVR5L3NlYy9JZkthekp3bHo5bXFuaFZzVHJFMnkrR3lTbm56U3YvQXBBTW96VUgzVUhuK1Z4VURGKzczUi9hNHdDeTJ5Y2pBTmxhc2owZ2hkSGlDemtUSnYvVXh5dDNkaDN3TjZCTk8ycTdHRHVsOFg2b2NQWCtpOWxqeDNjNkk3cS85MkhhSklSb0hwTnZvZVFyZmJEUllwbG9UVnpCYVNTRzZxOXNJcmduOVc4aURtM3NtRFo3STlmWjJvSjlWTU5ITzg0VUg1NGhOTEZzME9SNFNhVWJRWjRJK3pGMFA4Q3UvcHBnWHdaYXZpa2FUNkx6Z3RNQjEzTFJEOHZoaHRvazc1c1UrYlRuUmdKcDg3ZEY4cjNtZlBLRTRBZjNYK0lPTXZJTzQ5dU8ybDdVS015bWJKT0tjTWYyRlBzclpiamdsNmtpeUZnRjlwVGJXUmdOMXdTUkFHRWloVjBMR0JlTE5YcmhxVHdoNzFHbDZ0YmFHZ1VLQXU1QnpkM1FqUTNMTnhYb3VKeDVGbnhNSkdkNXFSMXQybjRGL3pyZXRLR0ZTc0xHZ0JvbTJCNnAzQzE0cW1WTndIK0trY05HV1gxS09NRktadnFCSDR2YzBoWmRiUGZiWXFQNjcwWmZhaDZQRm1UbzNxc21pV1p5WDlabm1UWGQzanc1SGlrZXB1bDVDWXQvUis3elN2SVFDbm1DSVE5Z0d4YW1sa2hsSkZJb1h0MTFpck5BdDR0d0lZOW1Pa2RDVzNySWpXWmUwOUFhQmFSVUpaOFQ3WlhOQldNMkExeDIvMjZHeXdnNjdMYWdiQUhUSEFBUlhUVTdBMThRRmh1ekJMYWZ2YTJkNlg0cmFCdnU2WEpwcXlPOVZYcGNhNkZDd051S3lGZmo0eHV0ZE42NW8xRm5aRWpoQnNKNnNlSGFad1MzOHNkdWtER0xQTFN5Z3lmRERsZnZWWE5CZEJneVRlMDd2VmNPMjloK0g5eCswZUVJTS9CRkFweHc5RUh6K1JocGN6clc1JmZtL3JhRE1sc0NMTFlpMVErRGtPcllvTGdldz0=; _ir=0"
		}
			}).then(({ data }) => {
		const $ = cheerio.load(data)
		const result = [];
		const hasil = [];
   		 $('div > a').get().map(b => {
        const link = $(b).find('img').attr('src')
            result.push(link)
		});
   		result.forEach(v => {
		 if(v == undefined) return
		 hasil.push(v.replace(/236/g,'736'))
			})
			hasil.shift();
		resolve(hasil)
		})
	})
}

function pinterestdl(url) {
    return new Promise((resolve, reject) => {
        axios.request({
            url: 'https://www.expertsphp.com/facebook-video-downloader.php',
            method: "POST",
            data: new URLSearchParams(Object.entries({url: url})),
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                "user-agent": "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36"
            }
        }).then(res => {
            const $ = cheerio.load(res.data)
            const img = $('#showdata > div:nth-child(4) > table > tbody > tr:nth-child(2) > td:nth-child(1) > a').attr('href')
            const vid = $('#showdata > div:nth-child(4) > table > tbody > tr:nth-child(1) > td:nth-child(1) > a').attr('href')
            const result = { img, vid }
                if (typeof vid == 'undefined') return resolve({ result: img })
                resolve({ result: vid })
        })
    })
}

const mediafireDl = async (url) => {
const res = await axios.get(url) 
const $ = cheerio.load(res.data)
const hasil = {}
const link = $('a#downloadButton').attr('href')
const size = $('a#downloadButton').text().replace('Download', '').replace('(', '').replace(')', '').replace('\n', '').replace('\n', '').replace('                         ', '')
const seplit = link.split('/')
const nama = seplit[5]
mime = nama.split('.')
mime = mime[1]
hasil.title = nama 
hasil.size = size
hasil.link = link
return hasil
}

function igDownload(Url) {
  return new Promise((resolve, reject) => {
    axios.get('https://snapinsta.app/', {
      headers: {
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
      }
    }).then(res => {
      const cookie = res.headers[`set-cookie`][0].replace('; path=/', '')
      const data = {
        url: Url,
        action: 'post'
      }
      axios.request({
        url: 'https://snapinsta.app/action.php',
        method: 'post',
        data: new URLSearchParams(Object.entries(data)),
        headers: {
          'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
          'cookie': cookie
        }
      }).then(data => {
        const $ = cheerio.load(data.data)
        const result = []
        $('div.row.download-box > div.col-md-4').each((a, b) => {
          let link = $(b).find('div.download-items > div.download-items__btn > a.abutton').attr('href');
          result.push(link)
        })
        resolve(result)
      })
    })
  })
}

function igStory(username) {
	return new Promise((resolve, reject) => {
		axios.request({
			url: 'https://storydownloader.net/',
			method: 'GET',
			headers: {
				"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"		
			}
		}).then(response => {
			const ch = cheerio.load(response.data)
			const token = ch('#token').attr('value')
			let data = {
				token: token,
				username: username,
				stp: 1
			}
			axios.request({
				url: 'https://storydownloader.net/process/',
				method: 'POST',
				data: new URLSearchParams(Object.entries(data)),
				headers: {
					"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
					"cookie": response.headers["set-cookie"],
					"accept": "application/json, text/javascript, */*; q=0.01"
				}
			}).then(res => {
				const hc = cheerio.load(res.data.html)
				const medias = []
				hc('figure').each(function (a, b) {
					const url = hc(b).find('img').attr('src')
					medias.push(url)
				})
				const hasil = {
					title: hc('h1').text(),
					profile_pic: hc('img').attr('src'),
					medias: medias
				}
				resolve(hasil)
			}).catch(reject)
		}).catch(reject)
	})
}

function scdl(url) {
	return new Promise(async (resolve, reject) => {
		await axios.request({
			url: "https://www.klickaud.co/download.php",
			method: "POST",
			data: new URLSearchParams(Object.entries({'value': url, 'afae4540b697beca72538dccafd46ea2ce84bec29b359a83751f62fc662d908a' : '2106439ef3318091a603bfb1623e0774a6db38ca6579dae63bcbb57253d2199e'})),
			headers: {
				"content-type": "application/x-www-form-urlencoded",
				"user-agent": "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36"
			}
		}).then(res => {
			const $ = cheerio.load(res.data)
			const result = {
				link: $('#dlMP3').attr('onclick').split(`downloadFile('`)[1].split(`',`)[0],
				thumb: $('#header > div > div > div.col-lg-8 > div > table > tbody > tr > td:nth-child(1) > img').attr('src'),
				title: $('#header > div > div > div.col-lg-8 > div > table > tbody > tr > td:nth-child(2)').text()

			}
			resolve(result)
		}).catch(reject)
   })
}

function anonfiledl(url) {
	return new Promise((resolve, reject) => {
		if (!/https?:\/\//.test(url)) return reject('Invalid url!')
		axios.get(url).then(({ data }) => {
			let $ = cheerio.load(data)
			let title = $('title').text().replace('- AnonFiles', '').trim()
			let size = $('#download-url').text().split('\n')[1].replace(/ /g, '').replace(/\(|\)/g, '')
			let link = $('#download-url').attr('href')
			link = encodeURI(link)
			resolve({ title, size, link })
		}).catch(reject)
	})
}

function sfiledl(url) {
	return new Promise((resolve, reject) => {
		if (!/https?:\/\//.test(url)) return reject('Invalid url!')
		axios.get(url).then(({ data }) => {
			let $ = cheerio.load(data)
			let title = $('div.w3-row-padding').find('b').text().trim()
			let size = $('#download').text().replace(/download file/i, '').replace(/\(|\)/g, '').trim()
			let link = $('#download').attr('href') + '&k=' + Math.floor(Math.random() * (15 - 10 + 1) + 10)
			resolve({ title, size, link })
		}).catch(reject)
	})
}

function sfilesearch(query, page = 1) {
	return new Promise((resolve, reject) => {
		axios.get(`https://sfile.mobi/search.php?q=${query}&page=${page}`).then(({ data }) => {
			let $ = cheerio.load(data)
			let result = []
			$('div.list').each(function(i, e) {
				let title = $(e).find('a').text()
				let size = $(e).text().trim().split('(')[1]
				let link = $(e).find('a').attr('href')
				if (link !== undefined) result.push({ title, size: size.replace(')', ''), link })
			})
			resolve(result)
		}).catch(reject)
	})
}


function stickerDl(url) {
	return new Promise((resolve, reject) => {
		axios.get(url).then(res => {
			const $ = cheerio.load(res.data)
			const link = []
			const main = $('#stickerPack > div > div.row > div > img')

			main.each( function() {
				const result_link = $(this).attr('src').split('&d=')[0]
				const result_thumb = $('#intro > div > div > img').attr('src')
				const result_title = $('#intro > div > div > h1').text()
				link.push(result_link)	
				const result = {
					title: result_title,
					thumb: result_thumb,
					result: link
				}
			resolve(result)
			})
		}).catch(resolve)
	})
}

function pixivDl(id, ext) {
	return new Promise((resolve, reject) => {
		const result = 'https://pixiv.cat/'+id+ext
		resolve(result)
	})
}

function xnxxDl(URL) {
	return new Promise((resolve, reject) => {
		fetch(`${URL}`, {method: 'get'})
		.then(res => res.text())
		.then(res => {
			let $ = cheerio.load(res, {
				xmlMode: false
			});
			const title = $('meta[property="og:title"]').attr('content');
			const videoScript = $('#video-player-bg > script:nth-child(6)').html();
			const files = {
				low: (videoScript.match('html5player.setVideoUrlLow\\(\'(.*?)\'\\);') || [])[1],
				high: videoScript.match('html5player.setVideoUrlHigh\\(\'(.*?)\'\\);' || [])[1],
			};
			resolve({ title, files })
		 }).catch(reject)
	})
}

function musicaldown(URL) {
    return new Promise((resolve, rejecet) => {
        axios.get('https://musicaldown.com/id', {
            headers: {
                'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            }
        }).then(res => {
            const $ = cheerio.load(res.data)
            const url_name = $("#link_url").attr("name")
            const token_name = $("#submit-form > div").find("div:nth-child(1) > input[type=hidden]:nth-child(2)").attr("name")
            const token_ = $("#submit-form > div").find("div:nth-child(1) > input[type=hidden]:nth-child(2)").attr("value")
            const verify = $("#submit-form > div").find("div:nth-child(1) > input[type=hidden]:nth-child(3)").attr("value")
            let data = {
                [`${url_name}`]: URL,
                [`${token_name}`]: token_,
                verify: verify
            }
        axios.request({
            url: 'https://musicaldown.com/id/download',
            method: 'post',
            data: new URLSearchParams(Object.entries(data)),
            headers: {
                'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
                'cookie': res.headers["set-cookie"]
            }
        }).then(respon => {
            const ch = cheerio.load(respon.data)
        axios.request({
            url: 'https://musicaldown.com/id/mp3',
            method: 'post',
            headers: {
                'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
                'cookie': res.headers["set-cookie"]
            }
        }).then(resaudio => { 
            const hc = cheerio.load(resaudio.data)       
            const result = {
                video: ch('body > div.welcome.section > div').find('div:nth-child(2) > div.col.s12.l8 > a:nth-child(4)').attr('href'),
                audio: hc('body > div.welcome.section > div > div:nth-child(2) > div.col.s12.l8 > a:nth-child(4)').attr('href'),
                nowm: ch('body > div.welcome.section > div > div:nth-child(2) > div.col.s12.l8 > a:nth-child(6)').attr('href'),
                video_original: ch('body > div.welcome.section > div > div:nth-child(2) > div.col.s12.l8 > a:nth-child(8)').attr('href'),
                audio_original: hc('body > div.welcome.section > div > div:nth-child(2) > div.col.s12.l8 > a:nth-child(8)').attr('href'),
                preview: ch('body > div.welcome.section > div > div:nth-child(2) > div.col.s12.l4 > img').attr('src')
            }
        resolve(result)
      })
    })
  })
})
}

function zippyshare(urls) {
    return new Promise((resolve, reject) => {
        axios.get(urls).then(({ data }) => {
            const $ = cheerio.load(data)
            const li = $.html()
            const po = $('#dlbutton').next().html()
            const le = po.split(';')[0]
            const lo = le.split("document.getElementById('dlbutton').href =")[1]
            const result = `${urls.split('/v')[0]}${eval(lo)}`
            const ho = $('#lrbox').text().replace(/\n/g, '')
			const hasil = {
                nama: ho.split('Name:')[1].split('Size:')[0].trim(),
                ukuran: ho.split('Size:')[1].split('Uploaded:')[0].trim(),
                up_at: ho.split('Uploaded:')[1].split('          ')[0].trim(),
                link: result
            }
            resolve(hasil)
        })
    })
}

function getLatestAnime() {
	return new Promise((resolve, reject) => {
		axios.get('https://www.mynimeku.com/').then(({ data }) => {
			let $ = cheerio.load(data)
			let result = []
			$('div.flexbox-item > a').each(function(i, e) {
				let title = $(e).attr('title')
				let link = $(e).attr('href')
				let status = $(e).find('div.flexbox-status').text()
				let thumb = $(e).find('div.flexbox-thumb > img').attr('data-src')
				let episode = $(e).find('div.flexbox-episode > span.eps').text().split(' ')[1]
				let type = $(e).find('div.flexbox-type').text()
				result.push({ title, status, episode, type, thumb, link })
			})
			resolve(result)
		}).catch(reject)
	})
}

function getLatestKomik() {
	return new Promise((resolve, reject) => {
		axios.get('https://www.mynimeku.com/').then(({ data }) => {
			let $ = cheerio.load(data)
			let result = []
			$('div.flexbox4-item').each(function(i, e) {
				let title = $(e).find('a').attr('title')
				let link = $(e).find('a').attr('href')
				let thumb = $(e).find('div.flexbox4-thumb > img').attr('data-src')
				let type = $(e).find('div.flexbox4-type').text()
				let status = $(e).find('div.flexbox-status').text()
				let chapter = $(e).find('ul.chapter > li').text().split(' ')[1]
				result.push({ title, status, chapter, type, thumb, link })
			})
			resolve(result)
		}).catch(reject)
	})
}

function kusoNime(query) {
    return new Promise(async (resolve, reject) => {
      const optionsGet = {
        method: 'GET',
        headers: {
           'user-agent': 'Mozilla/5.0 (Linux; Android 9; Redmi 7A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.99 Mobile Safari/537.36'
        }
    }
    const getHtml = await fetch('https://kusonime.com/?s=' + query + '&post_type=anime', optionsGet).then(rsp => rsp.text())
    const $ = cheerio.load(getHtml)
    const url = []
    $('div > div > ul > div > div > div').each(function() {
      url.push($(this).find('a').attr('href'))
    })
    const randomUrl = url[Math.floor(Math.random() * url.length)]
    const getHtml2 = await fetch(randomUrl, optionsGet).then(rsp => rsp.text())
    const $$ = cheerio.load(getHtml2)
    resolve({
      status: 200,
      result: {
        title: $$('.vezone > .venser').find('.jdlz').text(),
        thumb: $$('.vezone > .venser').find('div > img').attr('src'),
        views: $$('.vezone > .venser').find('div > div > span').text().trim().replace(' Views', ''),
        genre: $$('.vezone > .venser').find('.lexot > .info > p').eq(1).text().replace('Genre : ', ''),
        seasons: $$('.vezone > .venser').find('.lexot > .info > p').eq(2).text().replace('Seasons : ', ''),
        producers: $$('.vezone > .venser').find('.lexot > .info > p').eq(3).text().replace('Producers: ', ''),
        type: $$('.vezone > .venser').find('.lexot > .info > p').eq(4).text().replace('Type: ', ''),
        status: $$('.vezone > .venser').find('.lexot > .info > p').eq(5).text().replace('Status: ', ''),
        rating: $$('.vezone > .venser').find('.lexot > .info > p').eq(7).text().replace('Score: ', ''),
        duration: $$('.vezone > .venser').find('.lexot > .info > p').eq(8).text().replace('Duration: ', ''),
        release: $$('.vezone > .venser').find('.lexot > .info > p').eq(9).text().replace('Released on: ', ''),
        desc: $$('.vezone > .venser').find('p').eq(10).text(),
        url: randomUrl
      }
    })
  })
}

function doujindesuSearch(query) {
	return new Promise((resolve, reject) => {
		axios.get(`https://doujindesu.xxx/?s=${query}`).then(({ data }) => {
			let $ = cheerio.load(data)
			let result = []
			$('div.animposx').each(function(i, e) {
				let title = $(e).find('div.title').text().trim()
				let score = $(e).find('div.score').text().trim()
				let type = $(e).find('div.type').text().replace(/Publishing|Finished/i, '')
				let status = $(e).find('div.type').text().replace(/Manhwa|Manga|Doujinshi/i, '')
				let thumb = $(e).find('img').attr('src')
				let link = $(e).find('a').attr('href')
				result.push({ title, score, type, status, thumb, link })
			})
			resolve(result)
		}).catch(reject)
	})
}

function doujindesuDl(url) {
	return new Promise((resolve, reject) => {
		axios.get(url).then(({ data }) => {
			let $ = cheerio.load(data)
			let title = $('div.lm').find('h1').text().replace('.', '').trim()
			let link_dl = $('div.chright').find('a').attr('href')
			let image = []
			$('div.reader-area> img').each(function(a, b) {
				image.push($(b).attr('src'))
			})
			resolve({ title, link_dl, image })
		}).catch(reject)
	})
}

function doujindesuLatest() {
	return new Promise((resolve, reject) => {
		axios.get(`https://doujindesu.xxx/`).then(({ data }) => {
			let $ = cheerio.load(data)
			let result = []
			$('div.animposx').each(function(a, b) {
				let title = $(b).find('a').attr('alt')
				let chapter = $(b).find('div.plyepisode').find('a').text().trim()
				let type = $(b).find('div.type').text()
				let score = $(b).find('div.score').text().trim()
				let thumb = $(b).find('img').attr('src')
				let link = $(b).find('div.plyepisode').find('a').attr('href')
				result.push({ title, chapter, type, score, thumb, link })
			})
			resolve(result)
		}).catch(reject)
	})
}

function mynimeSearch(query) {
	return new Promise((resolve, reject) => {
		axios.get(`https://www.mynimeku.com/?s=${query}`).then(({ data }) => {
			let $ = cheerio.load(data)
			let result = []
			$('div.flexbox2-item').each(function(i, e) {
				let title = $(e).find('a').attr('title')
				let link = $(e).find('a').attr('href')
				let studio = $(e).find('span.studio').text() || '-'
				let type = $(e).find('div.type').text()
				let score = $(e).find('div.info > div.score').text().trim()
				let season = $(e).find('div.season > a').text() || '-'
				let synopsis = $(e).find('div.synops').text()
				let thumb = $(e).find('div.flexbox2-thumb > img').attr('src')
				result.push({ title, type, score, season, studio, synopsis, thumb, link })
			})
			resolve(result)
		}).catch(reject)
	})
}

function getInfoAnime(url) {
	return new Promise((resolve, reject) => {
		axios.get(url).then(({ data }) => {
			let $ = cheerio.load(data)
			let title = $('div.series-titlex').find('h2').text()
			let type = $('span.type').text()
			let status = $('span.status').text()
			let score = $('div.series-infoz.score > span').text()
			let premiered = $('div.series-info > ul > li:nth-child(3) > span').text().trim()
			let studios = $('div.series-info > ul > li:nth-child(4) > span').text().trim()
			let english = $('div.series-info > ul > li:nth-child(6) > span').text()
			let japanese = $('div.series-title > span').text()
			let genre = $('div.series-genres > a').text()
			let synopsis = $('div.series-synops > p').text()
			let thumb = $('div.series-thumb > img').attr('src')
			let list_eps = []
			$('div.flexeps-infoz > a').each(function(a, b) {
				list_eps.push({ title: $(b).attr('title'), link: $(b).attr('href') })
			})
			resolve({ title, japanese, english, type, status, score, premiered, studios, genre, synopsis, thumb, list_eps })
		}).catch(reject)
	})
}

function getLatestHanime() {
	return new Promise((resolve, reject) => {
		let url = 'https://hanime.tv'
		axios.get(url).then(({ data }) => {
			let $ = cheerio.load(data)
			let result = []
			$('div.elevation-3').each(function(a, b) {
				let title = $(b).find('a').attr('alt')
				let link = url + $(b).find('a').attr('href')
				result.push({ title, link })
			})
			resolve(result)
		}).catch(reject)
	})
}

function artinama(nama) {
	return new Promise((resolve, reject) => {
		axios.get('http://www.primbon.com/arti_nama.php?nama1='+nama+'&proses=+Submit%21+').then(res => {
		const $ = cheerio.load(res.data)
		const r = $('#body').text();
		const re = r.split('\n      \n        \n        \n')[0]
		const result = re.trim()
		resolve(result)
		})
	})
}

function artimimpi(mimpi) {
    return new Promise((resolve, reject) => {
       axios.get(`https://www.primbon.com/tafsir_mimpi.php?mimpi=${mimpi}&submit=+Submit+`)
          .then(({
              data
        }) => {
        const $ = cheerio.load(data)
        const detect = $('#body > font > i').text()
        const isAva = /Tidak ditemukan/g.test(detect) ? false : true
        if (isAva) {
            const isi = $('#body').text().split(`Hasil pencarian untuk kata kunci: ${mimpi}`)[1].replace(/\n\n\n\n\n\n\n\n\n/gi, '\n')
            const res = {
                status: 200,
                result: isi
             }
             resolve(res)
         } else {
            const res = {
                 status: 404,
                 result: `Arti Mimpi ${mimpi} Tidak Di Temukan`
              }
              resolve(res)
           }
       })
     .catch(reject)
  })
}

function ramalanJodoh(nama, pasangan) {
	return new Promise((resolve, reject) => {
		axios.get('https://www.primbon.com/kecocokan_nama_pasangan.php?nama1='+nama+'&nama2='+pasangan+'&proses=+Submit%21+').then(res => {
		const $ = cheerio.load(res.data)
		const thumb = 'https://www.primbon.com/'+$('#body > img').attr('src')
		const isi = $('#body').text().split(pasangan)[1].replace('< Hitung Kembali','').split('\n')[0]
      		const positif = isi.split('Sisi Negatif Anda: ')[0].replace('Sisi Positif Anda: ','')
      		const negatif = isi.split('Sisi Negatif Anda: ')[1]
      		const result = {
      			thumb: thumb,
      			positif: positif,
      			negatif: negatif
      		}
      		resolve(result)
		})

	})
}

function konachan(q) {
	return new Promise((resolve, reject) => {
		let query = q.replace(/ /g, '_')
		axios.get('https://konachan.net/post?tags='+query+'+').then(res => {
			const $ = cheerio.load(res.data)
			const aray = []
			$('div.pagination > a').each(function(a, b) {
				const u = $(b).text()
				aray.push(u)
				let math = Math.floor(Math.random() * aray.length)
				axios.get('https://konachan.net/post?page='+math+'&tags='+query+'+').then(respon => {
					const ch = cheerio.load(respon.data)
					const result = []
					ch('#post-list > div.content > div:nth-child(4) > ul > li > a.directlink.largeimg').each(function(c, d) {
						const r = $(d).attr('href')
						result.push(r)
					})
					resolve(result)
				}).catch(reject)
			})
		}).catch(reject)
	})
}

function happymodSearch(query) {
	return new Promise((resolve, reject) => {
		const baseUrl = 'https://www.happymod.com/'
		axios.get(baseUrl+'search.html?q='+query).then(async res => {
		var $ = cheerio.load(res.data)
		const hasil = []
		$("div.pdt-app-box").each(function(c, d) {
			var title = $(d).find("a").text().trim();
			var icon = $(d).find("img.lazy").attr('data-original');
			var rating = $(d).find("span").text();
			var link = baseUrl+$(d).find("a").attr('href');
			hasil.push({
				title,
				icon,
				link,
				rating
			})
	})
		resolve(hasil)
		console.log(hasil)
	}).catch(reject)
})
}

function searchIlust(query) {
	return new Promise((resolve, reject) => { 
		axios.get('https://api.lolicon.app/setu/v2?&size=regular&num=100&keyword='+query).then(res => {
			const result = res.data.data
      if (result.length < 1) {
          throw 'Hasil tidak di temukan!'
      } else {
        resolve(result)
      }
		})
	})
}

function stickerSearch(query) {
	return new Promise((resolve, reject) => {
		axios.get('https://getstickerpack.com/stickers?query='+query).then(res => {
			const $ = cheerio.load(res.data)
			const result = []
			const main = $('#stickerPacks > div > div:nth-child(3) > div > a')

			main.each( function() {
				const url = $(this).attr('href')
				const title = $(this).find('div > span').text()
				result.push({ title, url })
			})
			resolve(result)
		}).catch(reject)
	})
}

function xnxxSearch(query) {
	return new Promise((resolve, reject) => {
		const baseurl = 'https://www.xnxx.com'
		fetch(`${baseurl}/search/${query}/${Math.floor(Math.random() * 3) + 1}`, {method: 'get'})
		.then(res => res.text())
		.then(res => {
			let $ = cheerio.load(res, {
				xmlMode: false
			});
			let title = [];
			let url = [];
			let desc = [];
			let results = [];

			$('div.mozaique').each(function(a, b) {
				$(b).find('div.thumb').each(function(c, d) {
					url.push(baseurl+$(d).find('a').attr('href').replace("/THUMBNUM/", "/"))
				})
			})
			$('div.mozaique').each(function(a, b) {
				$(b).find('div.thumb-under').each(function(c, d) {
					desc.push($(d).find('p.metadata').text())
					$(d).find('a').each(function(e,f) {
					    title.push($(f).attr('title'))
					})
				})
			})
			for (let i = 0; i < title.length; i++) {
				results.push({
					title: title[i],
					info: desc[i],
					link: url[i]
				})
			}
			resolve({
				status: 200,
				result: results
			})
		})
		.catch(err => reject({ code: 503, status: false, result: err }))
	})
}

function alphacoders(query) {
    return new Promise((resolve, reject) => {
        axios.get('https://wall.alphacoders.com/search.php?search='+query).then(res => {
            const $ = cheerio.load(res.data)
            const result = []
            $('div.boxgrid > a > picture').each(function(a, b) {
                result.push($(b).find('img').attr('src').replace('thumbbig-', ''))
            })
            resolve(result)
        }).catch(reject)
    })
}

function wallpapercave(query) {
    return new Promise((resolve, reject) => {
		axios.get('https://wallpapercave.com/search?q='+query).then(res => {
				const $ = cheerio.load(res.data)
				const result = [];
				$('div.imgrow > a').each(function(a, b) {
					if (!$(b).find('img').attr('src').includes('.gif')) {
						result.push('https://wallpapercave.com/' + $(b).find('img').attr('src').replace('fuwp', 'uwp'))
					}
				})
				resolve(result)
			}).catch(reject)
	})
}


async function _tebakgambar() {
	return new Promise((resolve, reject) => {
		axios.get('https://jawabantebakgambar.net/all-answers/').then(res => {
			const $ = cheerio.load(res.data)
			const result = []
			$('#images > li > a').each(function(a, b) {
				const img = 'https://jawabantebakgambar.net'+$(b).find('img').attr('data-src')
				const jawaban = $(b).find('img').attr('alt').replace('Jawaban ', '')
				result.push({ img, jawaban })
			})
			resolve(result)
		}).catch(reject)
	})
}

async function tebakgambar() {
	return new Promise(async(resolve, reject) => {
		let ctrl = await _tebakgambar()
		let ct = await  ctrl[Math.floor(Math.random() * ctrl.length)]
		resolve(ct)
	})
}

function ghstalk(username) {
    url= `https://api.github.com/users/${username}`; 
    return axios.get(url).then(({ data }) => {
    return data
})
}

function herodetails(name) {
    return new Promise((resolve, reject) => {
        var splitStr = name.toLowerCase().split(' ');
        for (var i = 0; i < splitStr.length; i++) {
              splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
            }
              const que = splitStr.join(' ')
              axios.get('https://mobile-legends.fandom.com/wiki/' + que)
               .then(({ data }) => {
                       const $ = cheerio.load(data)
                       let mw = []
                       let attrib = []
                       let skill = []
                       const name = $('#mw-content-text > div > div > div > div > div > div > table > tbody > tr > td > table > tbody > tr > td > font > b').text() 
                       $('.mw-headline').get().map((res) => {
                            const mwna = $(res).text()
                            mw.push(mwna)
                       })
                       $('#mw-content-text > div > div > div > div > div > div > table > tbody > tr > td').get().map((rest) => {
                            const haz = $(rest).text().replace(/\n/g,'')
                            attrib.push(haz)
                       })
                       $('#mw-content-text > div > div > div > div > div > div > table > tbody > tr > td > div.progressbar-small.progressbar > div').get().map((rest) => {
                            skill.push($(rest).attr('style').replace('width:',''))
                       })
                       axios.get('https://mobile-legends.fandom.com/wiki/' + que + '/Story')
                       .then(({ data }) => {
                            const $ = cheerio.load(data)
                            let pre = []
                            $('#mw-content-text > div > p').get().map((rest) => {
                                 pre.push($(rest).text())
                            })
                            const story = pre.slice(3).join('\n')
                            const items = []
                            const character = []
                            $('#mw-content-text > div > aside > section > div').get().map((rest) => {
                                 character.push($(rest).text().replace(/\n\t\n\t\t/g, '').replace(/\n\t\n\t/g,'').replace(/\n/g,''))
                            })
                            $('#mw-content-text > div > aside > div').get().map((rest) => {
                                 items.push($(rest).text().replace(/\n\t\n\t\t/g, '').replace(/\n\t\n\t/g,'').replace(/\n/g,''))
                            })
                            const img = $('#mw-content-text > div > aside > figure > a').attr('href')
                            const chara = character.slice(0,2)
                            const result = { 
                                 hero_name: name + ` ( ${mw[0].replace('CV:',' CV:')} )`,
                                 entrance_quotes: attrib[2].replace('Entrance Quotes','').replace('\n',''),
                                 hero_feature: attrib[attrib.length - 1].replace('Hero Feature',''),
                                 image: img,
                                 items: items,
                                 character: {
                                      chara
                                 },
                                 attributes: {
                                      movement_speed: attrib[12].replace('● Movement Speed',''),
                                      physical_attack: attrib[13].replace('● Physical Attack',''),
                                      magic_power: attrib[14].replace('● Magic Power',''),
                                      attack_speed: attrib[15].replace('● Attack Speed',''),
                                      physical_defense: attrib[16].replace('● Physical Defense',''),
                                      magic_defense: attrib[17].replace('● Magic Defense',''),
                                      basic_atk_crit_rate: attrib[18].replace('● Basic ATK Crit Rate',''),
                                      hp: attrib[19].replace('● HP',''),
                                      mana: attrib[20].replace('● Mana',''),
                                      ability_crit_rate: attrib[21].replace('● Ability Crit Rate',''),
                                      hp_regen: attrib[22].replace('● HP Regen',''),
                                      mana_regen: attrib[23].replace('● Mana Regen','')
                                 },
                                 price: {
                                      battle_point: mw[1].split('|')[0].replace(/ /g,''),
                                      diamond: mw[1].split('|')[1].replace(/ /g,''),
                                      hero_fragment: mw[1].split('|')[2] ? mw[1].split('|')[2].replace(/ /g,'') : 'none'
                                 },
                                 role: mw[2],
                                 skill: {
                                      durability: skill[0],
                                      offense: skill[1],
                                      skill_effects: skill[2],
                                      difficulty: skill[3]
                                 },
                                 speciality: mw[3],
                                 laning_recommendation: mw[4],
                                 release_date: mw[5],
                                 background_story: story
                            }
                            resolve(result)
                       }).catch((e) => reject({ status: 404, message: e.message }))
                  }).catch((e) => reject({ status: 404, message: e.message }))
             })
        }
 
function herolist(){
    return new Promise((resolve, reject) => {
            axios.get('https://mobile-legends.fandom.com/wiki/Mobile_Legends:_Bang_Bang_Wiki')
             .then(({ data }) => {
                      const $ = cheerio.load(data)
                      let data_hero = []
                      let url = []
                      $('div > div > span > span > a').get().map((result) => {
                          const name = decodeURIComponent($(result).attr('href').replace('/wiki/',''))
                          const urln = 'https://mobile-legends.fandom.com' + $(result).attr('href')
                          data_hero.push(name)
                          url.push(urln)
                       })
                    resolve({ status: 200, hero: data_hero })
                }).catch((e) => reject({ status: 404, message: e.message }))
           })
      }
      
function akanekoApi(param) {
	return new Promise(async(resolve, reject) => {
		const data = await axios.get('https://akaneko-api.herokuapp.com/api/'+param)
		resolve(data.data.url)
	})
}

async function twitterdl(url) {
	let payload = { url, submit: '' }
	let res = await fetch('https://www.expertsphp.com/instagram-reels-downloader.php', {
		method: 'POST',
		body: new URLSearchParams(Object.entries(payload)),
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
			cookie: '_ga=GA1.2.783835709.1637038175; __gads=ID=5b4991618655cd86-22e2c7aeadce00ae:T=1637038176:RT=1637038176:S=ALNI_MaCe3McPrVVswzBEqcQlgnVZXtZ1g; _gid=GA1.2.1817576486.1639614645; _gat_gtag_UA_120752274_1=1',
			origin: 'https://www.expertsphp.com',
			referer: 'https://www.expertsphp.com/twitter-video-downloader.html',
			'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
		}
	})
	let $ = cheerio.load(await res.text())
	let results = []
	$('table.table > tbody > tr').each(function () {
		let quality = $(this).find('td').eq(2).find('strong').text()
		let type = $(this).find('td').eq(1).find('strong').text()
		let url = $(this).find('td').eq(0).find('a[href]').attr('href')
		let isVideo = /video/i.test(type)
		results.push({ quality, type, url, isVideo })
	})
	return results
}

async function snaptik(url) {
	let results = {}
	if (/v[tm]\.tiktok\.com/g.test(url)) {
		let res = await axios.get(url)
		url = res.request.res.responseUrl
	}
	let res = await axios.get(`https://api.snaptik.site/video-key?video_url=${url}`)
	let key = JSON.parse(JSON.stringify(res.data, null, 2))
	if (key.status !== 'success') throw key
	let res2 = await axios.get(`https://api.snaptik.site/video-details-by-key?key=${key.data.key}`)
	let data = JSON.parse(JSON.stringify(res2.data, null, 2))
	if (data.status !== 'success') throw data
	results = {
		author: { ...data.data.author },
		description: data.data.description,
		video: {
			watermark: `https://api.snaptik.site/download?key=${data.data.video.with_watermark}&type=video`,
			no_watermark: `https://api.snaptik.site/download?key=${data.data.video.no_watermark}&type=video`,
			no_watermark_raw: data.data.video.no_watermark_raw
		},
		music: `https://api.snaptik.site/download?key=${data.data.music}&type=music`
	}
    return results
}

function KomikDl(url) {
	return new Promise((resolve, reject) => {
		axios.get(url).then(({ data }) => {
			let $ = cheerio.load(data)
			let title = $('title').text().replace('Bahasa Indonesia - MyNimeku', '').trim()
			let result = []
			$('div.reader-area > p > img').each(function () {
				result.push($(this).attr('src'))
			})
			resolve({ title, result })
		}).catch(reject)
	})
}

function AnimeDl(url) {
	return new Promise((resolve, reject) => {
		axios.get(url).then(({ data }) => {
			let $ = cheerio.load(data)
			let title = $('title').text()
			let thumb = $('meta[property="og:image"]').attr('content')
			let url = $('#linklist').find('a').attr('href')
			resolve({ title, thumb, url })
		}).catch(reject)
	})
}

async function telesticker(url) {
    return new Promise(async (resolve, reject) => {
        const packName = url.replace("https://t.me/addstickers/", "")
        const data = await axios(`https://api.telegram.org/bot891038791:AAHWB1dQd-vi0IbH2NjKYUk-hqQ8rQuzPD4/getStickerSet?name=${encodeURIComponent(packName)}`, {method: "GET",headers: {"User-Agent": "GoogleBot"}})
        const hasil = []
        for (let i = 0; i < data.data.result.stickers.length; i++) {
            fileId = data.data.result.stickers[i].thumb.file_id
            data2 = await axios(`https://api.telegram.org/bot891038791:AAHWB1dQd-vi0IbH2NjKYUk-hqQ8rQuzPD4/getFile?file_id=${fileId}`)
            result = {
               status: 200,
               url: "https://api.telegram.org/file/bot891038791:AAHWB1dQd-vi0IbH2NjKYUk-hqQ8rQuzPD4/" + data2.data.result.file_path
            }
            hasil.push(result)
        }
       resolve(hasil)
    })
}

function ttdownloader(url){
	return new Promise(async(resolve, reject) => {
		axios.get('https://ttdownloader.com/',{
			headers: {
				"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
				"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
				"cookie": "PHPSESSID=9ut8phujrprrmll6oc3bist01t; popCookie=1; _ga=GA1.2.1068750365.1625213061; _gid=GA1.2.842420949.1625213061"
			}
		})
		.then(({ data }) => {
			const $ = cheerio.load(data)
			let token = $('#token').attr('value')
			let config = {
				'url': url,
				'format': '',
				'token': token
			}
		axios('https://ttdownloader.com/req/',{
			method: 'POST',
			data : new URLSearchParams(Object.entries(config)),
			headers: {
				"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
				"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
				"cookie": "PHPSESSID=9ut8phujrprrmll6oc3bist01t; popCookie=1; _ga=GA1.2.1068750365.1625213061; _gid=GA1.2.842420949.1625213061"
			}
			})
		.then(({ data }) => {
			const $ = cheerio.load(data)
			resolve({
				nowm: $('div:nth-child(2) > div.download > a').attr('href'),
				wm: $('div:nth-child(3) > div.download > a').attr('href'),
				audio: $('div:nth-child(4) > div.download > a').attr('href')
				})
			})
		})
	.catch(reject)
	})
}

function WattpadUser(query) {
    return new Promise((resolve, reject) => {
        axios.get(`https://www.wattpad.com/user/${query}`)
            .then(({
                data
            }) => {
                const $ = cheerio.load(data)
                $('#app-container > div > header ').each(function(a, b) {
                    $('#profile-about > div > div ').each(function(c, d) {
                    result = {
                    username: $(b).find('> div.badges > h1').text().trim(),
                    works: $(b).find('> div.row.header-metadata > div:nth-child(1) > p:nth-child(1)').text(),
                    reading_list: $(b).find('> div.row.header-metadata > div.col-xs-4.scroll-to-element > p:nth-child(1)').text(),
                    followers: $(b).find('> div.row.header-metadata > div.col-xs-4.on-followers > p.followers-count').text(),
                    joined: $(d).find('> ul > li.date.col-xs-12.col-sm-12 > span').text().trim().replace('Joined',''),
                    pp_picture: `https://img.wattpad.com/useravatar/${query}.128.851744.jpg`,
                    about: $(d).find('> div.description > pre').text() ? $(d).find('> div.description > pre').text() : 'Not found'
                }
                resolve(result)
                })
                })
            })
            .catch(reject)
    })
}

async function whois(domain = 'lolhuman.xyz') {
  return new Promise((resolve, reject) => {
    var options = { 
      method: 'POST',
      url: 'https://www.hostinger.co.id/whois',
      headers: { 
        'content-type': 'application/x-www-form-urlencoded'
      },
      form: { 
        domain: `${domain}`, 
        submit: 'search' 
      }
    };

    request(options, async function (error, response, body) {
      if (error) throw new Error(error);
      const result = JSON.parse(body);
      resolve({
        result: result["domain"]
      });
    });
  });
}

function domainSearch(query) {
	return new Promise((res, rej) => {
		axios(`https://www.domainesia.com/domain/?domain=${query}`).then(c => {
			let $ = cheerio.load(c.data)
			let result = []
			$('div.results_domain').get().map(v => {
				let domain = $(v).attr('id')
				let price = $(v).text().trim().split(' ')[0]
				if (domain !== undefined && price !== '') result.push({ domain: domain.replace('result_', query + '.'), price })
			})
			res(result)
		}).catch(rej)
	})
}

function getLatest(type, page = 1) {
	return new Promise((resolve, reject) => {
		const baseURL = 'https://nekopoi.care'
		if (/hentai/i.test(type)) {
			axios.get(`${baseURL}/category/hentai/page/${page}`).then(({ data }) => {
				let $ = cheerio.load(data)
				let result = []
				$('div.top').each(function(i, e) {
					let title = $(e).find('a').text()
					let desc = $(e).find('p:nth-child(2)').text().trim() || $(e).find('h2:nth-child(1)').text().trim()
					let thumb = $(e).find('img').attr('src')
					let link = $(e).find('a').attr('href')
					result.push({ title, desc, thumb, link })
				})
				resolve(result)
			}).catch(reject)
		} else if (/3dhentai/i.test(type)) {
			axios.get(`${baseURL}/category/3d-hentai/page/${page}`).then(({ data }) => {
				let $ = cheerio.load(data)
				let result = []
				$('div.top').each(function(i, e) {
					let title = $(e).find('a').text()
					let thumb = $(e).find('img').attr('src')
					let link = $(e).find('a').attr('href')
					result.push({ title, thumb, link })
				})
				resolve(result)
			}).catch(reject)
		} else if (/jav/i.test(type)) {
			axios.get(`${baseURL}/category/jav/page/${page}`).then(({ data }) => {
				let $ = cheerio.load(data)
				let result = []
				$('div.top').each(function(i, e) {
					let title = $(e).find('a').text()
					let thumb = $(e).find('img').attr('src')
					let link = $(e).find('a').attr('href')
					result.push({ title, thumb, link })
				})
				resolve(result)
			}).catch(reject)
		} else if (/javcosplay/i.test(type)) {
			axios.get(`${baseURL}/category/jav-cosplay/page/${page}`).then(({ data }) => {
				let $ = cheerio.load(data)
				let result = []
				$('div.top').each(function(i, e) {
					let title = $(e).find('a').text()
					let thumb = $(e).find('img').attr('src')
					let link = $(e).find('a').attr('href')
					result.push({ title, thumb, link })
				})
				resolve(result)
			}).catch(reject)
		} else {
			axios.get(`${baseURL}/page/${page}`).then(({ data }) => {
				let $ = cheerio.load(data)
				let result = []
				$('div.eropost').each(function(i, e) {
					let title = $(e).find('h2').text().trim()
					let release_date = $(e).find('span:nth-child(2)').text().trim()
					let thumb = $(e).find('img').attr('src')
					let link = $(e).find('a').attr('href')
					result.push({ title, release_date, thumb, link })
				})
				resolve(result)
			}).catch(reject)
		}
	})
}

module.exports.pinterest = pinterest
module.exports.pinterestdl = pinterestdl
module.exports.mediafireDl = mediafireDl
module.exports.igDownload = igDownload
module.exports.igStory = igStory
module.exports.scdl = scdl
module.exports.anonfiledl = anonfiledl
module.exports.sfiledl = sfiledl
module.exports.sfilesearch = sfilesearch
module.exports.stickerDl = stickerDl
module.exports.pixivDl = pixivDl
module.exports.xnxxDl = xnxxDl
module.exports.musicaldown = musicaldown
module.exports.zippyshare = zippyshare
module.exports.getLatestKomik = getLatestKomik
module.exports.getLatestAnime = getLatestAnime
module.exports.kusoNime = kusoNime
module.exports.doujindesuSearch = doujindesuSearch
module.exports.doujindesuDl = doujindesuDl
module.exports.doujindesuLatest = doujindesuLatest
module.exports.mynimeSearch = mynimeSearch
module.exports.getInfoAnime = getInfoAnime
module.exports.getLatestHanime = getLatestHanime
module.exports.artinama = artinama
module.exports.artimimpi = artimimpi
module.exports.ramalanJodoh = ramalanJodoh
module.exports.konachan = konachan
module.exports.happymodSearch = happymodSearch
module.exports.searchIlust = searchIlust
module.exports.stickerSearch = stickerSearch
module.exports.xnxxSearch = xnxxSearch
module.exports.alphacoders = alphacoders
module.exports.wallpapercave = wallpapercave
module.exports.tebakgambar = tebakgambar
module.exports.ghstalk =  ghstalk
module.exports.herodetails = herodetails
module.exports.herolist = herolist
module.exports.akanekoApi = akanekoApi
module.exports.twitterdl = twitterdl
module.exports.snaptik = snaptik
module.exports.KomikDl = KomikDl
module.exports.AnimeDl = AnimeDl
module.exports.telesticker = telesticker
module.exports.WattpadUser = WattpadUser
module.exports.whois = whois
module.exports.domainSearch = domainSearch
module.exports.getLatest = getLatest
module.exports.ttdownloader = ttdownloader
