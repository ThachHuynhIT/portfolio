import * as THREE from "three";

export const parseRGBStringToColor = (rgbString: string) => {
  const match = rgbString.match(/rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i);
  if (match) {
    const r = parseInt(match[1], 10) / 255;
    const g = parseInt(match[2], 10) / 255;
    const b = parseInt(match[3], 10) / 255;
    return new THREE.Color(r, g, b);
  }
  // Nếu không đúng định dạng thì fallback sang khởi tạo bằng string (hex, tên màu...)
  return new THREE.Color(rgbString);
};
