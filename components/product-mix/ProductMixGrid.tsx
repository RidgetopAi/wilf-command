import { cn } from '@/lib/utils'

interface ProductMixGridProps {
  year: number;
  targets: {
    adura_target: number;
    wood_laminate_target: number;
    sundries_target: number;
    ns_resp_target: number;
    sheet_target: number;
  };
  monthlyData: {
    [month: number]: {
      adura_pct: number;
      wood_laminate_pct: number;
      sundries_pct: number;
      ns_resp_pct: number;
      sheet_pct: number;
    };
  };
}

export function ProductMixGrid({ year, targets, monthlyData }: ProductMixGridProps) {
  const categories = [
    { key: 'adura', label: 'Adura' },
    { key: 'wood_laminate', label: 'Wood & Laminate' },
    { key: 'sundries', label: 'Sundries' },
    { key: 'ns_resp', label: 'NS & Resp' },
    { key: 'sheet', label: 'Sheet' }
  ];

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const getColorClass = (actual: number, target: number) => {
    if (actual === 0) return 'text-gray-400';
    if (actual >= target) return 'bg-green-100 text-green-800 font-medium';
    if (actual >= target - 5) return 'bg-yellow-50 text-yellow-800';
    return 'bg-red-50 text-red-800';
  };

  return (
    <div className="overflow-x-auto border rounded-lg shadow-sm">
      <table className="w-full border-collapse text-xs sm:text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="border-b border-r p-2 text-left font-medium text-gray-500 min-w-[100px]">Category</th>
            <th className="border-b border-r p-2 text-center font-medium text-gray-700 bg-gray-100">Target</th>
            {months.map(month => (
              <th key={month} className="border-b p-2 text-center font-medium text-gray-500">{month}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {categories.map(({ key, label }) => {
            const targetKey = `${key}_target` as keyof typeof targets;
            const targetVal = targets[targetKey];

            return (
              <tr key={key}>
                <td className="p-2 font-medium text-gray-900 border-r">{label}</td>
                <td className="p-2 text-center border-r bg-gray-50 font-bold text-indigo-600">{targetVal}%</td>
                {months.map((_, idx) => {
                  const monthNum = idx + 1;
                  const monthData = monthlyData[monthNum];
                  const actualKey = `${key}_pct`;
                  const actual = monthData ? monthData[actualKey] : 0;
                  
                  return (
                    <td key={monthNum} className={cn("p-2 text-center border-r border-gray-100", getColorClass(actual, targetVal))}>
                      {actual > 0 ? `${actual.toFixed(1)}%` : '-'}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
