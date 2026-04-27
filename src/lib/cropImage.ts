// Code adapted from react-easy-crop examples

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') // needed to avoid cross-origin issues on CodeSandbox
    image.src = url
  })

export interface PixelCrop {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Returns a File from a cropped image
 */
export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop,
  fileName: string,
  type: string = 'image/jpeg'
): Promise<File> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  // Set canvas size to match the bounding box
  canvas.width = image.width
  canvas.height = image.height

  // Draw image on canvas
  ctx.drawImage(image, 0, 0)

  // Extract the cropped image data from the canvas
  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height)

  // Set canvas width to final desired crop size
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Paste generated crop image in canvas
  ctx.putImageData(data, 0, 0)

  // Return as a Promise resolving to a File
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'))
        return
      }
      const file = new File([blob], fileName, { type })
      resolve(file)
    }, type)
  })
}
