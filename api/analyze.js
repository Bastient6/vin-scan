export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  const PROMPT = `
Tu es œnologue et sommelier professionnel.

À partir du texte d’étiquette de vin suivant, fournis :
1. Maturité actuelle
2. Fenêtre de consommation (début / apogée / fin)
3. Valeur estimée
4. Conseils de dégustation (température, carafage)
5. Profil gustatif noté sur 10
6. Description gustative
7. Accords mets & vins

Si une information manque, fais une hypothèse réaliste et précise-le.

Texte de l’étiquette :
${text}
`;

  try {
    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: PROMPT,
          parameters: {
            max_new_tokens: 600,
            temperature: 0.4,
            return_full_text: false
          }
        })
      }
    );

    const result = await hfResponse.json();

    // Gestion des erreurs HF (cold start, rate limit)
    if (result.error) {
      return res.status(503).json({
        error: "Model temporarily unavailable",
        details: result.error
      });
    }

    res.json({
      analysis: result[0].generated_text
    });

  } catch (err) {
    res.status(500).json({ error: "Inference failed", details: err.message });
  }
}
