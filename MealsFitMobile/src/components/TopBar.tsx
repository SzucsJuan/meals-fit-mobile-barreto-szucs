import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
} from "react-native";
import { useAuth } from "../store/auth";

const COLORS = {
    bg: "#F8F5F0",
    card: "#FFFFFF",
    border: "#E5E7EB",
    textPrimary: "#1F2937",
    textSecondary: "#6B7280",
    green: "#22C55E",
};

export function TopBar({ onLogout }: { onLogout: () => Promise<void> }) {
    const user = useAuth((s) => s.user);
    const [open, setOpen] = useState(false);
    const toggleMenu = () => setOpen((prev) => !prev);

    const logo = require("../../assets/icon.png");

    return (
        <View style={styles.topBarWrapper}>
            <View style={styles.topBar}>
                <View style={styles.brandRow}>
                    <Image source={logo} style={styles.brandLogo} />
                    <Text style={styles.brandText}>Meals&Fit</Text>
                </View>

                <View style={styles.topRight}>
                    {user && <Text style={styles.userName}>{user.name}</Text>}

                    <TouchableOpacity
                        onPress={toggleMenu}
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
                <View style={styles.menuCard}>
                    <Text style={styles.menuTitle}>Navigation</Text>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => setOpen(false)}
                    >
                        <Text style={styles.menuItemText}>Home</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => setOpen(false)}
                    >
                        <Text style={styles.menuItemText}>Meals</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, styles.menuItemActive]}
                        onPress={() => setOpen(false)}
                    >
                        <Text style={[styles.menuItemText, styles.menuItemActiveText]}>
                            My Recipes
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => setOpen(false)}
                    >
                        <Text style={styles.menuItemText}>Discover</Text>
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={async () => {
                            setOpen(false);
                            await onLogout();
                        }}
                    >
                        <Text style={[styles.menuItemText, { color: "#DC2626" }]}>
                            Logout
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    topBarWrapper: {
        position: "relative",
        marginBottom: 4,
        paddingHorizontal: 16,
        paddingTop: 4,
        zIndex: 20,
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    brandRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    brandLogo: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 6,
    },
    brandText: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    topRight: {
        flexDirection: "row",
        alignItems: "center",
    },
    userName: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginRight: 6,
    },
    burgerButton: {
        width: 32,
        height: 32,
        borderRadius: 100,
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

    // MENU
    menuCard: {
        position: "absolute",
        top: 48,
        right: 16,
        width: 190,
        backgroundColor: COLORS.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 10,
        paddingVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
        zIndex: 999,
    },
    menuTitle: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginBottom: 6,
    },
    menuItem: {
        paddingVertical: 6,
    },
    menuItemText: {
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    menuItemActive: {
        backgroundColor: COLORS.green,
        borderRadius: 100,
        paddingHorizontal: 8,
    },
    menuItemActiveText: {
        color: "#FFF",
        fontWeight: "700",
    },
    menuDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 6,
    },
});
