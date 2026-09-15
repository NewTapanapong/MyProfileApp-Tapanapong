import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// 📱 ธีมสี Tech Blue สบายตา โฟกัสจุดสำคัญชัดเจน
const COLORS = {
  primary: "#2563EB",       // สีน้ำเงินหลัก (Tech Blue)
  background: "#F8FAFC",    // สีพื้นหลังเทาอ่อนสะอาดตา
  cardBg: "#FFFFFF",        // สีพื้นหลังการ์ด
  border: "#E2E8F0",        // สีเส้นขอบบางเบา
  text: "#0F172A",          // สีตัวหนังสือหลัก
  textSecondary: "#64748B", // สีตัวหนังสือรอง
};

const LATEST_IPHONE_MODELS = [
  {
    id: "iphone16pro",
    name: "iPhone 16 Pro",
    description: "Stunning titanium design, Camera Control, 4K 120 fps Dolby Vision, and the A18 Pro chip.",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=600&auto=format&fit=crop",
    capacities: {
      "128GB": {
        basePrice: 39900,
        colors: { "Desert Titanium": 39900, "Natural Titanium": 39900, "White Titanium": 39900, "Black Titanium": 39900 },
      },
      "256GB": {
        basePrice: 43900,
        colors: { "Desert Titanium": 43900, "Natural Titanium": 43900, "White Titanium": 43900, "Black Titanium": 43900 },
      },
      "512GB": {
        basePrice: 51900,
        colors: { "Desert Titanium": 51900, "Natural Titanium": 51900, "White Titanium": 51900, "Black Titanium": 51900 },
      },
      "1TB": {
        basePrice: 59900,
        colors: { "Desert Titanium": 59900, "Natural Titanium": 59900, "White Titanium": 59900, "Black Titanium": 59900 },
      },
    },
  },
  {
    id: "iphone16promax",
    name: "iPhone 16 Pro Max",
    description: "The ultimate iPhone with our largest display ever, best-ever battery life, and 5x Telephoto camera.",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=600&auto=format&fit=crop",
    capacities: {
      "256GB": {
        basePrice: 48900,
        colors: { "Desert Titanium": 48900, "Natural Titanium": 48900, "White Titanium": 48900, "Black Titanium": 48900 },
      },
      "512GB": {
        basePrice: 56900,
        colors: { "Desert Titanium": 56900, "Natural Titanium": 56900, "White Titanium": 56900, "Black Titanium": 56900 },
      },
      "1TB": {
        basePrice: 64900,
        colors: { "Desert Titanium": 64900, "Natural Titanium": 64900, "White Titanium": 64900, "Black Titanium": 64900 },
      },
    },
  },
];

