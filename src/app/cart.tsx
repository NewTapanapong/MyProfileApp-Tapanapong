import { useAuth } from "@/context-auth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

type CartItem = {
  id: number;
  product_id: number;
  product_name: string;
  brand: string | null;
  price: number;
  discount_price: number | null;
  image_url: string | null;
  quantity: number;
  size_inch: number | null;
  color: string | null;
};

const API_BASE_URL = "http://119.59.102.161:3081/api"; 

const money = (n: number) =>
  `฿${Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 0 })}`;

const notify = (title: string, msg: string) =>
  Platform.OS === "web"
    ? window.alert(`${title}\n\n${msg}`)
    : Alert.alert(title, msg);

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchCartData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/cart.php?user_id=${encodeURIComponent(user.id)}`);
      
      if (!response.ok) {
        throw new Error(`เซิร์ฟเวอร์ขัดข้อง (HTTP ${response.status})`);
      }

      const data = await response.json();
      if (data.status === "success") {
        setCartItems(data.data || []);
      } else {
        throw new Error(data.message || "ไม่สามารถดึงข้อมูลตะกร้าสินค้าได้");
      }
    } catch (error: any) {
      console.error("Error fetching cart:", error);
      setErrorMessage(error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartData();
  }, [user?.id]);

  const updateQuantity = async (cartId: number, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      removeItem(cartId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => (item.id === cartId ? { ...item, quantity: newQty } : item))
    );

    try {
      await fetch(`${API_BASE_URL}/cart_update.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cartId, quantity: newQty }),
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const removeItem = async (cartId: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== cartId));

    try {
      await fetch(`${API_BASE_URL}/cart_delete.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cartId }),
      });
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const activePrice = item.discount_price ?? item.price;
    return sum + activePrice * item.quantity;
  }, 0);

  const shippingFee = cartItems.length > 0 ? 100 : 0;
  const totalPrice = subtotal + shippingFee;

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    notify("สั่งซื้อสินค้าสำเร็จ", `ยอดชำระทั้งหมด ${money(totalPrice)}`);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#22D3EE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ตะกร้าสินค้า</Text>
        <View style={{ width: 24 }} />
      </View>

      {errorMessage ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={70} color="#EF4444" />
          <Text style={styles.emptyTitle}>เกิดข้อผิดพลาดจากเซิร์ฟเวอร์</Text>
          <Text style={styles.emptySub}>{errorMessage}</Text>
          <TouchableOpacity style={styles.shopButton} onPress={fetchCartData}>
            <Text style={styles.shopButtonText}>ลองใหม่อีกครั้ง</Text>
          </TouchableOpacity>
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-handle-outline" size={80} color="#475569" />
          <Text style={styles.emptyTitle}>ไม่มีสินค้าในตะกร้า</Text>
          <Text style={styles.emptySub}>เลือกซื้อกระเป๋าเดินทางใบโปรดของคุณได้เลย</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push("/")}
          >
            <Text style={styles.shopButtonText}>เลือกซื้อสินค้า</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.listContainer}>
            {cartItems.map((item) => {
              const activePrice = item.discount_price ?? item.price;

              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.imageBox}>
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={styles.image} />
                    ) : (
                      <Ionicons name="briefcase-outline" size={40} color="#64748B" />
                    )}
                  </View>

                  <View style={styles.itemInfo}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.brand}>{item.brand || "TRAVEL"}</Text>
                      <TouchableOpacity onPress={() => removeItem(item.id)}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.productName} numberOfLines={1}>
                      {item.product_name}
                    </Text>

                    <Text style={styles.itemSpec}>
                      ขนาด: {item.size_inch ? `${item.size_inch}"` : "-"} | สี: {item.color || "-"}
                    </Text>

                    <View style={styles.itemFooter}>
                      <View style={styles.priceGroup}>
                        <Text style={styles.price}>{money(activePrice)}</Text>
                        {item.discount_price != null && (
                          <Text style={styles.oldPrice}>{money(item.price)}</Text>
                        )}
                      </View>

                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(item.id, item.quantity, -1)}
                        >
                          <Ionicons name="remove" size={16} color="#F8FAFC" />
                        </TouchableOpacity>

                        <Text style={styles.qtyText}>{item.quantity}</Text>

                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(item.id, item.quantity, 1)}
                        >
                          <Ionicons name="add" size={16} color="#F8FAFC" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>รวมค่าสินค้า</Text>
              <Text style={styles.summaryValue}>{money(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>ค่าจัดส่ง</Text>
              <Text style={styles.summaryValue}>{money(shippingFee)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>ยอดรวมทั้งหมด</Text>
              <Text style={styles.totalValue}>{money(totalPrice)}</Text>
            </View>

            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutText}>ดำเนินการสั่งซื้อ</Text>
              <Ionicons name="arrow-forward" size={18} color="#101827" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080A12" },
  center: { justifyContent: "center", alignItems: "center" },
  header: {
    height: 60,
    backgroundColor: "#101827",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  backButton: { padding: 4 },
  headerTitle: { color: "#F8FAFC", fontSize: 18, fontWeight: "700" },
  listContainer: { padding: 16, gap: 12 },
  itemCard: {
    backgroundColor: "#111726",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  imageBox: {
    width: 85,
    height: 85,
    backgroundColor: "#1E293B",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center", // แก้ไขตรงนี้แล้ว
  },
  image: { width: "100%", height: "100%", borderRadius: 8, resizeMode: "cover" },
  itemInfo: { flex: 1, justifyContent: "space-between" },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { color: "#F5B94C", fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  productName: { color: "#F8FAFC", fontSize: 14, fontWeight: "700", marginTop: 2 },
  itemSpec: { color: "#64748B", fontSize: 11, marginTop: 2 },
  itemFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  priceGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
  price: { color: "#22D3EE", fontSize: 15, fontWeight: "800" },
  oldPrice: { color: "#64748B", fontSize: 11, textDecorationLine: "line-through" },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyBtn: { padding: 4 },
  qtyText: { color: "#F8FAFC", fontSize: 13, fontWeight: "700", paddingHorizontal: 8 },
  summaryBox: {
    backgroundColor: "#101827",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
    gap: 8,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { color: "#94A3B8", fontSize: 13 },
  summaryValue: { color: "#F8FAFC", fontSize: 13, fontWeight: "600" },
  totalRow: { marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#1E293B" },
  totalLabel: { color: "#F8FAFC", fontSize: 15, fontWeight: "700" },
  totalValue: { color: "#F5B94C", fontSize: 18, fontWeight: "900" },
  checkoutButton: {
    backgroundColor: "#F5B94C",
    height: 46,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  checkoutText: { color: "#101827", fontSize: 15, fontWeight: "800" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  emptyTitle: { color: "#F8FAFC", fontSize: 18, fontWeight: "700", marginTop: 16 },
  emptySub: { color: "#64748B", fontSize: 13, marginTop: 6, textAlign: "center" },
  shopButton: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  shopButtonText: { color: "#F5B94C", fontSize: 14, fontWeight: "700" },
});