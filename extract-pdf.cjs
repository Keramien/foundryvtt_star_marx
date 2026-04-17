const fs = require("fs");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.mjs");

const files = [
  { src: "memory/start_marx_books/Star-Marx-le-jeu-de-role-edition-augmentee-numerique.pdf", out: "memory/start_marx_books/edition-augmentee.txt" },
  { src: "memory/start_marx_books/Star-Marx-le-guide-de-laventurier-des-mondes-imaginaires-numerique.pdf", out: "memory/start_marx_books/guide-aventurier.txt" },
  { src: "memory/start_marx_books/Star-Marx-le-jeu-de-role-KOSMOKULTOR-numerique.pdf", out: "memory/start_marx_books/kosmokultor.txt" }
];

async function extractPdf(src) {
  const data = new Uint8Array(fs.readFileSync(src));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  let allText = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str).join(" ");
    allText += `\n--- PAGE ${i} ---\n${text}\n`;
  }
  return { numPages: doc.numPages, text: allText };
}

async function run() {
  for (const f of files) {
    try {
      const { numPages, text } = await extractPdf(f.src);
      fs.writeFileSync(f.out, text);
      console.log(`${f.out} => ${numPages} pages, ${text.length} chars`);
    } catch (e) {
      console.error(`Error processing ${f.src}: ${e.message}`);
    }
  }
}

run();
