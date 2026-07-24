export type Category =
  | 'kemp-palakka'
  | 'antique-temple'
  | 'american-diamond'
  | 'micro-gold'
  | 'earrings';

export type Product = {
  slug: string;
  name: string;
  category: Category;
  price: number;
  compareAt?: number; // original / MRP price for showing a discount
  images: string[];
  description: string;
  highlights: string[];
  featured?: boolean;
};

export const categories: { id: Category; label: string; blurb: string }[] = [
  {
    id: 'kemp-palakka',
    label: 'Kemp & Palakka',
    blurb: 'Kerala-style green palakka and ruby kemp stone sets.',
  },
  {
    id: 'antique-temple',
    label: 'Antique & Temple',
    blurb: 'Gold-finish mango, peacock and Lakshmi temple jewellery.',
  },
  {
    id: 'american-diamond',
    label: 'American Diamond',
    blurb: 'Sparkling AD / CZ stone necklace sets with earrings.',
  },
  {
    id: 'micro-gold',
    label: 'Micro Gold Plated',
    blurb: 'Long lasting micro gold plated kaasu malas and harams.',
  },
  {
    id: 'earrings',
    label: 'Earrings & Jhumkas',
    blurb: 'Temple jhumkas, ear hangings and stone-drop earrings.',
  },
];

