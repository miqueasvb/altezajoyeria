const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imagesDir = path.join(__dirname, 'images');

if (fs.existsSync(imagesDir)) {
  const files = fs.readdirSync(imagesDir);

  files.forEach(async (file) => {
    const filePath = path.join(imagesDir, file);
    const ext = path.extname(file).toLowerCase();

    // Solo procesa JPG, JPEG y PNG
    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      try {
        const tempPath = path.join(imagesDir, 'temp_' + file);
        
        // Redimensiona a max 1200px de ancho y comprime al 80% de calidad
        await sharp(filePath)
          .resize({ width: 1200, withoutEnlargement: true })
          .jpeg({ quality: 80, force: false })
          .png({ compressionLevel: 8, force: false })
          .toFile(tempPath);

        // Reemplaza la imagen original por la optimizada
        fs.renameSync(tempPath, filePath);
        console.log(`✅ Imagen optimizada: ${file}`);
      } catch (err) {
        console.error(`❌ Error procesando ${file}:`, err);
      }
    }
  });
}
