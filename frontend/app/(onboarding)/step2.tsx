import { useRouter } from "expo-router";
import OnboardingLayout from "./onboardingLayoutForStep";

export default function Onboarding2() {
  const router = useRouter();

  return (
    <OnboardingLayout
      imageSource={require("../../assets/images/step2.png")}
      title={"Tìm tài liệu và dụng cụ \ntrong vài giây"}
      desc="Không cần phải tốn thời gian tìm kiếm và tổng hợp thông tin"
      nextLabel="Tiếp tục"
      onNext={() => router.push("/(onboarding)/step3")}
      totalSteps={3}
      currentStep={1}
    />
  );
}
