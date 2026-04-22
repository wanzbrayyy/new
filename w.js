const puppeteer = require('puppeteer');

async function scrapeSpotify(query) {
    // Jalankan browser (headless: true artinya browser berjalan di latar belakang)
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();

    // Set User Agent agar tidak terlihat seperti bot
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

    try {
        const searchUrl = `https://open.spotify.com/search/${encodeURIComponent(query)}`;
        console.log(`Membuka: ${searchUrl}...`);
        
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });

        // Tunggu elemen daftar lagu muncul (selector ini bisa berubah sewaktu-waktu oleh Spotify)
        const trackSelector = '[data-testid="tracklist-row"]';
        await page.waitForSelector(trackSelector, { timeout: 10000 });

        // Ambil data dari elemen-elemen di halaman tersebut
        const results = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('[data-testid="tracklist-row"]'));
            
            return items.slice(0, 5).map(item => {
                const titleElement = item.querySelector('div[role="gridcell"] img')?.closest('div.grid').nextElementSibling?.querySelector('a') || item.querySelector('a[data-testid="internal-track-link"]');
                const artistElement = item.querySelector('a[href*="/artist/"]');
                const albumElement = item.querySelector('a[href*="/album/"]');
                
                return {
                    judul: titleElement?.innerText || 'Tidak ditemukan',
                    artis: artistElement?.innerText || 'Tidak ditemukan',
                    album: albumElement?.innerText || 'Tidak ditemukan',
                    link: titleElement?.href || ''
                };
            });
        });

        console.log("Hasil Scraping:");
        console.table(results);

    } catch (error) {
        console.error("Terjadi kesalahan:", error.message);
    } finally {
        await browser.close();
    }
}

// Jalankan pencarian
scrapeSpotify('Tulus - Hati Hati di Jalan');