import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import type { OmdbSearchResult } from "@/lib/types";

interface AddMovieSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (title: string, omdbResult?: OmdbSearchResult) => void;
  isAdding: boolean;
}

export function AddMovieSheet({ visible, onClose, onAdd, isAdding }: AddMovieSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OmdbSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    setResults([]);
    try {
      const res = await api.omdb(query.trim());
      if (res.Search) {
        setResults(res.Search);
      } else {
        setSearchError(res.Error ?? "No results found.");
      }
    } catch {
      setSearchError("Search unavailable. You can still add manually.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (result: OmdbSearchResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAdd(result.Title, result);
    reset();
  };

  const handleAddManually = () => {
    if (!query.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAdd(query.trim());
    reset();
  };

  const reset = () => {
    setQuery("");
    setResults([]);
    setSearchError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.header,
            { borderBottomColor: colors.border, paddingTop: insets.top || 20 },
          ]}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>Add a Movie</Text>
          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View
          style={[
            styles.searchRow,
            { borderColor: colors.border, backgroundColor: colors.muted },
          ]}
        >
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Search movies or shows..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 ? (
            <Pressable onPress={() => { setQuery(""); setResults([]); }}>
              <Feather name="x-circle" size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.searchBtn, { backgroundColor: colors.primary }]}
            onPress={handleSearch}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Search</Text>
            )}
          </Pressable>
          {query.trim().length > 0 ? (
            <Pressable
              style={[styles.manualBtn, { borderColor: colors.border }]}
              onPress={handleAddManually}
              disabled={isAdding}
            >
              <Text style={[styles.manualBtnText, { color: colors.mutedForeground }]}>
                Add "{query.trim()}" manually
              </Text>
            </Pressable>
          ) : null}
        </View>

        {searchError ? (
          <Text style={[styles.error, { color: colors.mutedForeground }]}>{searchError}</Text>
        ) : null}

        <FlatList
          data={results}
          keyExtractor={(item) => item.imdbID}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.result,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => handleSelect(item)}
            >
              {item.Poster && item.Poster !== "N/A" ? (
                <Image
                  source={{ uri: item.Poster }}
                  style={styles.poster}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.posterPlaceholder, { backgroundColor: colors.muted }]}>
                  <Feather name="film" size={20} color={colors.mutedForeground} />
                </View>
              )}
              <View style={styles.resultInfo}>
                <Text
                  style={[styles.resultTitle, { color: colors.foreground }]}
                  numberOfLines={2}
                >
                  {item.Title}
                </Text>
                <Text style={[styles.resultMeta, { color: colors.mutedForeground }]}>
                  {item.Year} · {item.Type}
                </Text>
              </View>
              <Feather name="plus" size={20} color={colors.primary} />
            </Pressable>
          )}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  closeBtn: { padding: 4 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  actions: { paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  searchBtn: { paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  btnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  manualBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  manualBtnText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  error: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  result: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  poster: { width: 50, height: 70, borderRadius: 6 },
  posterPlaceholder: {
    width: 50,
    height: 70,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  resultMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    textTransform: "capitalize",
  },
});
