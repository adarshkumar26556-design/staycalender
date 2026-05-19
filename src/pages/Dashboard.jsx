import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import {
  TrendingUp, Users, BedDouble, ArrowUpRight, ArrowDownRight,
  CheckCircle, Clock, LogOut, MessageSquare, Star, Zap, BarChart3
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    todayCheckIns: [],
    todayCheckOuts: [],
    upcomingBookings: [],
    totalRevenueMonth: 0,
    totalBookingsMonth: 0,
    recentBookings: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.propertyId) fetchDashboardData();
    else setLoading(false);
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

      const [rooms, bookings, revenue] = await Promise.all([
        apiFetch(`/rooms/${user.propertyId}`),
        apiFetch(`/bookings/${user.propertyId}`),
        apiFetch(`/bookings/${user.propertyId}/revenue?startDate=${firstDay}&endDate=${lastDay}`)
      ]);

      const todayDate = new Date(todayStr);
      todayDate.setHours(0, 0, 0, 0);

      const todayCheckIns = bookings.filter(b => {
        const d = new Date(b.checkInDate); d.setHours(0, 0, 0, 0);
        return d.getTime() === todayDate.getTime() && b.status !== 'cancelled';
      });

      const todayCheckOuts = bookings.filter(b => {
        const d = new Date(b.checkOutDate); d.setHours(0, 0, 0, 0);
        return d.getTime() === todayDate.getTime() && b.status !== 'cancelled';
      });

      const occupiedRooms = bookings.filter(b => {
        if (b.status === 'cancelled') return false;
        const bIn = new Date(b.checkInDate); bIn.setHours(0,0,0,0);
        const bOut = new Date(b.checkOutDate); bOut.setHours(0,0,0,0);
        return todayDate >= bIn && todayDate < bOut;
      });

      const upcomingBookings = bookings
        .filter(b => {
          const bIn = new Date(b.checkInDate); bIn.setHours(0,0,0,0);
          return bIn > todayDate && b.status !== 'cancelled';
        })
        .sort((a, b) => new Date(a.checkInDate) - new Date(b.checkInDate))
        .slice(0, 5);

      const recentBookings = [...bookings]
        .sort((a, b) => new Date(b.createdAt || b.checkInDate) - new Date(a.createdAt || a.checkInDate))
        .slice(0, 5);

      setStats({
        totalRooms: rooms.length,
        occupiedRooms: [...new Set(occupiedRooms.map(b => b.roomId?._id))].length,
        availableRooms: rooms.length - [...new Set(occupiedRooms.map(b => b.roomId?._id))].length,
        todayCheckIns,
        todayCheckOuts,
        upcomingBookings,
        totalRevenueMonth: revenue.totalRevenue || 0,
        totalBookingsMonth: revenue.bookingCount || 0,
        recentBookings
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const occupancyRate = stats.totalRooms > 0
    ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100)
    : 0;

  const avgPerBooking = stats.totalBookingsMonth > 0
    ? Math.round(stats.totalRevenueMonth / stats.totalBookingsMonth)
    : 0;

  const sendWhatsApp = (booking) => {
    const mobile = booking.mobileNumber?.replace(/\D/g, '');
    const checkIn = new Date(booking.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const checkOut = new Date(booking.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const msg = `Hi ${booking.customerName}! 🏨\n\nYour booking at our property is confirmed.\n✅ Room: ${booking.roomId?.roomNumber || 'N/A'}\n📅 Check-in: ${checkIn}\n📅 Check-out: ${checkOut}\n💰 Amount: ₹${booking.amount}\n\nWe look forward to hosting you! Please let us know if you need anything. 🙏`;
    window.open(`https://wa.me/${mobile}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (!user?.propertyId && user?.role !== 'Admin') {
    return (
      <div className="dashboard-empty">
        <div className="empty-icon"><Zap size={48} /></div>
        <h2>Welcome to StayCalendar</h2>
        <p>Your property dashboard will appear here once you're assigned to a property.</p>
      </div>
    );
  }

  if (loading) return (
    <div className="dashboard-loading">
      <div className="loading-spinner"></div>
      <p>Loading dashboard...</p>
    </div>
  );

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="dashboard-subtitle">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="occupancy-badge">
          <div className="occ-ring" style={{ '--pct': `${occupancyRate}%` }}>
            <span className="occ-value">{occupancyRate}%</span>
            <span className="occ-label">Occupancy</span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-revenue">
          <div className="kpi-icon"><TrendingUp size={22} /></div>
          <div className="kpi-body">
            <p className="kpi-label">Revenue (This Month)</p>
            <h3 className="kpi-value">₹{stats.totalRevenueMonth.toLocaleString('en-IN')}</h3>
            <p className="kpi-sub">Avg ₹{avgPerBooking.toLocaleString()} / booking</p>
          </div>
          <div className="kpi-trend positive"><ArrowUpRight size={16} /> Month</div>
        </div>

        <div className="kpi-card kpi-bookings">
          <div className="kpi-icon"><BarChart3 size={22} /></div>
          <div className="kpi-body">
            <p className="kpi-label">Bookings This Month</p>
            <h3 className="kpi-value">{stats.totalBookingsMonth}</h3>
            <p className="kpi-sub">{stats.upcomingBookings.length} upcoming</p>
          </div>
          <div className="kpi-trend positive"><ArrowUpRight size={16} /> Active</div>
        </div>

        <div className="kpi-card kpi-occupied">
          <div className="kpi-icon"><BedDouble size={22} /></div>
          <div className="kpi-body">
            <p className="kpi-label">Rooms Occupied</p>
            <h3 className="kpi-value">{stats.occupiedRooms} / {stats.totalRooms}</h3>
            <p className="kpi-sub">{stats.availableRooms} available now</p>
          </div>
        </div>

        <div className="kpi-card kpi-guests">
          <div className="kpi-icon"><Users size={22} /></div>
          <div className="kpi-body">
            <p className="kpi-label">Today's Activity</p>
            <h3 className="kpi-value">{stats.todayCheckIns.length + stats.todayCheckOuts.length}</h3>
            <p className="kpi-sub">{stats.todayCheckIns.length} in · {stats.todayCheckOuts.length} out</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">

        {/* Today's Check-ins */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">
              <CheckCircle size={18} className="icon-success" />
              <h3>Today's Check-ins</h3>
            </div>
            <span className="dash-badge badge-success">{stats.todayCheckIns.length}</span>
          </div>
          <div className="activity-list">
            {stats.todayCheckIns.length === 0 ? (
              <p className="empty-state-sm">No check-ins today</p>
            ) : stats.todayCheckIns.map(b => (
              <div key={b._id} className="activity-item">
                <div className="guest-avatar">{b.customerName?.charAt(0)}</div>
                <div className="activity-info">
                  <p className="activity-name">{b.customerName}</p>
                  <p className="activity-meta">Room {b.roomId?.roomNumber} · {b.numberOfGuests} guest{b.numberOfGuests > 1 ? 's' : ''}</p>
                </div>
                <button className="wa-btn" onClick={() => sendWhatsApp(b)} title="Send WhatsApp">
                  <MessageSquare size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Check-outs */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">
              <LogOut size={18} className="icon-warning" />
              <h3>Today's Check-outs</h3>
            </div>
            <span className="dash-badge badge-warning">{stats.todayCheckOuts.length}</span>
          </div>
          <div className="activity-list">
            {stats.todayCheckOuts.length === 0 ? (
              <p className="empty-state-sm">No check-outs today</p>
            ) : stats.todayCheckOuts.map(b => (
              <div key={b._id} className="activity-item">
                <div className="guest-avatar checkout">{b.customerName?.charAt(0)}</div>
                <div className="activity-info">
                  <p className="activity-name">{b.customerName}</p>
                  <p className="activity-meta">Room {b.roomId?.roomNumber} · ₹{b.amount}</p>
                </div>
                <button className="wa-btn" onClick={() => sendWhatsApp(b)} title="Send WhatsApp">
                  <MessageSquare size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="dash-card dash-card-wide">
          <div className="dash-card-header">
            <div className="dash-card-title">
              <Clock size={18} className="icon-primary" />
              <h3>Upcoming Arrivals</h3>
            </div>
          </div>
          <div className="upcoming-table">
            {stats.upcomingBookings.length === 0 ? (
              <p className="empty-state-sm">No upcoming bookings</p>
            ) : (
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Room</th>
                    <th>Check-in</th>
                    <th>Source</th>
                    <th>Amount</th>
                    <th>WhatsApp</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.upcomingBookings.map(b => (
                    <tr key={b._id}>
                      <td>
                        <div className="mini-guest">
                          <div className="mini-avatar">{b.customerName?.charAt(0)}</div>
                          <div>
                            <p className="mini-name">{b.customerName}</p>
                            <p className="mini-meta">{b.mobileNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="room-chip">Room {b.roomId?.roomNumber}</span></td>
                      <td>{new Date(b.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                      <td><span className={`source-tag source-${b.source?.toLowerCase().replace(/[^a-z]/g, '')}`}>{b.source}</span></td>
                      <td className="amount-cell">₹{b.amount?.toLocaleString()}</td>
                      <td>
                        <button className="wa-btn-sm" onClick={() => sendWhatsApp(b)}>
                          <MessageSquare size={14} /> Send
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Occupancy Bar Chart */}
        <div className="dash-card dash-card-wide">
          <div className="dash-card-header">
            <div className="dash-card-title">
              <Star size={18} className="icon-gold" />
              <h3>Property Overview</h3>
            </div>
          </div>
          <div className="property-overview">
            <div className="overview-stat">
              <div className="stat-circle" style={{ '--color': '#10b981' }}>
                <span className="stat-num">{stats.availableRooms}</span>
                <span className="stat-nm">Available</span>
              </div>
            </div>
            <div className="overview-stat">
              <div className="stat-circle" style={{ '--color': '#3b82f6' }}>
                <span className="stat-num">{stats.occupiedRooms}</span>
                <span className="stat-nm">Occupied</span>
              </div>
            </div>
            <div className="overview-stat">
              <div className="stat-circle" style={{ '--color': '#f59e0b' }}>
                <span className="stat-num">{stats.totalRooms - stats.occupiedRooms - stats.availableRooms > 0 ? stats.totalRooms - stats.occupiedRooms - stats.availableRooms : 0}</span>
                <span className="stat-nm">Maintenance</span>
              </div>
            </div>
            <div className="occupancy-visual">
              <div className="occ-bar-label">
                <span>Occupancy Rate</span>
                <strong>{occupancyRate}%</strong>
              </div>
              <div className="occ-bar-bg">
                <div className="occ-bar-fill" style={{ width: `${occupancyRate}%` }}></div>
              </div>
              <div className="occ-bar-label" style={{ marginTop: '1rem' }}>
                <span>Monthly Bookings</span>
                <strong>{stats.totalBookingsMonth}</strong>
              </div>
              <div className="occ-bar-bg">
                <div className="occ-bar-fill secondary" style={{ width: `${Math.min(stats.totalBookingsMonth * 5, 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
