import { useState } from "react";
import { scanImage } from "./lib/ocr";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);

  const handleFile = async e => {
    const f = e.target.files[0];
    setFile(f);
    const scannedText = await scanImage(f);
    setText(scannedText);
    fetchResult(scannedText);
  };

  const fetchResult = async scannedText => {
    const res = await axios.post("/api/analyze", { text: scannedText });
    setResult(res.data);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">Vin Scan Web</h1>
      <input type="file" accept="image/*" onChange={handleFile} className="mb-4" />
      {text && <p className="mb-4">Texte détecté: {text}</p>}
      {result && (
        <div className="bg-white shadow p-4 rounded w-full max-w-xl">
          <h2 className="text-xl font-semibold mb-2">Résultat du vin</h2>
          <p>Maturité: {result.maturity}</p>
          <p>Apogée: {result.peak}</p>
          <p>Valeur: {result.value}</p>
          <p>Dégustation: Temp {result.tasting.temperature}, Carafage {result.tasting.decanting}, Verre {result.tasting.glass}</p>
          <p>Profil (0-10):</p>
          {Object.entries(result.profile_scores).map(([k,v]) => <p key={k}>- {k}: {v}</p>)}
          <p>Notes: {result.tasting_notes}</p>
          <p>Accords mets-vins:</p>
          {result.pairings.map(p => <p key={p}>- {p}</p>)}
        </div>
      )}
    </div>
  );
}

export default App;
