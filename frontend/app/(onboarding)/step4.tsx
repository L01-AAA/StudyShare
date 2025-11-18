import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OnboardingLayout from "./onboardingLayoutForStep";

export default function Onboarding4() {
  const router = useRouter();

  const handleNext = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    router.replace("/login"); 
  };

  return (
    <OnboardingLayout
      imageSource={require("../../assets/images/step4.png")}
      title="Chia sẻ để cùng nhau tiến bộ"
      desc="Tham gia StudyShare để xây dựng cộng đồng học tập thân thiện."
      nextLabel="Bắt đầu ngay"
      onNext={handleNext}
      totalSteps={3}
      currentStep={3}
    />
  );
}
