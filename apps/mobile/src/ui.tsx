import React, { createContext, useContext, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { money } from "@cashflow/contracts";
import type { useSave } from "./save";

const FocusedFieldContext = createContext<((target: number) => void) | null>(
  null,
);

type KeyboardScrollResponder = Pick<
  React.ComponentRef<typeof ScrollView>,
  "scrollResponderScrollNativeHandleToKeyboard"
>;

export function scrollFocusedField(
  responder: KeyboardScrollResponder | null | undefined,
  target: number,
) {
  requestAnimationFrame(() =>
    responder?.scrollResponderScrollNativeHandleToKeyboard(target, 16, true),
  );
}

export function KeyboardScrollView({
  children,
  ...props
}: React.ComponentProps<typeof ScrollView>) {
  const ref = useRef<React.ComponentRef<typeof ScrollView>>(null);
  return (
    <FocusedFieldContext.Provider
      value={(target) => scrollFocusedField(ref.current, target)}
    >
      <ScrollView
        ref={ref}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        {...props}
      >
        {children}
      </ScrollView>
    </FocusedFieldContext.Provider>
  );
}

export function useColors() {
  const dark = useColorScheme() === "dark";
  return dark
    ? {
        bg: "#0B1514",
        surface: "#142523",
        elevated: "#1A302D",
        soft: "#203936",
        text: "#F4F7F2",
        muted: "#AABCB5",
        border: "#34504A",
        outline: "#68827A",
        primary: "#86E0C6",
        primaryDeep: "#0E5448",
        onPrimary: "#082B25",
        hero: "#102C28",
        onHero: "#F7F6EF",
        accent: "#E5BE78",
        income: "#93E6B5",
        expense: "#FFB5AC",
        warning: "#FFD48A",
        warningBg: "#3B2D18",
        dangerBg: "#3B2220",
        successBg: "#183E31",
      }
    : {
        bg: "#F3F5F0",
        surface: "#FFFFFF",
        elevated: "#FBFCF9",
        soft: "#E7F0EA",
        text: "#112D28",
        muted: "#63736D",
        border: "#D7E1DA",
        outline: "#71827A",
        primary: "#126A59",
        primaryDeep: "#0B4038",
        onPrimary: "#FFFFFF",
        hero: "#103E36",
        onHero: "#FCFBF6",
        accent: "#C7A15C",
        income: "#137A4E",
        expense: "#B33F36",
        warning: "#7B540B",
        warningBg: "#FFF2D7",
        dangerBg: "#FCE8E5",
        successBg: "#DCF2E7",
      };
}

export const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  between: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  section: { gap: 12, marginTop: 28 },
  card: { padding: 18, borderRadius: 16, gap: 12 },
  amount: {
    fontSize: 36,
    lineHeight: 43,
    fontWeight: "700",
    letterSpacing: -0.8,
    fontVariant: ["tabular-nums"],
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "700",
    letterSpacing: -0.35,
  },
  body: { fontSize: 16, lineHeight: 24 },
  field: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 15,
    minHeight: 56,
    fontSize: 16,
  },
  button: {
    minHeight: 52,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  line: { paddingVertical: 15, gap: 5 },
  grow: { flex: 1, minWidth: 0 },
});

export function Copy({
  children,
  muted = false,
  bold = false,
  size = 16,
}: React.PropsWithChildren<{
  muted?: boolean;
  bold?: boolean;
  size?: number;
}>) {
  const c = useColors();
  return (
    <Text
      style={{
        color: muted ? c.muted : c.text,
        fontSize: size,
        lineHeight: Math.round(size * 1.45),
        fontWeight: bold ? "600" : "400",
      }}
    >
      {children}
    </Text>
  );
}

export function Title({ children }: React.PropsWithChildren) {
  const c = useColors();
  return (
    <Text accessibilityRole="header" style={[styles.title, { color: c.text }]}>
      {children}
    </Text>
  );
}

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  const c = useColors();
  return (
    <View style={styles.between}>
      <Text
        accessibilityRole="header"
        style={[styles.title, { color: c.text, fontSize: 20, lineHeight: 26 }]}
      >
        {title}
      </Text>
      {action}
    </View>
  );
}

