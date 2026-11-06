// ---------------------------------------------------------------------------
// Catalogue: categories (= shops in the alley) and products.
// Single source of truth for the 3D scene, the 2D UI, the build-time SEO list
// and scripts/gen-assets.mjs. Keep it free of browser / Vite APIs and of
// TS-only runtime syntax (it is also imported directly by Node).
//
// Images live in /public/products/<productId>/<kind>[-n].jpg — replace the
// generated placeholders with real photos using the same file names.
// ---------------------------------------------------------------------------

export type ShopkeeperKind = 'cat' | 'fanous' | 'person';

export interface Shopkeeper {
  nameAr: string;
  nameEn: string;
  kind: ShopkeeperKind;
  greetingAr: string;
  greetingEn: string;
  /** look of a 'person' placeholder */
  look?: { skin: string; outfit: string; hair?: string; beard?: boolean; fez?: boolean; scarf?: string; glasses?: boolean; cap?: string };
}

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  /** facade + interior wall colour */
  wallColor: string;
  shopkeeper: Shopkeeper;
  /** position along the alley, 0 = first shop */
  order: number;
  side: 'right' | 'left';
  taglineAr: string;
  taglineEn: string;
}

export type ProductType = 'book' | 'bundle' | 'tool' | 'gift';
export type ImageKind = 'cover' | 'back' | 'inside' | 'lifestyle' | 'contents';

export interface ProductImage {
  src: string;
  alt: string;
  kind: ImageKind;
}

export interface Product {
  id: string;
  categoryId: string;
  titleAr: string;
  titleEn: string;
  type: ProductType;
  ageMin: number;
  /** 99 = no upper limit */
  ageMax: number;
  /** EGP. 0 together with quoteOnly = price on request */
  price: number;
  compareAtPrice?: number;
  pages?: number;
  /** e.g. "A4" */
  size?: string;
  paper?: string;
  binding?: string;
  descriptionAr: string;
  descriptionEn: string;
  /** what's in the box (Arabic) */
  contents?: string[];
  contentsEn?: string[];
  characters?: string[];
  images: ProductImage[];
  samplePages?: string[];
  relatedIds?: string[];
  inStock: boolean;
  isNew?: boolean;
  /** not purchasable: "ask for a quote" instead */
  quoteOnly?: boolean;
  /** books / bundles that share a story are suggested together */
  story?: string;
  /** accent for placeholder art and 3D boxes */
  accent: string;
}

