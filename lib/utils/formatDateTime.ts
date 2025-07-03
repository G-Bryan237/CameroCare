import { format } from 'date-fns'

const formatDateTime = (date: Date | string): string => {
  return format(new Date(date), 'yyyy-MM-dd HH:mm:ss')
}
export default formatDateTime;