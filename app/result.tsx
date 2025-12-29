import React, { useEffect, useState } from "react";
import { ScrollView, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function ResultPage() {
  const { scannedText } = useLocalSearchParams<{ scannedText?: string }>();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (scannedText) {
      fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: scannedText })
      })
        .then(res => res.json())
        .then(setResult)
        .catch(console.error);
    }
  }, [scannedText]);

  if (!result) return <ActivityIndicator style={{ flex:1 }} size="large" />;

  return (
    <ScrollView style={{ flex:1, padding:20 }}>
      <Text style={{ fontSize:22, fontWeight:"bold" }}>Résultat du vin</Text>
      <Text>Maturité: {result.maturity}</Text>
      <Text>Apogée: {result.peak}</Text>
      <Text>Valeur: {result.value}</Text>
      <Text>Dégustation:</Text>
      <Text>- Température: {result.tasting.temperature}</Text>
      <Text>- Carafage: {result.tasting.decanting}</Text>
      <Text>- Verre: {result.tasting.glass}</Text>
      <Text>Profil (0-10):</Text>
      {Object.entries(result.profile_scores).map(([k, v]) => (
        <Text key={k}>- {k}: {String(v)}</Text>
      ))}
      <Text>Notes de dégustation: {result.tasting_notes}</Text>
      <Text>Accords mets-vins:</Text>
      {result.pairings.map((p:string) => <Text key={p}>- {p}</Text>)}
    </ScrollView>
  );
}