export default function PreOrderScreen() {
  const params = useLocalSearchParams();
  const userRole = (params.role as string) || "user";
  const userToken = (params.token as string) || "";

  const [selectedModelIndex, setSelectedModelIndex] = useState(0);
  const currentProduct = LATEST_IPHONE_MODELS[selectedModelIndex];

  const storageKeys = Object.keys(currentProduct.capacities);
  const [selectedStorage, setSelectedStorage] = useState<string>(storageKeys[0]);

  const availableColors = Object.keys(
    (currentProduct.capacities as any)[selectedStorage].colors
  );
  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0]);

  // เพิ่ม State สำหรับเก็บอีเมล
  const [email, setEmail] = useState<string>("");

  const handleSelectModel = (index: number) => {
    setSelectedModelIndex(index);
    const newProduct = LATEST_IPHONE_MODELS[index];
    const newStorages = Object.keys(newProduct.capacities);
    const firstStorage = newStorages[0];
    setSelectedStorage(firstStorage);
    const firstColors = Object.keys((newProduct.capacities as any)[firstStorage].colors);
    setSelectedColor(firstColors[0]);
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({
        pathname: "/home",
        params: { token: userToken, role: userRole },
      });
    }
  };

  const currentPrice =
    (currentProduct.capacities as any)[selectedStorage]?.colors[selectedColor] || 39900;

  const handleConfirmPreOrder = () => {
    // ตรวจสอบความถูกต้องของอีเมลก่อนให้ผ่าน
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("กรุณากรอกข้อมูล", "โปรดกรอกอีเมลของคุณให้ถูกต้องก่อนยืนยันการพรีออเดอร์");
      return;
    }

    Alert.alert(
      "ยืนยันการพรีออเดอร์",
      `คุณได้เลือกพรีออเดอร์ ${currentProduct.name}\nความจุ: ${selectedStorage}\nสี: ${selectedColor}\nอีเมล: ${email}\nราคารวม: ฿${currentPrice.toLocaleString()}`,
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ยืนยัน",
          onPress: () => {
            Alert.alert("สำเร็จ", "บันทึกข้อมูลการพรีออเดอร์เรียบร้อยแล้ว", [
              {
                text: "ตกลง",
                onPress: () =>
                  router.replace({
                    pathname: "/home",
                    params: { token: userToken, role: userRole },
                  }),
              },
            ]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pre-Order Latest iPhone</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: currentProduct.image }} style={styles.productImage} />
        </View>

        <Text style={styles.preorderBadge}>LATEST SERIES - PRE-ORDER</Text>
        <Text style={styles.productTitle}>{currentProduct.name}</Text>
        <Text style={styles.productDesc}>{currentProduct.description}</Text>

        <View style={styles.sectionContainer}>
          <Text style={styles.label}>Select Model:</Text>
          <View style={styles.optionsRow}>
            {LATEST_IPHONE_MODELS.map((model, idx) => (
              <TouchableOpacity
                key={model.id}
                style={[
                  styles.optionChip,
                  selectedModelIndex === idx && styles.selectedOptionChip,
                ]}
                onPress={() => handleSelectModel(idx)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedModelIndex === idx && styles.selectedOptionText,
                  ]}
                >
                  {model.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.label}>Select Storage:</Text>
          <View style={styles.optionsRow}>
            {storageKeys.map((cap) => (
              <TouchableOpacity
                key={cap}
                style={[
                  styles.optionChip,
                  selectedStorage === cap && styles.selectedOptionChip,
                ]}
                onPress={() => {
                  setSelectedStorage(cap);
                  const newColors = Object.keys((currentProduct.capacities as any)[cap].colors);
                  setSelectedColor(newColors[0]);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedStorage === cap && styles.selectedOptionText,
                  ]}
                >
                  {cap}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.label}>Select Color:</Text>
          <View style={styles.optionsRow}>
            {availableColors.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.optionChip,
                  selectedColor === color && styles.selectedOptionChip,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedColor === color && styles.selectedOptionText,
                  ]}
                >
                  {color}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ช่องกรอกอีเมล */}
        <View style={styles.sectionContainer}>
          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.emailInput}
            placeholder="name@example.com"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Pre-Order Price:</Text>
          <Text style={styles.priceValue}>฿{currentPrice.toLocaleString()}</Text>
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmPreOrder}>
          <Text style={styles.confirmBtnText}>Confirm Pre-Order</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: COLORS.primary },
  content: { padding: 20, alignItems: "center" },
  imageContainer: {
    width: "100%",
    height: 200,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productImage: { width: "100%", height: "100%", resizeMode: "contain" },
  preorderBadge: { fontSize: 11, fontWeight: "800", color: COLORS.primary, letterSpacing: 1, marginBottom: 4 },
  productTitle: { fontSize: 22, fontWeight: "800", color: COLORS.text, marginBottom: 6, textAlign: "center" },
  productDesc: { fontSize: 12, color: COLORS.textSecondary, textAlign: "center", marginBottom: 20, paddingHorizontal: 10 },
  sectionContainer: { width: "100%", marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  optionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  selectedOptionChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optionText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  selectedOptionText: { color: "#FFFFFF" },
  emailInput: {
    width: "100%",
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.cardBg,
    color: COLORS.text,
    fontSize: 14,
  },
  priceRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 10,
  },
  priceLabel: { fontSize: 14, fontWeight: "700", color: COLORS.textSecondary },
  priceValue: { fontSize: 22, fontWeight: "800", color: COLORS.primary },
  confirmBtn: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  confirmBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});