import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TouchableOpacity, Text } from "react-native";

import LoginScreen from "../screens/LoginScreen";
import RecipesScreen from "../screens/RecipesScreen";
import RecipeDetailScreen from "../screens/RecipeDetailScreen";
import CreateRecipeScreen from "../screens/CreateRecipeScreen";
import { useAuth } from "../store/auth";
import { logoutApi } from "../api/auth";
import { Recipe } from "../api/recipes";

export type AuthStackParamList = {
  Login: undefined;
};

export type AppStackParamList = {
  Recipes: undefined;
  RecipeDetail: { recipe: Recipe };
  CreateRecipe: undefined;
};


const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();


function AuthNavigator() {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
    </AuthStack.Navigator>
  );
}

function AppStackNavigator() {
  const handleLogout = React.useCallback(async () => {
    try {
      await logoutApi();
    } catch (e) {
      console.log("Logout error", e);
    }
  }, []);

  return (
    <AppStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#020617" },
        headerTintColor: "#e5e7eb",
        headerTitleStyle: { fontSize: 18 },
        contentStyle: { backgroundColor: "#020617" },
      }}
    >
      <AppStack.Screen
        name="Recipes"
        component={RecipesScreen}
        options={{
          title: "Recetas",
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout}>
              <Text
                style={{
                  color: "#f97373",
                  fontWeight: "600",
                  fontSize: 14,
                  marginRight: 4,
                }}
              >
                Salir
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <AppStack.Screen
        name="CreateRecipe"
        component={CreateRecipeScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{ title: "Detalle de receta" }}
      />
    </AppStack.Navigator>
  );
}

export default function AppNavigator() {
  const token = useAuth((s) => s.token);

  return (
    <NavigationContainer>
      {token ? <AppStackNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
