import type { TaskCard } from "@/types/app";

export const TASK_CARDS: TaskCard[] = [
  {
    key: "math",
    title: "数学题",
    delta: 3,
    prompt:
      "children's illustration, zootopia inspired anthropomorphic animal city, cute bunny police officer heroine solving math on a chalkboard, numbers and simple equations, bright pastel, clean line art, soft shading",
  },
  {
    key: "cn_picture_book",
    title: "读中文绘本",
    delta: 1,
    prompt:
      "children's illustration, zootopia inspired, cute bunny police officer heroine reading a picture book with Chinese characters on the cover, cozy reading corner, bright cheerful, clean line art",
  },
  {
    key: "en_picture_book",
    title: "英文绘本",
    delta: 1,
    prompt:
      "children's illustration, zootopia inspired, cute bunny police officer heroine reading an English ABC book, letters A B C on cover, cozy, bright pastel",
  },
  {
    key: "hygiene",
    title: "自觉洗漱",
    delta: 1,
    prompt:
      "children's illustration, zootopia inspired, bunny police officer heroine brushing teeth and washing face, bathroom bubbles, clean line art, bright cheerful",
  },
  {
    key: "dress",
    title: "穿衣服",
    delta: 1,
    prompt:
      "children's illustration, zootopia inspired, bunny police officer heroine getting dressed, folding clothes, warm morning light, soft shading",
  },
  {
    key: "praise",
    title: "老师表扬",
    delta: 5,
    prompt:
      "children's illustration, zootopia inspired, bunny police officer heroine receiving a praise certificate and gold badge, stars and medal, bright celebratory",
  },
];

