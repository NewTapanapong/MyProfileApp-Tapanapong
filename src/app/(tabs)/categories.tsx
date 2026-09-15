import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const COLORS = {
  primary: "#EC4899",
  background: "#080A12",
  border: "#5EE7FF",
  text: "#F8FAFC",
};

const categories = [
  "Shoes",
  "Clothes",
  "Electronics",
  "Sports",
  "Accessories",
  "Bags",
];

export default function CategoriesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080A12" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={26}
            color={COLORS.primary}
          />
        </TouchableOpacity>

        <Text style={styles.title}>
          Categories
        </Text>

        <View style={{ width: 26 }} />
      </View>

      {categories.map((item, index) => (
        <TouchableOpacity key={index} style={styles.card}>
          <Ionicons
            name="folder"
            size={26}
            color={COLORS.primary}
          />

          <Text style={styles.name}>
            {item}
          </Text>

          <Ionicons
            name="chevron-forward"
            size={22}
            color="#999"
          />
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primary,
  },

  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  name: {
    flex: 1,
    marginLeft: 15,
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
});