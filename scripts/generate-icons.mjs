import sharp from 'sharp'
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

// Create SVG with "WC" text
function createSvg(size) {
  const fontSize = Math.floor(size * 0.45)
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="white"/>
      <text
        x="50%"
        y="54%"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}px"
        font-weight="bold"
        fill="black"
        text-anchor="middle"
        dominant-baseline="middle"
      >WC</text>
    </svg>
  `
}

async function generateIcons() {
  const sizes = [192, 512]

  for (const size of sizes) {
    const svg = createSvg(size)
    const outputPath = join(publicDir, `icon-${size}.png`)

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath)

    console.log(`Created: icon-${size}.png`)
  }

  // Also create apple-touch-icon (180x180)
  const appleSvg = createSvg(180)
  await sharp(Buffer.from(appleSvg))
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'))
  console.log('Created: apple-touch-icon.png')

  console.log('Done! Icons created in /public')
}

generateIcons().catch(console.error)
