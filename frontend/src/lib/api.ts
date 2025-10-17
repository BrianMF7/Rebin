import axios from 'axios'
import { InferResponse, ExplainResponse, ItemDecision } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

export const apiClient = {
  async infer(file: File, zip?: string): Promise<InferResponse> {
    const formData = new FormData()
    formData.append('file', file)
    if (zip) {
      formData.append('zip', zip)
    }
    
    const response = await api.post('/infer', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async explain(items: { label: string }[], zip?: string, policies?: any): Promise<ExplainResponse> {
    const response = await api.post('/explain', {
      items,
      zip,
      policies_json: policies,
    })
    return response.data
  },

  async logEvent(event: {
    user_id?: string
    zip?: string
    items_json: string[]
    decision: string
    co2e_saved: number
  }): Promise<{ id: number }> {
    const response = await api.post('/event', event)
    return response.data
  },
}
