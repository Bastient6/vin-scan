import Tesseract from "tesseract.js";

export async function scanImage(fileUri: string) {
  const { data: { text } } = await Tesseract.recognize(fileUri, "fra", {
    logger: m => console.log(m)
  });
  return text;
}
