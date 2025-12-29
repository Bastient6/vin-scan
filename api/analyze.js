export default async function handler(req, res) {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });

  const PROMPT = `
Tu es un sommelier expert.
Analyse ce vin depuis l’étiquette:
${text}

Retourne un JSON avec:
- maturity
- peak
- value
- tasting: temperature, decanting, glass
- profile_scores: intensité, structure, tanins, acidité, complexité, potentiel_garde
- tasting_notes
- pairings
`;

  try {
    const response = await fetch("https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: PROMPT, parameters: { max_new_tokens: 500 } })
    });

    const data = await response.json();

    // Hugging Face renvoie du texte brut → on essaye de parser
    let parsed;
    try {
      parsed = JSON.parse(data[0].generated_text || data.generated_text);
    } catch {
      parsed = runRuleBasedAnalysis(text); // fallback si LLM échoue
    }

    res.json(parsed);
  } catch (err) {
    res.json({ source: "rules", ...runRuleBasedAnalysis(text), error: err.message });
  }
}
