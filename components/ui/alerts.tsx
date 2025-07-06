// src/components/ui/alert.tsx

interface AlertProps {
  variant?: 'default' | 'destructive'
  children: React.ReactNode
}

export function Alert({ variant = 'default', children }: AlertProps) {
  return (
    <div className={`p-4 rounded-md ${
      variant === 'destructive' ? 'bg-red-50' : 'bg-blue-50'
    }`}>
      {children}
    </div>
  )
}

export function AlertTitle({ children }: { children: React.ReactNode }) {
  return <h5 className="font-medium mb-1">{children}</h5>
}

export function AlertDescription({ children }: { children: React.ReactNode }) {
  return <div className="text-sm">{children}</div>
}