// Pour Node.js Express
const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());

app.post('/api/analyze', async (req, res) => {
  const { text } = req.body;
  
  try {
    // Option A: Hugging Face
    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_API_KEY}`, // Optionnel
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: `Tu es un expert sommelier. Analyse ce vin: "${text}". Réponds uniquement en JSON avec: maturity, peak, value, tasting{temperature, decanting, glass}, profile_scores{corps, tanins, acidite, fruits, complexite}, tasting_notes, pairings`,
          parameters: {
            max_new_tokens: 800,
            temperature: 0.7
          }
        })
      }
    );
    
    const data = await response.json();
    const result = data[0]?.generated_text || data.generated_text;
    
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));