import productFoundersTeeBackWhite from "@/assets/product-founders-tee-back-white.png";
import productSleevelessFrontBlack from "@/assets/product-sleeveless-front-black.png";
import productSleevelessBackBlack from "@/assets/product-sleeveless-back-black.png";
import productShortsBlack from "@/assets/product-shorts-black.png";
import productSleevelessBackWhite from "@/assets/product-sleeveless-back-white.png";
import productTeeFrontBlack from "@/assets/product-tee-front-black.png";
import productTeeBackBlack from "@/assets/product-tee-back-black.png";
import patch225 from "@/assets/patch-225.jpg.asset.json";
import patch315 from "@/assets/patch-315.jpg.asset.json";
import patch405 from "@/assets/patch-405.jpg.asset.json";

export type ProductColor = {
  name: string;
  swatch: string; // hex for swatch dot
  image: string;
  gallery: string[];
};

export type Product = {
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  gallery: string[];
  tag: string | null;
  style: "Tops" | "Bottoms" | "Accessories";
  description: string;
  details: string[];
  fitNote?: string;
  sizes: string[];
  colors?: ProductColor[];
  membersOnly?: boolean;
  soldOut?: boolean;
};

export const products: Product[] = [
  {
    slug: "founders-t-shirt",
    name: "Founders T-Shirt",
    price: 55,
    compareAtPrice: 69,
    image: productFoundersTeeBackWhite,
    gallery: [productFoundersTeeBackWhite, productTeeFrontBlack],
    tag: "BESTSELLER",
    style: "Tops",
    description:
      "The Founders' Club tee. A heavyweight statement piece for the original collective — a collective of the committed. Choose your print.",
    details: [
      "Ultra heavyweight modal cotton spandex blend",
      "Four-way stretch for maximum mobility",
      "Breathable & moisture-wicking",
      "Oversized fit with a structured, durable collar",
      "Embossed NTY logo on front",
      "Founders print on back",
      "Built to last. Made to move.",
    ],
    fitNote: "Size down 1–2 for a more traditional fit.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    soldOut: true,
    colors: [
      {
        name: "Contrast White",
        swatch: "#f5f5f5",
        image: productFoundersTeeBackWhite,
        gallery: [productFoundersTeeBackWhite, productTeeFrontBlack],
      },
      {
        name: "Blackout",
        swatch: "#111111",
        image: productTeeBackBlack,
        gallery: [productTeeBackBlack, productTeeFrontBlack],
      },
    ],
  },
  {
    slug: "sleeveless-crewneck",
    name: "Sleeveless Crewneck",
    price: 55,
    compareAtPrice: 69,
    image: productSleevelessFrontBlack,
    gallery: [productSleevelessFrontBlack, productSleevelessBackBlack, productSleevelessBackWhite],
    tag: null,
    style: "Tops",
    description:
      "A sleeveless crewneck that fits like your favorite sweatshirt. Cut-off drop shoulder, soft feel, built for everyday.",
    details: [
      "Cotton blend with soft fleece interior",
      "Lightweight sweatshirt feel",
      "Cut-off drop shoulder",
      "Wide armhole for full range of motion",
      "Embossed NTY logo",
      "Structured fit with a retro-inspired vibe",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    soldOut: true,
    colors: [
      {
        name: "Blackout",
        swatch: "#111111",
        image: productSleevelessBackBlack,
        gallery: [productSleevelessFrontBlack, productSleevelessBackBlack],
      },
      {
        name: "Contrast White",
        swatch: "#f5f5f5",
        image: productSleevelessBackWhite,
        gallery: [productSleevelessFrontBlack, productSleevelessBackWhite],
      },
    ],
  },
  {
    slug: "muscle-fit-shorts",
    name: "Muscle Fit Shorts",
    price: 55,
    compareAtPrice: 69,
    image: productShortsBlack,
    gallery: [productShortsBlack],
    tag: null,
    style: "Bottoms",
    description: "Mid-length training short. Built for performance, designed to move with you.",
    details: [
      "Tailored muscle fit",
      "Heavy-duty, performance material",
      "Hidden zip pockets",
      "Thick, supportive waistband",
      "Mesh-lined interior",
      "Tonal NTY mark",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    soldOut: true,
  },
  {
    slug: "bench-club-patches",
    name: "Bench Club Patches",
    price: 25,
    image: patch405.url,
    gallery: [patch405.url, patch315.url, patch225.url],
    tag: "MEMBERS ONLY",
    style: "Accessories",
    description:
      "The official NATTY VERIFIED patches — 135, 225, 315, 405. Earned, not bought. Available exclusively to verified Bench Club members.",
    details: [
      "Embroidered iron-on / sew-on patches",
      "One patch per tier earned",
      "Reserved for verified Bench Club members",
      "Not available to non-members",
    ],
    sizes: ["ONE SIZE"],
    membersOnly: true,
  },
];

export const getProductBySlug = (slug: string) => products.find((p) => p.slug === slug);
