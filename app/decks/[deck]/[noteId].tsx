import { ThemedText } from "@/components/ThemedText";
import { useAIInstructions } from "@/hooks/useAIInstructions";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAnkiContext } from "@/providers/AnkiProvider";
import { generateContent } from "@/utils/aiService";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

// Define interfaces
interface FieldWithDescription {
  value: string;
  description: string;
}

export default function NoteEditor() {
  const { /* deck, */ noteId } = useLocalSearchParams<{
    deck: string;
    noteId: string;
  }>();
  const { getNoteFields, updateNote, getNoteType } = useAnkiContext();

  const [fieldsData, setFieldsData] = useState<
    Record<string, FieldWithDescription>
  >({});
  const [noteType, setNoteType] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [showInstructions, setShowInstructions] = useState(false);

  // Theme colors
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const borderColor = textColor + "40";

  // Use AI instructions hook with the note's type
  const {
    loading: instructionsLoading,
    getInstruction,
    saveInstruction,
  } = useAIInstructions(noteType);

  // Animation values
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>(
    {}
  );
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Load note data and note type
  useEffect(() => {
    const loadNote = async () => {
      if (!noteId) return;

      try {
        setLoading(true);

        // First get the note type
        const type = await getNoteType(Number(noteId));
        // console.log("Note type:", type);
        setNoteType(type);

        // Then load note fields
        const fields = await getNoteFields(Number(noteId));
        setFieldsData(fields);
      } catch (error) {
        console.error("Error loading note:", error);
        Toast.show({
          type: "error",
          text1: "Failed to load note",
          position: "top",
        });
      } finally {
        setLoading(false);
      }
    };

    loadNote();
  }, [noteId, getNoteFields, getNoteType]);

  // Simplified updateField function - no longer adds separators
  const updateField = (fieldName: string, value: string) => {
    setFieldsData((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value: value,
      },
    }));
  };

  // Generate content with AI
  const generateWithAI = async (targetFieldName: string) => {
    console.log("Generate button clicked for field:", targetFieldName);

    // Get the instruction for this field
    const fieldInstruction = getInstruction(targetFieldName);

    try {
      // Show loading state
      setIsGenerating((prev) => ({ ...prev, [targetFieldName]: true }));
      console.log("Starting generation for field:", targetFieldName);

      // Get the field description and current value
      const firstFieldValue = Object.values(fieldsData)[0]?.value;
      const currentFieldValue = fieldsData[targetFieldName]?.value || "";

      console.log("🚀 ~ generateWithAI ~ firstFieldValue:", firstFieldValue);

      // Call the AI service
      const content = await generateContent(
        targetFieldName,
        firstFieldValue,
        fieldInstruction,
        currentFieldValue // Pass current value to decide if separator is needed
      );

      console.log("Generation successful, updating field:", targetFieldName);

      // Update the field with the returned content (which now includes separator if needed)
      updateField(targetFieldName, content);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to generate content",
        text2: error instanceof Error ? error.message : "Unknown error",
        position: "top",
      });
      // console.error("Error generating content:", error);
    } finally {
      // Reset generating state
      setIsGenerating((prev) => ({ ...prev, [targetFieldName]: false }));
    }
  };

  // Save note changes
  const saveNote = async () => {
    if (!noteId) return;

    try {
      // Convert fieldsData to the format expected by updateNote
      const fieldsToUpdate: Record<string, string> = {};
      Object.entries(fieldsData).forEach(([fieldName, field]) => {
        fieldsToUpdate[fieldName] = field.value;
      });

      await updateNote(Number(noteId), fieldsToUpdate);

      Toast.show({
        type: "success",
        text1: "Note saved",
        position: "top",
        // bottomOffset: 150,
      });
    } catch (error) {
      console.error("Error saving note:", error);
      Toast.show({
        type: "error",
        text1: "Failed to save note",
        position: "top",
        // bottomOffset: 150,
      });
    }
  };

  // Animation when component mounts
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Show loading if data is being fetched
  if (loading || instructionsLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText style={styles.loadingText}>Loading note...</ThemedText>
      </View>
    );
  }

  const toggleFieldInstruction = (fieldName: string) => {
    setExpandedFields((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 100} // adjust offset if needed
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Add Stack.Screen with save button in header */}
          <Stack.Screen
            options={{
              title: noteType || "Edit Note",
              headerStyle: {
                backgroundColor: "#121212",
              },
              headerTintColor: "#fff",
              headerRight: () => (
                <>
                  {/* Removed save button from header */}
                  <Pressable
                    onPress={() => router.push("/settings")}
                    style={({ pressed }) => [
                      styles.headerButton,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons name="settings-outline" size={24} color="#fff" />
                  </Pressable>
                </>
              ),
            }}
          />

          {/* Header with note type and instructions toggle */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <View style={styles.headerRow}>
              <View style={styles.noteTypeBadge}>
                <ThemedText style={styles.noteTypeText}>{noteType}</ThemedText>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.instructionsToggle,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setShowInstructions(!showInstructions)}
              >
                <ThemedText style={styles.instructionsToggleText}>
                  {showInstructions
                    ? "Hide All Instructions"
                    : "Show All Instructions"}
                </ThemedText>
                <Ionicons
                  name={showInstructions ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#64dd17"
                />
              </Pressable>
            </View>
          </Animated.View>

          {/* Fields listing */}
          {Object.entries(fieldsData).map(([fieldName, field], index) => {
            const isExpanded = expandedFields[fieldName] || showInstructions;

            return (
              <Animated.View
                key={fieldName}
                style={[
                  styles.fieldContainer,
                  {
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50 + index * 20, 0],
                        }),
                      },
                    ],
                    opacity: fadeAnim,
                  },
                ]}
              >
                {/* Field header with expand/collapse action */}
                <View
                  style={[
                    styles.fieldHeaderContainer,
                    isExpanded && styles.fieldHeaderExpanded,
                  ]}
                >
                  <View style={styles.fieldTitleRow}>
                    <View style={styles.fieldTitleWrapper}>
                      {/* Fix: Use inline style instead of styles.fieldTitle */}
                      <ThemedText style={{ fontSize: 18, fontWeight: "bold" }}>
                        {fieldName}
                      </ThemedText>
                    </View>
                    <View style={styles.fieldTitleActions}>
                      {/* Clear field icon - use MaterialIcons "highlight-off" for a softer look */}
                      <Pressable
                        onPress={() => updateField(fieldName, "")}
                        style={({ pressed }) => [
                          styles.clearFieldButton,
                          pressed && styles.clearFieldButtonPressed,
                        ]}
                        hitSlop={10}
                      >
                        <MaterialIcons name="highlight-off" size={22} color="#e57373" />
                      </Pressable>
                      {/* Expand/collapse icon */}
                      <Pressable
                        onPress={() => toggleFieldInstruction(fieldName)}
                        style={({ pressed }) => [
                          styles.expandButton,
                          pressed && styles.buttonPressed,
                        ]}
                        hitSlop={8}
                      >
                        <View
                          style={[
                            styles.expandButtonContainer,
                            isExpanded && styles.expandButtonActive,
                          ]}
                        >
                          <Ionicons
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={20}
                            color={isExpanded ? "#64dd17" : textColor + "CC"}
                          />
                        </View>
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* Field content input */}
                <TextInput
                  style={[
                    styles.fieldInput,
                    {
                      color: textColor,
                      backgroundColor:
                        backgroundColor === "#000" ? "#0a0a0a" : backgroundColor,
                      borderColor: borderColor,
                    },
                  ]}
                  multiline
                  value={field.value}
                  onChangeText={(text) => updateField(fieldName, text)} // Direct update without substring
                  placeholder={`Enter ${fieldName.toLowerCase()}...`}
                  placeholderTextColor={`${textColor}60`}
                />

                {/* AI instruction section */}
                {isExpanded && (
                  <View style={styles.instructionContainer}>
                    <View style={styles.instructionHeaderRow}>
                      <MaterialIcons
                        name="psychology-alt"
                        size={18}
                        color="#64dd17"
                      />
                      <ThemedText style={styles.instructionLabel}>
                        AI Template
                      </ThemedText>
                    </View>

                    <TextInput
                      style={[
                        styles.instructionInput,
                        {
                          color: textColor,
                          backgroundColor:
                            backgroundColor === "#000" ? "#111" : backgroundColor,
                          borderColor: "#64dd17" + "40",
                        },
                      ]}
                      multiline
                      value={getInstruction(fieldName)}
                      onChangeText={(text) => saveInstruction(fieldName, text)}
                      placeholder={`How should AI generate this ${fieldName.toLowerCase()}?`}
                      placeholderTextColor={`${textColor}60`}
                    />

                    <View style={styles.instructionNoteContainer}>
                      <Ionicons
                        name="information-circle-outline"
                        style={styles.instructionNoteIcon}
                        size={16}
                        color="#64dd17"
                      />
                      <ThemedText style={styles.instructionNote}>
                        This template applies to the &quot;{fieldName}&quot; field
                        of &quot;{noteType}&quot; note type.
                      </ThemedText>
                    </View>
                  </View>
                )}

                {/* Generate button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.generateButton,
                    isGenerating[fieldName] && styles.generateButtonDisabled,
                    pressed &&
                      !isGenerating[fieldName] &&
                      styles.generateButtonPressed,
                  ]}
                  onPress={() => generateWithAI(fieldName)}
                  disabled={isGenerating[fieldName]}
                  android_ripple={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {isGenerating[fieldName] ? (
                    <View style={styles.generatingContainer}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <ThemedText style={styles.generatingText}>
                        Generating...
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={styles.generateButtonContent}>
                      <MaterialIcons
                        name="auto-awesome"
                        size={20}
                        color="#FFFFFF"
                      />
                      <ThemedText style={styles.generateButtonText}>
                        Generate with AI
                      </ThemedText>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </ScrollView>
        {/* FAB Save Button */}
        <Pressable
          onPress={saveNote}
          style={({ pressed }) => [
            styles.fabSaveButton,
            pressed && styles.fabSaveButtonPressed,
          ]}
          hitSlop={16}
        >
          <Ionicons name="save-outline" size={28} color="#fff" />
        </Pressable>
      </KeyboardAvoidingView>
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    opacity: 0.7,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#fff",
  },
  headerRow: {
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },
  noteTypeBadge: {
    backgroundColor: "#222",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  noteTypeText: {
    fontSize: 14,
    opacity: 0.8,
  },
  instructionsToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(100, 221, 23, 0.15)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  instructionsToggleText: {
    marginRight: 6,
    fontSize: 14,
    color: "#64dd17",
    fontWeight: "500",
  },
  fieldContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#111",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  fieldHeaderContainer: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: "#1a1a1a",
  },
  fieldHeaderPressable: {
    padding: 16,
  },
  fieldHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(100, 221, 23, 0.3)",
  },
  fieldTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  fieldTitleWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  fieldTitleActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6, // more space between icons
  },
  clearFieldButton: {
    marginRight: 2,
    padding: 4,
    borderRadius: 16,
    backgroundColor: "#2d2323",
    justifyContent: "center",
    alignItems: "center",
  },
  clearFieldButtonPressed: {
    backgroundColor: "#4e2428",
  },
  expandButtonContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  expandButtonActive: {
    backgroundColor: "rgba(100, 221, 23, 0.15)",
  },
  expandButton: {
    // padding: 4,
  },
  fieldInput: {
    borderWidth: 1,
    padding: 16,
    minHeight: 60,
    textAlignVertical: "top",
    fontSize: 16,
    lineHeight: 24,
  },
  instructionContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(100, 221, 23, 0.2)",
    backgroundColor: "rgba(100, 221, 23, 0.05)",
  },
  instructionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  instructionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    color: "#64dd17",
  },
  instructionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
    fontSize: 15,
    lineHeight: 22,
  },
  instructionNoteContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 0,
    paddingTop: 8,
  },
  instructionNoteIcon: {
    marginTop: 3,
    marginRight: 0,
    opacity: 0.8,
  },
  instructionNote: {
    fontSize: 13,
    fontStyle: "italic",
    opacity: 0.7,
    marginLeft: 6,
    flex: 1,
  },
  generateButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  generateButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  generateButtonDisabled: {
    backgroundColor: "rgba(0, 122, 255, 0.5)",
  },
  generateButtonPressed: {
    backgroundColor: "#0056b3",
  },
  generateButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
  generatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  generatingText: {
    color: "white",
    marginLeft: 8,
    fontWeight: "500",
  },
  headerSaveButton: {
    padding: 8,
    marginRight: 0,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  headerButton: {
    marginRight: -10,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  // --- FAB Save Button styles ---
  fabSaveButton: {
    position: "absolute",
    left: 24,
    bottom: 25,
    backgroundColor: "#34C759",
    borderRadius: 32,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 100,
  },
  fabSaveButtonPressed: {
    backgroundColor: "#249944",
  },
});
