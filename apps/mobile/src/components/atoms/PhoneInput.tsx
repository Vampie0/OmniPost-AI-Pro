import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { ChevronDown, Search, X, Check } from 'lucide-react-native';

export interface CountryItem {
  name: string;
  code: string;
  flag: string;
}

const COUNTRIES: CountryItem[] = [
  { name: 'Pakistan', code: '+92', flag: '🇵🇰' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'Turkey', code: '+90', flag: '🇹🇷' },
  { name: 'Qatar', code: '+974', flag: '🇶🇦' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬' },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾' },
];

interface PhoneInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  selectedCountry?: CountryItem;
  onSelectCountry?: (country: CountryItem) => void;
  error?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label = 'Phone Number',
  value,
  onChangeText,
  selectedCountry = COUNTRIES[0],
  onSelectCountry,
  error,
}) => {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [currentCountry, setCurrentCountry] = useState<CountryItem>(selectedCountry);

  const handlePickCountry = (item: CountryItem) => {
    setCurrentCountry(item);
    onSelectCountry?.(item);
    setModalVisible(false);
    setSearch('');
  };

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search)
  );

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.colors.inputBg,
            borderColor: error ? '#F43F5E' : theme.colors.border,
          },
        ]}
      >
        {/* Country Picker Trigger */}
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
          style={[styles.countryTrigger, { borderRightColor: theme.colors.border }]}
        >
          <Text style={styles.flagText}>{currentCountry.flag}</Text>
          <Text style={[styles.codeText, { color: theme.colors.textPrimary }]}>
            {currentCountry.code}
          </Text>
          <ChevronDown size={14} color={theme.colors.textMuted} />
        </TouchableOpacity>

        {/* Number Input Field */}
        <TextInput
          placeholder="300 1234567"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="phone-pad"
          value={value}
          onChangeText={onChangeText}
          style={[styles.input, { color: theme.colors.textPrimary }]}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Country Selection Modal with statusBarTranslucent for Android */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                Select Country Code
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search Box */}
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: theme.colors.surfaceSubtle,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Search size={16} color={theme.colors.textMuted} />
              <TextInput
                placeholder="Search country or dialing code..."
                placeholderTextColor={theme.colors.textMuted}
                value={search}
                onChangeText={setSearch}
                style={[styles.searchInput, { color: theme.colors.textPrimary }]}
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.countryList}>
              {filteredCountries.map((item, index) => {
                const isSelected = currentCountry.code === item.code && currentCountry.name === item.name;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handlePickCountry(item)}
                    activeOpacity={0.7}
                    style={[
                      styles.countryItem,
                      {
                        backgroundColor: isSelected ? theme.colors.surfaceSubtle : 'transparent',
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  >
                    <Text style={styles.itemFlag}>{item.flag}</Text>
                    <Text style={[styles.itemName, { color: theme.colors.textPrimary }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemCode, { color: theme.colors.primary }]}>
                      {item.code}
                    </Text>
                    {isSelected && <Check size={16} color={theme.colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 7,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.2,
    height: 54,
    overflow: 'hidden',
  },
  countryTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
    borderRightWidth: 1,
    gap: 6,
  },
  flagText: {
    fontSize: 18,
  },
  codeText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
    paddingHorizontal: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#F43F5E',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 22,
    maxHeight: '80%',
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  closeBtn: {
    padding: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    height: '100%',
  },
  countryList: {
    gap: 6,
    paddingBottom: 20,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  itemFlag: {
    fontSize: 20,
  },
  itemName: {
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
  },
  itemCode: {
    fontSize: 13,
    fontWeight: '800',
  },
});
