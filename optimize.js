const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imagesDir = path.join(__dirname, 'images');

async function optimizeImages() {
  if (!fs.existsSync(imagesDir)) return;

  const files = fs.readdirSync(imagesDir);

  for (const file of files) {
    if (file.startsWith('temp_')) continue;

    const filePath = path.join(imagesDir, file);
    const ext = path.extname(file).toLowerCase();

    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      try {
        const tempPath = path.join(imagesDir, 'temp_' + file);

        // Procesa la imagen respetando exactamente su orientación nativa
        await sharp(filePath, { failOnError: false })
          .rotate(0) // Mantiene el ángulo original sin intentar adivinar rotaciones EXIF
          .resize({ width: 1200, withoutEnlargement: true })
          .jpeg({ quality: 80, force: false })
          .png({ compressionLevel: 8, force: false })
          .toFile(tempPath);

        fs.renameSync(tempPath, filePath);
        console.log(`✅ Imagen optimizada (respetando orientación): ${file}`);
      } catch (err) {
        console.error(`❌ Error procesando ${file}:`, err);
      }
    }
  }
}

optimizeImages();
