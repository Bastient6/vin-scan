import { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useBackend, setUseBackend] = useState(false);

  // Simulate OCR - in production, use Tesseract.js
  const scanImage = async (file) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return "Château Margaux 2015 Margaux Premier Grand Cru Classé";
  };

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;

    setFile(f);
    setError("");
    setResult(null);
    
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(f);

    setLoading(true);
    
    try {
      const scannedText = await scanImage(f);
      setText(scannedText);
      await fetchResult(scannedText);
    } catch (err) {
      setError("Erreur lors de l'analyse: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchResult = async (scannedText) => {
    try {
      let response;
      
      if (useBackend) {
        // Option 1: Appel via votre backend Node.js
        response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: scannedText })
        });
      } else {
        // Option 2: Utiliser OpenRouter (proxy CORS-friendly pour LLMs gratuits)
        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
          },
          body: JSON.stringify({
            model: "meta-llama/llama-3.2-3b-instruct:free",
            messages: [
              {
                role: "user",
                content: `Tu es un expert sommelier. Analyse ce vin: "${scannedText}"

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans texte avant ou après) avec cette structure exacte:
{
  "maturity": "description de la maturité actuelle",
  "peak": "période d'apogée estimée (ex: 2025-2035)",
  "value": "estimation de valeur en euros (ex: 200-400€)",
  "tasting": {
    "temperature": "température de service (ex: 17-18°C)",
    "decanting": "durée de carafage (ex: 2 heures)",
    "glass": "type de verre (ex: Verre à Bordeaux)"
  },
  "profile_scores": {
    "corps": 7,
    "tanins": 8,
    "acidite": 6,
    "fruits": 7,
    "complexite": 9
  },
  "tasting_notes": "description détaillée des arômes et saveurs",
  "pairings": ["accord mets-vin 1", "accord 2", "accord 3"]
}`
              }
            ]
          })
        });
      }

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      let textContent = "";
      
      if (useBackend) {
        // Format de votre backend
        textContent = data.result || "";
      } else {
        // Format OpenRouter
        textContent = data.choices?.[0]?.message?.content || "";
      }
      
      if (!textContent) {
        throw new Error("Réponse vide du LLM");
      }
      
      let parsedResult;
      try {
        // Nettoyage du JSON
        let cleanJson = textContent
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        
        // Extraire uniquement le JSON s'il y a du texte avant/après
        const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanJson = jsonMatch[0];
        }
        
        parsedResult = JSON.parse(cleanJson);
        
        // Validation des champs requis
        if (!parsedResult.maturity) throw new Error("Champ maturity manquant");
        if (!parsedResult.peak) throw new Error("Champ peak manquant");
        if (!parsedResult.value) throw new Error("Champ value manquant");
        if (!parsedResult.tasting) throw new Error("Champ tasting manquant");
        if (!parsedResult.profile_scores) throw new Error("Champ profile_scores manquant");
        if (!parsedResult.tasting_notes) throw new Error("Champ tasting_notes manquant");
        if (!parsedResult.pairings) throw new Error("Champ pairings manquant");
        
      } catch (parseErr) {
        console.error("Erreur de parsing:", parseErr);
        console.log("Contenu brut:", textContent);
        
        // Analyse heuristique en fallback
        const year = scannedText.match(/\d{4}/)?.[0] || "2015";
        const age = 2025 - parseInt(year);
        const isPremium = /grand cru|premier|classé|réserve/i.test(scannedText);
        const isBordeaux = /margaux|pauillac|saint-émilion|pomerol|bordeaux/i.test(scannedText);
        
        parsedResult = {
          maturity: age < 5 ? "Jeune, encore sur le fruit" : age < 10 ? "En évolution, s'ouvrant progressivement" : "Mature et complexe",
          peak: `${parseInt(year) + 10}-${parseInt(year) + 20}`,
          value: isPremium ? "250-500€" : "50-120€",
          tasting: {
            temperature: isBordeaux ? "17-18°C" : "16-17°C",
            decanting: age < 5 ? "1 heure" : "2-3 heures",
            glass: "Verre à Bordeaux"
          },
          profile_scores: {
            corps: 8,
            tanins: isBordeaux ? 8 : 6,
            acidite: 6,
            fruits: 7,
            complexite: isPremium ? 9 : 7
          },
          tasting_notes: isBordeaux ? 
            "Bouquet complexe de fruits noirs mûrs (cassis, mûre), notes de cèdre, de tabac et d'épices douces. En bouche, structure tannique élégante et soyeuse, belle longueur avec une finale persistante." :
            "Arômes de fruits rouges et noirs, notes boisées et épicées. Bouche équilibrée avec des tanins souples et une belle persistance.",
          pairings: isBordeaux ? 
            ["Côte de bœuf grillée", "Magret de canard aux cèpes", "Comté 24 mois"] :
            ["Viandes rouges grillées", "Gibier en sauce", "Fromages affinés"]
        };
      }

      setResult(parsedResult);
    } catch (err) {
      console.error("Erreur complète:", err);
      throw new Error(err.message || "Impossible de contacter le service d'analyse");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold mb-2 text-center text-purple-900">
          🍷 Vin Scan Web
        </h1>
        <p className="text-center text-gray-600 mb-2">
          Scannez l'étiquette de votre vin pour une analyse détaillée
        </p>
        
        <div className="flex items-center justify-center gap-3 mb-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={useBackend}
              onChange={(e) => setUseBackend(e.target.checked)}
              className="rounded"
            />
            Utiliser mon backend local
          </label>
          <span className="text-xs text-gray-500">
            {useBackend ? "Backend: /api/analyze" : "OpenRouter (gratuit)"}
          </span>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <label className="block">
            <span className="sr-only">Choisir une photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
          </label>

          {preview && (
            <div className="mt-4">
              <img
                src={preview}
                alt="Aperçu"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}

          {loading && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
              <p className="mt-2 text-gray-600">Analyse en cours...</p>
              <p className="mt-1 text-xs text-gray-500">Peut prendre quelques secondes</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-semibold">❌ Erreur</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <div className="mt-3 text-xs text-gray-700 bg-gray-50 p-3 rounded">
                <p className="font-semibold mb-2">💡 Solutions:</p>
                <p className="mb-1">• Cochez "Utiliser mon backend local" et créez un fichier <code className="bg-gray-200 px-1">api/analyze.js</code></p>
                <p>• Ou attendez quelques secondes et réessayez (rate limit possible)</p>
              </div>
            </div>
          )}

          {text && !loading && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Texte détecté :
              </p>
              <p className="text-blue-800">{text}</p>
            </div>
          )}
        </div>

        {result && (
          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
              <h2 className="text-2xl font-bold text-white">
                Analyse du vin
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm font-semibold text-purple-900 mb-1">
                    Maturité
                  </p>
                  <p className="text-purple-800">{result.maturity}</p>
                </div>
                <div className="p-4 bg-pink-50 rounded-lg">
                  <p className="text-sm font-semibold text-pink-900 mb-1">
                    Apogée
                  </p>
                  <p className="text-pink-800">{result.peak}</p>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-semibold text-green-900 mb-1">
                  Valeur estimée
                </p>
                <p className="text-green-800 text-lg font-bold">{result.value}</p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Guide de dégustation
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Température</p>
                    <p className="font-semibold text-gray-900">
                      {result.tasting.temperature}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Carafage</p>
                    <p className="font-semibold text-gray-900">
                      {result.tasting.decanting}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Verre</p>
                    <p className="font-semibold text-gray-900">
                      {result.tasting.glass}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Profil gustatif
                </h3>
                <div className="space-y-2">
                  {Object.entries(result.profile_scores).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-gray-700">{key}</span>
                        <span className="font-semibold text-gray-900">
                          {value}/10
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                          style={{ width: `${value * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Notes de dégustation
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {result.tasting_notes}
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Accords mets-vins
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {result.pairings.map((pairing, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-amber-50 rounded-lg border border-amber-200"
                    >
                      <p className="text-amber-900 text-sm font-medium">
                        {pairing}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;