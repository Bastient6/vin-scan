// api/analyze.js
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
    const response = await fetch(
      "https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: PROMPT, parameters: { max_new_tokens: 500 } }),
      }
    );

    const data = await response.json();

    // Hugging Face renvoie du texte → on essaye de parser JSON
    let parsed;
    try {
      parsed = JSON.parse(data[0]?.generated_text || data.generated_text);
    } catch {
      parsed = runRuleBasedAnalysis(text); // fallback local
    }

    res.json(parsed);
  } catch (err) {
    res.json({ source: "rules", ...runRuleBasedAnalysis(text), error: err.message });
  }
}

// fallback simple
function runRuleBasedAnalysis(text) {
  const yearMatch = text.toLowerCase().match(/19\d{2}|20\d{2}/);
  const year = yearMatch ? parseInt(yearMatch[0]) : null;
  const age = year ? new Date().getFullYear() - year : null;

  let maturity = "Inconnue", peak = "Non déterminée";
  if (age !== null) {
    if (age < 3) maturity = "Trop jeune", peak = `${year+5} – ${year+10}`;
    else if (age < 10) maturity = "À maturité", peak = "Maintenant – 5 ans";
    else maturity = "Évolué", peak = "À boire";
  }

  const pairings = text.toLowerCase().includes("bordeaux")
    ? ["Bœuf grillé", "Agneau rôti", "Fromages affinés"]
    : ["Viandes grillées", "Plats en sauce"];

  return {
    maturity,
    peak,
    value: "15–30 € (estimation)",
    tasting: { temperature: "16–18°C", decanting: "Oui – 1h", glass: "Verre à vin rouge" },
    profile_scores: { intensité: 7, structure: 7, tanins: 6, acidité: 5, complexité: 6, potentiel_garde: 7 },
    tasting_notes: "Nez fruité, bouche équilibrée, finale agréable.",
    pairings
  };
}
