export interface Env {
  BACKEND_URL: string
  POLICIES: KVNamespace
}

interface ItemDetection {
  label: string
  confidence: number
}

interface ItemDecision {
  label: string
  bin: 'recycling' | 'compost' | 'trash'
  explanation: string
  eco_tip: string
}

interface CombinedResponse {
  items: ItemDetection[]
  decisions: ItemDecision[]
  zip?: string
  policies?: any
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }

    // Only handle POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    try {
      const url = new URL(request.url)
      const zip = url.searchParams.get('zip')
      
      // Get form data
      const formData = await request.formData()
      const file = formData.get('file') as File
      
      if (!file) {
        return new Response(JSON.stringify({ error: 'No file provided' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Resize image if needed
      const resizedFile = await resizeImage(file)
      
      // Get local policies from KV
      let policies = null
      if (zip) {
        policies = await env.POLICIES.get(`policies:${zip}`)
        if (policies) {
          policies = JSON.parse(policies)
        }
      }

      // Forward to backend for inference
      const inferFormData = new FormData()
      inferFormData.append('file', resizedFile, file.name)
      if (zip) {
        inferFormData.append('zip', zip)
      }

      const inferResponse = await fetch(`${env.BACKEND_URL}/infer`, {
        method: 'POST',
        body: inferFormData,
      })

      if (!inferResponse.ok) {
        throw new Error(`Inference failed: ${inferResponse.status}`)
      }

      const inferData = await inferResponse.json()

      // Forward to backend for explanation
      const explainResponse = await fetch(`${env.BACKEND_URL}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: inferData.items.map((item: ItemDetection) => ({ label: item.label })),
          zip: zip,
          policies_json: policies,
        }),
      })

      if (!explainResponse.ok) {
        throw new Error(`Explanation failed: ${explainResponse.status}`)
      }

      const explainData = await explainResponse.json()

      // Combine responses
      const combinedResponse: CombinedResponse = {
        items: inferData.items,
        decisions: explainData.decisions,
        zip: zip || undefined,
        policies: policies || undefined,
      }

      return new Response(JSON.stringify(combinedResponse), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })

    } catch (error) {
      console.error('Worker error:', error)
      return new Response(JSON.stringify({ 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }
  },
}

async function resizeImage(file: File): Promise<File> {
  // Simple check - if file is already small enough, return as-is
  if (file.size < 1024 * 1024) { // 1MB
    return file
  }

  // For demo purposes, we'll just return the original file
  // In production, you'd use Canvas API to resize the image
  return file
}
