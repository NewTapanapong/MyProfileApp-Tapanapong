import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const COLORS = {
  primary: "#22D3EE",
  background: "#080A12",
  border: "#5EE7FF",
  text: "#F8FAFC",
  textSecondary: "#8F99AA",
};

export default function DetailScreen() {
  const { name, brand, price, image } =
    useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080A12" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={28}
            color={COLORS.primary}
          />
        </TouchableOpacity>

        <Text style={styles.title}>
          Product Detail
        </Text>

        <View style={{ width: 28 }} />
      </View>

      <ScrollView>

        <Image
          source={{ uri: image as string }}
          style={styles.image}
        />

        <View style={styles.content}>

          <Text style={styles.name}>
            {name}
          </Text>

          <Text style={styles.brand}>
            Brand : {brand}
          </Text>

          <Text style={styles.price}>
            {price}
          </Text>

          <Text style={styles.description}>
            This is a sample product detail page.
            You can connect this page with your
            GitHub JSON or API later.
          </Text>

        </View>

      </ScrollView>
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
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.primary,
  },

  image: {
    width: "100%",
    height: 320,
    resizeMode: "contain",
    marginTop: 20,
  },

  content: {
    padding: 20,
  },

  name: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
  },

  brand: {
    marginTop: 10,
    fontSize: 18,
    color: COLORS.textSecondary,
  },

  price: {
    marginTop: 15,
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.primary,
  },

  description: {
    marginTop: 25,
    lineHeight: 24,
    fontSize: 16,
    color: COLORS.textSecondary,
  },

});