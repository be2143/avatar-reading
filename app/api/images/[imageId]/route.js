// A simple in-memory store for demonstration.
// In a real app, you'd use a database, Redis, or upload to cloud storage.
const inMemoryImageStore = {}; // DON'T USE IN PRODUCTION, FOR DEMO ONLY

export function storeBase64Image(id, base64Data, mimeType) {
  inMemoryImageStore[id] = { base64Data, mimeType };
}

export async function GET(request, { params }) {
  const { imageId } = params;
  const imageData = inMemoryImageStore[imageId];

  if (!imageData) {
    return new NextResponse('Image not found', { status: 404 });
  }

  // Convert Base64 string to a Buffer
  const imageBuffer = Buffer.from(imageData.base64Data, 'base64');

  // Set the correct content type for the image
  const headers = {
    'Content-Type': imageData.mimeType,
    'Content-Length': imageBuffer.length.toString(),
    'Cache-Control': 'public, max-age=31536000, immutable', // Cache for a year
  };

  return new NextResponse(imageBuffer, { headers });
}