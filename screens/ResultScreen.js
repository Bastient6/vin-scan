import { ScrollView, Text } from "react-native";

export default function ResultScreen({ route }) {
  const { analysis } = route.params;

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 22 }}>🍷 Fiche Vin</Text>

      <Text>🕰️ Maturité : {analysis.maturity}</Text>
      <Text>📅 Apogée : {analysis.peak}</Text>
      <Text>💰 Valeur : {analysis.value}</Text>

      <Text>🍽️ Accords :</Text>
      {analysis.pairings.map((p, i) => (
        <Text key={i}>• {p}</Text>
      ))}

      <Text>👃 Profil :</Text>
      <Text>{analysis.profile}</Text>
    </ScrollView>
  );
}
