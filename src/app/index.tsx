// ชุดไอคอนที่ใช้แสดงสัญลักษณ์ต่าง ๆ ในหน้าร้านค้า
import { Ionicons } from "@expo/vector-icons";
// ตัวช่วยเปลี่ยนหน้าใน Expo Router
import { router } from "expo-router";
// React hooks ที่ใช้จัดการ state, lifecycle, ค่าที่คำนวณ และ reference ของ ScrollView
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
// ดึงข้อมูลผู้ใช้และ token จากระบบ authentication กลางของแอป
import { useAuth } from "@/context-auth";

// URL สำหรับเรียกข้อมูลสินค้าจาก backend
const API = "http://119.59.102.161:3081/api/products";
// URL สำหรับเพิ่มสินค้าเข้าไปในตะกร้าของผู้ใช้
const API_CART = "http://119.59.102.161:3081/api/cart";

// กลุ่มระดับราคาที่ระบบ K-Means จะกำหนดให้สินค้า
type PriceTier = "Low" | "Mid" | "High";

// โครงสร้างข้อมูลสินค้าที่ได้รับจาก backend
type Product = {
  id: number;
  product_name: string;
  brand: string | null;
  sku: string | null;
  size_inch: number | null;
  wheel_count: number | null;
  wheel_type: string | null;
  material: string | null;
  hard_or_soft: "hard" | "soft" | null;
  weight_kg: number | null;
  capacity_liters: number | null;
  lock_type: string | null;
  handle_type: string | null;
  expandable: number;
  color: string | null;
  stock_quantity: number;
  price: number;
  discount_price: number | null;
  status: "available" | "out_of_stock" | "discontinued";
  image_url: string | null;
  description: string | null;
  priceTier?: PriceTier;
};

/* =========================================================
   K-MEANS PRICE CLUSTERING
========================================================= */

// แบ่งสินค้าออกเป็นกลุ่มราคาถูก, กลาง และแพงด้วย K-Means แบบทำงานภายในเครื่อง
const clusterPricesLocally = (data: Product[]): Product[] => {
  // ไม่มีข้อมูลให้จัดกลุ่ม จึงคืนค่าเป็น array ว่าง
  if (!data || data.length === 0) return [];

  // ใช้ราคาลดเมื่อมี ถ้าไม่มีจึงใช้ราคาปกติ
  const prices = data.map((item) =>
    item.discount_price != null
      ? Number(item.discount_price)
      : Number(item.price)
  );

  // ถ้ามีสินค้าไม่ถึง 3 ตัว จะจัดกลุ่มแบบพิเศษแทน K-Means ปกติ
  if (prices.length === 1) {
    return data.map((item) => ({
      ...item,
      priceTier: "Low",
    }));
  }

  if (prices.length === 2) {
    const sorted = [...prices].sort((a, b) => a - b);

    return data.map((item) => ({
      ...item,
      priceTier:
        Number(item.discount_price ?? item.price) === sorted[0]
          ? "Low"
          : "High",
    }));
  }

  // กำหนดค่าจุดศูนย์กลางเริ่มต้นเป็นราคาต่ำสุด, กลาง และสูงสุด
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  let centroids = [
    minPrice,
    (minPrice + maxPrice) / 2,
    maxPrice,
  ];

  let assignments: number[] = [];
  let changed = true;
  let iterations = 0;

  // ทำซ้ำจนกว่าจุดศูนย์กลางจะไม่เปลี่ยน หรือครบจำนวนรอบสูงสุด
  while (changed && iterations < 100) {
    changed = false;
    iterations++;

    // ให้สินค้าแต่ละชิ้นอยู่ในกลุ่มที่มีจุดศูนย์กลางใกล้ราคาที่สุด
    assignments = prices.map((price) => {
      const diffs = centroids.map((c) => Math.abs(price - c));
      return diffs.indexOf(Math.min(...diffs));
    });

    // คำนวณจุดศูนย์กลางใหม่จากค่าเฉลี่ยราคาของสินค้าในแต่ละกลุ่ม
    const newCentroids = [0, 1, 2].map((i) => {
      const clusterPrices = prices.filter(
        (_, index) => assignments[index] === i
      );

      if (clusterPrices.length === 0) {
        return centroids[i];
      }

      return (
        clusterPrices.reduce((sum, price) => sum + price, 0) /
        clusterPrices.length
      );
    });

    // ถ้าจุดศูนย์กลางเปลี่ยนมากกว่า 0.01 ให้ทำรอบถัดไป
    if (
      newCentroids.some(
        (value, index) => Math.abs(value - centroids[index]) > 0.01
      )
    ) {
      centroids = newCentroids;
      changed = true;
    }
  }

  // เรียง centroid จากถูก → แพง
  const sortedCentroids = [...centroids].sort((a, b) => a - b);

  const labels: PriceTier[] = ["Low", "Mid", "High"];

  return data.map((item, index) => {
    const clusterIndex = assignments[index];
    const myCentroid = centroids[clusterIndex];

    // หา index จากค่าที่ใกล้เคียงที่สุด
    let tierIndex = sortedCentroids.findIndex(
      (value) => Math.abs(value - myCentroid) < 0.01
    );

    if (tierIndex === -1) {
      tierIndex = 0;
    }

    return {
      ...item,
      priceTier: labels[tierIndex],
    };
  });
};

