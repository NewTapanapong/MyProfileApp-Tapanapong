import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/context-auth";

// Endpoint API สำหรับจัดการข้อมูลสินค้า
const API = "http://119.59.102.161:3081/api/products";

// นิยามโครงสร้างชนิดข้อมูลของฟอร์ม (Form State)
type Form = {
  product_name: string;
  brand: string;
  sku: string;
  size_inch: string;
  wheel_count: string;
  wheel_type: string;
  material: string;
  hard_or_soft: "hard" | "soft";
  weight_kg: string;
  capacity_liters: string;
  lock_type: string;
  handle_type: string;
  expandable: boolean;
  color: string;
  stock_quantity: string;
  price: string;
  discount_price: string;
  status: "available" | "out_of_stock" | "discontinued";
  image_url: string;
  description: string;
};

// ค่าเริ่มต้นสำหรับฟอร์มเมื่อต้องการเพิ่มสินค้าใหม่
const empty: Form = {
  product_name: "",
  brand: "",
  sku: "",
  size_inch: "",
  wheel_count: "4",
  wheel_type: "Spinner",
  material: "",
  hard_or_soft: "hard",
  weight_kg: "",
  capacity_liters: "",
  lock_type: "TSA Lock",
  handle_type: "Telescopic",
  expandable: true,
  color: "",
  stock_quantity: "0",
  price: "",
  discount_price: "",
  status: "available",
  image_url: "",
  description: "",
};

// ฟังก์ชันสำหรับแสดงการแจ้งเตือนแบบรองรับทั้ง Web และ Mobile
const notify = (t: string, m: string) =>
  Platform.OS === "web"
    ? window.alert(`${t}\n\n${m}`)
    : Alert.alert(t, m);

