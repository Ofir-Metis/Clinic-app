/**
 * Hebrew translations - Clear, professional, and user-friendly
 * Designed for coaches and wellness practitioners
 */

export const he = {
  // App Name


  // Navigation & Layout (RTL friendly)
  nav: {
    dashboard: "לוח בקרה",
    calendar: "יומן",
    appointments: "פגישות",
    patients: "לקוחות",
    notifications: "התראות",
    tools: "כלים",
    settings: "הגדרות",
    profile: "פרופיל",
    logout: "התנתקות",
    more: "עוד",
    admin: "לוח בקרה מנהל",
    clientPortal: "מסע הלקוח",
    mySessions: "הפגישות שלי",
    bookSession: "קביעת פגישה",
    myGoals: "המטרות שלי",
    myProgress: "ההתקדמות שלי",
    achievements: "הישגים",
    discoverCoaches: "גלו מאמנים",
  },

  // View Switching
  viewSwitching: {
    switchView: "החלפת תצוגה",
    clientView: "תצוגת לקוח",
    viewingAsClient: "צופה כלקוח",
    impersonating: "התחזות",
    currentlyInClientView: "כרגע בתצוגת לקוח",
    viewingAs: "צופה כ:",
    returnToCoachView: "חזרה לתצוגת מאמן",
    exitClientViewMode: "יציאה ממצב תצוגת לקוח",
    switchToClientView: "מעבר לתצוגת לקוח",
    switchDescription: "צפייה באפליקציה מנקודת המבט של הלקוח",
    loadingClients: "טוען לקוחות...",
    noClientsAvailable: "אין לקוחות זמינים",
    noClientsAssigned: "אין לקוחות משויכים להחלפת תצוגה",
    lastActive: "פעילות אחרונה:",
  },

  // Common Actions
  actions: {
    save: "שמירה",
    cancel: "ביטול",
    delete: "מחיקה",
    edit: "עריכה",
    create: "יצירה",
    update: "עדכון",
    confirm: "אישור",
    back: "חזרה",
    next: "הבא",
    previous: "הקודם",
    submit: "שליחה",
    reset: "איפוס",
    search: "חיפוש",
    filter: "סינון",
    sort: "מיון",
    refresh: "רענון",
    download: "הורדה",
    upload: "העלאה",
    share: "שיתוף",
    copy: "העתקה"
  },

  // Common Terms
  common: {
    new: "חדש",
    edit: "עריכה",
    details: "פרטים",
    home: "בית",
    cancel: "ביטול",
    save: "שמירה",
    saving: "שומר...",
    delete: "מחיקה",
    close: "סגירה",
    tryAgain: "נסה שוב",
    discard: "ביטול השינויים"
  },

  // Status Messages
  status: {
    loading: "טוען...",
    saving: "שומר...",
    saved: "נשמר בהצלחה",
    error: "אירעה שגיאה",
    success: "הפעולה הושלמה בהצלחה",
    warning: "שימו לב",
    info: "מידע",
    empty: "אין נתונים להצגה",
    notFound: "הדף לא נמצא",
    unauthorized: "אין הרשאה לצפייה בתוכן זה",
    offline: "אין חיבור לאינטרנט"
  },

  // Network Status - סטטוס רשת
  network: {
    offline: "אתם כרגע לא מחוברים לאינטרנט. חלק מהתכונות עשויות לא לעבוד.",
    backOnline: "חזרתם לאונליין! 🌟"
  },

  // Authentication
  auth: {
    login: {
      title: "התחברות",
      subtitle: "ברוכים הבאים למערכת",
      email: "כתובת אימייל",
      password: "סיסמה",
      loginButton: "התחברות",
      forgotPassword: "שכחתי סיסמה",
      noAccount: "אין לכם חשבון?",
      signUp: "הרשמה",
      rememberMe: "זכור אותי",
      or: "או",
      errors: {
        invalidCredentials: "אימייל או סיסמה שגויים",
        required: "שדה חובה",
        emailFormat: "כתובת אימייל לא תקינה"
      }
    },
    register: {
      title: "יצירת חשבון",
      subtitle: "הצטרפו למערכת האימון שלנו",
      pageTitle: "הרשמה",
      pageDescription: "הצטרפו לפלטפורמת אימון הבריאות שלנו. צרו חשבון כדי להתחיל את המסע שלכם לצמיחה אישית והתמרה.",
      pageKeywords: "הרשמה, הצטרפות, אימון בריאות, פלטפורמת אימון, מאמן בריאות, מאמן חיים, צמיחה אישית",
      fullName: "שם מלא",
      firstName: "שם פרטי",
      lastName: "שם משפחה",
      email: "כתובת אימייל",
      password: "סיסמה (לפחות 8 תווים)",
      confirmPassword: "אימות סיסמה",
      registerButton: "הרשמה",
      submitButton: "יצירת חשבון",
      hasAccount: "יש לכם כבר חשבון?",
      signIn: "התחברות",
      terms: "אני מסכים לתנאי השימוש",
      or: "או",
      therapist: "מאמן",
      patient: "לקוח",
      errors: {
        required: "שדה חובה",
        emailFormat: "כתובת אימייל לא תקינה",
        passwordRequirements: "הסיסמה חייבת להכיל לפחות 8 תווים",
        confirmPassword: "הסיסמאות אינן תואמות"
      }
    },
    resetPassword: {
      title: "איפוס סיסמה",
      subtitle: "נשלח לכם קישור לאיפוס הסיסמה",
      email: "כתובת אימייל",
      sendButton: "שליחת קישור איפוס",
      backToLogin: "חזרה להתחברות",
      success: "קישור לאיפוס נשלח לאימייל שלכם"
    },
    resetConfirm: {
      title: "יצירת סיסמה חדשה",
      subtitle: "בחרו סיסמה חזקה לאבטחת החשבון שלכם.",
      successTitle: "הסיסמה אופסה!",
      successMessage: "הסיסמה שלכם אופסה בהצלחה. מעבירים להתחברות...",
      newPassword: "סיסמה חדשה",
      confirmNewPassword: "אישור סיסמה חדשה",
      passwordStrength: "חוזק הסיסמה",
      submitButton: "איפוס סיסמה"
    }
  },

  // App-level translations
  appName: "🌿 מרפאת בריאות",
  appDescription: "פלטפורמה מקצועית לבריאות הנפש והתפתחות אישית",

  // Dashboard
  dashboard: {
    title: "לוח בקרה",
    subtitle: "סקירה כללית של הפעילות שלכם",
    welcome: "שלום",
    journeySubtitle: "הנה סיכום הפעילות שלכם",
    loading: "טוען נתונים...",
    quickStats: "נתונים מהירים",
    recentActivity: "פעילות אחרונה",
    upcomingEvents: "אירועים קרובים",
    selectedDate: "תאריך נבחר",
    todaysSchedule: "לוח הזמנים להיום",
    quickActions: "פעולות מהירות",
    noAppointments: "אין פגישות מתוכננות להיום",
    selfCareTime: "זמן פנוי לתכנון או מנוחה",
    addButton: "הוספה",
    joinButton: "הצטרפות",
    duration: "משך: 50 דקות",
    appointments: "פגישות",
    sessions: "מפגשים",
    calendar: "יומן",
    thisWeek: "השבוע",
    activeClients: "לקוחות פעילים",
    totalToday: "סה״כ היום",
    today: "היום",
    total: "סה״כ",
    navigation: {
      clients: "לקוחות",
      calendar: "יומן",
      aiTools: "כלי AI"
    },
    goals: {
      title: "מטרות",
      active: "פעילות",
      completed: "הושלמו",
      progress: "התקדמות"
    },
    wellness: {
      title: "מפגשים",
      thisWeek: "השבוע",
      nextSession: "המפגש הבא",
      totalHours: "סה״כ שעות"
    },
    insights: {
      title: "תובנות",
      streak: "רצף פעילות",
      mood: "מצב רוח ממוצע",
      confidence: "רמת ביטחון"
    }
  },

  // Settings Page
  settings: {
    title: "הגדרות",
    subtitle: "ניהול החשבון וההעדפות שלכם",
    sections: {
      profile: {
        title: "פרופיל",
        description: "עדכון הפרטים האישיים שלכם"
      },
      preferences: {
        title: "העדפות",
        description: "התאמה אישית של המערכת"
      },
      google: {
        title: "שילוב Google",
        description: "חיבור יומן Google, Meet ו-Gmail"
      },
      notifications: {
        title: "התראות",
        description: "ניהול הודעות והתראות"
      },
      privacy: {
        title: "פרטיות ואבטחה",
        description: "הגדרות אבטחה ופרטיות"
      },
      language: {
        title: "שפה",
        description: "בחירת שפת הממשק"
      },
      theme: {
        title: "מראה",
        description: "התאמת עיצוב המערכת"
      }
    },
    language: {
      title: "בחירת שפה",
      description: "בחרו את השפה המועדפת עליכם",
      current: "שפה נוכחית",
      available: "שפות זמינות",
      changeSuccess: "השפה עודכנה בהצלחה"
    },
    theme: {
      title: "מראה",
      light: "בהיר",
      dark: "כהה",
      auto: "אוטומטי"
    },
    profile: {
      information: "פרטים אישיים",
      informationDescription: "פרטי הקשר הבסיסיים והמקצועיים שלכם",
      fullName: "שם מלא",
      fullNameHelper: "שמכם המקצועי המלא כפי שמופיע בתעודות",
      email: "כתובת אימייל",
      emailHelper: "משמש להתחברות והתראות חשובות",
      phone: "טלפון",
      phonePlaceholder: "+972 (50) 123-4567",
      phoneHelper: "ליצירת קשר עם לקוחות ותזכורות לפגישות",
      professionalTitle: "תואר מקצועי",
      professionalTitlePlaceholder: "לדוגמה: מאמן חיים, מומחה לפיתוח אישי",
      professionalTitleHelper: "התואר המקצועי או ההסמכה שלכם",
      specialization: "תחום התמחות",
      specializationPlaceholder: "לדוגמה: אימון קריירה, מיינדפולנס, השגת מטרות",
      specializationHelper: "תחומי המומחיות שלכם באימון",
      location: "מיקום",
      locationPlaceholder: "עיר, מדינה",
      locationHelper: "מיקום הפרקטיקה שלכם (עיר ומדינה)",
      bioSection: "אודות",
      bioSectionDescription: "ספרו ללקוחות על הגישה והניסיון שלכם",
      professionalBio: "תיאור מקצועי",
      bioPlaceholder: "ספרו על עצמכם והגישה המקצועית שלכם...",
      bioCharCount: "{count}/500 תווים - שתפו את פילוסופיית האימון והניסיון שלכם",
      professionalDetails: "פרטים מקצועיים",
      professionalDetailsDescription: "מידע על תחום האימון וההתמחות שלכם"
    },
    preferences: {
      heading: "העדפות יישום",
      sessionDefaults: "ברירות מחדל למפגשים",
      defaultDuration: "משך מפגש ברירת מחדל",
      duration30: "30 דקות",
      duration45: "45 דקות",
      duration60: "60 דקות",
      duration90: "90 דקות",
      defaultMeetingType: "סוג מפגש ברירת מחדל",
      meetingOnline: "מפגש מקוון",
      meetingInPerson: "מפגש פרונטלי",
      meetingHybrid: "משולב (בחירת הלקוח)",
      autoSummaries: "יצירת סיכומי מפגש אוטומטית",
      sendReminders: "שליחת תזכורת 24 שעות לפני המפגש",
      interfaceOptions: "אפשרויות ממשק",
      dashboardView: "תצוגת לוח בקרה",
      viewCards: "תצוגת כרטיסים",
      viewList: "תצוגת רשימה",
      viewCalendar: "תצוגת יומן",
      showQuotes: "הצגת ציטוטים מעוררי השראה",
      enableAnimations: "הפעלת אנימציות חגיגה",
      compactMenu: "תפריט ניווט קומפקטי"
    },
    notifications: {
      heading: "העדפות התראות",
      email: "התראות באימייל",
      push: "התראות דחיפה",
      sms: "התראות SMS",
      coaching: "תזכורות למפגשים",
      goals: "עדכוני מטרות",
      milestones: "התראות על הישגים"
    },
    privacy: {
      comingSoon: "הגדרות פרטיות ואבטחה בקרוב!",
      comingSoonDescription: "אנחנו מכינים בקרות פרטיות מתקדמות לפרקטיקה שלכם!"
    },
    unsavedChanges: {
      title: "יש לכם שינויים שלא נשמרו",
      description: "שמרו את השינויים או בטלו אותם כדי להמשיך",
      discard: "ביטול שינויים"
    },
    errors: {
      pleaseFixErrors: "נא לתקן את השגיאות לפני השמירה"
    }
  },

  // Billing & Payments
  billing: {
    title: "חיוב ותשלומים",
    subtitle: "ניהול תשלומי לקוחות, תמחור וחשבוניות בהתאם לתקנות מע\"מ בישראל",
    tabs: {
      payments: "תשלומים",
      pricing: "כללי תמחור",
      invoices: "חשבוניות",
      reports: "דוחות"
    },
    metrics: {
      totalRevenue: "סה\"כ הכנסות",
      pendingPayments: "תשלומים ממתינים",
      thisMonth: "החודש",
      avgSessionPrice: "מחיר פגישה ממוצע",
      activeClients: "לקוחות פעילים"
    },
    payments: {
      title: "תשלומי לקוחות",
      createPayment: "יצירת בקשת תשלום",
      client: "לקוח",
      amount: "סכום",
      type: "סוג",
      status: "סטטוס",
      date: "תאריך",
      receipt: "קבלה",
      actions: "פעולות",
      vatIncluded: "כולל מע\"מ",
      pending: "ממתין",
      viewDetails: "צפה בפרטים",
      sendPaymentLink: "שלח קישור תשלום",
      downloadReceipt: "הורד קבלה"
    },
    paymentTypes: {
      session: "פגישה בודדת",
      package: "חבילת פגישות",
      subscription: "מנוי חודשי"
    },
    pricing: {
      title: "כללי תמחור",
      addCustomPricing: "הוסף תמחור מותאם",
      defaultPricing: "תמחור ברירת מחדל",
      sessionPrice: "מחיר פגישה",
      package4: "חבילת 4 פגישות",
      package8: "חבילת 8 פגישות",
      package12: "חבילת 12 פגישות",
      monthlySubscription: "מנוי חודשי",
      discount: "הנחה",
      none: "אין",
      editPricing: "ערוך תמחור",
      removeCustomPricing: "הסר תמחור מותאם",
      perSession: "/פגישה"
    },
    dialogs: {
      createPayment: {
        title: "יצירת בקשת תשלום",
        clientLabel: "לקוח",
        paymentTypeLabel: "סוג תשלום",
        amountLabel: "סכום (ש\"ח)",
        descriptionLabel: "תיאור",
        descriptionPlaceholder: "לדוגמה: מפגש אימון - 2 בפברואר 2025",
        cancel: "ביטול",
        create: "צור בקשת תשלום"
      },
      editPricing: {
        titleEdit: "עריכת כלל תמחור",
        titleCreate: "יצירת תמחור מותאם",
        clientOptional: "לקוח (אופציונלי)",
        defaultForAll: "ברירת מחדל לכל הלקוחות",
        sessionPriceLabel: "מחיר פגישה (ש\"ח)",
        package4Label: "חבילת 4 פגישות (ש\"ח)",
        package8Label: "חבילת 8 פגישות (ש\"ח)",
        monthlySubLabel: "מנוי חודשי (ש\"ח)",
        discountLabel: "אחוז הנחה",
        cancel: "ביטול",
        update: "עדכן תמחור",
        createRule: "צור כלל תמחור"
      }
    },
    comingSoon: {
      invoices: "ניהול חשבוניות - בקרוב",
      reports: "דוחות כספיים - בקרוב"
    },
    addPayment: "הוסף תשלום"
  },

  // Appointments/Sessions
  appointments: {
    title: "פגישות",
    upcoming: "פגישות קרובות",
    past: "פגישות קודמות",
    schedule: "קביעת פגישה",
    reschedule: "שינוי מועד",
    cancel: "ביטול פגישה",
    confirm: "אישור פגישה",
    sessionTypes: {
      initial: "פגישת היכרות",
      followUp: "פגישת המשך",
      breakthrough: "מפגש אינטנסיבי",
      maintenance: "פגישת תחזוקה",
      emergency: "פגישה דחופה"
    },
    meetingTypes: {
      inPerson: "פגישה פרונטלית",
      online: "פגישה מקוונת",
      hybrid: "משולב"
    },
    status: {
      scheduled: "מתוכננת",
      confirmed: "מאושרת",
      completed: "הושלמה",
      cancelled: "בוטלה",
      rescheduled: "נדחתה"
    }
  },

  // Goals & Progress
  goals: {
    title: "מטרות",
    create: "יצירת מטרה חדשה",
    edit: "עריכת מטרה",
    delete: "מחיקת מטרה",
    complete: "סימון כהושלם",
    progress: "התקדמות",
    milestone: "אבן דרך",
    categories: {
      health: "בריאות וכושר",
      career: "קריירה",
      relationships: "יחסים",
      personal: "התפתחות אישית",
      financial: "כלכלה",
      spiritual: "רוחניות",
      creative: "יצירתיות",
      learning: "למידה"
    },
    status: {
      active: "פעילה",
      paused: "מושהית",
      completed: "הושלמה",
      archived: "בארכיון"
    },
    // Client Goals Interface
    client: {
      title: "מטרות הפיתוח האישי שלכם 🎯",
      subtitle: "עקבו אחר מסע הצמיחה שלכם עם מטרות SMART וחגיגות אבני דרך",
      tabs: {
        all: "כל המטרות",
        active: "פעילות",
        inProgress: "בתהליך",
        completed: "הושלמו"
      },
      stats: {
        total: "סה״כ מטרות",
        inProgress: "בתהליך",
        completed: "הושלמו",
        avgProgress: "התקדמות ממוצעת",
        shared: "מטרות משותפות"
      },
      create: {
        title: "יצירת מטרה חדשה 🎯",
        subtitle: "הגדירו מטרת פיתוח אישי חדשה",
        steps: ["פרטי המטרה", "אבני דרך", "שיתוף והערות"],
        goalTitle: "כותרת המטרה",
        goalPlaceholder: "מה תרצו להשיג?",
        description: "תיאור",
        descriptionPlaceholder: "תארו את המטרה שלכם בפירוט...",
        category: "קטגוריה",
        priority: "עדיפות",
        targetDate: "תאריך יעד",
        smartCriteria: "קריטריוני מטרת SMART ✓",
        milestones: "אבני דרך",
        milestonesTitle: "חלקו את המטרה לאבני דרך",
        milestonesSubtitle: "אבני דרך עוזרות לכם לעקוב אחר התקדמות ולשמור על מוטיבציה. הוסיפו 2-5 נקודות ביקורת מרכזיות.",
        milestoneTitle: "כותרת אבן דרך",
        addMilestone: "הוספת אבן דרך",
        collaborationTitle: "שיתוף פעולה והערות",
        shareWithCoaches: "שתפו מטרה זו עם המאמנים שלכם להדרכה ואחריות",
        selectCoaches: "בחרו מאמנים לשיתוף המטרה:",
        additionalNotes: "הערות נוספות",
        notesPlaceholder: "כל מחשבות, הקשר או תזכורות נוספות על המטרה...",
        createGoal: "יצירת מטרה",
        updateGoal: "עדכון מטרה",
        sharing: "שיתוף עם מאמנים",
        notes: "הערות אישיות"
      },
      categories: {
        personal: "צמיחה אישית",
        career: "קריירה ועסקים",
        health: "בריאות וכושר",
        relationships: "יחסים",
        finance: "צמיחה כלכלית",
        learning: "למידה וכישורים",
        lifestyle: "עיצוב אורח חיים",
        mindset: "מחשבה ובריאות נפשית",
        social: "חברתי וקהילה",
        adventure: "הרפתקה וחוויות"
      },
      priorities: {
        low: "נמוכה",
        medium: "בינונית",
        high: "גבוהה",
        critical: "קריטית"
      },
      empty: {
        title: "לא נמצאו מטרות",
        subtitle: "התחילו את מסע הפיתוח האישי שלכם על ידי יצירת המטרה הראשונה!",
        button: "יצרו את המטרה הראשונה"
      },
      labels: {
        progress: "התקדמות",
        milestones: "אבני דרך",
        moreMilestones: "אבני דרך נוספות",
        due: "תאריך יעד",
        sharedWith: "משותף עם",
        coach: "מאמן",
        coaches: "מאמנים"
      },
      details: {
        description: "תיאור",
        target: "תאריך יעד",
        progressHistory: "היסטוריית התקדמות",
        notes: "הערות",
        tags: "תגיות",
        achievements: "הישגים",
        noProgressUpdates: "אין עדכוני התקדמות עדיין. לחצו על \"עדכון התקדמות\" לרישום הרשומה הראשונה."
      },
      actions: {
        share: "שיתוף",
        updateProgress: "עדכון התקדמות",
        complete: "סימון כהושלם"
      },
      updateProgress: {
        title: "עדכון התקדמות",
        percentage: "אחוז התקדמות",
        notes: "הערות התקדמות",
        notesPlaceholder: "איזו התקדמות עשיתם? אתגרים או הצלחות?",
        submit: "רישום התקדמות"
      }
    }
  },

  // Motivational Messages
  motivation: {
    streaks: {
      day1: "יום ראשון - התחלה מצוינת!",
      day3: "3 ימים ברצף - כל הכבוד!",
      day7: "שבוע שלם - מרשים!",
      day14: "שבועיים - אתם בדרך הנכונה!",
      day30: "חודש שלם - הישג משמעותי!",
      day100: "100 ימים - מדהים!"
    },
    progress: {
      start: "כל מסע מתחיל בצעד הראשון",
      quarter: "25% - התקדמות יפה!",
      half: "חצי הדרך - ממשיכים!",
      threeQuarter: "75% - כמעט שם!",
      almost: "עוד קצת וסיימתם!",
      complete: "הצלחתם! מטרה הושלמה!"
    },
    general: [
      "כל צעד קטן מוביל לשינוי גדול",
      "התקדמות חשובה יותר משלמות",
      "אתם בדרך הנכונה",
      "המאמץ שלכם משתלם",
      "שינוי אמיתי לוקח זמן",
      "אתם יכולים!"
    ]
  },

  // Error Messages
  errors: {
    general: "אירעה שגיאה, נסו שוב",
    network: "בעיית חיבור לאינטרנט",
    validation: "נא לתקן את השגיאות בטופס",
    permissions: "אין הרשאה לפעולה זו",
    notFound: "התוכן המבוקש לא נמצא",
    server: "שגיאת שרת, נסו שוב מאוחר יותר",
    timeout: "הבקשה נכשלה, נסו שוב"
  },

  // Time & Dates
  time: {
    now: "עכשיו",
    today: "היום",
    tomorrow: "מחר",
    yesterday: "אתמול",
    thisWeek: "השבוע",
    nextWeek: "שבוע הבא",
    thisMonth: "החודש",
    minutes: "דקות",
    hours: "שעות",
    days: "ימים",
    weeks: "שבועות",
    months: "חודשים"
  },

  // Placeholders
  placeholders: {
    search: "חיפוש...",
    email: "example@email.com",
    name: "השם שלכם",
    message: "כתבו הודעה...",
    goal: "תארו את המטרה שלכם",
    note: "הוסיפו הערה...",
    enterEmail: "הזינו את כתובת האימייל שלכם",
    enterPassword: "הזינו את הסיסמה שלכם",
    enterNewPassword: "הזינו את הסיסמה החדשה שלכם",
    confirmNewPassword: "אשרו את הסיסמה החדשה שלכם",
    specialization: "לדוגמה: אימון קריירה, מיינדפולנס, השגת מטרות"
  },

  // Common UI strings
  ui: {
    authenticating: "מאמת...",
    signingIn: "מתחבר...",
    welcomeBack: "ברוכים השבים! מעביר ללוח הבקרה...",
    welcomeAboard: "ברוכים הבאים! מכין את לוח הבקרה שלכם...",
    pleaseFixErrors: "נא לתקן את השגיאות לפני השמירה",
    languageSwitcher: "בחירת שפה",
    togglePasswordVisibility: "הצגת/הסתרת סיסמה"
  },

  // Empty State messages
  emptyState: {
    appointments: {
      title: "אין פגישות מתוכננות",
      message: "התחילו בקביעת מפגש האימון הראשון שלכם. לחצו למטה להוספת פגישה חדשה.",
      action: "קביעת פגישה"
    },
    patients: {
      title: "לא נמצאו לקוחות",
      message: "התחילו לבנות את בסיס הלקוחות שלכם. הוסיפו את הלקוח הראשון להתחלת מסע ההעצמה.",
      action: "הוספת לקוח"
    },
    notes: {
      title: "אין עדיין הערות למפגשים",
      message: "תעדו את מפגשי האימון שלכם כדי לעקוב אחר התקדמות הלקוחות ותובנות.",
      action: "יצירת הערה"
    },
    analytics: {
      title: "אין נתונים לניתוח",
      message: "ניתוחים יופיעו כאן ברגע שתתחילו לקיים מפגשי אימון ולעקוב אחר התקדמות.",
      action: "צפייה בהגדרות"
    },
    search: {
      title: "לא נמצאו תוצאות",
      message: "נסו להתאים את מונחי החיפוש או המסננים כדי למצוא את מה שאתם מחפשים.",
      action: "ניקוי מסננים"
    },
    notifications: {
      title: "הכל מעודכן!",
      message: "אין לכם התראות חדשות. נעדכן אתכם כשיקרה משהו חשוב.",
      action: "צפייה בהגדרות"
    },
    goals: {
      title: "עדיין לא הוגדרו מטרות",
      message: "עזרו ללקוחות שלכם להגשים את הפוטנציאל על ידי הגדרת מטרות משמעותיות וניתנות לביצוע.",
      action: "יצירת מטרה"
    },
    default: {
      title: "עדיין אין כאן כלום",
      message: "אזור זה יתמלא בתוכן ככל שתשתמשו בפלטפורמה.",
      action: "התחלה"
    }
  },

  // Admin Navigation
  admin: {
    apiManagement: "ניהול API",
    subscriptions: "מנויים",
    security: "אבטחה",
    configuration: "הגדרות מערכת",
    backups: "גיבויים",
  },

  // Admin Security Settings
  adminSecurity: {
    title: "ניהול אבטחה",
    tabs: {
      overview: "סקירה כללית",
      mfa: "אימות דו-שלבי",
      sessions: "מפגשים פעילים",
      events: "אירועי אבטחה",
      accessControl: "בקרת גישה",
      policies: "מדיניות"
    },
    overview: {
      mfaStatus: "סטטוס אימות דו-שלבי",
      activeSessions: "מפגשים פעילים",
      securityEvents: "אירועי אבטחה",
      complianceOverview: "סקירת תאימות",
      passwordPolicy: "מדיניות סיסמאות",
      mfaCompliance: "תאימות אימות דו-שלבי",
      sessionTimeout: "פקיעת מפגש",
      ofUsers: "מתוך {total} משתמשים",
      suspicious: "חשודים",
      criticalToday: "קריטיים היום"
    },
    mfa: {
      title: "אימות דו-שלבי",
      setupMfa: "הגדרת אימות דו-שלבי",
      users: "משתמשים",
      setupDialog: {
        title: "הגדרת אימות דו-שלבי",
        methodLabel: "שיטת אימות",
        totp: "TOTP (אפליקציית מאמת)",
        sms: "SMS",
        email: "אימייל",
        info: "פונקציונליות הגדרת אימות דו-שלבי תיושם עם אינטגרציית ספריית TOTP מתאימה."
      }
    },
    sessions: {
      title: "מפגשים פעילים",
      user: "משתמש",
      ipAddress: "כתובת IP",
      location: "מיקום",
      created: "נוצר",
      lastActivity: "פעילות אחרונה",
      actions: "פעולות"
    },
    events: {
      title: "אירועי אבטחה"
    },
    accessControl: {
      title: "בקרת גישה",
      allowedIps: "כתובות IP מורשות",
      blockedIps: "כתובות IP חסומות",
      manageIp: {
        title: "ניהול גישת IP",
        ipLabel: "כתובת IP או טווח",
        ipPlaceholder: "192.168.1.0/24",
        actionLabel: "פעולה",
        allow: "אישור",
        block: "חסימה",
        reasonLabel: "סיבה",
        reasonPlaceholder: "סיבה אופציונלית לכלל בקרת גישה זה",
        addRule: "הוספת כלל"
      }
    },
    policies: {
      title: "מדיניות אבטחה",
      info: "ניהול מדיניות אבטחה זמין במסוף הניהול המלא. הגדרות אלו שולטות בדרישות סיסמה, פקיעת מפגשים ובקרות גישה.",
      passwordPolicy: "מדיניות סיסמאות",
      requireUppercase: "דרישת אותיות גדולות",
      requireSpecial: "דרישת תווים מיוחדים",
      requireNumbers: "דרישת מספרים",
      sessionPolicy: "מדיניות מפגשים",
      requireMfaAdmin: "דרישת אימות דו-שלבי למנהלים",
      forceLogoutSuspicious: "התנתקות כפויה בפעילות חשודה",
      sessionTimeoutHours: "פקיעת מפגש (שעות)"
    },
    common: {
      cancel: "ביטול",
      setup: "הגדרה"
    }
  },

  // Admin Backup Management
  adminBackup: {
    title: "ניהול גיבויים",
    tabs: {
      overview: "סקירה כללית",
      backups: "גיבויים",
      schedules: "תזמונים",
      storage: "אחסון",
      disasterRecovery: "התאוששות מאסון",
      reports: "דוחות"
    },
    overview: {
      totalBackups: "סה״כ גיבויים",
      storageUsage: "שימוש באחסון",
      activeSchedules: "תזמונים פעילים",
      drPlans: "תוכניות התאוששות",
      recentActivity: "פעילות אחרונה"
    },
    labels: {
      compressed: "דחוס",
      encrypted: "מוצפן",
      backupType: "סוג גיבוי",
      description: "תיאור",
      descriptionPlaceholder: "תיאור אופציונלי לגיבוי זה",
      retentionDays: "ימי שמירה",
      enableCompression: "הפעלת דחיסה",
      enableEncryption: "הפעלת הצפנה",
      targetEnvironment: "סביבת יעד",
      database: "מסד נתונים",
      files: "קבצים",
      configuration: "תצורה",
      confirmationCode: "קוד אישור"
    }
  },

  // Admin Configuration Management
  adminConfig: {
    title: "ניהול תצורה",
    accessDenied: "גישה נדחתה. נדרשות הרשאות מנהל.",
    tabs: {
      overview: "סקירה כללית",
      configurations: "תצורות",
      environments: "סביבות",
      deployments: "הפצות",
      featureFlags: "דגלי תכונות",
      templates: "תבניות",
      history: "היסטוריה"
    },
    overview: {
      totalConfigurations: "סה״כ תצורות",
      acrossEnvironments: "ב-{count} סביבות",
      configurationHealth: "בריאות התצורה",
      issuesDetected: "{count} בעיות זוהו",
      activeDeployments: "הפצות פעילות",
      currentlyRunning: "כעת פועלות",
      featureFlags: "דגלי תכונות",
      configDrift: "סטייה בתצורה: {count}",
      environmentStatus: "סטטוס סביבות",
      configs: "תצורות",
      lastDeploy: "הפצה אחרונה:",
      recentChanges: "שינויים אחרונים"
    },
    configurations: {
      environment: "סביבה",
      production: "פרודקשן",
      staging: "סטייג׳ינג",
      development: "פיתוח",
      validateConfig: "אימות תצורה",
      addConfiguration: "הוספת תצורה",
      tableHeaders: {
        key: "מפתח",
        value: "ערך",
        type: "סוג",
        service: "שירות",
        category: "קטגוריה",
        lastModified: "שונה לאחרונה",
        actions: "פעולות"
      },
      secret: "סודי",
      global: "גלובלי",
      by: "על ידי"
    },
    environments: {
      title: "ניהול סביבות",
      createEnvironment: "יצירת סביבה",
      resources: "משאבים",
      cpu: "מעבד:",
      memory: "זיכרון:",
      replicas: "עותקים:",
      storage: "אחסון:",
      deploymentConfig: "הגדרות הפצה",
      autoDeploy: "הפצה אוטומטית",
      approvalRequired: "נדרש אישור",
      rollbackEnabled: "חזרה לאחור מופעלת",
      deploy: "הפצה",
      edit: "עריכה"
    },
    deployments: {
      title: "היסטוריית הפצות",
      newDeployment: "הפצה חדשה",
      tableHeaders: {
        environment: "סביבה",
        services: "שירותים",
        version: "גרסה",
        status: "סטטוס",
        initiatedBy: "הופעל על ידי",
        started: "התחלה",
        duration: "משך",
        actions: "פעולות"
      },
      more: "+{count} נוספים",
      running: "פועל"
    },
    featureFlags: {
      title: "דגלי תכונות",
      createFeatureFlag: "יצירת דגל תכונה",
      environments: "סביבות",
      rules: "כללים",
      rollout: "{percent}% פריסה",
      users: "משתמשי {segments}",
      edit: "עריכה",
      analytics: "ניתוח"
    },
    templates: {
      title: "תבניות תצורה",
      createTemplate: "יצירת תבנית",
      templateVariables: "משתני תבנית ({count})",
      apply: "החל",
      edit: "עריכה"
    },
    history: {
      title: "היסטוריית תצורה",
      infoMessage: "מעקב אחר היסטוריית תצורה מציג את כל השינויים שבוצעו בפריטי תצורה, כולל מי ביצע את השינוי, מתי ומה שונה.",
      recentChanges: "שינויי תצורה אחרונים",
      trackingDescription: "מעקב היסטוריה ולוגים יוצגו כאן, ויציגו:",
      keyChanges: "שינויים במפתחות תצורה",
      valueModifications: "שינויי ערכים עם השוואת לפני/אחרי",
      userAttribution: "זיהוי משתמש וחותמות זמן",
      deploymentCorrelation: "קישור להפצות",
      rollbackCapabilities: "יכולות חזרה לאחור"
    },
    createConfigDialog: {
      title: "הוספת פריט תצורה",
      configKey: "מפתח תצורה",
      configKeyPlaceholder: "לדוגמה: database.max_connections",
      type: "סוג",
      types: {
        string: "מחרוזת",
        number: "מספר",
        boolean: "בוליאני",
        json: "JSON",
        encrypted: "מוצפן"
      },
      value: "ערך",
      environment: "סביבה",
      service: "שירות",
      servicePlaceholder: "לדוגמה: api-gateway",
      description: "תיאור",
      descriptionPlaceholder: "תארו מה שולטת תצורה זו",
      secretValue: "זהו ערך סודי",
      cancel: "ביטול",
      createConfiguration: "יצירת תצורה"
    },
    deployDialog: {
      title: "הפצת תצורה",
      targetEnvironment: "סביבת יעד",
      servicesToDeploy: "שירותים להפצה",
      servicesToDeployPlaceholder: "השאירו ריק להפצת כל השירותים",
      versionTag: "תג גרסה",
      versionTagPlaceholder: "לדוגמה: v1.2.3",
      enableRollback: "אפשר תוכנית חזרה לאחור",
      deploymentNotes: "הערות הפצה",
      deploymentNotesPlaceholder: "הערות אופציונליות על הפצה זו",
      cancel: "ביטול",
      deploy: "הפצה"
    },
    errors: {
      loadFailed: "טעינת נתוני התצורה נכשלה"
    },
    labels: {
      configKey: "מפתח תצורה",
      configKeyPlaceholder: "לדוגמה: database.max_connections",
      service: "שירות",
      servicePlaceholder: "לדוגמה: api-gateway",
      configDescription: "תיאור",
      configDescriptionPlaceholder: "תארו מה שולטת תצורה זו",
      deployServices: "שירותים להפצה",
      deployServicesPlaceholder: "השאירו ריק להפצת כל השירותים",
      version: "גרסה",
      versionPlaceholder: "לדוגמה: v1.2.3",
      deploymentNotes: "הערות הפצה",
      deploymentNotesPlaceholder: "הערות אופציונליות על הפצה זו"
    }
  },

  // Admin API Management
  adminApi: {
    title: "ניהול API והגבלת קצב",
    accessDenied: "גישה נדחתה. נדרשות הרשאות מנהל.",
    tabs: {
      overview: "סקירה כללית",
      apiKeys: "מפתחות API",
      rateLimits: "הגבלות קצב",
      clients: "לקוחות",
      analytics: "אנליטיקס",
      security: "אבטחה"
    },
    overview: {
      apiKeys: "מפתחות API",
      totalKeys: "סה״כ מפתחות",
      activeClients: "לקוחות פעילים",
      totalClients: "סה״כ לקוחות",
      requestsToday: "בקשות היום",
      thisMonth: "החודש",
      systemHealth: "תקינות המערכת",
      avgResponse: "זמן תגובה ממוצע",
      rateLimitingStatus: "סטטוס הגבלת קצב",
      activeRules: "כללים פעילים",
      blockedToday: "נחסמו היום",
      blockRate: "שיעור חסימה",
      reqPerSec: "בקשות/שנייה",
      topClients: "לקוחות מובילים",
      requests: "בקשות",
      recentActivity: "פעילות אחרונה"
    },
    apiKeysTab: {
      title: "ניהול מפתחות API",
      createButton: "יצירת מפתח API",
      tableHeaders: {
        name: "שם",
        keyPreview: "תצוגת מפתח",
        client: "לקוח",
        usage: "שימוש",
        rateLimits: "הגבלות קצב",
        status: "סטטוס",
        actions: "פעולות"
      },
      created: "נוצר:",
      thisMonth: "החודש",
      lastUsed: "שימוש אחרון:",
      perMin: "/דקה",
      perDay: "/יום"
    },
    rateLimitsTab: {
      title: "כללי הגבלת קצב",
      createButton: "יצירת כלל",
      rateLimits: "הגבלות קצב",
      perSec: "/שנייה",
      perMin: "/דקה",
      perHour: "/שעה",
      burst: "פרץ:",
      priority: "עדיפות",
      active: "פעיל",
      disabled: "מושבת",
      edit: "עריכה",
      analytics: "אנליטיקס"
    },
    clientsTab: {
      title: "יישומי לקוח",
      addButton: "הוספת לקוח",
      organization: "ארגון",
      quotas: "מכסות",
      perDay: "/יום",
      perMonth: "/חודש",
      transferLimit: "מגבלת העברה",
      typeAndAccess: "סוג וגישה",
      apiKeys: "מפתחות API",
      services: "שירותים",
      edit: "עריכה",
      usage: "שימוש"
    },
    analyticsTab: {
      title: "סקירת שימוש ב-API",
      totalRequests: "סה״כ בקשות",
      successRate: "שיעור הצלחה",
      avgResponseTime: "זמן תגובה ממוצע",
      rateLimited: "הוגבלו בקצב",
      topEndpoints: "נקודות קצה מובילות",
      endpoint: "נקודת קצה",
      requests: "בקשות",
      avgTime: "זמן ממוצע",
      errorRate: "שיעור שגיאות",
      responseTimeDistribution: "התפלגות זמני תגובה",
      errorBreakdown: "פירוט שגיאות"
    },
    securityTab: {
      threatDetection: "זיהוי איומים",
      blockIpButton: "חסימת IP",
      threatsDetected: "איומים שזוהו",
      blockedIps: "כתובות IP חסומות",
      recentThreats: "איומים אחרונים",
      blockedIpAddresses: "כתובות IP חסומות",
      tableHeaders: {
        ipAddress: "כתובת IP",
        reason: "סיבה",
        blocked: "נחסם",
        actions: "פעולות"
      },
      attempts: "ניסיונות",
      by: "על ידי"
    },
    createKeyDialog: {
      title: "יצירת מפתח API",
      keyName: "שם מפתח",
      keyNamePlaceholder: "לדוגמה: מפתח אפליקציית מובייל פרודקשן",
      clientApplication: "יישום לקוח",
      requestsPerMinute: "בקשות לדקה",
      requestsPerDay: "בקשות ליום",
      permissions: "הרשאות (מופרדות בפסיק)",
      permissionsPlaceholder: "read:patients, write:appointments, read:files",
      cancel: "ביטול",
      createButton: "יצירת מפתח API"
    },
    blockIpDialog: {
      title: "חסימת כתובת IP",
      ipAddress: "כתובת IP",
      ipPlaceholder: "192.168.1.100",
      reason: "סיבה",
      reasonPlaceholder: "תארו מדוע כתובת IP זו צריכה להיחסם",
      duration: "משך (דקות)",
      durationPlaceholder: "השאירו ריק לחסימה קבועה",
      durationHelperText: "0 או ריק לחסימה קבועה",
      cancel: "ביטול",
      blockButton: "חסימת IP"
    },
    labels: {
      keyName: "שם מפתח",
      keyNamePlaceholder: "לדוגמה: מפתח אפליקציית מובייל פרודקשן",
      blockDuration: "משך חסימה",
      blockDurationHelperText: "0 או ריק לחסימה קבועה"
    }
  },

  // Clients/Patients Page
  clientsPage: {
    title: "לקוחות",
    subtitle: "ניהול רשימת הלקוחות שלכם",
    searchPlaceholder: "חיפוש לפי שם, אימייל או תחום...",
    filterAll: "הכל",
    filterActive: "פעילים",
    filterOnHold: "בהמתנה",
    noClients: "אין לקוחות עדיין",
    noClientsMessage: "הוסיפו את הלקוח הראשון שלכם כדי להתחיל",
    addFirstClient: "הוספת לקוח ראשון",
    addClient: "הוספת לקוח",
    addNewClient: "לקוח חדש",
    clientDetails: "פרטי לקוח",
    focusArea: "תחום התמקדות",
    lastSession: "מפגש אחרון",
    nextSession: "מפגש הבא",
    next: "הבא:",
    totalSessions: "סה״כ מפגשים",
    progress: "התקדמות",
    schedule: "קביעת מפגש",
    call: "התקשרות",
    viewProfile: "צפייה בפרופיל",
    editDetails: "עריכת פרטים",
    scheduleSession: "קביעת מפגש",
    removeClient: "הסרת לקוח",
    removeClientTitle: "הסרת לקוח",
    removeClientConfirm: "האם להסיר את {name} מרשימת הלקוחות? פעולה זו לא ניתנת לביטול.",
    cancel: "ביטול",
    remove: "הסרה",
    noClientsFound: "לא נמצאו לקוחות",
    adjustSearchCriteria: "נסו לשנות את החיפוש"
  },

  // Calendar Page
  calendarPage: {
    title: "יומן",
    subtitle: "ניהול הפגישות והמפגשים שלכם",
    yourSchedule: "לוח הזמנים שלכם",
    appointmentsFor: "פגישות ל",
    selectedDate: "תאריך נבחר:",
    today: "היום",
    week: "שבוע",
    month: "חודש",
    monthView: "תצוגת חודש",
    weekView: "תצוגת שבוע",
    dayView: "תצוגת יום",
    appointments: "פגישות",
    upcoming: "קרובות",
    addAppointment: "פגישה חדשה",
    add: "הוספה",
    viewClient: "צפייה בלקוח",
    joinSession: "הצטרפות למפגש",
    join: "הצטרפות",
    upcomingThisWeek: "השבוע",
    noAppointments: "אין פגישות בתאריך זה",
    clickAddToSchedule: "לחצו על 'הוספה' לקביעת מפגש",
    noUpcomingAppointments: "אין פגישות קרובות",
    scheduleFirst: "קבעו את הפגישה הראשונה",
    scheduleNewAppointment: "קביעת פגישה חדשה",
    editAppointment: "עריכת פגישה",
    calendar: "יומן",
    client: "לקוח",
    sessionType: "סוג מפגש",
    individualTherapy: "מפגש אישי",
    groupTherapy: "מפגש קבוצתי",
    familyTherapy: "מפגש משפחתי",
    consultation: "ייעוץ",
    startTime: "שעת התחלה",
    endTime: "שעת סיום",
    sessionNotes: "הערות למפגש",
    sessionNotesPlaceholder: "הוסיפו הערות או הנחיות למפגש...",
    cancel: "ביטול",
    update: "עדכון",
    schedule: "קביעה",
    // Meeting configuration
    meetingConfiguration: "הגדרות מפגש",
    onlineMeeting: "מפגש מקוון",
    inPersonMeeting: "מפגש פרונטלי",
    meetingTypes: {
      inPerson: "מפגש פרונטלי",
      online: "מפגש מקוון"
    },
    location: "מיקום המפגש",
    locationPlaceholder: "הזינו את כתובת המפגש",
    locationRequired: "מיקום נדרש למפגשים פרונטליים",
    scheduleFailed: "קביעת הפגישה נכשלה. אנא נסו שוב.",
    googleMeet: {
      title: "Google Meet",
      enabled: "יצירת קישור Google Meet",
      willGenerate: "קישור Google Meet ייווצר אוטומטית וישלח ללקוח"
    }
  },

  // Add Note Page
  addNotePage: {
    title: "הוספת הערה",
    heading: "הוספת הערת מפגש",
    subtitle: "תיעוד תצפיות מהמפגש שלך",
    content: "תוכן ההערה",
    contentPlaceholder: "כתוב את הערות המפגש שלך כאן... (תומך ב-Markdown)",
    privateNote: "הערה פרטית",
    privateDescription: "רק אתה יכול לראות הערה זו",
    saveNote: "שמור הערה",
    noteSaved: "ההערה נשמרה בהצלחה!",
    saveFailed: "שמירת ההערה נכשלה. נסה שוב.",
    required: "תוכן נדרש"
  },

  // AI Tools Page
  toolsPage: {
    title: "כלי AI",
    subtitle: "כלים חכמים לשיפור העבודה שלכם",
    aiPoweredTools: "כלים מבוססי AI",
    comingSoon: "בקרוב",
    notifyMe: "עדכנו אותי",
    launchTool: "הפעלה",
    poweredByAI: "מופעל על ידי AI",
    aiDescription: "כלים חכמים שנבנו במיוחד למאמנים ויועצים, לשיפור איכות השירות ללקוחות.",
    treatmentRecs: {
      title: "אסטרטגיות אימון",
      description: "הצעות מותאמות אישית למסע הצמיחה של כל לקוח"
    },
    progressAnalysis: {
      title: "ניתוח התקדמות",
      description: "מעקב אחר התקדמות הלקוחות"
    },
    sessionNotes: {
      title: "סיכום מפגשים",
      description: "יצירת סיכומי מפגש אוטומטיים"
    },
    therapyAssistant: {
      title: "עוזר אימון",
      description: "עזרה בתכנון וניהול מפגשים"
    },
    assessmentTools: {
      title: "כלי הערכה",
      description: "שאלונים והערכות מקצועיות"
    },
    wellnessInsights: {
      title: "תובנות רווחה",
      description: "ניתוח מגמות ודפוסים"
    }
  },

  // Notifications Page
  notificationsPage: {
    title: "התראות",
    subtitle: "עדכונים והודעות",
    noNotifications: "אין התראות חדשות",
    allCaughtUp: "אתם מעודכנים!",
    stayTuned: "התראות חדשות יופיעו כאן",
    new: "חדש",
    markAllRead: "סימון הכל כנקרא",
    filter: "סינון",
    all: "הכל",
    unread: "לא נקראו",
    appointments: "פגישות",
    messages: "הודעות",
    system: "מערכת"
  },

  // Add Patient/Client Page
  addPatientPage: {
    title: "הוספת לקוח חדש",
    heading: "👤 הוספת לקוח חדש",
    subtitle: "יצירת פרופיל לקוח חדש לעסק שלכם",
    firstName: "שם פרטי",
    lastName: "שם משפחה",
    email: "כתובת אימייל",
    phone: "מספר טלפון",
    whatsappOptIn: "התראות בוואטסאפ",
    whatsappDescription: "שליחת תזכורות לפגישות דרך וואטסאפ",
    accountType: "סוג חשבון",
    client: "לקוח",
    coach: "מאמן",
    inviteInfo: "הזמנה תישלח לכתובת האימייל של הלקוח עם הוראות התחברות.",
    addClient: "הוספת לקוח",
    patientSaved: "הלקוח נשמר בהצלחה",
    saveFailed: "שמירה נכשלה, נסו שוב",
    required: "שדה חובה",
    invalidEmail: "כתובת אימייל לא תקינה",
    phoneInvalid: "נא להזין מספר טלפון תקין (7-15 ספרות)",
    coachNotFound: "שגיאה: לא ניתן לזהות את החשבון שלכם. נא להתחבר מחדש."
  },

  // Add Appointment Page
  addAppointmentPage: {
    title: "קביעת פגישה",
    heading: "📅 קביעת פגישה חדשה",
    subtitle: "תזמון מפגש אימון עם הלקוח שלכם",
    clientId: "מזהה לקוח",
    clientIdPlaceholder: "הזינו מזהה לקוח או חפשו לפי שם",
    datetime: "תאריך ושעה",
    sessionType: "סוג מפגש",
    sessionTypes: {
      consultation: "פגישת היכרות",
      coaching: "אימון אישי",
      group: "אימון קבוצתי",
      family: "אימון משפחתי",
      followup: "מפגש המשך"
    },
    notes: "הערות למפגש",
    notesPlaceholder: "הוסיפו הערות או הנחיות מיוחדות למפגש זה...",
    scheduleButton: "קביעת פגישה",
    appointmentSaved: "הפגישה נקבעה בהצלחה",
    saveFailed: "קביעת הפגישה נכשלה, נסו שוב",
    // Meeting configuration
    meetingConfiguration: "הגדרות מפגש",
    meetingType: "סוג מפגש",
    meetingTypes: {
      inPerson: "מפגש פרונטלי",
      online: "מפגש מקוון",
      hybrid: "משולב (בחירת הלקוח)"
    },
    location: "מיקום המפגש",
    locationPlaceholder: "הזינו את כתובת המפגש",
    googleMeet: {
      title: "Google Meet",
      enabled: "יצירת קישור Google Meet",
      description: "קישור למפגש ייווצר אוטומטית וישלח ללקוח",
      willGenerate: "קישור Google Meet ייווצר אוטומטית וישלח ללקוח בזמן אישור הפגישה"
    },
    onlineMeeting: "מפגש מקוון",
    inPersonMeeting: "מפגש פרונטלי"
  },

  // Coach Tools
  coach: {
    goalPlanning: {
      title: "תכנון מטרות ומתודולוגיות 🎯",
      subtitle: "צרו תבניות, עצבו תוכניות והגדירו את מתודולוגיית האימון שלכם",
      tabs: ["תבניות מטרות", "תוכניות אימון", "מתודולוגיות", "אנליטיקס"],
      stats: {
        templates: "תבניות מטרות",
        programs: "תוכניות אימון",
        methodologies: "מתודולוגיות",
        clients: "לקוחות רשומים"
      },
      templates: {
        title: "תבניות מטרות",
        create: "יצירת תבנית מטרה",
        empty: {
          title: "אין עדיין תבניות מטרות",
          subtitle: "צרו את התבנית הראשונה כדי לעזור ללקוחות עם הגדרת מטרות מובנית",
          button: "יצירת תבנית מטרה"
        },
        dialog: {
          title: "יצירת תבנית מטרה 📋",
          steps: ["פרטי התבנית", "אבני דרך", "משאבים וטיפים"]
        }
      }
    },
    invitations: {
      title: "הזמנות לקוחות וקשרים 🤝",
      subtitle: "ניהול הזמנות אימון, אישורים וקשרי לקוחות",
      tabs: ["כל ההזמנות", "ממתינות", "אושרו", "נדחו", "פג תוקף"],
      stats: {
        pending: "ממתינות",
        accepted: "אושרו",
        total: "סה״כ הזמנות",
        activeRelations: "קשרים פעילים"
      },
      create: {
        title: "שליחת הזמנת אימון 📧",
        steps: ["בחירת לקוח", "פרטי הקשר", "לוח זמנים והעדפות"],
        button: "שליחת הזמנה"
      },
      actions: {
        viewDetails: "צפייה בפרטים",
        approve: "אישור",
        reject: "דחייה",
        decline: "סירוב",
        accept: "קבלה",
        cancel: "ביטול",
        resend: "שליחה מחדש",
        back: "חזרה",
        continue: "המשך"
      },
      empty: {
        title: "לא נמצאו הזמנות",
        subtitle: "התחילו לבנות קשרים על ידי שליחת ההזמנה הראשונה",
        button: "שליחת הזמנה"
      },
      search: {
        placeholder: "חיפוש הזמנות...",
        statusFilter: "סינון סטטוס",
        allStatuses: "כל הסטטוסים"
      },
      relationshipTypes: {
        primary: "מאמן ראשי",
        secondary: "מאמן משני",
        consultation: "ייעוץ",
        mentorship: "חונכות",
        group: "אימון קבוצתי"
      },
      invitationTypes: {
        coachingRelationship: "יחסי אימון",
        programEnrollment: "הרשמה לתוכנית",
        consultation: "ייעוץ",
        collaboration: "שיתוף פעולה"
      },
      form: {
        clientEmail: "אימייל לקוח",
        invitationType: "סוג הזמנה",
        relationshipType: "סוג קשר"
      },
      labels: {
        focusAreas: "תחומי התמקדות:",
        weeks: "שבועות"
      },
      aria: {
        sendInvitation: "שליחת הזמנה"
      }
    }
  },

  // Client Onboarding
  onboarding: {
    steps: {
      welcome: {
        title: "ברוכים הבאים למסע שלכם! 🌟",
        description: "בואו נתחיל אתכם בדרך לשינוי",
        congratulations: "מזל טוב! 🎉",
        subtitle: "עשיתם את הצעד הכי חשוב - החלטתם להשקיע בעצמכם. בואו ניצור חוויית אימון מותאמת אישית בשבילכם.",
        nextSteps: "בדקות הקרובות, נעשה:",
        identify: "✨ נזהה את המטרות המרכזיות שלכם",
        understand: "🎯 נבין את האתגרים שלכם",
        match: "👥 נמצא לכם את המאמן המושלם",
        setup: "📅 נקבע את לוח הזמנים שלכם"
      },
      goals: {
        title: "מה המיקוד העיקרי שלכם? 🎯",
        description: "בחרו את התחום שבו אתם רוצים לראות את השינוי הגדול ביותר",
        question: "איזה תחום בחיים שלכם זקוק לתשומת לב כרגע?",
        secondary: "תחומים נוספים שתרצו לעבוד עליהם? (אופציונלי)"
      },
      challenges: {
        title: "מה מעכב אתכם? 🧠",
        description: "הבנת האתגרים שלכם עוזרת לנו ליצור את מערכת התמיכה הנכונה",
        question: "מהם האתגרים הגדולים ביותר שלכם כרגע?",
        motivation: "עד כמה אתם מוטיבציה לעשות שינויים? (1-10)",
        motivationLow: "לא מוטיבציה במיוחד",
        motivationHigh: "מוטיבציה מאוד",
        success: "איך נראה הצלחה עבורכם?",
        successPlaceholder: "תארו את התוצאה האידאלית שלכם אחרי 6 חודשי אימון..."
      },
      coaching: {
        title: "מצאו את המאמן המושלם 👥",
        description: "בואו נמצא לכם מאמן שמתאים לסגנון ולצרכים שלכם",
        style: "איזה סגנון אימון מדבר אליכם?",
        timeCommitment: "כמה זמן אתם יכולים להשקיע בשבוע?",
        schedule: "לוח זמנים מועדף למפגשים"
      },
      ready: {
        title: "אתם מוכנים! 🚀",
        description: "הגיע הזמן להתחיל את מסע השינוי",
        amazing: "מדהים! אתם מוכנים! 🚀",
        subtitle: "בהתבסס על התשובות שלכם, יצרנו תוכנית אימון מותאמת אישית שמושלמת עבורכם.",
        summary: "סיכום תוכנית האימון שלכם:",
        primaryFocus: "מיקוד עיקרי:",
        schedule: "לוח זמנים:",
        motivation: "רמת מוטיבציה:",
        ready: "אני מוכן להתחיל את מסע השינוי שלי!",
        enterDashboard: "כניסה ללוח הבקרה",
        continue: "המשך"
      }
    },
    categories: {
      career: "💼 קריירה וצמיחה מקצועית",
      relationships: "❤️ יחסים וחיים חברתיים",
      health: "💪 בריאות וכושר",
      financial: "💰 ביטחון כלכלי",
      personal: "🧠 פיתוח אישי",
      balance: "⚖️ איזון בין עבודה לחיים",
      goals: "🎯 השגת מטרות",
      stress: "😌 ניהול מתח"
    },
    challenges: {
      motivation: "חוסר מוטיבציה",
      time: "ניהול זמן",
      procrastination: "דחיינות",
      doubt: "ספק עצמי",
      direction: "כיוון לא ברור",
      fear: "פחד מכישלון",
      overwhelm: "הצפה",
      perfectionism: "פרפקציוניזם"
    },
    coachStyles: {
      supportive: "תומך ומעודד",
      direct: "ישיר ומאתגר",
      datadriven: "גישה מבוססת נתונים",
      holistic: "הוליסטי ורוחני",
      action: "ממוקד פעולה",
      mindfulness: "מבוסס מיינדפולנס"
    },
    timeCommitments: {
      low: "1-2 שעות בשבוע",
      medium: "3-4 שעות בשבוע",
      high: "5+ שעות בשבוע",
      flexible: "גמיש - לפי הצורך"
    },
    schedules: {
      weekly: "מפגשים שבועיים",
      biweekly: "מפגשים דו-שבועיים",
      monthly: "בדיקות חודשיות",
      intensive: "בלוקים אינטנסיביים של אימון"
    }
  },

  // Client Booking System
  booking: {
    title: "קביעת מפגש אימון 📅",
    subtitle: "תזמנו מפגשים עם המאמנים שלכם ונהלו את הפגישות",
    selectCoach: "בחירת מאמן",
    selectDate: "בחירת תאריך",
    selectTime: "בחירת שעה",
    sessionType: "סוג מפגש",
    sessionTypes: {
      initial: "פגישת היכרות",
      followup: "מפגש המשך",
      breakthrough: "מפגש פריצת דרך",
      goalsetting: "הגדרת מטרות",
      progress: "סקירת התקדמות",
      emergency: "מפגש דחוף"
    },
    duration: "משך",
    durations: {
      min30: "30 דקות",
      min45: "45 דקות",
      min60: "60 דקות",
      min90: "90 דקות"
    },
    location: "מיקום",
    locationTypes: {
      online: "מקוון (שיחת וידאו)",
      inperson: "פנים-אל-פנים",
      phone: "שיחת טלפון",
      hybrid: "משולב (בחירתכם)"
    },
    specialRequests: "בקשות מיוחדות או הערות",
    specialRequestsPlaceholder: "נושאים ספציפיים, דאגות או הערות הכנה למאמן שלכם...",
    coachAvailability: "זמינות המאמן",
    noSlotsAvailable: "אין משבצות זמן זמינות",
    nextAvailable: "הזמינות הבאה:",
    bookingConfirmation: "אישור הזמנה",
    confirmDetails: "אנא אשרו את פרטי המפגש:",
    coach: "מאמן",
    dateTime: "תאריך ושעה",
    type: "סוג מפגש",
    loc: "מיקום",
    dur: "משך",
    notes: "הערות",
    confirmBooking: "אישור הזמנה",
    cancelBooking: "ביטול",
    bookingSuccess: "המפגש נקבע בהצלחה! 🎉",
    bookingSuccessMessage: "מפגש האימון שלכם תוזמן. תקבלו אימייל אישור עם כל הפרטים.",
    viewBookings: "צפייה בהזמנות שלי",
    bookAnother: "קביעת מפגש נוסף",
    myBookings: "המפגשים הקרובים שלי",
    pastSessions: "מפגשים קודמים",
    upcomingEmpty: "אין מפגשים מתוכננים",
    pastEmpty: "לא נמצאו מפגשים קודמים",
    reschedule: "תזמון מחדש",
    cancelSession: "ביטול מפגש",
    joinSession: "הצטרפות למפגש",
    sessionDetails: "פרטי המפגש",
    status: {
      confirmed: "מאושר",
      pending: "ממתין לאישור",
      cancelled: "בוטל",
      completed: "הושלם",
      noshow: "לא הגיע",
      rescheduled: "תוזמן מחדש"
    },
    filters: {
      allCoaches: "כל המאמנים",
      thisWeek: "השבוע",
      thisMonth: "החודש",
      allTime: "כל הזמן"
    },
    errors: {
      noCoachSelected: "אנא בחרו מאמן",
      noDateSelected: "אנא בחרו תאריך",
      noTimeSelected: "אנא בחרו משבצת זמן",
      bookingFailed: "קביעת המפגש נכשלה. אנא נסו שוב.",
      loadingError: "טעינת נתוני ההזמנה נכשלה. אנא רעננו את העמוד."
    }
  },

  // Client Portal
  clientPortal: {
    login: {
      welcomeBack: "ברוכים השבים!",
      accessJourney: "גישה למסע הצמיחה האישי שלכם",
      continueTransformation: "המשיכו את השינוי עם המאמן המוקדש שלכם",
      loadingMessage: "מתחברים למסע ההדרכה שלכם...",
      emailLabel: "כתובת אימייל",
      emailPlaceholder: "your.email@example.com",
      passwordLabel: "סיסמה",
      passwordPlaceholder: "הזינו את הסיסמה שלכם",
      signingIn: "מתחברים...",
      submitButton: "התחילו את המסע",
      newToCoaching: "חדשים באימון?",
      beginTransformation: "התחילו את השינוי",
      forgotPassword: "שכחתם סיסמה?",
      coachLogin: "כניסת מאמן",
      motivationalQuote: "כל מומחה היה פעם מתחיל.",
      journeyStarts: "מסע הצמיחה שלכם מתחיל כאן",
    },
    register: {
      title: "התחילו את המסע שלכם! 🚀",
      subtitle: "הצטרפו לאלפים שמשנים את חייהם",
      steps: ["פרטים בסיסיים", "פרטים אישיים", "המסע שלכם"],
      creatingAccount: "יוצרים את החשבון שלכם...",
      beginTransformation: "התחילו את השינוי",
      next: "הבא",
      back: "חזרה",
      signInInstead: "התחברו במקום",
      alreadyHaveAccount: "כבר יש לכם חשבון?",
      quote: "\"הזמן הטוב ביותר לשתול עץ היה לפני 20 שנה. הזמן הטוב הבא הוא עכשיו.\"",
      quoteSubtitle: "ההתמרה שלכם מתחילה בצעד אחד 🌱",
      fields: {
        firstName: "שם פרטי",
        lastName: "שם משפחה",
        email: "כתובת אימייל",
        password: "סיסמה",
        confirmPassword: "אישור סיסמה",
        phone: "מספר טלפון",
        dateOfBirth: "תאריך לידה",
        coachCode: "קוד מאמן (אופציונלי)",
        coachCodeHelper: "הזינו את קוד ההפניה של המאמן שלכם אם קיבלתם",
        coachCodePlaceholder: "אם יש לכם קוד מאמן ספציפי"
      },
      goals: {
        title: "מהן המטרות העיקריות שלכם? (בחרו את כל המתאימות)",
        careerAdvancement: "קידום בקריירה",
        personalRelationships: "יחסים בין-אישיים",
        healthWellness: "בריאות ורווחה",
        financialGoals: "יעדים כלכליים",
        selfConfidence: "ביטחון עצמי",
        lifePurpose: "ייעוד בחיים",
        stressManagement: "ניהול לחץ",
        communicationSkills: "כישורי תקשורת"
      },
      coachingStyle: {
        label: "סגנון אימון מועדף",
        structured: "📋 מובנה וממוקד יעדים",
        flexible: "🌊 גמיש ומסתגל",
        supportive: "🤗 תומך ומחבק",
        challenging: "💪 ישיר ומאתגר"
      },
      sessionPreference: {
        label: "העדפת מפגשים",
        weekly: "📅 מפגשים שבועיים",
        biweekly: "📆 מפגשים דו-שבועיים",
        monthly: "🗓️ מפגשים חודשיים",
        flexible: "⏰ תזמון גמיש"
      },
      terms: {
        agree: "אני מסכים/ה ל",
        termsOfService: "תנאי השימוש",
        and: "ול",
        privacyPolicy: "מדיניות הפרטיות"
      },
      errors: {
        firstNameRequired: "שם פרטי נדרש",
        lastNameRequired: "שם משפחה נדרש",
        emailInvalid: "נא להזין כתובת אימייל תקינה",
        passwordRequirements: "הסיסמה חייבת להכיל לפחות 8 תווים עם אותיות ומספרים",
        passwordsMismatch: "הסיסמאות אינן תואמות",
        phoneInvalid: "נא להזין מספר טלפון תקין",
        dobRequired: "תאריך לידה נדרש",
        agreeToTerms: "נא לאשר את התנאים וההגבלות",
        selectGoal: "נא לבחור לפחות מטרה עיקרית אחת"
      },
      placeholders: {
        firstName: "שרה",
        lastName: "כהן",
        email: "sarah.cohen@example.com",
        password: "בחרו סיסמה חזקה",
        confirmPassword: "אשרו את הסיסמה שלכם",
        phone: "050-123-4567"
      }
    },
    forgotPassword: {
      title: 'איפוס סיסמה',
      subtitle: 'הזינו את כתובת האימייל שלכם ונשלח לכם קישור לאיפוס',
      emailLabel: 'כתובת אימייל',
      emailPlaceholder: 'your.email@example.com',
      submitButton: 'שלחו קישור איפוס',
      successTitle: 'בדקו את האימייל שלכם',
      successMessage: 'אם קיים חשבון עם כתובת אימייל זו, תקבלו קישור לאיפוס סיסמה.',
      backToLogin: 'חזרה להתחברות',
    },
    settings: {
      title: 'הגדרות',
      subtitle: 'נהלו את העדפות החשבון שלכם',
      tabs: {
        profile: 'פרופיל',
        privacy: 'פרטיות',
        consent: 'הסכמה להקלטה',
      },
      profile: {
        name: 'שם מלא',
        email: 'כתובת אימייל',
        phone: 'מספר טלפון',
        memberSince: 'חבר מאז',
      },
      privacy: {
        title: 'הגדרות פרטיות',
        dataRetention: 'שמירת נתונים',
        dataRetentionInfo: 'הנתונים שלכם נשמרים בצורה מאובטחת בהתאם למדיניות הפרטיות שלנו.',
        deleteAccount: 'מחיקת חשבון',
        deleteAccountWarning: 'פעולה זו היא קבועה ואינה ניתנת לביטול.',
        requestDeletion: 'בקשת מחיקת חשבון',
      },
      consent: {
        title: 'הסכמה להקלטה',
        description: 'נהלו את העדפות ההסכמה שלכם להקלטת מפגשים',
        audioRecording: 'הקלטת שמע',
        transcription: 'תמלול',
        aiAnalysis: 'ניתוח AI',
        consentHistory: 'היסטוריית הסכמות',
        noHistory: 'אין היסטוריית הסכמות זמינה',
      },
    },
    invitations: {
      title: "הזמנות מאמנים 📨",
      subtitle: "עיינו והגיבו להזמנות אימון ממקצוענים מוסמכים",
      tabs: ["כל ההזמנות", "ממתינות", "אושרו", "נדחו"],
      stats: {
        pending: "ממתינות",
        accepted: "אושרו",
        activeCoaches: "מאמנים פעילים",
        total: "סה״כ הזמנות"
      },
      actions: {
        viewDetails: "צפייה בפרטים",
        accept: "קבלה",
        decline: "דחייה"
      },
      dialog: {
        accept: "קבלת הזמנה",
        reject: "דחיית הזמנה",
        coachBackground: "רקע המאמן",
        sessionDetails: "פרטי המפגשים",
        focusAreas: "תחומי התמקדות וגישה",
        yourResponse: "התגובה שלכם"
      },
      empty: {
        title: "לא נמצאו הזמנות",
        subtitle: {
          all: "אין לכם עדיין הזמנות אימון",
          pending: "אין הזמנות ממתינות כרגע",
          accepted: "לא קיבלתם עדיין הזמנות",
          rejected: "אין הזמנות שנדחו"
        },
        button: "גלו מאמנים"
      }
    },
    discover: {
      title: "גלו את המאמן המושלם עבורכם 🌟",
      subtitle: "מצאו מאמנים מאומתים שמתאימים למטרות ולהעדפות שלכם"
    },
    dashboard: {
      title: "לוח הבקרה הרב-מאמנים שלכם 🌿",
      subtitle: "עקבו אחר מסע הצמיחה עם מספר מאמנים",
      welcome: "ברוכים השבים, {name}! 👋",
      workingWith: "עובדים עם {count} מאמנים מדהימים",
      dayStreak: "רצף של {days} ימים",
      coaches: "מאמנים",
      activeCoaches: "מאמנים פעילים",
      filterView: "סינון התצוגה",
      coach: "מאמן",
      allCoaches: "כל המאמנים",
      sessionType: "סוג מפגש",
      allTypes: "כל הסוגים",
      onlineSessions: "🌐 מפגשים מקוונים",
      inPersonSessions: "🏢 מפגשים פנים-אל-פנים",
      timePeriod: "תקופת זמן",
      upcoming: "קרובים",
      thisWeek: "השבוע",
      thisMonth: "החודש",
      sessionsFound: "נמצאו {count} מפגשים",
      totalSessions: "סה״כ מפגשים",
      goalsAchieved: "מטרות שהושגו",
      dayStreakLabel: "רצף ימים",
      progressJourney: "מסע ההתקדמות שלכם",
      overallProgress: "התקדמות כוללת",
      activeGoals: "מטרות פעילות",
      completed: "הושלמו",
      thisWeekProgress: "השבוע",
      recentAchievements: "הישגים אחרונים",
      noAchievements: "אין הישגים התואמים את הסינון הנוכחי",
      selectAllCoaches: "בחרו \"כל המאמנים\" כדי לראות את כל ההישגים",
      upcomingSessions: "מפגשים קרובים",
      noSessionsMatch: "אין מפגשים התואמים את הסינונים הנוכחיים",
      tryAdjusting: "נסו להתאים את הגדרות הסינון",
      viewAllSessions: "צפייה בכל המפגשים",
      quickActions: "פעולות מהירות",
      setNewGoal: "הגדרת מטרה חדשה",
      viewProgress: "צפייה בהתקדמות",
      messageCoach: "הודעה למאמן",
      bookSession: "הזמנת מפגש",
      viewAchievements: "הישגים",
      discoverCoaches: "גלה מאמנים",
      with: "עם",
      motivationalMessages: [
        "אתם מרסקים את זה עם מספר מאמנים! הגישה הרב-ממדית שלכם לצמיחה משתלמת. 🌟",
        "מאמנים מרובים = נקודות מבט מרובות = צמיחה אקספוננציאלית! המשיכו כך! 🚀",
        "המחויבות שלכם לעבוד עם מספר מאמנים מראה מסירות רצינית לצמיחה! 💪",
        "בונים צוות חלומות של מאמנים? מהלך חכם! אתם משקיעים בעצמכם כמו אלופים! 🏆"
      ],
      levels: {
        multiCoachChampion: "אלוף רב-מאמנים",
        growthWarrior: "לוחם צמיחה",
        transformationHero: "גיבור שינוי",
        wellnessExplorer: "חוקר רווחה"
      }
    },
    appointments: {
      title: "מפגשי האימון שלכם 📅",
      subtitle: "נהלו פגישות עם כל המאמנים שלכם"
    },
    progressSharing: {
      title: "מסע ההתקדמות שלכם 🌟",
      subtitle: "שתפו את ההישגים שלכם וחגגו עם צוות האימון",
      tabs: {
        progressFeed: "פיד התקדמות",
        celebrations: "חגיגות",
        analytics: "אנליטיקס"
      },
      filters: {
        title: "סינון עדכונים",
        type: "סוג",
        allTypes: "כל הסוגים",
        achievements: "🏆 הישגים",
        milestones: "🎯 אבני דרך",
        insights: "💡 תובנות",
        breakthroughs: "⚡ פריצות דרך",
        coach: "מאמן",
        allCoaches: "כל המאמנים",
        timePeriod: "תקופת זמן",
        allTime: "כל הזמן",
        thisWeek: "השבוע",
        thisMonth: "החודש"
      },
      updateTypes: {
        achievement: "הישג",
        milestone: "אבן דרך",
        insight: "תובנה",
        breakthrough: "פריצת דרך",
        challenge: "אתגר"
      },
      sharing: {
        shareProgress: "שיתוף ההתקדמות שלכם",
        shareSubtitle: "תנו למאמנים שלכם לחגוג את המסע איתכם",
        updateTitle: "כותרת העדכון",
        titlePlaceholder: "מה אתם חוגגים היום?",
        description: "תיאור",
        descriptionPlaceholder: "שתפו את הפרטים של ההתקדמות, התובנות או ההישגים שלכם...",
        updateType: "סוג עדכון",
        visibility: "נראות",
        visibilityOptions: {
          coaches: "כל המאמנים שלי",
          selected: "מאמנים נבחרים",
          private: "פרטי (רק אני)"
        },
        selectCoaches: "בחירת מאמנים",
        tags: "תגיות (מופרדות בפסיק)",
        tagsPlaceholder: "כושר, אבן דרך, פריצת דרך",
        shareUpdate: "שיתוף עדכון"
      },
      feed: {
        noUpdates: "לא נמצאו עדכוני התקדמות",
        noUpdatesSubtitle: "התחילו לשתף את המסע שלכם עם המאמנים!",
        shareFirst: "שיתוף העדכון הראשון",
        progress: "התקדמות",
        sharedWith: "משותף עם:",
        coachReactions: "תגובות המאמנים:",
        comments: "תגובות:",
        react: "הגיבו",
        comment: "הערה"
      },
      celebrations: {
        coachCelebrations: "חגיגות המאמנים 🎊",
        shareThisCelebration: "שתפו חגיגה זו"
      },
      analytics: {
        comingSoon: "אנליטיקס בקרוב",
        trackProgress: "עקבו אחר מגמות ותובנות ההתקדמות"
      },
      reactions: {
        like: "לייק",
        celebrate: "חגיגה",
        inspire: "השראה",
        proud: "גאה"
      },
      common: {
        loading: "טוען את ההתקדמות שלכם...",
        cancel: "ביטול",
        save: "שמירה",
        delete: "מחיקה",
        edit: "עריכה",
        share: "שיתוף"
      }
    }
  },

  // Recording & AI Summary
  recording: {
    title: "הקלטת מפגש",
    multipleRecordings: "{count} הקלטות",
    summaryReady: "סיכום מוכן",
    directRecord: "הקלטה כעת",
    uploadExisting: "העלאת קובץ",
    playbackControls: "ניגון",
    autoSummary: "סיכום AI",
    recordingMode: "מצב הקלטה",
    videoAndAudio: "וידאו ושמע",
    audioOnly: "שמע בלבד",
    screenShare: "שיתוף מסך",
    online: "אונליין",
    inPerson: "פרונטלי",
    hybrid: "משולב",
    uploadRecordingDescription: "העלאת קובץ הקלטה קיים ליצירת סיכום AI.",
    dragDropText: "גרירת קובץ הקלטה לכאן",
    supportedFormats: "תומך ב-MP4, MOV, MP3, WAV (עד {maxSize})",
    selectFile: "בחירת קובץ",
    uploadProgress: "מעלה... {progress}%",
    processingFile: "מעבד קובץ...",
    editSummary: "עריכת סיכום",
    shareSummary: "שיתוף סיכום",
    generatingSummary: "מייצר סיכום AI...",
    keyPoints: "נקודות עיקריות",
    actionItems: "משימות לביצוע",
    insights: "תובנות AI",
    recommendations: "המלצות",
    notSupported: "הקלטה אינה נתמכת",
    browserError: "הדפדפן שלך אינו תומך בהקלטה. אנא נסה דפדפן אחר.",
  },

  // Patient/Client History Page - עמוד היסטוריה
  historyPage: {
    title: "היסטוריית לקוח",
    date: "תאריך",
    therapist: "מאמן",
    type: "סוג",
    notes: "הערות",
    allTherapists: "כל המאמנים",
    apply: "החל",
    noTreatments: "לא נמצאו מפגשים",
    viewNote: "צפייה בהערות",
    reschedule: "תזמון מחדש",
    calendarView: "תצוגת לוח שנה",
    listView: "תצוגת רשימה"
  },

  // New Dialog - דיאלוג חדש
  newDialog: {
    title: "חדש",
    newPatient: "לקוח חדש",
    newPatientDescription: "הוספת לקוח חדש לתרגול שלך",
    newAppointment: "פגישה חדשה",
    newAppointmentDescription: "תזמון מפגש אימון",
    cancel: "ביטול"
  },

  // Voice Notes - הקלטות קוליות
  voiceNotes: {
    title: "הקלטה קולית",
    recordNote: "הקלטת הערה קולית",
    tapToRecord: "לחץ על המיקרופון כדי להתחיל להקליט",
    recording: "מקליט...",
    paused: "מושהה",
    uploading: "מעלה...",
    saved: "ההקלטה הקולית נשמרה בהצלחה!",
    save: "שמור הערה",

    // Permission
    microphonePermissionDenied: "הרשאת מיקרופון נדחתה. אנא אפשר גישה למיקרופון בהגדרות הדפדפן.",
    requestPermission: "בקש הרשאה",

    // Volume indicators
    volumeGood: "עוצמה טובה",
    volumeOk: "עוצמה בסדר",
    volumeLow: "דבר חזק יותר",

    // Fields
    titleLabel: "כותרת",
    titleOptional: "כותרת (אופציונלי)",
    titlePlaceholder: "הכנס כותרת להערה...",
    transcriptionLabel: "תמלול",
    transcriptionPlaceholder: "ערוך את התמלול...",
    tagsLabel: "תגיות",
    tagsPlaceholder: "הוסף תגיות...",

    // Status
    statusPending: "ממתין",
    statusProcessing: "מעבד",
    statusCompleted: "תומלל",
    statusFailed: "נכשל",

    // List
    noNotes: "אין עדיין הקלטות קוליות",
    untitled: "ללא כותרת",
    convertToNote: "המר להערה",
    retry: "נסה שוב תמלול",

    // Editor
    editTranscription: "עריכת תמלול",
    words: "מילים",
    characters: "תווים",
    confidence: "ביטחון",

    // Metadata
    metadata: "מטא-דאטה",
    duration: "משך",
    language: "שפה",
    created: "נוצר",

    // Player
    transcript: "תמלול"
  },

  // Recording (Session Recording)
  recording: {
    // Recording Consent
    consent: {
      title: 'הסכמה להקלטת מפגש',
      description: 'מפגש זה עשוי להיות מוקלט למטרות איכות וסקירה',
      includes: 'ההקלטה עשויה לכלול אודיו, וידאו, תמלול וניתוח AI',
      audioRecording: 'הקלטת אודיו',
      transcription: 'תמלול',
      aiAnalysis: 'ניתוח AI',
      accept: 'קבלת הקלטה',
      decline: 'דחיית הקלטה',
      revoke: 'ביטול הסכמה',
      history: 'היסטוריית הסכמות',
    },

    // Recording Player
    player: {
      play: 'נגן',
      pause: 'השהה',
      volume: 'עוצמה',
      speed: 'מהירות השמעה',
      duration: 'משך',
    },

    // Transcript Viewer
    transcript: {
      title: 'תמלול המפגש',
      search: 'חיפוש בתמלול',
      download: 'הורדת תמלול',
      coach: 'מאמן',
      client: 'לקוח',
      noTranscript: 'אין תמלול זמין',
    },

    // Session Summary
    summary: {
      title: 'סיכום המפגש',
      keyPoints: 'נקודות מפתח',
      actionItems: 'פעולות לביצוע',
      topicsDiscussed: 'נושאים שנדונו',
      insights: 'תובנות',
      noSummary: 'אין עדיין סיכום זמין',
    },
  }
};
