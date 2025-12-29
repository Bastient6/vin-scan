import React, { useState } from "react";
import { View, Text, Button, Alert } from "react-native";
import { useRouter } from "expo-router";

export default function Home() {
  const [scannedText, setScannedText] = useState("");
  const router = useRouter();

  const handleScan = () => {
    const fakeText = "Bordeaux 2019";
    setScannedText(fakeText);
    Alert.alert("Scan terminé", fakeText);
    // Rediriger vers page de résultat si tu veux
    router.push("/result"); 
  };

  return (
    <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
      <Text style={{ fontSize:20, marginBottom:20 }}>Scanner l’étiquette de vin</Text>
      <Button title="Scanner" onPress={handleScan} />
      {scannedText ? <Text style={{ marginTop:20 }}>Texte détecté: {scannedText}</Text> : null}
    </View>
  );
}
