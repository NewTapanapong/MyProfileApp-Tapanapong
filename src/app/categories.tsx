import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API = "http://119.59.102.161:3081/api/products";

type PriceTier = "Low" | "Mid" | "High";

type Product = {
  id: number;
  product_name: string;
  brand: string | null;
  sku: string | null;
  size_inch: number | null;
  material: string | null;
  color: string | null;
  price: number;
  discount_price: number | null;
  image_url: string | null;
  priceTier?: PriceTier;
};

const money = (n: number) =>
  `฿${Number(n || 0).toLocaleString("th-TH")}`;

/* =========================================================
   K-MEANS แบ่งราคาเป็น Low / Mid / High
========================================================= */
const clusterPricesLocally = (data: Product[]): Product[] => {
  if (!data || data.length === 0) return [];

  // ถ้ามีสินค้าน้อยกว่า 3 ตัว
  if (data.length < 3) {
    const sorted = [...data].sort(
      (a, b) => getActivePrice(a) - getActivePrice(b)
    );

    return sorted.map((item, index) => ({
      ...item,
      priceTier:
        data.length === 1
          ? "Mid"
          : index === 0
          ? "Low"
          : "High",
    }));
  }

  const prices = data.map((item) => getActivePrice(item));

  let centroids = [
    Math.min(...prices),
    (Math.min(...prices) + Math.max(...prices)) / 2,
    Math.max(...prices),
  ];

  let assignments: number[] = [];
  let changed = true;
  let safety = 0;

  while (changed && safety < 100) {
    safety++;
    changed = false;

    // หาว่าแต่ละสินค้าอยู่กลุ่มไหน
    assignments = prices.map((price) => {
      const diffs = centroids.map((c) => Math.abs(price - c));
      return diffs.indexOf(Math.min(...diffs));
    });

    // คำนวณ centroid ใหม่
    const newCentroids = [0, 1, 2].map((i) => {
      const clusterPrices = prices.filter(
        (_, index) => assignments[index] === i
      );

      if (clusterPrices.length === 0) {
        return centroids[i];
      }

      return (
        clusterPrices.reduce((sum, value) => sum + value, 0) /
        clusterPrices.length
      );
    });

    if (
      newCentroids.some(
        (value, index) => Math.abs(value - centroids[index]) > 0.01
      )
    ) {
      centroids = newCentroids;
      changed = true;
    }
  }

  // เรียง centroid จากถูก -> แพง
  const sortedIndexes = [0, 1, 2].sort(
    (a, b) => centroids[a] - centroids[b]
  );

  const labels: PriceTier[] = ["Low", "Mid", "High"];

  const tierByCluster: Record<number, PriceTier> = {
    [sortedIndexes[0]]: labels[0],
    [sortedIndexes[1]]: labels[1],
    [sortedIndexes[2]]: labels[2],
  };

  return data.map((item, index) => ({
    ...item,
    priceTier: tierByCluster[assignments[index]],
  }));
};

const getActivePrice = (item: Product) =>
  item.discount_price != null
    ? Number(item.discount_price)
    : Number(item.price);