// --------------------------------------------------------------- categories
export const CATEGORIES: Category[] = [
  {
    id: 'little',
    nameAr: 'بيت الصغيرين',
    nameEn: 'Little Ones House',
    wallColor: '#F4B860',
    order: 0,
    side: 'right',
    taglineAr: 'كتب تلوين بخطوط عريضة من ٣ لـ ٦ سنين',
    taglineEn: 'Bold-line colouring books for ages 3–6',
    shopkeeper: {
      nameAr: 'بسبوسة',
      nameEn: 'Basbousa',
      kind: 'cat',
      greetingAr: 'مياو! أهلًا يا صغنن، اختار كتابك وأنا هقعد أتفرّج.',
      greetingEn: 'Meow! Hello little one — pick a book and I’ll watch.',
    },
  },
  {
    id: 'adventurers',
    nameAr: 'بيت المغامرين',
    nameEn: 'Adventurers House',
    wallColor: '#3FB8A8',
    order: 1,
    side: 'left',
    taglineAr: 'حكايات وألغاز من ٧ لـ ١٠ سنين',
    taglineEn: 'Stories and puzzles for ages 7–10',
    shopkeeper: {
      nameAr: 'فانوس',
      nameEn: 'Fanous',
      kind: 'fanous',
      greetingAr: 'أهلًا يا مغامر! ضِلّام لسه مستخبي… تعالى نرجّع الألوان سوا.',
      greetingEn: 'Hey adventurer! Dhallam is still hiding… let’s bring the colours back together.',
    },
  },
  {
    id: 'grownups',
    nameAr: 'بيت الكبار',
    nameEn: 'Grown-ups House',
    wallColor: '#E07A63',
    order: 2,
    side: 'right',
    taglineAr: 'تفاصيل القاهرة القديمة للتلوين على رواقة',
    taglineEn: 'Old-Cairo details to colour slowly',
    shopkeeper: {
      nameAr: 'جدو عبده',
      nameEn: 'Grandpa Abdou',
      kind: 'person',
      greetingAr: 'نوّرت يا حبيبي. اقعد، اشرب شاي، ولوّن على مهلك.',
      greetingEn: 'Welcome, my dear. Sit, have some tea and colour at your own pace.',
      look: { skin: '#C98E63', outfit: '#6E6A86', hair: '#EDEDED', beard: true, fez: true },
    },
  },
  {
    id: 'bundles',
    nameAr: 'دكان الباندلز',
    nameEn: 'Bundles Shop',
    wallColor: '#D9A877',
    order: 3,
    side: 'left',
    taglineAr: 'كتاب + ألوان + مفاجآت في علبة واحدة',
    taglineEn: 'Book + colours + surprises in one box',
    shopkeeper: {
      nameAr: 'ليلى',
      nameEn: 'Laila',
      kind: 'person',
      greetingAr: 'أهلًا! كل علبة هنا فيها حكاية وألوان… تحب أساعدك تختار؟',
      greetingEn: 'Hi! Every box here holds a story and colours — want help choosing?',
      look: { skin: '#D9A27A', outfit: '#F06C5B', hair: '#3a2316' },
    },
  },
  {
    id: 'tools',
    nameAr: 'دكان الألوان والأدوات',
    nameEn: 'Colours & Tools Shop',
    wallColor: '#7FA7D9',
    order: 4,
    side: 'right',
    taglineAr: 'ألوان شمع وخشب وبرايات وأساتيك',
    taglineEn: 'Crayons, pencils, sharpeners and erasers',
    shopkeeper: {
      nameAr: 'عم سيّد',
      nameEn: 'Uncle Sayed',
      kind: 'person',
      greetingAr: 'ألوان على كل لون! قولّي بتلوّن إيه وأنا أقولّك تاخد إيه.',
      greetingEn: 'Colours of every colour! Tell me what you colour and I’ll tell you what to take.',
      look: { skin: '#B97E55', outfit: '#2BB3A3', hair: '#2a2a2a', cap: '#1E2A5A' },
    },
  },
  {
    id: 'gifts',
    nameAr: 'دكان الهدايا',
    nameEn: 'Gift Shop',
    wallColor: '#E88E9E',
    order: 5,
    side: 'left',
    taglineAr: 'بوسترات واستيكرز وكروت تتلوّن',
    taglineEn: 'Posters, stickers and colourable cards',
    shopkeeper: {
      nameAr: 'طنط زينب',
      nameEn: 'Auntie Zeinab',
      kind: 'person',
      greetingAr: 'يا أهلًا! هدية صغيرة تفرّح القلب… بص على الكروت دي.',
      greetingEn: 'Welcome! A small gift that warms the heart — look at these cards.',
      look: { skin: '#C98E63', outfit: '#F2A93B', scarf: '#2BB3A3' },
    },
  },
  {
    id: 'schools',
    nameAr: 'ركن الحضانات والمدارس',
    nameEn: 'Nurseries & Schools Corner',
    wallColor: '#A9BFAF',
    order: 6,
    side: 'right',
    taglineAr: 'باكات للفصول وورش تلوين في المدرسة',
    taglineEn: 'Class packs and in-school colouring workshops',
    shopkeeper: {
      nameAr: 'أبلة نادية',
      nameEn: 'Miss Nadia',
      kind: 'person',
      greetingAr: 'أهلًا بحضرتك! عندنا باكات للفصل كله وورش تلوين في المدرسة.',
      greetingEn: 'Welcome! We have packs for a whole class and colouring workshops at school.',
      look: { skin: '#D9A27A', outfit: '#1E2A5A', scarf: '#F06C5B', glasses: true },
    },
  },
];