export default function AddProduct() {
  const { token } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>(); // รับ parameter id หากเป็นการแก้ไขสินค้า
  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);

  // ดึงข้อมูลสินค้าเดิมมาใส่ในฟอร์มเมื่ออยู่ในโหมด "แก้ไขสินค้า" (มี id)
  useEffect(() => {
    if (id) {
      fetch(`${API}/${id}`)
        .then((r) => r.json())
        .then(
          (p) =>
            p?.id &&
            setForm({
              ...empty,
              ...p,
              size_inch: String(p.size_inch ?? ""),
              wheel_count: String(p.wheel_count ?? ""),
              weight_kg: String(p.weight_kg ?? ""),
              capacity_liters: String(p.capacity_liters ?? ""),
              stock_quantity: String(p.stock_quantity ?? ""),
              price: String(p.price ?? ""),
              discount_price: p.discount_price == null ? "" : String(p.discount_price),
              expandable: Boolean(p.expandable),
            })
        );
    }
  }, [id]);

  // ฟังก์ชัน Helper สำหรับอัปเดตค่าใน state ฟอร์มตามชื่อ key
  const set = (k: keyof Form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  // ฟังก์ชันบันทึกข้อมูลสินค้า (รองรับทั้งสร้างใหม่ POST และแก้ไข PUT)
  const save = async () => {
    // การตรวจสอบข้อมูลเบื้องต้น
    if (!form.product_name.trim() || !form.price) {
      notify("ข้อมูลไม่ครบ", "กรุณากรอกชื่อสินค้าและราคา");
      return;
    }

    setSaving(true);
    try {
      // แปลงชนิดข้อมูลจาก String ใน Form ให้ตรงกับที่ API ต้องการ (Number, Boolean/TinyInt)
      const body = {
        ...form,
        size_inch: form.size_inch ? Number(form.size_inch) : null,
        wheel_count: form.wheel_count ? Number(form.wheel_count) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        capacity_liters: form.capacity_liters ? Number(form.capacity_liters) : null,
        stock_quantity: Number(form.stock_quantity) || 0,
        price: Number(form.price) || 0,
        discount_price: form.discount_price ? Number(form.discount_price) : null,
        expandable: form.expandable ? 1 : 0,
      };

      const r = await fetch(id ? `${API}/${id}` : API, {
        method: id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "บันทึกไม่สำเร็จ");

      notify("สำเร็จ", id ? "แก้ไขสินค้าแล้ว" : "เพิ่มสินค้าแล้ว");
      router.replace("/");
    } catch (e) {
      notify("เกิดข้อผิดพลาด", e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  // รายการ Field ทั่วไปสำหรับนำไปวนลูปสร้าง TextInput
  const fields: [keyof Form, string][] = [
    ["product_name", "ชื่อสินค้า"],
    ["brand", "แบรนด์"],
    ["sku", "SKU"],
    ["size_inch", "ขนาด (นิ้ว)"],
    ["wheel_count", "จำนวนล้อ"],
    ["wheel_type", "ประเภทล้อ"],
    ["material", "วัสดุ"],
    ["weight_kg", "น้ำหนัก (kg)"],
    ["capacity_liters", "ความจุ (L)"],
    ["lock_type", "ประเภทล็อก"],
    ["handle_type", "ประเภทมือจับ"],
    ["color", "สี"],
    ["stock_quantity", "จำนวนสต็อก"],
    ["price", "ราคา"],
    ["discount_price", "ราคาลด"],
    ["image_url", "URL รูปภาพ"],
  ];

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      {/* ส่วน Header แสดงปุ่มย้อนกลับและหัวข้อหน้า */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F5F7FA" />
        </TouchableOpacity>
        <Text style={s.title}>{id ? "แก้ไขสินค้า" : "เพิ่มกระเป๋าเดินทาง"}</Text>
      </View>

      {/* ส่วน Form Card หลัก */}
      <View style={s.card}>
        {/* วนลูปสร้าง Text Input สำหรับฟิลด์ทั่วไป */}
        {fields.map(([k, label]) => (
          <View style={s.group} key={k}>
            <Text style={s.label}>{label}</Text>
            <TextInput
              style={s.input}
              value={String(form[k] ?? "")}
              onChangeText={(v) => set(k, v)}
              placeholder={label}
              placeholderTextColor="#667388"
              keyboardType={
                [
                  "size_inch",
                  "wheel_count",
                  "weight_kg",
                  "capacity_liters",
                  "stock_quantity",
                  "price",
                  "discount_price",
                ].includes(k)
                  ? "decimal-pad"
                  : "default"
              }
            />
          </View>
        ))}

        {/* ตัวเลือก: รูปแบบกระเป๋า (Hard Case / Soft Case) */}
        <View style={s.group}>
          <Text style={s.label}>รูปแบบกระเป๋า</Text>
          <View style={s.row}>
            {(["hard", "soft"] as const).map((v) => (
              <TouchableOpacity
                key={v}
                style={[s.option, form.hard_or_soft === v && s.optionOn]}
                onPress={() => set("hard_or_soft", v)}
              >
                <Text style={form.hard_or_soft === v ? s.optionTextOn : s.optionText}>
                  {v === "hard" ? "Hard Case" : "Soft Case"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ตัวเลือก: การขยายความจุ (เปิด / ปิด) */}
        <View style={s.group}>
          <Text style={s.label}>ขยายความจุ</Text>
          <TouchableOpacity
            style={[s.switch, form.expandable && s.switchOn]}
            onPress={() => set("expandable", !form.expandable)}
          >
            <Text style={form.expandable ? s.optionTextOn : s.optionText}>
              {form.expandable ? "เปิด" : "ปิด"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ตัวเลือก: สถานะสินค้า (available / out_of_stock / discontinued) */}
        <View style={s.group}>
          <Text style={s.label}>สถานะ</Text>
          <View style={s.row}>
            {(["available", "out_of_stock", "discontinued"] as const).map((v) => (
              <TouchableOpacity
                key={v}
                style={[s.option, form.status === v && s.optionOn]}
                onPress={() => set("status", v)}
              >
                <Text style={form.status === v ? s.optionTextOn : s.optionText}>
                  {v}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ช่องกรอกรายละเอียดสินค้า (Multiline Text Input) */}
        <View style={s.group}>
          <Text style={s.label}>รายละเอียด</Text>
          <TextInput
            style={[s.input, s.textarea]}
            value={form.description}
            onChangeText={(v) => set("description", v)}
            multiline
            placeholder="รายละเอียดสินค้า"
            placeholderTextColor="#667388"
          />
        </View>

        {/* ปุ่มบันทึกข้อมูล */}
        <TouchableOpacity style={s.save} onPress={save} disabled={saving}>
          <Text style={s.saveText}>
            {saving ? "กำลังบันทึก..." : id ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// สไตล์ตกแต่งส่วนต่างๆ (Styles)
const s = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#0B1220",
  },
  content: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    padding: 24,
    paddingBottom: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginBottom: 22,
  },
  title: {
    fontSize: 25,
    fontWeight: "900",
    color: "#F5F7FA",
  },
  card: {
    backgroundColor: "#111A29",
    borderWidth: 1,
    borderColor: "#253248",
    borderRadius: 16,
    padding: 22,
  },
  group: {
    marginBottom: 16,
  },
  label: {
    color: "#DDE5EF",
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 7,
  },
  input: {
    height: 46,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#2A374B",
    backgroundColor: "#0B1220",
    paddingHorizontal: 12,
    color: "#F5F7FA",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2A374B",
  },
  optionOn: {
    backgroundColor: "#F5B94C",
    borderColor: "#F5B94C",
  },
  optionText: {
    color: "#AEB8C7",
  },
  optionTextOn: {
    color: "#101827",
    fontWeight: "900",
  },
  switch: {
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2A374B",
  },
  switchOn: {
    backgroundColor: "#F5B94C",
    borderColor: "#F5B94C",
  },
  textarea: {
    height: 110,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  save: {
    height: 50,
    borderRadius: 9,
    backgroundColor: "#F5B94C",
    alignItems: "center",
    justifyContent: "center", // แก้ไขจุดดอท (.) ออกแล้ว
    marginTop: 8,
  },
  saveText: {
    color: "#101827",
    fontWeight: "900",
    fontSize: 15,
  },
});