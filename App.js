import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ScanScreen from "./screens/ScanScreen";
import ResultScreen from "./screens/ResultScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Scan" component={ScanScreen} />
        <Stack.Screen name="Résultat" component={ResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
