import { getSalesAnalytics } from './salesReport';

export async function getCompareAnalytics(currentStart: Date, currentEnd: Date, prevStart: Date, prevEnd: Date, status: string = 'all', payment: string = 'all', search: string = '') {
  const current = await getSalesAnalytics(currentStart, currentEnd, status, payment, search);
  const previous = await getSalesAnalytics(prevStart, prevEnd, status, payment, search);
  
  const calculateGrowth = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  return {
    salesGrowth: calculateGrowth(Number(current.summary?.sales || 0), Number(previous.summary?.sales || 0)),
    ordersGrowth: calculateGrowth(Number(current.summary?.count || 0), Number(previous.summary?.count || 0)),
    avgOrderGrowth: calculateGrowth(Number(current.summary?.avgOrder || 0), Number(previous.summary?.avgOrder || 0)),
    currentSummary: current.summary,
    previousSummary: previous.summary,
    payments: current.payments,
    hourly: current.hourly,
    daily: current.daily
  };
}
