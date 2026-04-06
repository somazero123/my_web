export type ProductImageSource = "upload" | "recommend" | "seed";

export type ProductImage = {
  id: string;
  url: string;
  source: ProductImageSource;
  sortOrder: number;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  stock: number;
  coverImageUrl?: string;
  images: ProductImage[];
  createdAt: string;
};

export type PointsLedgerItem = {
  id: string;
  delta: number;
  reason: string;
  createdAt: string;
};

export type TaskCardKey =
  | "math"
  | "cn_picture_book"
  | "en_picture_book"
  | "hygiene"
  | "dress"
  | "praise";

export type TaskCard = {
  key: TaskCardKey;
  title: string;
  delta: number;
  prompt: string;
};

