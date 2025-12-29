export default async function handler(req, res) {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });

  const PROMPT = `
Tu es œnologue et sommelier professionnel.
À partir du texte d’étiquette de vin suivant, fournis :
1. Maturité actuelle
2. Fenêtre de consommation
3. Valeur estimée
4. Conseils de dégustation
5. Profil gustatif noté sur 10
6. Description gustative
7. Accords mets & vins

Texte :
${text}
`;

  try {
    const response = await fetch(
      "https://router.huggingface.co/models/mistralai/Mistral-7B-Instruct",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: PROMPT })
      }
    );

    const data = await response.json();
    if (data.error) {
      return res.status(503).json({ error: data.error });
    }

    res.json({ analysis: data[0]?.generated_text || "Aucune réponse" });
  } catch (err) {
    res.status(500).json({ error: "Inference failed", details: err.message });
  }
}
