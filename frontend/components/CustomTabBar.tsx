import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: "row",
        height: 64 + insets.bottom, 
        paddingBottom: insets.bottom,
        backgroundColor: "#fff",
        borderTopWidth: 0.5,
        borderTopColor: "#eee",
      }}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        if (route.name === "createpostpage") {
          return (
            <View
              key={route.key}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible",
              }}
            >
              {isFocused && (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    backgroundColor: "#ff6a00",
                    borderRadius: 1.5,
                  }}
                />
              )}
              <TouchableOpacity
                onPress={() => navigation.navigate(route.name)}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: "#fff",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: isFocused ? 0 : 1.5,
                  borderColor: "#ddd",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,

                    alignItems: "center",
                    justifyContent: "center",

                    borderWidth: isFocused ? 2 : 0,
                    borderColor: "#ff6a00",
                  }}
                >
                  <Ionicons
                    name="add"
                    size={24}
                    color={isFocused ? "#ff6a00" : "#666"}
                  />
                </View>
              </TouchableOpacity>
            </View>
          );
        }

        const iconMap: Record<string, any> = {
          homepage: "home-outline",
          searchpage: "search-outline",
          messagepage: "chatbubble-outline",
          profilepage: "person-outline",
        };

        return (
          <View
            key={route.key}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              overflow: "visible",
            }}
          >
            {isFocused && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  backgroundColor: "#ff6a00",
                  borderRadius: 1.5,
                }}
              />
            )}
            <TouchableOpacity onPress={() => navigation.navigate(route.name)}>
              <Ionicons
                name={iconMap[route.name]}
                size={24}
                color={isFocused ? "#ff6a00" : "#999"}
              />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}
