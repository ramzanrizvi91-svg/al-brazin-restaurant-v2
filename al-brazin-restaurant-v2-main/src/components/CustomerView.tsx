import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Mic, MicOff, Send, ShoppingBag, Bell, ChevronRight, Receipt,
  Trash2, Plus, Minus, CreditCard, Sparkles, HelpCircle, Utensils, 
  Flame, Check, AlertTriangle, Volume2, VolumeX, Menu, X, ArrowLeft,
  Coffee, HelpCircle as HelpIcon, Smile, ShieldCheck, Clock, Smartphone, ClipboardList,
  CheckCircle
} from 'lucide-react';
import { MenuItem, CartItem, Order, Branch } from '../types';
import { playChime } from './AudioAlert';
import { socket } from '../socket';
import { Gift, Star } from 'lucide-react';

// Item weight helper for Al-Brazin Menu items
const getItemWeight = (itemName: string): number => {
  const name = itemName.toLowerCase();
  if (name.includes('shrimp')) return 250;
  if (name.includes('fries')) return 300;
  if (name.includes('calamari')) return 220;
  if (name.includes('burger')) return 350;
  if (name.includes('steak') || name.includes('ribeye')) return 350;
  if (name.includes('risotto')) return 400;
  if (name.includes('salmon')) return 320;
  if (name.includes('cake') || name.includes('pudding') || name.includes('dome')) return 200;
  if (name.includes('mojito') || name.includes('gold')) return 330;
  if (name.includes('espresso')) return 60;
  return 250; // default portion weight in grams
};

const getTableNumberWord = (num: string): string => {
  const n = parseInt(num, 10);
  if (n === 1) return "one";
  if (n === 2) return "two";
  if (n === 3) return "three";
  if (n === 4) return "four";
  if (n === 5) return "five";
  if (n === 6) return "six";
  if (n === 7) return "seven";
  if (n === 8) return "eight";
  if (n === 9) return "nine";
  if (n === 10) return "ten";
  return num;
};

const getWelcomeMessage = (branchName: string, table: string, lang: string = 'en') => {
  const branchDisplay = branchName.replace(' Restaurant', '').replace(' Riyadh', '').trim();
  const branchText = branchDisplay.toLowerCase().includes('golden') ? 'Al-Brazin Golden Branch' : `Al-Brazin's ${branchDisplay} Branch`;
  const tableWord = getTableNumberWord(table);
  
  if (lang === 'ar') {
    const tableNumArabic = table === '1' ? 'واحد' : table;
    return `مرحباً بك في مطعم البرازين - فرع ${branchDisplay}! أنا نادلك الرقمي في طاولة رقم ${tableNumArabic}. ماذا تحب أن تطلب اليوم؟`;
  }
  if (lang === 'ur') {
    const tableNumUrdu = table === '1' ? 'ایک' : table;
    return `البرازین کی ${branchDisplay} برانچ میں آپ کا استقبال ہے۔ میں ٹیبل نمبر ${tableNumUrdu} پر آپ کا ڈیجیٹل ویٹر ہوں۔ آج آپ کیا آرڈر کرنا چاہیں گے؟`;
  }
  
  return `Welcome to ${branchText}. I am your digital AI waiter at table number ${tableWord}. What would you like to order today?`;
};

// UI Localization dictionary
const LOCALIZATION = {
  en: {
    brandName: "Prestigino AI",
    liveWaiter: "Live Waiter",
    connectedTo: "Connected to",
    table: "Table",
    section: "Section",
    talkWithAi: "Talk with AI",
    talkDirectly: "Talk Directly to AI",
    chatOnly: "Use Chat Only",
    exploreMenu: "Explore Menu",
    smartCart: "Smart Cart",
    myOrders: "My Orders",
    callWaiter: "Call Waiter",
    callingWaiter: "Calling Waiter...",
    waiterCalled: "Waiter Called!",
    specialNotes: "Special Notes",
    confirmPlaceOrder: "Confirm & Place Order",
    secureCheckout: "Secure Checkout",
    totalWeight: "Total Weight",
    applicableTax: "Applicable Tax",
    totalAmount: "Total Amount",
    grandTotal: "Grand Total",
    subtotal: "Subtotal",
    vat: "VAT (15%)",
    serviceCharge: "Service Charge",
    trackingOrder: "Tracking Order",
    status: "Status",
    kitchenNotes: "Kitchen Notes / Special Requests",
    notesPlaceholder: "No spice, extra sauce, allergy specs...",
    rateExp: "Rate Your Dining Experience!",
    orderServed: "Your luxury order is served. Please share your rating!",
    submit: "Submit",
    listeningActive: "Continuous voice capture active... speak now",
    tapMic: "Tap the gold mic button below to start speaking!",
    listeningSpeak: "Listening... speak clearly",
    thinking: "Chef is thinking...",
    placeholder: "Message Chef AI... (e.g. Add a steak and mint drink)",
    welcomeHeader: "Welcome to Al-Brazin Restaurant Group!",
    aiReady: "AI Waiter is prepared & ready to serve your food!",
    activeOrders: "Active Orders",
    noActiveOrders: "No active orders found for this table.",
    itemsChosen: "Items chosen by the customer",
    confirmAndPlace: "Confirm and Place Order",
    or: "or",
    cancel: "Cancel",
    orderedAt: "Ordered at",
    taxVat: "Tax & VAT",
  },
  ar: {
    brandName: "برستيجينو AI",
    liveWaiter: "نادل مباشر",
    connectedTo: "متصل بـ",
    table: "طاولة",
    section: "قسم",
    talkWithAi: "تحدث مع المساعد",
    talkDirectly: "تحدث مباشرة مع المساعد",
    chatOnly: "استخدم الدردشة فقط",
    exploreMenu: "استكشف القائمة",
    smartCart: "السلة الذكية",
    myOrders: "طلباتي",
    callWaiter: "استدعاء النادل",
    callingWaiter: "جاري الاستدعاء...",
    waiterCalled: "تم استدعاء النادل!",
    specialNotes: "ملاحظات خاصة",
    confirmPlaceOrder: "تأكيد وإرسال الطلب",
    secureCheckout: "الدفع الآمن",
    totalWeight: "الوزن الإجمالي",
    applicableTax: "الضريبة المطبقة",
    totalAmount: "المبلغ الإجمالي",
    grandTotal: "المجموع الكلي",
    subtotal: "المجموع الفرعي",
    vat: "ضريبة القيمة المضافة (15%)",
    serviceCharge: "رسوم الخدمة",
    trackingOrder: "تتبع الطلب",
    status: "الحالة",
    kitchenNotes: "ملاحظات المطبخ / طلبات خاصة",
    notesPlaceholder: "بدون بهارات، صوص إضافي، حساسية...",
    rateExp: "قيم تجربتك معنا!",
    orderServed: "تم تقديم طلبك الفاخر. يرجى مشاركة تقييمك!",
    submit: "إرسال",
    listeningActive: "التقاط الصوت المستمر نشط... تحدث الآن",
    tapMic: "اضغط على الميكروفون الذهبي لبدء التحدث!",
    listeningSpeak: "جاري الاستماع... تحدث بوضوح",
    thinking: "الطاهي يفكر...",
    placeholder: "اكتب للمساعد... (مثال: أضف ستيك وعصير نعناع)",
    welcomeHeader: "مرحباً بكم في مجموعة مطاعم البرازين!",
    aiReady: "النادل الآلي جاهز ومستعد لخدمتكم!",
    activeOrders: "الطلبات النشطة",
    noActiveOrders: "لا توجد طلبات نشطة لهذه الطاولة.",
    itemsChosen: "الأصناف المختارة من قبل العميل",
    confirmAndPlace: "تأكيد وإرسال الطلب",
    or: "أو",
    cancel: "إلغاء",
    orderedAt: "تم الطلب في",
    taxVat: "الضرائب والرسوم",
  },
  ur: {
    brandName: "Prestigino AI",
    liveWaiter: "لائیو ویٹر",
    connectedTo: "منسلک ہے",
    table: "ٹیبل",
    section: "سیکشن",
    talkWithAi: "AI سے بات کریں",
    talkDirectly: "براہ راست AI سے بولیں",
    chatOnly: "صرف چیٹ استعمال کریں",
    exploreMenu: "مینو دیکھیں",
    smartCart: "سمارٹ کارٹ",
    myOrders: "میرے آرڈرز",
    callWaiter: "ویٹر کو بلائیں",
    callingWaiter: "ویٹر کو بلا رہے ہیں...",
    waiterCalled: "ویٹر کو بلا لیا گیا ہے!",
    specialNotes: "خصوصی نوٹ",
    confirmPlaceOrder: "آرڈر کی تصدیق کریں",
    secureCheckout: "محفوظ چیک آؤٹ",
    totalWeight: "کل وزن",
    applicableTax: "قابل اطلاق ٹیکس",
    totalAmount: "کل رقم",
    grandTotal: "حتمی رقم",
    subtotal: "ذیلی رقم",
    vat: "VAT (15%)",
    serviceCharge: "سروس چارج",
    trackingOrder: "آرڈر ٹریکنگ",
    status: "حالت",
    kitchenNotes: "کچن نوٹ / خصوصی فرمائش",
    notesPlaceholder: "بغیر مرچ، اضافی چٹنی، الرجی کی تفصیل...",
    rateExp: "اپنے کھانے کے تجربے کی درجہ بندی کریں!",
    orderServed: "آپ کا شاندار کھانا پیش کر دیا گیا ہے۔ براہ کرم اپنی رائے دیں!",
    submit: "جمع کریں",
    listeningActive: "مسلسل آواز کی گرفتاری فعال ہے... اب بولیں",
    tapMic: "بولنا شروع کرنے کے لیے نیچے دیے گئے سنہری مائیک بٹن کو دبائیں!",
    listeningSpeak: "سن رہا ہے... صاف بولیں",
    thinking: "شیف سوچ رہا ہے...",
    placeholder: "شیف AI کو پیغام بھیجیں... (مثلاً ایک سٹیک اور پودینے کا شربت شامل کریں)",
    welcomeHeader: "البرزین ریسٹورنٹ گروپ میں خوش آمدید!",
    aiReady: "AI ویٹر آپ کی خدمت کے لیے بالکل تیار ہے!",
    activeOrders: "فعال آرڈرز",
    noActiveOrders: "اس ٹیبل کے لیے کوئی فعال آرڈر نہیں ملا۔",
    itemsChosen: "گاہک کی طرف سے منتخب کردہ اشیاء",
    confirmAndPlace: "آرڈر کی تصدیق اور ترسیل",
    or: "یا",
    cancel: "منسوخ کریں",
    orderedAt: "آرڈر کا وقت",
    taxVat: "ٹیکس اور وی اے ٹی",
  }
};

