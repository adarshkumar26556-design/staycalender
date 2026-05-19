import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { Wallet, TrendingUp, Users, Zap, Star, AlertCircle, ArrowUpRight } from 'lucide-react';
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
  const [allBookings, setAllBookings] = useState([]);

  useEffect(() => {
    if (user?.propertyId && startDate && endDate) {
      fetchRevenue();
    }
  }, [user, startDate, endDate]);

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const [res, bookings] = await Promise.all([
        apiFetch(`/bookings/${user.propertyId}/revenue?startDate=${startDate}&endDate=${endDate}`),
        apiFetch(`/bookings/${user.propertyId}`)
      ]);
      setData(res);
      setAllBookings(bookings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sources = Object.entries(data.sourceRevenue || {}).sort((a,b) => b[1] - a[1]);

  // --- Smart Insights (AI-style logic) ---
  const getSmartInsights = () => {
    const insights = [];
    if (!allBookings.length) return insights;

    // Top source
    if (sources.length > 0) {
      insights.push({
        type: 'info',
        icon: <Star size={16} />,
        text: `Your top booking source is <strong>${sources[0][0]}</strong> contributing ₹${sources[0][1].toLocaleString('en-IN')} this period.`
      });
    }

    // Low occupancy alert
    const avgBooking = data.bookingCount > 0 ? data.totalRevenue / data.bookingCount : 0;
    if (avgBooking > 0) {
      insights.push({
        type: 'tip',
        icon: <TrendingUp size={16} />,
        text: `Average booking value is <strong>₹${Math.round(avgBooking).toLocaleString('en-IN')}</strong>. Consider upselling room upgrades to increase this.`
      });
    }

    // Multiple sources diversification
    if (sources.length >= 3) {
      insights.push({
        type: 'success',
        icon: <ArrowUpRight size={16} />,
        text: `Great! You have <strong>${sources.length} booking sources</strong>. Diversified channels reduce dependency risk.`
      });
    } else if (sources.length === 1) {
      insights.push({
        type: 'warning',
        icon: <AlertCircle size={16} />,
        text: `All bookings come from <strong>1 source</strong>. Consider listing on more OTAs via Channel Manager to diversify.`
      });
    }

    // WhatsApp / direct upsell tip
    if (data.bookingCount > 0) {
      insights.push({
        type: 'tip',
        icon: <Zap size={16} />,
        text: `Send WhatsApp booking confirmations to all ${data.bookingCount} guests this period to improve guest satisfaction and drive repeat bookings.`
      });
    }

    return insights;
  };

  const insights = getSmartInsights();

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
              ₹{data.bookingCount ? (data.totalRevenue / data.bookingCount).toFixed(0) : 0}
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

      {/* Smart Insights — Zotel.ai style */}
      {insights.length > 0 && (
        <div className="smart-insights-section" style={{ marginTop: '1.5rem' }}>
          <div className="si-header">
            <Zap size={18} />
            <h3>Smart Insights</h3>
            <span className="si-badge">AI</span>
          </div>
          <div className="si-grid">
            {insights.map((ins, i) => (
              <div key={i} className={`si-card si-${ins.type}`}>
                <span className="si-icon">{ins.icon}</span>
                <p dangerouslySetInnerHTML={{ __html: ins.text }} />
              </div>
            ))}
          </div>
        </div>
      )}

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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{percentage}%</span>
                        <span className="source-amount">₹{amount.toLocaleString()}</span>
                      </div>
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
