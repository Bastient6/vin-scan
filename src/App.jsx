import { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Simulate OCR - in production, use Tesseract.js or similar
  const scanImage = async (file) => {
    // For demo purposes, return sample text
    // In production: use Tesseract.js
    return "Château Margaux 2015 Margaux Premier Grand Cru Classé";
  };

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;

    setFile(f);
    setError("");
    setResult(null);
    
    // Create preview
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
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Tu es un expert sommelier. Analyse ce vin à partir des informations suivantes : "${scannedText}"

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans commentaires) avec cette structure exacte :
{
  "maturity": "string décrivant la maturité actuelle",
  "peak": "période d'apogée estimée",
  "value": "estimation de valeur",
  "tasting": {
    "temperature": "température en °C",
    "decanting": "durée de carafage recommandée",
    "glass": "type de verre recommandé"
  },
  "profile_scores": {
    "corps": nombre 0-10,
    "tanins": nombre 0-10,
    "acidité": nombre 0-10,
    "fruits": nombre 0-10,
    "complexité": nombre 0-10
  },
  "tasting_notes": "description des arômes et saveurs",
  "pairings": ["accord1", "accord2", "accord3"]
}`
            }
          ]
        })
      });

      const data = await response.json();
      const textContent = data.content?.find(c => c.type === "text")?.text || "";
      
      // Parse JSON from response
      let parsedResult;
      try {
        // Remove markdown code blocks if present
        const cleanJson = textContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsedResult = JSON.parse(cleanJson);
      } catch (parseErr) {
        // If JSON parsing fails, create a basic structure
        parsedResult = {
          maturity: "Information non disponible",
          peak: "Information non disponible",
          value: "Information non disponible",
          tasting: {
            temperature: "16-18°C",
            decanting: "1-2 heures",
            glass: "Verre à Bordeaux"
          },
          profile_scores: {
            corps: 7,
            tanins: 6,
            acidité: 5,
            fruits: 7,
            complexité: 8
          },
          tasting_notes: textContent.slice(0, 200),
          pairings: ["Viandes rouges", "Fromages affinés", "Plats en sauce"]
        };
      }

      setResult(parsedResult);
    } catch (err) {
      throw new Error("Impossible de contacter le service d'analyse");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold mb-2 text-center text-purple-900">
          🍷 Vin Scan Web
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Scannez l'étiquette de votre vin pour une analyse détaillée
        </p>

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
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
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
              {/* Maturity & Value */}
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

              {/* Tasting Guide */}
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

              {/* Flavor Profile */}
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

              {/* Tasting Notes */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Notes de dégustation
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {result.tasting_notes}
                </p>
              </div>

              {/* Food Pairings */}
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