// ------------------------------------------------------------------ helpers
const BOOK_SPECS = { size: 'A4', paper: 'ورق أوفست ١٢٠ جم', binding: 'دبوس' };
const ADULT_SPECS = { size: '٢٢×٢٢ سم', paper: 'ورق كونكر ١٥٠ جم، وش واحد', binding: 'لزق حراري' };

/** Image list following the /public/products/<id>/ naming convention. */
function images(id: string, title: string, opts: { inside?: number; contents?: boolean; back?: boolean } = {}): ProductImage[] {
  const base = `/products/${id}`;
  const list: ProductImage[] = [{ src: `${base}/cover.jpg`, alt: `${title} — الغلاف`, kind: 'cover' }];
  if (opts.back !== false) list.push({ src: `${base}/back.jpg`, alt: `${title} — ظهر الغلاف`, kind: 'back' });
  for (let i = 1; i <= (opts.inside ?? 0); i++) list.push({ src: `${base}/inside-${i}.jpg`, alt: `${title} — صفحة من جوه ${i}`, kind: 'inside' });
  if (opts.contents) list.push({ src: `${base}/contents.jpg`, alt: `${title} — محتويات العلبة`, kind: 'contents' });
  list.push({ src: `${base}/lifestyle.jpg`, alt: `${title} — صورة أثناء التلوين`, kind: 'lifestyle' });
  return list;
}
const pages = (id: string, n: number) => Array.from({ length: n }, (_, i) => `/products/${id}/inside-${i + 1}.jpg`);

