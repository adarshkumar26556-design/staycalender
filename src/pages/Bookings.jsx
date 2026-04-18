import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { Trash2, Search, Calendar, User } from 'lucide-react';
import './AdminPanel.css'; // Reusing established table styles

const Bookings = () => {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    if (!user?.propertyId && user?.role !== 'Admin') return;
    setLoading(true);
    try {
      // For owners, use their propertyId. For admins, we might need a different logic but usually they pick a property.
      // For now, let's assume propertyId is known or handled.
      const propId = user.propertyId;
      const data = await apiFetch(`/bookings/${propId}`);
      setBookings(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    try {
      await apiFetch(`/bookings/${id}`, 'DELETE');
      setBookings(bookings.filter(b => b._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.mobileNumber.includes(searchTerm)
  );

  if (loading) return <div className="p-8">Loading Bookings...</div>;

  return (
    <div className="bookings-page">
      <div className="page-header">
        <div>
          <h2>All Bookings</h2>
          <p className="text-secondary">View and manage your guest reservations</p>
        </div>
        <div className="search-bar glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', height: '42px' }}>
          <Search size={18} className="text-muted" style={{ marginRight: '0.5rem' }} />
          <input 
            type="text" 
            placeholder="Search by name or mobile..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '250px' }}
          />
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1rem' }}>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Guest Details</th>
                <th>Room</th>
                <th>Check In/Out</th>
                <th>Source</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(b => (
                <tr key={b._id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{b.customerName}</div>
                    <div className="text-muted" style={{ fontSize: '0.85rem' }}>{b.mobileNumber}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>Room {b.roomId?.roomNumber}</div>
                    <div className="text-muted" style={{ fontSize: '0.85rem' }}>{b.roomId?.category}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.9rem' }}>
                      <strong>IN:</strong> {new Date(b.checkInDate).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '0.9rem' }}>
                      <strong>OUT:</strong> {new Date(b.checkOutDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ 
                      background: 'var(--bg-tertiary)', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem' 
                    }}>
                      {b.source}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>₹{b.amount}</td>
                  <td>
                    <button className="icon-btn text-danger" onClick={() => handleDelete(b._id)}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }} className="text-secondary">
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Bookings;
