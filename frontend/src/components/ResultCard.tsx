import { ItemDecision } from '../types'

interface ResultCardProps {
  decision: ItemDecision
}

export function ResultCard({ decision }: ResultCardProps) {
  const getBinColor = (bin: string) => {
    switch (bin) {
      case 'recycling':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'compost':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'trash':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getBinIcon = (bin: string) => {
    switch (bin) {
      case 'recycling':
        return '♻️'
      case 'compost':
        return '🌱'
      case 'trash':
        return '🗑️'
      default:
        return '❓'
    }
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {decision.label}
        </h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getBinColor(decision.bin)}`}>
          {getBinIcon(decision.bin)} {decision.bin.toUpperCase()}
        </span>
      </div>
      
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Explanation</h4>
          <p className="text-gray-600">{decision.explanation}</p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-yellow-800 mb-1">💡 Eco Tip</h4>
          <p className="text-yellow-700 text-sm">{decision.eco_tip}</p>
        </div>
      </div>
    </div>
  )
}
