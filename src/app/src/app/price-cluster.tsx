import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// ==========================================
// API
// ==========================================

const API_URL =
  "http://119.59.102.161:3081/api/tapanapong-stock";

// ==========================================
// COLORS
// ==========================================

const COLORS = {
  primary: "#F59E0B",

  background: "#090D16",
  cardBg: "#111827",
  border: "#1F2937",

  text: "#F9FAFB",
  textSecondary: "#9CA3AF",

  low: "#10B981",
  mid: "#3B82F6",
  high: "#EF4444",

  lowBg: "#10B98120",
  midBg: "#3B82F620",
  highBg: "#EF444420",
};

// ==========================================
// PRODUCT TYPE
// ==========================================

interface ProductItem {
  id: number;
  product_name: string;
  tshirt_type: string;
  model: string;
  price: string | number;
  country: string;

  priceTier?: "Low" | "Mid" | "High";
}

// ==========================================
// K-MEANS CLUSTERING
// ==========================================

const clusterPricesLocally = (
  data: ProductItem[]
): ProductItem[] => {
  if (!data || data.length === 0) {
    return [];
  }

  const prices = data.map((item) =>
    Number(item.price)
  );

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // ถ้าราคาทั้งหมดเท่ากัน
  if (minPrice === maxPrice) {
    return data.map((item) => ({
      ...item,
      priceTier: "Mid",
    }));
  }

  let centroids = [
    minPrice,
    (minPrice + maxPrice) / 2,
    maxPrice,
  ];

  let assignments = new Array(prices.length).fill(0);

  for (let iteration = 0; iteration < 100; iteration++) {
    let changed = false;

    // ------------------------------
    // Assign
    // ------------------------------

    const newAssignments = prices.map((price) => {
      let closest = 0;
      let minDistance = Math.abs(
        price - centroids[0]
      );

      for (let i = 1; i < centroids.length; i++) {
        const distance = Math.abs(
          price - centroids[i]
        );

        if (distance < minDistance) {
          minDistance = distance;
          closest = i;
        }
      }

      return closest;
    });

    // ตรวจสอบว่ามีการเปลี่ยนกลุ่มหรือไม่
    for (let i = 0; i < assignments.length; i++) {
      if (assignments[i] !== newAssignments[i]) {
        changed = true;
        break;
      }
    }

    assignments = newAssignments;

    // ------------------------------
    // Calculate new centroids
    // ------------------------------

    const newCentroids = [0, 1, 2].map(
      (clusterIndex) => {
        const clusterPrices = prices.filter(
          (_, index) =>
            assignments[index] === clusterIndex
        );

        if (clusterPrices.length === 0) {
          return centroids[clusterIndex];
        }

        return (
          clusterPrices.reduce(
            (sum, price) => sum + price,
            0
          ) / clusterPrices.length
        );
      }
    );

    centroids = newCentroids;

    if (!changed) {
      break;
    }
  }

  // ==========================================
  // เรียง centroid จากถูก → แพง
  // ==========================================

  const clusterOrder = [0, 1, 2].sort(
    (a, b) => centroids[a] - centroids[b]
  );

  const labels: (
    "Low" | "Mid" | "High"
  )[] = ["Low", "Mid", "High"];

  // ==========================================
  // ใส่ Tier ให้สินค้า
  // ==========================================

  return data.map((item, index) => {
    const clusterIndex = assignments[index];

    const position =
      clusterOrder.indexOf(clusterIndex);

    return {
      ...item,
      priceTier: labels[position],
    };
  });
};

// ==========================================
// SCREEN
// ==========================================

