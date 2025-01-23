// src/utils/dateTime.ts
export const formatDateTime = (date: Date | string): string => {
    return new Date(date).toISOString().slice(0, 19).replace('T', ' ')
  }
  