/* =========================================================
   MAIN
========================================================= */
export default function Categories() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // ⭐ กลุ่มราคาที่เลือก
  const [selectedTier, setSelectedTier] = useState<PriceTier | "All">(
    "All"
  );

  /* โหลดสินค้า */
  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((d) => {
        setProducts(Array.isArray(d) ? d : []);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  /* =========================================================
     ทำ K-Means กับสินค้าทั้งหมดก่อน
  ========================================================= */
  const clusteredProducts = useMemo(() => {
    return clusterPricesLocally(products);
  }, [products]);

  /* =========================================================
     กรองตาม Search + Low/Mid/High
  ========================================================= */
  const filteredProducts = useMemo(() => {
    const search = query.toLowerCase().trim();

    return clusteredProducts.filter((product) => {
      const matchSearch =
        search === "" ||
        [
          product.product_name,
          product.brand,
          product.sku,
          product.material,
          product.color,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(search)
        );

      const matchTier =
        selectedTier === "All" ||
        product.priceTier === selectedTier;

      return matchSearch && matchTier;
    });
  }, [clusteredProducts, query, selectedTier]);

  /* =========================================================
     จัดกลุ่มตามขนาด
  ========================================================= */
  const groups = useMemo(() => {
    const map = new Map<string, Product[]>();

    filteredProducts.forEach((product) => {
      const key = product.size_inch
        ? `${product.size_inch} นิ้ว`
        : "ไม่ระบุขนาด";

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key)!.push(product);
    });

    return [...map.entries()].sort((a, b) => {
      const sizeA = parseInt(a[0]) || 999;
      const sizeB = parseInt(b[0]) || 999;

      return sizeA - sizeB;
    });
  }, [filteredProducts]);

  /* =========================================================
     สีของ Tier
  ========================================================= */
  const getTierColor = (tier: PriceTier) => {
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
     จำนวนสินค้าแต่ละ Tier
  ========================================================= */
  const tierCounts = useMemo(() => {
    return {
      Low: clusteredProducts.filter((p) => p.priceTier === "Low").length,
      Mid: clusteredProducts.filter((p) => p.priceTier === "Mid").length,
      High: clusteredProducts.filter((p) => p.priceTier === "High").length,
    };
  }, [clusteredProducts]);

  return (
    <View style={styles.page}>

      {/* ================= HEADER ================= */}
      <View style={styles.head}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#F5F7FA"
          />
        </TouchableOpacity>

        <Text style={styles.title}>
          หมวดหมู่กระเป๋า
        </Text>
      </View>

      {/* ================= SEARCH ================= */}
      <View style={styles.search}>
        <Ionicons
          name="search"
          size={18}
          color="#7B879A"
        />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="ค้นหาสินค้า..."
          placeholderTextColor="#7B879A"
          style={styles.input}
        />

        {query !== "" && (
          <TouchableOpacity
            onPress={() => setQuery("")}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color="#7B879A"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* =================================================
          ⭐ PRICE CLUSTER FILTER
      ================================================== */}
      <View style={styles.tierSection}>

        <Text style={styles.tierLabel}>
          ระดับราคา
        </Text>

        <View style={styles.tierButtons}>

          {/* ALL */}
          <TouchableOpacity
            onPress={() => setSelectedTier("All")}
            style={[
              styles.tierButton,
              selectedTier === "All" &&
                styles.tierButtonActive,
            ]}
          >
            <Text
              style={[
                styles.tierButtonText,
                selectedTier === "All" &&
                  styles.tierButtonTextActive,
              ]}
            >
              ทั้งหมด
            </Text>

            <Text
              style={[
                styles.tierCount,
                selectedTier === "All" &&
                  styles.tierCountActive,
              ]}
            >
              {clusteredProducts.length}
            </Text>
          </TouchableOpacity>

          {/* LOW */}
          <TouchableOpacity
            onPress={() => setSelectedTier("Low")}
            style={[
              styles.tierButton,
              selectedTier === "Low" && {
                backgroundColor: "#10B981",
                borderColor: "#10B981",
              },
            ]}
          >
            <View style={styles.tierDot}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: "#10B981" },
                ]}
              />
            </View>

            <Text
              style={[
                styles.tierButtonText,
                selectedTier === "Low" && {
                  color: "#FFFFFF",
                  fontWeight: "900",
                },
              ]}
            >
              Low
            </Text>

            <Text
              style={[
                styles.tierCount,
                selectedTier === "Low" && {
                  color: "#FFFFFF",
                },
              ]}
            >
              {tierCounts.Low}
            </Text>
          </TouchableOpacity>

          {/* MID */}
          <TouchableOpacity
            onPress={() => setSelectedTier("Mid")}
            style={[
              styles.tierButton,
              selectedTier === "Mid" && {
                backgroundColor: "#3B82F6",
                borderColor: "#3B82F6",
              },
            ]}
          >
            <View style={styles.tierDot}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: "#3B82F6" },
                ]}
              />
            </View>

            <Text
              style={[
                styles.tierButtonText,
                selectedTier === "Mid" && {
                  color: "#FFFFFF",
                  fontWeight: "900",
                },
              ]}
            >
              Mid
            </Text>

            <Text
              style={[
                styles.tierCount,
                selectedTier === "Mid" && {
                  color: "#FFFFFF",
                },
              ]}
            >
              {tierCounts.Mid}
            </Text>
          </TouchableOpacity>

          {/* HIGH */}
          <TouchableOpacity
            onPress={() => setSelectedTier("High")}
            style={[
              styles.tierButton,
              selectedTier === "High" && {
                backgroundColor: "#EF4444",
                borderColor: "#EF4444",
              },
            ]}
          >
            <View style={styles.tierDot}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: "#EF4444" },
                ]}
              />
            </View>

            <Text
              style={[
                styles.tierButtonText,
                selectedTier === "High" && {
                  color: "#FFFFFF",
                  fontWeight: "900",
                },
              ]}
            >
              High
            </Text>

            <Text
              style={[
                styles.tierCount,
                selectedTier === "High" && {
                  color: "#FFFFFF",
                },
              ]}
            >
              {tierCounts.High}
            </Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* =================================================
          CONTENT
      ================================================== */}
      {loading ? (
        <ActivityIndicator
          color="#F5B94C"
          size="large"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item[0]}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}

          ListHeaderComponent={
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>
                {selectedTier === "All"
                  ? "สินค้าทั้งหมด"
                  : `สินค้า ${selectedTier}`}
              </Text>

              <Text style={styles.resultCount}>
                {filteredProducts.length} รายการ
              </Text>
            </View>
          }

          renderItem={({ item }) => (
            <View style={styles.group}>

              {/* GROUP HEADER */}
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>
                  {item[0]}
                </Text>

                <Text style={styles.groupCount}>
                  {item[1].length} รายการ
                </Text>
              </View>

              {/* PRODUCTS */}
              <View style={styles.items}>
                {item[1].map((product) => {

                  const tierColor = getTierColor(
                    product.priceTier || "Mid"
                  );

                  return (
                    <TouchableOpacity
                      key={product.id}
                      style={styles.card}
                      onPress={() =>
                        router.push({
                          pathname: "/detail",
                          params: {
                            id: String(product.id),
                          },
                        })
                      }
                      activeOpacity={0.7}
                    >

                      {/* IMAGE */}
                      {product.image_url ? (
                        <Image
                          source={{
                            uri: product.image_url,
                          }}
                          style={styles.cardImg}
                        />
                      ) : (
                        <View
                          style={[
                            styles.cardImg,
                            styles.noImg,
                          ]}
                        >
                          <Ionicons
                            name="briefcase-outline"
                            size={22}
                            color="#69778B"
                          />
                        </View>
                      )}

                      {/* INFO */}
                      <View
                        style={{
                          flex: 1,
                          justifyContent: "center",
                        }}
                      >
                        <View style={styles.nameRow}>
                          <Text
                            style={styles.cardName}
                            numberOfLines={1}
                          >
                            {product.product_name}
                          </Text>

                          {/* ⭐ PRICE BADGE */}
                          <View
                            style={[
                              styles.priceBadge,
                              {
                                backgroundColor:
                                  tierColor + "22",
                                borderColor:
                                  tierColor,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.priceBadgeText,
                                {
                                  color: tierColor,
                                },
                              ]}
                            >
                              {product.priceTier}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.cardBrand}>
                          {product.brand || "ทั่วไป"}
                        </Text>

                        <Text style={styles.price}>
                          {money(
                            getActivePrice(product)
                          )}
                        </Text>
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#69778B"
                      />

                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          /* ไม่มีสินค้า */
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="search-outline"
                size={55}
                color="#64748B"
              />

              <Text style={styles.emptyTitle}>
                ไม่พบสินค้า
              </Text>

              <Text style={styles.emptyText}>
                ลองเปลี่ยนระดับราคา หรือคำค้นหา
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#0B1220",
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },

  backBtn: {
    padding: 4,
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#F5F7FA",
  },

  search: {
    height: 44,
    borderWidth: 1,
    borderColor: "#233047",
    borderRadius: 10,
    backgroundColor: "#111A29",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 14,
  },

  input: {
    flex: 1,
    color: "#F5F7FA",
    paddingHorizontal: 8,
    fontSize: 14,
  },

  /* ================= PRICE FILTER ================= */

  tierSection: {
    marginBottom: 18,
  },

  tierLabel: {
    color: "#AEB8C7",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
  },

  tierButtons: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },

  tierButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2A374B",
    backgroundColor: "#111A29",
  },

  tierButtonActive: {
    backgroundColor: "#F5B94C",
    borderColor: "#F5B94C",
  },

  tierButtonText: {
    color: "#AEB8C7",
    fontSize: 12,
    fontWeight: "800",
  },

  tierButtonTextActive: {
    color: "#101827",
    fontWeight: "900",
  },

  tierCount: {
    color: "#69778B",
    fontSize: 11,
    fontWeight: "700",
  },

  tierCountActive: {
    color: "#101827",
  },

  tierDot: {
    alignItems: "center",
    justifyContent: "center",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  /* ================= RESULT ================= */

  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  resultTitle: {
    color: "#F5F7FA",
    fontSize: 16,
    fontWeight: "900",
  },

  resultCount: {
    color: "#69778B",
    fontSize: 12,
  },

  list: {
    paddingBottom: 80,
  },

  /* ================= GROUP ================= */

  group: {
    marginBottom: 20,
  },

  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },

  groupTitle: {
    color: "#F5B94C",
    fontSize: 18,
    fontWeight: "900",
  },

  groupCount: {
    color: "#69778B",
    fontSize: 12,
  },

  items: {
    gap: 8,
  },

  /* ================= PRODUCT CARD ================= */

  card: {
    backgroundColor: "#111A29",
    borderWidth: 1,
    borderColor: "#233047",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  cardImg: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },

  noImg: {
    backgroundColor: "#1D283A",
    alignItems: "center",
    justifyContent: "center",
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  cardName: {
    color: "#F5F7FA",
    fontWeight: "700",
    fontSize: 13,
    flex: 1,
  },

  cardBrand: {
    color: "#69778B",
    fontSize: 11,
    marginTop: 2,
  },

  price: {
    color: "#22D3EE",
    fontWeight: "800",
    fontSize: 12,
    marginTop: 2,
  },

  /* ⭐ Badge Low Mid High บนสินค้า */

  priceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },

  priceBadgeText: {
    fontSize: 9,
    fontWeight: "900",
  },

  /* ================= EMPTY ================= */

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