export default function PriceClusterScreen() {
  const [inventory, setInventory] = useState<
    ProductItem[]
  >([]);

  const [loading, setLoading] = useState(true);

  const { width } = useWindowDimensions();

  // ==========================================
  // HIGH / MID / LOW RESPONSIVE
  // ==========================================

  let numColumns = 1;

  if (width >= 1200) {
    // High
    numColumns = 3;
  } else if (width >= 700) {
    // Mid
    numColumns = 2;
  } else {
    // Low
    numColumns = 1;
  }

  // ==========================================
  // FETCH DATA
  // ==========================================

  const fetchAndClusterData = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(
          `HTTP Error: ${response.status}`
        );
      }

      const json = await response.json();

      console.log("API DATA:", json);

      if (
        json.success &&
        Array.isArray(json.data)
      ) {
        const clusteredData =
          clusterPricesLocally(json.data);

        setInventory(clusteredData);
      } else {
        setInventory([]);
      }
    } catch (error) {
      console.error(
        "Fetch error:",
        error
      );

      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD
  // ==========================================

  useEffect(() => {
    fetchAndClusterData();
  }, []);

  // ==========================================
  // TIER COLOR
  // ==========================================

  const getTierColor = (
    tier?: string
  ) => {
    switch (tier) {
      case "Low":
        return COLORS.low;

      case "Mid":
        return COLORS.mid;

      case "High":
        return COLORS.high;

      default:
        return COLORS.primary;
    }
  };

  // ==========================================
  // TIER BACKGROUND
  // ==========================================

  const getTierBackground = (
    tier?: string
  ) => {
    switch (tier) {
      case "Low":
        return COLORS.lowBg;

      case "Mid":
        return COLORS.midBg;

      case "High":
        return COLORS.highBg;

      default:
        return "#F59E0B20";
    }
  };

  // ==========================================
  // RENDER PRODUCT
  // ==========================================

  const renderProduct = ({
    item,
  }: {
    item: ProductItem;
  }) => {
    const tierColor =
      getTierColor(item.priceTier);

    const tierBackground =
      getTierBackground(item.priceTier);

    return (
      <View
        style={[
          styles.card,
          {
            width:
              numColumns === 1
                ? "100%"
                : numColumns === 2
                ? "48%"
                : "31%",
          },
        ]}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text
              style={styles.productTitle}
              numberOfLines={2}
            >
              {item.product_name}
            </Text>

            <Text style={styles.typeText}>
              {item.tshirt_type}
            </Text>
          </View>

          {/* PRICE TIER */}
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  tierBackground,
                borderColor: tierColor,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color: tierColor,
                },
              ]}
            >
              {item.priceTier}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Details */}
        <View style={styles.detailRow}>
          <Text style={styles.label}>
            Model
          </Text>

          <Text style={styles.value}>
            {item.model}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>
            Country
          </Text>

          <Text style={styles.value}>
            {item.country}
          </Text>
        </View>

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>
            Price
          </Text>

          <Text
            style={[
              styles.priceText,
              {
                color: tierColor,
              },
            ]}
          >
            ${Number(item.price).toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  // ==========================================
  // SCREEN
  // ==========================================

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.background}
      />

      {/* =====================================
          HEADER
      ====================================== */}

      <View style={styles.header}>
        {/* Back */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={COLORS.text}
          />
        </TouchableOpacity>

        {/* Title */}
        <View
          style={{
            flex: 1,
            marginLeft: 12,
          }}
        >
          <Text style={styles.headerTitle}>
            AI Price Clustering
          </Text>

          <Text
            style={styles.headerSubtitle}
          >
            จัดกลุ่มราคาด้วย K-Means
          </Text>
        </View>

        {/* Refresh */}
        <TouchableOpacity
          onPress={fetchAndClusterData}
          style={styles.refreshBtn}
        >
          <Ionicons
            name="refresh"
            size={21}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      {/* =====================================
          TIER SUMMARY
      ====================================== */}

      {!loading &&
        inventory.length > 0 && (
          <View style={styles.summaryContainer}>
            {/* LOW */}
            <View
              style={[
                styles.summaryBox,
                {
                  borderColor:
                    COLORS.low,
                },
              ]}
            >
              <Text
                style={[
                  styles.summaryNumber,
                  {
                    color:
                      COLORS.low,
                  },
                ]}
              >
                {
                  inventory.filter(
                    (x) =>
                      x.priceTier ===
                      "Low"
                  ).length
                }
              </Text>

              <Text style={styles.summaryLabel}>
                LOW
              </Text>
            </View>

            {/* MID */}
            <View
              style={[
                styles.summaryBox,
                {
                  borderColor:
                    COLORS.mid,
                },
              ]}
            >
              <Text
                style={[
                  styles.summaryNumber,
                  {
                    color:
                      COLORS.mid,
                  },
                ]}
              >
                {
                  inventory.filter(
                    (x) =>
                      x.priceTier ===
                      "Mid"
                  ).length
                }
              </Text>

              <Text style={styles.summaryLabel}>
                MID
              </Text>
            </View>

            {/* HIGH */}
            <View
              style={[
                styles.summaryBox,
                {
                  borderColor:
                    COLORS.high,
                },
              ]}
            >
              <Text
                style={[
                  styles.summaryNumber,
                  {
                    color:
                      COLORS.high,
                  },
                ]}
              >
                {
                  inventory.filter(
                    (x) =>
                      x.priceTier ===
                      "High"
                  ).length
                }
              </Text>

              <Text style={styles.summaryLabel}>
                HIGH
              </Text>
            </View>
          </View>
        )}

      {/* =====================================
          CONTENT
      ====================================== */}

      {loading ? (
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />

          <Text
            style={styles.loadingText}
          >
            กำลังประมวลผล K-Means...
          </Text>
        </View>
      ) : inventory.length === 0 ? (
        <View
          style={
            styles.emptyContainer
          }
        >
          <Ionicons
            name="cube-outline"
            size={60}
            color={
              COLORS.textSecondary
            }
          />

          <Text
            style={styles.emptyTitle}
          >
            ไม่พบข้อมูลสินค้า
          </Text>

          <Text
            style={styles.emptyText}
          >
            ตรวจสอบ API หรือฐานข้อมูล
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={
              fetchAndClusterData
            }
          >
            <Text
              style={
                styles.retryText
              }
            >
              ลองใหม่
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          key={numColumns}
          data={inventory}
          numColumns={numColumns}
          keyExtractor={(item) =>
            item.id.toString()
          }
          contentContainerStyle={
            styles.listContent
          }
          columnWrapperStyle={
            numColumns > 1
              ? styles.columnWrapper
              : undefined
          }
          renderItem={renderProduct}
          showsVerticalScrollIndicator={
            false
        }
        />
      )}
    </SafeAreaView>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  // ========================================
  // HEADER
  // ========================================

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,

    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,

    backgroundColor:
      COLORS.cardBg,
  },

  backButton: {
    width: 38,
    height: 38,

    borderRadius: 19,

    backgroundColor:
      "#0B0F19",

    justifyContent: "center",
    alignItems: "center",

    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  refreshBtn: {
    padding: 8,
  },

  // ========================================
  // SUMMARY
  // ========================================

  summaryContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },

  summaryBox: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    paddingVertical: 10,

    borderRadius: 10,

    backgroundColor:
      COLORS.cardBg,

    borderWidth: 1,
  },

  summaryNumber: {
    fontSize: 20,
    fontWeight: "900",
  },

  summaryLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },

  // ========================================
  // LIST
  // ========================================

  listContent: {
    padding: 12,
    paddingBottom: 30,
  },

  columnWrapper: {
    justifyContent: "space-between",
  },

  // ========================================
  // CARD
  // ========================================

  card: {
    backgroundColor:
      COLORS.cardBg,

    borderRadius: 14,

    padding: 14,

    marginBottom: 12,

    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  productTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },

  typeText: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,

    borderRadius: 10,

    borderWidth: 1,

    marginLeft: 8,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "900",
  },

  divider: {
    height: 1,

    backgroundColor:
      COLORS.border,

    marginVertical: 12,
  },

  // ========================================
  // DETAILS
  // ========================================

  detailRow: {
    flexDirection: "row",
    justifyContent:
      "space-between",

    marginBottom: 7,
  },

  label: {
    fontSize: 12,
    color:
      COLORS.textSecondary,
  },

  value: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: "600",
  },

  // ========================================
  // PRICE
  // ========================================

  priceContainer: {
    flexDirection: "row",
    justifyContent:
      "space-between",

    alignItems: "center",

    marginTop: 5,
  },

  priceLabel: {
    fontSize: 12,
    color:
      COLORS.textSecondary,
  },

  priceText: {
    fontSize: 20,
    fontWeight: "900",
  },

  // ========================================
  // LOADING
  // ========================================

  loadingContainer: {
    flex: 1,

    justifyContent:
      "center",

    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,

    color:
      COLORS.textSecondary,

    fontSize: 14,
  },

  // ========================================
  // EMPTY
  // ========================================

  emptyContainer: {
    flex: 1,

    justifyContent:
      "center",

    alignItems: "center",

    paddingHorizontal: 30,
  },

  emptyTitle: {
    marginTop: 15,

    fontSize: 18,
    fontWeight: "800",

    color: COLORS.text,
  },

  emptyText: {
    marginTop: 6,

    fontSize: 13,

    color:
      COLORS.textSecondary,

    textAlign: "center",
  },

  retryButton: {
    marginTop: 20,

    backgroundColor:
      COLORS.primary,

    paddingHorizontal: 25,
    paddingVertical: 11,

    borderRadius: 10,
  },

  retryText: {
    color: "#000",
    fontWeight: "800",
  },
});