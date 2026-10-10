export type UploadProgressCallback = (percent: number) => void

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

export function uploadWithProgress(
  endpoint: string,
  formData: FormData,
  onProgress: UploadProgressCallback,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', endpoint)
    request.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable || event.total === 0) return
      onProgress(Math.min(95, Math.floor((event.loaded / event.total) * 95)))
    })
    request.addEventListener('error', () => reject(new Error('The upload could not reach the server. Check your connection and try again.')))
    request.addEventListener('abort', () => reject(new Error('The upload was cancelled.')))
    request.addEventListener('load', () => {
      let response: unknown
      try {
        response = JSON.parse(request.responseText)
      } catch {
        reject(new Error('The server returned an invalid upload response.'))
        return
      }
      if (!isJsonObject(response)) {
        reject(new Error('The server returned an invalid upload response.'))
        return
      }
      const result = response
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(typeof result.error === 'string' ? result.error : 'The upload could not be completed.'))
        return
      }
      onProgress(100)
      resolve(result)
    })
    request.send(formData)
  })
}
