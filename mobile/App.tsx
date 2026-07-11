import "react-native-gesture-handler";
import React, { useEffect, useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { Bot, Receipt, LayoutDashboard, Wallet, LayoutTemplate, Settings, ArrowLeft } from "lucide-react-native";

// Context providers
import { AuthContext } from "./src/lib/auth-context";
import { CurrencyProvider } from "./src/lib/currency-context";
import { LanguageProvider, useLanguage } from "./src/lib/i18n/language-context";

// API & Token Helpers
import { getMe, getToken, clearToken, loadToken, type User } from "./src/lib/api";

// Screens
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import ChatScreen from "./src/screens/ChatScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import TransactionsScreen from "./src/screens/TransactionsScreen";
import WalletsScreen from "./src/screens/WalletsScreen";
import TemplatesScreen from "./src/screens/TemplatesScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Header matching web mobile TopBar exactly
function CustomHeader({ title, navigation }: { title: string; navigation: any }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 12, height: 56 + insets.top }]}>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity
        onPress={() => navigation.navigate("Settings")}
        style={styles.headerSettingsBtn}
        aria-label="Settings"
      >
        <Settings size={20} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

// Bottom Tabs Navigator
function MainTabs() {
  const { t } = useLanguage();

  const navLabel = (routeName: string): string => {
    switch (routeName) {
      case "Chat":
        return t.nav.chat;
      case "Transactions":
        return t.nav.transactions;
      case "Dashboard":
        return t.nav.dashboard;
      case "Wallets":
        return t.nav.wallets;
      case "Templates":
        return t.nav.templates;
      default:
        return "";
    }
  };

  return (
    <Tab.Navigator
      initialRouteName="Chat"
      screenOptions={({ route, navigation }) => ({
        tabBarIcon: ({ focused, color }) => {
          const iconSize = focused ? 26 : 22;
          switch (route.name) {
            case "Chat":
              return <Bot size={iconSize} color={color} strokeWidth={focused ? 2.5 : 2} />;
            case "Transactions":
              return <Receipt size={iconSize} color={color} strokeWidth={focused ? 2.5 : 2} />;
            case "Dashboard":
              return <LayoutDashboard size={iconSize} color={color} strokeWidth={focused ? 2.5 : 2} />;
            case "Wallets":
              return <Wallet size={iconSize} color={color} strokeWidth={focused ? 2.5 : 2} />;
            case "Templates":
              return <LayoutTemplate size={iconSize} color={color} strokeWidth={focused ? 2.5 : 2} />;
            default:
              return null;
          }
        },
        tabBarActiveTintColor: "#12876a", // brand-600 active color
        tabBarInactiveTintColor: "#94a3b8", // slate-400 inactive
        // Always stack the label directly under the icon (never beside it),
        // so wide viewports / tablets don't overlap the label onto the icon.
        tabBarLabelPosition: "below-icon",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#d9f7ec",
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        // Only the active tab shows its text label (below a slightly larger
        // icon); inactive tabs render icon-only for a cleaner, roomier bar.
        tabBarShowLabel: true,
        tabBarLabel: ({ focused }) =>
          focused ? (
            <Text style={styles.tabLabelActive} numberOfLines={1}>
              {navLabel(route.name)}
            </Text>
          ) : null,
        header: () => {
          let title = t.topbar.chat;
          if (route.name === "Transactions") title = t.topbar.transactions;
          else if (route.name === "Dashboard") title = t.topbar.dashboard;
          else if (route.name === "Wallets") title = t.topbar.walletsLoans;
          else if (route.name === "Templates") title = t.topbar.templates;
          return <CustomHeader title={title} navigation={navigation} />;
        },
      })}
    >
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Wallets" component={WalletsScreen} />
      <Tab.Screen name="Templates" component={TemplatesScreen} />
    </Tab.Navigator>
  );
}

// Internal app shell that has access to contexts
function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, loading: langLoading } = useLanguage();

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me);
    } catch (err) {
      await clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadToken();
      if (getToken()) {
        await refreshUser();
      } else {
        setLoading(false);
      }
    })();
  }, [refreshUser]);

  if (loading || langLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#12876a" />
        <Text style={styles.loadingText}>{t ? t.common.loading : "Loading…"}</Text>
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, refreshUser }}>
      <CurrencyProvider>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user === null ? (
            <>
              <Stack.Screen name="Login">
                {(props) => (
                  <LoginScreen
                    {...props}
                    onNavigateToRegister={() => props.navigation.navigate("Register")}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Register">
                {(props) => (
                  <RegisterScreen
                    {...props}
                    onNavigateToLogin={() => props.navigation.navigate("Login")}
                  />
                )}
              </Stack.Screen>
            </>
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              {/* Settings screen pushes as a stack screen with back button */}
              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                  headerShown: true,
                  headerTitle: t.topbar.settings,
                  headerTitleStyle: {
                    fontSize: 16,
                    fontWeight: "800",
                    color: "#0d463a",
                  },
                  headerStyle: {
                    backgroundColor: "#ffffff",
                    borderBottomWidth: 1,
                    borderBottomColor: "#d9f7ec",
                    elevation: 0,
                    shadowOpacity: 0,
                  },
                  headerLeft: ({ onPress }) => (
                    <TouchableOpacity onPress={onPress} style={styles.settingsBackBtn}>
                      <ArrowLeft size={20} color="#12876a" />
                      <Text style={styles.settingsBackTxt}>{t.common.back}</Text>
                    </TouchableOpacity>
                  ),
                }}
              />
            </>
          )}
        </Stack.Navigator>
      </CurrencyProvider>
    </AuthContext.Provider>
  );
}

// Top level App entry
export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <NavigationContainer>
          <AppContent />
          <StatusBar style="light" />
        </NavigationContainer>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#effcf6",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
  },
  header: {
    // height is set dynamically to (56 + top safe-area inset) so the title/gear
    // clear the status bar on Android and the notch on iOS.
    backgroundColor: "#12876a", // primary brand color (matches start of brand-gradient)
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#0f5545",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  tabLabelActive: {
    fontSize: 11,
    fontWeight: "700",
    color: "#12876a",
    marginTop: 2,
    textAlign: "center",
    alignSelf: "center",
  },
  headerSettingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    gap: 4,
  },
  settingsBackTxt: {
    fontSize: 14,
    fontWeight: "700",
    color: "#12876a",
  },
});
