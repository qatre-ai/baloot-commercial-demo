import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================
// Blog Categories
// ============================================
const categories = [
  {
    nameFa: "آموزش موسیقی",
    nameEn: "Music Education",
    slugFa: "آموزش-موسیقی",
    slugEn: "music-education",
    descriptionFa: "مقالات آموزشی در زمینه تئوری، سلفژ و روش‌های یادگیری موسیقی",
    descriptionEn: "Educational articles on music theory, solfeggio, and music learning methods",
    color: "#8B2252",
    icon: "GraduationCap",
    order: 1,
    isPublished: true,
  },
  {
    nameFa: "سازهای موسیقی",
    nameEn: "Musical Instruments",
    slugFa: "سازهای-موسیقی",
    slugEn: "musical-instruments",
    descriptionFa: "راهنمای خرید، نگهداری و انتخاب سازهای موسیقی مختلف",
    descriptionEn: "Guide to buying, maintaining, and choosing different musical instruments",
    color: "#D4A843",
    icon: "Guitar",
    order: 2,
    isPublished: true,
  },
  {
    nameFa: "موسیقی ایرانی",
    nameEn: "Iranian Music",
    slugFa: "موسیقی-ایرانی",
    slugEn: "iranian-music",
    descriptionFa: "دستگاه‌ها، آواز و ردیف موسیقی سنتی و فولکلور ایرانی",
    descriptionEn: "Dastgah, vocal, and repertoire of traditional and folk Iranian music",
    color: "#2D5F3F",
    icon: "Music",
    order: 3,
    isPublished: true,
  },
  {
    nameFa: "موسیقی کودکان",
    nameEn: "Children's Music",
    slugFa: "موسیقی-کودکان",
    slugEn: "childrens-music",
    descriptionFa: "آموزش موسیقی برای کودکان، روش‌های پداگوژی و بازی‌های موسیقایی",
    descriptionEn: "Music education for children, pedagogy methods, and musical games",
    color: "#6B4C8A",
    icon: "Baby",
    order: 4,
    isPublished: true,
  },
  {
    nameFa: "تکنیک و تمرین",
    nameEn: "Technique & Practice",
    slugFa: "تکنیک-و-تمرین",
    slugEn: "technique-and-practice",
    descriptionFa: "تکنیک‌های نوازندگی، تمرینات روزانه و روش‌های بهبود عملکرد",
    descriptionEn: "Performance techniques, daily exercises, and methods for improving performance",
    color: "#C4784A",
    icon: "Target",
    order: 5,
    isPublished: true,
  },
  {
    nameFa: "راهنمای هنرجویان",
    nameEn: "Student Guide",
    slugFa: "راهنمای-هنرجویان",
    slugEn: "student-guide",
    descriptionFa: "نکات کاربردی برای هنرجویان موسیقی، از شروع تا حرفه‌ای شدن",
    descriptionEn: "Practical tips for music students, from beginner to professional",
    color: "#3D7A8A",
    icon: "Compass",
    order: 6,
    isPublished: true,
  },
];