// Menu Item translations for localized views
const MENU_TRANSLATIONS: { [key: string]: { [lang: string]: { name: string; description: string; taste?: string } } } = {
  starter_1: {
    ar: {
      name: "روبيان حار (سبايسي شرمب)",
      description: "روبيان الخليج المقرمش المغمس بصلصة الميبل الحارة المميزة، مزين بالبصل الأخضر والسمسم.",
      taste: "حار وحلو مع نكهة بحرية غنية ولذيثة"
    },
    ur: {
      name: "چٹپٹا جھینگا (اسپائسی شرمپ)",
      description: "ہمارے دستخطی مسالیدار میپل گلیز میں لپٹا ہوا خستہ گلف شرمپ، ہری پیاز اور تل سے سجا ہوا۔",
      taste: "مصالحہ دار اور میٹھا، بھرپور سمندری ذائقہ"
    }
  },
  starter_2: {
    ar: {
      name: "بطاطس ترافل بالبارميزان",
      description: "بطاطس مقرمشة سميكة مغطاة بزيت الترافل الأبيض، جبن البارميزان المعتق، والبقدونس الطازج.",
      taste: "ترابي، غني، بنكهة الجبن والملوحة المثالية"
    },
    ur: {
      name: "ٹرفل پارمیسن فرائز",
      description: "سفید ٹرفل آئل، کھرچے ہوئے پرانے پارمیسن، اور تازہ کٹی ہوئی دھنیا سے سجی خستہ فرائز۔",
      taste: "مٹی کا، بھرپور، پنیر اور بہترین نمکین ذائقہ"
    }
  },
  starter_3: {
    ar: {
      name: "كالاماري مقرمش بالفلفل",
      description: "حلقات الكالاماري الطرية المتبلة بالفلفل الأسود والمقلية حتى اللون الذهبي، تقدم مع أيولي الزعفران.",
      taste: "مقرمش من الخارج وطري من الداخل، مع لمسة فلفل وصلصة الزعفران الغنية"
    },
    ur: {
      name: "کرسپی پیپر کلیماری",
      description: "کالی مرچ کے میدے میں لپٹے ہوئے کلیماری کے چھلے، سنہری تلے ہوئے، زعفران آیولی کے ساتھ۔",
      taste: "باہر سے خستہ، اندر سے نرم، زعفران کی چٹنی کے ساتھ"
    }
  },
  main_1: {
    ar: {
      name: "برجر لحم واغيو فاخر",
      description: "شريحة لحم واغيو مشوية فاخرة، جبنة تشيدر معتقة ذائبة، مايونيز الترافل، وبصل مكرمل بالبلسميك في خبز بريوش محمص.",
      taste: "لحم بقري عصاري وزبدي للغاية، بصل حلو وحامض، مع لمسة ترافل غنية"
    },
    ur: {
      name: "واگیو بیف برگر",
      description: "پریمیم گرل شدہ واگیو بیف، پگھلا ہوا پرانا چیڈر، ٹرفل میونیز، اور ٹوسٹ شدہ برائوش بن پر کیریملائزڈ پیاز۔",
      taste: "انتہائی رسیلا اور مکھن جیسا بیف، میٹھی پیاز، ٹرفل کا ذائقہ"
    }
  },
  main_2: {
    ar: {
      name: "ستيك ريب آي برستيجينو",
      description: "350 جرام من لحم ريب آي أنجوس المميز، معتق ومطبوخ على الفحم، يقدم مع زبدة الروزماري والهليون المشوي بالثوم.",
      taste: "قشرة مكرملة غنية، دهون تذوب في الفم، زبدة الأعشاب العطرية"
    },
    ur: {
      name: "پریسٹجینو ریبائی اسٹیک",
      description: "350 گرام پریمیم اینگس ریبائی، روسمیری مکھن اور بھنے ہوئے لہسن اسپاریگس کے ساتھ پیش کیا جاتا ہے۔",
      taste: "گہرا کیریملائزڈ کرسٹ، منہ میں پگھلنے والی چربی، خوشبودار جڑی بوٹیوں والا مکھن"
    }
  },
  main_3: {
    ar: {
      name: "ريزوتو المأكولات البحرية بالزعفران",
      description: "أرز أربوريو كريمي مطبوخ ببطء في مرق الزعفران الغني، محشو بروبيان الخليج الطازج، بلح البحر، والكالاماري.",
      taste: "زعفران عطري ترابي ممزوج بالزبدة الغنية والمأكولات البحرية اللذيذة"
    },
    ur: {
      name: "زعفران سی فوڈ ریزوٹو",
      description: "بھرپور زعفرانی یخنی میں آہستہ پکائے گئے کریمی اربوریو چاول، تازہ گلف پران، مسلز اور کلیماری کے ساتھ۔",
      taste: "خوشبودار زعفران، مکھن، سمندری ذائقہ اور بہترین چاول"
    }
  },
  main_4: {
    ar: {
      name: "سلمون داياموند المشوي",
      description: "فيليه سلمون الأطلسي المحمر بصلصة العسل والليمون، يقدم على سرير من الكينوا البرية والسبانخ الصغيرة المقلي.",
      taste: "سلمون طري وغني بصلصة حلوة وحامضة مكرملة، مقترن بكينوا نظيفة وترابية"
    },
    ur: {
      name: "ڈائمنڈ گرل شدہ سالمن",
      description: "اٹلانٹک سالمن فلیٹ، شہد اور لیموں کے گلیز کے ساتھ پین سیئرڈ، جنگلی کوئنو اور پالک کے ساتھ۔",
      taste: "کارملائزڈ میٹھے اور کھٹے گلیز کے ساتھ بہترین سالمن"
    }
  },
  dessert_1: {
    ar: {
      name: "كعكة الفستق المذهلة",
      description: "كعكة إسفنجية رطبة بالفستق مغطاة بموس الشوكولاتة البيضاء الفاخرة والفستق الإيراني المطحون.",
      taste: "نكهة الفستق الغنية والمتوازنة مع حلاوة الشوكولاتة البيضاء الناعمة"
    },
    ur: {
      name: "پستہ سنسیشن کیک",
      description: "پستے کا نرم سپنج کیک جس پر پریمیم سفید چاکلیٹ موس اور کٹے ہوئے ایرانی پستے سجائے گئے ہیں۔",
      taste: "پستے کا ذائقہ سفید چاکلیٹ کی مٹھاس کے ساتھ متوازن"
    }
  },
  dessert_2: {
    ar: {
      name: "قبة الشوكولاتة الذائبة (لافا دوم)",
      description: "كعكة الشوكولاتة البلجيكية الداكنة الغنية بقلب سائل ذائب، تقدم ساخنة مع جيلاتو الفانيليا والتوت الطازج.",
      taste: "تدفق الشوكولاتة الدافئة الغنية متناقض مع جيلاتو الفانيليا الباردة والتوت الطازج"
    },
    ur: {
      name: "چاکلیٹ لاوا ڈوم",
      description: "پگھلے ہوئے مائع کور کے ساتھ بھرپور ڈارک بیلجیئن چاکلیٹ کیک، گرم پیش کیا جاتا ہے، ونیلا جلیٹو اور بیریز کے ساتھ۔",
      taste: "شدید گرم چاکلیٹ کا بہاؤ ٹھنڈی میٹھی ونیلا آئس کریم کے ساتھ متوازن"
    }
  },
  dessert_3: {
    ar: {
      name: "بودينج خبز التمر السعودي",
      description: "بودينج الخبز الدافئ المصنوع من تمر الخلاص المحلي الغني، المنقوع في صلصة بتركوتش المتبلة بالهيل، مغطى بالقشطة.",
      taste: "حلاوة دافئة ولزجة تشبه الكراميل من التمر مع دفء الهيل العطري والقشطة الفاخرة"
    },
    ur: {
      name: "سعودی کھجور بریڈ پڈنگ",
      description: "مقامی خلاص کھجوروں سے بنی گرم بریڈ پڈنگ، الائچی والے بٹر اسکاچ ساس اور بالائی کے ساتھ۔",
      taste: "کھجوروں کی کیریمل جیسی مٹھاس، الائچی کی خوشبو اور بالائی کا ذائقہ"
    }
  },
  drink_1: {
    ar: {
      name: "موهيتو الليمون والنعناع",
      description: "مزيج منعش من عصير الليمون المحلي الطازج، النعناع المطحون، شراب قصب السكر النقي، والمياه الفوارة فوق الثلج المجروش.",
      taste: "حمضيات منعشة يقابلها النعناع النظيف والمنعش مع الفوران"
    },
    ur: {
      name: "لیموں پودینہ موجیتو",
      description: "تازہ لیموں کا رس، کچے پودینے، گنے کے شربت اور سوڈے کا بہترین تروتازہ مرکب۔",
      taste: "پودینے اور لیموں کا تروتازہ ٹھنڈا ذائقہ"
    }
  },
  drink_2: {
    ar: {
      name: "الفوار السعودي الذهبي",
      description: "مزيج الموكتيل التقليدي لدينا من عصير التفاح العضوي، نكتار الخوخ، وعصير العنب الأبيض الفوار، مزين بأوراق النعناع والتفاح.",
      taste: "فوار، بطعم الفواكه، حلاوة متوسطة مع لمسات التفاح والخوخ الأنيقة"
    },
    ur: {
      name: "سعودی اسپارکلنگ گولڈ",
      description: "نامیاتی سیب کے جوس، آڑو کے رس، اور چمکتے ہوئے سفید انگور کے جوس کا ہمارا روایتی موک ٹیل مرکب۔",
      taste: "پھلوں کا چمکتا ہوا ذائقہ، ہلکی مٹھاس"
    }
  },
  drink_3: {
    ar: {
      name: "إسبريسو مزدوج (دبل إسبريسو)",
      description: "جرعة غنية وقوية من الإسبريسو المحضر من حبوب البن العربي الطازجة والمطحونة ذات الجودة العالية.",
      taste: "مر غني، بنكهة المكسرات، قوام كامل مع كريما ذهبية كثيفة"
    },
    ur: {
      name: "ڈبل ایسپریسو",
      description: "تازہ پسی ہوئی عربی کافی بینز سے تیار کردہ کڑوی اور بھرپور ایسپریسو شاٹ۔",
      taste: "گہرا کڑوا، بھرپور، سنہری کریما کے ساتھ"
    }
  }
};

// Localized item helpers
const getLocalizedItem = (item: MenuItem, lang: 'en' | 'ar' | 'ur') => {
  if (lang === 'en') return item;
  const translation = MENU_TRANSLATIONS[item.id]?.[lang];
  return {
    ...item,
    name: translation?.name || item.name,
    description: translation?.description || item.description,
    taste: translation?.taste || item.taste
  };
};

const getLocalizedName = (id: string, defaultName: string, lang: 'en' | 'ar' | 'ur') => {
  if (lang === 'en') return defaultName;
  return MENU_TRANSLATIONS[id]?.[lang]?.name || defaultName;
};

interface CustomerViewProps {
  branches: Branch[];
  menu: MenuItem[];
}

