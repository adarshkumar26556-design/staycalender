import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { Wallet, TrendingUp, Users } from 'lucide-react';
import './Revenue.css';

const Revenue = () => {
  const { user } = useContext(AuthContext);
  
  // Default to current month
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  
  const [data, setData] = useState({ totalRevenue: 0, bookingCount: 0, sourceRevenue: {} });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.propertyId && startDate && endDate) {
      fetchRevenue();
    }
  }, [user, startDate, endDate]);

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/bookings/${user.propertyId}/revenue?startDate=${startDate}&endDate=${endDate}`);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sources = Object.entries(data.sourceRevenue || {}).sort((a,b) => b[1] - a[1]);

  if (!user?.propertyId && user?.role === 'Admin') {
    return <div className="page-header"><h2>Please select a property in Admin Panel.</h2></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Revenue Tracking</h2>
          <p className="text-secondary">Analyze your property's performance</p>
        </div>
        <div className="date-range-picker glass-panel">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span>to</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card glass-panel">
          <div className="metric-icon primary"><Wallet /></div>
          <div className="metric-info">
            <p className="metric-label">Total Revenue</p>
            <h3 className="metric-value">₹{data.totalRevenue.toLocaleString()}</h3>
          </div>
        </div>
        
        <div className="metric-card glass-panel">
          <div className="metric-icon success"><TrendingUp /></div>
          <div className="metric-info">
            <p className="metric-label">Avg. per Booking</p>
            <h3 className="metric-value">
              ₹{data.bookingCount ? (data.totalRevenue / data.bookingCount).toFixed(2) : 0}
            </h3>
          </div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-icon warning"><Users /></div>
          <div className="metric-info">
            <p className="metric-label">Total Bookings</p>
            <h3 className="metric-value">{data.bookingCount}</h3>
          </div>
        </div>
      </div>

      <div className="charts-grid mt-8">
        <div className="chart-card glass-panel">
          <h3>Revenue by Source</h3>
          {sources.length === 0 ? (
            <p className="text-muted mt-4">No data available for this period.</p>
          ) : (
            <div className="source-list mt-4">
              {sources.map(([source, amount]) => {
                const percentage = data.totalRevenue ? ((amount / data.totalRevenue) * 100).toFixed(1) : 0;
                return (
                  <div key={source} className="source-item">
                    <div className="source-header">
                      <span className="source-name">{source}</span>
                      <span className="source-amount">₹{amount.toLocaleString()}</span>
                    </div>
                    <div className="source-bar-bg">
                      <div className="source-bar-fill" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Revenue;
