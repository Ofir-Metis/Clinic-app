/**
 * Hebrew locale text for MUI X Date Pickers
 * Full Hebrew translations for all picker components
 */
import { PickersLocaleText } from '@mui/x-date-pickers/locales';

export const hebrewPickersLocaleText: Partial<PickersLocaleText<Date>> = {
  // Calendar navigation
  previousMonth: 'חודש קודם',
  nextMonth: 'חודש הבא',

  // View switching
  openPreviousView: 'פתח תצוגה קודמת',
  openNextView: 'פתח תצוגה הבאה',
  calendarViewSwitchingButtonAriaLabel: (view: string) =>
    view === 'year'
      ? 'תצוגת שנה פתוחה, עבור לתצוגת לוח שנה'
      : 'תצוגת לוח שנה פתוחה, עבור לתצוגת שנה',

  // DateRange labels
  start: 'התחלה',
  end: 'סיום',
  startDate: 'תאריך התחלה',
  startTime: 'שעת התחלה',
  endDate: 'תאריך סיום',
  endTime: 'שעת סיום',

  // Action bar
  cancelButtonLabel: 'ביטול',
  clearButtonLabel: 'ניקוי',
  okButtonLabel: 'אישור',
  todayButtonLabel: 'היום',

  // Toolbar titles
  datePickerToolbarTitle: 'בחירת תאריך',
  dateTimePickerToolbarTitle: 'בחירת תאריך ושעה',
  timePickerToolbarTitle: 'בחירת שעה',
  dateRangePickerToolbarTitle: 'בחירת טווח תאריכים',

  // Clock labels
  clockLabelText: (view: string) =>
    `בחר ${view === 'hours' ? 'שעות' : 'דקות'}`,
  hoursClockNumberText: (hours: string) => `${hours} שעות`,
  minutesClockNumberText: (minutes: string) => `${minutes} דקות`,
  secondsClockNumberText: (seconds: string) => `${seconds} שניות`,

  // Digital clock labels
  selectViewText: (view: string) => `בחר ${view === 'hours' ? 'שעות' : view === 'minutes' ? 'דקות' : 'שניות'}`,

  // Calendar labels
  calendarWeekNumberHeaderLabel: 'מספר שבוע',
  calendarWeekNumberHeaderText: '#',
  calendarWeekNumberAriaLabelText: (weekNumber: number) => `שבוע ${weekNumber}`,
  calendarWeekNumberText: (weekNumber: number) => `${weekNumber}`,

  // Open picker labels
  openDatePickerDialogue: () => 'בחר תאריך',
  openTimePickerDialogue: () => 'בחר שעה',

  // Field section placeholders
  fieldYearPlaceholder: (params: { digitAmount: number }) => 'ש'.repeat(params.digitAmount),
  fieldMonthPlaceholder: (params: { contentType: string }) => (params.contentType === 'letter' ? 'חחחח' : 'חח'),
  fieldDayPlaceholder: () => 'יי',
  fieldWeekDayPlaceholder: (params: { contentType: string }) => (params.contentType === 'letter' ? 'יייי' : 'יי'),
  fieldHoursPlaceholder: () => 'שש',
  fieldMinutesPlaceholder: () => 'דד',
  fieldSecondsPlaceholder: () => 'שנ',
  fieldMeridiemPlaceholder: () => 'בב/אא',

  // Table labels
  year: 'שנה',
  month: 'חודש',
  day: 'יום',
  weekDay: 'יום בשבוע',
  hours: 'שעות',
  minutes: 'דקות',
  seconds: 'שניות',
  meridiem: 'לפנה״צ/אחה״צ',

  // Common labels
  empty: 'ריק',
};

/**
 * Hebrew day names (short)
 */
export const hebrewDayNames = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

/**
 * Hebrew month names
 */
export const hebrewMonthNames = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
];
