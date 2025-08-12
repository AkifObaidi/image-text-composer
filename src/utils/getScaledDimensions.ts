export function getScaledDimensions(
    width: number,
    height: number,
    maxWidth = 1000,
    maxHeight = 700
) {
    let ratio = Math.min(maxWidth / width, maxHeight / height);
    if (ratio > 1) ratio = 1;
    return {
        width: Math.round(width * ratio),
        height: Math.round(height * ratio),
    };
}