export default function CustomerView({ branches, menu }: CustomerViewProps) {
  // Query parameters simulation state
  const [params, setParams] = useState<{ branch: string; table: string; area: string } | null>(null);

  // States
  const [messages, setMessages] = useState<{
    sender: 'user' | 'ai';
    text: string;
    id: string;
    orderSummary?: {
      items: CartItem[];
      subtotal: number;
      vat: number;
      weight: number;
      total: number;
    };
  }[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Marhaban! Ahlan wa Sahlan! Welcome to Chef AI Restaurant. 🌟 I am your digital waiter and culinary guide today.\n\nI can explain the ingredients, calories, or taste profiles of any dish. Try saying: \"I want something spicy\" or \"What's in the Prestigino Ribeye?\" or simply order directly!\n\nWhat can I prepare for you today?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Voice & TTS states
  const [isListening, setIsListening] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState<'ar-SA' | 'en-US' | 'ur-PK'>('en-US');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [showVoiceSimulation, setShowVoiceSimulation] = useState(false);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ar' | 'ur'>('en');
  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [notes, setNotes] = useState('');
  const [activeMenuCategory, setActiveMenuCategory] = useState('All');

  // Order Flow
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Counter' | 'ApplePay' | 'Mada' | 'CreditCard'>('ApplePay');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  // ---- Loyalty Rewards Program ----
  const [loyaltyPhone, setLoyaltyPhone] = useState('');
  const [loyaltyAccount, setLoyaltyAccount] = useState<{ points: number; tier: string; isNew?: boolean } | null>(null);
  const [loyaltyLookupLoading, setLoyaltyLookupLoading] = useState(false);
  const [redeemPointsEnabled, setRedeemPointsEnabled] = useState(false);
  const [lastLoyaltyResult, setLastLoyaltyResult] = useState<{ pointsEarned: number; pointsRedeemed: number; discountAmount: number; newBalance: number; tier: string } | null>(null);

  // Look up loyalty balance as the guest types their phone number (debounced)
  useEffect(() => {
    const cleaned = loyaltyPhone.replace(/[^\d+]/g, '');
    if (cleaned.length < 8) {
      setLoyaltyAccount(null);
      return;
    }
    setLoyaltyLookupLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/loyalty/${encodeURIComponent(cleaned)}`);
        if (res.ok) {
          const data = await res.json();
          setLoyaltyAccount(data);
        }
      } catch (err) {
        console.error('Loyalty lookup failed', err);
      } finally {
        setLoyaltyLookupLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [loyaltyPhone]);

  const [orderTrackingStatus, setOrderTrackingStatus] = useState<string | null>(null);
  const [showPlacedOrderModal, setShowPlacedOrderModal] = useState<boolean>(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);

  // Guest Rating & Feedback states
  const [guestRating, setGuestRating] = useState<number>(0);
  const [guestComment, setGuestComment] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<boolean>(false);

  // Waiter Call
  const [waiterCallStatus, setWaiterCallStatus] = useState<'none' | 'calling' | 'success'>('none');

  // Interactive Voice Mode & Welcome Notification States
  const [isVoiceMode, setIsVoiceMode] = useState<boolean>(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'speaking' | 'thinking'>('idle');
  const [lastUserSpeech, setLastUserSpeech] = useState<string>('');
  const [lastAiSpeech, setLastAiSpeech] = useState<string>('');
  const [qrNotificationVisible, setQrNotificationVisible] = useState<boolean>(false);
  const [showOrderSummaryModal, setShowOrderSummaryModal] = useState<boolean>(false);

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const activeUtterancesCountRef = useRef<number>(0);
  const isSpeechRecognitionActiveRef = useRef<boolean>(false);

  const handleAllSpeechFinished = () => {
    setVoiceStatus('idle');
    if (isMicSessionActiveRef.current && isVoiceModeRef.current) {
      if (recognitionRef.current) {
        setTimeout(() => {
          if (isSpeechRecognitionActiveRef.current) {
            setVoiceStatus('listening');
            setIsListening(true);
          } else {
            try {
              setVoiceStatus('listening');
              recognitionRef.current.lang = speechLanguageRef.current;
              recognitionRef.current.start();
            } catch (e) {
              console.warn("Auto-start speech error in handleAllSpeechFinished:", e);
            }
          }
        }, 100);
      }
    }
  };

  // Refs for speech loop stability (preventing stale closures)
  const isVoiceModeRef = useRef(isVoiceMode);
  useEffect(() => {
    isVoiceModeRef.current = isVoiceMode;
  }, [isVoiceMode]);

  const [isMicSessionActive, setIsMicSessionActive] = useState(false);
  const isMicSessionActiveRef = useRef(false);
  useEffect(() => {
    isMicSessionActiveRef.current = isMicSessionActive;
  }, [isMicSessionActive]);

  const voiceStatusRef = useRef(voiceStatus);
  useEffect(() => {
    voiceStatusRef.current = voiceStatus;
  }, [voiceStatus]);

  const speechLanguageRef = useRef(speechLanguage);
  useEffect(() => {
    speechLanguageRef.current = speechLanguage;
  }, [speechLanguage]);

  const sendMessageRef = useRef<any>(null);
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  const speakTextRef = useRef<any>(null);
  const selectedVoicesByLangRef = useRef<Record<string, SpeechSynthesisVoice>>({});

  // Pre-load speechSynthesis voices asynchronously to ensure consistency from the first utterance
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      if ('onvoiceschanged' in window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  // Load URL params
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const branch = searchParams.get('branch');
    const table = searchParams.get('table');
    const area = searchParams.get('area');

    if (branch && table && area) {
      setParams({ branch, table, area });
      setQrNotificationVisible(true);
      playChime('new_order');

      const branchName = branches.find(b => b.id === branch)?.name || "Golden Riyadh Branch";
      const branchDisplay = branchName.replace(' Restaurant', '');
      const greetingText = `Welcome to Al-Brazin Restaurant's ${branchDisplay} Branch! How can I help you? I am your digital AI waiter for Table #${table} in the ${area} section. I can suggest dishes, explain ingredients, and help you order. What can I prepare for you today?`;
      setMessages([
        {
          id: 'welcome_qr',
          sender: 'ai',
          text: greetingText
        }
      ]);

      // Trigger non-blocking pre-warm to reduce latency on first customer turn
      fetch('/api/chat/prewarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId: branch, tableNumber: table, area })
      }).catch(err => console.warn('Pre-warm request skipped or failed:', err));
    } else {
      // Setup a robust default table parameters fallback if no parameters are in the URL,
      // preventing any runtime crashes on direct root access and guiding the user.
      const defaultBranch = 'golden';
      const defaultTable = '10';
      const defaultArea = 'VIP';
      setParams({ branch: defaultBranch, table: defaultTable, area: defaultArea });

      const branchName = branches.find(b => b.id === defaultBranch)?.name || "Golden Riyadh Branch";
      const branchDisplay = branchName.replace(' Restaurant', '');
      const greetingText = `Welcome to Al-Brazin Restaurant's ${branchDisplay} Branch! I am your digital AI waiter for Table #${defaultTable} in the ${defaultArea} section. I can suggest dishes, explain ingredients, and help you order. What can I prepare for you today?`;
      setMessages([
        {
          id: 'welcome_default',
          sender: 'ai',
          text: greetingText
        }
      ]);
    }
  }, []);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      
      // Enable continuous real-time recognition with interim results for conversational turn-taking
      rec.continuous = true;
      rec.interimResults = true;
      
      let finalTranscript = '';
      let speechTimeout: any = null;

      rec.onstart = () => {
        isSpeechRecognitionActiveRef.current = true;
        setIsListening(true);
        setVoiceStatus('listening');
        finalTranscript = '';
        if (speechTimeout) {
          clearTimeout(speechTimeout);
        }
      };

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = (finalTranscript + interimTranscript).trim();
        if (currentText) {
          setInputValue(currentText);

          // Interrupt detection: If the customer starts speaking while the AI is speaking, instantly cancel speech
          const isEcho = lastAiSpeech ? (
            lastAiSpeech.toLowerCase().includes(currentText.toLowerCase()) ||
            currentText.toLowerCase().includes(lastAiSpeech.toLowerCase())
          ) : false;

          if (window.speechSynthesis.speaking && !isEcho && currentText.length > 2) {
            console.log("User interruption detected! Cancelling AI speech.");
            window.speechSynthesis.cancel();
            activeUtterancesCountRef.current = 0;
            setVoiceStatus('listening');
          }

          // Clear any active timers to prevent premature triggers during active talking
          if (speechTimeout) clearTimeout(speechTimeout);
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

          // Dynamic end-of-speech detection:
          // Generous silence threshold to prevent premature cutoff and allow comfortable pauses
          const wordCount = currentText.split(/\s+/).length;
          const debounceDelay = wordCount > 5 ? 4000 : 3000;

          speechTimeout = setTimeout(() => {
            console.log("End-of-speech signal validated. Submitting speech:", currentText);
            setVoiceStatus('thinking');
            
            try {
              if (isSpeechRecognitionActiveRef.current) {
                rec.stop();
              }
            } catch (e) {
              console.warn("Manual stop of speech recognition failed:", e);
            }

            setInputValue('');
            setLastUserSpeech(currentText);
            finalTranscript = '';
            sendMessageRef.current(currentText);
          }, debounceDelay);

          silenceTimerRef.current = speechTimeout;
        }
      };

      rec.onerror = (err: any) => {
        console.warn('Speech recognition status:', err?.error || err);
        setIsListening(false);
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        
        // Handle fatal/access/iframe block/permission errors cleanly (excluding non-fatal 'aborted')
        const fatalErrors = ['not-allowed', 'service-not-allowed', 'audio-capture', 'language-not-supported'];
        if (fatalErrors.includes(err?.error) || !err?.error) {
          isMicSessionActiveRef.current = false;
          setIsMicSessionActive(false);
          setTtsEnabled(false);
          setVoiceStatus('idle');
          setShowVoiceSimulation(true);
        }
      };

      rec.onend = () => {
        isSpeechRecognitionActiveRef.current = false;
        setIsListening(false);
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        // Seamless hands-free auto-listening loop
        setTimeout(() => {
          if (isMicSessionActiveRef.current && isVoiceModeRef.current && voiceStatusRef.current !== 'thinking') {
            try {
              if (!isSpeechRecognitionActiveRef.current) {
                rec.lang = speechLanguageRef.current;
                rec.start();
              }
            } catch (e) {
              console.warn("Auto-restart speech error in onend:", e);
            }
          } else if (!isMicSessionActiveRef.current) {
            setVoiceStatus('idle');
          }
        }, 150);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Set initial language from browser locale
  useEffect(() => {
    const browserLang = navigator.language || (navigator as any).userLanguage || '';
    if (browserLang.startsWith('ar')) {
      setLanguage('ar');
      setSpeechLanguage('ar-SA');
    } else if (browserLang.startsWith('ur') || browserLang.startsWith('hi')) {
      setLanguage('ur');
      setSpeechLanguage('ur-PK');
    } else {
      setLanguage('en');
      setSpeechLanguage('en-US');
    }
  }, []);

  // Keep "My Orders" tab updated in real-time via Socket.IO push events,
  // with a slower poll as a safety-net fallback.
  useEffect(() => {
    if (!params) return;

    const fetchTableOrders = async () => {
      try {
        // Public, table-scoped endpoint — does not require staff/admin login
        // and never exposes other tables' orders.
        const res = await fetch(`/api/orders/by-table?branchId=${encodeURIComponent(params.branch)}&table=${encodeURIComponent(params.table)}`);
        if (res.ok) {
          const tableOrders: Order[] = await res.json();
          setPastOrders(tableOrders);
          
          // Also keep currentOrder status synchronized!
          if (currentOrder) {
            const updatedCurrent = tableOrders.find(o => o.id === currentOrder.id);
            if (updatedCurrent) {
              setCurrentOrder(updatedCurrent);
              if (updatedCurrent.status !== orderTrackingStatus) {
                setOrderTrackingStatus(updatedCurrent.status);
                playChime('success');
              }
            }
          } else if (tableOrders.length > 0) {
            // Auto-restore active order if there is one (not served)
            const activeOrder = tableOrders.find(o => o.status !== 'Served');
            if (activeOrder) {
              setCurrentOrder(activeOrder);
              setOrderTrackingStatus(activeOrder.status);
            } else {
              // Otherwise, restore the absolute latest order if it was placed within the last 2 hours
              const latestOrder = tableOrders[0];
              if (latestOrder && (Date.now() - new Date(latestOrder.createdAt).getTime() < 7200000)) {
                setCurrentOrder(latestOrder);
                setOrderTrackingStatus(latestOrder.status);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching table orders:', err);
      }
    };

    fetchTableOrders(); // immediate fetch
    const interval = setInterval(fetchTableOrders, 15000); // fallback safety net
    const onOrderUpdated = () => fetchTableOrders();
    socket.on('order:updated', onOrderUpdated);
    socket.on('order:new', onOrderUpdated);
    return () => {
      clearInterval(interval);
      socket.off('order:updated', onOrderUpdated);
      socket.off('order:new', onOrderUpdated);
    };
  }, [params, currentOrder, orderTrackingStatus]);

  // Apply simulated QR parameters
  const handleSimulateQR = (branch: string, table: string, area: string) => {
    const newUrl = `${window.location.pathname}?branch=${branch}&table=${table}&area=${area}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
    setParams({ branch, table, area });
    playChime('success');
  };

  // Dynamic Suggestion Chips generator based on stock availability and menu categories
  const getDynamicSuggestions = () => {
    const popularItems = menu.filter(m => m.isAvailable !== false);
    const mainDishes = popularItems.filter(m => m.category === 'Mains');
    const beverages = popularItems.filter(m => m.category === 'Drinks');
    const desserts = popularItems.filter(m => m.category === 'Desserts');

    const suggestions = [];

    // 1. A popular main
    if (mainDishes.length > 0) {
      const item = mainDishes[0];
      suggestions.push({
        label: `Order ${item.name} 🥩`,
        text: `I would like to order the ${item.name}.`
      });
    }

    // 2. A popular beverage
    if (beverages.length > 0) {
      const item = beverages[0];
      suggestions.push({
        label: `Ask about ${item.name} 🍹`,
        text: `Tell me about the ${item.name}—what are the ingredients and flavors?`
      });
    }

    // 3. A desserts choice
    if (desserts.length > 0) {
      const item = desserts[0];
      suggestions.push({
        label: `Add ${item.name} 🍮`,
        text: `Please add the ${item.name} to my cart.`
      });
    }

    // 4. Spicy query
    suggestions.push({
      label: "Spicy dishes? 🌶️",
      text: "Can you suggest some spicy dishes from the menu?"
    });

    // 5. Chef recommendations
    suggestions.push({
      label: "✨ Chef Recommendations",
      text: "What do you suggest for a complete luxury dinner experience at Al-Brazin?"
    });

    return suggestions;
  };

  // TTS helper
  const speakText = (text: string, isChunk = true) => {
    try {
      // clean formatting tags/emojis from voice narration for a smoother TTS voice profile
      const cleanText = text.replace(/[\uD800-\uDFFF]./g, '').replace(/[⭐🍔🍟🥤🥩🍮🧁🍰🍷🍷🥂🍽️🛎️🔔✨🌟🌶️]/g, '');
      if (!cleanText.trim()) return;

      activeUtterancesCountRef.current++;
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Warm, highly premium pacing & friendly female pitch tuning
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      if (language === 'ur' || speechLanguage === 'ur-PK') {
        utterance.lang = 'ur-PK';
      } else if (language === 'ar' || speechLanguage === 'ar-SA') {
        utterance.lang = 'ar-SA';
      } else {
        const hasArabic = /[\u0600-\u06FF]/.test(text);
        if (hasArabic) {
          utterance.lang = 'ar-SA';
        } else {
          utterance.lang = 'en-US';
        }
      }

      // Choose premium female voice if available
      const applyVoiceSelection = (vList: SpeechSynthesisVoice[], utt: SpeechSynthesisUtterance) => {
        let targetLang = utt.lang.toLowerCase();
        let langCode = targetLang.split('-')[0];

        // Consistency cache: Check if we have already saved a voice for this language code
        if (selectedVoicesByLangRef.current[langCode]) {
          utt.voice = selectedVoicesByLangRef.current[langCode];
          return;
        }

        let langVoices = vList.filter(v => v.lang.toLowerCase().startsWith(langCode));

        // Dynamic fallback: If no native Urdu voice is pre-installed on the device,
        // use Hindi ('hi') female voices which speak Urdu flawlessly (mutually intelligible spoken languages)
        if (langVoices.length === 0 && langCode === 'ur') {
          langCode = 'hi';
          langVoices = vList.filter(v => v.lang.toLowerCase().startsWith('hi'));
        }
        
        const femaleKeywords = [
          'female', 'woman', 'samantha', 'zira', 'susan', 'hazel', 'nova', 'shona', 'veena', 'moira', 'tessa', 
          'hoda', 'mouna', 'laila', 'mariam', 'fatima', 'leila', 'zeina', 'heera', 'ananya', 'uzma', 'asma', 
          'shabnam', 'google us english', 'microsoft hera', 'zariwah', 'karen', 'moira', 'kalpana', 'sabina', 'swara',
          'dilara', 'nora', 'salma', 'yasmin', 'amina', 'sana', 'reem', 'kamilah', 'naayilah', 'laleh', 'afreen', 'parveen'
        ];
        
        let selectedVoice = langVoices.find(v => {
          const name = v.name.toLowerCase();
          return femaleKeywords.some(keyword => name.includes(keyword));
        });
        
        if (!selectedVoice) {
          selectedVoice = langVoices.find(v => v.name.toLowerCase().includes('female'));
        }
        
        if (!selectedVoice && langVoices.length > 0) {
          selectedVoice = langVoices[0];
        }
        
        if (selectedVoice) {
          utt.voice = selectedVoice;
          // Save to our consistency ref cache!
          selectedVoicesByLangRef.current[langCode] = selectedVoice;
        }
      };

      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          // Listen for system loading voice events
          window.speechSynthesis.onvoiceschanged = () => {
            const loadedVoices = window.speechSynthesis.getVoices();
            applyVoiceSelection(loadedVoices, utterance);
          };
          // Backup polling for fast, responsive first utterance
          let attempts = 0;
          const interval = setInterval(() => {
            const v = window.speechSynthesis.getVoices();
            if (v.length > 0 || attempts > 10) {
              clearInterval(interval);
              if (v.length > 0) {
                applyVoiceSelection(v, utterance);
              }
            }
            attempts++;
          }, 80);
        } else {
          applyVoiceSelection(voices, utterance);
        }
      }

      setVoiceStatus('speaking');
      setLastAiSpeech(text);

      utterance.onend = () => {
        activeUtterancesCountRef.current = Math.max(0, activeUtterancesCountRef.current - 1);
        if (activeUtterancesCountRef.current === 0) {
          handleAllSpeechFinished();
        }
      };

      utterance.onerror = (e) => {
        console.warn('Utterance error:', e);
        activeUtterancesCountRef.current = Math.max(0, activeUtterancesCountRef.current - 1);
        if (activeUtterancesCountRef.current === 0) {
          handleAllSpeechFinished();
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS execution error:', e);
      if (!isChunk) setVoiceStatus('idle');
    }
  };

  useEffect(() => {
    speakTextRef.current = speakText;
  }, [speakText]);

  // Handle send message
  async function sendMessage(overrideText?: string) {
    const textToSend = overrideText || inputValue;
    if (!textToSend.trim() || isTyping) return;

    // Clear any active silence timer to prevent double-sends or collisions
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    // Stop current listening session to prevent overlapping speech capture during thinking/speaking
    if (recognitionRef.current) {
      try {
        if (isSpeechRecognitionActiveRef.current) {
          recognitionRef.current.stop();
        }
      } catch (e) {
        console.warn("Stop recognition on send failed:", e);
      }
    }

    // Cancel any active AI speech synthesis to make sure the AI stops talking when user interacts/sends
    try {
      window.speechSynthesis.cancel();
      activeUtterancesCountRef.current = 0;
    } catch (e) {
      console.warn("Cancel speech synthesis on send failed:", e);
    }

    const userMsg = { sender: 'user' as const, text: textToSend, id: 'user_' + Date.now() };
    setMessages(prev => [...prev, userMsg]);
    if (!overrideText) setInputValue('');
    setIsTyping(true);
    if (isVoiceModeRef.current) {
      setVoiceStatus('thinking');
    }

    // Check if the user is asking to checkout or place an order via voice/chat
    const isCheckoutQuery = /place.*order|check.*out|confirm.*order|buy.*now|طلب|الحساب/i.test(textToSend);
    if (isCheckoutQuery && cart.length > 0) {
      setShowOrderSummaryModal(true);
      setTimeout(() => {
        setIsTyping(false);
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const vat = subtotal * 0.15;
        const weight = cart.reduce((sum, item) => sum + (getItemWeight(item.name) * item.quantity), 0);
        const total = subtotal + vat + (subtotal > 0 ? 10 : 0);
        
        const summaryMsg = {
          sender: 'ai' as const,
          id: 'summary_' + Date.now(),
          text: `I have prepared your order. Here is the summary before placing it directly to our kitchen. Please confirm the details below:`,
          orderSummary: {
            items: [...cart],
            subtotal,
            vat,
            weight,
            total
          }
        };
        setMessages(prev => [...prev, summaryMsg]);
        
        if (ttsEnabled) {
          speakText(`Here is your order summary. Total amount is ${total.toFixed(0)} Saudi Riyals. Portion weight is ${weight} grams. Please click confirm to place your order directly.`);
        } else {
          setVoiceStatus('idle');
        }
      }, 800);
      return;
    }

    // Check if the user is confirming a pending order summary via voice/chat (e.g. "Okay, this is fine", "Looks good", "Yes", "Confirm")
    const isConfirmQuery = /confirm|yes|place.*it|نعم|تأكيد|fine|looks.*good|ok.*fine|perfect|yep|sure/i.test(textToSend);
    const hasPendingSummary = messages.some(m => m.id.startsWith('summary_')) || showOrderSummaryModal || cart.length > 0;
    if (isConfirmQuery && hasPendingSummary && cart.length > 0) {
      setTimeout(() => {
        setIsTyping(false);
        setShowOrderSummaryModal(false);
        handlePlaceOrder();
      }, 500);
      return;
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          cart,
          branchId: params?.branch || 'golden',
          tableNumber: params?.table || '10',
          area: params?.area || 'VIP'
        })
      });

      if (!res.ok) {
        throw new Error('Failed to fetch AI response');
      }

      const contentType = res.headers.get('Content-Type');
      if (contentType && contentType.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        
        // We'll create a temporary AI message ID so we can stream tokens into it
        const aiMsgId = 'ai_stream_' + Date.now();
        setMessages(prev => [...prev, { sender: 'ai', text: '', id: aiMsgId }]);

        let buffer = '';
        let accumulatedText = '';
        let lastSpokenIndex = 0;

        const queueAndSpeakSentences = (text: string, isFinal = false) => {
          // Detect '.', '?', '!', '\n', or Arabic question mark '؟'
          const sentenceEndRegex = /[.?!؟\n]/;
          
          let searchIndex = lastSpokenIndex;
          const sentencesToSpeak: string[] = [];
          
          while (searchIndex < text.length) {
            const char = text[searchIndex];
            if (sentenceEndRegex.test(char)) {
              const sentence = text.substring(lastSpokenIndex, searchIndex + 1).trim();
              if (sentence.length > 0) {
                sentencesToSpeak.push(sentence);
              }
              lastSpokenIndex = searchIndex + 1;
            }
            searchIndex++;
          }

          let remaining = '';
          if (isFinal && lastSpokenIndex < text.length) {
            remaining = text.substring(lastSpokenIndex).trim();
          }

          if (ttsEnabled) {
            // Speak all the complete sentences found in this chunk
            sentencesToSpeak.forEach((sentence, idx) => {
              const isLastOfAll = isFinal && !remaining && (idx === sentencesToSpeak.length - 1);
              speakText(sentence, !isLastOfAll);
            });

            // Speak the remaining text
            if (remaining.length > 0) {
              speakText(remaining, false); // false because it's the absolute last chunk
            }
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() || '';

          for (const block of blocks) {
            if (!block.trim()) continue;

            let eventType = '';
            let dataStr = '';
            const lines = block.split('\n');
            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventType = line.replace('event:', '').trim();
              } else if (line.startsWith('data:')) {
                dataStr = line.replace('data:', '').trim();
              }
            }

            if (eventType === 'text' && dataStr) {
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.clearFirst) {
                  accumulatedText = parsed.text;
                  lastSpokenIndex = 0;
                  window.speechSynthesis.cancel();
                } else {
                  accumulatedText += parsed.text;
                }

                // Update text in real-time
                setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: accumulatedText } : m));
              } catch (e) {
                console.warn('Error parsing text chunk:', e);
              }
            } else if (eventType === 'done' && dataStr) {
              try {
                const parsed = JSON.parse(dataStr);
                setIsTyping(false);

                // Finalize message with correct structure and permanent ID
                setMessages(prev => prev.map(m => m.id === aiMsgId ? { 
                  ...m, 
                  text: parsed.response, 
                  id: 'ai_' + Date.now() 
                } : m));

                if (parsed.updatedCart) {
                  setCart(parsed.updatedCart);
                }

                if (parsed.orderPlacedSignal && parsed.createdOrder) {
                  setCurrentOrder(parsed.createdOrder);
                  setOrderTrackingStatus(parsed.createdOrder.status);
                  setCart([]);
                  setShowPlacedOrderModal(true); // Automatically display the digital bill popup
                  playChime('new_order');
                }

                // Speak the complete cohesive response at once for maximum fluency and zero stuttering
                if (ttsEnabled) {
                  speakText(parsed.response, false);
                } else {
                  handleAllSpeechFinished();
                }
              } catch (e) {
                console.warn('Error parsing done block:', e);
              }
            } else if (eventType === 'error' && dataStr) {
              throw new Error(JSON.parse(dataStr).error || 'Streaming error');
            }
          }
        }
        // Safety fallback: ensure isTyping is set to false when stream reading is complete
        setIsTyping(false);
      } else {
        // Fallback for non-streaming responses
        const data = await res.json();
        setIsTyping(false);
        const aiMsg = { sender: 'ai' as const, text: data.response, id: 'ai_' + Date.now() };
        setMessages(prev => [...prev, aiMsg]);
        
        if (data.updatedCart) {
          setCart(data.updatedCart);
        }

        if (ttsEnabled) {
          speakText(data.response);
        } else {
          handleAllSpeechFinished();
        }
      }
    } catch (err) {
      console.error(err);
      setIsTyping(false);
      handleAllSpeechFinished();
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: 'Sorry, I had a small glitch connecting to my culinary brain. Please try repeating that or add items manually!',
        id: 'error_' + Date.now()
      }]);
    }
  }

  // Toggle listening
  const toggleListening = () => {
    if (!recognitionRef.current) {
      setShowVoiceSimulation(true);
      return;
    }
    if (isMicSessionActive) {
      setIsMicSessionActive(false);
      isMicSessionActiveRef.current = false;
      setTtsEnabled(false);
      try {
        if (isSpeechRecognitionActiveRef.current) {
          recognitionRef.current.stop();
        }
      } catch (err) {
        console.warn('Error stopping recognition:', err);
      }
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        console.warn('Error cancelling speech synthesis:', err);
      }
      setVoiceStatus('idle');
      setIsListening(false);
      playChime('mic_stop');
    } else {
      setIsMicSessionActive(true);
      isMicSessionActiveRef.current = true;
      setTtsEnabled(true);
      try {
        window.speechSynthesis.cancel();
        setVoiceStatus('listening');
        if (!isSpeechRecognitionActiveRef.current) {
          recognitionRef.current.lang = speechLanguage;
          recognitionRef.current.start();
        }
        playChime('mic_start');
      } catch (err) {
        console.warn('Speech recognition start failed:', err);
        setShowVoiceSimulation(true);
      }
    }
  };

  // Call waiter API
  const handleCallWaiter = async () => {
    if (!params) return;
    setWaiterCallStatus('calling');
    try {
      const res = await fetch('/api/waiter-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: params.branch,
          tableNumber: params.table,
          area: params.area
        })
      });

      if (res.ok) {
        setWaiterCallStatus('success');
        playChime('waiter');
        setTimeout(() => setWaiterCallStatus('none'), 4000);
      }
    } catch (err) {
      console.error(err);
      setWaiterCallStatus('none');
    }
  };

  // Manual cart adjustments
  const handleManualAdd = (item: MenuItem) => {
    const existingIndex = cart.findIndex(c => c.menuItemId === item.id);
    let newCart = [...cart];
    if (existingIndex !== -1) {
      newCart[existingIndex].quantity += 1;
    } else {
      newCart.push({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1
      });
    }
    setCart(newCart);
    playChime('success');
  };

  const handleManualQuantity = (menuItemId: string, change: number) => {
    let newCart = [...cart];
    const index = newCart.findIndex(c => c.menuItemId === menuItemId);
    if (index !== -1) {
      newCart[index].quantity += change;
      if (newCart[index].quantity <= 0) {
        newCart.splice(index, 1);
      }
      setCart(newCart);
    }
  };

  // Cart values
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const vatAmount = parseFloat((cartSubtotal * 0.15).toFixed(2));
  const serviceCharge = cartSubtotal > 0 ? 10 : 0; 
  const cartTotal = cartSubtotal + vatAmount + serviceCharge;

  // Loyalty: how many points can actually be redeemed against this order
  // (capped by both the balance available and the subtotal itself -- 10 points = 1 SAR)
  const maxRedeemablePoints = loyaltyAccount
    ? Math.min(loyaltyAccount.points, Math.floor(cartSubtotal / 0.1))
    : 0;
  const loyaltyDiscountPreview = redeemPointsEnabled ? parseFloat((maxRedeemablePoints * 0.1).toFixed(2)) : 0;

  // Checkout submission simulation
  const handlePlaceOrder = async () => {
    if (!params || cart.length === 0) return;
    setCheckoutLoading(true);

    setTimeout(async () => {
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            branchId: params.branch,
            tableNumber: params.table,
            area: params.area,
            items: cart,
            paymentMethod,
            notes,
            customerPhone: loyaltyPhone.trim() ? loyaltyPhone.trim() : undefined,
            redeemPoints: redeemPointsEnabled ? maxRedeemablePoints : undefined
          })
        });

        if (res.ok) {
          const order: Order & { loyalty?: any } = await res.json();
          setCurrentOrder(order);
          setOrderTrackingStatus(order.status);
          setCart([]); 
          setIsCheckoutOpen(false);
          setIsCartOpen(false);
          setCheckoutLoading(false);
          playChime('new_order');
          setShowPlacedOrderModal(true); // Automatically display the digital bill popup

          if (order.loyalty) {
            setLastLoyaltyResult(order.loyalty);
            setLoyaltyAccount({ points: order.loyalty.newBalance, tier: order.loyalty.tier });
          }
          setRedeemPointsEnabled(false);
          
          const branchName = branches.find(b => b.id === params.branch)?.name || 'our restaurant';
          const loyaltyNote = order.loyalty?.pointsEarned
            ? `\n\n⭐ You earned ${order.loyalty.pointsEarned} loyalty points! You now have ${order.loyalty.newBalance} points (${order.loyalty.tier} tier).`
            : '';
          setMessages(prev => [...prev, {
            sender: 'ai',
            text: `🎉 Shukran! Order #${order.id.slice(-4)} has been placed successfully and sent directly to the kitchen at ${branchName}, Table ${params.table}!\n\nI will monitor the progress of your food. You can track it in real-time below. Let me know if you would like anything else!${loyaltyNote}`,
            id: 'placed_' + Date.now()
          }]);
        }
      } catch (err) {
        console.error(err);
        setCheckoutLoading(false);
      }
    }, 1500); // realistic payment gateway latency simulation
  };

  const submitGuestFeedback = async () => {
    if (guestRating === 0 || !params) return;
    setFeedbackSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: params.branch,
          rating: guestRating,
          comment: guestComment
        })
      });
      if (res.ok) {
        setFeedbackSubmitted(true);
        playChime('success');
        setMessages(prev => [...prev, {
          id: 'feedback_' + Date.now(),
          sender: 'ai',
          text: `🌟 Thank you so much for rating us ${guestRating}/5 stars! Your feedback has been received. Our culinary and service teams appreciate your response!`,
        }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // QR Code simulation screen
  if (!params) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.08)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="max-w-md w-full bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
            <Utensils className="w-8 h-8 text-neutral-950" />
          </div>
          
          <h1 className="text-2xl font-bold tracking-tight text-neutral-50">Chef AI Restaurant</h1>
          <p className="text-neutral-400 text-sm mt-1 mb-6">Simulation Launcher: Scan Table QR Code</p>

          <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
            Please select a restaurant branch and dining table area below to simulate scanning a table QR code. This will automatically open the responsive guest web app.
          </p>

          <div className="space-y-4 text-left">
            <div>
              <label className="text-xs font-semibold text-amber-500 uppercase tracking-widest block mb-2">
                1. Golden Restaurant (Riyadh)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => handleSimulateQR('golden', '1', 'Open')}
                  className="bg-neutral-850 hover:bg-amber-600/20 hover:border-amber-500 border border-neutral-700/50 py-2 px-3 rounded-xl text-xs font-medium transition"
                >
                  Table 1 (Open)
                </button>
                <button 
                  onClick={() => handleSimulateQR('golden', '10', 'VIP')}
                  className="bg-neutral-850 hover:bg-amber-600/20 hover:border-amber-500 border border-neutral-700/50 py-2 px-3 rounded-xl text-xs font-medium transition"
                >
                  Table 10 (VIP)
                </button>
                <button 
                  onClick={() => handleSimulateQR('golden', '20', 'Family')}
                  className="bg-neutral-850 hover:bg-amber-600/20 hover:border-amber-500 border border-neutral-700/50 py-2 px-3 rounded-xl text-xs font-medium transition"
                >
                  Table 20 (Fam)
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-amber-500 uppercase tracking-widest block mb-2">
                2. Other Premium Branches
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => handleSimulateQR('diamond', '5', 'VIP')}
                  className="w-full bg-neutral-850 hover:bg-amber-600/20 hover:border-amber-500 border border-neutral-700/50 py-2.5 px-4 rounded-xl text-xs font-medium flex justify-between items-center transition"
                >
                  <span>Diamond Restaurant (Jeddah)</span>
                  <span className="text-[10px] bg-neutral-800 py-0.5 px-2 rounded-full text-neutral-300">Table 5 (VIP)</span>
                </button>
                <button
                  onClick={() => handleSimulateQR('prestigino', '3', 'Open')}
                  className="w-full bg-neutral-850 hover:bg-amber-600/20 hover:border-amber-500 border border-neutral-700/50 py-2.5 px-4 rounded-xl text-xs font-medium flex justify-between items-center transition"
                >
                  <span>Prestigino Restaurant (Khobar)</span>
                  <span className="text-[10px] bg-neutral-800 py-0.5 px-2 rounded-full text-neutral-300">Table 3 (Open)</span>
                </button>
                <button
                  onClick={() => handleSimulateQR('mirage', '16', 'Family')}
                  className="w-full bg-neutral-850 hover:bg-amber-600/20 hover:border-amber-500 border border-neutral-700/50 py-2.5 px-4 rounded-xl text-xs font-medium flex justify-between items-center transition"
                >
                  <span>Mirage Restaurant (Dammam)</span>
                  <span className="text-[10px] bg-neutral-800 py-0.5 px-2 rounded-full text-neutral-300">Table 16 (Fam)</span>
                </button>
                <button
                  onClick={() => handleSimulateQR('al_rashid', '7', 'VIP')}
                  className="w-full bg-neutral-850 hover:bg-amber-600/20 hover:border-amber-500 border border-neutral-700/50 py-2.5 px-4 rounded-xl text-xs font-medium flex justify-between items-center transition"
                >
                  <span>Al Rashid Al Khobar Restaurant</span>
                  <span className="text-[10px] bg-neutral-800 py-0.5 px-2 rounded-full text-neutral-300">Table 7 (VIP)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedBranch = branches.find(b => b.id === params.branch);

  // Sub-Render components for modularity
  const renderMenuAndCartContent = () => (
    <div className="h-full flex flex-col bg-neutral-900/60 backdrop-blur-md">
      {/* Header Tabs */}
      <div className="border-b border-neutral-800 p-4 flex items-center justify-between bg-neutral-900/90 sticky top-0 z-10">
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setIsCartOpen(false);
              setIsMyOrdersOpen(false);
            }}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
              !isCartOpen && !isMyOrdersOpen 
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/10' 
                : 'text-neutral-400 hover:text-neutral-200 bg-neutral-800/40'
            }`}
          >
            {LOCALIZATION[language].exploreMenu}
          </button>
          
          <button
            onClick={() => {
              setIsCartOpen(true);
              setIsMyOrdersOpen(false);
            }}
            className={`relative px-3 py-1.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
              isCartOpen && !isMyOrdersOpen 
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/10' 
                : 'text-neutral-400 hover:text-neutral-200 bg-neutral-800/40'
            }`}
          >
            <span>{LOCALIZATION[language].smartCart}</span>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setIsCartOpen(false);
              setIsMyOrdersOpen(true);
            }}
            className={`relative px-3 py-1.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
              isMyOrdersOpen 
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/10' 
                : 'text-neutral-400 hover:text-neutral-200 bg-neutral-800/40'
            }`}
          >
            <span>{LOCALIZATION[language].myOrders}</span>
            {pastOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-neutral-950 text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                {pastOrders.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center space-x-1.5 text-xs text-amber-500 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full">
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{cartTotal.toFixed(0)} SAR</span>
        </div>
      </div>

      {/* TAB 3: My Orders view */}
      {isMyOrdersOpen ? (() => {
        const cumulativeSubtotal = pastOrders.reduce((sum, order) => {
          return sum + order.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
        }, 0);
        const cumulativeVat = cumulativeSubtotal * 0.15;
        const cumulativeServiceCharge = pastOrders.length > 0 ? 10 : 0;
        const cumulativeGrandTotal = cumulativeSubtotal + cumulativeVat + cumulativeServiceCharge;

        const cumulativeItems: { [name: string]: { price: number; quantity: number; menuItemId?: string } } = {};
        pastOrders.forEach(order => {
          order.items.forEach(item => {
            if (cumulativeItems[item.name]) {
              cumulativeItems[item.name].quantity += item.quantity;
            } else {
              cumulativeItems[item.name] = { 
                price: item.price, 
                quantity: item.quantity,
                menuItemId: item.menuItemId 
              };
            }
          });
        });

        const allServed = pastOrders.length > 0 && pastOrders.every(o => o.status === 'Served');

        return (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {pastOrders.length > 0 && (
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-neutral-950 border border-amber-500/30 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-8 -mt-8" />
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Consolidated Table Bill</h4>
                    <p className="text-xs font-black text-neutral-100 mt-0.5">Table {params?.table || '1'} Total Summary</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                    allServed 
                      ? 'bg-green-500/15 text-green-400 border border-green-500/20' 
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/20 animate-pulse'
                  }`}>
                    {allServed ? 'All Items Served' : 'Active Orders In Preparation'}
                  </span>
                </div>

                {/* Cumulative ordered items */}
                <div className="border-t border-b border-neutral-800/80 py-3 my-2 space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                  {Object.entries(cumulativeItems).map(([name, detail], idx) => (
                    <div key={idx} className="flex justify-between text-xs text-neutral-300">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                        <span>{getLocalizedName(detail.menuItemId || '', name, language)}</span>
                        <strong className="text-amber-500">x{detail.quantity}</strong>
                      </span>
                      <span className="font-mono">{detail.price * detail.quantity} SAR</span>
                    </div>
                  ))}
                </div>

                {/* Totals Breakdown */}
                <div className="grid grid-cols-3 gap-2 py-1.5 text-[10px] text-neutral-400 border-b border-neutral-800/40 mb-3">
                  <div>
                    <span>Subtotal:</span>
                    <strong className="text-neutral-200 block font-mono">{cumulativeSubtotal.toFixed(0)} SAR</strong>
                  </div>
                  <div>
                    <span>VAT (15%):</span>
                    <strong className="text-neutral-200 block font-mono">{cumulativeVat.toFixed(1)} SAR</strong>
                  </div>
                  <div>
                    <span>Service:</span>
                    <strong className="text-neutral-200 block font-mono">{cumulativeServiceCharge.toFixed(0)} SAR</strong>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-neutral-900/60 px-3 py-2 rounded-xl border border-neutral-800/80">
                  <span className="text-xs font-bold text-neutral-300">Combined Session Total</span>
                  <span className="text-base font-black text-amber-500 font-mono">{cumulativeGrandTotal.toFixed(0)} SAR</span>
                </div>
              </div>
            )}

            <h3 className="text-xs font-black uppercase text-amber-500 tracking-wider mb-2 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" />
              <span>{LOCALIZATION[language].activeOrders}</span>
            </h3>
            
            {pastOrders.length === 0 ? (
              <div className="text-center py-8 bg-neutral-950/40 rounded-2xl border border-neutral-850 p-4">
                <ClipboardList className="w-8 h-8 text-neutral-600 mx-auto mb-2 animate-bounce" />
                <p className="text-xs text-neutral-400 font-medium">{LOCALIZATION[language].noActiveOrders}</p>
              </div>
            ) : (
            <div className="space-y-4">
              {pastOrders.map((order) => {
                const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const vat = subtotal * 0.15;
                const weight = order.items.reduce((sum, item) => sum + (getItemWeight(item.name) * item.quantity), 0);
                
                return (
                  <div key={order.id} className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 shadow-xl space-y-3 relative overflow-hidden">
                    {/* Decorative status accent */}
                    <div className={`absolute top-0 inset-x-0 h-[2.5px] ${
                      order.status === 'Pending' ? 'bg-orange-500' :
                      order.status === 'Cooking' ? 'bg-amber-500' :
                      order.status === 'Ready' ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                    
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-extrabold text-neutral-200">Order #{order.id.slice(-4)}</span>
                        <p className="text-[9px] text-neutral-500 mt-0.5">
                          {LOCALIZATION[language].orderedAt}: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        order.status === 'Pending' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20 animate-pulse' :
                        order.status === 'Cooking' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                        order.status === 'Ready' ? 'bg-green-500/15 text-green-400 border border-green-500/20 animate-bounce' :
                        'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="border-t border-b border-neutral-900/60 py-2.5 space-y-1.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-neutral-300">
                          <span>{getLocalizedName(item.menuItemId, item.name, language)} <strong className="text-amber-500">x{item.quantity}</strong></span>
                          <span>{item.price * item.quantity} SAR</span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-400">
                      <div>
                        <span>{LOCALIZATION[language].totalWeight}:</span>
                        <strong className="text-neutral-200 block">{weight} g</strong>
                      </div>
                      <div>
                        <span>{LOCALIZATION[language].taxVat}:</span>
                        <strong className="text-neutral-200 block">{vat.toFixed(1)} SAR</strong>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between items-center text-xs border-t border-neutral-900/40">
                      <span className="font-bold text-neutral-400">{LOCALIZATION[language].grandTotal}</span>
                      <span className="font-black text-amber-500 text-sm">{order.totalAmount} SAR</span>
                    </div>

                    {/* Timeline Tracker */}
                    <div className="flex items-center justify-between text-[8px] bg-neutral-900/40 p-2 rounded-xl border border-neutral-850">
                      <span className={order.status === 'Pending' ? 'text-orange-400 font-bold' : 'text-neutral-500'}>Pending</span>
                      <ChevronRight className="w-2.5 h-2.5 text-neutral-700" />
                      <span className={order.status === 'Cooking' ? 'text-amber-400 font-bold' : 'text-neutral-500'}>Cooking</span>
                      <ChevronRight className="w-2.5 h-2.5 text-neutral-700" />
                      <span className={order.status === 'Ready' ? 'text-green-500 font-bold' : 'text-neutral-500'}>Ready</span>
                      <ChevronRight className="w-2.5 h-2.5 text-neutral-700" />
                      <span className={order.status === 'Served' ? 'text-blue-400 font-bold' : 'text-neutral-500'}>Served</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        );
      })() : !isCartOpen ? (
        /* TAB 1: Menu List view */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Categories */}
          <div className="px-4 py-2 border-b border-neutral-800 flex space-x-1.5 overflow-x-auto no-scrollbar whitespace-nowrap bg-neutral-950/20">
            {['All', 'Starters', 'Mains', 'Desserts', 'Drinks'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveMenuCategory(cat)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition ${
                  activeMenuCategory === cat 
                    ? 'bg-neutral-800 border border-amber-500/30 text-amber-400' 
                    : 'text-neutral-400 hover:text-neutral-200 bg-transparent border border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid Item Cards */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {menu
              .filter(item => activeMenuCategory === 'All' || item.category === activeMenuCategory)
              .filter(item => {
                // If a branch is selected in URL, only show items assigned to this branch OR global items
                if (!params?.branch) return true;
                return !item.branchIds || item.branchIds.length === 0 || item.branchIds.includes(params.branch);
              })
              .map(rawItem => {
                const item = getLocalizedItem(rawItem, language);
                return (
                  <div 
                    key={item.id}
                    className={`bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700 rounded-2xl overflow-hidden p-3 flex space-x-3 transition group relative ${item.isAvailable === false ? 'opacity-40' : ''}`}
                  >
                    {item.image && (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0 relative">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        {item.isSpicy && (
                          <span className="absolute top-1 right-1 bg-red-600/90 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center space-x-0.5 shadow">
                            <Flame className="w-2.5 h-2.5 fill-white text-white" />
                            <span>SPICY</span>
                          </span>
                        )}
                        
                        {/* Sold Out Overlay */}
                        {item.isAvailable === false && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-[8px] font-black bg-red-950/95 border border-red-500/30 text-red-500 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              SOLD OUT
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-neutral-100 text-xs truncate pr-2">{item.name}</h4>
                          <span className="text-amber-400 font-extrabold text-xs whitespace-nowrap">{item.price} SAR</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 line-clamp-2 mt-0.5 leading-relaxed">{item.description}</p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800/60">
                        <span className="text-[9px] text-neutral-500 font-medium">
                          🔥 {item.calories} cal • {item.taste.split(' ')[0]}
                        </span>
                        
                        <div className="flex space-x-1">
                          <button
                            onClick={() => {
                              sendMessage(`Tell me more about the ${item.name}—what's the taste and ingredients like?`);
                              setIsMenuDrawerOpen(false); 
                            }}
                            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-400 hover:text-amber-400 text-[9px] font-semibold transition cursor-pointer"
                          >
                            Ask AI
                          </button>
                          <button
                            onClick={() => handleManualAdd(rawItem)}
                            disabled={item.isAvailable === false}
                            className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[9px] font-black tracking-tight transition disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {item.isAvailable === false ? 'Sold Out' : '+ Add'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        /* TAB 2: Cart Panel View */
        <div className="flex-1 flex flex-col overflow-hidden">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-500">
              <ShoppingBag className="w-12 h-12 stroke-1 text-neutral-700 mb-2 animate-pulse" />
              <p className="text-sm">Your Smart Cart is empty.</p>
              <p className="text-xs text-neutral-600 mt-1 max-w-xs mx-auto">
                Tell Chef AI what you are craving, and he will add it to your order automatically!
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Cart Items list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.map((item) => (
                  <div 
                    key={item.menuItemId}
                    className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div>
                      <h5 className="font-bold text-neutral-100 text-xs">{getLocalizedName(item.menuItemId, item.name, language)}</h5>
                      <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">
                        {item.price} SAR • Total: {item.price * item.quantity} SAR
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleManualQuantity(item.menuItemId, -1)}
                        className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-neutral-200 min-w-[16px] text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleManualQuantity(item.menuItemId, 1)}
                        className="p-1 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-400 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleManualQuantity(item.menuItemId, -999)}
                        className="p-1 rounded hover:bg-red-500/10 text-neutral-500 hover:text-red-500 cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order summary section */}
              <div className="p-4 bg-neutral-900 border-t border-neutral-800 space-y-3">
                <div className="space-y-1.5 text-xs text-neutral-400 border-b border-neutral-800 pb-3">
                  <div className="flex justify-between">
                    <span>{LOCALIZATION[language].subtotal}</span>
                    <span className="text-neutral-200">{cartSubtotal} SAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{LOCALIZATION[language].vat}</span>
                    <span className="text-neutral-200">{vatAmount} SAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{LOCALIZATION[language].serviceCharge}</span>
                    <span className="text-neutral-200">{serviceCharge} SAR</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-neutral-100 pt-1">
                    <span className="text-amber-500">{LOCALIZATION[language].totalAmount}</span>
                    <span className="text-amber-500">{cartTotal.toFixed(0)} SAR</span>
                  </div>
                </div>

                {/* Add special chef request/note */}
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">
                    {LOCALIZATION[language].kitchenNotes}
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={LOCALIZATION[language].notesPlaceholder}
                    className="w-full bg-neutral-850 border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 placeholder-neutral-600"
                  />
                </div>

                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black tracking-wide text-xs py-3 rounded-xl transition shadow-lg shadow-amber-500/10 flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{LOCALIZATION[language].confirmPlaceOrder}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col lg:flex-row relative">
      {/* Background ambient mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(217,119,6,0.03)_0%,transparent_50%)] pointer-events-none" />

      {/* Elegant Slide-In QR Code Connection Notification */}
      <AnimatePresence>
        {qrNotificationVisible && params && (
          <motion.div 
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            className="fixed top-4 inset-x-4 max-w-md mx-auto bg-gradient-to-r from-amber-950 via-neutral-900 to-amber-950/90 border border-amber-500/40 rounded-2xl p-4 shadow-2xl shadow-amber-500/10 z-50 overflow-hidden"
          >
            {/* Decorative corner lights */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-amber-600/10 rounded-full blur-xl" />

            <div className="flex items-start space-x-3.5 relative z-10">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center animate-pulse flex-shrink-0">
                <Bell className="w-5 h-5 text-amber-500 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">
                  Digital Table Connection Live
                </h4>
                <p className="text-[11px] text-neutral-300 font-semibold mt-0.5">
                  Welcome to Al-Brazin Restaurant Group!
                </p>
                <p className="text-[10px] text-neutral-400 mt-0.5 leading-normal">
                  Connected to <span className="text-neutral-200 font-bold">{branches.find(b => b.id === params.branch)?.name || "Golden Riyadh Branch"}</span>, Table <span className="text-amber-500 font-extrabold">#{params.table}</span> in the <span className="text-neutral-200 font-medium">{params.area}</span> section.
                </p>
                <p className="text-[10px] text-amber-500/90 italic font-medium mt-1">
                  "AI Waiter is prepared & ready to serve your food!"
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => {
                      setQrNotificationVisible(false);
                      setTtsEnabled(true);
                      setIsVoiceMode(true);
                      setIsMicSessionActive(true);
                      isMicSessionActiveRef.current = true;
                      const branchName = branches.find(b => b.id === params.branch)?.name || "Golden Branch Restaurant";
                      const welcomeMsg = getWelcomeMessage(branchName, params.table || '1', language);
                      
                      const welcomeId = 'welcome_custom_' + Date.now();
                      setMessages(prev => [
                        { id: welcomeId, sender: 'ai' as const, text: welcomeMsg },
                        ...prev.filter(m => !m.id?.startsWith('welcome'))
                      ]);

                      setTimeout(() => {
                        speakText(welcomeMsg);
                      }, 300);
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition shadow-md shadow-amber-500/10 cursor-pointer flex items-center gap-1.5"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Talk Directly to AI</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setQrNotificationVisible(false);
                      setTtsEnabled(false);
                      setIsVoiceMode(false);
                      setIsMicSessionActive(false);
                      isMicSessionActiveRef.current = false;
                      const branchName = branches.find(b => b.id === params.branch)?.name || "Golden Branch Restaurant";
                      const welcomeMsg = getWelcomeMessage(branchName, params.table || '1', language);
                      const welcomeId = 'welcome_custom_' + Date.now();
                      setMessages(prev => [
                        { id: welcomeId, sender: 'ai' as const, text: welcomeMsg },
                        ...prev.filter(m => !m.id?.startsWith('welcome'))
                      ]);
                    }}
                    className="bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-[10px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    Use Chat Only
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setQrNotificationVisible(false)}
                className="p-1 text-neutral-500 hover:text-neutral-300 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT: Customer Chat Waiter System */}
      <div className="flex-1 flex flex-col border-r border-neutral-900 relative">
        {/* Customer Header */}
        <header className="bg-black/40 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-lg">
          <div className="flex items-center space-x-3">
            {/* Signature Brand Block */}
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-orange-glow">
              <span className="font-bold text-black text-xl">P</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-sm text-neutral-100 uppercase tracking-tight">
                  {LOCALIZATION[language].brandName}
                </h2>
                <span className="text-[8px] bg-green-500/15 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide">
                  {LOCALIZATION[language].liveWaiter}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400">
                {selectedBranch?.name || 'Riyadh Branch'} • <span className="text-amber-500 font-bold">{LOCALIZATION[language].table} {params?.table || '12'}</span> • <span className="text-neutral-500 font-medium">{params?.area || 'VIP'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language Switcher Dropdown */}
            <div className="relative group">
              <button className="py-1.5 px-2.5 rounded-full text-[11px] font-black bg-neutral-800 hover:bg-neutral-750 border border-white/10 text-neutral-200 flex items-center space-x-1.5 transition cursor-pointer">
                <span>🌐</span>
                <span className="uppercase">{language}</span>
              </button>
              <div className="absolute right-0 mt-1 w-28 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-50">
                <button
                  onClick={() => {
                    setLanguage('en');
                    setSpeechLanguage('en-US');
                    playChime('success');
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-neutral-800 hover:text-amber-400 transition flex items-center space-x-2 ${
                    language === 'en' ? 'text-amber-500 font-bold' : 'text-neutral-400'
                  }`}
                >
                  <span>🇺🇸</span>
                  <span>English</span>
                </button>
                <button
                  onClick={() => {
                    setLanguage('ar');
                    setSpeechLanguage('ar-SA');
                    playChime('success');
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-neutral-800 hover:text-amber-400 transition flex items-center space-x-2 ${
                    language === 'ar' ? 'text-amber-500 font-bold' : 'text-neutral-400'
                  }`}
                >
                  <span>🇸🇦</span>
                  <span>العربية</span>
                </button>
                <button
                  onClick={() => {
                    setLanguage('ur');
                    setSpeechLanguage('ur-PK');
                    playChime('success');
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-neutral-800 hover:text-amber-400 transition flex items-center space-x-2 ${
                    language === 'ur' ? 'text-amber-500 font-bold' : 'text-neutral-400'
                  }`}
                >
                  <span>🇵🇰</span>
                  <span>اردو</span>
                </button>
              </div>
            </div>

            {/* Live Voice AI direct talk button */}
            <button
              onClick={() => {
                setTtsEnabled(true);
                setIsVoiceMode(true);
                setIsMicSessionActive(true);
                isMicSessionActiveRef.current = true;
                const branchName = selectedBranch?.name || "Golden Riyadh Branch";
                
                // Multilingual welcome message
                const welcomeMsg = getWelcomeMessage(branchName, params?.table || '1', language);
                
                const welcomeId = 'welcome_custom_' + Date.now();
                setMessages(prev => [
                  { id: welcomeId, sender: 'ai' as const, text: welcomeMsg },
                  ...prev.filter(m => !m.id?.startsWith('welcome'))
                ]);
                speakText(welcomeMsg);
              }}
              className="py-1.5 px-3 rounded-full text-[11px] font-black bg-amber-500 hover:bg-amber-400 text-neutral-950 flex items-center space-x-1.5 transition cursor-pointer shadow-md shadow-amber-500/10"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{LOCALIZATION[language].talkWithAi}</span>
            </button>

            {/* Active Bill / Digital Receipt button */}
            {currentOrder && (
              <button
                onClick={() => setShowPlacedOrderModal(true)}
                className="py-1.5 px-3 rounded-full text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition flex items-center space-x-1 cursor-pointer"
              >
                <Receipt className="w-3 h-3" />
                <span>🧾 Bill: {(currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.15 + 10).toFixed(0)} SAR</span>
              </button>
            )}

            {/* Waiter button */}
            <button
              onClick={handleCallWaiter}
              disabled={waiterCallStatus === 'calling'}
              className={`py-1.5 px-3 rounded-full text-[11px] font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                waiterCallStatus === 'success' 
                  ? 'bg-green-600 text-white border border-green-500/20 shadow-green-glow' 
                  : 'bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-amber-400 border border-white/10'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>
                {waiterCallStatus === 'calling' && LOCALIZATION[language].callingWaiter}
                {waiterCallStatus === 'success' && LOCALIZATION[language].waiterCalled}
                {waiterCallStatus === 'none' && LOCALIZATION[language].callWaiter}
              </span>
            </button>

            {/* Menu icon drawer trigger (Mobile only) */}
            <button
              onClick={() => setIsMenuDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-neutral-800 border border-white/10 text-neutral-100 hover:bg-neutral-750 cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Simulated QR clear */}
            <button 
              onClick={() => {
                window.history.pushState({}, '', window.location.pathname);
                setParams(null);
              }}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 cursor-pointer"
              title="Reset Table QR Simulation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Live Order Tracker Banner (If Order Active) */}
        {currentOrder && (
          <div className="bg-gradient-to-r from-amber-950/40 via-amber-900/10 to-neutral-900 border-b border-amber-900/30 p-3 flex flex-col sm:flex-row items-center justify-between gap-2 z-20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Utensils className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-200">
                  Tracking Order <span className="text-amber-500 font-bold">#{currentOrder.id.slice(-4)}</span>
                </p>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    currentOrder.status === 'Pending' ? 'bg-orange-500 animate-pulse' :
                    currentOrder.status === 'Cooking' ? 'bg-amber-500 animate-pulse' :
                    currentOrder.status === 'Ready' ? 'bg-green-500 animate-bounce' : 'bg-blue-500'
                  }`} />
                  <span className="text-[10px] text-neutral-400">
                    Status: <strong className="text-neutral-200 uppercase">{currentOrder.status}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Tracker Timeline */}
            <div className="flex items-center space-x-1 text-[9px] bg-neutral-950/80 px-2 py-0.5 rounded-full border border-neutral-800">
              <span className={currentOrder.status === 'Pending' ? 'text-amber-400 font-bold' : 'text-neutral-500'}>Pending</span>
              <ChevronRight className="w-3 h-3 text-neutral-600" />
              <span className={currentOrder.status === 'Cooking' ? 'text-amber-400 font-bold' : 'text-neutral-500'}>Cooking</span>
              <ChevronRight className="w-3 h-3 text-neutral-600" />
              <span className={currentOrder.status === 'Ready' ? 'text-amber-400 font-bold' : 'text-neutral-500'}>Ready</span>
              <ChevronRight className="w-3 h-3 text-neutral-600" />
              <span className={currentOrder.status === 'Served' ? 'text-green-500 font-bold' : 'text-neutral-500'}>Served</span>
            </div>
          </div>
        )}

        {/* Live Guest Rating Prompt once Order is Served */}
        {currentOrder && currentOrder.status === 'Served' && !feedbackSubmitted && (
          <div className="mx-4 mt-4 bg-neutral-900 border border-green-500/20 rounded-2xl p-4 shadow-xl text-center relative overflow-hidden animate-fade-in z-20">
            <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-green-500 to-emerald-400" />
            <h4 className="text-xs font-black uppercase text-green-400 tracking-widest flex items-center justify-center gap-1.5 mb-1">
              <Smile className="w-4 h-4 text-green-400 animate-pulse" />
              <span>Rate Your Dining Experience!</span>
            </h4>
            <p className="text-[10px] text-neutral-400 mb-3">Your luxury order is served. Please share your rating with our chefs & AI Concierge!</p>
            
            <div className="flex items-center justify-center gap-3 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setGuestRating(star)}
                  className="hover:scale-125 transition transform duration-150 cursor-pointer"
                >
                  <Sparkles 
                    className={`w-6 h-6 transition ${
                      guestRating >= star ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'text-neutral-750'
                    }`} 
                  />
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Write quick comments (e.g., Delicious steak, helpful AI suggestions!)"
                value={guestComment}
                onChange={(e) => setGuestComment(e.target.value)}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-[11px] focus:outline-none focus:border-green-500 text-white font-medium"
              />
              <button
                onClick={submitGuestFeedback}
                disabled={guestRating === 0 || feedbackSubmitting}
                className="bg-green-500 hover:bg-green-400 disabled:opacity-40 text-neutral-950 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition cursor-pointer flex items-center justify-center"
              >
                {feedbackSubmitting ? '...' : 'Submit'}
              </button>
            </div>
          </div>
        )}

        {/* Messages list container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex flex-col space-y-2 max-w-[85%]">
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-tr from-amber-600 to-amber-500 text-neutral-950 font-bold rounded-br-none'
                      : 'bg-neutral-900 border border-neutral-800/80 text-neutral-200 rounded-bl-none whitespace-pre-wrap'
                  }`}>
                    {msg.text}
                  </div>
                  
                  {msg.orderSummary && (
                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 shadow-xl space-y-3 mt-1.5 border-dashed border-amber-500/30">
                      <div className="flex items-center space-x-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
                        <span>📝</span>
                        <span>{LOCALIZATION[language].orderSummary}</span>
                      </div>
                      
                      <div className="space-y-2 border-b border-neutral-900 pb-2">
                        {msg.orderSummary.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-neutral-300">
                            <span>
                              {getLocalizedName(item.menuItemId, item.name, language)} <strong className="text-amber-500 font-bold">x{item.quantity}</strong>
                            </span>
                            <span>{item.price * item.quantity} SAR</span>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-400">
                        <div>
                          <span>{LOCALIZATION[language].totalWeight}:</span>
                          <strong className="text-neutral-200 block">{msg.orderSummary.weight} g</strong>
                        </div>
                        <div>
                          <span>{LOCALIZATION[language].taxVat}:</span>
                          <strong className="text-neutral-200 block">{msg.orderSummary.vat.toFixed(1)} SAR</strong>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-neutral-900">
                        <span className="text-neutral-400">{LOCALIZATION[language].grandTotal}</span>
                        <span className="text-amber-500 text-base font-black">{msg.orderSummary.total.toFixed(0)} SAR</span>
                      </div>

                      {cart.length > 0 ? (
                        <button
                          onClick={() => handlePlaceOrder()}
                          className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black py-2.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer shadow-lg shadow-amber-500/10"
                        >
                          <span>{LOCALIZATION[language].confirmPlaceOrder}</span>
                        </button>
                      ) : (
                        <div className="w-full bg-neutral-900 border border-neutral-800 text-center text-[11px] text-neutral-400 py-2 rounded-xl font-medium">
                          ✓ Order Placed
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl rounded-bl-none px-4 py-2.5 text-sm flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2 border-t border-neutral-900/60 overflow-x-auto whitespace-nowrap flex space-x-2 no-scrollbar bg-neutral-950/40">
          {getDynamicSuggestions().map((suggestion, idx) => (
            <button 
              key={idx}
              onClick={() => sendMessage(suggestion.text)}
              className="text-[10px] bg-neutral-900 border border-neutral-800 hover:border-amber-500 hover:text-amber-400 py-1.5 px-3 rounded-full text-neutral-300 font-semibold transition flex-shrink-0 cursor-pointer"
            >
              {suggestion.label}
            </button>
          ))}
        </div>

        {/* Chat Inputs & Microphone controls */}
        <div className="p-4 bg-neutral-900 border-t border-neutral-800 z-10 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] text-neutral-400 font-semibold">Speech Translation:</span>
              <select
                value={speechLanguage}
                onChange={(e) => setSpeechLanguage(e.target.value as any)}
                className="bg-neutral-850 border border-neutral-700 text-neutral-300 text-[10px] rounded px-1.5 py-0.5 focus:outline-none focus:border-amber-500 font-bold"
              >
                <option value="en-US">English (US)</option>
                <option value="ar-SA">العربية (Saudi)</option>
                <option value="ur-PK">Urdu/Hindi (اردو)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setTtsEnabled(true);
                  setIsVoiceMode(true);
                  setIsMicSessionActive(true);
                  isMicSessionActiveRef.current = true;
                  const branchName = selectedBranch?.name || "Golden Riyadh Branch";
                  const welcomeMsg = getWelcomeMessage(branchName, params?.table || '1', language);
                  const welcomeId = 'welcome_custom_' + Date.now();
                  setMessages(prev => [
                    { id: welcomeId, sender: 'ai' as const, text: welcomeMsg },
                    ...prev.filter(m => !m.id?.startsWith('welcome'))
                  ]);
                  speakText(welcomeMsg);
                }}
                className="flex items-center space-x-1.5 py-1 px-3 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 hover:from-amber-400 hover:to-amber-500 transition shadow-lg shadow-amber-500/10 cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5 animate-bounce" />
                <span>Talk Directly to AI</span>
              </button>

              <button
                onClick={() => {
                  setTtsEnabled(!ttsEnabled);
                  if (!ttsEnabled) {
                    playChime('success');
                    speakText("Voice response activated!");
                  }
                }}
                className={`flex items-center space-x-1 py-1 px-2.5 rounded-full text-[9px] font-extrabold border transition ${
                  ttsEnabled 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                }`}
              >
                {ttsEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                <span>{ttsEnabled ? 'Speak AI: ON' : 'Speak AI: OFF'}</span>
              </button>
            </div>
          </div>
          
          {cart.length > 0 && (
            <div className="mb-3 p-2.5 bg-gradient-to-r from-amber-950/50 via-neutral-900 to-amber-950/50 border border-amber-500/25 rounded-xl flex items-center justify-between text-[11px] shadow-lg">
              <span className="text-neutral-300 font-bold flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                <span>Pending Receipt Amount: <strong className="text-amber-400">{(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.15 + (cart.length > 0 ? 10 : 0)).toFixed(0)} SAR</strong></span>
              </span>
              <button
                onClick={() => setShowOrderSummaryModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black px-3 py-1 rounded-lg text-[9px] uppercase tracking-widest transition cursor-pointer flex items-center gap-1.5"
              >
                <span>View & Pay</span>
                <ChevronRight className="w-3 h-3 stroke-[3]" />
              </button>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleListening}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition border ${
                isMicSessionActive 
                  ? 'bg-red-600 border-red-500 text-white animate-pulse shadow-lg shadow-red-600/20' 
                  : 'bg-neutral-800 hover:bg-neutral-750 border-neutral-700 text-amber-500'
              }`}
              title={isMicSessionActive ? 'Stop Voice Session' : 'Speak Order (Hands-free Voice AI)'}
            >
              {isMicSessionActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={isMicSessionActive ? (isListening ? "Listening... speak now" : "Chef is thinking...") : "Message Chef AI... (e.g. Add a steak and mint drink)"}
              disabled={isListening}
              className="flex-1 bg-neutral-800 border border-neutral-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none transition"
            />

            <button
              onClick={() => sendMessage()}
              disabled={!inputValue.trim() || isTyping}
              className="w-12 h-12 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 rounded-xl flex items-center justify-center text-neutral-950 transition shadow-lg shadow-amber-500/15"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {isListening && (
            <p className="text-[9px] text-red-400 font-extrabold animate-pulse mt-1.5 flex items-center space-x-1 justify-center">
              <span>● Continuous voice capture active... speak now</span>
            </p>
          )}
        </div>
      </div>

      {/* RIGHT: Menu Explorer & Live Cart Panel (Always visible on Desktop) */}
      <div className="hidden lg:w-96 xl:w-[420px] lg:flex flex-col border-l border-neutral-900 bg-neutral-900/40 relative">
        {renderMenuAndCartContent()}
      </div>

      {/* Mobile Drawer wrapper */}
      <AnimatePresence>
        {isMenuDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuDrawerOpen(false)}
              className="absolute inset-0 bg-black"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-[85%] max-w-sm h-full bg-neutral-900 shadow-2xl flex flex-col z-10"
            >
              <div className="absolute top-4 left-4 z-20">
                <button
                  onClick={() => setIsMenuDrawerOpen(false)}
                  className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
              <div className="h-full pt-16">
                {renderMenuAndCartContent()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Cart Trigger Button (Mobile Only) */}
      <div className="lg:hidden fixed bottom-6 right-4 z-40">
        <button
          onClick={() => {
            setIsCartOpen(true);
            setIsMenuDrawerOpen(true); 
          }}
          className="relative w-14 h-14 bg-amber-500 text-neutral-950 rounded-full flex items-center justify-center shadow-2xl shadow-amber-500/30 font-bold hover:scale-105 active:scale-95 transition"
        >
          <ShoppingBag className="w-6 h-6" />
          {cart.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-600 text-white border-2 border-neutral-950 text-[10px] rounded-full flex items-center justify-center font-black animate-bounce">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Checkout Dialog Overlay with payment simulations */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute inset-0 bg-neutral-950"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-neutral-50 flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-amber-500" />
                    <span>Secure Checkout</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Order details for {selectedBranch?.name} • Table {params.table}
                  </p>
                </div>
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 border border-neutral-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Order Cart list summary */}
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-3 mb-4 space-y-2">
                {cart.map(item => (
                  <div key={item.menuItemId} className="flex justify-between text-xs text-neutral-300">
                    <span>{item.name} <strong className="text-amber-500">x{item.quantity}</strong></span>
                    <span>{item.price * item.quantity} SAR</span>
                  </div>
                ))}
                <div className="border-t border-neutral-800 pt-2 flex justify-between text-xs font-black text-amber-400">
                  <span>Grand Total (incl. 15% VAT)</span>
                  <span>{cartTotal.toFixed(0)} SAR</span>
                </div>
              </div>

              {/* Loyalty Rewards Program */}
              <div className="mb-6 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-3">
                <label className="text-[10px] text-amber-500 uppercase tracking-widest font-black flex items-center space-x-1.5 mb-2">
                  <Gift className="w-3.5 h-3.5" />
                  <span>Loyalty Rewards (Optional)</span>
                </label>
                <input
                  type="tel"
                  value={loyaltyPhone}
                  onChange={(e) => setLoyaltyPhone(e.target.value)}
                  placeholder="Mobile number, e.g. 05XXXXXXXX"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />

                {loyaltyLookupLoading && (
                  <p className="text-[10px] text-neutral-500 mt-1.5">Checking balance…</p>
                )}

                {!loyaltyLookupLoading && loyaltyAccount && (
                  <div className="mt-2.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400 flex items-center space-x-1">
                        <Star className="w-3 h-3 text-amber-500" />
                        <span>{loyaltyAccount.isNew ? 'New member' : `${loyaltyAccount.tier} tier`}</span>
                      </span>
                      <span className="font-black text-amber-400">{loyaltyAccount.points} pts available</span>
                    </div>

                    {loyaltyAccount.points >= 10 && (
                      <label className="flex items-center justify-between cursor-pointer bg-neutral-950/60 border border-neutral-800 rounded-lg px-3 py-2">
                        <span className="text-[11px] text-neutral-300 font-semibold">
                          Redeem {maxRedeemablePoints} pts for {loyaltyDiscountPreview.toFixed(2)} SAR off
                        </span>
                        <input
                          type="checkbox"
                          checked={redeemPointsEnabled}
                          onChange={(e) => setRedeemPointsEnabled(e.target.checked)}
                          className="w-4 h-4 accent-amber-500"
                        />
                      </label>
                    )}
                  </div>
                )}

                <p className="text-[9px] text-neutral-500 mt-2">
                  Earn 1 point per 1 SAR spent. Every 10 points = 1 SAR off a future order.
                </p>
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <label className="text-[10px] text-neutral-500 uppercase tracking-widest font-black block mb-2">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('ApplePay')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition ${
                      paymentMethod === 'ApplePay' 
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400' 
                        : 'border-neutral-800 bg-neutral-950/40 text-neutral-400'
                    }`}
                  >
                    <span className="text-base font-bold"> Pay</span>
                    <span className="text-[9px] opacity-70">Tap to Double Click</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('Mada')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition ${
                      paymentMethod === 'Mada' 
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400' 
                        : 'border-neutral-800 bg-neutral-950/40 text-neutral-400'
                    }`}
                  >
                    <span className="text-xs uppercase tracking-wider font-extrabold text-blue-400">mada</span>
                    <span className="text-[9px] opacity-70">Debit Card</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('CreditCard')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition ${
                      paymentMethod === 'CreditCard' 
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400' 
                        : 'border-neutral-800 bg-neutral-950/40 text-neutral-400'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span className="text-[9px] opacity-70">Credit Card</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('Counter')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition ${
                      paymentMethod === 'Counter' 
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400' 
                        : 'border-neutral-800 bg-neutral-950/40 text-neutral-400'
                    }`}
                  >
                    <Utensils className="w-4 h-4 text-yellow-400" />
                    <span className="text-[9px] opacity-70">Pay at Counter</span>
                  </button>
                </div>
              </div>

              {/* Conditional card form simulation */}
              {(paymentMethod === 'Mada' || paymentMethod === 'CreditCard') && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 mb-6 bg-neutral-950/40 p-4 border border-neutral-800 rounded-xl"
                >
                  <div>
                    <label className="text-[9px] text-neutral-500 uppercase font-black block mb-1">Cardholder Name</label>
                    <input 
                      type="text" 
                      value={cardName} 
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="e.g. Fahad Al-Rasheed" 
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-500 uppercase font-black block mb-1">Card Number</label>
                    <input 
                      type="text" 
                      value={cardNumber} 
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                      maxLength={19}
                      placeholder="4000 1234 5678 9010" 
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] text-neutral-500 uppercase font-black block mb-1">Expiry Date</label>
                      <input 
                        type="text" 
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY" 
                        maxLength={5}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-neutral-500 uppercase font-black block mb-1">CVV / Security Code</label>
                      <input 
                        type="password" 
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        maxLength={3}
                        placeholder="***" 
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {paymentMethod === 'ApplePay' && (
                <div className="mb-6 p-3 bg-neutral-950/40 rounded-xl border border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
                    <span>Double Click power button or scan biometric to pay...</span>
                  </div>
                </div>
              )}

              {paymentMethod === 'Counter' && (
                <div className="mb-6 p-3 bg-neutral-950/40 rounded-xl border border-neutral-800 text-xs text-neutral-400 leading-relaxed">
                  You will pay at the cashier desk using Cash or Card upon receiving your served order. The kitchen will immediately begin cooking your order now!
                </div>
              )}

              {/* Confirm submit order */}
              <button
                onClick={handlePlaceOrder}
                disabled={checkoutLoading}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-black tracking-wide text-xs py-3.5 rounded-xl transition shadow-lg shadow-amber-500/10 flex items-center justify-center space-x-2"
              >
                {checkoutLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    <span>Processing Secure Payment...</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>Pay {cartTotal.toFixed(0)} SAR & Submit Order</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VOICE ASSISTANT HELPER & SIMULATOR DIALOG */}
      <AnimatePresence>
        {showVoiceSimulation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVoiceSimulation(false)}
              className="absolute inset-0 bg-neutral-950"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl overflow-hidden z-10"
            >
              {/* Top ambient amber line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <Mic className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-neutral-100 uppercase tracking-wider">Voice AI Assistant</h3>
                    <p className="text-[10px] text-neutral-500 font-mono">WEB SPEECH API CONTROLLER</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowVoiceSimulation(false)}
                  className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Info Box */}
              <div className="mb-4 p-3.5 bg-neutral-950/60 rounded-xl border border-neutral-800/80 text-xs text-neutral-300 leading-relaxed space-y-2">
                <p>
                  <strong className="text-amber-500">How it works:</strong> The Chef AI uses your browser's native <code className="bg-neutral-800 px-1 py-0.5 rounded text-neutral-200">webkitSpeechRecognition</code> or <code className="bg-neutral-800 px-1 py-0.5 rounded text-neutral-200">SpeechRecognition</code> Web APIs to transcribe your voice directly into text commands.
                </p>
                {speechSupported ? (
                  <div className="flex items-center space-x-1.5 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Your browser supports Web Speech Recognition! Ensure mic access is allowed in your browser permissions.</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 text-[10px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Microphone stream restricted by iframe sandbox or unsupported browser. Use our quick simulator below!</span>
                  </div>
                )}
              </div>

              {/* Simulation Segment */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] text-neutral-400 uppercase font-black tracking-wider mb-2">Simulate Speech Order Presets:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { text: "Add 2 cheese beef burgers and a cold lemonade", label: "🍔 Add burger & lemonade" },
                      { text: "I'd like to order a warm appetizer, chocolate cake, and a coffee", label: "🍰 Order multiple items" },
                      { text: "Could you remove the burgers from my card?", label: "❌ Remove items" },
                      { text: "What drinks do you recommend with steak?", label: "🍷 Ask for recommendations" },
                      { text: "Please call the waiter to my table immediately", label: "🛎️ Request human waiter" }
                    ].map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setInputValue(preset.text);
                          setShowVoiceSimulation(false);
                          playChime('success');
                          // Trigger sending the simulated speech
                          sendMessage(preset.text);
                        }}
                        className="text-left w-full bg-neutral-950/40 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/30 rounded-xl px-3.5 py-2.5 transition group"
                      >
                        <div className="text-xs font-bold text-neutral-300 group-hover:text-amber-400 flex items-center justify-between">
                          <span>{preset.label}</span>
                          <span className="text-[9px] text-neutral-500 font-normal">Select</span>
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-0.5 italic group-hover:text-neutral-400 truncate">
                          "{preset.text}"
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-800">
                  <h4 className="text-[10px] text-neutral-400 uppercase font-black tracking-wider mb-2">Or Speak/Type Custom Phrase:</h4>
                  <div className="flex space-x-2">
                    <input 
                      type="text"
                      placeholder="e.g. Can I get a medium well steak with mushroom sauce?"
                      defaultValue=""
                      id="customVoiceInput"
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const target = e.currentTarget as HTMLInputElement;
                          if (target.value.trim()) {
                            setInputValue(target.value);
                            setShowVoiceSimulation(false);
                            playChime('success');
                            sendMessage(target.value);
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const inputEl = document.getElementById('customVoiceInput') as HTMLInputElement;
                        if (inputEl && inputEl.value.trim()) {
                          const customText = inputEl.value.trim();
                          setInputValue(customText);
                          setShowVoiceSimulation(false);
                          playChime('success');
                          sendMessage(customText);
                        }
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-neutral-950 px-4 rounded-xl text-xs font-black transition flex items-center justify-center whitespace-nowrap"
                    >
                      Speak 🎙️
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL SCREEN INTERACTIVE VOICE MODE OVERLAY */}
      <AnimatePresence>
        {isVoiceMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-xl flex flex-col items-center justify-between p-6 overflow-hidden"
          >
            {/* Ambient gold mesh glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* Header: Status and controls */}
            <div className="w-full max-w-lg flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-2 bg-neutral-900/80 border border-neutral-800 px-3.5 py-1.5 rounded-full">
                <span className={`w-2 h-2 rounded-full ${
                  voiceStatus === 'listening' ? 'bg-red-500 animate-pulse' :
                  voiceStatus === 'speaking' ? 'bg-amber-400 animate-bounce' :
                  voiceStatus === 'thinking' ? 'bg-blue-400 animate-spin' : 'bg-neutral-600'
                }`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-300">
                  {voiceStatus === 'listening' && 'Listening to you...'}
                  {voiceStatus === 'speaking' && 'Chef AI Waiter Speaking...'}
                  {voiceStatus === 'thinking' && 'Culinary AI Processing...'}
                  {voiceStatus === 'idle' && 'Voice Standby'}
                </span>
              </div>

              {/* Speech Language selector inside voice UI */}
              <div className="flex items-center space-x-2 bg-neutral-900/80 border border-neutral-800 px-3 py-1 rounded-full">
                <span className="text-[9px] text-neutral-500 font-bold uppercase">Language:</span>
                <select
                  value={speechLanguage}
                  onChange={(e) => setSpeechLanguage(e.target.value as any)}
                  className="bg-transparent border-none text-neutral-200 text-[10px] focus:outline-none focus:ring-0 font-extrabold cursor-pointer"
                >
                  <option value="en-US">🇬🇧 English</option>
                  <option value="ar-SA">🇸🇦 العربية</option>
                  <option value="ur-PK">🇵🇰 اردو</option>
                </select>
              </div>
            </div>

            {/* Middle: Pulsing Golden Audio Wave Visualizer */}
            <div className="flex flex-col items-center justify-center space-y-8 relative z-10 my-auto">
              <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Visualizer Background Ring Orbits */}
                <motion.div 
                  animate={{ 
                    scale: voiceStatus === 'listening' ? [1, 1.2, 1] : 
                           voiceStatus === 'speaking' ? [1, 1.08, 1] : 1,
                    opacity: voiceStatus === 'listening' ? [0.1, 0.3, 0.1] : 0.1
                  }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-full border border-amber-500/20" 
                />
                <motion.div 
                  animate={{ 
                    scale: voiceStatus === 'listening' ? [1, 1.4, 1] : 
                           voiceStatus === 'speaking' ? [1, 1.15, 1] : 1,
                    opacity: voiceStatus === 'listening' ? [0.05, 0.15, 0.05] : 0.05
                  }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 0.5 }}
                  className="absolute inset-0 rounded-full border border-amber-500/10" 
                />

                {/* Central Core Sphere */}
                <div className={`w-36 h-36 rounded-full flex items-center justify-center border transition transform duration-500 relative z-20 ${
                  voiceStatus === 'listening' ? 'bg-gradient-to-tr from-red-600 to-red-500 border-red-500/60 shadow-[0_0_50px_rgba(239,68,68,0.4)] scale-110' :
                  voiceStatus === 'speaking' ? 'bg-gradient-to-tr from-amber-600 to-amber-500 border-amber-400/60 shadow-[0_0_50px_rgba(245,158,11,0.4)] scale-105' :
                  voiceStatus === 'thinking' ? 'bg-gradient-to-tr from-blue-600 to-blue-500 border-blue-400/60 shadow-[0_0_50px_rgba(59,130,246,0.3)]' :
                  'bg-neutral-900 border-neutral-800 shadow-inner'
                }`}>
                  {voiceStatus === 'listening' && <Mic className="w-12 h-12 text-white animate-pulse" />}
                  {voiceStatus === 'speaking' && <Volume2 className="w-12 h-12 text-neutral-950 animate-bounce" />}
                  {voiceStatus === 'thinking' && <Sparkles className="w-12 h-12 text-white animate-spin" />}
                  {voiceStatus === 'idle' && <Mic className="w-12 h-12 text-amber-500" />}
                </div>
              </div>

              {/* Dynamic Subtext instructions and transcripts */}
              <div className="text-center max-w-md px-4 space-y-3">
                <p className="text-neutral-400 text-xs tracking-wide">
                  {voiceStatus === 'listening' && "Go ahead, I'm listening! Tell Chef AI what foods, appetizers, or drinks you want..."}
                  {voiceStatus === 'speaking' && "Chef AI is speaking... (You can speak at any time to interrupt me!)"}
                  {voiceStatus === 'thinking' && "Consulting Al-Brazin's menu rules and inventory..."}
                  {voiceStatus === 'idle' && "Continuous hands-free listening is ready. Say hello!"}
                </p>

                {/* Real-time speech transcription log */}
                {(lastUserSpeech || lastAiSpeech) && (
                  <div className="bg-neutral-900/60 border border-neutral-850 rounded-2xl p-4 text-left space-y-2 mt-4 max-h-40 overflow-y-auto shadow-inner">
                    {lastUserSpeech && (
                      <div className="text-xs">
                        <span className="text-red-400 font-extrabold uppercase mr-1.5">You:</span>
                        <span className="text-neutral-200 font-semibold">{lastUserSpeech}</span>
                      </div>
                    )}
                    {lastAiSpeech && (
                      <div className="text-xs pt-1.5 border-t border-neutral-850">
                        <span className="text-amber-400 font-extrabold uppercase mr-1.5">Chef AI:</span>
                        <span className="text-neutral-300 font-medium">{lastAiSpeech}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="w-full max-w-md flex flex-col items-center space-y-6 relative z-10">
              {/* Prompt Suggestions slider for speech */}
              <div className="w-full overflow-x-auto whitespace-nowrap flex space-x-2 pb-1 no-scrollbar justify-center">
                <button 
                  onClick={() => {
                    const text = "What are your popular main courses?";
                    setLastUserSpeech(text);
                    sendMessage(text);
                  }}
                  className="bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-[10px] text-neutral-300 py-2 px-4 rounded-full transition cursor-pointer"
                >
                  "What's popular?" ⭐
                </button>
                <button 
                  onClick={() => {
                    const text = "Recommend a premium steak and an upscale drink.";
                    setLastUserSpeech(text);
                    sendMessage(text);
                  }}
                  className="bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-[10px] text-neutral-300 py-2 px-4 rounded-full transition cursor-pointer"
                >
                  "Recommend a steak & drink" 🥩
                </button>
                <button 
                  onClick={() => {
                    const text = "Show me the total in my cart.";
                    setLastUserSpeech(text);
                    sendMessage(text);
                  }}
                  className="bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-[10px] text-neutral-300 py-2 px-4 rounded-full transition cursor-pointer"
                >
                  "What's in my cart?" 🛒
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center space-x-8">
                {/* Speaker Mute/Unmute */}
                <button
                  onClick={() => {
                    setTtsEnabled(!ttsEnabled);
                    playChime('success');
                  }}
                  className={`w-12 h-12 rounded-full border flex items-center justify-center transition cursor-pointer ${
                    ttsEnabled ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                  }`}
                  title={ttsEnabled ? 'Mute AI Voice response' : 'Unmute AI Voice response'}
                >
                  {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>

                {/* Main Mic trigger */}
                <button
                  onClick={toggleListening}
                  className={`w-20 h-20 rounded-full flex items-center justify-center border transition duration-300 transform active:scale-95 cursor-pointer ${
                    voiceStatus === 'listening' 
                      ? 'bg-red-600 hover:bg-red-500 border-red-500 shadow-xl shadow-red-600/30' 
                      : 'bg-amber-500 hover:bg-amber-400 border-amber-300 text-neutral-950 shadow-xl shadow-amber-500/20'
                  }`}
                  title="Toggle Microphone"
                >
                  {voiceStatus === 'listening' ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8" />}
                </button>

                {/* Close voice mode */}
                <button
                  onClick={() => {
                    window.speechSynthesis.cancel();
                    if (isListening && recognitionRef.current) {
                      try {
                        if (isSpeechRecognitionActiveRef.current) {
                          recognitionRef.current.stop();
                        }
                      } catch (e) {
                        console.warn(e);
                      }
                    }
                    setIsVoiceMode(false);
                    setVoiceStatus('idle');
                    playChime('mic_stop');
                  }}
                  className="w-12 h-12 rounded-full border bg-neutral-900 border-neutral-800 hover:bg-neutral-850 hover:text-white text-neutral-400 flex items-center justify-center transition cursor-pointer"
                  title="Close Voice Mode"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Symmetrical Footnote info */}
              <div className="text-[10px] text-neutral-600 font-mono tracking-wide uppercase">
                Golden Branch Sync Port • Hands-Free Active
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Elegantly Polished Order Summary Modal (Popup) */}
      <AnimatePresence>
        {showOrderSummaryModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-b from-neutral-900 to-neutral-950 border-2 border-amber-500/40 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl shadow-amber-500/10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-950 via-neutral-900 to-amber-950 p-5 border-b border-amber-500/20 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Receipt className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-amber-400 uppercase tracking-widest">Al-Brazin Order Receipt</h3>
                    <p className="text-[10px] text-neutral-400 font-medium">Table #{params?.table || '10'} • {params?.area || 'VIP'} Area</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOrderSummaryModal(false)}
                  className="p-1.5 rounded-full hover:bg-neutral-850 text-neutral-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                <div className="border-b border-dashed border-neutral-800 pb-3">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Ordered Dishes</span>
                </div>
                
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500 text-xs">
                    Your cart is currently empty.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => {
                      const itemWeight = getItemWeight(item.name) * item.quantity;
                      return (
                        <div key={item.id} className="flex items-start justify-between text-xs py-1">
                          <div className="flex-1 min-w-0 pr-3">
                            <span className="font-bold text-neutral-200">{item.name}</span>
                            <div className="flex items-center space-x-2 mt-0.5 text-[10px] text-neutral-500 font-medium">
                              <span>Qty: {item.quantity}</span>
                              <span>•</span>
                              <span>{itemWeight}g portion</span>
                            </div>
                          </div>
                          <span className="font-mono text-amber-400/90 font-bold">{(item.price * item.quantity).toFixed(0)} SAR</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Receipt Calculations */}
                {cart.length > 0 && (
                  <div className="border-t border-dashed border-neutral-800 pt-4 mt-6 space-y-2 text-xs">
                    <div className="flex justify-between text-neutral-400">
                      <span>Subtotal</span>
                      <span className="font-mono">{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(0)} SAR</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Value Added Tax (VAT 15%)</span>
                      <span className="font-mono">{(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.15).toFixed(0)} SAR</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Delivery / Service Surcharge</span>
                      <span className="font-mono">10 SAR</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Total Estimated Portion Weight</span>
                      <span className="font-mono font-medium text-neutral-300">{cart.reduce((sum, item) => sum + (getItemWeight(item.name) * item.quantity), 0)}g</span>
                    </div>
                    
                    <div className="flex justify-between pt-3 border-t border-neutral-800 text-sm font-black">
                      <span className="text-amber-500 uppercase tracking-widest">Grand Total</span>
                      <span className="text-amber-500 font-mono">
                        {(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.15 + 10).toFixed(0)} SAR
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-6 bg-neutral-950 border-t border-neutral-850 flex flex-col space-y-3">
                {cart.length > 0 && (
                  <button
                    onClick={() => {
                      setShowOrderSummaryModal(false);
                      handlePlaceOrder();
                    }}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black tracking-widest text-xs py-3.5 rounded-xl uppercase transition duration-200 transform active:scale-98 shadow-lg shadow-amber-500/15 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Confirm & Send to Kitchen</span>
                  </button>
                )}
                <button
                  onClick={() => setShowOrderSummaryModal(false)}
                  className="w-full bg-neutral-900 hover:bg-neutral-850 text-neutral-300 font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
                >
                  Close Receipt
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Bill / Placed Order Digital Receipt Modal */}
      <AnimatePresence>
        {showPlacedOrderModal && currentOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-b from-neutral-900 to-neutral-950 border-2 border-amber-500/40 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl shadow-amber-500/10 flex flex-col max-h-[90vh]"
            >
              {/* Receipt Header */}
              <div className="bg-gradient-to-r from-amber-950 via-neutral-900 to-amber-950 p-5 border-b border-amber-500/20 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <CheckCircle className="w-4 h-4 text-emerald-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest">Al-Brazin Digital Receipt</h3>
                    <p className="text-[9px] text-neutral-400 font-medium">Order ID: #{currentOrder.id.slice(-4)} • Table {currentOrder.tableNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPlacedOrderModal(false)}
                  className="p-1.5 rounded-full hover:bg-neutral-850 text-neutral-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Receipt Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {/* Active Info Bar */}
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs text-emerald-400">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    <span>Order Sent to Kitchen</span>
                  </div>
                  <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-emerald-500/20">
                    {currentOrder.status}
                  </span>
                </div>

                {/* Sub-header details */}
                <div className="bg-neutral-950/40 p-3 rounded-xl border border-neutral-800 text-[10px] text-neutral-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Restaurant Branch</span>
                    <span className="text-neutral-200 font-bold">{currentOrder.branchName || 'Al-Brazin Restaurant'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Table & Section</span>
                    <span className="text-neutral-200 font-bold">Table {currentOrder.tableNumber} ({currentOrder.area} Area)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Date & Time</span>
                    <span className="text-neutral-200 font-mono">
                      {new Date(currentOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method</span>
                    <span className="text-neutral-200 font-bold uppercase">{currentOrder.paymentMethod === 'Counter' ? 'Pay at Counter' : currentOrder.paymentMethod}</span>
                  </div>
                </div>

                {/* Items Title */}
                <div className="border-b border-dashed border-neutral-800 pb-2 flex justify-between items-center">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Ordered Items</span>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold font-mono">Price</span>
                </div>

                {/* Ordered Items List */}
                <div className="space-y-3">
                  {currentOrder.items.map((item) => {
                    const itemWeight = getItemWeight(item.name) * item.quantity;
                    return (
                      <div key={item.menuItemId || item.id} className="flex items-start justify-between text-xs">
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-neutral-200">{item.name}</span>
                            <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded font-extrabold">x{item.quantity}</span>
                          </div>
                          <p className="text-[10px] text-neutral-500 font-medium mt-0.5">{itemWeight}g portion • Chef Special</p>
                        </div>
                        <span className="font-mono text-amber-400/90 font-bold">{(item.price * item.quantity).toFixed(0)} SAR</span>
                      </div>
                    );
                  })}
                </div>

                {/* Bill Calculation */}
                <div className="border-t border-dashed border-neutral-800 pt-4 mt-6 space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-400">
                    <span>Subtotal</span>
                    <span className="font-mono">{(currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)).toFixed(0)} SAR</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Value Added Tax (VAT 15%)</span>
                    <span className="font-mono">{(currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.15).toFixed(0)} SAR</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Service & Table Charge</span>
                    <span className="font-mono">10 SAR</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Total Portion Sizing</span>
                    <span className="font-mono font-medium text-neutral-300">{currentOrder.items.reduce((sum, item) => sum + (getItemWeight(item.name) * item.quantity), 0)}g</span>
                  </div>

                  {lastLoyaltyResult && lastLoyaltyResult.pointsRedeemed > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Loyalty Points Redeemed ({lastLoyaltyResult.pointsRedeemed} pts)</span>
                      <span className="font-mono">-{lastLoyaltyResult.discountAmount.toFixed(2)} SAR</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between pt-3 border-t border-neutral-800 text-sm font-black">
                    <span className="text-amber-500 uppercase tracking-widest">Grand Total to Pay</span>
                    <span className="text-amber-500 font-mono">
                      {(currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.15 + 10 - (lastLoyaltyResult?.discountAmount || 0)).toFixed(0)} SAR
                    </span>
                  </div>
                </div>

                {lastLoyaltyResult && lastLoyaltyResult.pointsEarned > 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center space-x-2.5">
                    <Gift className="w-4 h-4 text-amber-400 shrink-0" />
                    <p className="text-[11px] text-amber-300 font-semibold leading-relaxed">
                      You earned <strong className="font-black">{lastLoyaltyResult.pointsEarned} points</strong> from this order — you now have <strong className="font-black">{lastLoyaltyResult.newBalance} points</strong> ({lastLoyaltyResult.tier} tier).
                    </p>
                  </div>
                )}

                {/* Instruction banner */}
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-center space-y-1">
                  <h4 className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Present Screen at Counter to Settle Bill</h4>
                  <p className="text-[9px] text-neutral-400 leading-relaxed font-medium">
                    Please show this digital plate to the receptionist or cashier upon completing your meal. Settle via Cash, ApplePay, or Credit Card.
                  </p>
                </div>

                {/* Simulated Barcode */}
                <div className="flex flex-col items-center justify-center space-y-1 py-1">
                  <div className="flex space-x-[1.5px] h-9 items-center opacity-70">
                    {[1,2,1,3,1,2,3,1,2,1,3,1,3,1,2,1,3,2,1,3,1,2,1,3,2,1,3,1,2].map((w, idx) => (
                      <div key={idx} className="bg-neutral-300 h-full" style={{ width: `${w}px` }} />
                    ))}
                  </div>
                  <span className="text-[8px] font-mono tracking-widest text-neutral-500 uppercase">ALB-{currentOrder.id.slice(-6).toUpperCase()}</span>
                </div>
              </div>

              {/* Receipt Footer Actions */}
              <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowPlacedOrderModal(false);
                    handleCallWaiter();
                  }}
                  className="flex-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/20 text-neutral-300 hover:text-amber-400 font-bold text-xs py-3 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Call Waiter</span>
                </button>
                <button
                  onClick={() => setShowPlacedOrderModal(false)}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs py-3 rounded-xl transition flex items-center justify-center cursor-pointer shadow-md shadow-amber-500/5"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
