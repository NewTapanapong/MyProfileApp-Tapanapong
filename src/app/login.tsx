import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/context-auth";

const notify = (t: string, m: string) =>
  Platform.OS === "web"
    ? window.alert(`${t}\n\n${m}`)
    : Alert.alert(t, m);

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password) {
      notify("ข้อมูลไม่ครบ", "กรุณากรอก Username และ Password");
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
      if (router.canDismiss()) {
        router.dismissAll();
      }
      
      // ล็อกอินสำเร็จให้ส่งไปที่หน้า Home
      router.replace("/home"); 
    } catch (e) {
      notify(
        "เข้าสู่ระบบไม่สำเร็จ",
        e instanceof Error ? e.message : "เกิดข้อผิดพลาด"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <TouchableOpacity onPress={() => router.back()} style={styles.back}>
              <Ionicons name="arrow-back" size={21} color="#F5F7FA" />
            </TouchableOpacity>

            <View style={styles.iconBox}>
              <Ionicons name="briefcase-outline" size={30} color="#F5B94C" />
            </View>

            <Text style={styles.title}>เข้าสู่ระบบ</Text>
            <Text style={styles.subtitle}>เข้าสู่ร้าน Travel Luggage</Text>

            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color="#728097" />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor="#667388"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#728097" />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#667388"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={19}
                  color="#728097"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => router.push("/forgot-password")}
            >
              <Text style={styles.forgotText}>ลืมรหัสผ่าน?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={submit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#101827" />
              ) : (
                <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
              )}
            </TouchableOpacity>

            <View style={styles.registerWrap}>
              <Text style={styles.registerText}>ยังไม่มีบัญชี?</Text>
              <TouchableOpacity onPress={() => router.push("/register")}>
                <Text style={styles.registerLink}> สมัครสมาชิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B1220",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#111A29",
    borderWidth: 1,
    borderColor: "#253248",
    borderRadius: 18,
    padding: 28,
  },
  back: {
    alignSelf: "flex-start",
  },
  iconBox: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: "#182437",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 4,
  },
  title: {
    color: "#F5F7FA",
    fontSize: 25,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 16,
  },
  subtitle: {
    color: "#7E8A9E",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 25,
  },
  label: {
    color: "#DDE5EF",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 7,
    marginTop: 8,
  },
  inputWrap: {
    height: 47,
    borderWidth: 1,
    borderColor: "#2A374B",
    borderRadius: 9,
    backgroundColor: "#0B1220",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    color: "#F5F7FA",
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginTop: 9,
  },
  forgotText: {
    color: "#F5B94C",
    fontSize: 12,
    fontWeight: "700",
  },
  button: {
    height: 48,
    borderRadius: 9,
    backgroundColor: "#F5B94C",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#101827",
    fontWeight: "900",
  },
  registerWrap: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: {
    color: "#7E8A9E",
  },
  registerLink: {
    color: "#F5B94C",
    fontWeight: "800",
  },
});