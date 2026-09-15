import { Ionicons } from "@expo/vector-icons";
import {
  DarkTheme,
  Slot,
  ThemeProvider,
  usePathname,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import {
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AuthProvider, useAuth } from "@/context-auth";

SplashScreen.preventAutoHideAsync();

const PhoneStoreTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#22D3EE",
    background: "#080A12",
    card: "#111522",
    text: "#F8FAFC",
    border: "#2A3142",
    notification: "#EC4899",
  },
};

// ======================================================
// Header ด้านบน
// ======================================================
function TopHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <View style={headerStyles.nav}>
      {/* Logo */}
      <TouchableOpacity
        style={headerStyles.logo}
        onPress={() => router.push("/")}
      >
        <Ionicons
          name="briefcase-outline"
          size={25}
          color="#F5B94C"
        />

        <View>
          <Text style={headerStyles.logoTitle}>
            TRAVEL
          </Text>

          <Text style={headerStyles.logoSub}>
            LUGGAGE
          </Text>
        </View>
      </TouchableOpacity>

      {/* เมนูด้านขวา */}
      <View style={headerStyles.navRight}>
        {/* Dashboard สำหรับ Admin */}
        {user?.role === "admin" && (
          <TouchableOpacity
            onPress={() => router.push("/dashboard")}
          >
            <Ionicons
              name="grid-outline"
              size={22}
              color="#E7ECF3"
            />
          </TouchableOpacity>
        )}

        {/* Cart */}
        <TouchableOpacity
          onPress={() => router.push("/cart")}
          style={headerStyles.cart}
        >
          <Ionicons
            name="bag-outline"
            size={23}
            color="#E7ECF3"
          />
        </TouchableOpacity>

        {/* Login / Logout */}
        {user ? (
          <TouchableOpacity onPress={logout}>
            <Text style={headerStyles.loginText}>
              ออกจากระบบ
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.push("/login")}
          >
            <Text style={headerStyles.loginText}>
              เข้าสู่ระบบ
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ======================================================
// Bottom Tab Bar
// ======================================================
function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    {
      name: "Home",
      route: "/home",
      icon: "home-outline",
      activeIcon: "home",
    },
    {
      name: "Products",
      route: "/",
      icon: "cube-outline",
      activeIcon: "cube",
    },
    {
      name: "Categories",
      route: "/categories",
      icon: "folder-outline",
      activeIcon: "folder",
    },
  ];

  const isActive = (route: string) => {
    if (
      route === "/" &&
      (
        pathname === "/" ||
        pathname === "/index"
      )
    ) {
      return true;
    }

    return pathname === route;
  };

  return (
    <View style={tabStyles.container}>
      {tabs.map((tab) => {
        const active = isActive(tab.route);

        return (
          <TouchableOpacity
            key={tab.name}
            style={tabStyles.tabItem}
            onPress={() => router.push(tab.route as any)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                (active
                  ? tab.activeIcon
                  : tab.icon) as any
              }
              size={22}
              color={
                active
                  ? "#8B5CF6"
                  : "#64748B"
              }
            />

            <Text
              style={[
                tabStyles.label,
                {
                  color: active
                    ? "#8B5CF6"
                    : "#64748B",
                },
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ======================================================
// Redirect + Layout
// ======================================================
function InitialLayoutNav() {
  // แก้ตรงนี้
  // ไม่ใช้ isLoading แล้ว
  const { token } = useAuth();

  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();

  const currentRoute =
    segments[0] as string | undefined;

  // ====================================================
  // Auth Pages
  // ====================================================
  const isAuthPage =
    currentRoute === "login" ||
    currentRoute === "register" ||
    currentRoute === "forgot-password" ||
    pathname.includes("/login") ||
    pathname.includes("/register") ||
    pathname.includes("/forgot-password");

  // ====================================================
  // Redirect
  // ====================================================
  useEffect(() => {
    if (!token && !isAuthPage) {
      router.replace("/login");
      return;
    }

    if (token && isAuthPage) {
      router.replace("/home");
    }
  }, [token, isAuthPage]);

  // ====================================================
  // ซ่อน Header
  // ====================================================
  const isHideHeaderPage =
    isAuthPage ||
    pathname === "/" ||
    pathname === "/index";

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#101827",
      }}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#101827"
      />

      {/* Header */}
      {!isHideHeaderPage && <TopHeader />}

      {/* Page */}
      <View
        style={{
          flex: 1,
          backgroundColor: "#080A12",
        }}
      >
        <Slot />
      </View>

      {/* Bottom Navigation */}
      {!isAuthPage && Boolean(token) && (
        <BottomTabBar />
      )}
    </SafeAreaView>
  );
}

// ======================================================
// Root Layout
// ======================================================
export default function RootLayout() {
  return (
    <ThemeProvider value={PhoneStoreTheme}>
      {Platform.OS === "web" && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                background: #080A12 !important;
                color-scheme: dark;
              }

              ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
              }

              ::-webkit-scrollbar-track {
                background: #080A12;
              }

              ::-webkit-scrollbar-thumb {
                background: #7C5CFF;
                border-radius: 9999px;
              }

              ::-webkit-scrollbar-thumb:hover {
                background: #22D3EE;
              }

              ::selection {
                background: rgba(34, 211, 238, 0.24);
                color: #F8FAFC;
              }
            `,
          }}
        />
      )}

      <AuthProvider>
        <AnimatedSplashOverlay />

        <InitialLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}

// ======================================================
// Header Styles
// ======================================================
const headerStyles = StyleSheet.create({
  nav: {
    height: 65,
    backgroundColor: "#101827",
    borderBottomWidth: 1,
    borderBottomColor: "#202B3D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },

  logo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  logoTitle: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#F5F7FA",
  },

  logoSub: {
    fontSize: 8,
    color: "#F5B94C",
    letterSpacing: 2,
  },

  navRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },

  cart: {
    position: "relative",
  },

  loginText: {
    color: "#DDE5EF",
    fontWeight: "700",
    fontSize: 13,
  },
});

// ======================================================
// Bottom Tab Styles
// ======================================================
const tabStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#0B1220",
    borderTopWidth: 1,
    borderTopColor: "#1A2436",
    height: 60,
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 4,
  },

  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  label: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },
});