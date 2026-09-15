import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/context-auth";

// Endpoint API สำหรับสินค้าและตะกร้า
const API_PRODUCTS = "http://119.59.102.161:3081/api/products";
const API_CART = "http://119.59.102.161:3081/api/cart";

// ฟังก์ชัน Helper แปลงสกุลเงิน
const money = (n: number) => `฿${Number(n || 0).toLocaleString("th-TH")}`;

export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch(`${API_PRODUCTS}/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then(setProduct)
      .catch((err) => console.error("Error fetching detail:", err))
      .finally(() => setLoading(false));
  }, [id, token]);

  // ฟังก์ชันเพิ่มสินค้าลงในตะกร้า (ส่งลง Database)
  const addToCart = async () => {
    if (!user?.id) {
      const msg = "กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("แจ้งเตือน", msg);
      return;
    }

    setAdding(true);

    try {
      const response = await fetch(API_CART, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          user_id: user.id,
          product_id: product.id,
          quantity: 1,
          size_inch: product.size_inch || null,
          color: product.color || null,
        }),
      });

      const resData = await response.json();

      if (response.ok && resData.status === "success") {
        const msg = "เพิ่มสินค้าลงในตะกร้าเรียบร้อยแล้ว";
        Platform.OS === "web" ? window.alert(msg) : Alert.alert("สำเร็จ", msg);
      } else {
        throw new Error(resData.message || "ไม่สามารถเพิ่มสินค้าลงในตะกร้าได้");
      }
    } catch (err: any) {
      console.error("Add to cart error:", err);
      const errMsg = err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์";
      Platform.OS === "web" ? window.alert(errMsg) : Alert.alert("ผิดพลาด", errMsg);
    } finally {
      setAdding(false);
    }
  };

  // ฟังก์ชันลบสินค้า (เฉพาะ Admin)
  const del = async () => {
    const ok =
      Platform.OS === "web"
        ? window.confirm("ต้องการลบสินค้านี้หรือไม่?")
        : true;

    if (!ok) return;

    try {
      const r = await fetch(`${API_PRODUCTS}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!r.ok) throw new Error((await r.json()).message);
      
      router.replace("/");
    } catch (e) {
      Platform.OS === "web"
        ? window.alert(String(e))
        : Alert.alert("ผิดพลาด", String(e));
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#F5B94C" />
      </View>
    );
  }

  if (!product?.id) {
    return (
      <View style={s.center}>
        <Text style={s.notFound}>ไม่พบสินค้า</Text>
      </View>
    );
  }

  const price = product.discount_price ?? product.price;

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <TouchableOpacity onPress={() => router.back()} style={s.back}>
        <Ionicons name="arrow-back" size={22} color="#F5F7FA" />
        <Text style={s.backText}>กลับไปหน้าสินค้า</Text>
      </TouchableOpacity>

      <View style={s.main}>
        <View style={s.imageBox}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={s.image} />
          ) : (
            <Ionicons name="briefcase-outline" size={100} color="#64748B" />
          )}
        </View>

        <View style={s.info}>
          <Text style={s.brand}>{product.brand}</Text>
          <Text style={s.name}>{product.product_name}</Text>
          <Text style={s.sku}>SKU: {product.sku || "-"}</Text>

          <View style={s.priceRow}>
            <Text style={s.price}>{money(price)}</Text>
            {product.discount_price != null && (
              <Text style={s.old}>{money(product.price)}</Text>
            )}
          </View>

          <Text style={s.desc}>
            {product.description || "กระเป๋าเดินทางคุณภาพสำหรับทุกการเดินทาง"}
          </Text>

          <View style={s.specs}>
            {[
              ["ขนาด", product.size_inch ? `${product.size_inch}"` : "-"],
              ["วัสดุ", product.material || "-"],
              [
                "ประเภท",
                product.hard_or_soft === "hard"
                  ? "Hard Case"
                  : product.hard_or_soft === "soft"
                  ? "Soft Case"
                  : "-",
              ],
              ["ล้อ", `${product.wheel_count || 0} ล้อ (${product.wheel_type || "-"})`],
              ["น้ำหนัก", product.weight_kg != null ? `${product.weight_kg} kg` : "-"],
              ["ความจุ", product.capacity_liters != null ? `${product.capacity_liters} L` : "-"],
              ["ล็อก", product.lock_type || "-"],
              ["มือจับ", product.handle_type || "-"],
              ["สี", product.color || "-"],
              ["ขยายได้", product.expandable ? "ได้" : "ไม่ได้"],
              ["สต็อก", product.stock_quantity],
            ].map(([label, value]) => (
              <View style={s.spec} key={label as string}>
                <Text style={s.specLabel}>{label}</Text>
                <Text style={s.specValue}>{String(value)}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[s.buy, adding && { opacity: 0.7 }]}
            onPress={addToCart}
            disabled={adding}
          >
            {adding ? (
              <ActivityIndicator color="#101827" />
            ) : (
              <Text style={s.buyText}>เพิ่มลงตะกร้า</Text>
            )}
          </TouchableOpacity>

          {user?.role === "admin" && (
            <View style={s.admin}>
              <TouchableOpacity
                style={s.edit}
                onPress={() =>
                  router.push({
                    pathname: "/add",
                    params: { id: String(product.id) },
                  })
                }
              >
                <Text style={s.editText}>แก้ไขสินค้า</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.delete} onPress={del}>
                <Text style={s.deleteText}>ลบสินค้า</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#0B1220",
  },
  content: {
    maxWidth: 1180,
    width: "100%",
    alignSelf: "center",
    padding: 25,
  },
  center: {
    flex: 1,
    backgroundColor: "#0B1220",
    alignItems: "center",
    justifyContent: "center",
  },
  notFound: {
    color: "#F5F7FA",
    fontSize: 20,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 22,
  },
  backText: {
    color: "#AEB8C7",
  },
  main: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 35,
  },
  imageBox: {
    flex: 1,
    minWidth: 320,
    height: 520,
    backgroundColor: "#F1F3F5",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  info: {
    flex: 1,
    minWidth: 320,
    paddingVertical: 5,
  },
  brand: {
    color: "#F5B94C",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
  name: {
    color: "#F5F7FA",
    fontSize: 36,
    fontWeight: "900",
    marginTop: 8,
  },
  sku: {
    color: "#738197",
    marginTop: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 22,
  },
  price: {
    color: "#F5B94C",
    fontSize: 30,
    fontWeight: "900",
  },
  old: {
    color: "#65738A",
    textDecorationLine: "line-through",
  },
  desc: {
    color: "#AEB8C7",
    lineHeight: 24,
    marginTop: 18,
    fontSize: 14,
  },
  specs: {
    marginTop: 25,
    borderTopWidth: 1,
    borderTopColor: "#253248",
    paddingTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  spec: {
    width: "50%",
    paddingVertical: 10,
  },
  specLabel: {
    color: "#68768B",
    fontSize: 11,
  },
  specValue: {
    color: "#E4EAF1",
    fontWeight: "700",
    marginTop: 3,
  },
  buy: {
    height: 50,
    borderRadius: 9,
    backgroundColor: "#F5B94C",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  buyText: {
    color: "#101827",
    fontWeight: "900",
  },
  admin: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  edit: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F5B94C",
    alignItems: "center",
    justifyContent: "center",
  },
  editText: {
    color: "#F5B94C",
    fontWeight: "800",
  },
  delete: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#6B2932",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: {
    color: "#FFB4BD",
    fontWeight: "800",
  },
});