// ----------------------------------------------------------------- products
export const PRODUCTS: Product[] = [
  // 1. بيت الصغيرين
  {
    id: 'nono-lantern', categoryId: 'little', type: 'book', accent: '#F2A93B', story: 'nono',
    titleAr: 'نونو والفانوس', titleEn: 'Nono and the Lantern',
    ageMin: 3, ageMax: 6, price: 70, pages: 24, ...BOOK_SPECS, inStock: true,
    descriptionAr: 'نونو لقت فانوس صغير منوّر على باب البيت، ومشيت وراه في الحارة. رسومات كبيرة وخطوط عريضة على قد إيدين الصغيرين، وكل صفحة فيها حاجة تتلوّن وحاجة تتحكي.',
    descriptionEn: 'Nono finds a tiny glowing lantern by her door and follows it down the alley. Big drawings with bold lines sized for little hands.',
    characters: ['نونو', 'فانوس', 'بسبوسة'],
    images: images('nono-lantern', 'نونو والفانوس', { inside: 4 }), samplePages: pages('nono-lantern', 4),
  },
  {
    id: 'nono-nursery', categoryId: 'little', type: 'book', accent: '#F06C5B', story: 'nono', isNew: true,
    titleAr: 'نونو في الحضانة', titleEn: 'Nono at Nursery',
    ageMin: 3, ageMax: 6, price: 70, pages: 24, ...BOOK_SPECS, inStock: true,
    descriptionAr: 'أول يوم لنونو في الحضانة! صحاب جداد، ألعاب، وشنطة ألوان. كتاب بيطمّن الصغيرين قبل أول يوم.',
    descriptionEn: 'Nono’s first day at nursery! New friends, toys and a bag of colours — a book that reassures little ones before day one.',
    characters: ['نونو', 'أبلة نادية'],
    images: images('nono-nursery', 'نونو في الحضانة', { inside: 3 }), samplePages: pages('nono-nursery', 3),
  },
  {
    id: 'alley-animals', categoryId: 'little', type: 'book', accent: '#2BB3A3',
    titleAr: 'حيوانات الحارة – كلمات عربي/English', titleEn: 'Alley Animals – Arabic/English Words',
    ageMin: 3, ageMax: 6, price: 70, pages: 24, ...BOOK_SPECS, inStock: true,
    descriptionAr: 'القطة والحمامة والحمار والديك… كل حيوان في الحارة باسمه بالعربي والإنجليزي. لوّن واتعلّم كلمة جديدة كل صفحة.',
    descriptionEn: 'The cat, the pigeon, the donkey, the rooster… every alley animal named in Arabic and English. Colour and learn a new word on every page.',
    characters: ['بسبوسة'],
    images: images('alley-animals', 'حيوانات الحارة', { inside: 4 }), samplePages: pages('alley-animals', 4),
  },

  // 2. بيت المغامرين
  {
    id: 'fanous-colors', categoryId: 'adventurers', type: 'book', accent: '#2BB3A3', story: 'fanous',
    titleAr: 'فانوس وليلة سرقة الألوان', titleEn: 'Fanous and the Night the Colours Were Stolen',
    ageMin: 7, ageMax: 10, price: 100, compareAtPrice: 120, pages: 40, ...BOOK_SPECS, inStock: true,
    descriptionAr: 'في ليلة ضلمة، ضِلّام سرق ألوان الحارة كلها! ساعد فانوس يرجّعها صفحة ورا صفحة: ألغاز صغيرة، مشاهد مليانة تفاصيل، ونهاية بتلوّنها إنت.',
    descriptionEn: 'One dark night, Dhallam stole every colour in the alley! Help Fanous bring them back page by page — puzzles, busy scenes and an ending you colour yourself.',
    characters: ['فانوس', 'ضِلّام', 'نونو', 'جدو عبده'],
    images: images('fanous-colors', 'فانوس وليلة سرقة الألوان', { inside: 6 }), samplePages: pages('fanous-colors', 6),
  },
  {
    id: 'fanous-gem', categoryId: 'adventurers', type: 'book', accent: '#F2A93B', story: 'fanous', isNew: true,
    titleAr: 'فانوس في المتحف الكبير – قريبًا', titleEn: 'Fanous at the Grand Museum – Coming soon',
    ageMin: 7, ageMax: 10, price: 100, pages: 40, ...BOOK_SPECS, inStock: false,
    descriptionAr: 'فانوس رايح المتحف المصري الكبير! تماثيل بتتكلم، وكنز ضايع، ولغز لازم يتحل قبل ما المتحف يقفل.',
    descriptionEn: 'Fanous visits the Grand Egyptian Museum! Talking statues, a lost treasure and a riddle to solve before closing time.',
    characters: ['فانوس', 'جدو عبده'],
    images: images('fanous-gem', 'فانوس في المتحف الكبير', { inside: 3 }), samplePages: pages('fanous-gem', 3),
  },
  {
    id: 'ramadan-home', categoryId: 'adventurers', type: 'book', accent: '#6E6A86',
    titleAr: 'رمضان في بيتنا', titleEn: 'Ramadan at Our Home',
    ageMin: 7, ageMax: 10, price: 100, pages: 32, ...BOOK_SPECS, inStock: true,
    descriptionAr: 'زينة وفوانيس وسحور ومسحراتي… شهر رمضان في الحارة بكل تفاصيله، وصفحات لتصميم فانوسك وزينتك بنفسك.',
    descriptionEn: 'Decorations, lanterns, suhoor and the mesaharati — Ramadan in the alley, with pages to design your own lantern and decorations.',
    characters: ['فانوس', 'نونو'],
    images: images('ramadan-home', 'رمضان في بيتنا', { inside: 4 }), samplePages: pages('ramadan-home', 4),
  },

  // 3. بيت الكبار
  {
    id: 'street-story', categoryId: 'grownups', type: 'book', accent: '#F06C5B', story: 'fanous',
    titleAr: 'حكاية شارع – القاهرة القديمة', titleEn: 'Story of a Street – Old Cairo',
    ageMin: 14, ageMax: 99, price: 170, pages: 30, ...ADULT_SPECS, inStock: true,
    descriptionAr: 'مشربيات وأبواب نحاس وبلكونات وقطط الشارع… تفاصيل القاهرة القديمة في ٣٠ تصميم دقيق للتلوين على رواقة، بعيد عن الشاشات.',
    descriptionEn: 'Mashrabiyas, brass doors, balconies and street cats — the details of old Cairo in 30 intricate designs to colour slowly.',
    images: images('street-story', 'حكاية شارع', { inside: 5 }), samplePages: pages('street-story', 5),
  },
  {
    id: 'islamic-patterns', categoryId: 'grownups', type: 'book', accent: '#2BB3A3',
    titleAr: 'زخارف إسلامية', titleEn: 'Islamic Patterns',
    ageMin: 14, ageMax: 99, price: 170, pages: 30, ...ADULT_SPECS, inStock: true,
    descriptionAr: 'نجوم وأرابيسك وزخارف من جوامع ومساجد القاهرة. تصميمات هندسية تهدّي الدماغ.',
    descriptionEn: 'Stars, arabesques and motifs from Cairo’s mosques — geometric designs that calm the mind.',
    images: images('islamic-patterns', 'زخارف إسلامية', { inside: 4 }), samplePages: pages('islamic-patterns', 4),
  },
  {
    id: 'old-egypt', categoryId: 'grownups', type: 'book', accent: '#F2A93B',
    titleAr: 'مصر زمان', titleEn: 'Egypt Back Then',
    ageMin: 14, ageMax: 99, price: 170, pages: 30, ...ADULT_SPECS, inStock: true,
    descriptionAr: 'الترام والسينما القديمة وعربية الفول وإعلانات زمان… رحلة تلوين في ذكريات مصر.',
    descriptionEn: 'The tram, old cinemas, the foul cart and vintage ads — a colouring trip through Egypt’s memories.',
    images: images('old-egypt', 'مصر زمان', { inside: 4 }), samplePages: pages('old-egypt', 4),
  },

  // 4. دكان الباندلز
  {
    id: 'b-first', categoryId: 'bundles', type: 'bundle', accent: '#F2A93B', story: 'nono',
    titleAr: 'باقة أول ألواني', titleEn: 'My First Colours Bundle',
    ageMin: 3, ageMax: 6, price: 150, compareAtPrice: 180, inStock: true,
    contents: ['كتاب نونو والفانوس', '١٢ لون شمع جامبو', 'ستيكر باسم الطفل'],
    contentsEn: ['Nono and the Lantern', '12 jumbo crayons', 'Personalised name sticker'],
    descriptionAr: 'أول علبة ألوان بجد! كتاب نونو والفانوس مع ألوان شمع تخينة سهلة المسك، وستيكر باسم طفلك.',
    descriptionEn: 'A real first colouring kit: Nono and the Lantern, chunky easy-grip crayons and a sticker with your child’s name.',
    characters: ['نونو', 'فانوس'],
    images: images('b-first', 'باقة أول ألواني', { inside: 3, contents: true }), samplePages: pages('b-first', 3),
    relatedIds: ['nono-lantern', 'crayons-jumbo-12', 'b-together', 'stickers'],
  },
  {
    id: 'b-adventurer', categoryId: 'bundles', type: 'bundle', accent: '#2BB3A3', story: 'fanous',
    titleAr: 'باقة المغامر', titleEn: 'The Adventurer Bundle',
    ageMin: 7, ageMax: 10, price: 220, compareAtPrice: 260, inStock: true,
    contents: ['كتاب فانوس وليلة سرقة الألوان', '١٢ قلم ألوان خشب', 'برّاية', 'بوستر A3 للتلوين'],
    contentsEn: ['Fanous and the Night…', '12 coloured pencils', 'Sharpener', 'A3 colouring poster'],
    descriptionAr: 'عدّة المغامرة كاملة: الكتاب، أقلام خشب، برّاية، وبوستر كبير للحارة يلوّنه ويعلّقه في أوضته.',
    descriptionEn: 'The full adventure kit: the book, wooden pencils, a sharpener and a big alley poster to colour and hang.',
    characters: ['فانوس', 'ضِلّام'],
    images: images('b-adventurer', 'باقة المغامر', { inside: 3, contents: true }), samplePages: pages('b-adventurer', 3),
  },
  {
    id: 'b-calm', categoryId: 'bundles', type: 'bundle', accent: '#6E6A86',
    titleAr: 'باقة الهدوء', titleEn: 'The Calm Bundle',
    ageMin: 14, ageMax: 99, price: 350, compareAtPrice: 400, inStock: true,
    contents: ['كتاب حكاية شارع', '٢٤ قلم ألوان', 'بوك مارك', '٣ كروت بوستال للتلوين'],
    contentsEn: ['Story of a Street', '24 coloured pencils', 'Bookmark', '3 colourable postcards'],
    descriptionAr: 'ساعة هدوء ليك لوحدك: حكاية شارع مع ٢٤ لون، بوك مارك، و٣ كروت بوستال تلوّنها وتبعتها لحد بتحبه.',
    descriptionEn: 'An hour of calm just for you: Story of a Street, 24 colours, a bookmark and 3 postcards to colour and send.',
    images: images('b-calm', 'باقة الهدوء', { inside: 3, contents: true }), samplePages: pages('b-calm', 3),
  },
  {
    id: 'b-together', categoryId: 'bundles', type: 'bundle', accent: '#F06C5B', story: 'fanous',
    titleAr: 'باقة لوّنوا سوا', titleEn: 'Colour Together Bundle',
    ageMin: 5, ageMax: 99, price: 450, compareAtPrice: 520, inStock: true,
    contents: ['كتاب الصغار وكتاب الكبار لنفس الحكاية', '٢٤ لون'],
    contentsEn: ['Kids and grown-up editions of the same story', '24 colours'],
    descriptionAr: 'نفس الحكاية بنسختين: نسخة للصغار ونسخة للكبار. اقعدوا على نفس الترابيزة ولوّنوا نفس المشهد كل واحد على طريقته.',
    descriptionEn: 'One story, two editions — sit at the same table and colour the same scene, each in your own way.',
    characters: ['فانوس', 'نونو', 'جدو عبده'],
    images: images('b-together', 'باقة لوّنوا سوا', { inside: 3, contents: true }), samplePages: pages('b-together', 3),
  },

  // 5. دكان الألوان والأدوات
  {
    id: 'crayons-jumbo-12', categoryId: 'tools', type: 'tool', accent: '#F06C5B',
    titleAr: 'ألوان شمع جامبو ١٢', titleEn: 'Jumbo Crayons ×12',
    ageMin: 3, ageMax: 99, price: 40, inStock: true,
    contents: ['١٢ لون شمع جامبو'], contentsEn: ['12 jumbo crayons'],
    descriptionAr: 'ألوان شمع تخينة ما بتتكسرش بسهولة، ألوانها زاهية وآمنة على الصغيرين.',
    descriptionEn: 'Chunky crayons that don’t snap easily — bright and safe for little ones.',
    images: images('crayons-jumbo-12', 'ألوان شمع جامبو', { contents: true, back: false }),
  },
  {
    id: 'pencils-12', categoryId: 'tools', type: 'tool', accent: '#2BB3A3',
    titleAr: 'ألوان خشب ١٢', titleEn: 'Coloured Pencils ×12',
    ageMin: 5, ageMax: 99, price: 45, inStock: true,
    contents: ['١٢ قلم ألوان خشب'], contentsEn: ['12 coloured pencils'],
    descriptionAr: 'علبة ١٢ لون خشب بسن ناعم، مناسبة لكتب المغامرين.',
    descriptionEn: 'A tin of 12 smooth coloured pencils — perfect for the adventure books.',
    images: images('pencils-12', 'ألوان خشب ١٢', { contents: true, back: false }),
  },
  {
    id: 'pencils-24', categoryId: 'tools', type: 'tool', accent: '#1E2A5A',
    titleAr: 'ألوان خشب ٢٤', titleEn: 'Coloured Pencils ×24',
    ageMin: 7, ageMax: 99, price: 95, inStock: true,
    contents: ['٢٤ قلم ألوان خشب'], contentsEn: ['24 coloured pencils'],
    descriptionAr: '٢٤ درجة لون للتفاصيل الدقيقة والتظليل، للمغامرين والكبار.',
    descriptionEn: '24 shades for fine detail and shading — for adventurers and grown-ups.',
    images: images('pencils-24', 'ألوان خشب ٢٤', { contents: true, back: false }),
  },
  {
    id: 'sharpener-eraser', categoryId: 'tools', type: 'tool', accent: '#F2A93B',
    titleAr: 'برايات وأساتيك', titleEn: 'Sharpeners & Erasers',
    ageMin: 3, ageMax: 99, price: 15, inStock: true,
    contents: ['برّاية', 'أستيكة'], contentsEn: ['Sharpener', 'Eraser'],
    descriptionAr: 'برّاية وأستيكة بشكل فانوس صغير. ماحدش يلوّن من غيرهم!',
    descriptionEn: 'A lantern-shaped sharpener and eraser. Nobody colours without them!',
    images: images('sharpener-eraser', 'برايات وأساتيك', { contents: true, back: false }),
  },

  // 6. دكان الهدايا
  {
    id: 'poster-a3', categoryId: 'gifts', type: 'gift', accent: '#2BB3A3', story: 'fanous',
    titleAr: 'بوستر فانوس A3', titleEn: 'Fanous A3 Poster',
    ageMin: 4, ageMax: 99, price: 60, size: 'A3', paper: 'ورق ٢٠٠ جم', inStock: true,
    descriptionAr: 'بوستر كبير لمشهد الحارة مع فانوس، يتلوّن ويتعلّق على الحيطة.',
    descriptionEn: 'A big poster of the alley with Fanous — colour it and hang it up.',
    characters: ['فانوس'],
    images: images('poster-a3', 'بوستر فانوس', { back: false }),
  },
  {
    id: 'stickers', categoryId: 'gifts', type: 'gift', accent: '#F06C5B',
    titleAr: 'استيكرز أهل الحارة', titleEn: 'Alley Folk Stickers',
    ageMin: 3, ageMax: 99, price: 35, inStock: true, isNew: true,
    descriptionAr: 'شيت استيكرز لكل أهل الحارة: فانوس ونونو وجدو عبده وبسبوسة وضِلّام كمان.',
    descriptionEn: 'A sticker sheet of the whole alley crew: Fanous, Nono, Grandpa Abdou, Basbousa — and Dhallam too.',
    characters: ['فانوس', 'نونو', 'جدو عبده', 'بسبوسة', 'ضِلّام'],
    images: images('stickers', 'استيكرز أهل الحارة', { back: false }),
  },
  {
    id: 'postcards-6', categoryId: 'gifts', type: 'gift', accent: '#F2A93B',
    titleAr: 'كروت بوستال تتلوّن ×٦', titleEn: 'Colourable Postcards ×6',
    ageMin: 6, ageMax: 99, price: 50, size: 'A6', inStock: true,
    descriptionAr: '٦ كروت بوستال لمشاهد من القاهرة، لوّنها واكتب على ضهرها وابعتها.',
    descriptionEn: 'Six postcards of Cairo scenes — colour them, write on the back and send.',
    images: images('postcards-6', 'كروت بوستال', {}),
  },
  {
    id: 'bookmark', categoryId: 'gifts', type: 'gift', accent: '#6E6A86',
    titleAr: 'بوكمارك', titleEn: 'Bookmark',
    ageMin: 5, ageMax: 99, price: 20, inStock: true,
    descriptionAr: 'بوكمارك مشربية بشرّابة، يتلوّن ويفضل معاك في كل كتاب.',
    descriptionEn: 'A mashrabiya bookmark with a tassel — colour it and keep it in every book.',
    images: images('bookmark', 'بوكمارك', { back: false }),
  },

  // 7. ركن الحضانات والمدارس
  {
    id: 'pack-10', categoryId: 'schools', type: 'bundle', accent: '#1E2A5A', story: 'nono',
    titleAr: 'باك ١٠ نسخ', titleEn: '10-copy Class Pack',
    ageMin: 3, ageMax: 10, price: 450, compareAtPrice: 700, inStock: true,
    contents: ['١٠ نسخ من كتاب تختاروه'], contentsEn: ['10 copies of a book of your choice'],
    descriptionAr: '١٠ نسخ لفصل كامل، عشان الحكاية تتلوّن جماعة. مناسبة للحضانات والمدارس وورش الأطفال.',
    descriptionEn: 'Ten copies for a whole class, so the story gets coloured together.',
    images: images('pack-10', 'باك ١٠ نسخ', { contents: true, back: false }),
  },
  {
    id: 'pack-20', categoryId: 'schools', type: 'bundle', accent: '#2BB3A3', story: 'nono',
    titleAr: 'باك ٢٠ نسخة', titleEn: '20-copy School Pack',
    ageMin: 3, ageMax: 10, price: 850, compareAtPrice: 1400, inStock: true,
    contents: ['٢٠ نسخة من كتاب تختاروه'], contentsEn: ['20 copies of a book of your choice'],
    descriptionAr: '٢٠ نسخة لفصلين أو لنشاط كبير، بسعر خاص للمدارس.',
    descriptionEn: 'Twenty copies for two classes or a big activity, at a special school price.',
    images: images('pack-20', 'باك ٢٠ نسخة', { contents: true, back: false }),
  },
  {
    id: 'school-workshop', categoryId: 'schools', type: 'gift', accent: '#F06C5B',
    titleAr: 'ورشة تلوين في المدرسة', titleEn: 'Colouring Workshop at School',
    ageMin: 4, ageMax: 12, price: 0, quoteOnly: true, inStock: true,
    descriptionAr: 'بنيجي لحد المدرسة بالكتب والألوان والحكاية، وبنعمل ورشة تلوين وحكي للأطفال. اطلب عرض سعر حسب عدد الأطفال.',
    descriptionEn: 'We come to your school with books, colours and the story for a colouring & storytelling workshop. Ask for a quote.',
    images: images('school-workshop', 'ورشة تلوين في المدرسة', { back: false }),
  },
];

