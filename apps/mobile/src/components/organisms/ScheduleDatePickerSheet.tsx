import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { AnimatedButton, Badge } from '@/components/atoms';
import {
  Calendar as CalendarIcon,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';

interface ScheduleDatePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirmSchedule: (formattedDateTime: string) => void;
}

const HOURS = ['08:00 AM', '10:00 AM', '12:30 PM', '02:30 PM', '05:00 PM', '07:30 PM', '09:00 PM', '11:00 PM'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const ScheduleDatePickerSheet: React.FC<ScheduleDatePickerSheetProps> = ({
  visible,
  onClose,
  onConfirmSchedule,
}) => {
  const { theme } = useTheme();

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [selectedTime, setSelectedTime] = useState(HOURS[1]);

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(selectedYear, selectedMonth, 1).getDay();

  const isCurrentMonth =
    selectedYear === today.getFullYear() && selectedMonth === today.getMonth();

  const handlePrevMonth = () => {
    if (isCurrentMonth) return; // Block past months
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleConfirm = () => {
    const formatted = `${MONTHS[selectedMonth]} ${selectedDay}, ${selectedYear} at ${selectedTime}`;
    onConfirmSchedule(formatted);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerTitleGroup}>
              <View style={[styles.iconBox, { backgroundColor: theme.colors.badgeBg }]}>
                <CalendarIcon size={18} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={[styles.sheetTitle, { color: theme.colors.textPrimary }]}>
                  Pick Date & Publishing Time
                </Text>
                <Text style={[styles.sheetSubtitle, { color: theme.colors.textSecondary }]}>
                  Schedule for any day of the month
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* 1. Month Navigator */}
            <View style={[styles.monthNavRow, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}>
              <TouchableOpacity onPress={handlePrevMonth} disabled={isCurrentMonth} style={[styles.navArrowBtn, isCurrentMonth && { opacity: 0.2 }]}>
                <ChevronLeft size={18} color={theme.colors.textPrimary} />
              </TouchableOpacity>

              <Text style={[styles.monthNavTitle, { color: theme.colors.textPrimary }]}>
                {MONTHS[selectedMonth]} {selectedYear}
              </Text>

              <TouchableOpacity onPress={handleNextMonth} style={styles.navArrowBtn}>
                <ChevronRight size={18} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* 2. Weekday Header Labels */}
            <View style={styles.weekdaysRow}>
              {WEEKDAYS.map((day, idx) => (
                <Text key={idx} style={[styles.weekdayText, { color: theme.colors.textMuted }]}>
                  {day}
                </Text>
              ))}
            </View>

            {/* 3. Monthly Days Grid */}
            <View style={styles.daysGrid}>
              {Array.from({ length: firstDayWeekday }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.emptyDayCell} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNumber = i + 1;
                const isPastDay =
                  selectedYear === today.getFullYear() &&
                  selectedMonth === today.getMonth() &&
                  dayNumber < today.getDate();
                const isSelected = selectedDay === dayNumber;
                return (
                  <TouchableOpacity
                    key={dayNumber}
                    disabled={isPastDay}
                    onPress={() => setSelectedDay(dayNumber)}
                    activeOpacity={0.7}
                    style={[
                      styles.dayCell,
                      {
                        backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                        borderColor: isSelected ? theme.colors.primary : 'transparent',
                        opacity: isPastDay ? 0.2 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        {
                          color: isSelected ? theme.colors.btnTextColor : theme.colors.textPrimary,
                          fontWeight: isSelected ? '900' : '600',
                        },
                      ]}
                    >
                      {dayNumber}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 4. Publishing Time Hours Selector */}
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
              Select Publishing Hour
            </Text>

            <View style={styles.hoursGrid}>
              {HOURS.map((hour) => {
                const isSelected = selectedTime === hour;
                return (
                  <TouchableOpacity
                    key={hour}
                    onPress={() => setSelectedTime(hour)}
                    style={[
                      styles.hourTile,
                      {
                        backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceSubtle,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  >
                    <Clock size={12} color={isSelected ? theme.colors.btnTextColor : theme.colors.primary} />
                    <Text
                      style={[
                        styles.hourText,
                        {
                          color: isSelected ? theme.colors.btnTextColor : theme.colors.textPrimary,
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                    >
                      {hour}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 5. Selection Preview Banner */}
            <View style={[styles.previewBanner, { backgroundColor: theme.colors.badgeBg, borderColor: theme.colors.badgeBorder }]}>
              <Sparkles size={16} color={theme.colors.badgeText} />
              <Text style={[styles.previewText, { color: theme.colors.badgeText }]}>
                Selected: {MONTHS[selectedMonth]} {selectedDay}, {selectedYear} at {selectedTime}
              </Text>
            </View>

            {/* 6. Confirm Button */}
            <AnimatedButton
              title="Confirm Schedule Slot"
              onPress={handleConfirm}
              size="lg"
              style={styles.confirmBtn}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 20,
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    gap: 12,
    paddingBottom: 24,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  navArrowBtn: {
    padding: 4,
  },
  monthNavTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '800',
    width: 38,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 6,
    paddingHorizontal: 2,
  },
  emptyDayCell: {
    width: 38,
    height: 38,
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberText: {
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hourTile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  hourText: {
    fontSize: 11.5,
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
  },
  previewText: {
    fontSize: 12.5,
    fontWeight: '800',
    flex: 1,
  },
  confirmBtn: {
    marginTop: 6,
  },
});
