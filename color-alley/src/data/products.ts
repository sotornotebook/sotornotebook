// Single source of truth for the shop catalogue.
// Used by the 3D scene, the 2D UI, the fallback page AND the build-time SEO
// injection in vite.config.ts — so keep this file free of browser/Vite APIs.

export type L10n = { ar: string; en: string };

export type ProductKind = 'book' | 'bundle' | 'pack';

export interface Product {
  id: string;
  /** Text on the hanging shop sign */
  sign: L10n;
  /** Product title shown in the panel */
  title: L10n;
  age: L10n;
  /** Page / design count, or contents line for bundles */
  pages: L10n;
  contents?: L10n;
  description: L10n;
  /** Price in EGP */
  price: number;
  kind: ProductKind;
  /** Accent colour used for the cover, awning and box */
  accent: string;
  /** Placeholder cover — swap the PNG in /public/covers with the real cover */
  cover: string;
  /** For bundles: what to place on the display table */
  extras?: { crayons?: number; pencils?: number; books?: number };
}

export const PRODUCTS: Product[] = [
  {
    id: 'small',
    sign: { ar: 'بيت الصغيرين', en: 'Little Ones House' },
    title: { ar: 'نونو والفانوس', en: 'Nono and the Lantern' },
    age: { ar: '٣–٦ سنين', en: 'Ages 3–6' },
    pages: { ar: '٢٤ صفحة', en: '24 pages' },
    description: {
      ar: 'نونو لقت فانوس صغير منوّر على باب البيت، ومشيت وراه في الحارة. رسومات كبيرة وخطوط عريضة على قد إيدين الصغيرين، وكل صفحة فيها حاجة تتلوّن وحاجة تتحكي.',
      en: 'Nono finds a tiny glowing lantern by her door and follows it down the alley. Big drawings with bold lines sized for little hands — every page has something to colour and something to talk about.',
    },
    price: 70,
    kind: 'book',
    accent: '#F2A93B',
    cover: '/covers/small.png',
  },
  {
    id: 'kids',
    sign: { ar: 'بيت المغامرين', en: 'Adventurers House' },
    title: { ar: 'فانوس وليلة سرقة الألوان', en: 'Fanous and the Night the Colours Were Stolen' },
    age: { ar: '٧–١٠ سنين', en: 'Ages 7–10' },
    pages: { ar: '٤٠ صفحة', en: '40 pages' },
    description: {
      ar: 'في ليلة ضلمة، ضِلّام سرق ألوان الحارة كلها! ساعد فانوس يرجّعها صفحة ورا صفحة: ألغاز صغيرة، مشاهد مليانة تفاصيل، ونهاية بتلوّنها إنت.',
      en: 'One dark night, Dhallam stole every colour in the alley! Help Fanous bring them back page by page — little puzzles, busy scenes full of details, and an ending you colour yourself.',
    },
    price: 100,
    kind: 'book',
    accent: '#2BB3A3',
    cover: '/covers/kids.png',
  },
  {
    id: 'adults',
    sign: { ar: 'بيت الكبار', en: 'Grown-ups House' },
    title: { ar: 'حكاية شارع', en: 'Story of a Street' },
    age: { ar: '+١٤', en: 'Ages 14+' },
    pages: { ar: '٣٠ تصميم', en: '30 designs' },
    description: {
      ar: 'مشربيات وأبواب نحاس وبلكونات وقطط الشارع… تفاصيل القاهرة القديمة في ٣٠ تصميم دقيق للتلوين على رواقة، بعيد عن الشاشات.',
      en: 'Mashrabiyas, brass doors, balconies and street cats — the details of old Cairo in 30 intricate designs to colour slowly, away from screens.',
    },
    price: 170,
    kind: 'book',
    accent: '#F06C5B',
    cover: '/covers/adults.png',
  },
  {
    id: 'b-first',
    sign: { ar: 'دكان أول ألواني', en: 'My First Colours Shop' },
    title: { ar: 'باقة أول ألواني', en: 'My First Colours Bundle' },
    age: { ar: '٣–٦ سنين', en: 'Ages 3–6' },
    pages: { ar: 'كتاب + ١٢ ألوان شمع جامبو + ستيكر بالاسم', en: 'Book + 12 jumbo crayons + name sticker' },
    contents: { ar: 'نونو والفانوس، ١٢ لون شمع جامبو، ستيكر باسم الطفل', en: 'Nono and the Lantern, 12 jumbo crayons, a personalised name sticker' },
    description: {
      ar: 'أول علبة ألوان بجد! كتاب نونو والفانوس مع ألوان شمع تخينة سهلة المسك، وستيكر باسم طفلك يلزقه على الكتاب ويبقى بتاعه هو.',
      en: 'A real first colouring kit! Nono and the Lantern with chunky, easy-grip crayons and a sticker with your child’s name so the book is truly theirs.',
    },
    price: 150,
    kind: 'bundle',
    accent: '#F2A93B',
    cover: '/covers/b-first.png',
    extras: { crayons: 12, books: 1 },
  },
  {
    id: 'b-adventurer',
    sign: { ar: 'دكان المغامر', en: 'The Adventurer Shop' },
    title: { ar: 'باقة المغامر', en: 'The Adventurer Bundle' },
    age: { ar: '٧–١٠ سنين', en: 'Ages 7–10' },
    pages: { ar: 'كتاب + ١٢ قلم + برّاية + بوستر A3', en: 'Book + 12 pencils + sharpener + A3 poster' },
    contents: { ar: 'فانوس وليلة سرقة الألوان، ١٢ قلم ألوان خشب، برّاية، بوستر A3 للتلوين', en: 'Fanous and the Night…, 12 coloured pencils, sharpener, A3 colouring poster' },
    description: {
      ar: 'عدّة المغامرة كاملة: الكتاب، أقلام خشب، برّاية، وبوستر كبير للحارة يلوّنه ويعلّقه في أوضته بعد ما يرجّع الألوان.',
      en: 'The full adventure kit: the book, wooden pencils, a sharpener and a big alley poster to colour and hang up once the colours are back.',
    },
    price: 220,
    kind: 'bundle',
    accent: '#2BB3A3',
    cover: '/covers/b-adventurer.png',
    extras: { pencils: 12, books: 1 },
  },
  {
    id: 'b-calm',
    sign: { ar: 'دكان الهدوء', en: 'The Calm Shop' },
    title: { ar: 'باقة الهدوء', en: 'The Calm Bundle' },
    age: { ar: 'للكبار', en: 'Adults' },
    pages: { ar: 'كتاب الكبار + ٢٤ قلم + بوك مارك + ٣ كروت بوستال', en: 'Adult book + 24 pencils + bookmark + 3 postcards' },
    contents: { ar: 'حكاية شارع، ٢٤ قلم ألوان، بوك مارك، ٣ كروت بوستال للتلوين', en: 'Story of a Street, 24 pencils, bookmark, 3 colourable postcards' },
    description: {
      ar: 'ساعة هدوء ليك لوحدك: كتاب حكاية شارع مع ٢٤ لون، بوك مارك، و٣ كروت بوستال تلوّنها وتبعتها لحد بتحبه.',
      en: 'An hour of calm just for you: Story of a Street with 24 colours, a bookmark and 3 postcards to colour and send to someone you love.',
    },
    price: 350,
    kind: 'bundle',
    accent: '#6E6A86',
    cover: '/covers/b-calm.png',
    extras: { pencils: 24, books: 1 },
  },
  {
    id: 'b-together',
    sign: { ar: 'لوّنوا سوا', en: 'Colour Together' },
    title: { ar: 'باقة لوّنوا سوا', en: 'Colour Together Bundle' },
    age: { ar: 'للعيلة', en: 'Family' },
    pages: { ar: 'كتاب أطفال + كتاب كبار (نفس الحكاية) + ٢٤ لون', en: 'Kids book + adult book (same story) + 24 colours' },
    contents: { ar: 'كتاب الصغار وكتاب الكبار لنفس الحكاية، ٢٤ لون', en: 'The kids and grown-up editions of the same story, 24 colours' },
    description: {
      ar: 'نفس الحكاية بنسختين: نسخة للصغار ونسخة للكبار. اقعدوا على نفس الترابيزة ولوّنوا نفس المشهد كل واحد على طريقته.',
      en: 'One story, two editions — one for kids, one for grown-ups. Sit at the same table and colour the same scene, each in your own way.',
    },
    price: 450,
    kind: 'bundle',
    accent: '#F06C5B',
    cover: '/covers/b-together.png',
    extras: { pencils: 24, books: 2 },
  },
  {
    id: 'nursery',
    sign: { ar: 'ركن الحضانات', en: 'Nursery Corner' },
    title: { ar: 'باقة الحضانات', en: 'Nursery Pack' },
    age: { ar: 'للحضانات', en: 'Nurseries' },
    pages: { ar: 'عبوة ١٠ نسخ', en: '10-copy pack' },
    description: {
      ar: '١٠ نسخ لفصل كامل، عشان الحكاية تتلوّن جماعة. مناسبة للحضانات والمدارس وورش الأطفال.',
      en: 'Ten copies for a whole class, so the story gets coloured together. Made for nurseries, schools and kids’ workshops.',
    },
    price: 450,
    kind: 'pack',
    accent: '#1E2A5A',
    cover: '/covers/nursery.png',
    extras: { books: 10 },
  },
];

export const productById = (id: string | null | undefined) =>
  PRODUCTS.find((p) => p.id === id) ?? null;
