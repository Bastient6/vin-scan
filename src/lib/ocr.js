import Tesseract from "tesseract.js";

export async function scanImage(file) {
  const { data: { text } } = await Tesseract.recognize(file, "fra", {
    logger: m => console.log(m),
  });
  return text;
}
