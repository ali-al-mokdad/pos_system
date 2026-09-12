import { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Header from '../components/Header';
import { reportService } from '../services/reportService';
import { useMoney } from '../context/AuthContext';

const COLORS = ['#16a45f', '#38c97e', '#0b6a3e', '#f59e0b', '#ef4444'];

function Stat({ label, value, tone = '' }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const money = useMoney();
  const [period, setPeriod] = useState('today');
  const [data, setData] = useState(null);

  useEffect(() => {
    reportService.dashboard({ period }).then(setData).catch(() => {});
  }, [period]);

  return (
    <>
      <Header title="Dashboard">
        <select className="input w-40 py-2 text-sm" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
        </select>
      </Header>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {!data ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Sales" value={money(data.totalSales)} />
              <Stat label="Transactions" value={data.transactions} />
              <Stat label="Profit" value={money(data.profit)} tone="text-brand-600" />
              <Stat label="Cash / Card" value={`${money(data.cashSales)} / ${money(data.cardSales)}`} />
              <Stat label="Products" value={data.totalProducts} />
              <Stat label="Low stock" value={data.lowStock} tone="text-amber-600" />
              <Stat label="Out of stock" value={data.outOfStock} tone="text-rose-600" />
              <Stat label="Categories" value={data.totalCategories} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="card p-4">
                <h2 className="mb-3 text-sm font-bold">Sales by day</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.salesByDay}>
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" stroke="#16a45f" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="card p-4">
                <h2 className="mb-3 text-sm font-bold">Sales by payment method</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.salesByMethod} dataKey="amount" nameKey="method" outerRadius={80} label>
                      {data.salesByMethod.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="card p-4">
                <h2 className="mb-3 text-sm font-bold">Best sellers</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.bestSellers}>
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="quantity" fill="#16a45f" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card p-4">
                <h2 className="mb-3 text-sm font-bold">Sales by category</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.salesByCategory}>
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#38c97e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