// แปลงตัวเลขเป็นรูปแบบราคาเงินบาทตาม locale ภาษาไทย
const money = (n: number) =>
  `฿${Number(n || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 0,
  })}`;

// แสดงข้อความแจ้งเตือนให้เหมาะกับ platform ที่กำลังใช้งาน
const notify = (title: string, msg: string) =>
  Platform.OS === "web"
    ? window.alert(`${title}\n\n${msg}`)
    : Alert.alert(title, msg);

/* =========================================================
   STORE HOME
========================================================= */

export default function StoreHome() {
  // ใช้ขนาดหน้าจอเพื่อสลับ layout ระหว่าง desktop และ mobile
  const { width } = useWindowDimensions();
  const mobile = width < 700;

  // ข้อมูล session ปัจจุบันและฟังก์ชันออกจากระบบ
  const { token, user, logout } = useAuth();

  // reference สำหรับสั่งเลื่อนหน้าร้านค้ากลับไปด้านบน
  const scrollViewRef = useRef<ScrollView>(null);

  // state หลักของสินค้าและค่าที่ผู้ใช้เลือกในตัวกรอง
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");

  // ระดับราคาที่เลือก โดยค่าเริ่มต้นคือแสดงสินค้าทุกระดับ
  const [selectedTier, setSelectedTier] = useState<
    "All" | PriceTier
  >("All");

  // สถานะระหว่างโหลดข้อมูลและเพิ่มสินค้าลงตะกร้า
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Product[]>([]);
  const [addingId, setAddingId] = useState<number | null>(null);

  /* =========================================================
     LOAD PRODUCTS
  ========================================================= */

  // โหลดสินค้าจาก backend โดยรองรับคำค้นหา
  const load = async (search = "") => {
    setLoading(true);

    try {
      // ส่ง token ไปด้วยเมื่อผู้ใช้ล็อกอินแล้ว
      const r = await fetch(
        `${API}?q=${encodeURIComponent(search)}`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        }
      );

      // แปลง response เป็น JSON ก่อนตรวจสอบผลลัพธ์
      const d = await r.json();

      if (!r.ok) {
        throw new Error(
          d.message || "โหลดสินค้าไม่สำเร็จ"
        );
      }

      // ป้องกันข้อมูลผิดรูปแบบไม่ให้หลุดเข้า state
      setProducts(Array.isArray(d) ? d : []);
    } catch (e) {
      console.error(e);

      notify(
        "เกิดข้อผิดพลาด",
        e instanceof Error
          ? e.message
          : "โหลดสินค้าไม่สำเร็จ"
      );
    } finally {
      setLoading(false);
    }
  };

  // โหลดสินค้าใหม่เมื่อ token เปลี่ยน เช่น หลัง login หรือ logout
  useEffect(() => {
    load("");
  }, [token]);

  /* =========================================================
     FILTER DATA
  ========================================================= */

  // สร้างรายการแบรนด์ที่ไม่ซ้ำกันสำหรับปุ่มตัวกรอง
  const brands = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((p) => p.brand)
            .filter(Boolean)
        )
      ) as string[],
    [products]
  );

  // สร้างรายการขนาดกระเป๋าที่ไม่ซ้ำกันและเรียงจากเล็กไปใหญ่
  const sizes = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((p) => p.size_inch)
            .filter((v) => v != null)
        )
      ).sort((a, b) => Number(a) - Number(b)),
    [products]
  );

  // กรองสินค้าตามแบรนด์และขนาดที่ผู้ใช้เลือก
  const filtered = useMemo(() => {
    return products.filter(
      (p) =>
        (!brand || p.brand === brand) &&
        (!size ||
          String(p.size_inch) === size)
    );
  }, [products, brand, size]);

  // คำนวณระดับราคาให้กับสินค้าที่ผ่านตัวกรองพื้นฐานแล้ว
  const clusteredFiltered = useMemo(
    () => clusterPricesLocally(filtered),
    [filtered]
  );

  // กรองซ้ำตามระดับราคาที่ผู้ใช้เลือก
  const finalProducts = useMemo(() => {
    if (selectedTier === "All") {
      return clusteredFiltered;
    }

    return clusteredFiltered.filter(
      (p) => p.priceTier === selectedTier
    );
  }, [clusteredFiltered, selectedTier]);

  /* =========================================================
     ADD CART
  ========================================================= */

  // เพิ่มสินค้าที่เลือกลงตะกร้าผ่าน API
  const addCart = async (p: Product) => {
    if (!user?.id) {
      notify(
        "กรุณาเข้าสู่ระบบ",
        "โปรดเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า"
      );

      router.push("/login");
      return;
    }

    // ล็อกปุ่มของสินค้าชิ้นนี้ระหว่างรอ server ตอบกลับ
    setAddingId(p.id);

    try {
      // ส่งข้อมูลผู้ใช้ สินค้า จำนวน และตัวเลือกสินค้าไปยัง backend
      const response = await fetch(API_CART, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },

        body: JSON.stringify({
          user_id: user.id,
          product_id: p.id,
          quantity: 1,
          size_inch: p.size_inch || null,
          color: p.color || null,
        }),
      });

      const resData = await response.json();

      if (
        response.ok &&
        (resData.status === "success" ||
          resData.success)
      ) {
        // เพิ่มลง state เพื่ออัปเดตตัวเลข badge บนไอคอนตะกร้า
        setCart((c) =>
          c.some((x) => x.id === p.id)
            ? c
            : [...c, p]
        );

        notify(
          "สำเร็จ",
          `เพิ่ม "${p.product_name}" ลงในตะกร้าเรียบร้อยแล้ว`
        );
      } else {
        throw new Error(
          resData.message ||
            "ไม่สามารถเพิ่มสินค้าลงในตะกร้าได้"
        );
      }
    } catch (error: any) {
      console.error(
        "Error adding to cart:",
        error
      );

      notify(
        "เกิดข้อผิดพลาด",
        error.message ||
          "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้"
      );
    } finally {
      setAddingId(null);
    }
  };

  // เลือกราคาที่ต้องแสดง โดยให้ราคาลดมี priority เหนือราคาปกติ
  const activePrice = (p: Product) =>
    p.discount_price != null
      ? p.discount_price
      : p.price;

  /* =========================================================
     SCROLL
  ========================================================= */

  // ล้างตัวกรองและเลื่อนกลับไปยังรายการสินค้า
  const scrollToProducts = () => {
    setBrand("");
    setSize("");
    setSelectedTier("All");

    scrollViewRef.current?.scrollTo({
      y: 0,
      animated: true,
    });
  };

  /* =========================================================
     TIER COLOR
  ========================================================= */

  // เลือกสี badge ตามระดับราคาของสินค้า
  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Low":
        return "#10B981";

      case "Mid":
        return "#3B82F6";

      case "High":
        return "#EF4444";

      default:
        return "#F5B94C";
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  // ส่วนแสดงผลหลักของหน้าร้านค้า
  return (
    <SafeAreaView style={styles.page}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#101827"
      />

      {/* ================= HEADER ================= */}

      <View style={styles.nav}>
        <TouchableOpacity
          style={styles.logo}
          onPress={scrollToProducts}
        >
          <Ionicons
            name="briefcase-outline"
            size={25}
            color="#F5B94C"
          />

          <View>
            <Text style={styles.logoTitle}>
              TRAVEL
            </Text>

            <Text style={styles.logoSub}>
              LUGGAGE
            </Text>
          </View>
        </TouchableOpacity>

        {!mobile && (
          <View style={styles.search}>
            <Ionicons
              name="search"
              size={19}
              color="#8B95A7"
            />

            <TextInput
              value={q}
              onChangeText={setQ}
              onSubmitEditing={() => load(q)}
              placeholder="ค้นหากระเป๋า แบรนด์ หรือ SKU"
              placeholderTextColor="#8B95A7"
              style={styles.searchInput}
            />

            <TouchableOpacity
              onPress={() => load(q)}
            >
              <Text style={styles.searchBtn}>
                ค้นหา
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.navRight}>
          {user?.role === "admin" && (
            <TouchableOpacity
              onPress={() =>
                router.push("/dashboard")
              }
            >
              <Ionicons
                name="grid-outline"
                size={22}
                color="#E7ECF3"
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => router.push("/cart")}
            style={styles.cart}
          >
            <Ionicons
              name="bag-outline"
              size={23}
              color="#E7ECF3"
            />

            {cart.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.badgeText}>
                  {cart.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {user ? (
            <TouchableOpacity onPress={logout}>
              <Text style={styles.loginText}>
                ออกจากระบบ
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() =>
                router.push("/login")
              }
            >
              <Text style={styles.loginText}>
                เข้าสู่ระบบ
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ================= MOBILE SEARCH ================= */}

      {mobile && (
        <View style={styles.mobileSearch}>
          <Ionicons
            name="search"
            size={18}
            color="#8B95A7"
          />

          <TextInput
            value={q}
            onChangeText={setQ}
            onSubmitEditing={() => load(q)}
            placeholder="ค้นหากระเป๋า..."
            placeholderTextColor="#8B95A7"
            style={styles.searchInput}
          />
        </View>
      )}

      {/* ================= MAIN ================= */}

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.content}
      >
        {/* SECTION HEADER */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              กระเป๋าเดินทางทั้งหมด
            </Text>

            <Text style={styles.sectionSub}>
              {finalProducts.length} สินค้า
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              router.push("/categories")
            }
          >
            <Text style={styles.link}>
              ดูหมวดหมู่ทั้งหมด →
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================= NORMAL FILTER ================= */}

        <View style={styles.filters}>
          <Text style={styles.filterLabel}>
            แบรนด์
          </Text>

          <TouchableOpacity
            onPress={() => setBrand("")}
            style={[
              styles.chip,
              !brand && styles.chipOn,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                !brand && styles.chipTextOn,
              ]}
            >
              ทั้งหมด
            </Text>
          </TouchableOpacity>

          {brands.map((b) => (
            <TouchableOpacity
              key={b}
              onPress={() =>
                setBrand(
                  brand === b ? "" : b
                )
              }
              style={[
                styles.chip,
                brand === b && styles.chipOn,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  brand === b &&
                    styles.chipTextOn,
                ]}
              >
                {b}
              </Text>
            </TouchableOpacity>
          ))}

          <Text
            style={[
              styles.filterLabel,
              { marginLeft: 10 },
            ]}
          >
            ขนาด
          </Text>

          <TouchableOpacity
            onPress={() => setSize("")}
            style={[
              styles.chip,
              !size && styles.chipOn,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                !size && styles.chipTextOn,
              ]}
            >
              ทั้งหมด
            </Text>
          </TouchableOpacity>

          {sizes.map((s) => (
            <TouchableOpacity
              key={String(s)}
              onPress={() =>
                setSize(
                  size === String(s)
                    ? ""
                    : String(s)
                )
              }
              style={[
                styles.chip,
                size === String(s) &&
                  styles.chipOn,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  size === String(s) &&
                    styles.chipTextOn,
                ]}
              >
                {s}"
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* =====================================================
            ⭐ PRICE TIER FILTER
        ===================================================== */}

        <View style={styles.tierFilterContainer}>
          <View style={styles.tierTitleRow}>
            <Ionicons
              name="analytics-outline"
              size={18}
              color="#F5B94C"
            />

            <Text style={styles.tierFilterTitle}>
              ระดับราคา AI
            </Text>

            <Text style={styles.kmeansText}>
              K-Means
            </Text>
          </View>

          <View style={styles.tierButtons}>
            {/* ALL */}

            <TouchableOpacity
              onPress={() =>
                setSelectedTier("All")
              }
              style={[
                styles.tierButton,
                selectedTier === "All" &&
                  styles.tierButtonAllOn,
              ]}
            >
              <Text
                style={[
                  styles.tierButtonText,
                  selectedTier === "All" &&
                    styles.tierButtonTextOn,
                ]}
              >
                ทั้งหมด
              </Text>
            </TouchableOpacity>

            {/* LOW */}

            <TouchableOpacity
              onPress={() =>
                setSelectedTier("Low")
              }
              style={[
                styles.tierButton,
                selectedTier === "Low" && {
                  backgroundColor:
                    "#10B981",
                  borderColor:
                    "#10B981",
                },
              ]}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      "#10B981",
                  },
                ]}
              />

              <Text
                style={[
                  styles.tierButtonText,
                  selectedTier === "Low" &&
                    styles.tierButtonTextOn,
                ]}
              >
                Low
              </Text>
            </TouchableOpacity>

            {/* MID */}

            <TouchableOpacity
              onPress={() =>
                setSelectedTier("Mid")
              }
              style={[
                styles.tierButton,
                selectedTier === "Mid" && {
                  backgroundColor:
                    "#3B82F6",
                  borderColor:
                    "#3B82F6",
                },
              ]}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      "#3B82F6",
                  },
                ]}
              />

              <Text
                style={[
                  styles.tierButtonText,
                  selectedTier === "Mid" &&
                    styles.tierButtonTextOn,
                ]}
              >
                Mid
              </Text>
            </TouchableOpacity>

            {/* HIGH */}

            <TouchableOpacity
              onPress={() =>
                setSelectedTier("High")
              }
              style={[
                styles.tierButton,
                selectedTier === "High" && {
                  backgroundColor:
                    "#EF4444",
                  borderColor:
                    "#EF4444",
                },
              ]}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      "#EF4444",
                  },
                ]}
              />

              <Text
                style={[
                  styles.tierButtonText,
                  selectedTier === "High" &&
                    styles.tierButtonTextOn,
                ]}
              >
                High
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ================= PRODUCT GRID ================= */}

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#F5B94C"
            style={{
              marginTop: 50,
            }}
          />
        ) : (
          <View
            style={[
              styles.grid,
              mobile && styles.gridMobile,
            ]}
          >
            {finalProducts.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.card}
                activeOpacity={0.9}
                onPress={() =>
                  router.push({
                    pathname: "/detail",
                    params: {
                      id: String(p.id),
                    },
                  })
                }
              >
                {/* IMAGE */}

                <View style={styles.imageBox}>
                  {p.image_url ? (
                    <Image
                      source={{
                        uri: p.image_url,
                      }}
                      style={styles.image}
                    />
                  ) : (
                    <Ionicons
                      name="briefcase-outline"
                      size={70}
                      color="#64748B"
                    />
                  )}

                  {/* SALE */}

                  {p.discount_price != null && (
                    <View style={styles.sale}>
                      <Text
                        style={styles.saleText}
                      >
                        SALE
                      </Text>
                    </View>
                  )}

                  {/* ⭐ PRICE TIER BADGE */}

                  {p.priceTier && (
                    <View
                      style={[
                        styles.tierBadge,
                        {
                          backgroundColor:
                            getTierColor(
                              p.priceTier
                            ),
                        },
                      ]}
                    >
                      <Text
                        style={
                          styles.tierText
                        }
                      >
                        {p.priceTier}
                      </Text>
                    </View>
                  )}
                </View>

                {/* BRAND */}

                <Text style={styles.brand}>
                  {p.brand || "TRAVEL"}
                </Text>

                {/* NAME */}

                <Text
                  style={styles.productName}
                  numberOfLines={2}
                >
                  {p.product_name}
                </Text>

                {/* SPEC */}

                <Text style={styles.spec}>
                  {p.size_inch
                    ? `${p.size_inch}"`
                    : "-"}{" "}
                  · {p.material || "-"} ·{" "}
                  {p.wheel_count || 0} ล้อ
                </Text>

                {/* PRICE */}

                <View
                  style={styles.priceRow}
                >
                  <Text style={styles.price}>
                    {money(activePrice(p))}
                  </Text>

                  {p.discount_price !=
                    null && (
                    <Text
                      style={styles.old}
                    >
                      {money(p.price)}
                    </Text>
                  )}
                </View>

                {/* ADD CART */}

                <TouchableOpacity
                  style={[
                    styles.addButton,
                    addingId === p.id && {
                      opacity: 0.7,
                    },
                  ]}
                  onPress={(e: any) => {
                    e?.stopPropagation?.();
                    addCart(p);
                  }}
                  disabled={
                    p.stock_quantity <= 0 ||
                    addingId === p.id
                  }
                >
                  {addingId === p.id ? (
                    <ActivityIndicator
                      color="#F5B94C"
                      size="small"
                    />
                  ) : (
                    <Text
                      style={
                        styles.addButtonText
                      }
                    >
                      {p.stock_quantity > 0
                        ? "เพิ่มลงตะกร้า"
                        : "สินค้าหมด"}
                    </Text>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* EMPTY */}

        {!loading &&
          finalProducts.length === 0 && (
            <View style={styles.empty}>
              <Ionicons
                name="search-outline"
                size={50}
                color="#64748B"
              />

              <Text
                style={styles.emptyTitle}
              >
                ไม่พบสินค้า
              </Text>

              <Text
                style={styles.emptyText}
              >
                ลองเปลี่ยนระดับราคา แบรนด์
                หรือขนาด
              </Text>
            </View>
          )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#0B1220",
  },

  nav: {
    height: 72,
    backgroundColor: "#101827",
    borderBottomWidth: 1,
    borderBottomColor: "#202B3D",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 25,
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

  search: {
    height: 42,
    flex: 1,
    maxWidth: 650,
    backgroundColor: "#0B1220",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#283449",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 13,
  },

  searchInput: {
    flex: 1,
    color: "#F5F7FA",
    fontSize: 14,
    paddingHorizontal: 10,
  },

  searchBtn: {
    color: "#F5B94C",
    fontWeight: "800",
    paddingHorizontal: 15,
  },

  navRight: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 19,
  },

  cart: {
    position: "relative",
  },

  cartBadge: {
    position: "absolute",
    right: -9,
    top: -8,
    backgroundColor: "#F5B94C",
    borderRadius: 10,
    minWidth: 17,
    height: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#101827",
  },

  loginText: {
    color: "#DDE5EF",
    fontWeight: "700",
    fontSize: 13,
  },

  mobileSearch: {
    margin: 12,
    height: 42,
    backgroundColor: "#101827",
    borderWidth: 1,
    borderColor: "#283449",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  content: {
    maxWidth: 1240,
    width: "100%",
    alignSelf: "center",
    padding: 24,
    paddingBottom: 70,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#F7F9FC",
  },

  sectionSub: {
    fontSize: 12,
    color: "#7F8CA0",
    marginTop: 4,
  },

  link: {
    color: "#F5B94C",
    fontWeight: "700",
  },

  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 15,
  },

  filterLabel: {
    color: "#8F9BAD",
    fontSize: 12,
    fontWeight: "700",
    marginRight: 2,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2A374B",
  },

  chipOn: {
    backgroundColor: "#F5B94C",
    borderColor: "#F5B94C",
  },

  chipText: {
    color: "#AEB8C7",
    fontSize: 12,
  },

  chipTextOn: {
    color: "#101827",
    fontWeight: "900",
  },

  /* =====================================================
     ⭐ TIER FILTER
  ===================================================== */

  tierFilterContainer: {
    backgroundColor: "#101827",
    borderWidth: 1,
    borderColor: "#202D40",
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },

  tierTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 7,
  },

  tierFilterTitle: {
    color: "#F5F7FA",
    fontSize: 13,
    fontWeight: "800",
  },

  kmeansText: {
    color: "#7F8CA0",
    fontSize: 10,
    marginLeft: 4,
  },

  tierButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  tierButton: {
    minWidth: 80,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2A374B",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  tierButtonAllOn: {
    backgroundColor: "#F5B94C",
    borderColor: "#F5B94C",
  },

  tierButtonText: {
    color: "#AEB8C7",
    fontSize: 12,
    fontWeight: "800",
  },

  tierButtonTextOn: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 5,
  },

  /* =====================================================
     GRID
  ===================================================== */

  grid: {
    display: "grid" as any,
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))" as any,
    gap: 18,
  },

  gridMobile: {
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))" as any,
    gap: 12,
  },

  card: {
    backgroundColor: "#111A29",
    borderWidth: 1,
    borderColor: "#202D40",
    borderRadius: 15,
    padding: 12,
    overflow: "hidden",
  },

  imageBox: {
    height: 225,
    backgroundColor: "#F1F3F5",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  sale: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#C84C4C",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },

  saleText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
  },

  /* ⭐ K-MEANS BADGE */

  tierBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    zIndex: 10,
  },

  tierText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  brand: {
    color: "#F5B94C",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 12,
    textTransform: "uppercase",
  },

  productName: {
    color: "#F2F5F8",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 4,
    minHeight: 40,
  },

  spec: {
    color: "#78869A",
    fontSize: 11,
    marginTop: 4,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },

  price: {
    color: "#F7F9FC",
    fontSize: 18,
    fontWeight: "900",
  },

  old: {
    color: "#667388",
    textDecorationLine: "line-through",
    fontSize: 11,
  },

  addButton: {
    height: 38,
    borderRadius: 8,
    backgroundColor: "#1D2A3D",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 11,
  },

  addButtonText: {
    color: "#F5B94C",
    fontWeight: "800",
    fontSize: 12,
  },

  empty: {
    alignItems: "center",
    paddingVertical: 70,
  },

  emptyTitle: {
    color: "#E7ECF3",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 15,
  },

  emptyText: {
    color: "#78869A",
    marginTop: 6,
  },
});