// ------------------------------------------------------------------ lookups
export const categoryById = (id: string | null | undefined) => CATEGORIES.find((c) => c.id === id) ?? null;
export const productById = (id: string | null | undefined) => PRODUCTS.find((p) => p.id === id) ?? null;
export const productsIn = (categoryId: string) => PRODUCTS.filter((p) => p.categoryId === categoryId);
export const sortedCategories = () => [...CATEGORIES].sort((a, b) => a.order - b.order);
export const isPurchasable = (p: Product) => p.inStock && !p.quoteOnly;
export const coverOf = (p: Product) => p.images.find((i) => i.kind === 'cover')?.src ?? p.images[0]?.src;

/** 4 related products: explicit relatedIds first, then same story, then overlapping age. */
export function relatedTo(p: Product, n = 4): Product[] {
  const out: Product[] = [];
  const push = (x: Product | null) => {
    if (x && x.id !== p.id && !out.includes(x) && out.length < n) out.push(x);
  };
  (p.relatedIds ?? []).forEach((id) => push(productById(id)));
  if (p.story) PRODUCTS.filter((x) => x.story === p.story).forEach(push);
  PRODUCTS.filter((x) => x.ageMin <= p.ageMax && x.ageMax >= p.ageMin && x.type !== p.type).forEach(push);
  PRODUCTS.filter((x) => x.ageMin <= p.ageMax && x.ageMax >= p.ageMin).forEach(push);
  return out;
}
