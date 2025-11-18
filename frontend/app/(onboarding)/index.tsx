import { View, Text, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function Onboarding1() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white px-7 justify-center items-center">

      <Image
        source={require("../../assets/images/logo.png")}
        className="w-[250px] h-[250px] mb-1"
        resizeMode="contain"
      />

      <Text className="text-[20px] text-[#756F6F] font-roboto-bold">
        Chia sẻ để cùng tiến xa
      </Text>

      <Image
        source={require("../../assets/images/onboarding1.png")}
        className="w-[250px] h-[180px] mt-8"
        resizeMode="contain"
      />

      <Text className="text-[20px] text-neutral-800 text-center mt-5 px-5 font-roboto">
        Nền tảng chia sẻ học tập dành riêng cho sinh viên Bách Khoa
      </Text>

      <TouchableOpacity
        onPress={() => router.push("/(onboarding)/step2")}
        className="bg-black w-full py-3.5 rounded-xl mt-10 items-center"
      >
        <Text className="text-white text-[17px] font-roboto-bold">
          Tiếp tục
        </Text>
      </TouchableOpacity>

    </View>
  );
}
