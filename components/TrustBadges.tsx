// Define or import the HelperProfile type
type HelperProfile = {
  responseTime: string;
  verificationStatus: string;
  rating: number;
  helpCount: number;
  completionRate: number;
};

export function TrustBadges({ helper }: { helper: HelperProfile }) {
  const badges = [
    { name: 'Quick Responder', icon: '⚡', condition: helper.responseTime === 'Under 1 hour' },
    { name: 'Verified Helper', icon: '✅', condition: helper.verificationStatus !== 'unverified' },
    { name: 'Top Rated', icon: '⭐', condition: helper.rating >= 4.5 },
    { name: 'Community Hero', icon: '🏆', condition: helper.helpCount >= 50 },
    { name: 'Reliable', icon: '🛡️', condition: helper.completionRate >= 90 }
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {badges.filter(badge => badge.condition).map((badge, index) => (
        <span
          key={index}
          className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium animate-fadeIn"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <span className="mr-1">{badge.icon}</span>
          {badge.name}
        </span>
      ))}
    </div>
  )
}