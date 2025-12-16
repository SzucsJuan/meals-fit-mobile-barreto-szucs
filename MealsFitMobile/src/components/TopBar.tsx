import React, { useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Pressable,
} from "react-native";
import { useAuth } from "../store/auth";
import { useNavigation, useRoute, CommonActions } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";

const COLORS = {
    bg: "#020617",
    card: "#0b1220",
    border: "#1f2937",
    textPrimary: "#e5e7eb",
    textSecondary: "#94a3b8",
    accent: "#FF9800",
    danger: "#f97373",
};

type Nav = NativeStackNavigationProp<AppStackParamList>;

export function TopBar({ onLogout }: { onLogout: () => Promise<void> }) {
    const user = useAuth((s) => s.user);
    const [open, setOpen] = useState(false);

    const navigation = useNavigation<Nav>();
    const route = useRoute();

    const activeRouteName = useMemo(() => {
        return (route?.name as keyof AppStackParamList) ?? "Home";
    }, [route?.name]);

    const isActive = (name: keyof AppStackParamList) => activeRouteName === name;

    const logo = require("../../assets/icon.png");

    function close() {
        setOpen(false);
    }

    function go(name: keyof AppStackParamList) {
        close();
        const nav: any = navigation;
        const parent = nav.getParent?.();

        (parent ?? nav).dispatch(
            CommonActions.navigate({ name: name as string })
        );
    }

    return (
        <View style={styles.topBarWrapper}>
            <View style={styles.topBar}>
                <View style={styles.brandRow}>
                    <Image source={logo} style={styles.brandLogo} />
                    <Text style={styles.brandText}>Meals&Fit</Text>
                </View>

                <View style={styles.topRight}>
                    {user?.name ? <Text style={styles.userName}>{user.name}</Text> : null}

                    <TouchableOpacity
                        onPress={() => setOpen((prev) => !prev)}
                        style={styles.burgerButton}
                        activeOpacity={0.7}
                    >
                        <View style={styles.burgerLine} />
                        <View style={styles.burgerLine} />
                        <View style={styles.burgerLine} />
                    </TouchableOpacity>
                </View>
            </View>

            {open && (
                <>
                    <Pressable style={styles.overlay} onPress={close} />

                    <View style={styles.menuCard}>
                        <Text style={styles.menuTitle}>Navigation</Text>

                        <TouchableOpacity
                            style={[styles.menuItem, isActive("Home") && styles.menuItemActive]}
                            onPress={() => go("Home")}
                            activeOpacity={0.85}
                        >
                            <Text style={[styles.menuItemText, isActive("Home") && styles.menuItemActiveText]}>
                                Home
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.menuItem, isActive("Recipes") && styles.menuItemActive]}
                            onPress={() => go("Recipes")}
                            activeOpacity={0.85}
                        >
                            <Text style={[styles.menuItemText, isActive("Recipes") && styles.menuItemActiveText]}>
                                My Recipes
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.menuDivider} />

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={async () => {
                                close();
                                await onLogout();
                            }}
                            activeOpacity={0.85}
                        >
                            <Text style={[styles.menuItemText, { color: COLORS.danger, fontWeight: "800" }]}>
                                Logout
                            </Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    topBarWrapper: {
        position: "relative",
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 10,
        backgroundColor: COLORS.bg,
        zIndex: 50,
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    brandRow: { flexDirection: "row", alignItems: "center" },
    brandLogo: { width: 26, height: 26, borderRadius: 13, marginRight: 8 },
    brandText: { fontSize: 18, fontWeight: "900", color: COLORS.textPrimary },

    topRight: { flexDirection: "row", alignItems: "center" },
    userName: { fontSize: 13, color: COLORS.textSecondary, marginRight: 10, maxWidth: 140 },

    burgerButton: {
        width: 34,
        height: 34,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.card,
        justifyContent: "center",
        alignItems: "center",
    },
    burgerLine: {
        width: 16,
        height: 2,
        backgroundColor: COLORS.textPrimary,
        marginVertical: 1,
    },

    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: -2000,
        backgroundColor: "transparent",
        zIndex: 98,
    },

    menuCard: {
        position: "absolute",
        top: 52,
        right: 16,
        width: 190,
        backgroundColor: COLORS.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 10,
        paddingVertical: 10,
        elevation: 10,
        zIndex: 99,
    },
    menuTitle: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 8 },

    menuItem: { paddingVertical: 10, paddingHorizontal: 10, borderRadius: 999 },
    menuItemText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: "700" },

    menuItemActive: { backgroundColor: COLORS.accent },
    menuItemActiveText: { color: "#111827", fontWeight: "900" },

    menuDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },
});
