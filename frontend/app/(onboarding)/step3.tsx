import { useRouter } from "expo-router";
import OnboardingLayout from "./onboardingLayoutForStep";

export default function Onboarding3() {
  const router = useRouter();

  return (
    <OnboardingLayout
      imageSource={require("../../assets/images/step3.png")}
      title={"Nơi người cần và người có \ngặp nhau"}
      desc="Mua, bán hoặc tặng lại tài liệu, tất cả trong một nền tảng duy nhất"
      nextLabel="Tiếp tục"
      onNext={() => router.push("/(onboarding)/step4")}
      totalSteps={3}
      currentStep={2}
    />
  );
}
