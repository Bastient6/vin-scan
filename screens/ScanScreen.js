import { View, Text, Button } from "react-native";
import * as ImagePicker from "expo-image-picker";
import Tesseract from "tesseract.js";
import axios from "axios";
import { useState } from "react";

export default function ScanScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const scanLabel = async () => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 1
    });

    if (!result.canceled) {
      setLoading(true);

      const { data } = await Tesseract.recognize(
        result.assets[0].uri,
        "fra"
      );

      const response = await axios.post(
        "https://vin-scan-tau.vercel.app/api/analyze",
        { text: data.text }
      );

      setLoading(false);
      navigation.navigate("Résultat", { analysis: response.data });
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 26 }}>🍷 Scan d’étiquette</Text>
      <Button title="Scanner" onPress={scanLabel} />
      {loading && <Text>Analyse en cours...</Text>}
    </View>
  );
}
