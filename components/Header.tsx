// src/components/Header.tsx
export default function Header({ currentStep }: { currentStep: string }) {
    return (
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Community Support Network</h1>
            {currentStep === 'feed' && (
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create Post
              </button>
            )}
          </div>
        </div>
      </header>
    )
  }