// ============================================
// Blog Posts - 9 SEO-Optimized Articles
// ============================================
const posts = [
  // ---- Post 1: آنلاین یا حضوری ----
  {
    titleFa: "آموزش موسیقی آنلاین یا حضوری؟ کدام روش برای شما مناسب‌تر است؟",
    titleEn: "Online vs In-Person Music Lessons: Which Method is Right for You?",
    slugFa: "آموزش-موسیقی-آنلاین-یا-حضوری",
    slugEn: "online-vs-inperson-music-lessons",
    contentFa: `<h2>مقدمه: دغدغه‌ای که بسیاری از هنرجویان دارند</h2>
<p>یکی از مهم‌ترین تصمیماتی که هر هنرجوی موسیقی باید بگیرد، انتخاب بین <strong>آموزش آنلاین و حضوری</strong> است. با رشد فناوری و تغییرات اخیر در شیوه‌های آموزشی، این انتخاب پیچیده‌تر از همیشه شده است. در این مقاله، هر دو روش را به صورت جامع و بی‌طرفانه بررسی می‌کنیم تا بهترین تصمیم را بگیرید.</p>

<h2>مزایای آموزش حضوری موسیقی</h2>
<p>آموزش حضوری موسیقی قرن‌هاست که روش غالب آموزش بوده و دلایل خوبی برای آن وجود دارد:</p>
<ul>
<li><strong>بازخورد فوری و دقیق:</strong> استاد می‌تواند کوچک‌ترین اشتباهات در وضعیت دست، نشستن و تولید صدا را بلافاصله اصلاح کند.</li>
<li><strong>تاثیر محیط آموزشی:</strong> حضور در یک فضای هنری، تمرکز و انگیزه را افزایش می‌دهد.</li>
<li><strong>ارتباط مستقیم و غیرکلامی:</strong> زبان بدن استاد، حرکات دست و حالت چهره اطلاعات مهمی را منتقل می‌کند.</li>
<li><strong>تعامل با هنرجویان دیگر:</strong> در کلاس‌های گروهی، یادگیری از هم‌کلاسی‌ها و کار گروهی تجربه ارزشمندی است.</li>
<li><strong>دسترسی به سازهای مختلف:</strong> آموزشگاه‌ها معمولاً سازهای متنوعی برای تمرین و آشنایی دارند.</li>
</ul>

<h2>مزایای آموزش آنلاین موسیقی</h2>
<p>آموزش آنلاین با وجود چالش‌هایی که دارد، مزایای منحصر به فردی ارائه می‌دهد:</p>
<ul>
<li><strong>انعطاف‌پذیری زمانی و مکانی:</strong> در هر ساعت و مکانی که بخواهید می‌توانید درس بگیرید.</li>
<li><strong>دسترسی به اساتید برتر:</strong> دیگر محدود به اساتید شهر خود نیستید و می‌توانید از بهترین اساتید ایران و جهان درس بگیرید.</li>
<li><strong>صرفه‌جویی در زمان و هزینه:</strong> نیاز به رفت‌وآمد ندارید و هزینه‌های جانبی کاهش می‌یابد.</li>
<li><strong>ضبط جلسات:</strong> امکان مشاهده مجدد درس‌ها و تمرین بر اساس آنها.</li>
<li><strong>یادگیری با سرعت شخصی:</strong> بدون فشار کلاس، می‌توانید با سرعت خودتان پیش بروید.</li>
</ul>

<h2>چالش‌های هر روش</h2>
<h3>چالش‌های آموزش حضوری</h3>
<ul>
<li>نیاز به زمان رفت‌وآمد</li>
<li>محدودیت زمان‌بندی ثابت</li>
<li>هزینه بالاتر (شهریه + رفت‌وآمد)</li>
<li>محدودیت جغرافیایی در انتخاب استاد</li>
</ul>

<h3>چالش‌های آموزش آنلاین</h3>
<ul>
<li>تاخیر صوتی و تصویری که تمرین همزمان را دشوار می‌کند</li>
<li>کیفیت صدا در ویدیوکنفرانس برای موسیقی ناکافی است</li>
<li>نیاز به نظم و خودانضباطی بیشتر</li>
<li>عدم امکان اصلاح فیزیکی وضعیت دست و بدن</li>
</ul>

<h2>کدام روش برای چه کسانی مناسب‌تر است؟</h2>
<p><strong>آموزش حضوری توصیه می‌شود اگر:</strong></p>
<ul>
<li>مبتدی هستید و نیاز به اصلاح مستمر تکنیک دارید</li>
<li>آموزش موسیقی کودکان را در نظر دارید</li>
<li>محیط آموزشی برای تمرکز شما ضروری است</li>
<li>می‌خواهید ساز جدیدی را شروع کنید</li>
</ul>

<p><strong>آموزش آنلاین توصیه می‌شود اگر:</strong></p>
<ul>
<li>سطح متوسط یا پیشرفته هستید</li>
<li>زمان محدودی دارید</li>
<li>دسترسی به استاد مناسب در شهر خود ندارید</li>
<li>نظم شخصی بالایی دارید</li>
</ul>

<h2>راهکار ترکیبی: بهترین هر دو دنیا</h2>
<p>در <strong>مؤسسه موسیقی مهر آوای بلوط</strong>، ما روش ترکیبی را پیشنهاد می‌دهیم: آموزش حضوری برای بنیاد و اصلاح تکنیک، و جلسات آنلاین برای پیگیری و تمرین. این رویکرد، مزایای هر دو روش را حفظ می‌کند و ضعف‌هایشان را جبران می‌نماید.</p>

<h2>نتیجه‌گیری</h2>
<p>انتخاب بین آموزش آنلاین و حضوری، تصمیمی شخصی است که به سطح هنرجو، نوع ساز، شرایط زندگی و اهداف موسیقایی بستگی دارد. مهم‌تر از روش آموزش، <strong>کیفیت استاد و تعهد هنرجو</strong> است. با مشاوره صحیح، می‌توانید بهترین مسیر یادگیری را برای خود پیدا کنید.</p>`,
    contentEn: `<h2>Introduction: A Dilemma Many Students Face</h2>
<p>One of the most important decisions every music student must make is choosing between <strong>online and in-person lessons</strong>. With the advancement of technology and recent changes in educational methods, this choice has become more complex than ever. In this article, we provide a comprehensive and unbiased comparison to help you make the best decision.</p>

<h2>Advantages of In-Person Music Lessons</h2>
<p>In-person music education has been the dominant teaching method for centuries, and for good reasons:</p>
<ul>
<li><strong>Immediate and precise feedback:</strong> The instructor can correct the smallest mistakes in hand position, posture, and sound production instantly.</li>
<li><strong>Impact of the learning environment:</strong> Being in an artistic space increases focus and motivation.</li>
<li><strong>Direct non-verbal communication:</strong> The teacher's body language, hand movements, and facial expressions convey important information.</li>
<li><strong>Interaction with other students:</strong> In group classes, learning from peers and collaborative work provides valuable experience.</li>
</ul>

<h2>Advantages of Online Music Lessons</h2>
<ul>
<li><strong>Time and location flexibility:</strong> You can learn whenever and wherever you want.</li>
<li><strong>Access to top instructors:</strong> You're no longer limited to teachers in your city.</li>
<li><strong>Savings in time and cost:</strong> No commuting needed and peripheral expenses are reduced.</li>
<li><strong>Session recording:</strong> Ability to review lessons and practice accordingly.</li>
</ul>

<h2>Conclusion</h2>
<p>The choice between online and in-person education is a personal decision that depends on the student's level, instrument type, life circumstances, and musical goals. More important than the teaching method is the <strong>quality of the instructor and the student's commitment</strong>. With proper consultation, you can find the best learning path for yourself.</p>`,
    excerptFa: "مقایسه جامع آموزش موسیقی آنلاین و حضوری: مزایا، چالش‌ها و راهکار ترکیبی برای انتخاب بهترین روش یادگیری متناسب با شرایط شما",
    excerptEn: "A comprehensive comparison of online vs in-person music lessons: advantages, challenges, and a hybrid solution for choosing the best learning method for your situation",
    coverUrl: "/blog/covers/online-or-inperson.png",
    coverAltFa: "مقایسه آموزش موسیقی آنلاین و حضوری",
    coverAltEn: "Online vs in-person music lessons comparison",
    tags: "آموزش موسیقی,آنلاین,حضوری,یادگیری موسیقی,کلاس موسیقی",
    metaTitleFa: "آموزش موسیقی آنلاین یا حضوری؟ راهنمای کامل انتخاب | مهر آوای بلوط",
    metaTitleEn: "Online vs In-Person Music Lessons: Complete Guide | Mehr Avaye Baloot",
    metaDescriptionFa: "مقایسه جامع آموزش موسیقی آنلاین و حضوری. مزایا، معایب و راهکار ترکیبی. بهترین روش یادگیری متناسب با سطح و شرایط شما را پیدا کنید.",
    metaDescriptionEn: "Comprehensive comparison of online vs in-person music lessons. Advantages, disadvantages, and hybrid solutions. Find the best learning method for your level and situation.",
    keywords: "آموزش موسیقی آنلاین,کلاس موسیقی حضوری,آموزش آنلاین پیانو,آموزش آنلاین گیتار,مقایسه آموزش موسیقی",
    categorySlugs: ["آموزش-موسیقی", "راهنمای-هنرجویان"],
    isPublished: true,
    isFeatured: true,
    isShowOnHome: true,
    order: 1,
  },

  // ---- Post 2: پیانو ----
  {
    titleFa: "راهنمای جامع شروع یادگیری پیانو: از صفر تا اولین قطعه",
    titleEn: "Complete Guide to Starting Piano: From Zero to Your First Piece",
    slugFa: "راهنمای-شروع-یادگیری-پیانو",
    slugEn: "guide-to-starting-piano",
    contentFa: `<h2>چرا پیانو؟ پادشاه سازها</h2>
<p>پیانو با دامنه صوتی گسترده‌ای که تقریباً کل محدوده صوتی ارکستر سمفونیک را پوشش می‌دهد، به حق <strong>پادشاه سازها</strong> نامیده شده است. یادگیری پیانو نه تنها یک مهارت موسیقایی ارزشمند است، بلکه پایه‌ای مستحکم برای درک تئوری موسیقی و آهنگسازی فراهم می‌کند.</p>

<h2>قبل از شروع: چه چیزی نیاز دارید؟</h2>
<h3>انتخاب ساز مناسب</h3>
<p>اولین تصمیم مهم، انتخاب بین <strong>پیانو آکوستیک و کیبورد دیجیتال</strong> است:</p>
<ul>
<li><strong>پیانو آکوستیک:</strong> صدای اصیل، حس لمس کلیدهای واقعی، اما نیاز به فضای بیشتر و هزینه بالاتر</li>
<li><strong>کیبورد دیجیتال:</strong> مقرون‌به‌صرفه، قابل حمل، هدفون برای تمرین شبانه، اما کیفیت صدای متفاوت</li>
</ul>
<p>برای شروع، یک کیبورد با <strong>۸۸ کلید وزن‌دار (Weighted Keys)</strong> بهترین انتخاب است. مدل‌هایی مانند Yamaha P-45 یا Casio PX-160 گزینه‌های محبوبی هستند.</p>

<h3>لوازم جانبی ضروری</h3>
<ul>
<li>جایگاه (Stand) مناسب برای کیبورد</li>
<li>نیمکت پیانو با ارتفاع قابل تنظیم</li>
<li>هدفون با کیفیت</li>
<li>مترونوم (اپلیکیشن هم کافی است)</li>
<li>جود و کتاب تئوری پایه</li>
</ul>

<h2>هفته اول: آشنایی با ساز</h2>
<p>در هفته اول، هدف شما آشنایی با پیانو و ایجاد راحتی نشستن در مقابل آن است:</p>
<ul>
<li>یادگیری نشستن صحیح: پشت صاف، آرنج‌ها در سطح کلیدها</li>
<li>آشنایی با نیم‌پرده‌ها و پرده‌های کلیدها</li>
<li>تمرین دست راست و چپ به صورت جداگانه</li>
<li>یادگیری ۵ انگشتگی پایه در دو ماژور</li>
</ul>

<h2>ماه اول: بنیاد تئوری و تکنیک</h2>
<h3>تئوری پایه</h3>
<ul>
<li>نام نت‌ها و جایگاه آنها روی خطوط حامل</li>
<li>مقادیر نت‌ها: تمام، نیم، چارک، هشتم</li>
<li>متری (ضرب‌اهنگ): ۴/۴ و ۳/۴</li>
<li>علامت‌های دیز و بمل</li>
</ul>

<h3>تکنیک‌های پایه</h3>
<ul>
<li>انگشت‌گذاری صحیح (Fingering)</li>
<li>آرپژ ۵ تایی پایه</li>
<li>گام‌های دو ماژور و سل ماژور</li>
<li>تمرین هانون برای تقویت انگشتان</li>
</ul>

<h2>اشتباهات رایج مبتدیان</h2>
<ol>
<li><strong>خم کردن مچ دست:</strong> مچ باید صاف و در امتداد ساعد باشد</li>
<li><strong>فشردن کلیدها به جای استفاده از وزن دست:</strong> صدای زیبا از رها کردن وزن می‌آید نه فشار دادن</li>
<li><strong>نادیده گرفتن مترونوم:</strong> از روز اول با مترونوم تمرین کنید</li>
<li><strong>عجله در یادگیری:</strong> هر مرحله را کامل یاد بگیرید قبل از رفتن به مرحله بعد</li>
<li><strong>تمرین نامنظم:</strong> ۳۰ دقیقه روزانه بهتر از ۳ ساعت یک روز در هفته است</li>
</ol>

<h2>برنامه تمرین پیشنهادی روزانه</h2>
<ul>
<li>۵ دقیقه: گرم‌کردن با گام‌ها و آرپژها</li>
<li>۱۰ دقیقه: تمرین تئوری و خواندن نت</li>
<li>۱۰ دقیقه: تمرین قطعه جدید</li>
<li>۵ دقیقه: مرور قطعه‌های قبلی</li>
</ul>

<h2>چرا مهر آوای بلوط؟</h2>
<p>در <strong>مؤسسه موسیقی مهر آوای بلوط</strong>، اساتید مجرب پیانو با روش‌های مدرن و شخصی‌سازی شده، مسیر یادگیری شما را از مبتدی تا پیشرفته هدایت می‌کنند. با دو شعبه در تهران و امکان آموزش آنلاین و حضوری، بهترین شرایط یادگیری برای شما فراهم است.</p>`,
    contentEn: `<h2>Why Piano? The King of Instruments</h2>
<p>With a range covering almost the entire sonic spectrum of a symphony orchestra, the piano is rightfully called the <strong>King of Instruments</strong>. Learning piano not only provides a valuable musical skill but also creates a solid foundation for understanding music theory and composition.</p>

<h2>Before You Start: What Do You Need?</h2>
<h3>Choosing the Right Instrument</h3>
<p>The first important decision is choosing between an <strong>acoustic piano and a digital keyboard</strong>:</p>
<ul>
<li><strong>Acoustic Piano:</strong> Authentic sound, real key touch, but requires more space and higher cost</li>
<li><strong>Digital Keyboard:</strong> Affordable, portable, headphone for nighttime practice, but different sound quality</li>
</ul>

<h2>Common Beginner Mistakes</h2>
<ol>
<li><strong>Bent wrists:</strong> The wrist should be straight and aligned with the forearm</li>
<li><strong>Pressing keys instead of using arm weight:</strong> Beautiful tone comes from releasing weight, not pressing</li>
<li><strong>Ignoring the metronome:</strong> Practice with a metronome from day one</li>
<li><strong>Rushing through learning:</strong> Master each stage before moving to the next</li>
</ol>

<h2>Conclusion</h2>
<p>Starting piano is a rewarding journey. With the right instrument, proper guidance, and consistent practice, you'll be playing your first pieces within weeks. At <strong>Mehr Avaye Baloot Music Institute</strong>, our experienced piano teachers guide you from beginner to advanced levels with modern, personalized methods.</p>`,
    excerptFa: "راهنمای کامل شروع یادگیری پیانو از صفر: انتخاب ساز مناسب، تکنیک‌های پایه، برنامه تمرین روزانه و اشتباهات رایج مبتدیان",
    excerptEn: "Complete guide to starting piano from scratch: choosing the right instrument, basic techniques, daily practice schedule, and common beginner mistakes",
    coverUrl: "/blog/covers/piano.png",
    coverAltFa: "یادگیری پیانو برای مبتدیان",
    coverAltEn: "Piano learning for beginners",
    tags: "پیانو,آموزش پیانو,یادگیری پیانو,کیبورد,پیانوی دیجیتال",
    metaTitleFa: "راهنمای جامع یادگیری پیانو از صفر | مهر آوای بلوط",
    metaTitleEn: "Complete Piano Learning Guide from Scratch | Mehr Avaye Baloot",
    metaDescriptionFa: "آموزش گام به گام پیانو برای مبتدیان: انتخاب ساز، تکنیک‌های پایه، برنامه تمرین و نکات کلیدی برای شروع سریع و اصولی یادگیری پیانو",
    metaDescriptionEn: "Step-by-step piano tutorial for beginners: choosing your instrument, basic techniques, practice schedule, and key tips for starting piano effectively",
    keywords: "آموزش پیانو,یادگیری پیانو,پیانو مبتدی,خرید پیانو,کلاس پیانو,پیانو تهران",
    categorySlugs: ["سازهای-موسیقی", "آموزش-موسیقی"],
    isPublished: true,
    isFeatured: true,
    isShowOnHome: true,
    order: 2,
  },

  // ---- Post 3: تکنیک‌های تنفسی ----
  {
    titleFa: "تکنیک‌های تنفسی برای خوانندگان و نوازندگان سازهای بادی",
    titleEn: "Breathing Techniques for Singers and Wind Instrument Players",
    slugFa: "تکنیک‌های-تنفسی-خوانندگان-نوازندگان",
    slugEn: "breathing-techniques-singers-musicians",
    contentFa: `<h2>اهمیت تنفس در موسیقی</h2>
<p>تنفس، پل ارتباطی بین بدن و موسیقی است. برای خوانندگان و نوازندگان سازهای بادی، <strong>تنفس دیافراگماتیکی</strong> نه تنها یک تکنیک، بلکه ضرورت حیاتی است. تنفس صحیح تاثیر مستقیم بر کیفیت صدا، مدت نواختن بدون نفس، و سلامت صدایی بلندمدت دارد.</p>

<h2>آناتومی تنفس موسیقایی</h2>
<p>برای درک تنفس صحیح، باید آناتومی آن را بشناسید:</p>
<ul>
<li><strong>دیافراگم:</strong> عضله اصلی تنفس، صفحه عضلانی بین قفسه سینه و شکم</li>
<li><strong>عضلات بین‌دنده‌ای:</strong> کمک به گسترش قفسه سینه</li>
<li><strong>عضلات شکمی:</strong> کنترل فشار هوای خروجی</li>
<li><strong>حفره شکمی:</strong> فضای ذخیره هوای زیر دیافراگم</li>
</ul>

<h2>تنفس دیافراگماتیکی: تکنیک پایه</h2>
<h3>مرحله ۱: آگاهی از دیافراگم</h3>
<p>روی زمین دراز بکشید، یک کتاب روی شکمتان بگذارید. هنگام دم، کتاب باید بالا برود و هنگام بازدم، پایین بیاید. این نشان‌دهنده استفاده صحیح از دیافراگم است.</p>

<h3>مرحله ۲: تمرین بازدم کنترل‌شده</h3>
<p>یک شمع فرضی را جلوی دهانتان تصور کنید. هوای خروجی باید آن‌قدر آرام باشد که شمع خاموش نشود اما شعله تکان بخورد. این تمرین کنترل هوای خروجی را تقویت می‌کند.</p>

<h3>مرحله ۳: تمرین ۴-۴-۴-۴</h3>
<p>۴ ثانیه دم، ۴ ثانیه نگه‌داشتن، ۴ ثانیه بازدم، ۴ ثانیه مکث. تدریجاً زمان بازدم را افزایش دهید.</p>

<h2>تمرینات پیشرفته تنفسی</h2>
<h3>تمرین استامین (Stamina)</h3>
<p>نفس عمیق بگیرید و روی یک نت ثابت، صدا را تا جای ممکن حفظ کنید. از مترونوم با سرعت ۶۰ استفاده کنید و تعداد ضرب‌ها را روزانه افزایش دهید.</p>

<h3>تمرین انعطاف‌پذیری (Flexibility)</h3>
<p>بین دم و بازدم با سرعت‌های متناوب جابجا شوید. این تمرین برای اجراهای سریع و پاسیاژها ضروری است.</p>

<h3>تمرین اضطراری (Emergency Breath)</h3>
<p>گاهی در میان اجرا فرصت کافی برای نفس عمیق ندارید. تمرین گرفتن نفس سریع از راه دهان و بینی به صورت همزمان.</p>

<h2>اشتباهات رایج تنفسی</h2>
<ul>
<li><strong>بالا بردن شانه‌ها هنگام دم:</strong> این تنفس سینه‌ای است نه دیافراگماتیکی</li>
<li><strong>فشار بیش از حد عضلات شکمی:</strong> کنترل ≠ فشار</li>
<li><strong>نفس گرفتن با صدا:</strong> نفس بی‌صدا = تنفس کارآمد</li>
<li><strong>کاهش حجم هوای ذخیره:</strong> شکم باید هنگام دم آزادانه بزرگ شود</li>
</ul>

<h2>برنامه تمرین روزانه تنفسی</h2>
<ul>
<li>۵ دقیقه: تمرین آگاهی دیافراگم (درازکش)</li>
<li>۵ دقیقه: تمرین ۴-۴-۴-۴ با افزایش تدریجی</li>
<li>۵ دقیقه: تمرین استامین روی نت ثابت</li>
<li>۵ دقیقه: تمرین تنفس سریع و اضطراری</li>
</ul>

<h2>نتیجه‌گیری</h2>
<p>تکنیک تنفسی صحیح، фундамانی است که تمامی دیگر تکنیک‌های آوازی و نوازندگی بر آن بنا می‌شوند. بدون تنفس مناسب، حتی با استعداد ذاتی، پیشرفت محدود خواهد بود. در <strong>مهر آوای بلوط</strong>، اساتید ما تکنیک‌های تنفسی را از همان جلسات اول به هنرجویان آموزش می‌دهند.</p>`,
    contentEn: `<h2>The Importance of Breathing in Music</h2>
<p>Breathing is the bridge between the body and music. For singers and wind instrument players, <strong>diaphragmatic breathing</strong> is not just a technique but a vital necessity. Proper breathing directly affects sound quality, endurance, and long-term vocal health.</p>

<h2>Diaphragmatic Breathing: The Core Technique</h2>
<h3>Step 1: Diaphragm Awareness</h3>
<p>Lie on the floor, place a book on your abdomen. When inhaling, the book should rise; when exhaling, it should lower. This indicates proper diaphragm use.</p>

<h3>Step 2: Controlled Exhalation</h3>
<p>Imagine a candle in front of your mouth. The outgoing air should be gentle enough not to extinguish the candle but make the flame flicker.</p>

<h2>Conclusion</h2>
<p>Proper breathing technique is the foundation upon which all other vocal and performance techniques are built. At <strong>Mehr Avaye Baloot</strong>, our instructors teach breathing techniques from the very first sessions.</p>`,
    excerptFa: "آموزش تکنیک‌های تنفسی دیافراگماتیکی برای خوانندگان و نوازندگان سازهای بادی: تمرینات عملی، اشتباهات رایج و برنامه روزانه",
    excerptEn: "Diaphragmatic breathing techniques for singers and wind instrument players: practical exercises, common mistakes, and daily routine",
    coverUrl: "/blog/covers/breathing-techniques.png",
    coverAltFa: "تکنیک‌های تنفسی برای موسیقی‌دانان",
    coverAltEn: "Breathing techniques for musicians",
    tags: "تنفس,تکنیک تنفسی,آواز,ساز بادی,دیافراگم",
    metaTitleFa: "تکنیک‌های تنفسی برای خوانندگان و نوازندگان | مهر آوای بلوط",
    metaTitleEn: "Breathing Techniques for Singers and Musicians | Mehr Avaye Baloot",
    metaDescriptionFa: "آموزش کامل تکنیک‌های تنفسی دیافراگماتیکی برای خوانندگان و نوازندگان سازهای بادی. تمرینات عملی، اشتباهات رایج و برنامه تمرین روزانه.",
    metaDescriptionEn: "Complete guide to diaphragmatic breathing techniques for singers and wind instrument players. Practical exercises, common mistakes, and daily practice routine.",
    keywords: "تکنیک تنفسی,تنفس دیافراگم,آموزش آواز,ساز بادی,تمرین تنفس خوانندگی",
    categorySlugs: ["تکنیک-و-تمرین", "آموزش-موسیقی"],
    isPublished: true,
    isFeatured: false,
    isShowOnHome: true,
    order: 3,
  },

  // ---- Post 4: خرید اولین ساز ----
  {
    titleFa: "راهنمای خرید اولین ساز: نکاتی که قبل از خرید باید بدانید",
    titleEn: "Guide to Buying Your First Instrument: What You Need to Know",
    slugFa: "راهنمای-خرید-اولین-ساز",
    slugEn: "guide-to-buying-first-instrument",
    contentFa: `<h2>خرید اولین ساز: تصمیمی مهم در مسیر موسیقی</h2>
<p>خرید اولین ساز، یکی از هیجان‌انگیزترین و در عین حال دلهره‌آورترین لحظات زندگی هنرجوی موسیقی است. انتخاب اشتباه نه تنها هزینه مالی دارد، بلکه می‌تواند انگیزه و پیشرفت شما را به شدت تحت تاثیر قرار دهد. در این راهنمای جامع، همه نکاتی را که برای خرید هوشمندانه ساز نیاز دارید پوشش می‌دهیم.</p>

<h2>پنج عامل کلیدی در انتخاب ساز</h2>
<h3>۱. بودجه واقع‌بینانه</h3>
<p>قیمت سازهای موسیقی دامنه بسیار گسترده‌ای دارد. اما یک قانون طلایی: <strong>ارزان‌ترین ساز معمولاً گران‌ترین در درازمدت است</strong>. سازهای بسیار ارزان کیفیت صدای ضعیف، کوک‌نشدن صحیح و عمر کوتاه دارند.</p>
<ul>
<li><strong>سطح ورودی:</strong> ویولن از ۲ میلیون، گیتار از ۱.۵ میلیون، پیانوی دیجیتال از ۵ میلیون تومان</li>
<li><strong>سطح متوسط:</strong> ویولن از ۵ میلیون، گیتار از ۴ میلیون، پیانو از ۱۵ میلیون تومان</li>
</ul>

<h3>۲. مشاوره با استاد</h3>
<p>قبل از هر خریدی، با استاد خود مشورت کنید. اساتید آشنا به برندها، مدل‌ها و نکات فنی هستند و می‌توانند بهترین گزینه را متناسب با سطح و بودجه شما پیشنهاد دهند.</p>

<h3>۳. خرید نو یا دست‌دوم؟</h3>
<p><strong>مزایای نو:</strong> گارانتی، اطمینان از سلامت ساز، انتخاب مدل دقیق</p>
<p><strong>مزایای دست‌دوم:</strong> قیمت پایین‌تر، امکان خرید ساز بهتر با بودجه کمتر</p>
<p>اگر ساز دست‌دوم می‌خرید، حتماً با یک متخصص ساز را بررسی کنید.</p>

<h3>۴. اندازه و تناسب فیزیکی</h3>
<p>مخصوصاً برای کودکان و نوجوانان، انتخاب اندازه صحیح ساز بسیار مهم است:</p>
<ul>
<li>ویولن: سایز ۱/۴، ۱/۲، ۳/۴ و ۴/۴ بر اساس طول بازو</li>
<li>گیتار: سایز ۱/۲، ۳/۴ و فول‌سایز</li>
<li>ویولنسل: بر اساس قد و طول دست</li>
</ul>

<h3>۵. قابلیت فروش مجدد</h3>
<p>برندهای شناخته‌شده ارزش خود را حفظ می‌کنند. اگر پس از مدتی تصمیم به تغییر ساز گرفتید، ساز باکیفیت راحت‌تر و با قیمت بهتر فروخته می‌شود.</p>

<h2>راهنمای خاص هر ساز</h2>
<h3>ویولن</h3>
<ul>
<li>چوب ساخته‌شده از صنوبر (روی) و افرا (زیر)</li>
<li>ورنیش طبیعی بهتر از صنعتی</li>
<li>کوک‌کننده‌های دقیق (Pegs)</li>
<li>آرشه با موی اسب مرغوب</li>
</ul>

<h3>گیتار</h3>
<ul>
<li>گیتار کلاسیک (نایلون) برای شروع بهتر از آکوستیک (فولاد)</li>
<li>فاصله کلیدها از فینگربرد (Action) مناسب</li>
<li>عدم انحنای فینگربرد</li>
</ul>

<h3>پیانو/کیبورد</h3>
<ul>
<li>حداقل ۶۱ کلید برای شروع، ۸۸ کلید ایده‌آل</li>
<li>کلیدهای وزن‌دار (Weighted) ضروری</li>
<li>قابلیت پدال sustain</li>
</ul>

<h2>جاهای نخرید! هشدارهای مهم</h2>
<ul>
<li>سازهای موجود در فروشگاه‌های لوازم‌التحریر و سوپرمارکت‌ها</li>
<li>سازهای بسیار ارزان آنلاین بدون امکان آزمایش</li>
<li>سازهای بدون نام و برند مشخص</li>
<li>سازهایی با کوک‌نشدن صحیح (نشانه ساختار ضعیف)</li>
</ul>

<h2>از کجا بخریم؟</h2>
<p>در <strong>مهر آوای بلوط</strong>، ما مشاوره فوق‌تخصصی خرید ساز ارائه می‌دهیم. با تجربه صنعتی تولید سالانه ۱۲۰۰ ساز و آشنایی عمیق با بازار، بهترین راهنمایی را برای خرید ساز متناسب با بودجه و نیاز شما داریم.</p>`,
    contentEn: `<h2>Buying Your First Instrument: A Crucial Decision</h2>
<p>Buying your first instrument is one of the most exciting yet daunting moments in a music student's life. A wrong choice not only costs money but can severely impact your motivation and progress.</p>

<h2>Five Key Factors in Choosing an Instrument</h2>
<h3>1. Realistic Budget</h3>
<p>Golden rule: <strong>The cheapest instrument is usually the most expensive in the long run</strong>. Very cheap instruments have poor sound quality, tuning issues, and short lifespan.</p>

<h3>2. Teacher Consultation</h3>
<p>Before any purchase, consult with your teacher. They are familiar with brands, models, and technical details.</p>

<h2>Conclusion</h2>
<p>At <strong>Mehr Avaye Baloot</strong>, we offer expert instrument purchase consultation. With our experience in manufacturing 1,200 instruments annually, we provide the best guidance for your budget and needs.</p>`,
    excerptFa: "راهنمای جامع خرید اولین ساز موسیقی: عوامل کلیدی انتخاب، بودجه‌بندی، مقایسه نو و دست‌دوم، و هشدارهای مهم برای جلوگیری از خرید اشتباه",
    excerptEn: "Complete guide to buying your first musical instrument: key selection factors, budgeting, new vs used comparison, and important warnings against wrong purchases",
    coverUrl: "/blog/covers/buying-first-instrument.png",
    coverAltFa: "راهنمای خرید اولین ساز موسیقی",
    coverAltEn: "Guide to buying first musical instrument",
    tags: "خرید ساز,ساز موسیقی,ویولن,گیتار,پیانو,راهنمای خرید",
    metaTitleFa: "راهنمای خرید اولین ساز موسیقی | مهر آوای بلوط",
    metaTitleEn: "Guide to Buying Your First Musical Instrument | Mehr Avaye Baloot",
    metaDescriptionFa: "نکات کلیدی خرید اولین ساز موسیقی: بودجه‌بندی، انتخاب ساز مناسب، مقایسه نو و دست‌دوم، و راهنمای خاص هر ساز. مشاوره رایگان خرید ساز.",
    metaDescriptionEn: "Key tips for buying your first musical instrument: budgeting, choosing the right instrument, new vs used comparison, and instrument-specific guides.",
    keywords: "خرید ساز,خرید ویولن,خرید گیتار,خرید پیانو,ساز موسیقی قیمت,راهنمای خرید ساز",
    categorySlugs: ["سازهای-موسیقی", "راهنمای-هنرجویان"],
    isPublished: true,
    isFeatured: false,
    isShowOnHome: true,
    order: 4,
  },

  // ---- Post 5: دستگاه‌های موسیقی ایرانی ----
  {
    titleFa: "آشنایی با دستگاه‌های موسیقی ایرانی: راهنمای کامل برای هنرجویان",
    titleEn: "Introduction to Iranian Music Dastgah: Complete Guide for Students",
    slugFa: "آشنایی-با-دستگاه‌های-موسیقی-ایرانی",
    slugEn: "iranian-music-dastgah-guide",
    contentFa: `<h2>دستگاه‌های موسیقی ایرانی: گنجینه‌ای از اصالت و زیبایی</h2>
<p>موسیقی ایرانی با قدمتی هزاران ساله، یکی از غنی‌ترین نظام‌های موسیقایی جهان است. <strong>دستگاه</strong> در موسیقی ایرانی، مفهومی فراتر از گام (Scale) غربی است: مجموعه‌ای از نت‌ها، گوشه‌ها، ملودی‌ها و حال‌وهوای عاطفی که یک دنیای موسیقایی کامل را شکل می‌دهد.</p>

<h2>هفت دستگاه اصلی موسیقی ایرانی</h2>
<h3>۱. دستگاه ماهور</h3>
<p>ماهور، روشن‌ترین و شادترین دستگاه موسیقی ایرانی است. معادل تقریبی ماژور در موسیقی غربی، اما با فاصله‌ها و گوشه‌های منحصر به فرد.</p>
<ul>
<li>حال‌وهوا: شادی، افتخار، شکوه</li>
<li>نت شروع: دو (C)</li>
<li>گوشه‌های مهم: دلکش، شکسته، رک، نیشاپورک</li>
<li>قطعه معروف: پیش‌درآمد ماهور (حسین علیزاده)</li>
</ul>

<h3>۲. دستگاه شور</h3>
<p>شور، پرکاربردترین و احساسی‌ترین دستگاه موسیقی ایرانی است. از این دستگاه، چهار آواز مهم مشتق می‌شود.</p>
<ul>
<li>حال‌وهوا: غم، عاشقانه، درویشی</li>
<li>نت شروع: سل (G)</li>
<li>آوازهای مشتق: ابوعطا، بیات ترک، افشاری، دشتی</li>
</ul>

<h3>۳. دستگاه سه‌گاه</h3>
<p>سه‌گاه به معنی «سه جایگاه»، دستگاهی با سه نت متغیر است که حال‌وهوایی مرموز و حماسی دارد.</p>

<h3>۴. دستگاه چهارگاه</h3>
<p>چهارگاه، دستگاهی با چهار نت شروع متفاوت در جاهای مختلف گام. حال‌وهوایی رازآلود و عارفانه.</p>

<h3>۵. دستگاه نوا</h3>
<p>نوا، دستگاهی که تمام نت‌های گام کروماتیک را شامل می‌شود و آزادی عمل بسیار زیادی به نوازنده می‌دهد.</p>

<h3>۶. دستگاه همایون</h3>
<p>همایون، دستگاهی با حال‌وهوای شکوهمند و ملکوتی. اغلب در مراسم و اجراهای رسمی استفاده می‌شود.</p>

<h3>۷. دستگاه راست‌پنج‌گاه</h3>
<p>قدیمی‌ترین دستگاه موسیقی ایرانی که نقطه شروع ردیف موسیقی ایرانی محسوب می‌شود.</p>

<h2>آوازها: شاخه‌های درخت دستگاه</h2>
<p>هر دستگاه، آوازهایی (بخش‌های فرعی) دارد که از آن مشتق شده‌اند:</p>
<ul>
<li>از دستگاه شور: ابوعطا، بیات ترک، افشاری، دشتی</li>
<li>از دستگاه همایون: بیات اصفهان</li>
</ul>

<h2>چگونه دستگاه‌ها را یاد بگیریم؟</h2>
<ol>
<li><strong>گوش دادن فعال:</strong> آثار استادان بزرگ را با دقت گوش دهید</li>
<li><strong>شناخت نت‌ها:</strong> گام هر دستگاه را روی ساز خود بنوازید</li>
<li><strong>یادگیری گوشه‌ها:</strong> هر گوشه حال‌وهوای خاصی دارد</li>
<li><strong>تمرین بداهه‌نوازی:</strong> در هر دستگاه آزادانه نوازنده باشید</li>
</ol>

<h2>نتیجه‌گیری</h2>
<p>یادگیری دستگاه‌های موسیقی ایرانی، سفری در دنیای احساسات و زیبایی‌های بی‌نظیر است. در <strong>مهر آوای بلوط</strong>، اساتید برجسته موسیقی ایرانی، ردیف و دستگاه‌ها را با رویکردی عملی و اصولی آموزش می‌دهند.</p>`,
    contentEn: `<h2>Iranian Music Dastgah: A Treasure of Authenticity and Beauty</h2>
<p>With thousands of years of history, Iranian music is one of the richest musical systems in the world. A <strong>Dastgah</strong> in Iranian music goes beyond the Western concept of a scale: it's a collection of notes, gushehs (melodic fragments), melodies, and emotional atmosphere forming a complete musical world.</p>

<h2>The Seven Main Dastgahs of Iranian Music</h2>
<h3>1. Mahur</h3>
<p>The brightest and happiest dastgah, roughly equivalent to the Western major scale but with unique intervals and gushehs.</p>

<h3>2. Shur</h3>
<p>The most widely used and emotional dastgah. Four important avaz (vocal modes) derive from it.</p>

<h2>Conclusion</h2>
<p>Learning Iranian music dastgahs is a journey through a world of emotions and unparalleled beauty. At <strong>Mehr Avaye Baloot</strong>, our renowned Iranian music instructors teach the repertoire and dastgahs with a practical and systematic approach.</p>`,
    excerptFa: "آشنایی با هفت دستگاه اصلی موسیقی ایرانی: ماهور، شور، سه‌گاه، چهارگاه، نوا، همایون و راست‌پنج‌گاه. راهنمای کامل ساختار و یادگیری",
    excerptEn: "Introduction to the seven main dastgahs of Iranian music: Mahur, Shur, Segah, Chahargah, Nava, Homayun, and Rastpanjgah. Complete structure and learning guide",
    coverUrl: "/blog/covers/iranian-music-dastgah.png",
    coverAltFa: "دستگاه‌های موسیقی ایرانی",
    coverAltEn: "Iranian music dastgah system",
    tags: "موسیقی ایرانی,دستگاه,ردیف موسیقی,شور,ماهور,سه‌گاه",
    metaTitleFa: "دستگاه‌های موسیقی ایرانی: راهنمای کامل | مهر آوای بلوط",
    metaTitleEn: "Iranian Music Dastgah: Complete Guide | Mehr Avaye Baloot",
    metaDescriptionFa: "آشنایی با هفت دستگاه اصلی موسیقی ایرانی: ساختار، گوشه‌ها، حال‌وهوا و روش یادگیری. راهنمای کامل برای هنرجویان موسیقی سنتی ایرانی",
    metaDescriptionEn: "Introduction to the seven main dastgahs of Iranian music: structure, gushehs, atmosphere, and learning methods. Complete guide for Iranian traditional music students",
    keywords: "دستگاه موسیقی ایرانی,ماهور,شور,سه‌گاه,چهارگاه,ردیف موسیقی,آموزش موسیقی ایرانی",
    categorySlugs: ["موسیقی-ایرانی", "آموزش-موسیقی"],
    isPublished: true,
    isFeatured: false,
    isShowOnHome: true,
    order: 5,
  },

  // ---- Post 6: سلفژ و تربیت گوش ----
  {
    titleFa: "سلفژ و تربیت گوش: کلید طلایی موسیقی‌دان حرفه‌ای",
    titleEn: "Solfeggio and Ear Training: The Golden Key to Becoming a Professional Musician",
    slugFa: "سلفژ-و-تربیت-گوش",
    slugEn: "solfeggio-and-ear-training",
    contentFa: `<h2>سلفژ: زبان مادری موسیقی</h2>
<p><strong>سلفژ</strong> و تربیت گوش، دو بال پرواز هر موسیقی‌دان حرفه‌ای هستند. بدون توانایی خواندن نت و شنیدن دقیق فواصل، پیشرفت در موسیقی مانند رانندگی بدون چراغ در تاریکی خواهد بود. در این مقاله، اهمیت سلفژ و روش‌های مؤثر یادگیری آن را بررسی می‌کنیم.</p>

<h2>سلفژ چیست؟</h2>
<p>سلفژ از دو کلمه ایتالیایی <em>Sol</em> و <em>Fege</em> گرفته شده و به معنای خواندن نت‌ها با نام‌هایشان (دو-ر-می-فا-سل-لا-سی) است. اما سلفژ فراتر از نام‌بردن نت‌هاست:</p>
<ul>
<li>خواندن ریتمیک دقیق</li>
<li>شناسایی فواصل صوتی</li>
<li>خواندن پرده‌بندی و تونالیته</li>
<li>دیکته موسیقایی (نوشتن نت‌هایی که می‌شنوید)</li>
</ul>

<h2>چرا سلفژ مهم است؟</h2>
<ol>
<li><strong>سرعت یادگیری:</strong> هنرجویان با سلفژ قوی، قطعات جدید را ۳ تا ۵ برابر سریع‌تر یاد می‌گیرند</li>
<li><strong>استقلال موسیقایی:</strong> بدون نیاز به استاد برای خواندن نت‌های جدید</li>
<li><strong>ضبط و آهنگسازی:</strong> توانایی تبدیل ایده‌های ذهنی به نت</li>
<li><strong>ارکستر و گروه‌نوازی:</strong> هماهنگی با دیگر نوازندگان</li>
<li><strong>بداهه‌نوازی:</strong> شناسایی فوری فواصل و آکوردها</li>
</ol>

<h2>مراحل یادگیری سلفژ</h2>
<h3>مرحله ۱: آشنایی با نت‌ها و ریتم (ماه اول)</h3>
<ul>
<li>یادگیری نام نت‌ها روی خطوط حامل</li>
<li>مقادیر نت‌ها: تمام، نیم، چارک، هشتم</li>
<li>خواندن ملودی‌های ساده دوصدایی</li>
</ul>

<h3>مرحله ۲: فواصل و تونالیته (ماه دوم و سوم)</h3>
<ul>
<li>شناسایی فواصل: پریم، سکند، سوم، کوارت و...</li>
<li>آشنایی با علامت‌های کلید و تونالیته</li>
<li>خواندن در کلیدهای مختلف</li>
</ul>

<h3>مرحله ۳: دیکته موسیقایی (ماه چهارم تا ششم)</h3>
<ul>
<li>دیکته ریتمیک: نوشتن ریتمی که می‌شنوید</li>
<li>دیکته ملودیک: نوشتن ملودی که می‌شنوید</li>
<li>دیکته هارمونیک: شناسایی آکوردها</li>
</ul>

<h2>تمرینات عملی تربیت گوش</h2>
<h3>تمرین ۱: تطبیق صدا</h3>
<p>یک نت از پیانو بنوازید و سعی کنید با صدایتان دقیقاً همان نت را بخوانید. از نت‌های ساده شروع کنید و تدریجاً فواصل پیچیده را امتحان کنید.</p>

<h3>تمرین ۲: شناسایی فاصله</h3>
<p>اپلیکیشن‌هایی مانند <em>Perfect Ear</em> یا <em>Theta Music</em> برای تمرین شناسایی فواصل استفاده کنید.</p>

<h3>تمرین ۳: خواندن پیش‌بینی‌کننده</h3>
<p>قبل از نواختن یک نت، آن را در ذهن بخوانید. اگر با نت واقعی تطابق داشت، تربیت گوش شما در مسیر درست است.</p>

<h2>سلفژ در موسیقی ایرانی</h2>
<p>سلفژ در موسیقی ایرانی تفاوت‌هایی با موسیقی غربی دارد:</p>
<ul>
<li>فاصله‌های ربع‌پرده‌ای (میکروتونال)</li>
<li>گوشه‌ها و آوازهای خاص</li>
<li>تاثیر شعر و وزن عروضی بر ملودی</li>
</ul>

<h2>نتیجه‌گیری</h2>
<p>سلفژ و تربیت گوش، سرمایه‌ای مادام‌العمر برای هر موسیقی‌دان است. در <strong>مهر آوای بلوط</strong>، دوره‌های تخصصی سلفژ و تربیت گوش با روش‌های مؤثر و شخصی‌سازی شده ارائه می‌شود.</p>`,
    contentEn: `<h2>Solfeggio: The Mother Language of Music</h2>
<p><strong>Solfeggio</strong> and ear training are the wings of flight for every professional musician. Without the ability to read notes and accurately hear intervals, progress in music is like driving without headlights in the dark.</p>

<h2>Why is Solfeggio Important?</h2>
<ol>
<li><strong>Learning speed:</strong> Students with strong solfeggio learn new pieces 3-5 times faster</li>
<li><strong>Musical independence:</strong> No need for a teacher to read new notes</li>
<li><strong>Composition:</strong> Ability to convert mental ideas into notation</li>
<li><strong>Ensemble playing:</strong> Coordination with other musicians</li>
</ol>

<h2>Conclusion</h2>
<p>Solfeggio and ear training are lifelong assets for every musician. At <strong>Mehr Avaye Baloot</strong>, we offer specialized solfeggio and ear training courses with effective, personalized methods.</p>`,
    excerptFa: "اهمیت سلفژ و تربیت گوش در موسیقی: مراحل یادگیری، تمرینات عملی و تاثیر آن بر سرعت پیشرفت هنرجویان موسیقی",
    excerptEn: "Importance of solfeggio and ear training in music: learning stages, practical exercises, and their impact on music students' progress speed",
    coverUrl: "/blog/covers/solfeggio-ear-training.png",
    coverAltFa: "آموزش سلفژ و تربیت گوش موسیقی",
    coverAltEn: "Solfeggio and ear training in music",
    tags: "سلفژ,تربیت گوش,تئوری موسیقی,دیکته موسیقایی,آموزش موسیقی",
    metaTitleFa: "سلفژ و تربیت گوش: کلید موسیقی‌دان حرفه‌ای | مهر آوای بلوط",
    metaTitleEn: "Solfeggio and Ear Training: Key to Professional Musicianship | Mehr Avaye Baloot",
    metaDescriptionFa: "آموزش سلفژ و تربیت گوش موسیقی: اهمیت، مراحل یادگیری، تمرینات عملی. بدون سلفژ، پیشرفت موسیقایی مانند رانندگی در تاریکی است.",
    metaDescriptionEn: "Music solfeggio and ear training guide: importance, learning stages, practical exercises. Without solfeggio, musical progress is like driving in the dark.",
    keywords: "سلفژ,تربیت گوش,آموزش سلفژ,تئوری موسیقی,دیکته موسیقایی,کلاس سلفژ",
    categorySlugs: ["آموزش-موسیقی", "تکنیک-و-تمرین"],
    isPublished: true,
    isFeatured: false,
    isShowOnHome: false,
    order: 6,
  },

  // ---- Post 7: فولکور ایرانی ----
  {
    titleFa: "موسیقی فولکلور ایرانی: از آذربایجان تا خلیج فارس",
    titleEn: "Iranian Folk Music: From Azerbaijan to the Persian Gulf",
    slugFa: "موسیقی-فولکلور-ایرانی",
    slugEn: "iranian-folk-music",
    contentFa: `<h2>فولکلور ایرانی: آینه فرهنگ و هویت</h2>
<p>موسیقی فولکلور ایرانی، زنده‌ترین و پویاترین شکل موسیقی در ایران است. برخلاف موسیقی سنتی درباری که در محافل خاص رشد کرده، <strong>موسیقی فولکلور ریشه در مردم</strong> دارد و بازتاب‌دهنده زندگی، شادی، غم و امید اقوام مختلف ایران است.</p>

<h2>مناطق موسیقایی ایران</h2>
<h3>آذربایجان: آوازهای مقامی</h3>
<p>موسیقی آذربایجانی با مقام‌های منحصر به فردش شناخته می‌شود:</p>
<ul>
<li><strong>مقام راست:</strong> حماسی و شکوهمند</li>
<li><strong>مقام شور:</strong> عاشقانه و غمگین</li>
<li><strong>مقام سیگاه:</strong> عرفانی و مرموز</li>
<li>سازهای اصلی: تار، کمانچه، ناقاره، بلبان</li>
</ul>

<h3>کردستان: هوره و سیاه‌چمانه</h3>
<p>موسیقی کردی با آوازهای بی‌نظیرش:</p>
<ul>
<li><strong>هوره:</strong> آواز حماسی و بلند</li>
<li><strong>سیاه‌چمانه:</strong> آواز عاشقانه و غمگین</li>
<li>سازهای اصلی: تنبور، دف، سنتور، سه‌تار</li>
</ul>

<h3>بلوچستان: شاه‌نازی و مکولی</h3>
<p>موسیقی بلوچی با ریتم‌های خاص و آوازهای نالان:</p>
<ul>
<li><strong>شاه‌نازی:</strong> آواز عاشقانه</li>
<li><strong>مکولی:</strong> آواز مذهبی و عرفانی</li>
<li>سازهای اصلی: دونلی، بنجو، سرنا</li>
</ul>

<h3>فارس و جنوب: آوازهای دریایی</h3>
<ul>
<li>آوازهای ملوانی و دریانوردی خلیج فارس</li>
<li>نوعی آواز محلی فارس با حال‌وهوای لطیف</li>
<li>سازهای اصلی: نی‌انبان، دف، دایره</li>
</ul>

<h3>خراسان: بختیاری و قوشمق</h3>
<ul>
<li>آوازهای قوشمق ترکمنی با ریتم‌های پرانرژی</li>
<li>دوتار و آوازهای بختیاری</li>
</ul>

<h3>گلستان و مازندران: موسیقی جنگلی</h3>
<ul>
<li>آوازهای کار و زراعت</li>
<li>سازهای محلی: لاله، نی، کسرنج</li>
</ul>

<h2>اهمیت حفظ موسیقی فولکلور</h2>
<p>موسیقی فولکلور ایرانی با خطر فراموشی مواجه است. دلایل حفظ آن:</p>
<ul>
<li><strong>هویت فرهنگی:</strong> هر منطقه با موسیقی‌اش شناخته می‌شود</li>
<li><strong>الهام خلاقیت:</strong> منبع بی‌نهایت ایده برای آهنگسازان</li>
<li><strong>میراث نسل‌ها:</strong> دانش و هنر گذشتگان در این موسیقی نهفته است</li>
<li><strong>تنوع موسیقایی:</strong> ایران یکی از غنی‌ترین موسیقی‌های فولکلور جهان را دارد</li>
</ul>

<h2>نتیجه‌گیری</h2>
<p>موسیقی فولکلور ایرانی، گنجینه‌ای زنده از فرهنگ و هویت ماست. در <strong>مهر آوای بلوط</strong>، ما به آموزش و حفظ موسیقی فولکلور متعهد هستیم و کارگاه‌های تخصصی در این زمینه برگزار می‌کنیم.</p>`,
    contentEn: `<h2>Iranian Folk Music: Mirror of Culture and Identity</h2>
<p>Iranian folk music is the most vibrant and dynamic form of music in Iran. Unlike courtly traditional music, <strong>folk music is rooted in the people</strong>, reflecting the life, joy, sorrow, and hope of Iran's diverse ethnic groups.</p>

<h2>Iran's Musical Regions</h2>
<h3>Azerbaijan: Maqam Songs</h3>
<h3>Kurdistan: Hora and Siyah Chamaneh</h3>
<h3>Balochistan: Shah Nazi and Makoli</h3>

<h2>Conclusion</h2>
<p>Iranian folk music is a living treasure of our culture and identity. At <strong>Mehr Avaye Baloot</strong>, we are committed to teaching and preserving folk music through specialized workshops.</p>`,
    excerptFa: "سفری در موسیقی فولکلور ایران: از مقام‌های آذربایجان تا آوازهای خلیج فارس. آشنایی با مناطق موسیقایی و اهمیت حفظ میراث فولکلور",
    excerptEn: "A journey through Iranian folk music: from Azerbaijani maqams to Persian Gulf songs. Introduction to musical regions and the importance of preserving folk heritage",
    coverUrl: "/blog/covers/iranian-folklore.png",
    coverAltFa: "موسیقی فولکلور ایرانی",
    coverAltEn: "Iranian folk music",
    tags: "فولکلور,موسیقی محلی,موسیقی ایرانی,مقام آذربایجان,موسیقی کردی",
    metaTitleFa: "موسیقی فولکلور ایرانی: از آذربایجان تا خلیج فارس | مهر آوای بلوط",
    metaTitleEn: "Iranian Folk Music: From Azerbaijan to Persian Gulf | Mehr Avaye Baloot",
    metaDescriptionFa: "آشنایی با موسیقی فولکلور مناطق مختلف ایران: آذربایجان، کردستان، بلوچستان، فارس و خراسان. حفظ میراث موسیقایی اقوام ایرانی.",
    metaDescriptionEn: "Introduction to folk music from different regions of Iran: Azerbaijan, Kurdistan, Balochistan, Fars, and Khorasan. Preserving the musical heritage of Iranian ethnic groups.",
    keywords: "موسیقی فولکلور,موسیقی محلی ایران,مقام آذربایجان,موسیقی کردی,آواز بلوچی",
    categorySlugs: ["موسیقی-ایرانی"],
    isPublished: true,
    isFeatured: false,
    isShowOnHome: false,
    order: 7,
  },

  // ---- Post 8: گیتار کلاسیک ----
  {
    titleFa: "گیتار کلاسیک: ورود به دنیای زیبای هنر انگشت‌گذاری",
    titleEn: "Classical Guitar: Entering the Beautiful World of Fingerstyle Art",
    slugFa: "گیتار-کلاسیک-هنر-انگشت‌گذاری",
    slugEn: "classical-guitar-fingerstyle-art",
    contentFa: `<h2>گیتار کلاسیک: ساز شاعرانه‌ی موسیقی</h2>
<p>گیتار کلاسیک با صدای گرم و نرم تارهای نایلونی، یکی از صمیمی‌ترین و در عین حال پیچیده‌ترین سازهای موسیقی است. برخلاف گیتار الکتریک یا آکوستیک فولاد، <strong>گیتار کلاسیک با تارهای نایلون</strong> صدایی لطیف و پر از احساس تولید می‌کند که قرن‌ها آهنگسازان و نوازندگان را مجذوب خود ساخته است.</p>

<h2>تفاوت گیتار کلاسیک با سایر گیتارها</h2>
<table>
<tr><th>ویژگی</th><th>کلاسیک</th><th>آکوستیک</th><th>الکتریک</th></tr>
<tr><td>نوع تار</td><td>نایلون</td><td>فولاد</td><td>فولاد</td></tr>
<tr><td>عرض فینگربرد</td><td>پهن‌تر</td><td>باریک‌تر</td><td>باریک‌تر</td></tr>
<tr><td>تکنیک نوازندگی</td><td>انگشت‌گذاری</td><td>پک/انگشت</td><td>پک</td></tr>
<tr><td>سبک موسیقی</td><td>کلاسیک، فلامنکو</td><td>پاپ، فولک</td><td>راک، جاز</td></tr>
</table>

<h2>شروع کار: چرا گیتار کلاسیک بهترین انتخاب است؟</h2>
<ul>
<li><strong>تکنیک بنیادین:</strong> یادگیری انگشت‌گذاری، پایه‌ای برای همه سبک‌های گیتار</li>
<li><strong>تارهای نایلون:</strong> برای مبتدیان راحت‌تر از تارهای فولادی</li>
<li><strong>رپرتوار غنی:</strong> قرن‌ها آثار ارزشمند از آهنگسازان بزرگ</li>
<li><strong>نوازندگی انفرادی:</strong> بدون نیاز به گروه یا تجهیزات اضافی</li>
</ul>

<h2>تکنیک‌های پایه گیتار کلاسیک</h2>
<h3>نشستن و نگه‌داشتن گیتار</h3>
<p>نشستن صحیح پایه همه چیز است:</p>
<ul>
<li>گیتار روی پای چپ (برای راست‌دست‌ها)</li>
<li>پای چپ روی جایگاه (Footstool)</li>
<li>گردن گیتار با زاویه ۴۵ درجه به بالا</li>
<li>آرنج دست راست روی بدنه گیتار</li>
</ul>

<h3>دست راست: تکنیک انگشت‌گذاری</h3>
<ul>
<li><strong>P (شست):</strong> تارهای باس (۴، ۵، ۶)</li>
<li><strong>i (اشاره):</strong> تار ۳</li>
<li><strong>m (وسط):</strong> تار ۲</li>
<li><strong>a (حلقه):</strong> تار ۱</li>
</ul>

<h3>دست چپ: فشردن تارها</h3>
<ul>
<li>انگشت‌ها قوس‌دار و عمود بر فینگربرد</li>
<li>نوک انگشت، نزدیک فلز (Fret)</li>
<li>انگشت شست در پشت گردن، روبروی انگشت‌های دیگر</li>
</ul>

<h2>برنامه تمرین ۳۰ روزه اول</h3>
<ul>
<li><strong>هفته ۱:</strong> آشنایی با ساز، تکنیک دست راست (P-i-m-a)، نت‌های تار اول</li>
<li><strong>هفته ۲:</strong> نت‌های تارهای ۱-۳، آپاژاندو (فشردن)</li>
<li><strong>هفته ۳:</strong> گام دو ماژور، اولین ملودی‌های ساده</li>
<li><strong>هفته ۴:</strong> آکوردهای پایه، قطعه اول (مثلاً ملودی اسپانیایی ساده)</li>
</ul>

<h2>آهنگسازان بزرگ گیتار کلاسیک</h2>
<ul>
<li><strong>فرناندو سور:</strong> پدر گیتار کلاسیک</li>
<li><strong>فرانسیسکو تارگا:</strong> آهنگساز معروف آلبامبِرا</li>
<li><strong>آندرس سگویا:</strong> نوازنده افسانه‌ای که گیتار را به سالن‌های کنسرت آورد</li>
<li><strong>جولیان بریم و جان ویلیامز:</strong> نوازندگان قرن بیستم</li>
</ul>

<h2>نتیجه‌گیری</h2>
<p>گیتار کلاسیک، سفری زیبا در دنیای موسیقی است که با تکنیک صحیح و تمرین مستمر، به نتایج شگفت‌انگیزی می‌رسد. در <strong>مهر آوای بلوط</strong>، اساتید حرفه‌ای گیتار کلاسیک مسیر یادگیری شما را با صبر و تخصص هدایت می‌کنند.</p>`,
    contentEn: `<h2>Classical Guitar: The Poetic Instrument of Music</h2>
<p>The classical guitar, with its warm and soft nylon string sound, is one of the most intimate yet complex instruments. <strong>Classical guitar with nylon strings</strong> produces a delicate sound full of emotion that has captivated composers and performers for centuries.</p>

<h2>Why Classical Guitar is the Best Starting Choice</h2>
<ul>
<li><strong>Foundational technique:</strong> Learning fingerpicking provides a base for all guitar styles</li>
<li><strong>Nylon strings:</strong> Easier for beginners than steel strings</li>
<li><strong>Rich repertoire:</strong> Centuries of valuable works from great composers</li>
</ul>

<h2>Conclusion</h2>
<p>Classical guitar is a beautiful journey in the world of music. With proper technique and consistent practice, you'll achieve amazing results. At <strong>Mehr Avaye Baloot</strong>, our professional classical guitar instructors guide your learning journey with patience and expertise.</p>`,
    excerptFa: "آموزش گیتار کلاسیک از صفر: تفاوت با سایر گیتارها، تکنیک‌های انگشت‌گذاری، برنامه تمرین ۳۰ روزه و آهنگسازان بزرگ",
    excerptEn: "Classical guitar tutorial from scratch: differences from other guitars, fingerpicking techniques, 30-day practice plan, and great composers",
    coverUrl: "/blog/covers/classical-guitar.png",
    coverAltFa: "آموزش گیتار کلاسیک",
    coverAltEn: "Classical guitar tutorial",
    tags: "گیتار کلاسیک,آموزش گیتار,انگشت‌گذاری,گیتار نایلون,فینگراستایل",
    metaTitleFa: "گیتار کلاسیک: راهنمای کامل شروع | مهر آوای بلوط",
    metaTitleEn: "Classical Guitar: Complete Starter Guide | Mehr Avaye Baloot",
    metaDescriptionFa: "آموزش گیتار کلاسیک برای مبتدیان: تکنیک انگشت‌گذاری، نشستن صحیح، برنامه تمرین و معرفی آهنگسازان بزرگ. شروع اصولی گیتار کلاسیک.",
    metaDescriptionEn: "Classical guitar tutorial for beginners: fingerpicking technique, proper posture, practice schedule, and introduction to great composers. Start classical guitar properly.",
    keywords: "گیتار کلاسیک,آموزش گیتار کلاسیک,انگشت‌گذاری گیتار,خرید گیتار کلاسیک,کلاس گیتار",
    categorySlugs: ["سازهای-موسیقی", "تکنیک-و-تمرین"],
    isPublished: true,
    isFeatured: false,
    isShowOnHome: false,
    order: 8,
  },

  // ---- Post 9: موسیقی کودکان ----
  {
    titleFa: "آموزش موسیقی کودکان: چه سنی و چگونه شروع کنیم؟",
    titleEn: "Music Education for Children: What Age and How to Start?",
    slugFa: "آموزش-موسیقی-کودکان",
    slugEn: "music-education-for-children",
    contentFa: `<h2>موسیقی و کودک: دوستی که از شکم مادر شروع می‌شود</h2>
<p>تحقیقات نشان می‌دهد نوزادان حتی قبل از تولد به صداها واکنش نشان می‌دهند. <strong>آموزش موسیقی کودکان</strong> نه تنها یک مهارت هنری، بلکه سرمایه‌گذاری در رشد شناختی، عاطفی و اجتماعی فرزند شماست. در این مقاله، بر اساس آخرین تحقیقات علمی و تجربیات عملی، بهترین روش و زمان شروع آموزش موسیقی کودکان را بررسی می‌کنیم.</p>

<h2>مراحل رشد موسیقایی کودک</h2>
<h3>دوران نوزادی (۰ تا ۲ سال)</h3>
<ul>
<li>واکنش به ریتم و صداهای مختلف</li>
<li>لالایی و موسیقی آرامش‌بخش</li>
<li>آشنایی با صدای سازهای مختلف</li>
<li>فعالیت‌های پیشنهادی: لالایی خواندن، موسیقی کلاسیک، اسباب‌بازی‌های صوتی</li>
</ul>

<h3>دوران نوپایی (۲ تا ۴ سال)</h3>
<ul>
<li>شروع آواز خواندن ساده</li>
<li>واکنش ریتمیک به موسیقی</li>
<li>آشنایی با سازهای کوبه‌ای ساده</li>
<li>فعالیت‌های پیشنهادی: آوازهای کودکانه، دف و بنگو، بازی‌های ریتمیک</li>
</ul>

<h3>دوران پیش‌دبستانی (۴ تا ۶ سال)</h3>
<ul>
<li>شروع آمادگی برای آموزش رسمی</li>
<li>آشنایی با نت‌ها و نمادهای موسیقایی</li>
<li>سازهای مناسب: ویولن سایز کوچک، پیانو/کیبورد، ریکوردر</li>
<li>فعالیت‌های پیشنهادی: سلفژ بازی‌گونه، نقاشی نت‌ها، داستان‌های موسیقایی</li>
</ul>

<h3>دوران دبستانی (۶ تا ۱۰ سال)</h3>
<ul>
<li>شروع آموزش رسمی موسیقی</li>
<li>یادگیری تئوری پایه و سلفژ</li>
<li>انتخاب ساز اصلی</li>
<li>تمرین منظم روزانه ۱۵ تا ۳۰ دقیقه</li>
</ul>

<h2>بهترین سن شروع هر ساز</h2>
<table>
<tr><th>ساز</th><th>حداقل سن</th><th>سن ایده‌آل</th></tr>
<tr><td>پیانو/کیبورد</td><td>۴ سال</td><td>۵-۶ سال</td></tr>
<tr><td>ویولن</td><td>۳ سال (سایز ۱/۱۶)</td><td>۵-۶ سال</td></tr>
<tr><td>گیتار کلاسیک</td><td>۵ سال (سایز ۱/۴)</td><td>۷-۸ سال</td></tr>
<tr><td>ویولنسل</td><td>۵ سال</td><td>۷-۸ سال</td></tr>
<tr><td>دف و سازهای کوبه‌ای</td><td>۲ سال</td><td>۳-۴ سال</td></tr>
<tr><td>سازهای بادی</td><td>۷ سال</td><td>۹-۱۰ سال</td></tr>
</table>

<h2>روش‌های آموزش موسیقی کودکان</h2>
<h3>روش اورف (Orff)</h3>
<p>کارل اورف، آهنگساز آلمانی، روشی بر اساس حرکت، گفتار و نواختن开发了:</p>
<ul>
<li>یادگیری از طریق بازی و حرکت</li>
<li>استفاده از سازهای کوبه‌ای و ملودیک ساده</li>
<li>بداهه‌نوازی و خلاقیت</li>
</ul>

<h3>روش کدای (Kodály)</h3>
<ul>
<li>آموزش ابتدا از طریق آواز</li>
<li>استفاده از آوازهای فولکلور</li>
<li>یادگیری خواندن نت با دست (Curwen)</li>
</ul>

<h3>روش سوزوکی (Suzuki)</h3>
<ul>
<li>یادگیری موسیقی مانند زبان مادری</li>
<li>گوش دادن مستمر به قطعات</li>
<li>نقش فعال والدین</li>
<li>شروع زودهنگام (از ۳ سالگی)</li>
</ul>

<h2>نکات مهم برای والدین</h2>
<ol>
<li><strong>هرگز کودک را مجبور نکنید:</strong> موسیقی باید لذت‌بخش باشد</li>
<li><strong>صبور باشید:</strong> پیشرفت کودکان آهسته اما پایدار است</li>
<li><strong>برنامه منظم:</strong> ۱۵ دقیقه تمرین روزانه بهتر از یک ساعت در هفته</li>
<li><strong>تشویق نه تنبیه:</strong> از تشویق مثبت استفاده کنید</li>
<li><strong>حضور فعال:</strong> در تمرین‌ها همراه کودک باشید</li>
</ol>

<h2>فواید آموزش موسیقی کودکان</h2>
<ul>
<li>تقویت حافظه و تمرکز</li>
<li>توسعه هماهنگی دست و چشم</li>
<li>افزایش اعتماد به نفس</li>
<li>بهبود مهارت‌های اجتماعی</li>
<li>تقویت خلاقیت و حل مسئله</li>
<li>کاهش استرس و اضطراب</li>
</ul>

<h2>نتیجه‌گیری</h2>
<p>آموزش موسیقی کودکان، هدیه‌ای مادام‌العمر است. در <strong>مهر آوای بلوط</strong>، با اساتید متخصص پداگوژی موسیقی کودک و روش‌های مدرن، محیطی شاد و حرفه‌ای برای رشد موسیقایی فرزند شما فراهم کرده‌ایم.</p>`,
    contentEn: `<h2>Music and Children: A Friendship That Begins in the Womb</h2>
<p>Research shows that infants respond to sounds even before birth. <strong>Music education for children</strong> is not just an artistic skill but an investment in your child's cognitive, emotional, and social development.</p>

<h2>Best Starting Age for Each Instrument</h2>
<ul>
<li>Piano/Keyboard: From age 4, ideal 5-6</li>
<li>Violin: From age 3 (1/16 size), ideal 5-6</li>
<li>Classical Guitar: From age 5 (1/4 size), ideal 7-8</li>
</ul>

<h2>Conclusion</h2>
<p>Music education for children is a lifelong gift. At <strong>Mehr Avaye Baloot</strong>, our specialized child music pedagogy instructors and modern methods create a joyful and professional environment for your child's musical growth.</p>`,
    excerptFa: "راهنمای کامل آموزش موسیقی کودکان: مراحل رشد موسیقایی، بهترین سن شروع هر ساز، روش‌های آموزش اورف، کدای و سوزوکی، و نکات مهم والدین",
    excerptEn: "Complete guide to children's music education: developmental stages, best starting age for each instrument, Orff, Kodály, Suzuki methods, and important tips for parents",
    coverUrl: "/blog/covers/children-music.png",
    coverAltFa: "آموزش موسیقی کودکان",
    coverAltEn: "Music education for children",
    tags: "موسیقی کودکان,آموزش موسیقی کودک,روش سوزوکی,روش اورف,پیانو کودک",
    metaTitleFa: "آموزش موسیقی کودکان: چه سنی شروع کنیم؟ | مهر آوای بلوط",
    metaTitleEn: "Music Education for Children: When to Start? | Mehr Avaye Baloot",
    metaDescriptionFa: "راهنمای جامع آموزش موسیقی کودکان: بهترین سن شروع، روش‌های اورف و سوزوکی، انتخاب ساز مناسب و نکات مهم برای والدین.",
    metaDescriptionEn: "Complete guide to children's music education: best starting age, Orff and Suzuki methods, choosing the right instrument, and important tips for parents.",
    keywords: "آموزش موسیقی کودکان,موسیقی کودک,روش سوزوکی,بهترین سن موسیقی,کلاس پیانو کودک,آموزش ویولن کودک",
    categorySlugs: ["موسیقی-کودکان", "راهنمای-هنرجویان"],
    isPublished: true,
    isFeatured: false,
    isShowOnHome: false,
    order: 9,
  },
];

