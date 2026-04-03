import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import './RoomStatus.css';

const RoomStatus = () => {
  const { user } = useContext(AuthContext);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.propertyId) {
      fetchStatus();
    } else {
      setLoading(false);
    }
  }, [user, selectedDate]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const [r, b] = await Promise.all([
        apiFetch(`/rooms/${user.propertyId}`),
        apiFetch(`/bookings/${user.propertyId}`)
      ]);
      setRooms(r);
      setBookings(b);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRoomStatus = (room) => {
    if (room.status === 'maintenance') return 'maintenance';
    
    const targetDate = new Date(selectedDate);
    targetDate.setHours(0,0,0,0);

    const isBooked = bookings.some(b => {
      if (b.roomId?._id !== room._id) return false;
      const bIn = new Date(b.checkInDate); bIn.setHours(0,0,0,0);
      const bOut = new Date(b.checkOutDate); bOut.setHours(0,0,0,0);
      return targetDate >= bIn && targetDate < bOut; // Check-out day room is available
    });

    return isBooked ? 'booked' : 'available';
  };

  if (!user?.propertyId && user?.role === 'Admin') {
    return <div className="page-header"><h2>Please select a property in Admin Panel.</h2></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Room Status</h2>
          <p className="text-secondary">View room availability for a specific date</p>
        </div>
        <div className="date-picker-wrapper">
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
          />
        </div>
      </div>

      <div className="legend glass-panel">
        <div className="legend-item">
          <div className="color-box available"></div> Available
        </div>
        <div className="legend-item">
          <div className="color-box booked"></div> Booked
        </div>
        <div className="legend-item">
          <div className="color-box maintenance"></div> Blocked / Maintenance
        </div>
      </div>

      <div className="room-grid mt-8">
        {rooms.length === 0 && !loading && <p>No rooms found.</p>}
        {rooms.map(room => {
          const status = getRoomStatus(room);
          return (
            <div key={room._id} className={`room-block ${status} glass-panel`}>
              <div className="room-number">{room.roomNumber}</div>
              <div className="room-category">{room.category}</div>
              <div className="room-status-label">{status.charAt(0).toUpperCase() + status.slice(1)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoomStatus;
