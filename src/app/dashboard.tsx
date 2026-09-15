import { useAuth } from "@/context-auth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API = "http://119.59.102.161:3081/api/products";

const money = (n: number) =>
  `฿${Number(n || 0).toLocaleString("th-TH")}`;

// =========================
// Stock Level
// =========================
type StockLevel = "ALL" | "HIGH" | "MID" | "LOW" | "OUT";

const getStockLevel = (item: any): StockLevel => {
  const stock = Number(item.stock_quantity || 0);

  if (stock <= 0 || item.status === "out_of_stock") {
    return "OUT";
  }

  if (stock > 10) {
    return "HIGH";
  }

  if (stock >= 5) {
    return "MID";
  }

  return "LOW";
};

// =========================
// Dashboard
// =========================
export default function Dashboard() {
  const { token, user } = useAuth();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<StockLevel>("ALL");

  // =========================
  // Check Admin + Get Products
  // =========================
  useEffect(() => {
    if (user?.role !== "admin") {
      router.replace("/");
      return;
    }

    fetch(API, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => r.json())
      .then((d) => {
        setProducts(Array.isArray(d) ? d : []);
      })
      .catch((err) => {
        console.log("Dashboard API Error:", err);
        setProducts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, user]);

  // =========================
  // Statistics
  // =========================
  const stock = products.reduce(
    (a, x) => a + Number(x.stock_quantity || 0),
    0
  );

  const value = products.reduce(
    (a, x) =>
      a +
      Number(x.price || 0) *
        Number(x.stock_quantity || 0),
    0
  );

  const sale = products.filter(
    (x) => x.discount_price != null
  ).length;

  const out = products.filter(
    (x) =>
      Number(x.stock_quantity || 0) <= 0 ||
      x.status === "out_of_stock"
  ).length;

  // =========================
  // Count High / Mid / Low / Out
  // =========================
  const highCount = products.filter(
    (x) => getStockLevel(x) === "HIGH"
  ).length;

  const midCount = products.filter(
    (x) => getStockLevel(x) === "MID"
  ).length;

  const lowCount = products.filter(
    (x) => getStockLevel(x) === "LOW"
  ).length;

  const outCount = products.filter(
    (x) => getStockLevel(x) === "OUT"
  ).length;

  // =========================
  // Filter Products
  // =========================
  const filteredProducts = useMemo(() => {
    if (filter === "ALL") {
      return products;
    }

    return products.filter(
      (item) => getStockLevel(item) === filter
    );
  }, [products, filter]);

  if (user?.role !== "admin") {
    return null;
  }

  // =========================
  // Header
  // =========================
  const ListHeader = () => (
    <>
      {/* Header */}
      <View style={s.head}>
        <TouchableOpacity
          onPress={() => router.replace("/")}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#F5F7FA"
          />
        </TouchableOpacity>

        <Text style={s.title}>จัดการร้านค้า</Text>

        <TouchableOpacity
          style={s.add}
          onPress={() => router.push("/add")}
        >
          <Text style={s.addText}>+ เพิ่มสินค้า</Text>
        </TouchableOpacity>
      </View>

      {/* =========================
          Statistics
         ========================= */}
      <View style={s.stats}>
        <Stat
          value={products.length}
          label="สินค้าทั้งหมด"
        />

        <Stat
          value={stock}
          label="สต็อกรวม"
        />

        <Stat
          value={money(value)}
          label="มูลค่าสต็อก"
        />

        <Stat
          value={sale}
          label="มีส่วนลด"
        />

        <Stat
          value={out}
          label="หมด/ปิดขาย"
        />
      </View>

      {/* =========================
          Stock Level Summary
         ========================= */}
      <Text style={s.sectionTitle}>
        ระดับสต็อกสินค้า
      </Text>

      <View style={s.levelCards}>
        <LevelCard
          level="HIGH"
          count={highCount}
          active={filter === "HIGH"}
          onPress={() => setFilter("HIGH")}
        />

        <LevelCard
          level="MID"
          count={midCount}
          active={filter === "MID"}
          onPress={() => setFilter("MID")}
        />

        <LevelCard
          level="LOW"
          count={lowCount}
          active={filter === "LOW"}
          onPress={() => setFilter("LOW")}
        />

        <LevelCard
          level="OUT"
          count={outCount}
          active={filter === "OUT"}
          onPress={() => setFilter("OUT")}
        />
      </View>

      {/* =========================
          Filter Buttons
         ========================= */}
      <Text style={s.sectionTitle}>
        รายการสินค้า
      </Text>

      <View style={s.filters}>
        <FilterButton
          title="ทั้งหมด"
          active={filter === "ALL"}
          onPress={() => setFilter("ALL")}
        />

        <FilterButton
          title="HIGH"
          active={filter === "HIGH"}
          onPress={() => setFilter("HIGH")}
        />

        <FilterButton
          title="MID"
          active={filter === "MID"}
          onPress={() => setFilter("MID")}
        />

        <FilterButton
          title="LOW"
          active={filter === "LOW"}
          onPress={() => setFilter("LOW")}
        />

        <FilterButton
          title="OUT"
          active={filter === "OUT"}
          onPress={() => setFilter("OUT")}
        />
      </View>
    </>
  );

  // =========================
  // Render
  // =========================
  return (
    <View style={s.page}>
      {loading ? (
        <ActivityIndicator
          color="#F5B94C"
          size="large"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{
            paddingBottom: 50,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons
                name="cube-outline"
                size={40}
                color="#718096"
              />

              <Text style={s.emptyText}>
                ไม่มีสินค้าในระดับนี้
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const level = getStockLevel(item);

            return (
              <View style={s.row}>
                {/* Product Info */}
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>
                    {item.product_name}
                  </Text>

                  <Text style={s.meta}>
                    {item.brand || "-"} · SKU{" "}
                    {item.sku || "-"} ·{" "}
                    {item.size_inch || "-"} นิ้ว
                  </Text>
                </View>

                {/* Stock */}
                <View style={s.stockBox}>
                  <Text style={s.stock}>
                    {item.stock_quantity || 0} ชิ้น
                  </Text>

                  <StockBadge level={level} />
                </View>

                {/* Edit */}
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/add",
                      params: {
                        id: String(item.id),
                      },
                    })
                  }
                >
                  <Ionicons
                    name="create-outline"
                    size={22}
                    color="#F5B94C"
                  />
                </TouchableOpacity>

                {/* Detail */}
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/detail",
                      params: {
                        id: String(item.id),
                      },
                    })
                  }
                >
                  <Ionicons
                    name="eye-outline"
                    size={22}
                    color="#AEB8C7"
                  />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

// =========================
// Stat Component
// =========================
function Stat({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <View style={s.stat}>
      <Text style={s.value}>{value}</Text>

      <Text style={s.label}>{label}</Text>
    </View>
  );
}

// =========================
// Level Card
// =========================
function LevelCard({
  level,
  count,
  active,
  onPress,
}: {
  level: "HIGH" | "MID" | "LOW" | "OUT";
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  const config = {
    HIGH: {
      icon: "arrow-up-circle-outline" as const,
      color: "#22C55E",
      label: "สต็อกสูง",
    },

    MID: {
      icon: "remove-circle-outline" as const,
      color: "#F5B94C",
      label: "สต็อกกลาง",
    },

    LOW: {
      icon: "arrow-down-circle-outline" as const,
      color: "#EF4444",
      label: "สต็อกต่ำ",
    },

    OUT: {
      icon: "close-circle-outline" as const,
      color: "#94A3B8",
      label: "หมดสินค้า",
    },
  };

  const c = config[level];

  return (
    <TouchableOpacity
      style={[
        s.levelCard,
        active && {
          borderColor: c.color,
          borderWidth: 2,
        },
      ]}
      onPress={onPress}
    >
      <View style={s.levelTop}>
        <Ionicons
          name={c.icon}
          size={22}
          color={c.color}
        />

        <Text
          style={[
            s.levelName,
            { color: c.color },
          ]}
        >
          {level}
        </Text>
      </View>

      <Text style={s.levelCount}>{count}</Text>

      <Text style={s.levelLabel}>{c.label}</Text>
    </TouchableOpacity>
  );
}

// =========================
// Filter Button
// =========================
function FilterButton({
  title,
  active,
  onPress,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        s.filterButton,
        active && s.filterButtonActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          s.filterText,
          active && s.filterTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

// =========================
// Stock Badge
// =========================
function StockBadge({
  level,
}: {
  level: StockLevel;
}) {
  const config = {
    HIGH: {
      color: "#22C55E",
      text: "HIGH",
    },

    MID: {
      color: "#F5B94C",
      text: "MID",
    },

    LOW: {
      color: "#EF4444",
      text: "LOW",
    },

    OUT: {
      color: "#94A3B8",
      text: "OUT",
    },

    ALL: {
      color: "#94A3B8",
      text: "-",
    },
  };

  const c = config[level];

  return (
    <View
      style={[
        s.badge,
        {
          borderColor: c.color,
        },
      ]}
    >
      <Text
        style={[
          s.badgeText,
          {
            color: c.color,
          },
        ]}
      >
        {c.text}
      </Text>
    </View>
  );
}

// =========================
// Styles
// =========================
const s = StyleSheet.create({
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

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#F5F7FA",
  },

  add: {
    marginLeft: "auto",
    backgroundColor: "#F5B94C",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },

  addText: {
    color: "#101827",
    fontWeight: "900",
    fontSize: 13,
  },

  // =========================
  // Stats
  // =========================
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },

  stat: {
    backgroundColor: "#111A29",
    borderWidth: 1,
    borderColor: "#253248",
    borderRadius: 12,
    padding: 12,
    width: "48%",
  },

  value: {
    color: "#F5B94C",
    fontSize: 18,
    fontWeight: "900",
  },

  label: {
    color: "#7E8A9E",
    fontSize: 11,
    marginTop: 2,
  },

  // =========================
  // Section
  // =========================
  sectionTitle: {
    color: "#F5F7FA",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
  },

  // =========================
  // Level Cards
  // =========================
  levelCards: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },

  levelCard: {
    backgroundColor: "#111A29",
    borderWidth: 1,
    borderColor: "#253248",
    borderRadius: 12,
    padding: 12,
    width: "23.5%",
    minHeight: 95,
  },

  levelTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  levelName: {
    fontSize: 12,
    fontWeight: "900",
  },

  levelCount: {
    color: "#F5F7FA",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 6,
  },

  levelLabel: {
    color: "#718096",
    fontSize: 10,
    marginTop: 2,
  },

  // =========================
  // Filter
  // =========================
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  filterButton: {
    backgroundColor: "#111A29",
    borderWidth: 1,
    borderColor: "#253248",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  filterButtonActive: {
    backgroundColor: "#F5B94C",
    borderColor: "#F5B94C",
  },

  filterText: {
    color: "#AEB8C7",
    fontSize: 12,
    fontWeight: "800",
  },

  filterTextActive: {
    color: "#101827",
  },

  // =========================
  // Product Row
  // =========================
  row: {
    backgroundColor: "#111A29",
    borderWidth: 1,
    borderColor: "#233047",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  name: {
    color: "#F5F7FA",
    fontWeight: "800",
    fontSize: 14,
  },

  meta: {
    color: "#718096",
    fontSize: 11,
    marginTop: 2,
  },

  stockBox: {
    alignItems: "flex-end",
    minWidth: 75,
  },

  stock: {
    color: "#DDE5EF",
    fontWeight: "800",
    fontSize: 13,
  },

  badge: {
    marginTop: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 5,
  },

  badgeText: {
    fontSize: 9,
    fontWeight: "900",
  },

  // =========================
  // Empty
  // =========================
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },

  emptyText: {
    color: "#718096",
    fontSize: 13,
    marginTop: 10,
  },
});