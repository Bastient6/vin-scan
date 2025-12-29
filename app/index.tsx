import React, { useState } from "react";
import { View, Text, Button, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { scanImage } from "../lib/ocr";
import { useRouter } from "expo-router";

export default function ScanPage() {
  const [scannedText, setScannedText] = useState("");
  const router = useRouter();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const text = await scanImage(uri);
      setScannedText(text);
      Alert.alert("Scan terminé", text);
      router.push({ pathname: "/result", params: { scannedText: text } });
    }
  };

  return (
    <View style={{ flex:1, justifyContent:"center", alignItems:"center", padding:20 }}>
      <Text style={{ fontSize:20, marginBottom:20 }}>Scanner l’étiquette de vin</Text>
      <Button title="Choisir une image" onPress={pickImage} />
      {scannedText ? <Text style={{ marginTop:20 }}>Texte détecté: {scannedText}</Text> : null}
    </View>
  );
}
