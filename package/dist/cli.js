#!/usr/bin/env node
import { NHentai } from "./index.js";
import fs from "fs";
import path from "path";
const args = process.argv.slice(2);
if (args.length === 0) {
    console.log(`Usage: nhentai <command> [options]

Commands:
  search <query> [page]         Cari doujin
  get <id>                      Detail doujin
  random                        Doujin random
  download <id> [format]        Download doujin (format: pdf | zip, default: pdf)

Examples:
  nhentai search vanilla 1
  nhentai get 177013
  nhentai random
  nhentai download 177013 pdf
`);
    process.exit(0);
}
const nhentai = new NHentai();
const cmd = args[0];
const rest = args.slice(1);
(async () => {
    try {
        switch (cmd) {
            case "search": {
                const query = rest[0];
                if (!query)
                    throw new Error("❌ Masukkan query pencarian");
                const page = parseInt(rest[1]) || 1;
                const res = await nhentai.search(query, { page });
                console.log(`🔎 Hasil pencarian "${query}" (halaman ${page}):\n`);
                res.data.forEach((doujin, i) => {
                    console.log(`${i + 1}. ${doujin.title}`);
                    console.log(`   📕 ID: ${doujin.id}`);
                    console.log(`   🌐 URL: ${doujin.url}`);
                    console.log(`   🏷️ Tags: ${(doujin.tags ?? []).slice(0, 5).join(", ") || "N/A"}\n`);
                });
                break;
            }
            case "get": {
                const id = rest[0];
                if (!id)
                    throw new Error("❌ Masukkan ID doujin");
                const doujin = await nhentai.getDoujin(id);
                console.log(`📕 ${doujin.title}`);
                console.log(`   ID: ${doujin.id}`);
                console.log(`   Pages: ${doujin.images?.length ?? 0}`);
                console.log(`   Languages: ${(doujin.languages ?? []).join(", ") || "N/A"}`);
                console.log(`   Tags: ${(doujin.tags ?? []).join(", ") || "N/A"}`);
                console.log(`   Artists: ${(doujin.artists ?? []).join(", ") || "N/A"}`);
                console.log(`   Groups: ${(doujin.groups ?? []).join(", ") || "N/A"}`);
                console.log(`   Categories: ${(doujin.categories ?? []).join(", ") || "N/A"}`);
                console.log(`   URL: ${doujin.url}`);
                break;
            }
            case "random": {
                const doujin = await nhentai.getRandom();
                console.log(`🎲 Random Doujin:`);
                console.log(`📕 ${doujin.title}`);
                console.log(`   ID: ${doujin.id}`);
                console.log(`   Pages: ${doujin.images?.length ?? 0}`);
                console.log(`   Languages: ${(doujin.languages ?? []).join(", ") || "N/A"}`);
                console.log(`   URL: ${doujin.url}`);
                break;
            }
            case "download": {
                const id = rest[0];
                const format = (rest[1] || "pdf").toLowerCase();
                if (!id)
                    throw new Error("❌ Masukkan ID doujin");
                console.log(`⬇️ Downloading doujin ${id} as ${format.toUpperCase()}...`);
                const doujin = await nhentai.getDoujin(id);
                const outputDir = path.resolve(process.cwd(), "downloads");
                if (!fs.existsSync(outputDir))
                    fs.mkdirSync(outputDir);
                if (format === "zip") {
                    const zipBuffer = await doujin.images.zip();
                    const outPath = path.join(outputDir, `${id}.zip`);
                    fs.writeFileSync(outPath, zipBuffer);
                    console.log(`✅ Saved to ${outPath}`);
                }
                else {
                    const pdfBuffer = await doujin.images.PDF();
                    const outPath = path.join(outputDir, `${id}.pdf`);
                    fs.writeFileSync(outPath, pdfBuffer);
                    console.log(`✅ Saved to ${outPath}`);
                }
                break;
            }
            default:
                console.log(`❌ Unknown command: ${cmd}`);
        }
    }
    catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
})();
