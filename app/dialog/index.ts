// app/dialog/index.ts
import { boyDialogNodes } from "./boy";
import { malikDialogNodes } from "./malik";
// import more as you add them…

export const dialogNodes = {
  ...boyDialogNodes,
  ...malikDialogNodes,
  // ...more groups
};
