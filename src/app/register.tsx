import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// API Endpoint สำหรับสมัครสมาชิก
const API_REGISTER_URL = "http://119.59.102.161:3081/api/register";

// 📱 ธีมสีส้ม/ทอง Warm Amber ตรงกับหน้า Login
const COLORS = {
  primary: "#F59E0B",        // สีส้ม/ทองหลัก
  primaryHover: "#D97706",
  background: "#090D16",      // พื้นหลังเข้ม
  cardBg: "#111827",          // พื้นหลัง Card
  border: "#1F2937",          // เส้นขอบ
  inputBg: "#0B0F19",         // พื้นหลัง Input
  text: "#F9FAFB",
  textSecondary: "#9CA3AF",
  danger: "#EF4444",
};

const notify = (title: string, message?: string, onDismiss?: () => void) => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.alert(message ? `${title}\n\n${message}` : title);
    }
    onDismiss?.();
  } else {
    Alert.alert(
      title,
      message,
      onDismiss ? [{ text: "OK", onPress: onDismiss }] : undefined
    );
  }
};

interface FormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const emptyForm: FormState = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterScreen() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateForm = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/login");
    }
  };

  const validate = (): string | null => {
    if (!form.username.trim()) return "กรุณากรอก Username";
    if (form.username.trim().length < 3) return "Username ต้องมีอย่างน้อย 3 ตัวอักษร";
    if (!form.email.trim()) return "กรุณากรอกอีเมล";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email.trim())) return "รูปแบบอีเมลไม่ถูกต้อง";
    if (!form.password) return "กรุณากรอกรหัสผ่าน";
    if (form.password.length < 6) return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    if (form.password !== form.confirmPassword) return "รหัสผ่านทั้งสองช่องไม่ตรงกัน";
    return null;
  };

  const handleRegister = async () => {
    const errorMessage = validate();
    if (errorMessage) {
      notify("ข้อมูลไม่ถูกต้อง", errorMessage);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "สมัครสมาชิกไม่สำเร็จ");
      }

      notify("สมัครสมาชิกสำเร็จ", "กรุณาเข้าสู่ระบบด้วยบัญชีที่สร้างใหม่");
      router.replace("/login");
    } catch (error) {
      notify(
        "เกิดข้อผิดพลาด",
        error instanceof Error ? error.message : "ไม่สามารถสมัครสมาชิกได้"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <KeyboardAvoidingView
        style={{ flex: 1, width: "100%" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ปุ่มย้อนกลับ */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </TouchableOpacity>

          {/* ส่วนหัวแสดงตราโลโก้สไตล์เดียวกับหน้า Login */}
          <View style={styles.brandBlock}>
            <View style={styles.logoCircle}>
              <Ionicons name="briefcase-outline" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.brandTitle}>Create Account</Text>
            <Text style={styles.brandSubtitle}>สมัครสมาชิกเพื่อเริ่มใช้งานระบบ</Text>
          </View>

          {/* การ์ดฟอร์ม */}
          <View style={styles.card}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor={COLORS.textSecondary}
                  value={form.username}
                  onChangeText={(v) => updateForm("username", v)}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.textSecondary}
                  value={form.email}
                  onChangeText={(v) => updateForm("email", v)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={COLORS.textSecondary}
                  value={form.password}
                  onChangeText={(v) => updateForm("password", v)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-outline"}
                    size={18}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter your password"
                  placeholderTextColor={COLORS.textSecondary}
                  value={form.confirmPassword}
                  onChangeText={(v) => updateForm("confirmPassword", v)}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)}>
                  <Ionicons
                    name={showConfirmPassword ? "eye-outline" : "eye-outline"}
                    size={18}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* ปุ่มสมัครสมาชิกสีส้ม/ทอง */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.buttonText}>สมัครสมาชิก</Text>
              )}
            </TouchableOpacity>

            {/* ลิงก์กลับไปหน้าเข้าสู่ระบบ */}
            <View style={styles.loginRow}>
              <Text style={styles.loginRowText}>มีบัญชีอยู่แล้ว?</Text>
              <TouchableOpacity onPress={() => router.replace("/login")}>
                <Text style={styles.loginRowLink}> เข้าสู่ระบบ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    paddingVertical: 40,
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  brandBlock: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 20,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#161F33",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 6,
  },
  brandSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  formGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.inputBg,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: COLORS.text,
  },
  button: {
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  loginRowText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loginRowLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "700",
  },
});