import React from "react";
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { X } from "lucide-react-native";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  return (
    <RNModal
      visible={open}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.innerContent}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#effcf6", // brand-50 / brand-100 equivalent border
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0d463a", // brand-900
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  content: {
    flex: 1,
  },
  innerContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});
