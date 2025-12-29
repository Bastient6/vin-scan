import fetch from "node-fetch";

export default async function handler(req, res) {
  const text = req.body.text;

  try {
    // Appel LLM gratuit Hugging Face Router
    const response = await fetch(
      "https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: `Analyse ce vin avec ces informations : ${text}. 
                  Donne maturité, date d'apogée, valeur actuelle, conseils de dégustation (température, carafage), profil gustatif sur 10 et mets adaptés.`
        }),
      }
    );

    const data = await response.json();
    const result = data?.generated_text || "Impossible d'analyser le vin";

    res.status(200).json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur LLM" });
  }
}
