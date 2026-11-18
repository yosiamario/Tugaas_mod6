import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View, Platform } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { enableScreens } from "react-native-screens";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { MonitoringScreen } from "./src/screens/MonitoringScreen.js";
import { ControlScreen } from "./src/screens/ControlScreen.js";
import { ProfileScreen } from "./src/screens/ProfileScreen.js";
import { CustomSplash } from "./src/components/CustomSplash.js";
import { assertConfig } from "./src/services/config.js";
import { tokens } from "./src/theme/tokens.js";

const Tab = createBottomTabNavigator();
const { color } = tokens;

const TAB_ICONS = {
  Monitoring: "pulse",
  Control: "options",
  Profil: "person-circle",
};

enableScreens(true);

// Hold the native splash until the first frame is laid out, then hand over to
// the custom animated splash rendered inside the app.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    assertConfig();
  }, []);

  const handleRootLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: color.bg,
      card: color.surface,
      text: color.text,
      border: color.border,
      primary: color.primary,
    },
  };

  return (
    <SafeAreaProvider>
      <View style={styles.root} onLayout={handleRootLayout}>
        <NavigationContainer theme={theme}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: true,
              headerTitle: "LiveTemp",
              headerTitleAlign: "left",
              headerTintColor: color.text,
              headerStyle: {
                backgroundColor: color.surface,
                borderBottomWidth: 1,
                borderBottomColor: color.border,
              },
              headerTitleStyle: {
                fontWeight: "600",
                fontSize: 17,
                // ponytail: system monospace, no custom font dep
                fontFamily: "monospace",
                letterSpacing: -0.5,
              },
              tabBarActiveTintColor: color.primary,
              tabBarInactiveTintColor: color.text2,
              tabBarLabelStyle: {
                fontSize: 12,
                lineHeight: 16,
                // react-native-web measures the label box smaller than the line
                // box, which clips the glyphs; pin the height to the line box.
                height: 16,
                fontWeight: "500",
              },
              tabBarStyle: {
                backgroundColor: color.surface,
                borderTopWidth: 1,
                borderTopColor: color.border,
                // web has no safe-area inset, so the bar needs the extra height
                // for the icon + label stack to avoid shrinking the label
                ...(Platform.OS === "web"
                  ? { height: 76, paddingTop: 6, paddingBottom: 8 }
                  : null),
              },
              tabBarHideOnKeyboard: true,
              tabBarIcon: ({ color: iconColor }) => {
                const iconName = TAB_ICONS[route.name] ?? "ellipse";
                return <Ionicons name={iconName} size={24} color={iconColor} />;
              },
            })}
          >
            <Tab.Screen name="Monitoring" component={MonitoringScreen} />
            <Tab.Screen name="Control" component={ControlScreen} />
            <Tab.Screen
              name="Profil"
              component={ProfileScreen}
              options={{ headerTitle: "Profil Kelompok" }}
            />
          </Tab.Navigator>
        </NavigationContainer>

        {splashVisible ? (
          <CustomSplash onFinish={() => setSplashVisible(false)} />
        ) : null}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.bg,
  },
});
