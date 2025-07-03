// src/types/index.ts
export const ASSISTANCE_CATEGORIES = [
  'Housing',
  'Food and Water',
  'Clothing',
  'Medical Assistance',
  'Transportation',
  'People Rescue and Care',
  'Childcare',
  'Elderly Care',
  'Volunteering',
  'Donations',
  'Search and Rescue',
  'Temporary Work',
  'Counseling and Emotional Support',
  'Cleanup and Repairs',
  'Legal Assistance',
  'Communication Tools and Devices',
  'Relocation Assistance',
  'Shelter Supplies',
  'Generators and Power Supplies',
  'Vehicle and Equipment Lending',
  'Lost and Found',
  'Tech Support',
  'Evacuation Assistance'
] as const

export type AssistanceCategory = typeof ASSISTANCE_CATEGORIES[number]

