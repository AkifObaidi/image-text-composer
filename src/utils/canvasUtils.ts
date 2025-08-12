export const MAX_WIDTH = 900;
export const MAX_HEIGHT = 600;

export function getScaledDimensions(
  width: number,
  height: number
): { width: number; height: number } {
  let scaledWidth = width;
  let scaledHeight = height;

  if (width > MAX_WIDTH) {
    scaledWidth = MAX_WIDTH;
    scaledHeight = (height * MAX_WIDTH) / width;
  }

  if (scaledHeight > MAX_HEIGHT) {
    scaledWidth = (scaledWidth * MAX_HEIGHT) / scaledHeight;
    scaledHeight = MAX_HEIGHT;
  }

  return { width: scaledWidth, height: scaledHeight };
}