export const products: Product[] = [
  {
    slug: 'green-palakka-necklace-set',
    name: 'Royal Green Palakka Necklace Set',
    category: 'kemp-palakka',
    price: 462,
    compareAt: 615,
    images: ['/products/green-palakka-1.jpg', '/products/green-palakka-2.jpg'],
    description:
      'A timeless Kerala palakka mala with rich green stones framed in antique gold, accented by red kemp squares. Comes with matching jhumka earrings — perfect for saree and traditional looks.',
    highlights: ['Green palakka + red kemp stones', 'Antique gold finish', 'Matching earrings included'],
    featured: true,
  },
  {
    slug: 'ruby-kemp-necklace-set',
    name: 'Ruby Red Kemp Necklace Set',
    category: 'kemp-palakka',
    price: 443,
    compareAt: 590,
    images: ['/products/ruby-kemp-1.jpg', '/products/ruby-kemp-2.jpg'],
    description:
      'Traditional South Indian kemp choker with deep ruby-red stones and delicate green highlights, finished in warm antique gold. Paired with pearl-drop jhumkas.',
    highlights: ['Ruby red kemp stones', 'Pearl jhumka earrings', '25% off launch price'],
    featured: true,
  },
  {
    slug: 'pink-kemp-choker-set',
    name: 'Pink Kemp Layered Choker Set',
    category: 'kemp-palakka',
    price: 443,
    compareAt: 590,
    images: ['/products/pink-kemp-1.jpg'],
    description:
      'A statement layered choker in vivid pink kemp stones with a fine gold beaded border and green stone centres. Includes matching studs — a bold pick for festive wear.',
    highlights: ['Layered pink kemp design', 'Gold beaded border', 'Matching earrings included'],
  },
  {
    slug: 'antique-gold-mango-necklace-set',
    name: 'Antique Gold Mango Necklace Set',
    category: 'antique-temple',
    price: 525,
    compareAt: 699,
    images: ['/products/gold-mango-1.jpg', '/products/gold-mango-2.jpg', '/products/gold-mango-3.jpg'],
    description:
      'Classic manga malai with intricately carved mango (paisley) motifs and ruby accents in a rich antique gold finish. A wardrobe essential that pairs with every traditional outfit.',
    highlights: ['Carved mango motifs', 'Ruby stone accents', 'Antique gold finish'],
    featured: true,
  },
  {
    slug: 'peacock-green-stone-necklace-set',
    name: 'Peacock Green Stone Necklace Set',
    category: 'antique-temple',
    price: 525,
    compareAt: 699,
    images: ['/products/peacock-green-1.jpg', '/products/peacock-green-2.jpg'],
    description:
      'Elegant temple set featuring peacock-carved pendants with emerald-green square stones. The antique gold detailing gives it a heritage bridal charm.',
    highlights: ['Peacock temple motifs', 'Green stone detailing', 'Matching earrings included'],
  },
  {
    slug: 'lakshmi-coin-necklace-set',
    name: 'Lakshmi Temple Coin Necklace Set',
    category: 'antique-temple',
    price: 525,
    compareAt: 699,
    images: ['/products/lakshmi-coin-1.jpg'],
    description:
      'Divine Lakshmi kaasu design with mango drops and green stones in antique gold. A graceful temple necklace that adds instant grandeur to silk sarees.',
    highlights: ['Lakshmi coin + mango motifs', 'Green stone accents', 'Antique gold finish'],
  },
  {
    slug: 'rose-lotus-bird-kundan-set',
    name: 'Rose Lotus Bird Kundan Necklace Set',
    category: 'antique-temple',
    price: 525,
    compareAt: 699,
    images: ['/products/rose-lotus-bird-1.jpg', '/products/rose-lotus-bird-2.jpg'],
    description:
      'An artful jadau-style set with rose-pink enamel birds perched around a kundan lotus, finished with green bead drops. A contemporary heritage piece that stands out.',
    highlights: ['Enamel bird & lotus design', 'Kundan stones + bead drops', 'Matching earrings included'],
    featured: true,
  },
  {
    slug: 'american-diamond-white-drop-set',
    name: 'American Diamond White Drop Necklace Set',
    category: 'american-diamond',
    price: 655,
    images: ['/products/ad-white-1.jpg'],
    description:
      'A dazzling American Diamond (CZ) necklace with pear-cut white drops on a fine gold-tone chain. Includes matching earrings — an effortless choice for parties and receptions.',
    highlights: ['Pear-cut AD stones', 'Gold-tone finish', 'Matching earrings included'],
    featured: true,
  },
  {
    slug: 'rose-pink-ad-necklace-set',
    name: 'Rose Pink AD Necklace Set',
    category: 'american-diamond',
    price: 655,
    images: ['/products/ad-pink-1.jpg'],
    description:
      'Soft rose-pink American Diamond drops set in sparkling CZ, delivering a romantic pastel glow. Comes with coordinated earrings.',
    highlights: ['Rose pink AD drops', 'Sparkling CZ setting', 'Matching earrings included'],
  },
  {
    slug: 'emerald-green-ad-necklace-set',
    name: 'Emerald Green AD Necklace Set',
    category: 'american-diamond',
    price: 655,
    images: ['/products/ad-emerald-1.jpg'],
    description:
      'Lush emerald-green American Diamond drops framed by brilliant white CZ stones. A regal contrast piece with matching jhumka earrings.',
    highlights: ['Emerald green AD drops', 'White CZ border', 'Matching earrings included'],
  },
  {
    slug: 'ruby-red-ad-necklace-set',
    name: 'Ruby Red AD Necklace Set',
    category: 'american-diamond',
    price: 655,
    images: ['/products/ad-ruby-1.jpg'],
    description:
      'Bold ruby-red American Diamond drops with sparkling CZ accents on a delicate gold-tone chain. Includes matching earrings for a complete festive look.',
    highlights: ['Ruby red AD drops', 'Delicate gold-tone chain', 'Matching earrings included'],
  },
  {
    slug: 'micro-gold-kaasu-mala-short',
    name: 'Micro Gold Kaasu Mala — Short Necklace',
    category: 'micro-gold',
    price: 799,
    images: ['/products/kaasu-mala-1.jpg'],
    description:
      'A dainty micro gold plated kaasu (coin) mala with five Lakshmi coins on a rope chain. Long-lasting plating with a rich gold shine — light and everyday-elegant.',
    highlights: ['Micro gold plated', 'Lakshmi kaasu coins', 'Short, lightweight design'],
    featured: true,
  },
  {
    slug: 'micro-gold-green-stone-necklace',
    name: 'Micro Gold Green Stone Necklace',
    category: 'micro-gold',
    price: 1750,
    images: ['/products/micro-green-1.jpg'],
    description:
      'Antique micro gold plated necklace studded with round green stones and Lakshmi coin drops. A premium heritage piece with durable, tarnish-resistant plating.',
    highlights: ['Micro gold plated', 'Green stones + coin drops', 'Antique heritage design'],
  },
  {
    slug: 'micro-gold-emerald-stone-necklace',
    name: 'Micro Gold Emerald Stone Necklace',
    category: 'micro-gold',
    price: 2150,
    images: ['/products/micro-emerald-1.jpg'],
    description:
      'A grand micro gold plated necklace with large emerald-green stones set in ornate antique gold clusters. A show-stopping bridal-grade statement.',
    highlights: ['Micro gold plated', 'Large emerald stones', 'Bridal statement piece'],
  },
  {
    slug: 'micro-gold-lakshmi-coin-haram',
    name: 'Micro Gold Lakshmi Coin Long Haram',
    category: 'micro-gold',
    price: 2550,
    images: ['/products/micro-lakshmi-haram-1.jpg'],
    description:
      'A regal long haram in micro gold plating, lined with Lakshmi kaasu coins and ruby accents. The ultimate traditional piece for weddings and grand occasions.',
    highlights: ['Micro gold plated', 'Full Lakshmi coin haram', 'Long, bridal length'],
    featured: true,
  },
  {
    slug: 'ganapathi-idol-jhumka',
    name: 'Premium Ganapathi Idol Jhumka',
    category: 'earrings',
    price: 444,
    images: ['/products/ganapathi-jhumka-1.jpg', '/products/ganapathi-jhumka-2.jpg'],
    description:
      'Statement antique-gold jhumkas crowned with a detailed Lord Ganapathi idol, finished with an intricately embossed dome and a fringe of white pearl drops. A divine, temple-style pick for festive and traditional wear.',
    highlights: ['Ganapathi idol top', 'Embossed antique gold dome', 'White pearl drop fringe'],
    featured: true,
  },
  {
    slug: 'ruby-stone-jhumka',
    name: 'Premium Ruby Stone Jhumka',
    category: 'earrings',
    price: 399,
    images: ['/products/ruby-stone-jhumka-1.jpg', '/products/ruby-stone-jhumka-2.jpg'],
    description:
      'Elegant antique-gold jhumkas set with a deep ruby-red stone at the top and finished with a cascade of faceted ruby bead drops. A rich, classic accent that pairs beautifully with silk sarees and traditional outfits.',
    highlights: ['Ruby red stone top', 'Antique gold jhumka dome', 'Faceted ruby bead drops'],
    featured: true,
  },
  {
    slug: 'layered-floral-swirl-ear-hangings',
    name: 'Layered Floral Swirl Ear Hangings',
    category: 'earrings',
    price: 399,
    images: ['/products/floral-swirl-hangings-1.jpg'],
    description:
      'Long gold-tone ear hangings with a sparkling CZ flower stud and a tiered, open swirl cage, finished with white pearl drops. Lightweight and eye-catching for parties and receptions.',
    highlights: ['CZ flower stud top', 'Tiered swirl cage design', 'White pearl drops'],
  },
  {
    slug: 'lakshmi-idol-kaasu-jhumka',
    name: 'Lakshmi Idol Kaasu Jhumka',
    category: 'earrings',
    price: 719,
    images: ['/products/lakshmi-idol-jhumka-1.jpg'],
    description:
      'Micro gold plated jhumkas featuring a Lakshmi kaasu (coin) stud and a coin-lined dome with red stone accents, finished with a row of gold spike drops. Traditional temple charm with durable, long-lasting plating.',
    highlights: ['Micro gold plated', 'Lakshmi kaasu coin design', 'Gold spike drop fringe'],
  },
  {
    slug: 'lakshmi-kaasu-maala-pink-stone',
    name: 'Traditional Lakshmi Kaasu Maala — Pink Stone',
    category: 'micro-gold',
    price: 1689,
    images: [
      '/products/lakshmi-kaasu-maala-1.jpeg',
      '/products/lakshmi-kaasu-maala-2.jpg',
      '/products/lakshmi-kaasu-maala-3.jpg',
    ],
    description:
      'A traditional micro gold plated kaasu maala lined with detailed Lakshmi coins and connected by pink kemp stone links. A graceful, heritage-length necklace that adds grandeur to silk sarees and bridal looks.',
    highlights: ['Micro gold plated', 'Full Lakshmi kaasu coins', 'Pink stone links'],
    featured: true,
  },
  {
    slug: 'single-layer-traditional-elakkathali',
    name: 'Single Layer Traditional Elakkathali',
    category: 'micro-gold',
    price: 1679,
    images: ['/products/single-layer-elakkathali-1.jpg', '/products/single-layer-elakkathali-2.jpg'],
    description:
      'A classic Kerala-style elakkathali choker in rich micro gold plating, woven from fine gold beads and leaf motifs into a single dense layer. Comes with matching earrings — a timeless traditional staple.',
    highlights: ['Micro gold plated', 'Traditional elakkathali weave', 'Matching earrings included'],
  },
  {
    slug: 'emerald-bead-elakkathali',
    name: 'Emerald Bead Elakkathali Choker',
    category: 'micro-gold',
    price: 1459,
    images: ['/products/emerald-elakkathali-1.jpg', '/products/emerald-elakkathali-2.jpg'],
    description:
      'A micro gold plated elakkathali choker bordered with emerald-green bead hangings and a green stone centrepiece. The gold leaf detailing and coloured bead fringe make it a fresh take on a traditional favourite.',
    highlights: ['Micro gold plated', 'Emerald green bead hangings', 'Green stone centre'],
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function productsByCategory(category: Category) {
  return products.filter((p) => p.category === category);
}

export const featuredProducts = products.filter((p) => p.featured);
