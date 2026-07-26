const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imagesDir = path.join(__dirname, 'images');

async function optimizeImages() {
  if (!fs.existsSync(imagesDir)) return;

  const files = fs.readdirSync(imagesDir);

  for (const file of files) {
    // Ignoramos archivos temporales si existieran
    if (file.startsWith('temp_')) continue;

    const filePath = path.join(imagesDir, file);
    const ext = path.extname(file).toLowerCase();

    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      try {
        const tempPath = path.join(imagesDir, 'temp_' + file);

        await sharp(filePath)
          .resize({ width: 1200, withoutEnlargement: true })
          .jpeg({ quality: 80, force: false })
          .png({ compressionLevel: 8, force: false })
          .toFile(tempPath);

        // Sobrescribimos la imagen original con la versión liviana
        fs.renameSync(tempPath, filePath);
        console.log(`✅ Imagen optimizada: ${file}`);
      } catch (err) {
        console.error(`❌ Error procesando ${file}:`, err);
      }
    }
  }
}

optimizeImages();