export function IconTile({
  name,
  tone = "primary",
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  tone?: "primary" | "income" | "expense" | "accent";
}) {
  const c = useColors();
  const palette =
    tone === "income"
      ? { bg: c.successBg, fg: c.income }
      : tone === "expense"
        ? { bg: c.dangerBg, fg: c.expense }
        : tone === "accent"
          ? { bg: c.warningBg, fg: c.warning }
          : { bg: c.soft, fg: c.primary };
  return (
    <View
      style={{
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: palette.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={name} size={21} color={palette.fg} />
    </View>
  );
}

export function Screen({
  children,
  title,
  scroll = true,
  topInset = false,
}: React.PropsWithChildren<{
  title?: string;
  scroll?: boolean;
  topInset?: boolean;
}>) {
  const c = useColors();
  const content = (
    <View
      style={{
        width: "100%",
        maxWidth: 720,
        alignSelf: "center",
        paddingHorizontal: 20,
        paddingTop: title ? 22 : 16,
        gap: 16,
        paddingBottom: 42,
      }}
    >
      {title && <Title>{title}</Title>}
      {children}
    </View>
  );
  return (
    <SafeAreaView
      edges={
        topInset
          ? ["top", "left", "right", "bottom"]
          : ["left", "right", "bottom"]
      }
      style={{ flex: 1, backgroundColor: c.bg }}
    >
      {scroll ? (
        <KeyboardScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {content}
        </KeyboardScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
}: React.PropsWithChildren<{ style?: ViewStyle }>) {
  const c = useColors();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: c.surface,
          shadowColor: "#05251E",
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 7 },
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Button({
  label,
  accessibilityLabel = label,
  onPress,
  secondary = false,
  danger = false,
  disabled = false,
  icon,
}: {
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
}) {
  const c = useColors();
  const backgroundColor = danger ? c.dangerBg : secondary ? c.soft : c.primary;
  const color = danger ? c.expense : secondary ? c.primary : c.onPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          opacity: disabled ? 0.42 : pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <View style={styles.row}>
        {icon && <Ionicons name={icon} size={19} color={color} />}
        <Text
          style={{
            color,
            fontSize: 16,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function Field({
  label,
  helper,
  accessory,
  style,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & {
  label: string;
  helper?: string;
  accessory?: React.ReactNode;
}) {
  const c = useColors(),
    [focused, setFocused] = useState(false),
    scrollFocusedField = useContext(FocusedFieldContext);
  return (
    <View style={{ gap: 7 }}>
      <Text style={[styles.label, { color: focused ? c.primary : c.text }]}>
        {label}
      </Text>
      <View>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={c.muted}
          selectionColor={c.primary}
          onFocus={(event) => {
            setFocused(true);
            if (typeof event.target === "number")
              scrollFocusedField?.(event.target);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            styles.field,
            {
              borderColor: focused ? c.primary : c.border,
              color: c.text,
              backgroundColor: c.elevated,
              paddingRight: accessory ? 52 : 15,
            },
            style,
          ]}
          {...props}
        />
        {accessory && (
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              right: 12,
              top: 0,
              bottom: 0,
              justifyContent: "center",
            }}
          >
            {accessory}
          </View>
        )}
      </View>
      {helper && (
        <Copy muted size={13}>
          {helper}
        </Copy>
      )}
    </View>
  );
}

export function AmountField({
  label,
  value,
  onChange,
  disabled = false,
  signed = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  signed?: boolean;
}) {
  return (
    <Field
      label={label}
      value={value}
      editable={!disabled}
      keyboardType={signed ? "numbers-and-punctuation" : "number-pad"}
      onChangeText={(s) => {
        if ((signed ? /^-?\d{0,13}$/ : /^\d{0,13}$/).test(s))
          onChange(s.replace(/^(-?)0+(?=\d)/, "$1"));
      }}
      helper={
        /^-?\d+$/.test(value)
          ? money(value)
          : "Masukkan rupiah bulat, tanpa titik atau desimal."
      }
    />
  );
}

export function Choice({
  label,
  value,
  options,
  onChange,
  addLabel,
  onAdd,
  disabled = false,
}: {
  label: string;
  value: string;
  options: {
    id: string;
    name: string;
    description?: string;
    icon?: React.ComponentProps<typeof Ionicons>["name"];
  }[];
  onChange: (v: string) => void;
  addLabel?: string;
  onAdd?: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false),
    c = useColors(),
    selected = options.find((x) => x.id === value)?.name ?? "Belum dipilih";
  return (
    <View style={{ gap: 7 }}>
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${selected}`}
        disabled={disabled}
        onPress={() => {
          Keyboard.dismiss();
          setOpen(true);
        }}
        style={({ pressed }) => [
          styles.field,
          styles.between,
          {
            borderColor: c.border,
            backgroundColor: c.elevated,
            opacity: disabled ? 0.5 : pressed ? 0.82 : 1,
          },
        ]}
      >
        <Text style={{ color: c.text, fontSize: 16, flex: 1 }}>{selected}</Text>
        <Ionicons name="chevron-down" size={18} color={c.primary} />
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#071A1680",
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Tutup pilihan ${label}`}
            onPress={() => setOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView
            accessibilityViewIsModal
            style={{
              backgroundColor: c.surface,
              maxHeight: "82%",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 20,
              gap: 12,
            }}
          >
            <View
              style={{
                width: 42,
                height: 4,
                borderRadius: 2,
                backgroundColor: c.border,
                alignSelf: "center",
              }}
            />
            <View style={styles.between}>
              <Title>{label}</Title>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Tutup pilihan ${label}`}
                onPress={() => setOpen(false)}
                hitSlop={8}
                style={({ pressed }) => ({
                  width: 40,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 20,
                  backgroundColor: pressed ? c.soft : "transparent",
                })}
              >
                <Ionicons name="close" size={23} color={c.text} />
              </Pressable>
            </View>
            <ScrollView>
              {options.map((o) => (
                <Pressable
                  key={o.id}
                  accessibilityRole="radio"
                  accessibilityLabel={
                    o.description ? `${o.name}, ${o.description}` : o.name
                  }
                  accessibilityState={{ selected: o.id === value }}
                  onPress={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.between,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 17,
                      paddingHorizontal: 12,
                      marginHorizontal: -4,
                      gap: 12,
                      borderRadius: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: c.border,
                      backgroundColor:
                        o.id === value ? c.successBg : "transparent",
                      opacity: pressed ? 0.65 : 1,
                    },
                  ]}
                >
                  {o.icon && <IconTile name={o.icon} />}
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Text
                      style={{
                        color: c.text,
                        fontSize: 17,
                        fontWeight: o.id === value ? "700" : "400",
                      }}
                    >
                      {o.name}
                    </Text>
                    {o.description && (
                      <Copy muted size={14}>
                        {o.description}
                      </Copy>
                    )}
                  </View>
                  <Ionicons
                    name={
                      o.id === value ? "checkmark-circle" : "ellipse-outline"
                    }
                    size={22}
                    color={o.id === value ? c.primary : c.muted}
                  />
                </Pressable>
              ))}
            </ScrollView>
            {onAdd && (
              <Button
                label={addLabel ?? "Tambah pilihan"}
                secondary
                icon="add-outline"
                onPress={() => {
                  setOpen(false);
                  onAdd();
                }}
              />
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

export function DateField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false),
    c = useColors();
  if (Platform.OS === "web")
    return (
      <Field
        label={label + " (YYYY-MM-DD)"}
        value={value}
        onChangeText={onChange}
        editable={!disabled}
      />
    );
  return (
    <View style={{ gap: 7 }}>
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>
      <Button
        label={value}
        accessibilityLabel={`${label}, ${value}`}
        secondary
        icon="calendar-outline"
        onPress={() => {
          Keyboard.dismiss();
          setOpen(true);
        }}
        disabled={disabled}
      />
      {open && (
        <DateTimePicker
          themeVariant={c.bg === "#0B1514" ? "dark" : "light"}
          value={new Date(value + "T12:00:00")}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, d) => {
            if (Platform.OS === "android") setOpen(false);
            if (event.type === "set" && d)
              onChange(
                `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
              );
          }}
        />
      )}
      {open && Platform.OS === "ios" && (
        <Button
          label="Selesai memilih tanggal"
          onPress={() => setOpen(false)}
        />
      )}
    </View>
  );
}

export function Notice({
  children,
  error = false,
  success = false,
}: React.PropsWithChildren<{ error?: boolean; success?: boolean }>) {
  const c = useColors(),
    color = error ? c.expense : success ? c.income : c.warning,
    bg = error ? c.dangerBg : success ? c.successBg : c.warningBg;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        padding: 14,
        borderRadius: 14,
        backgroundColor: bg,
        flexDirection: "row",
        gap: 10,
      }}
    >
      <Ionicons
        name={
          error
            ? "alert-circle-outline"
            : success
              ? "checkmark-circle-outline"
              : "information-circle-outline"
        }
        color={color}
        size={20}
      />
      <Text style={{ color, flex: 1, fontSize: 14, lineHeight: 21 }}>
        {children}
      </Text>
    </View>
  );
}
export function FeedbackBanner({
  message,
  tone,
  onDismiss,
}: {
  message: string;
  tone: "success" | "info";
  onDismiss: () => void;
}) {
  const c = useColors(),
    success = tone === "success";
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        marginHorizontal: 16,
        padding: 14,
        borderRadius: 14,
        backgroundColor: success ? c.successBg : c.warningBg,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        shadowColor: "#05251E",
        shadowOpacity: 0.14,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 7 },
        elevation: 5,
      }}
    >
      <Ionicons
        name={success ? "checkmark-circle" : "information-circle"}
        color={success ? c.income : c.warning}
        size={21}
      />
      <Text
        style={{
          color: success ? c.income : c.warning,
          flex: 1,
          fontSize: 14,
          lineHeight: 20,
          fontWeight: "600",
        }}
      >
        {message}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tutup notifikasi"
        onPress={onDismiss}
        hitSlop={8}
      >
        <Ionicons
          name="close"
          color={success ? c.income : c.warning}
          size={20}
        />
      </Pressable>
    </View>
  );
}

