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

// API endpoints
const API_FORGOT_PASSWORD_URL =
  "http://119.59.102.161:3081/api/forgot-password";
const API_RESET_PASSWORD_URL = "http://119.59.102.161:3081/api/reset-password";

// 📱 ธีมสีส้ม/ทอง Warm Amber ตรงกับหน้า Login / Register
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

type Step = "request" | "reset";

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>("request");

  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    if (step === "reset") {
      setStep("request");
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/login");
      }
    }
  };

  const handleRequestCode = async () => {
    if (!email.trim()) {
      notify("กรุณากรอกข้อมูล", "กรุณากรอกอีเมลหรือ Username ที่ใช้สมัคร");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_FORGOT_PASSWORD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถส่งรหัสยืนยันได้");
      }

      notify(
        "ส่งรหัสยืนยันแล้ว",
        "กรุณาตรวจสอบอีเมลของคุณเพื่อรับรหัส OTP สำหรับตั้งรหัสผ่านใหม่"
      );
      setStep("reset");
    } catch (error) {
      notify(
        "เกิดข้อผิดพลาด",
        error instanceof Error ? error.message : "ไม่สามารถส่งรหัสยืนยันได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otpCode.trim()) {
      notify("กรุณากรอกข้อมูล", "กรุณากรอกรหัส OTP ที่ได้รับทางอีเมล");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      notify("ข้อมูลไม่ถูกต้อง", "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (newPassword !== confirmPassword) {
      notify("ข้อมูลไม่ถูกต้อง", "รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_RESET_PASSWORD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          code: otpCode.trim(),
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถตั้งรหัสผ่านใหม่ได้");
      }

      notify("ตั้งรหัสผ่านใหม่สำเร็จ", "กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่");
      router.replace("/login");
    } catch (error) {
      notify(
        "เกิดข้อผิดพลาด",
        error instanceof Error ? error.message : "ไม่สามารถตั้งรหัสผ่านใหม่ได้"
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

          {/* ส่วนหัวแสดงไอคอนกุญแจ/ความปลอดภัย */}
          <View style={styles.brandBlock}>
            <View style={styles.logoCircle}>
              <Ionicons
                name={step === "request" ? "key-outline" : "shield-checkmark-outline"}
                size={28}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.brandTitle}>
              {step === "request" ? "Forgot Password" : "Reset Password"}
            </Text>
            <Text style={styles.brandSubtitle}>
              {step === "request"
                ? "กรอกอีเมลที่ใช้สมัคร เพื่อรับรหัสยืนยัน"
                : `กรอกรหัส OTP ที่ส่งไปยัง ${email || "อีเมลของคุณ"} พร้อมรหัสผ่านใหม่`}
            </Text>
          </View>

          {/* การ์ดฟอร์ม */}
          <View style={styles.card}>
            {/* Step indicator ปรับแต่งสีส้มทอง */}
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, styles.stepDotActive]}>
                <Text style={styles.stepDotTextActive}>1</Text>
              </View>
              <View
                style={[
                  styles.stepLine,
                  step === "reset" && { backgroundColor: COLORS.primary },
                ]}
              />
              <View
                style={[styles.stepDot, step === "reset" && styles.stepDotActive]}
              >
                <Text style={step === "reset" ? styles.stepDotTextActive : styles.stepDotText}>
                  2
                </Text>
              </View>
            </View>

            {step === "request" ? (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor={COLORS.textSecondary}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleRequestCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#000000" />
                  ) : (
                    <Text style={styles.buttonText}>Send Verification Code</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>OTP Code</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="keypad-outline" size={18} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter the 6-digit code"
                      placeholderTextColor={COLORS.textSecondary}
                      value={otpCode}
                      onChangeText={setOtpCode}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.input}
                      placeholder="At least 6 characters"
                      placeholderTextColor={COLORS.textSecondary}
                      value={newPassword}
                      onChangeText={setNewPassword}
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
                  <Text style={styles.label}>Confirm New Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.input}
                      placeholder="Re-enter new password"
                      placeholderTextColor={COLORS.textSecondary}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#000000" />
                  ) : (
                    <Text style={styles.buttonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendLink}
                  onPress={handleRequestCode}
                  disabled={loading}
                >
                  <Text style={styles.resendLinkText}>Didn't get a code? Resend</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.loginRow}>
              <Text style={styles.loginRowText}>Remember your password?</Text>
              <TouchableOpacity onPress={() => router.replace("/login")}>
                <Text style={styles.loginRowLink}> Sign in</Text>
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
    paddingHorizontal: 20,
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
    textAlign: "center",
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
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepDotText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },
  stepDotTextActive: {
    fontSize: 13,
    fontWeight: "800",
    color: "#000000",
  },
  stepLine: {
    width: 50,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
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
  resendLink: {
    alignSelf: "center",
    marginTop: 16,
  },
  resendLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
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