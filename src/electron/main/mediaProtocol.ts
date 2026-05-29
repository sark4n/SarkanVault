import { existsSync } from 'node:fs'
import { extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { net, protocol } from 'electron'

const allowedImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp'])

export function registerMediaProtocol(): void {
  protocol.handle('retro-media', async (request) => {
    const url = new URL(request.url)
    const encodedPath = url.pathname.replace(/^\//, '')
    const decodedPath = Buffer.from(encodedPath, 'base64url').toString('utf8')
    const extension = extname(decodedPath).toLowerCase()

    if (!allowedImageExtensions.has(extension) || !existsSync(decodedPath)) {
      return new Response('Not found', { status: 404 })
    }

    return net.fetch(pathToFileURL(decodedPath).toString())
  })
}

export function toMediaUrl(filePath?: string): string | undefined {
  if (!filePath) return undefined
  const encoded = Buffer.from(filePath, 'utf8').toString('base64url')
  const cacheBuster = Date.now()
  return `retro-media://local/${encoded}?v=${cacheBuster}`
}
