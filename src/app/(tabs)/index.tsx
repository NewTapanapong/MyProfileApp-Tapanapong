import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context-auth";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
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

// ======================================
// Backend API
// ======================================
const API_BASE_URL = "http://119.59.102.161:3081/api/products";

const COLORS = {
  primary: "#7C5CFF",
  background: "#080A12",
  surface: "#111522",
  border: "#2A3142",
  text: "#F8FAFC",
  textSecondary: "#8F99AA",
  badgeBg: "#34D399",
  danger: "#FB7185",
};

interface Product {
  id: number;
  productCode: string;
  productName: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  color: string;
  storage: string;
  ram: string;
  image: string;
  description: string;
  status: string;
}

interface ProductForm {
  productCode: string;
  productName: string;
  brand: string;
  category: string;
  price: string;
  stock: string;
  color: string;
  storage: string;
  ram: string;
  image: string;
  description: string;
  status: string;
}

const emptyForm: ProductForm = {
  productCode: "",
  productName: "",
  brand: "",
  category: "",
  price: "",
  stock: "",
  color: "",
  storage: "",
  ram: "",
  image: "",
  description: "",
  status: "Available",
};

const TEST_PRODUCTS: Product[] = [
  {id:1,productCode:"TEST-001",productName:"iPhone 17 Pro Max",brand:"Apple",category:"Smartphone",price:64900,stock:10,color:"Titanium",storage:"1TB",ram:"12GB",image:"https://res.cloudinary.com/s7iv7oxn/image/upload/v1784895932/Apple-iPhone-17-Pro-Max-PNG_z3sevs.png",description:"Test product",status:"Available"},
  {id:2,productCode:"TEST-002",productName:"Galaxy S26 Ultra",brand:"Samsung",category:"Smartphone",price:30900,stock:15,color:"Black",storage:"256GB",ram:"12GB",image:"https://res.cloudinary.com/s7iv7oxn/image/upload/v1784895932/Samsung-S26-Ultra-png_fwctuz.png",description:"Test product",status:"Available"},
  {id:3,productCode:"TEST-003",productName:"iPhone XR",brand:"Apple",category:"Smartphone",price:29900,stock:5,color:"White",storage:"256GB",ram:"4GB",image:"https://res.cloudinary.com/s7iv7oxn/image/upload/v1784895933/iPhone-Xr-PNG-HD-Image_c4s98y.png",description:"Test product",status:"Available"},
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const { token, user, testMode, logout } = useAuth();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ======================================
  // Products
  // ======================================
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // ======================================
  // Add / Edit
  // ======================================
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [form, setForm] =
    useState<ProductForm>(emptyForm);

  const [saving, setSaving] = useState(false);

  // ======================================
  // GET PRODUCTS
  // ======================================
  const fetchProducts = async (query = searchQuery) => {
    setLoading(true);
    try {
      if (testMode) {
        const q = query.trim().toLowerCase();
        const items = TEST_PRODUCTS.filter((p) =>
          !q || [p.productName,p.productCode,p.brand,p.category,p.description]
            .some((v) => String(v || "").toLowerCase().includes(q))
        );
        setProducts(items);
        setFilteredProducts(items);
        return;
      }

      const response = await fetch(`${API_BASE_URL}?q=${encodeURIComponent(query)}&page=1&limit=20`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) {
        if (response.status === 401) logout();
        throw new Error(`ไม่สามารถโหลดข้อมูลสินค้าได้ (HTTP ${response.status})`);
      }
      const data = await response.json();
      const items = Array.isArray(data) ? data : data.items;
      if (!Array.isArray(items)) throw new Error("รูปแบบข้อมูล Products ไม่ถูกต้อง");
      setProducts(items);
      setFilteredProducts(items);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchProducts(""); return () => { if (searchTimer.current) clearTimeout(searchTimer.current); }; }, [token, testMode]);

  // ======================================
  // SEARCH
  // ======================================
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchProducts(text), 300);
  };

  // ======================================
  // FORM INPUT
  // ======================================
  const updateForm = (
    field: keyof ProductForm,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ======================================
  // OPEN ADD
  // ======================================
  const openAddProduct = () => {
    setEditingProduct(null);
    setForm({
      ...emptyForm,
    });
    setModalVisible(true);
  };

  // ======================================
  // OPEN EDIT
  // ======================================
  const openEditProduct = (product: Product) => {
    setEditingProduct(product);

    setForm({
      productCode: product.productCode || "",
      productName: product.productName || "",
      brand: product.brand || "",
      category: product.category || "",
      price:
        product.price !== null &&
        product.price !== undefined
          ? String(product.price)
          : "",
      stock:
        product.stock !== null &&
        product.stock !== undefined
          ? String(product.stock)
          : "",
      color: product.color || "",
      storage: product.storage || "",
      ram: product.ram || "",
      image: product.image || "",
      description: product.description || "",
      status: product.status || "Available",
    });

    setModalVisible(true);
  };

  // ======================================
  // CLOSE MODAL
  // ======================================
  const closeModal = () => {
    if (saving) return;

    setModalVisible(false);
    setEditingProduct(null);
    setForm({
      ...emptyForm,
    });
  };

  // ======================================
  // SAVE ADD / EDIT
  // ======================================
  const saveProduct = async () => {
    if (!form.productName.trim()) {
      Alert.alert(
        "ข้อมูลไม่ครบ",
        "กรุณากรอกชื่อสินค้า"
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        productCode: form.productCode.trim(),
        productName: form.productName.trim(),
        brand: form.brand.trim(),
        category: form.category.trim(),
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
        color: form.color.trim(),
        storage: form.storage.trim(),
        ram: form.ram.trim(),
        image: form.image.trim(),
        description: form.description.trim(),
        status: form.status.trim() || "Available",
      };

      if (testMode) {
        if (editingProduct) {
          setProducts((prev) => prev.map((p) => p.id === editingProduct.id ? ({ ...p, ...payload, price: Number(payload.price), stock: Number(payload.stock) }) : p));
          setFilteredProducts((prev) => prev.map((p) => p.id === editingProduct.id ? ({ ...p, ...payload, price: Number(payload.price), stock: Number(payload.stock) }) : p));
          Alert.alert("ทดสอบสำเร็จ", "แก้ไขสินค้าในโหมดทดสอบแล้ว");
        } else {
          const nextId = Math.max(0, ...products.map((p) => p.id)) + 1;
          const newProduct: Product = { id: nextId, ...payload, price: Number(payload.price), stock: Number(payload.stock) };
          setProducts((prev) => [...prev, newProduct]);
          setFilteredProducts((prev) => [...prev, newProduct]);
          Alert.alert("ทดสอบสำเร็จ", "เพิ่มสินค้าในโหมดทดสอบแล้ว");
        }
        setModalVisible(false);
        setEditingProduct(null);
        setForm({ ...emptyForm });
        return;
      }

      // ================================
      // ADD
      // ================================
      if (!editingProduct) {
        const response = await fetch(
          API_BASE_URL,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              `HTTP ${response.status}`
          );
        }

        Alert.alert(
          "เพิ่มสินค้าสำเร็จ",
          `Product ID: ${data.productId}`
        );
      }

      // ================================
      // EDIT
      // ================================
      else {
        const response = await fetch(
          `${API_BASE_URL}/${editingProduct.id}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              `HTTP ${response.status}`
          );
        }

        Alert.alert(
          "แก้ไขสินค้าสำเร็จ",
          `Product ID: ${data.productId}`
        );
      }

      setModalVisible(false);
      setEditingProduct(null);
      setForm({
        ...emptyForm,
      });

      await fetchProducts();
    } catch (error) {
      console.error(
        "Save product error:",
        error
      );

      Alert.alert(
        "เกิดข้อผิดพลาด",
        error instanceof Error
          ? error.message
          : "ไม่สามารถบันทึกสินค้าได้"
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = (product: Product) => {
    Alert.alert("ยืนยันการลบ", `ต้องการลบ ${product.productName} หรือไม่?`, [
      {text:"ยกเลิก",style:"cancel"},
      {text:"ลบ",style:"destructive",onPress:async()=>{
        try {
          if (testMode) {
            setProducts((prev) => prev.filter((p) => p.id !== product.id));
            setFilteredProducts((prev) => prev.filter((p) => p.id !== product.id));
            Alert.alert("ทดสอบสำเร็จ","ลบสินค้าในโหมดทดสอบแล้ว");
            return;
          }
          const r=await fetch(`${API_BASE_URL}/${product.id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});
          const d=await r.json();
          if(!r.ok)throw new Error(d.message||`HTTP ${r.status}`);
          Alert.alert("สำเร็จ","ลบสินค้าเรียบร้อยแล้ว");
          fetchProducts(searchQuery);
        } catch(e) {
          Alert.alert("เกิดข้อผิดพลาด",e instanceof Error?e.message:"ไม่สามารถลบสินค้าได้");
        }
      }}
    ]);
  };

  // ======================================
  // PRODUCT CARD
  // ======================================
  const renderProduct = ({
    item,
  }: {
    item: Product;
  }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Image
          source={{
            uri:
              item.image &&
              item.image.startsWith("http")
                ? item.image
                : "https://via.placeholder.com/150",
          }}
          style={styles.thumbnail}
        />

        <View style={styles.cardDetails}>
          <View style={styles.cardTopRow}>
            <View
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <Text style={styles.infoText}>
                Stock: {item.stock ?? 0} in stock
              </Text>

              <Text style={styles.infoText}>
                Price: ฿{Number(item.price ?? 0).toLocaleString()}
              </Text>
              
              <Text style={styles.infoText}>
                Category:{" "}
                {item.category || "-"}
              </Text>

              <Text style={styles.infoText}>
                Location: 3 stores
              </Text>

              <Text style={styles.infoText}>
                Brand:{" "}
                {item.brand || "Unnamed Brand"}
              </Text>
            </View>

            <View style={styles.badgeContainer}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      item.status ===
                        "Available" ||
                      item.status === "Active"
                        ? COLORS.badgeBg
                        : COLORS.danger,
                  },
                ]}
              >
                <Text style={styles.badgeText}>
                  {item.status === "Available"
                    ? "Active"
                    : item.status || "Active"}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.productName}>
            {item.productName}
          </Text>

          {user?.role === "admin" && <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}><TouchableOpacity style={[styles.editButton,{marginTop:0}]} onPress={() => openEditProduct(item)}><Ionicons name="create-outline" size={16} color="#fff"/><Text style={styles.editButtonText}>Edit</Text></TouchableOpacity><TouchableOpacity style={[styles.editButton,styles.deleteButton,{marginTop:0}]} onPress={() => deleteProduct(item)}><Ionicons name="trash-outline" size={16} color="#fff"/><Text style={styles.editButtonText}>Delete</Text></TouchableOpacity></View>}
        </View>
      </View>
    </View>
  );

  // ======================================
  // INPUT
  // ======================================
  const renderInput = (
    label: string,
    field: keyof ProductForm,
    placeholder: string,
    keyboardType:
      | "default"
      | "numeric"
      | "decimal-pad" = "default"
  ) => (
    <View style={styles.formGroup}>
      <Text style={styles.formLabel}>
        {label}
      </Text>

      <TextInput
        style={styles.formInput}
        value={form[field]}
        onChangeText={(value) =>
          updateForm(field, value)
        }
        placeholder={placeholder}
        placeholderTextColor="#9CA6B8"
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#111522"
      />

      {/* ======================================
          HEADER
      ====================================== */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
        >
          <Ionicons
            name="menu"
            size={22}
            color={COLORS.text}
          />
        </TouchableOpacity>

        <View><Text style={styles.headerTitle}>Products</Text><Text style={{fontSize:11,color:COLORS.textSecondary}}>{user?.username} · {user?.role?.toUpperCase()} {testMode ? "· TEST" : ""}</Text></View>

        <TouchableOpacity style={styles.profileButton} onPress={logout}>
          <Ionicons
            name="person"
            size={16}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* ======================================
          SEARCH
      ====================================== */}
      <View
        style={[
          styles.searchRow,
          isMobile &&
            styles.searchRowMobile,
        ]}
      >
        <View
          style={[
            styles.searchBox,
            isMobile &&
              styles.searchBoxMobile,
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={COLORS.textSecondary}
          />

          <TextInput
            placeholder="Search products..."
            placeholderTextColor={
              COLORS.textSecondary
            }
            style={styles.input}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        {user?.role === "admin" && <TouchableOpacity style={styles.addButton} onPress={openAddProduct}>
          <Text
            style={styles.addButtonText}
          >
            + Add
          </Text>
        </TouchableOpacity>}

        <TouchableOpacity style={styles.refreshButton}
          onPress={() => fetchProducts(searchQuery)}
        >
          <Text
            style={
              styles.refreshButtonText
            }
          >
            Refresh
          </Text>
        </TouchableOpacity>
      </View>

      {/* ======================================
          PRODUCT LIST
      ====================================== */}
      {loading ? (
        <View
          style={styles.loadingContainer}
        >
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />
        </View>
      ) : (
        <FlatList
  data={filteredProducts}
  style={styles.productList}
  horizontal={false}
  showsHorizontalScrollIndicator={false}
  showsVerticalScrollIndicator={true}
  keyExtractor={(item) => item.id.toString()}
  contentContainerStyle={{
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 100,
  }}
  renderItem={renderProduct}
/>
      )}

      {/* ======================================
          BOTTOM NAVIGATION
      ====================================== */}
      <View style={styles.bottomNav}>

        <TouchableOpacity
          style={styles.navItem}
        >
          <Ionicons
            name="home-outline"
            size={22}
            color={COLORS.textSecondary}
          />

          <Text style={styles.navText}>
            Home
          </Text>
        </TouchableOpacity>

        {user?.role === "admin" && <TouchableOpacity style={styles.navItem} onPress={openAddProduct}>
          <Ionicons
            name="add-outline"
            size={24}
            color={COLORS.primary}
          />

          <Text
            style={[
              styles.navText,
              {
                color: COLORS.primary,
                fontWeight: "600",
              },
            ]}
          >
            Add
          </Text>
        </TouchableOpacity>}

        <TouchableOpacity
          style={styles.navItem}
        >
          <MaterialIcons
            name="inventory-2"
            size={22}
            color={COLORS.primary}
          />

          <Text
            style={[
              styles.navText,
              {
                color: COLORS.primary,
                fontWeight: "600",
              },
            ]}
          >
            Products
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
        >
          <Ionicons
            name="folder-outline"
            size={22}
            color={COLORS.textSecondary}
          />

          <Text style={styles.navText}>
            Categories
          </Text>
        </TouchableOpacity>
      </View>

      {/* ======================================
          ADD / EDIT MODAL
      ====================================== */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <View
            style={[
              styles.modalContainer,
              isMobile &&
                styles.modalContainerMobile,
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text
                style={styles.modalTitle}
              >
                {editingProduct
                  ? "Edit Product"
                  : "Add Product"}
              </Text>

              <TouchableOpacity
                onPress={closeModal}
                disabled={saving}
              >
                <Ionicons
                  name="close"
                  size={26}
                  color={COLORS.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={{
                paddingBottom: 20,
              }}
              keyboardShouldPersistTaps="handled"
            >
              {renderInput(
                "Product Code",
                "productCode",
                "P001"
              )}

              {renderInput(
                "Product Name *",
                "productName",
                "Product name"
              )}

              {renderInput(
                "Brand",
                "brand",
                "Apple"
              )}

              {renderInput(
                "Category",
                "category",
                "Smartphone"
              )}

              {renderInput(
                "Price",
                "price",
                "0",
                "decimal-pad"
              )}

              {renderInput(
                "Stock",
                "stock",
                "0",
                "numeric"
              )}

              {renderInput(
                "Color",
                "color",
                "Black"
              )}

              {renderInput(
                "Storage",
                "storage",
                "256GB"
              )}

              {renderInput(
                "RAM",
                "ram",
                "8GB"
              )}

              {renderInput(
                "Image URL",
                "image",
                "https://..."
              )}

              {renderInput(
                "Status",
                "status",
                "Available"
              )}

              <View
                style={styles.formGroup}
              >
                <Text
                  style={styles.formLabel}
                >
                  Description
                </Text>

                <TextInput
                  style={[
                    styles.formInput,
                    styles.descriptionInput,
                  ]}
                  value={form.description}
                  onChangeText={(value) =>
                    updateForm(
                      "description",
                      value
                    )
                  }
                  placeholder="Description"
                  placeholderTextColor="#9CA6B8"
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            {/* Save */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                saving &&
                  styles.saveButtonDisabled,
              ]}
              onPress={saveProduct}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator
                  color="#fff"
                />
              ) : (
                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  {editingProduct
                    ? "Save Changes"
                    : "Add Product"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ======================================
// STYLES
// ======================================

const styles = StyleSheet.create({
  container: {
  flex: 1,
  width: "100%",
  maxWidth: "100%",
  backgroundColor: COLORS.background,
  overflow: "hidden",
},

  header: {
    width: "100%",
    maxWidth: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#111522",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
  },

  iconButton: {
    padding: 4,
  },

  profileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#9B6CFF",
    justifyContent: "center",
    alignItems: "center",
  },

  searchRow: {
  width: "100%",
  maxWidth: "100%",
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: "#111522",
  gap: 8,
  overflow: "hidden",
},

  searchRowMobile: {
    flexWrap: "wrap",
  },

  searchBox: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#151A27",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },

  searchBoxMobile: {
    width: "100%",
    flexBasis: "100%",
    flexGrow: 0,
  },

  input: {
    flex: 1,
    minWidth: 0,
    marginLeft: 6,
    fontSize: 14,
    color: COLORS.text,
  },

  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
  },

  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  refreshButton: {
    paddingHorizontal: 8,
    height: 40,
    justifyContent: "center",
  },

  refreshButtonText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 14,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  productList: {
  flex: 1,
  width: "100%",
  maxWidth: "100%",
  overflow: "hidden",
},

  card: {
  width: "100%",
  maxWidth: "100%",
  alignSelf: "stretch",
  backgroundColor: "#111522",
  borderRadius: 12,
  padding: 14,
  marginVertical: 6,
  borderWidth: 1,
  borderColor: COLORS.border,
  overflow: "hidden",
},

  cardContent: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  thumbnail: {
    width: 65,
    height: 65,
    borderRadius: 8,
    marginRight: 12,
    resizeMode: "contain",
  },

  cardDetails: {
    flex: 1,
    minWidth: 0,
  },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },

  badgeContainer: {
    alignItems: "flex-end",
    flexShrink: 0,
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 6,
    flexShrink: 1,
  },

  editButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
  },

  deleteButton: { backgroundColor: COLORS.danger },

  editButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  bottomNav: {
    width: "100%",
    flexDirection: "row",
    backgroundColor: "#111522",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 8,
  },

  navItem: {
    flex: 1,
    alignItems: "center",
  },

  navText: {
    marginTop: 2,
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  // ======================================
  // MODAL
  // ======================================

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalContainer: {
    width: "100%",
    maxWidth: 600,
    maxHeight: "90%",
    backgroundColor: "#111522",
    borderRadius: 16,
    overflow: "hidden",
  },

  modalContainerMobile: {
    width: "100%",
    maxHeight: "94%",
    borderRadius: 14,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },

  formScroll: {
    paddingHorizontal: 18,
  },

  formGroup: {
    marginTop: 14,
  },

  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },

  formInput: {
    width: "100%",
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: COLORS.text,
    backgroundColor: "#111522",
    fontSize: 14,
  },

  descriptionInput: {
    height: 90,
    paddingTop: 12,
  },

  saveButton: {
    margin: 18,
    height: 46,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});