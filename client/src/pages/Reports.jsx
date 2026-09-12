import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { reportService, exportCsv } from '../services/reportService';
import { useMoney } from '../context/AuthContext';

export default function Reports() {
  const money = useMoney();
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState({});

  useEffect(() => {
    Promise.all([
      reportService.sales({ period }),
      reportService.profit({ period }),
      reportService.products({ period }),
      reportService.inventory(),
    ]).then(([sales, profit, products, inventory]) => setData({ sales, profit, products, inventory })).catch(() => {});
  }, [period]);

  const { sales, profit, products, inventory } = data;

  return (
    <>
      <Header title="Reports">
        <select className="input w-40 py-2 text-sm" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="today">Today</option><option value="week">This week</option><option value="month">This month</option><option value="">All time</option>
        </select>
      </Header>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {sales && (
          <section className="card p-4">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold">Sales report</h2>
              <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={() => exportCsv('sales-report.csv', sales.byDay)}>Export CSV</button></div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 text-sm">
              <p>Total: <b>{money(sales.totalSales)}</b></p><p>Transactions: <b>{sales.transactions}</b></p>
              <p>Average: <b>{money(sales.averageTransaction)}</b></p><p>Discounts: <b>{money(sales.discounts)}</b></p><p>Taxes: <b>{money(sales.taxes)}</b></p>
            </div>
          </section>
        )}
        {profit && (
          <section className="card p-4"><h2 className="mb-3 text-sm font-bold">Profit report</h2>
            <div className="grid grid-cols-3 gap-3 text-sm"><p>Revenue: <b>{money(profit.revenue)}</b></p><p>Cost: <b>{money(profit.cost)}</b></p><p>Profit: <b className="text-brand-600">{money(profit.profit)}</b></p></div>
          </section>
        )}
        {products && (
          <section className="card p-4">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold">Best selling products</h2>
              <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={() => exportCsv('product-report.csv', products.bestSelling)}>Export CSV</button></div>
            <table className="w-full"><thead><tr><th className="th">Product</th><th className="th">Qty</th><th className="th">Revenue</th><th className="th">Profit</th></tr></thead>
              <tbody>{products.bestSelling.map((p) => (
                <tr key={p.name} className="border-t border-slate-50 dark:border-slate-800/60"><td className="td">{p.name}</td><td className="td">{p.quantity}</td><td className="td">{money(p.revenue)}</td><td className="td">{money(p.profit)}</td></tr>
              ))}</tbody></table>
          </section>
        )}
        {inventory && (
          <section className="card p-4">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold">Inventory report · value {money(inventory.stockValue)}</h2>
              <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={() => exportCsv('inventory-report.csv', inventory.products)}>Export CSV</button></div>
            <p className="text-sm text-slate-500">Low stock: {inventory.lowStock} · Out of stock: {inventory.outOfStock}</p>
          </section>
        )}
      </div>
    </>
  );
}
