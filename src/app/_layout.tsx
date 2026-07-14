import { Host, Icon, NavigationBar, NavigationBarItem, Text } from "@expo/ui/jetpack-compose";
import { Tabs } from "expo-router";
import { DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <ThemeProvider value={DefaultTheme}>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={(props) => {
          const selectedIndex = props.state.index;
          return (
            <Host style={{ height: 56 + insets.bottom, paddingBottom: insets.bottom, backgroundColor: "#F8FAFC" }}>
              <NavigationBar
                containerColor="#F8FAFC"
                tonalElevation={0}
              >
                <NavigationBarItem
                  selected={selectedIndex === 0}
                  onClick={() => props.navigation.navigate("index")}
                  colors={{
                    selectedIconColor: "#2563EB",
                    selectedTextColor: "#2563EB",
                    selectedIndicatorColor: "#DBEAFE",
                    unselectedIconColor: "#475569",
                    unselectedTextColor: "#475569",
                  }}
                >
                  <NavigationBarItem.Icon>
                    <Icon source={require("../../assets/icons/home.xml")} size={30} />
                  </NavigationBarItem.Icon>
                </NavigationBarItem>

                <NavigationBarItem
                  selected={selectedIndex === 1}
                  onClick={() => props.navigation.navigate("downloads")}
                  colors={{
                    selectedIconColor: "#2563EB",
                    selectedTextColor: "#2563EB",
                    selectedIndicatorColor: "#DBEAFE",
                    unselectedIconColor: "#475569",
                    unselectedTextColor: "#475569",
                  }}
                >
                  <NavigationBarItem.Icon>
                    <Icon source={require("../../assets/icons/download.xml")} size={30} />
                  </NavigationBarItem.Icon>
                </NavigationBarItem>
              </NavigationBar>
            </Host>
          );
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="downloads" options={{ title: "Downloads" }} />
      </Tabs>
    </ThemeProvider>
  );
}

