// /api/analyze.js
export default async function handler(req, res) {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });

  const PROMPT = `
Tu es un sommelier professionnel.
Analyse le vin à partir de ce texte d’étiquette :
${text}
Fournis un JSON structuré avec :
- maturity
- peak
- value
- tasting: temperature, decanting, glass
- profile_scores: intensité, structure, tanins, acidité, complexité, potentiel_garde
- tasting_notes
- pairings
`;

  // URL du modèle LLaMA 2 sur HF Router
  const HF_URL = "https://router.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf";

  try {
    const response = await fetch(HF_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: PROMPT,
        parameters: { max_new_tokens: 600, temperature: 0.4 }
      })
    });

    const data = await response.json();

    if (data.error) {
      // fallback règles intelligentes si HF indisponible
      const fallback = runRuleBasedAnalysis(text);
      return res.json({ source: "rules", ...fallback });
    }

    const resultText = data[0]?.generated_text || data.generated_text || "";
    let parsed;
    try {
      parsed = JSON.parse(resultText);
    } catch {
      // si le LLM ne renvoie pas JSON parfait, renvoyer texte brut
      parsed = { source: "llm", raw: resultText };
    }

    res.json(parsed);

  } catch (err) {
    const fallback = runRuleBasedAnalysis(text);
    res.json({ source: "rules", ...fallback, error: err.message });
  }
}

/* ---------------------------
   Moteur de règles intelligentes
---------------------------- */
function runRuleBasedAnalysis(text) {
  const currentYear = new Date().getFullYear();
  const yearMatch = text.toLowerCase().match(/19\d{2}|20\d{2}/);
  const year = yearMatch ? parseInt(yearMatch[0]) : null;
  const age = year ? currentYear - year : null;

  let maturity = "Inconnue", peak = "Non déterminée";
  if (age !== null) {
    if (age < 3) { maturity = "Trop jeune"; peak = `${year+5} – ${year+10}`; }
    else if (age < 10) { maturity = "À maturité"; peak = "Maintenant – 5 ans"; }
    else { maturity = "Évolué"; peak = "À boire sans tarder"; }
  }

  let pairings = text.toLowerCase().includes("bordeaux")
    ? ["Bœuf grillé","Agneau rôti","Fromages affinés"]
    : ["Viandes grillées","Plats en sauce"];

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
