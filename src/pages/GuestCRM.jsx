import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { Search, MessageSquare, Star, Phone, Calendar, TrendingUp, Users, Award } from 'lucide-react';
import './GuestCRM.css';

const GuestCRM = () => {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);

  useEffect(() => {
    if (user?.propertyId) fetchData();
    else setLoading(false);
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/bookings/${user.propertyId}`);
      setBookings(data);

      // Build guest profiles from bookings
      const guestMap = {};
      data.forEach(b => {
        const key = b.mobileNumber;
        if (!guestMap[key]) {
          guestMap[key] = {
            name: b.customerName,
            mobile: b.mobileNumber,
            bookings: [],
            totalSpent: 0,
            firstSeen: b.checkInDate,
            lastSeen: b.checkInDate,
          };
        }
        guestMap[key].bookings.push(b);
        guestMap[key].totalSpent += b.amount || 0;
        if (new Date(b.checkInDate) > new Date(guestMap[key].lastSeen)) {
          guestMap[key].lastSeen = b.checkInDate;
        }
        if (new Date(b.checkInDate) < new Date(guestMap[key].firstSeen)) {
          guestMap[key].firstSeen = b.checkInDate;
        }
      });

      const guestList = Object.values(guestMap)
        .sort((a, b) => b.totalSpent - a.totalSpent);
      setGuests(guestList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGuests = guests.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.mobile.includes(search)
  );

  const sendWhatsApp = (guest, type = 'welcome') => {
    const mobile = guest.mobile?.replace(/\D/g, '');
    const messages = {
      welcome: `Hi ${guest.name}! 🏨\n\nThank you for choosing us! We look forward to welcoming you. Please feel free to reach out for any assistance. 🙏`,
      review: `Hi ${guest.name}! 😊\n\nWe hope your recent stay was wonderful! We'd love to hear your feedback. Your opinion helps us serve you better. ⭐`,
      offer: `Hi ${guest.name}! 🎉\n\nAs a valued returning guest, we have a special offer for you! Book your next stay with us and enjoy an exclusive discount. 🏷️\n\nCall us or reply here to know more!`
    };
    window.open(`https://wa.me/${mobile}?text=${encodeURIComponent(messages[type])}`, '_blank');
  };

  const getGuestTier = (guest) => {
    if (guest.bookings.length >= 5) return { label: 'VIP', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    if (guest.bookings.length >= 3) return { label: 'Regular', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
    return { label: 'New', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
  };

  const totalRevenue = guests.reduce((s, g) => s + g.totalSpent, 0);
  const vipGuests = guests.filter(g => g.bookings.length >= 5).length;
  const returningGuests = guests.filter(g => g.bookings.length > 1).length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
      Loading Guest CRM...
    </div>
  );

  return (
    <div className="crm-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Guest CRM</h2>
          <p className="text-secondary">Build relationships, drive repeat bookings</p>
        </div>
      </div>

      {/* Stats */}
      <div className="crm-stats">
        <div className="crm-stat-card">
          <div className="crm-stat-icon"><Users size={20} /></div>
          <div>
            <p className="crm-stat-label">Total Guests</p>
            <h3 className="crm-stat-value">{guests.length}</h3>
          </div>
        </div>
        <div className="crm-stat-card">
          <div className="crm-stat-icon returning"><TrendingUp size={20} /></div>
          <div>
            <p className="crm-stat-label">Returning Guests</p>
            <h3 className="crm-stat-value">{returningGuests}</h3>
          </div>
        </div>
        <div className="crm-stat-card">
          <div className="crm-stat-icon vip"><Award size={20} /></div>
          <div>
            <p className="crm-stat-label">VIP Guests</p>
            <h3 className="crm-stat-value">{vipGuests}</h3>
          </div>
        </div>
        <div className="crm-stat-card">
          <div className="crm-stat-icon revenue"><TrendingUp size={20} /></div>
          <div>
            <p className="crm-stat-label">Total Revenue</p>
            <h3 className="crm-stat-value">₹{totalRevenue.toLocaleString('en-IN')}</h3>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="crm-layout">
        {/* Guest List */}
        <div className="crm-list-panel glass-panel">
          <div className="crm-search">
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder="Search guests..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="crm-guest-list">
            {filteredGuests.map(guest => {
              const tier = getGuestTier(guest);
              return (
                <div
                  key={guest.mobile}
                  className={`crm-guest-item ${selectedGuest?.mobile === guest.mobile ? 'active' : ''}`}
                  onClick={() => setSelectedGuest(guest)}
                >
                  <div className="crm-guest-avatar">
                    {guest.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="crm-guest-info">
                    <div className="crm-guest-name">{guest.name}</div>
                    <div className="crm-guest-meta">{guest.mobile}</div>
                  </div>
                  <div className="crm-guest-right">
                    <span className="crm-tier-badge" style={{ color: tier.color, background: tier.bg }}>
                      {tier.label}
                    </span>
                    <div className="crm-guest-stays">{guest.bookings.length} stay{guest.bookings.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              );
            })}
            {filteredGuests.length === 0 && (
              <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>No guests found</p>
            )}
          </div>
        </div>

        {/* Guest Detail Panel */}
        <div className="crm-detail-panel">
          {!selectedGuest ? (
            <div className="crm-empty">
              <Users size={48} />
              <h3>Select a Guest</h3>
              <p>Click on a guest to see their profile and booking history</p>
            </div>
          ) : (
            <>
              {/* Guest Profile Card */}
              <div className="guest-profile glass-panel">
                <div className="guest-profile-header">
                  <div className="guest-profile-avatar">
                    {selectedGuest.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="guest-profile-info">
                    <h3 className="guest-profile-name">{selectedGuest.name}</h3>
                    <div className="guest-profile-meta">
                      <span><Phone size={14} /> {selectedGuest.mobile}</span>
                    </div>
                    <div className="guest-profile-tier">
                      {(() => {
                        const tier = getGuestTier(selectedGuest);
                        return (
                          <span className="tier-pill" style={{ color: tier.color, background: tier.bg }}>
                            {tier.label === 'VIP' ? '⭐' : tier.label === 'Regular' ? '✅' : '🆕'} {tier.label} Guest
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="guest-profile-stats">
                  <div className="g-stat">
                    <Calendar size={16} />
                    <div>
                      <p className="g-stat-label">Total Stays</p>
                      <p className="g-stat-value">{selectedGuest.bookings.length}</p>
                    </div>
                  </div>
                  <div className="g-stat">
                    <TrendingUp size={16} />
                    <div>
                      <p className="g-stat-label">Total Spent</p>
                      <p className="g-stat-value">₹{selectedGuest.totalSpent.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="g-stat">
                    <Star size={16} />
                    <div>
                      <p className="g-stat-label">Avg per Stay</p>
                      <p className="g-stat-value">₹{Math.round(selectedGuest.totalSpent / selectedGuest.bookings.length).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Actions */}
                <div className="wa-actions">
                  <p className="wa-actions-label">Quick WhatsApp</p>
                  <div className="wa-action-btns">
                    <button className="wa-action-btn" onClick={() => sendWhatsApp(selectedGuest, 'welcome')}>
                      <MessageSquare size={15} />
                      Welcome Message
                    </button>
                    <button className="wa-action-btn" onClick={() => sendWhatsApp(selectedGuest, 'review')}>
                      <Star size={15} />
                      Request Review
                    </button>
                    <button className="wa-action-btn" onClick={() => sendWhatsApp(selectedGuest, 'offer')}>
                      <Award size={15} />
                      Special Offer
                    </button>
                  </div>
                </div>
              </div>

              {/* Booking History */}
              <div className="guest-history glass-panel">
                <h4 className="history-title"><Calendar size={16} /> Booking History</h4>
                <div className="history-list">
                  {selectedGuest.bookings
                    .sort((a, b) => new Date(b.checkInDate) - new Date(a.checkInDate))
                    .map(b => (
                    <div key={b._id} className="history-item">
                      <div className="history-badge">
                        Room {b.roomId?.roomNumber || 'N/A'}
                      </div>
                      <div className="history-info">
                        <p className="history-dates">
                          {new Date(b.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          &nbsp;→&nbsp;
                          {new Date(b.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="history-meta">{b.source} · {b.numberOfGuests} guest{b.numberOfGuests > 1 ? 's' : ''}</p>
                        {b.notes && <p className="history-notes">"{b.notes}"</p>}
                      </div>
                      <div className="history-amount">₹{b.amount?.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestCRM;
