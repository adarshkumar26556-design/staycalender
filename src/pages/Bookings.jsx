import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { Search, Filter, Download, Trash2, Calendar as CalIcon, User, Phone, Tag } from 'lucide-react';
import './Bookings.css';

const Bookings = () => {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('All');

  useEffect(() => {
    if (user?.propertyId) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/bookings/${user.propertyId}`);
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this booking?')) return;
    try {
      await apiFetch(`/bookings/${id}`, 'DELETE');
      fetchBookings();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.mobileNumber.includes(searchTerm) ||
                          (b.roomId?.roomNumber || '').toString().includes(searchTerm);
    const matchesFilter = filterSource === 'All' || b.source === filterSource;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="page-header">Loading...</div>;

  return (
    <div className="bookings-page">
      <div className="page-header">
        <div>
          <h2>Bookings List</h2>
          <p className="text-secondary">View and manage all reservations</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary"><Download size={18} /> Export</button>
        </div>
      </div>

      <div className="filters-bar glass-panel">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name, phone or room..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={18} />
          <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
            <option value="All">All Sources</option>
            <option value="Walk-in">Walk-in</option>
            <option value="Booking.com">Booking.com</option>
            <option value="MMT">MMT</option>
            <option value="Agoda">Agoda</option>
          </select>
        </div>
      </div>

      <div className="bookings-table-container glass-panel">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Room Info</th>
                <th>Stay Period</th>
                <th>Source</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => (
                <tr key={b._id}>
                  <td>
                    <div className="customer-info">
                      <div className="customer-name">{b.customerName}</div>
                      <div className="customer-sub"><Phone size={12} /> {b.mobileNumber}</div>
                    </div>
                  </td>
                  <td>
                    <div className="room-info">
                      <div className="room-number">Room {b.roomId?.roomNumber || 'N/A'}</div>
                      <div className="room-cat">{b.roomId?.category || 'Standard'}</div>
                    </div>
                  </td>
                  <td>
                    <div className="stay-info">
                      <div>{new Date(b.checkInDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - {new Date(b.checkOutDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                      <div className="stay-nights text-muted">{Math.ceil((new Date(b.checkOutDate) - new Date(b.checkInDate)) / (1000 * 60 * 60 * 24))} nights</div>
                    </div>
                  </td>
                  <td>
                    <span className={`source-tag ${b.source.toLowerCase().replace('.', '')}`}>
                      {b.source}
                    </span>
                  </td>
                  <td>
                    <div className="amount-col">₹{b.amount.toLocaleString('en-IN')}</div>
                  </td>
                  <td>
                    <button className="icon-btn text-danger" onClick={() => handleDelete(b._id)}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-state">No bookings found matching your search.</td>
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
