import { useRouter } from "expo-router";
import { Image, ImageSourcePropType, Text, TouchableOpacity, View } from "react-native";
import { tokens } from "./onboardingTokens";

interface OnboardingLayoutProps {
  imageSource: ImageSourcePropType;
  title: string;
  desc: string;
  nextLabel: string;
  onNext: () => void;
  totalSteps: number;
  currentStep: number;
}

export default function OnboardingLayout({
  imageSource,
  title,
  desc,
  nextLabel,
  onNext,
  totalSteps,
  currentStep,
}: OnboardingLayoutProps) {
  const router = useRouter();

  return (
    <View className={tokens.container}>
      <View className="w-full items-center">
        <View className="mt-2 mb-4 flex-row justify-center">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <View
              key={index}
              className={`
                w-3 h-3 mx-1 rounded-full
                ${index + 1 === currentStep ? "bg-primary-500" : "bg-primary-300"}
              `}
            />
          ))}
        </View>

        <Image
          source={imageSource}
          resizeMode="contain"
          className="w-[260px] h-[260px] mt-20 mb-15"
        />


        <Text className={`${tokens.title} mt-4`}>{title}</Text>
        <Text className={tokens.desc}>{desc}</Text>
      </View>

      <View className="w-full">
        <TouchableOpacity onPress={onNext} className={tokens.button}>
          <Text className={tokens.buttonText}>{nextLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          className="w-full py-3 border border-[#000] mt-3 rounded-xl items-center"
        >
          <Text className="text-[#000] text-[16px] font-roboto-medium">
            Quay lại
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
