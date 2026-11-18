import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  BACKEND_URL,
  GROUP,
  MQTT_BROKER_URL,
  MQTT_TOPIC,
} from "../services/config.js";
import { tokens } from "../theme/tokens.js";

const { color, space, radius, shadow } = tokens;

const HERO_BG = "#0B1220";
const HERO_ACCENT = "#60A5FA";

function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function InfoRow({ icon, label, value, mono = false, last = false }) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={16} color={color.text2} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text
          style={[styles.infoValue, mono && styles.infoValueMono]}
          numberOfLines={2}
        >
          {value ?? "--"}
        </Text>
      </View>
    </View>
  );
}

export function ProfileScreen() {
  const group = GROUP ?? {};
  const members = Array.isArray(group.members) ? group.members : [];
  const number = group.number ?? "--";

  const chips = useMemo(
    () =>
      [group.course, group.class].filter(
        (item) => typeof item === "string" && item.length > 0
      ),
    [group.course, group.class]
  );

  const tech = ["React Native", "Expo", "MQTT", "Neon Postgres"];

  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>K{number}</Text>
          </View>
          <Text style={styles.heroTitle}>{group.name ?? "Kelompok"}</Text>
          <Text style={styles.heroSubtitle}>
            {group.project ?? "LiveTemp — Monitoring Suhu Real-time"}
          </Text>

          <View style={styles.chipRow}>
            {chips.map((chip) => (
              <View key={chip} style={styles.heroChip}>
                <Text style={styles.heroChipText}>{chip}</Text>
              </View>
            ))}
            <View style={styles.heroChip}>
              <Ionicons name="people-outline" size={12} color={HERO_ACCENT} />
              <Text style={styles.heroChipText}>
                {members.length} anggota
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Anggota Kelompok</Text>
          <View style={styles.countPill}>
            <Text style={styles.countText}>{members.length}</Text>
          </View>
        </View>

        <View style={styles.card}>
          {members.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="person-add-outline" size={22} color={color.text3} />
              <Text style={styles.emptyText}>
                Data anggota belum diisi. Lengkapi pada app.json → extra.group.
              </Text>
            </View>
          ) : (
            members.map((member, index) => (
              <View
                key={`${member.name}-${index}`}
                style={[
                  styles.memberRow,
                  index === members.length - 1 && styles.memberRowLast,
                ]}
                accessible
                accessibilityLabel={`${member.role ?? "Anggota"}, ${
                  member.name
                }, ${member.nim ?? "NIM belum diisi"}`}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(member.name)}</Text>
                </View>
                <View style={styles.memberTextWrap}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberNim}>{member.nim ?? "--"}</Text>
                </View>
                {member.role ? (
                  <View style={styles.rolePill}>
                    <Text style={styles.roleText}>{member.role}</Text>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informasi Aplikasi</Text>
        </View>

        <View style={styles.card}>
          <InfoRow
            icon="phone-portrait-outline"
            label="Aplikasi"
            value={`${Constants.expoConfig?.name ?? "LiveTemp"} v${
              Constants.expoConfig?.version ?? "1.0.0"
            }`}
          />
          <InfoRow
            icon="server-outline"
            label="Backend REST API"
            value={BACKEND_URL}
            mono
          />
          <InfoRow
            icon="radio-outline"
            label="MQTT broker"
            value={MQTT_BROKER_URL}
            mono
          />
          <InfoRow
            icon="git-branch-outline"
            label="MQTT topic"
            value={MQTT_TOPIC}
            mono
            last
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Teknologi</Text>
        </View>

        <View style={styles.techWrap}>
          {tech.map((item) => (
            <View key={item} style={styles.techChip}>
              <Text style={styles.techText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerNote}>
          <Ionicons name="information-circle-outline" size={15} color={color.text3} />
          <Text style={styles.footerText}>
            Data kelompok dapat diubah pada app.json → extra.group.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.bg,
  },
  container: {
    padding: space.lg,
    paddingBottom: space.xxl,
    gap: space.md,
    backgroundColor: color.bg,
  },
  hero: {
    backgroundColor: HERO_BG,
    borderRadius: radius.card,
    borderCurve: "continuous",
    padding: space.xl,
    gap: space.sm,
    overflow: "hidden",
  },
  heroBadge: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.5)",
    backgroundColor: "rgba(96,165,250,0.12)",
    marginBottom: space.sm,
  },
  heroBadgeText: {
    color: HERO_ACCENT,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    color: "rgba(226,232,240,0.72)",
    fontSize: 13,
    lineHeight: 19,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    marginTop: space.sm,
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
    borderCurve: "continuous",
    backgroundColor: "rgba(148,163,184,0.16)",
  },
  heroChipText: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginTop: space.sm,
  },
  sectionTitle: {
    fontSize: tokens.type.section,
    fontWeight: "700",
    color: color.text,
  },
  countPill: {
    backgroundColor: color.surface2,
    borderRadius: radius.pill,
    borderCurve: "continuous",
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    color: color.text2,
    fontVariant: ["tabular-nums"],
  },
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.card,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: color.border,
    boxShadow: shadow.card,
    overflow: "hidden",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.md,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  memberRowLast: {
    borderBottomWidth: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.surface2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: color.border,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: color.primary,
  },
  memberTextWrap: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "600",
    color: color.text,
  },
  memberNim: {
    fontSize: 12,
    color: color.text3,
    fontVariant: ["tabular-nums"],
  },
  rolePill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderCurve: "continuous",
    backgroundColor: color.surface2,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "600",
    color: color.text2,
  },
  emptyWrap: {
    alignItems: "center",
    gap: space.sm,
    padding: space.xl,
  },
  emptyText: {
    fontSize: 13,
    color: color.text2,
    textAlign: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.md,
    padding: space.md,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderCurve: "continuous",
    backgroundColor: color.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextWrap: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: color.text3,
  },
  infoValue: {
    fontSize: 13,
    color: color.text,
    fontWeight: "500",
  },
  infoValueMono: {
    fontFamily: "monospace",
    fontSize: 12,
  },
  techWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
  },
  techChip: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: radius.pill,
    borderCurve: "continuous",
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  techText: {
    fontSize: 12,
    fontWeight: "600",
    color: color.text2,
  },
  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: space.sm,
    paddingHorizontal: space.sm,
  },
  footerText: {
    fontSize: 12,
    color: color.text3,
    flex: 1,
  },
});