// ============================================
// Main Seed Function
// ============================================
async function main() {
  console.log("🌱 Seeding blog categories and posts...");

  // 1. Seed categories
  const categoryMap = new Map<string, string>(); // slug -> id
  for (const cat of categories) {
    const existing = await prisma.blogCategory.findFirst({
      where: { slugEn: cat.slugEn },
    });
    if (existing) {
      console.log(`  ⏭️  Category "${cat.nameFa}" already exists (id: ${existing.id})`);
      categoryMap.set(cat.slugFa, existing.id);
      categoryMap.set(cat.slugEn, existing.id);
      continue;
    }

    const created = await prisma.blogCategory.create({
      data: {
        nameFa: cat.nameFa,
        nameEn: cat.nameEn,
        slugFa: cat.slugFa,
        slugEn: cat.slugEn,
        descriptionFa: cat.descriptionFa,
        descriptionEn: cat.descriptionEn,
        color: cat.color,
        icon: cat.icon,
        order: cat.order,
        isPublished: cat.isPublished,
      },
    });

    categoryMap.set(cat.slugFa, created.id);
    categoryMap.set(cat.slugEn, created.id);
    console.log(`  ✅ Created category "${cat.nameFa}" (id: ${created.id})`);
  }

  // 2. Seed posts
  for (const post of posts) {
    const existing = await prisma.blogPost.findFirst({
      where: {
        OR: [
          { slugEn: post.slugEn },
          { slugFa: post.slugFa },
        ],
      },
    });
    if (existing) {
      console.log(`  ⏭️  Post "${post.titleFa.substring(0, 40)}..." already exists (id: ${existing.id})`);
      continue;
    }

    // Resolve category IDs
    const categoryIds = post.categorySlugs
      .map((slug) => categoryMap.get(slug))
      .filter(Boolean) as string[];

    // Estimate reading time from Persian content
    const text = post.contentFa.replace(/<[^>]*>/g, "").trim();
    const words = text.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(Math.ceil(words / 200), 1);

    // Publish date: stagger posts over the past 2 months
    const daysAgo = (posts.indexOf(post)) * 5; // Every 5 days
    const publishedAt = new Date();
    publishedAt.setDate(publishedAt.getDate() - daysAgo);

    const created = await prisma.blogPost.create({
      data: {
        titleFa: post.titleFa,
        titleEn: post.titleEn,
        slugFa: post.slugFa,
        slugEn: post.slugEn,
        contentFa: post.contentFa,
        contentEn: post.contentEn,
        excerptFa: post.excerptFa,
        excerptEn: post.excerptEn,
        coverUrl: post.coverUrl,
        coverAltFa: post.coverAltFa,
        coverAltEn: post.coverAltEn,
        tags: post.tags,
        metaTitleFa: post.metaTitleFa,
        metaTitleEn: post.metaTitleEn,
        metaDescriptionFa: post.metaDescriptionFa,
        metaDescriptionEn: post.metaDescriptionEn,
        keywords: post.keywords,
        readingTime,
        isPublished: post.isPublished,
        isFeatured: post.isFeatured,
        isShowOnHome: post.isShowOnHome,
        publishedAt,
        order: post.order,
        viewCount: Math.floor(Math.random() * 50) + 5, // Initial random views 5-55
      },
    });

    // Create category associations
    if (categoryIds.length > 0) {
      await prisma.blogPostToCategory.createMany({
        data: categoryIds.map((categoryId) => ({
          postId: created.id,
          categoryId,
        })),
      });
    }

    console.log(`  ✅ Created post "${post.titleFa.substring(0, 50)}..." (id: ${created.id}, readingTime: ${readingTime} min)`);
  }

  console.log("\n🎉 Blog seeding completed!");
  console.log(`  📂 ${categories.length} categories`);
  console.log(`  📝 ${posts.length} posts`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
