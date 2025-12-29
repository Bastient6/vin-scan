export default function handler(req, res) {
  const text = req.body.text.toLowerCase();
  const yearMatch = text.match(/19\d{2}|20\d{2}/);
  const year = yearMatch ? parseInt(yearMatch[0]) : null;

  const age = year ? new Date().getFullYear() - year : null;

  let maturity = "Inconnue";
  let peak = "Non déterminée";

  if (age !== null) {
    if (age < 3) {
      maturity = "Trop jeune";
      peak = `${year + 5} - ${year + 10}`;
    } else if (age < 10) {
      maturity = "À maturité";
      peak = "Maintenant";
    } else {
      maturity = "Évolué";
      peak = "À boire";
    }
  }

  const pairings = [];
  if (text.includes("bordeaux")) {
    pairings.push("Bœuf", "Agneau", "Fromages affinés");
  } else {
    pairings.push("Viandes grillées", "Plats en sauce");
  }

  res.json({
    maturity,
    peak,
    value: "15–30 € (estimation)",
    profile: "Fruité, structuré, tanins présents",
    pairings
  });
}
