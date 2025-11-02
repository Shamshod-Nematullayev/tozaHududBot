export async function readQrFromBase64(
  base64String: string
): Promise<string | null> {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
  const imgBuffer = Buffer.from(base64Data, "base64");

  // Using 'jimp' and 'qrcode-reader' to decode QR code from image buffer
  const { Jimp } = await import("jimp");
  const { default: jsQR } = await import("jsqr");

  const image = await Jimp.read(imgBuffer);
  const width = image.bitmap.width;
  const height = image.bitmap.height;

  const imageData = {
    data: new Uint8ClampedArray(image.bitmap.data),
    width: width,
    height: height,
  };

  const qr = jsQR(imageData.data, width, height);

  if (qr) {
    return qr.data;
  } else {
    throw new Error("QR code not found in the image");
  }
}