export function Loading() {
  const c = useColors();
  return (
    <View style={{ padding: 34, alignItems: "center", gap: 12 }}>
      <ActivityIndicator color={c.primary} />
      <Copy muted size={14}>
        Menyiapkan catatan keluarga…
      </Copy>
    </View>
  );
}
export function LoadState({
  loading,
  error,
  retry,
  stale = false,
}: {
  loading: boolean;
  error: Error | null;
  retry: () => unknown;
  stale?: boolean;
}) {
  return loading ? (
    <Loading />
  ) : error ? (
    <>
      <Notice error={!stale}>
        {stale
          ? "Menampilkan data terakhir yang tersedia. Coba muat lagi untuk memperbarui."
          : error.message}
      </Notice>
      <Button
        label="Coba muat lagi"
        secondary
        onPress={() => {
          void retry();
        }}
      />
    </>
  ) : null;
}
export function SaveState({
  state,
  label,
  onPress,
}: {
  state: ReturnType<typeof useSave>;
  label: string;
  onPress: () => void;
}) {
  return (
    <View style={{ gap: 12 }}>
      {state.error && (
        <Notice error>
          {state.uncertain
            ? "Hasil penyimpanan belum diketahui. Isian dipertahankan; coba lagi untuk memastikan hasil yang sama."
            : state.error.message}
        </Notice>
      )}
      <Button
        label={
          state.busy
            ? "Menyimpan…"
            : state.uncertain
              ? "Periksa & coba lagi"
              : label
        }
        disabled={state.busy}
        onPress={onPress}
      />
    </View>
  );
}
export async function confirm(
  title: string,
  message: string,
  confirmLabel = "Lanjutkan",
  destructive = false,
): Promise<boolean> {
  if (Platform.OS === "web")
    return globalThis.confirm(`${title}\n\n${message}`);
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: "Batal", style: "cancel", onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? "destructive" : "default",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}
