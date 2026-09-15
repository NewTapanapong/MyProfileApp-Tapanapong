import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/context-auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const API = "http://119.59.102.161:3081/api/products";
const money = (n: number) => `฿${Number(n || 0).toLocaleString("th-TH")}`;

export default function Dashboard() {
  const { token, user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "admin") {
      router.replace("/");
      return;
    }
    fetch(API, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [token, user]);

  const stock = products.reduce((a, x) => a + Number(x.stock_quantity || 0), 0);
  const value = products.reduce((a, x) => a + Number(x.price || 0) * Number(x.stock_quantity || 0), 0);
  const sale = products.filter(x => x.discount_price != null).length;
  const out = products.filter(x => x.stock_quantity <= 0 || x.status === "out_of_stock").length;

  if (user?.role !== "admin") return null;

  // แยก Header ออกมาเพื่อใส่ใน ListHeaderComponent ให้ Scroll ไปพร้อมกับรายการสินค้า
  const ListHeader = () => (
    <>
      <View style={s.head}>
        <TouchableOpacity onPress={() => router.replace("/")}>
          <Ionicons name="arrow-back" size={24} color="#F5F7FA" />
        </TouchableOpacity>
        <Text style={s.title}>จัดการร้านค้า</Text>
        <TouchableOpacity style={s.add} onPress={() => router.push("/add")}>
          <Text style={s.addText}>+ เพิ่มสินค้า</Text>
        </TouchableOpacity>
      </View>

      <View style={s.stats}>
        <Stat value={products.length} label="สินค้าทั้งหมด" />
        <Stat value={stock} label="สต็อกรวม" />
        <Stat value={money(value)} label="มูลค่าสต็อก" />
        <Stat value={sale} label="มีส่วนลด" />
        <Stat value={out} label="หมด/ปิดขาย" />
      </View>
    </>
  );

  return (
    <View style={s.page}>
      {loading ? (
        <ActivityIndicator color="#F5B94C" size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => String(item.id)}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.product_name}</Text>
                <Text style={s.meta}>
                  {item.brand || "-"} · SKU {item.sku || "-"} · {item.size_inch || "-"} นิ้ว
                </Text>
              </View>
              <Text style={s.stock}>{item.stock_quantity} ชิ้น</Text>
              <TouchableOpacity onPress={() => router.push({ pathname: "/add", params: { id: String(item.id) } })}>
                <Ionicons name="create-outline" size={22} color="#F5B94C" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push({ pathname: "/detail", params: { id: String(item.id) } })}>
                <Ionicons name="eye-outline" size={22} color="#AEB8C7" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.value}>{value}</Text>
      <Text style={s.label}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0B1220", paddingHorizontal: 16, paddingTop: 16 },
  head: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "900", color: "#F5F7FA" },
  add: { marginLeft: "auto", backgroundColor: "#F5B94C", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addText: { color: "#101827", fontWeight: "900", fontSize: 13 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  
  /* ปรับ minWidth ลงเหลือ 47% เพื่อให้การ์ดวางคู่กัน 2 คอลัมน์อย่างเหมาะสม */
  stat: { 
    backgroundColor: "#111A29", 
    borderWidth: 1, 
    borderColor: "#253248", 
    borderRadius: 12, 
    padding: 12, 
    width: "48%", // แสดงผล 2 คอลัมน์
  },
  value: { color: "#F5B94C", fontSize: 18, fontWeight: "900" },
  label: { color: "#7E8A9E", fontSize: 11, marginTop: 2 },
  
  row: { backgroundColor: "#111A29", borderWidth: 1, borderColor: "#233047", borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 10 },
  name: { color: "#F5F7FA", fontWeight: "800", fontSize: 14 },
  meta: { color: "#718096", fontSize: 11, marginTop: 2 },
  stock: { color: "#DDE5EF", fontWeight: "800", fontSize: 13 }
});