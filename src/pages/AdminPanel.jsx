import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Plus, Users, LayoutDashboard, DoorOpen, Trash2 } from 'lucide-react';
import './AdminPanel.css';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('properties');
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms states
  const [propName, setPropName] = useState('');
  const [propAddress, setPropAddress] = useState('');
  const [propEmail, setPropEmail] = useState('');
  const [propPassword, setPropPassword] = useState('');

  const [roomNum, setRoomNum] = useState('');
  const [roomCategory, setRoomCategory] = useState('Standard');
  const [roomProperty, setRoomProperty] = useState('');



  const fetchData = async () => {
    setLoading(true);
    try {
      const props = await apiFetch('/properties');
      setProperties(props);
      // Fetch all rooms via the new Admin endpoint
      const rms = await apiFetch('/rooms').catch(() => []);
      setAllRooms(rms);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/properties', 'POST', { 
        name: propName, 
        address: propAddress,
        email: propEmail,
        password: propPassword
      });
      setPropName(''); setPropAddress(''); setPropEmail(''); setPropPassword('');
      fetchData();
      alert('Property and Login Credentials created successfully!');
    } catch (err) { alert(err.message); }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/rooms', 'POST', { propertyId: roomProperty, roomNumber: roomNum, category: roomCategory });
      setRoomNum('');
      // KEEP roomProperty so Admin can add multiple rooms to same property quickly
      await fetchData(); // Refresh list to show newly created room in table
      alert('Room created successfully');
    } catch (err) { alert(err.message); }
  };

  const handleDeleteProperty = async (id) => {
    if (!window.confirm('Are you sure you want to delete this property? All associated owners will also be removed.')) return;
    try {
      await apiFetch(`/properties/${id}`, 'DELETE');
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      await apiFetch(`/rooms/${id}`, 'DELETE');
      fetchData();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="page-header">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Admin Panel</h2>
          <p className="text-secondary">Manage system configurations</p>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`tab ${activeTab === 'properties' ? 'active' : ''}`} onClick={() => setActiveTab('properties')}>
          <LayoutDashboard size={18}/> Properties
        </button>
        <button className={`tab ${activeTab === 'rooms' ? 'active' : ''}`} onClick={() => setActiveTab('rooms')}>
          <DoorOpen size={18}/> Rooms
        </button>
      </div>

      <div className="admin-content glass-panel">
        {activeTab === 'properties' && (
          <div className="tab-section">
            <h3>Add New Property & Login</h3>
            <form onSubmit={handleCreateProperty} className="admin-form">
              <input placeholder="Property Name" value={propName} onChange={e => setPropName(e.target.value)} required />
              <input placeholder="Location/Address" value={propAddress} onChange={e => setPropAddress(e.target.value)} required />
              <input type="email" placeholder="Login Email" value={propEmail} onChange={e => setPropEmail(e.target.value)} required />
              <input type="password" placeholder="Login Password" value={propPassword} onChange={e => setPropPassword(e.target.value)} required />
              <button type="submit" className="btn btn-primary"><Plus size={18}/> Add Property & Account</button>
            </form>
            
            <h3 className="mt-8">Existing Properties</h3>
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Location</th><th>ID</th><th>Actions</th></tr></thead>
                <tbody>
                  {properties.map(p => (
                    <tr key={p._id}>
                      <td>{p.name}</td>
                      <td>{p.address}</td>
                      <td className="text-muted">{p._id}</td>
                      <td>
                        <button className="icon-btn text-danger" onClick={() => handleDeleteProperty(p._id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {properties.length === 0 && <tr><td colSpan="4">No properties found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="tab-section">
            <h3>Add New Room</h3>
            <form onSubmit={handleCreateRoom} className="admin-form">
              <select value={roomProperty} onChange={e => setRoomProperty(e.target.value)} required>
                <option value="" disabled>Select Property</option>
                {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
              <input placeholder="Room Number (e.g. 101)" value={roomNum} onChange={e => setRoomNum(e.target.value)} required />
              <select value={roomCategory} onChange={e => setRoomCategory(e.target.value)}>
                <option value="Standard">Standard</option>
                <option value="Deluxe">Deluxe</option>
                <option value="Suite">Suite</option>
              </select>
              <button type="submit" className="btn btn-primary"><Plus size={18}/> Add Room</button>
            </form>

            <h3 className="mt-8">Existing Rooms</h3>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Room No.</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allRooms.map(r => (
                    <tr key={r._id}>
                      <td>{r.propertyId?.name || 'N/A'}</td>
                      <td>{r.roomNumber}</td>
                      <td>{r.category}</td>
                      <td><span className={`text-${r.status === 'available' ? 'success' : 'muted'}`}>{r.status}</span></td>
                      <td>
                        <button className="icon-btn text-danger" onClick={() => handleDeleteRoom(r._id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {allRooms.length === 0 && <tr><td colSpan="5">No rooms found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
