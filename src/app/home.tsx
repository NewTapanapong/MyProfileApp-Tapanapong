import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/context-auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";

const API = "http://119.59.102.161:3081/api/products";
const money = (n: number) => `฿${Number(n || 0).toLocaleString("th-TH")}`;

export default function Home() {
  const { token } = useAuth();
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        const topProducts = list.filter((x) => x.discount_price != null).slice(0, 6);
        setBestSellers(topProducts.length > 0 ? topProducts : list.slice(0, 6));
      })
      .finally(() => setLoading(false));
  }, [token]);

  // ส่วน Banner ด้านบน พร้อมปุ่มกดไปหน้าสินค้า
  const ListHeader = () => (
    <View style={s.headerContainer}>
      {/* Banner Card */}
      <View style={s.bannerCard}>
        <Text style={s.subTag}>TRAVEL COLLECTION 2026</Text>
        <Text style={s.bannerTitle}>
          เดินทางให้ไกล{"\n"}ไปพร้อมกระเป๋าที่{"\n"}ใช่
        </Text>
        <Text style={s.bannerDesc}>
          กระเป๋าเดินทางคุณภาพ คัดสรรตั้งแต่ 20–28 นิ้ว{"\n"}
          พร้อมวัสดุและระบบล็อกที่เหมาะกับทุกทริป
        </Text>

        <TouchableOpacity 
          style={s.bannerBtn} 
          onPress={() => router.push("/dashboard" as any)}
          activeOpacity={0.8}
        >
          <Text style={s.bannerBtnText}>เลือกซื้อสินค้า</Text>
          <Ionicons name="arrow-forward" size={16} color="#101827" />
        </TouchableOpacity>
      </View>

      {/* หัวข้อ Best Seller */}
      <Text style={s.sectionTitle}>🔥 สินค้าขายดี (Best Seller)</Text>
    </View>
  );

  return (
    <View style={s.page}>
      {loading ? (
        <ActivityIndicator color="#F5B94C" size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={bestSellers}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={ListHeader}
          numColumns={2}
          columnWrapperStyle={s.columnWrapper}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.card}
              onPress={() => router.push({ pathname: "/detail", params: { id: String(item.id) } })}
            >
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={s.cardImg} />
              ) : (
                <View style={[s.cardImg, s.noImg]}>
                  <Ionicons name="image-outline" size={32} color="#64748B" />
                </View>
              )}
              <Text style={s.cardTitle} numberOfLines={1}>
                {item.product_name}
              </Text>
              <Text style={s.cardBrand}>{item.brand || "ทั่วไป"}</Text>
              <View style={s.priceRow}>
                <Text style={s.cardPrice}>{money(item.discount_price || item.price)}</Text>
                {item.discount_price && <Text style={s.oldPrice}>{money(item.price)}</Text>}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0B1220", paddingHorizontal: 16, paddingTop: 16 },
  headerContainer: { marginBottom: 16 },
  
  // Styles สำหรับ Banner
  bannerCard: {
    backgroundColor: "#111A29",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#233047",
    marginBottom: 20,
  },
  subTag: { color: "#F5B94C", fontSize: 11, fontWeight: "900", letterSpacing: 1, marginBottom: 10 },
  bannerTitle: { color: "#F5F7FA", fontSize: 24, fontWeight: "900", lineHeight: 32, marginBottom: 10 },
  bannerDesc: { color: "#94A3B8", fontSize: 12, lineHeight: 18, marginBottom: 16 },
  bannerBtn: {
    backgroundColor: "#F5B94C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignSelf: "flex-start",
    gap: 6,
  },
  bannerBtnText: { color: "#101827", fontWeight: "900", fontSize: 13 },

  sectionTitle: { color: "#F5F7FA", fontSize: 18, fontWeight: "800", marginBottom: 8 },
  columnWrapper: { justifyContent: "space-between", marginBottom: 12 },
  card: {
    backgroundColor: "#111A29",
    borderRadius: 12,
    padding: 10,
    width: "48%",
    borderWidth: 1,
    borderColor: "#233047",
  },
  cardImg: { width: "100%", height: 110, borderRadius: 8, marginBottom: 8 },
  noImg: { backgroundColor: "#1D283A", alignItems: "center", justifyContent: "center" },
  cardTitle: { color: "#F5F7FA", fontWeight: "700", fontSize: 13 },
  cardBrand: { color: "#64748B", fontSize: 11, marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  cardPrice: { color: "#F5B94C", fontWeight: "800", fontSize: 14 },
  oldPrice: { color: "#64748B", fontSize: 11, textDecorationLine: "line-through" },
});