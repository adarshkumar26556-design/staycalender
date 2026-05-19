import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  RefreshCw, CheckCircle, AlertCircle, Globe, Settings,
  Link2, Link2Off, Activity, Zap, DollarSign, List, Webhook
} from 'lucide-react';
import './ChannelManager.css';

const OTA_LIST = [
  { id: 'booking_com', name: 'Booking.com', sub: 'via Channex', color: '#003580' },
  { id: 'airbnb',      name: 'Airbnb',       sub: 'via Channex', color: '#FF5A5F' },
  { id: 'agoda',       name: 'Agoda',         sub: 'via Channex', color: '#5392FF' },
  { id: 'mmt',         name: 'MakeMyTrip',    sub: 'via Channex', color: '#e8173c' },
];

const token = () => localStorage.getItem('token');
const apiFetch = async (url, opts = {}) => {
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}`, ...(opts.headers || {}) }
  });
  return { ok: res.ok, status: res.status, data: await res.json() };
};

// ─── Toast ──────────────────────────────────────────────────────────────────────
let toastTimer;
const useToast = () => {
  const [toast, setToast] = useState(null);
  const show = (msg, type = 'success') => {
    setToast({ msg, type });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setToast(null), 3500);
  };
  return { toast, show };
};

// ─── Component ──────────────────────────────────────────────────────────────────
const ChannelManager = () => {
  const { user } = useContext(AuthContext);
  const { toast, show } = useToast();

  const [tab, setTab] = useState('overview');
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [settings, setSettings] = useState({ connectedChannels: [], apiKeys: {} });
  const [localRooms, setLocalRooms] = useState([]);
  const [channexRooms, setChannexRooms] = useState([]);
  const [channexApiKey, setChannexApiKey] = useState('');
  const [syncLogs, setSyncLogs] = useState([]);
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [rates, setRates] = useState({});          // roomId → price
  const [roomMappings, setRoomMappings] = useState({}); // roomId → channelRoomId

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [pushingRates, setPushingRates] = useState(false);

  // ─── Load properties on mount ────────────────────────────────────────────────
  useEffect(() => {
    apiFetch('/api/properties').then(({ ok, data }) => {
      if (ok) {
        setProperties(data);
        if (data.length > 0) setSelectedPropertyId(data[0]._id);
      }
      setPageLoading(false);
    });
  }, []);

  // ─── Load data when property changes ──────────────────────────────────────────
  useEffect(() => {
    if (!selectedPropertyId) return;
    loadAll(selectedPropertyId);
  }, [selectedPropertyId]);

  const loadAll = async (propId) => {
    await Promise.all([
      loadSettings(propId),
      loadLocalRooms(propId),
      loadSyncLogs(propId),
      loadWebhookLogs(propId),
    ]);
  };

  const loadSettings = async (propId) => {
    const { ok, data } = await apiFetch(`/api/channel-manager/${propId}/settings`);
    if (ok) {
      const cm = data.channelManager || {};
      setSettings(cm);
      setChannexApiKey(cm.apiKeys?.channex || '');
      if (cm.apiKeys?.channex) loadChannexRooms(propId);
    }
  };

  const loadLocalRooms = async (propId) => {
    const { ok, data } = await apiFetch(`/api/rooms/${propId}`);
    if (ok) {
      setLocalRooms(data);
      // Pre-populate mappings from room's channelMappings
      const map = {};
      data.forEach(r => {
        const m = r.channelMappings?.find(x => x.channel === 'Channex');
        if (m) map[r._id] = m.channelRoomId;
      });
      setRoomMappings(map);
    }
  };

  const loadChannexRooms = async (propId) => {
    const { ok, data } = await apiFetch(`/api/channel-manager/${propId}/channex/rooms`);
    if (ok) setChannexRooms(data.data || []);
  };

  const loadSyncLogs = async (propId) => {
    const { ok, data } = await apiFetch(`/api/channel-manager/${propId}/sync-logs`);
    if (ok) setSyncLogs(data);
  };

  const loadWebhookLogs = async (propId) => {
    const { ok, data } = await apiFetch(`/api/channel-manager/${propId}/webhook-logs`);
    if (ok) setWebhookLogs(data);
  };

  // ─── Save API Key ─────────────────────────────────────────────────────────────
  const handleSaveKey = async () => {
    if (!channexApiKey.trim()) return show('Enter an API key first', 'error');
    setSaving(true);
    const { ok, data } = await apiFetch(`/api/channel-manager/${selectedPropertyId}/settings`, {
      method: 'PUT',
      body: JSON.stringify({ connectedChannels: ['Channex'], apiKeys: { channex: channexApiKey.trim() } })
    });
    setSaving(false);
    if (ok) {
      setSettings(data.channelManager);
      show('Channex API key saved!');
      loadChannexRooms(selectedPropertyId);
      loadSyncLogs(selectedPropertyId);
    } else {
      show(data.message || 'Failed to save', 'error');
    }
  };

  // ─── Save Room Mapping ────────────────────────────────────────────────────────
  const handleSaveMapping = async (roomId, channelRoomId) => {
    if (!channelRoomId) return;
    const { ok } = await apiFetch(`/api/channel-manager/${selectedPropertyId}/room-mapping`, {
      method: 'POST',
      body: JSON.stringify({ roomId, channelRoomId, channel: 'Channex' })
    });
    if (ok) show('Room mapped successfully!');
    else show('Failed to save mapping', 'error');
  };

  // ─── Sync Inventory ───────────────────────────────────────────────────────────
  const handleSync = async () => {
    setSyncing(true);
    const { ok, data } = await apiFetch(`/api/channel-manager/${selectedPropertyId}/sync-inventory`, { method: 'POST' });
    setSyncing(false);
    show(ok ? data.message : (data.message || 'Sync failed'), ok ? 'success' : 'error');
    if (ok) loadSyncLogs(selectedPropertyId);
  };

  // ─── Push Rates ───────────────────────────────────────────────────────────────
  const handlePushRates = async () => {
    const ratePayload = localRooms
      .filter(r => rates[r._id] && roomMappings[r._id])
      .map(r => ({
        channelRoomId: roomMappings[r._id],
        date: new Date().toISOString().split('T')[0],
        price: parseFloat(rates[r._id])
      }));

    if (!ratePayload.length) return show('Set at least one rate with a mapped room', 'error');
    setPushingRates(true);
    const { ok, data } = await apiFetch(`/api/channel-manager/${selectedPropertyId}/push-rates`, {
      method: 'POST',
      body: JSON.stringify({ rates: ratePayload })
    });
    setPushingRates(false);
    show(ok ? data.message : (data.message || 'Rate push failed'), ok ? 'success' : 'error');
    if (ok) loadSyncLogs(selectedPropertyId);
  };

  // ─── Derived ──────────────────────────────────────────────────────────────────
  const isConnected = !!settings.apiKeys?.channex;
  const mappedCount = Object.values(roomMappings).filter(Boolean).length;

  if (pageLoading) return (
    <div className="cm-loading">
      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
      Loading Channel Manager...
    </div>
  );

  return (
    <div className="cm-container">
      {/* ─── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 9999,
          padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: 500,
          fontSize: '0.875rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          background: toast.type === 'error' ? '#EF4444' : '#10B981',
          color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem',
          animation: 'slideUp 0.3s ease'
        }}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="cm-header">
        <div className="cm-header-left">
          <h1>Channel Manager</h1>
          <p>Manage OTA connections via Channex · StaySync PMS</p>
        </div>
        <div className="cm-header-actions">
          <select
            className="cm-property-select"
            value={selectedPropertyId}
            onChange={e => setSelectedPropertyId(e.target.value)}
          >
            {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <button
            className={`cm-btn cm-btn-primary ${syncing ? 'spinning' : ''}`}
            onClick={handleSync}
            disabled={syncing || !isConnected}
          >
            <RefreshCw size={16} />
            {syncing ? 'Syncing...' : 'Sync All'}
          </button>
        </div>
      </div>

      {/* ─── Stats Row ──────────────────────────────────────────────────────── */}
      <div className="cm-stats">
        <div className="cm-stat-card">
          <div className="cm-stat-label">Connection</div>
          <div className="cm-stat-value" style={{ color: isConnected ? '#10B981' : '#6B7280', fontSize: '1rem', fontWeight: 600, marginTop: '0.3rem' }}>
            {isConnected ? '● Connected' : '○ Not Connected'}
          </div>
          <div className="cm-stat-sub">Channex API</div>
        </div>
        <div className="cm-stat-card">
          <div className="cm-stat-label">Rooms</div>
          <div className="cm-stat-value">{localRooms.length}</div>
          <div className="cm-stat-sub">in this property</div>
        </div>
        <div className="cm-stat-card">
          <div className="cm-stat-label">Mapped Rooms</div>
          <div className="cm-stat-value">{mappedCount}</div>
          <div className="cm-stat-sub">of {localRooms.length} rooms</div>
        </div>
        <div className="cm-stat-card">
          <div className="cm-stat-label">OTA Channels</div>
          <div className="cm-stat-value">4</div>
          <div className="cm-stat-sub">via Channex</div>
        </div>
        <div className="cm-stat-card">
          <div className="cm-stat-label">Sync Logs</div>
          <div className="cm-stat-value">{syncLogs.length}</div>
          <div className="cm-stat-sub">last 50 events</div>
        </div>
      </div>

      {/* ─── Tab Bar ────────────────────────────────────────────────────────── */}
      <div className="cm-tabs">
        {[
          { id: 'overview',  label: 'Overview',      icon: <Globe size={15} /> },
          { id: 'mapping',   label: 'Room Mapping',  icon: <Link2 size={15} /> },
          { id: 'rates',     label: 'Rates',         icon: <DollarSign size={15} /> },
          { id: 'logs',      label: 'Sync Logs',     icon: <Activity size={15} /> },
          { id: 'webhooks',  label: 'Webhooks',      icon: <Zap size={15} /> },
        ].map(t => (
          <button
            key={t.id}
            className={`cm-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: OVERVIEW ══════════════════════════════════════════════════════ */}
      {tab === 'overview' && (
        <>
          {/* API Key Setup */}
          <div className="cm-panel">
            <div className="cm-panel-header">
              <span className="cm-panel-title"><Settings size={16} /> Channex API Connection</span>
              <span className={`cm-badge ${isConnected ? 'connected' : 'disconnected'}`}>
                <span className="cm-badge-dot" />
                {isConnected ? 'Connected' : 'Not Configured'}
              </span>
            </div>
            <div className="cm-panel-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Paste your Channex API key from <strong>staging.channex.io → API Keys</strong>. All OTAs (Booking.com, Airbnb, Agoda, MakeMyTrip) are managed through Channex.
              </p>
              <div className="cm-api-row">
                <input
                  type="password"
                  placeholder="user-api-key from staging.channex.io..."
                  value={channexApiKey}
                  onChange={e => setChannexApiKey(e.target.value)}
                />
                <button className="cm-btn cm-btn-primary" onClick={handleSaveKey} disabled={saving}>
                  {saving ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={15} />}
                  {saving ? 'Saving...' : 'Save & Connect'}
                </button>
              </div>
              {isConnected && (
                <p style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle size={13} /> Connected successfully. Your key is stored securely.
                </p>
              )}
            </div>
          </div>

          {/* OTA Cards */}
          <div className="cm-ota-grid">
            {OTA_LIST.map(ota => (
              <div className="cm-ota-card" key={ota.id} style={{ '--ota-color': ota.color }}>
                <div className="cm-ota-header">
                  <div className="cm-ota-logo">
                    {ota.name}
                    <span>{ota.sub}</span>
                  </div>
                  <span className={`cm-badge ${isConnected ? 'connected' : 'disconnected'}`}>
                    <span className="cm-badge-dot" />
                    {isConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {isConnected
                    ? `Inventory & rates syncing via Channex`
                    : 'Connect Channex to activate this channel'}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ═══ TAB: ROOM MAPPING ══════════════════════════════════════════════════ */}
      {tab === 'mapping' && (
        <div className="cm-panel">
          <div className="cm-panel-header">
            <span className="cm-panel-title"><Link2 size={16} /> Room Mapping</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {mappedCount}/{localRooms.length} mapped
            </span>
          </div>
          {localRooms.length === 0 ? (
            <div className="cm-empty"><p>No rooms found for this property.</p></div>
          ) : (
            <table className="cm-table">
              <thead>
                <tr>
                  <th>Room No.</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Map to Channex Room Type</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {localRooms.map(room => (
                  <tr key={room._id}>
                    <td><strong>{room.roomNumber}</strong></td>
                    <td>{room.category}</td>
                    <td>
                      <span className={`cm-badge ${room.status === 'available' ? 'connected' : 'error'}`}>
                        {room.status}
                      </span>
                    </td>
                    <td>
                      <select
                        className="cm-map-select"
                        value={roomMappings[room._id] || ''}
                        onChange={e => setRoomMappings(prev => ({ ...prev, [room._id]: e.target.value }))}
                      >
                        <option value="">— Select Channex Room —</option>
                        {channexRooms.map(cr => (
                          <option key={cr.id} value={cr.id}>{cr.attributes?.title} ({cr.attributes?.count_of_rooms} rooms)</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        className="cm-btn cm-btn-primary cm-btn-sm"
                        onClick={() => handleSaveMapping(room._id, roomMappings[room._id])}
                        disabled={!roomMappings[room._id]}
                      >
                        <Link2 size={13} /> Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {channexRooms.length === 0 && isConnected && (
            <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              No room types found in your Channex account. Create room types at staging.channex.io → Rooms & Rates first.
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: RATES ══════════════════════════════════════════════════════════ */}
      {tab === 'rates' && (
        <div className="cm-panel">
          <div className="cm-panel-header">
            <span className="cm-panel-title"><DollarSign size={16} /> Daily Rate Management</span>
            <button
              className={`cm-btn cm-btn-primary cm-btn-sm ${pushingRates ? 'spinning' : ''}`}
              onClick={handlePushRates}
              disabled={pushingRates || !isConnected}
            >
              <RefreshCw size={14} />
              {pushingRates ? 'Pushing...' : 'Push Rates to OTAs'}
            </button>
          </div>
          {localRooms.length === 0 ? (
            <div className="cm-empty"><p>No rooms found for this property.</p></div>
          ) : (
            <table className="cm-table">
              <thead>
                <tr>
                  <th>Room No.</th>
                  <th>Category</th>
                  <th>Channex Room Mapped</th>
                  <th>Rate (₹ per night)</th>
                </tr>
              </thead>
              <tbody>
                {localRooms.map(room => (
                  <tr key={room._id}>
                    <td><strong>{room.roomNumber}</strong></td>
                    <td>{room.category}</td>
                    <td>
                      {roomMappings[room._id]
                        ? <span className="cm-badge connected"><CheckCircle size={11} /> Mapped</span>
                        : <span className="cm-badge disconnected">Not Mapped</span>}
                    </td>
                    <td>
                      <div className="cm-rate-input">
                        <span>₹</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={rates[room._id] || ''}
                          onChange={e => setRates(prev => ({ ...prev, [room._id]: e.target.value }))}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Rates are pushed to today's date for all mapped rooms. Map rooms first in the Room Mapping tab.
          </div>
        </div>
      )}

      {/* ═══ TAB: SYNC LOGS ══════════════════════════════════════════════════════ */}
      {tab === 'logs' && (
        <div className="cm-panel">
          <div className="cm-panel-header">
            <span className="cm-panel-title"><Activity size={16} /> Sync Activity Log</span>
            <button className="cm-btn cm-btn-secondary cm-btn-sm" onClick={() => loadSyncLogs(selectedPropertyId)}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
          <div className="cm-panel-body">
            {syncLogs.length === 0 ? (
              <div className="cm-empty"><p>No sync events yet. Save your API key or sync inventory to get started.</p></div>
            ) : (
              syncLogs.map(log => (
                <div className="cm-log-item" key={log._id}>
                  <div className={`cm-log-dot ${log.status}`} />
                  <div className="cm-log-body">
                    <div className="cm-log-message">{log.message}</div>
                    <div className="cm-log-meta">
                      {log.type?.toUpperCase()} · {log.channel || '—'} · {new Date(log.createdAt).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <span className={`cm-badge ${log.status === 'success' ? 'connected' : log.status === 'failed' ? 'error' : 'disconnected'}`}>
                    {log.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB: WEBHOOKS ═══════════════════════════════════════════════════════ */}
      {tab === 'webhooks' && (
        <div className="cm-panel">
          <div className="cm-panel-header">
            <span className="cm-panel-title"><Zap size={16} /> Incoming Webhooks</span>
            <button className="cm-btn cm-btn-secondary cm-btn-sm" onClick={() => loadWebhookLogs(selectedPropertyId)}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
          <div style={{ padding: '0.75rem 1.25rem', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Configure this webhook URL in your Channex dashboard: <code style={{ background: 'var(--bg-secondary)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>https://your-domain.com/api/channel-manager/webhook/Channex</code>
          </div>
          {webhookLogs.length === 0 ? (
            <div className="cm-empty"><p>No webhooks received yet. Configure the webhook URL in Channex to start receiving bookings.</p></div>
          ) : (
            <table className="cm-table">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Booking ID</th>
                  <th>Event</th>
                  <th>Processed</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {webhookLogs.map(log => (
                  <tr key={log._id}>
                    <td><span className="cm-webhook-tag">{log.channel}</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.channelBookingId || '—'}</td>
                    <td>{log.eventType || '—'}</td>
                    <td>
                      <span className={`cm-badge ${log.processed ? 'connected' : 'error'}`}>
                        {log.processed ? '✓ Yes' : '✗ Failed'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default ChannelManager;
