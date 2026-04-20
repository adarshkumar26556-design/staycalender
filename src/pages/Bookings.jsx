import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { Trash2, Search, Calendar, User, Edit2, X, Save } from 'lucide-react';
import './AdminPanel.css'; // Reusing established table styles

const Bookings = () => {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editFormData, setEditFormData] = useState({
    customerName: '',
    mobileNumber: '',
    numberOfGuests: 1,
    checkInDate: '',
    checkOutDate: '',
    source: 'Walk-in',
    amount: 0,
    notes: ''
  });

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    if (!user?.propertyId && user?.role !== 'Admin') return;
    setLoading(true);
    try {
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

  const openEditModal = (booking) => {
    setEditingBooking(booking);
    setEditFormData({
      customerName: booking.customerName,
      mobileNumber: booking.mobileNumber,
      numberOfGuests: booking.numberOfGuests,
      checkInDate: new Date(booking.checkInDate).toISOString().split('T')[0],
      checkOutDate: new Date(booking.checkOutDate).toISOString().split('T')[0],
      source: booking.source,
      amount: booking.amount,
      notes: booking.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updated = await apiFetch(`/bookings/${editingBooking._id}`, 'PATCH', editFormData);
      setBookings(bookings.map(b => b._id === updated._id ? { ...b, ...updated } : b));
      setIsEditModalOpen(false);
      alert('Booking updated successfully');
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
        <div className="search-bar glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', height: '42px', width: '100%', maxWidth: '350px' }}>
          <Search size={18} className="text-muted" style={{ marginRight: '0.5rem', flexShrink: 0 }} />
          <input 
            type="text" 
            placeholder="Search by name or mobile..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
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
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="icon-btn" onClick={() => openEditModal(b)} title="Edit">
                        <Edit2 size={18} />
                      </button>
                      <button className="icon-btn text-danger" onClick={() => handleDelete(b._id)} title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
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

      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Edit Booking - Room {editingBooking?.roomId?.roomNumber}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="icon-btn">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Guest Name</label>
                  <input 
                    type="text" 
                    value={editFormData.customerName}
                    onChange={e => setEditFormData({...editFormData, customerName: e.target.value})}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Mobile Number</label>
                  <input 
                    type="text" 
                    value={editFormData.mobileNumber}
                    onChange={e => setEditFormData({...editFormData, mobileNumber: e.target.value})}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Check In</label>
                  <input 
                    type="date" 
                    value={editFormData.checkInDate}
                    onChange={e => setEditFormData({...editFormData, checkInDate: e.target.value})}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Check Out</label>
                  <input 
                    type="date" 
                    value={editFormData.checkOutDate}
                    onChange={e => setEditFormData({...editFormData, checkOutDate: e.target.value})}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Guests</label>
                  <input 
                    type="number" 
                    value={editFormData.numberOfGuests}
                    onChange={e => setEditFormData({...editFormData, numberOfGuests: parseInt(e.target.value)})}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Source</label>
                  <select 
                    value={editFormData.source}
                    onChange={e => setEditFormData({...editFormData, source: e.target.value})}
                  >
                    <option value="Walk-in">Walk-in</option>
                    <option value="OTA">OTA (Booking/Expedia)</option>
                    <option value="Direct">Direct Call</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Total Amount (₹)</label>
                  <input 
                    type="number" 
                    value={editFormData.amount}
                    onChange={e => setEditFormData({...editFormData, amount: parseInt(e.target.value)})}
                    required
                  />
                </div>
              </div>
              <div className="input-group" style={{ marginTop: '1rem' }}>
                <label>Notes</label>
                <textarea 
                  rows="2"
                  value={editFormData.notes}
                  onChange={e => setEditFormData({...editFormData, notes: e.target.value})}
                ></textarea>
              </div>
              <div className="modal-footer" style={{ marginTop: '2rem' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Save size={18} /> Update Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
