import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { ChevronLeft, ChevronRight, X, Calendar as CalIcon, Trash2 } from 'lucide-react';
import { DateRange } from 'react-date-range';
import { format } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import './CalendarView.css';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarView = () => {
  const { user } = useContext(AuthContext);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    roomId: '', customerName: '', mobileNumber: '', numberOfGuests: 1,
    checkInDate: '', checkOutDate: '', source: 'Walk-in', amount: '', notes: ''
  });

  // Date Range Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection'
    }
  ]);
  const datePickerRef = useRef(null);

  // Close date picker if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (user?.propertyId) {
      loadInitialData();
    } else if (user?.role === 'Admin') {
      // Suggest admin to go to admin panel or select property
      setLoading(false);
    }
  }, [user]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [fetchedRooms, fetchedBookings] = await Promise.all([
        apiFetch(`/rooms/${user.propertyId}`),
        apiFetch(`/bookings/${user.propertyId}`)
      ]);
      setRooms(fetchedRooms);
      setBookings(fetchedBookings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(endOfMonth);
  if (endDate.getDay() !== 6) {
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
  }

  const calendarDays = [];
  let day = new Date(startDate);
  while (day <= endDate) {
    calendarDays.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleDateClick = (clickedDate) => {
    if (user?.role === 'Admin' && (!user.propertyId)) {
      alert("Admin must be assigned to a property or use Admin Panel to manage this.");
      return;
    }
    const offsetDate = new Date(clickedDate.getTime() - clickedDate.getTimezoneOffset() * 60000);
    const dateString = offsetDate.toISOString().split('T')[0];
    
    // Auto-fill out date to next day
    const nextDay = new Date(clickedDate);
    nextDay.setDate(clickedDate.getDate() + 1);
    const offsetNextDay = new Date(nextDay.getTime() - nextDay.getTimezoneOffset() * 60000);
    const nextDateString = offsetNextDay.toISOString().split('T')[0];
    
    setSelectedDate(clickedDate);
    setSelectedBooking(null);
    // Reset form for new booking, keeping dates relative to the clicked day
    setFormData({
      roomId: '', 
      customerName: '', 
      mobileNumber: '', 
      numberOfGuests: 1,
      checkInDate: dateString, 
      checkOutDate: nextDateString, 
      source: 'Walk-in', 
      amount: '', 
      notes: ''
    });

    setDateRange([{
      startDate: clickedDate,
      endDate: nextDay,
      key: 'selection'
    }]);
    
    setShowDatePicker(false);
    setIsModalOpen(true);
  };

  const handleBookingClick = (e, booking) => {
    e.stopPropagation();
    setSelectedBooking(booking);
    
    setFormData({
      roomId: booking.roomId?._id || booking.roomId, 
      customerName: booking.customerName, 
      mobileNumber: booking.mobileNumber, 
      numberOfGuests: booking.numberOfGuests,
      checkInDate: new Date(booking.checkInDate).toISOString().split('T')[0], 
      checkOutDate: new Date(booking.checkOutDate).toISOString().split('T')[0], 
      source: booking.source, 
      amount: booking.amount, 
      notes: booking.notes || ''
    });

    setDateRange([{
      startDate: new Date(booking.checkInDate),
      endDate: new Date(booking.checkOutDate),
      key: 'selection'
    }]);

    setIsModalOpen(true);
  };

  const handleDeleteBooking = async () => {
    if (!selectedBooking) return;
    if (!window.confirm('Are you sure you want to remove this booking?')) return;

    try {
      await apiFetch(`/bookings/${selectedBooking._id}`, 'DELETE');
      alert('Booking removed successfully');
      setIsModalOpen(false);
      loadInitialData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await apiFetch('/bookings', 'POST', {
        propertyId: user.propertyId,
        ...formData,
        numberOfGuests: Number(formData.numberOfGuests),
        amount: Number(formData.amount)
      });
      alert('Booking created successfully');
      setIsModalOpen(false);
      loadInitialData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getBookingsForDate = (date) => {
    return bookings.filter(b => {
      const bIn = new Date(b.checkInDate); bIn.setHours(0,0,0,0);
      const bOut = new Date(b.checkOutDate); bOut.setHours(0,0,0,0);
      const d = new Date(date); d.setHours(0,0,0,0);
      return d >= bIn && d < bOut;
    });
  };

  if (!user?.propertyId && user?.role === 'Admin') {
    return <div className="page-header"><h2>Welcome Admin. Please set up properties in the Admin Panel.</h2></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Booking Calendar</h2>
          <p className="text-secondary">Click on any date to add a booking</p>
        </div>
      </div>
      
      <div className="calendar-card glass-panel">
        <div className="calendar-header">
          <button className="icon-btn" onClick={prevMonth}><ChevronLeft /></button>
          <h3>
            {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
          </h3>
          <button className="icon-btn" onClick={nextMonth}><ChevronRight /></button>
        </div>

        <div className="calendar-grid">
          {daysOfWeek.map(d => (
            <div key={d} className="calendar-day-header">{d}</div>
          ))}
          {calendarDays.map((d, idx) => {
            const isCurrentMonth = d.getMonth() === currentDate.getMonth();
            const dateBookings = getBookingsForDate(d);
            
            return (
              <div 
                key={idx} 
                className={`calendar-cell ${!isCurrentMonth ? 'other-month' : ''}`}
                onClick={() => handleDateClick(d)}
              >
                <div className="cell-date">{d.getDate()}</div>
                <div className="bookings-indicators">
                  {dateBookings.slice(0, 3).map((b, i) => (
                    <div 
                      key={i} 
                      className="booking-chip" 
                      title={`${b.customerName} - Room ${b.roomId?.roomNumber}`}
                      onClick={(e) => handleBookingClick(e, b)}
                    >
                      {b.roomId?.roomNumber} {b.customerName.split(' ')[0]}
                    </div>
                  ))}
                  {dateBookings.length > 3 && <div className="more-chip">+{dateBookings.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedBooking ? 'View Booking' : 'New Booking'}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedBooking && (
                  <button className="icon-btn text-danger" onClick={handleDeleteBooking} title="Delete Booking">
                    <Trash2 size={20}/>
                  </button>
                )}
                <button className="icon-btn" onClick={() => setIsModalOpen(false)}><X size={20}/></button>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body form-grid">
                <div className="form-group full-width">
                  <label>Room</label>
                  <select name="roomId" value={formData.roomId} onChange={handleInputChange} required>
                    <option value="" disabled>Select Room</option>
                    {(() => {
                      const inDate = new Date(formData.checkInDate);
                      const outDate = new Date(formData.checkOutDate);
                      
                      const validRooms = rooms.filter(room => {
                        if (room.status !== 'available') return false;
                        
                        // Check if this room has any overlapping bookings
                        const conflicts = bookings.filter(b => {
                          const roomIdMatches = b.roomId?._id === room._id || b.roomId === room._id;
                          if (!roomIdMatches || b.status !== 'confirmed') return false;
                          
                          const bIn = new Date(b.checkInDate);
                          const bOut = new Date(b.checkOutDate);
                          
                          return (inDate < bOut) && (outDate > bIn);
                        });
                        
                        return conflicts.length === 0;
                      });

                      if (rooms.length === 0) return <option disabled>No rooms available for this property</option>;
                      if (validRooms.length === 0) return <option disabled>All rooms are booked for selected dates</option>;
                      
                      return validRooms.map(r => (
                        <option key={r._id} value={r._id}>{r.roomNumber} - {r.category}</option>
                      ));
                    })()}
                  </select>
                </div>
                 <div className="form-group full-width" ref={datePickerRef} style={{ position: 'relative' }}>
                  <label>Stay Dates (Booking.com style)</label>
                  <div 
                    className="date-picker-trigger" 
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', 
                      background: 'var(--bg-primary)', border: '1px solid var(--border-color)', 
                      borderRadius: '8px', cursor: 'pointer', fontWeight: '500'
                    }}
                  >
                    <CalIcon size={18} className="text-secondary" />
                    <span>{format(dateRange[0].startDate, 'MMM dd, yyyy')}</span>
                    <span className="text-secondary" style={{ margin: '0 8px' }}>to</span>
                    <span>{format(dateRange[0].endDate, 'MMM dd, yyyy')}</span>
                  </div>
                  
                  {showDatePicker && (
                    <div style={{ position: 'absolute', top: '100%', left: '0', zIndex: 100, marginTop: '8px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                      <DateRange
                        editableDateInputs={true}
                        onChange={item => {
                          setDateRange([item.selection]);
                          setFormData({
                            ...formData,
                            checkInDate: item.selection.startDate.toISOString().split('T')[0],
                            checkOutDate: item.selection.endDate.toISOString().split('T')[0]
                          });
                        }}
                        moveRangeOnFirstSelection={false}
                        ranges={dateRange}
                        months={window.innerWidth < 768 ? 1 : 2}
                        direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'}
                        minDate={new Date()}
                        rangeColors={['var(--accent-primary)']}
                      />
                    </div>
                  )}
                </div>
                <div className="form-group full-width">
                  <label>Customer Name</label>
                  <input placeholder="John Doe" name="customerName" value={formData.customerName} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input placeholder="+1 234 567 8900" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Guests</label>
                  <input type="number" min="1" name="numberOfGuests" value={formData.numberOfGuests} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Booking Source</label>
                  <select name="source" value={formData.source} onChange={handleInputChange}>
                    <option value="Walk-in">Walk-in</option>
                    <option value="MMT">MMT</option>
                    <option value="Booking.com">Booking.com</option>
                    <option value="Agoda">Agoda</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount (Total)</label>
                  <input type="number" min="0" name="amount" value={formData.amount} onChange={handleInputChange} onWheel={(e) => e.target.blur()} required />
                </div>
                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea rows="2" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Special requests..."></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                {!selectedBooking && <button type="submit" className="btn btn-primary">Save Booking</button>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
