import { useEffect } from "react";
import { DarkTheme, Slot, ThemeProvider, useRouter, useSegments, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Platform, View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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

// Component แถบ Header ด้านบน
function TopHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <View style={headerStyles.nav}>
      {/* โลโก้ */}
      <TouchableOpacity style={headerStyles.logo} onPress={() => router.push("/")}>
        <Ionicons name="briefcase-outline" size={25} color="#F5B94C" />
        <View>
          <Text style={headerStyles.logoTitle}>TRAVEL</Text>
          <Text style={headerStyles.logoSub}>LUGGAGE</Text>
        </View>
      </TouchableOpacity>

      {/* เมนูด้านขวา */}
      <View style={headerStyles.navRight}>
        {user?.role === "admin" && (
          <TouchableOpacity onPress={() => router.push("/dashboard")}>
            <Ionicons name="grid-outline" size={22} color="#E7ECF3" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => router.push("/cart")} style={headerStyles.cart}>
          <Ionicons name="bag-outline" size={23} color="#E7ECF3" />
        </TouchableOpacity>
        {user ? (
          <TouchableOpacity onPress={logout}>
            <Text style={headerStyles.loginText}>ออกจากระบบ</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={headerStyles.loginText}>เข้าสู่ระบบ</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Component แถบเมนูด้านล่าง
function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { name: "Home", route: "/home", icon: "home-outline", activeIcon: "home" },
    { name: "Products", route: "/", icon: "cube-outline", activeIcon: "cube" },
    { name: "Categories", route: "/categories", icon: "folder-outline", activeIcon: "folder" },
  ];

  const isActive = (route: string) => {
    if (route === "/" && (pathname === "/" || pathname === "/index" || pathname === "/dashboard")) {
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
              name={(active ? tab.activeIcon : tab.icon) as any}
              size={22}
              color={active ? "#8B5CF6" : "#64748B"}
            />
            <Text style={[tabStyles.label, { color: active ? "#8B5CF6" : "#64748B" }]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Component ย่อยสำหรับจัดการการ Redirect และ Layout การแสดงผล
function InitialLayoutNav() {
  const { token, isLoading } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();

  const currentRoute = segments[0] as string | undefined;

  // ตรวจสอบว่าเป็นหน้าเกี่ยวกับ Authentication หรือไม่
  const isAuthPage =
    currentRoute === "login" ||
    currentRoute === "register" ||
    currentRoute === "forgot-password" ||
    pathname.includes("/login") ||
    pathname.includes("/register") ||
    pathname.includes("/forgot-password");

  useEffect(() => {
    if (isLoading) return;

    if (!token && !isAuthPage) {
      router.replace("/login");
    } else if (token && isAuthPage) {
      router.replace("/");
    }
  }, [token, isLoading, isAuthPage]);

  // ซ่อน TopHeader เฉพาะหน้า Auth และหน้าแรกที่มี Header ของตัวเองแล้ว
  const isHideHeaderPage =
    isAuthPage ||
    pathname === "/" ||
    pathname === "/index";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#101827" }}>
      <StatusBar barStyle="light-content" backgroundColor="#101827" />

      {/* แสดง TopHeader เฉพาะหน้าที่ไม่ได้ถูกสั่งซ่อน */}
      {!isHideHeaderPage && <TopHeader />}

      <View style={{ flex: 1, backgroundColor: "#080A12" }}>
        <Slot />
      </View>

      {/* แสดง Bottom Bar เฉพาะเมื่อเข้าสู่ระบบแล้วและไม่ได้อยู่ในหน้า Auth */}
      {!isAuthPage && Boolean(token) && <BottomTabBar />}
    </SafeAreaView>
  );
}

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
              ::-webkit-scrollbar { width: 8px; height: 8px; }
              ::-webkit-scrollbar-track { background: #080A12; }
              ::-webkit-scrollbar-thumb { background: #7C5CFF; border-radius: 9999px; }
              ::-webkit-scrollbar-thumb:hover { background: #22D3EE; }
              ::-selection { background: rgba(34, 211, 238, 0.24); color: #F8FAFC; }
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

// Style สำหรับ Header ด้านบน
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
  logo: { flexDirection: "row", alignItems: "center", gap: 9 },
  logoTitle: { fontSize: 16, fontWeight: "900", letterSpacing: 2, color: "#F5F7FA" },
  logoSub: { fontSize: 8, color: "#F5B94C", letterSpacing: 2 },
  navRight: { flexDirection: "row", alignItems: "center", gap: 18 },
  cart: { position: "relative" },
  loginText: { color: "#DDE5EF", fontWeight: "700", fontSize: 13 },
});

// Style สำหรับ TabBar ด้านล่าง
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