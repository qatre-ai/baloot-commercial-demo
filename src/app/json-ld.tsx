import { db } from "@/lib/db";

export async function JsonLd() {
  // Fetch latest blog posts for structured data
  let blogPosts: Array<{
    titleFa: string;
    titleEn: string;
    slugFa: string;
    slugEn: string;
    excerptFa: string | null;
    excerptEn: string | null;
    publishedAt: Date | null;
    coverUrl: string | null;
    author: { name: string } | null;
  }> = [];

  try {
    blogPosts = await db.blogPost.findMany({
      where: { isPublished: true, publishedAt: { lte: new Date() } },
      select: {
        titleFa: true,
        titleEn: true,
        slugFa: true,
        slugEn: true,
        excerptFa: true,
        excerptEn: true,
        publishedAt: true,
        coverUrl: true,
        author: { select: { name: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 10,
    });
  } catch {
    // Database unavailable, skip blog posts
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MusicSchool",
        "@id": "https://mehravayebalout.ir/#organization",
        name: "مهر آوای بلوط",
        alternateName: "Mehr Avaye Balout",
        url: "https://mehravayebalout.ir",
        logo: "https://mehravayebalout.ir/logo-mab.png",
        image: "https://mehravayebalout.ir/og-image.jpg",
        description:
          "مؤسسه موسیقی مهر آوای بلوط - مرکز تخصصی آموزش موسیقی و برگزاری کارگاه‌های حرفه‌ای در تهران. آموزش پیانو، ویولن، گیتار، آواز، سه‌تار و سازهای ایرانی با بهترین اساتید.",
        foundingDate: "1390",
        founder: {
          "@type": "Person",
          name: "مصطفی موگویی",
        },
        address: [
          {
            "@type": "PostalAddress",
            streetAddress: "آیت‌الله سعیدی، بلوار معلم، محله بهداشت، جنب خیابان سلیمانی، پلاک ۸۸",
            addressLocality: "تهران",
            addressRegion: "تهران",
            addressCountry: "IR",
          },
          {
            "@type": "PostalAddress",
            streetAddress: "محله یافت‌آباد، چهارراه قهوه‌خانه، بلوار الغدیر، خیابان توحید، پلاک ۱",
            addressLocality: "تهران",
            addressRegion: "تهران",
            addressCountry: "IR",
          },
        ],
        telephone: "+98-21-66245295",
        sameAs: [
          "https://instagram.com/mehravaye_baloot",
          "https://t.me/mehravaye_baloot",
          "https://youtube.com/@mehravaye_baloot",
        ],
        priceRange: "$$",
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Saturday",
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
          ],
          opens: "09:00",
          closes: "21:00",
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "دوره‌های آموزش موسیقی",
          itemListElement: [
            {
              "@type": "Course",
              name: "آموزش پیانو",
              description: "دوره آموزش پیانو از مبتدی تا پیشرفته",
              provider: { "@id": "https://mehravayebalout.ir/#organization" },
            },
            {
              "@type": "Course",
              name: "آموزش ویولن",
              description: "دوره آموزش ویولن کلاسیک و ایرانی",
              provider: { "@id": "https://mehravayebalout.ir/#organization" },
            },
            {
              "@type": "Course",
              name: "آموزش گیتار",
              description: "دوره آموزش گیتار کلاسیک، آکوستیک و الکتریک",
              provider: { "@id": "https://mehravayebalout.ir/#organization" },
            },
            {
              "@type": "Course",
              name: "آموزش آواز",
              description: "دوره آموزش آواز سنتی ایرانی و پاپ",
              provider: { "@id": "https://mehravayebalout.ir/#organization" },
            },
            {
              "@type": "Course",
              name: "آموزش سه‌تار",
              description: "دوره آموزش سه‌تار با ردیف موسیقی ایرانی",
              provider: { "@id": "https://mehravayebalout.ir/#organization" },
            },
            {
              "@type": "Course",
              name: "تئوری موسیقی و سلفژ",
              description: "دوره تئوری موسیقی و سلفژ پایه و پیشرفته",
              provider: { "@id": "https://mehravayebalout.ir/#organization" },
            },
          ],
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://mehravayebalout.ir/#website",
        url: "https://mehravayebalout.ir",
        name: "مهر آوای بلوط",
        alternateName: "Mehr Avaye Balout Music Academy",
        inLanguage: ["fa-IR", "en-US"],
        publisher: {
          "@id": "https://mehravayebalout.ir/#organization",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: "https://mehravayebalout.ir/?search={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Blog",
        "@id": "https://mehravayebalout.ir/#blog",
        url: "https://mehravayebalout.ir/#blog",
        name: "بلاگ موسیقی مهر آوای بلوط",
        alternateName: "Mehr Avaye Balout Music Blog",
        description:
          "مقالات و محتوای آموزشی تخصصی موسیقی، تئوری موسیقی، آموزش ساز، نکات نوازندگی و سبک‌های موسیقی",
        inLanguage: ["fa-IR", "en-US"],
        publisher: {
          "@id": "https://mehravayebalout.ir/#organization",
        },
        blogPost: blogPosts.map((post) => ({
          "@type": "BlogPosting",
          headline: post.titleFa,
          alternativeHeadline: post.titleEn,
          description: post.excerptFa || "",
          url: `https://mehravayebalout.ir/blog/${post.slugEn}`,
          datePublished: post.publishedAt?.toISOString(),
          author: post.author
            ? { "@type": "Person", name: post.author.name }
            : { "@id": "https://mehravayebalout.ir/#organization" },
          publisher: { "@id": "https://mehravayebalout.ir/#organization" },
          image: post.coverUrl
            ? `https://mehravayebalout.ir${post.coverUrl}`
            : undefined,
          inLanguage: "fa-IR",
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
