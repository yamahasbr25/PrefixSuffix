document.addEventListener('DOMContentLoaded', function() {

    // --- Pengaturan Sitemap ---
    const MAX_URLS_LIMIT = 5000;
    const FILENAME = 'sitemap.xml';

    // --- Elemen DOM ---
    const generateBtn = document.getElementById('generate-btn');
    const statusOutput = document.getElementById('status-output');
    const startIndexInput = document.getElementById('start-index');
    const endIndexInput = document.getElementById('end-index');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');

    // --- ▼▼▼ FUNGSI BANTUAN DITAMBAHKAN DI SINI ▼▼▼ ---
    function capitalizeEachWord(str) {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    function generateSeoTitle(baseKeyword) {
        const hookWords = ['Best', 'Amazing', 'Cool', 'Inspiring', 'Creative', 'Awesome', 'Stunning', 'Beautiful', 'Unique', 'Ideas', 'Inspiration', 'Designs'];
        const randomHook = hookWords[Math.floor(Math.random() * hookWords.length)];
        const randomNumber = Math.floor(Math.random() * (200 - 55 + 1)) + 55;
        const capitalizedKeyword = capitalizeEachWord(baseKeyword);
        return `${randomNumber} ${randomHook} ${capitalizedKeyword}`;
    }
    
    // Fungsi untuk menghindari error pada karakter spesial di XML (contoh: &)
    function escapeXml(unsafe) {
        return unsafe.replace(/[<>&'"]/g, function (c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
        });
    }

    /**
     * ▼▼▼ FUNGSI GENERATOR SITEMAP (DIMODIFIKASI) ▼▼▼
     * Menghasilkan sitemap dengan tambahan informasi gambar.
     */
    function generateSitemapXml(keywordList, siteUrl, startDate, postsPerDay) {
        // Header Sitemap XML dengan tambahan namespace untuk gambar: xmlns:image
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

        keywordList.forEach((keyword, index) => {
            if (!keyword) return;

            // Logika distribusi tanggal tetap sama
            const dayOffset = Math.floor(index / postsPerDay);
            const postDate = new Date(startDate);
            postDate.setDate(postDate.getDate() + dayOffset);
            const randomHour = Math.floor(Math.random() * 24);
            const randomMinute = Math.floor(Math.random() * 60);
            const randomSecond = Math.floor(Math.random() * 60);
            postDate.setUTCHours(randomHour, randomMinute, randomSecond);
            const lastmod = postDate.toISOString();

            const keywordForUrl = keyword.replace(/\s/g, '-').toLowerCase();
            const pageUrl = `${siteUrl}/detail.html?q=${encodeURIComponent(keywordForUrl)}`;

            // Siapkan data untuk blok gambar
            const imageUrl = `https://tse1.mm.bing.net/th?q=${encodeURIComponent(keyword)}`;
            const imageTitle = generateSeoTitle(keyword);

            xml += '  <url>\n';
            xml += `    <loc>${pageUrl}</loc>\n`;
            xml += `    <lastmod>${lastmod}</lastmod>\n`;
            xml += '    <changefreq>daily</changefreq>\n';
            xml += '    <priority>0.7</priority>\n';
            
            // ▼▼▼ BLOK INFORMASI GAMBAR DITAMBAHKAN DI SINI ▼▼▼
            xml += '    <image:image>\n';
            xml += `        <image:loc>${imageUrl}</image:loc>\n`;
            xml += `        <image:title>${escapeXml(imageTitle)}</image:title>\n`;
            xml += '    </image:image>\n';
            
            xml += '  </url>\n';
        });

        xml += '</urlset>';
        return xml;
    }

    // --- Logika Utama Saat Tombol Diklik (Tidak ada perubahan signifikan di sini) ---
    generateBtn.addEventListener('click', async () => {
        let startNum = parseInt(startIndexInput.value, 10);
        let endNum = parseInt(endIndexInput.value, 10);
        const startDateVal = startDateInput.value;
        const endDateVal = endDateInput.value;

        if (!startDateVal || !endDateVal) {
            statusOutput.textContent = 'Error: Please select both a Start Date and an End Date.';
            statusOutput.style.color = 'red';
            return;
        }
        if (isNaN(startNum) || isNaN(endNum) || startNum < 1 || endNum < startNum) {
            statusOutput.textContent = 'Error: Invalid keyword number range.';
            statusOutput.style.color = 'red';
            return;
        }
        if ((endNum - startNum + 1) > MAX_URLS_LIMIT) {
             endNum = startNum + MAX_URLS_LIMIT - 1;
             endIndexInput.value = endNum;
             statusOutput.textContent = `Warning: The range was capped at the maximum limit of ${MAX_URLS_LIMIT} URLs.`;
             statusOutput.style.color = 'orange';
        } else {
             statusOutput.textContent = 'Status: Waiting for action...';
             statusOutput.style.color = '#333';
        }

        try {
            generateBtn.disabled = true;
            generateBtn.textContent = 'Generating...';
            statusOutput.textContent = 'Status: Fetching data...';

            const domainResponse = await fetch('domain.txt');
            if (!domainResponse.ok) throw new Error('Could not find domain.txt file.');
            const siteUrl = (await domainResponse.text()).trim().replace(/\/$/, '');
            if (!siteUrl) throw new Error('domain.txt file is empty.');

            const keywordResponse = await fetch('keyword.txt');
            if (!keywordResponse.ok) throw new Error('Could not find keyword.txt file.');
            let allKeywords = await keywordResponse.text();
            allKeywords = allKeywords.split('\n').filter(k => k.trim() !== '');

            if (startNum > allKeywords.length) throw new Error(`Start number (${startNum}) is greater than total keywords (${allKeywords.length}).`);

            const keywordSelection = allKeywords.slice(startNum - 1, endNum);
            const diffTime = Math.abs(new Date(endDateVal) - new Date(startDateVal));
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            const postsPerDay = Math.ceil(keywordSelection.length / diffDays);

            statusOutput.textContent = `Status: Generating sitemap with ${keywordSelection.length} URLs and images...`;

            const sitemapXml = generateSitemapXml(keywordSelection, siteUrl, new Date(startDateVal), postsPerDay);

            const blob = new Blob([sitemapXml], { type: 'application/xml;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = FILENAME;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            statusOutput.textContent = `Status: Success! ${FILENAME} has been generated and download has started.`;
            statusOutput.style.color = 'green';
        } catch (error) {
            console.error('Sitemap Generation Error:', error);
            statusOutput.textContent = `Error: ${error.message}`;
            statusOutput.style.color = 'red';
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate & Download sitemap.xml';
        }
    });
    
    const today = new Date().toISOString().slice(0, 10);
    startDateInput.value = today;
    endDateInput.value = today;
});