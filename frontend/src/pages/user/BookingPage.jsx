import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { formatRupiah, formatDateInput } from '../../utils/helpers';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';

/* ─── Helpers ─── */
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function MiniCalendar({ value, onChange, minDate, maxDate }) {
  const [view, setView] = useState(new Date(value));
  const year = view.getFullYear();
  const month = view.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : new Date(year, month, i - firstDay + 1)
  );

  const isSelected = (d) => d && formatDateInput(d) === formatDateInput(value);
  const isDisabled = (d) => {
    if (!d) return true;
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  };
  const isToday = (d) => d && formatDateInput(d) === formatDateInput(new Date());

  const prev = () => setView(new Date(year, month - 1, 1));
  const next = () => setView(new Date(year, month + 1, 1));

  return (
    <div className="mini-cal">
      <div className="mini-cal-nav">
        <button className="mini-cal-nav-btn" onClick={prev}>‹</button>
        <span className="mini-cal-title">{MONTHS[month]} {year}</span>
        <button className="mini-cal-nav-btn" onClick={next}>›</button>
      </div>
      <div className="mini-cal-grid">
        {DAYS.map(d => <div key={d} className="mini-cal-day-label">{d}</div>)}
        {cells.map((d, i) => (
          <button
            key={i}
            disabled={!d || isDisabled(d)}
            onClick={() => d && !isDisabled(d) && onChange(d)}
            className={[
              'mini-cal-cell',
              !d ? 'empty' : '',
              isSelected(d) ? 'selected' : '',
              isToday(d) && !isSelected(d) ? 'today' : '',
              isDisabled(d) ? 'disabled' : '',
            ].join(' ')}
          >
            {d ? d.getDate() : ''}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Step Indicator ─── */
function StepBar({ step }) {
  const steps = ['Pilih Lapangan', 'Pilih Tanggal & Jam', 'Konfirmasi'];
  return (
    <div className="step-bar">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = step > idx;
        const active = step === idx;
        return (
          <div key={i} className="step-item">
            <div className={`step-circle ${active ? 'active' : done ? 'done' : ''}`}>
              {done ? '✓' : idx}
            </div>
            <span className={`step-label ${active ? 'active' : done ? 'done' : ''}`}>{label}</span>
            {i < steps.length - 1 && <div className={`step-line ${done ? 'done' : ''}`} />}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Component ─── */
export default function BookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [lapangan, setLapangan] = useState([]);
  const [selectedLapangan, setSelectedLapangan] = useState(null); // full object
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [catatan, setCatatan] = useState('');
  const [loadingLapangan, setLoadingLapangan] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState(null);

  const editId = new URLSearchParams(location.search).get('edit');
  const [isEditing, setIsEditing] = useState(false);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Load courts
  useEffect(() => {
    setLoadingLapangan(true);
    api.get('/lapangan?status=aktif').then(async ({ data }) => {
      setLapangan(data);
      if (editId) {
        try {
          const res = await api.get(`/booking/${editId}`);
          const b = res.data.booking;
          const found = data.find(l => String(l.id) === String(b.lapangan_id));
          if (found) setSelectedLapangan(found);
          setSelectedDate(new Date(b.tanggal));
          setCatatan(b.catatan || '');
          setIsEditing(true);

          // Populate selected slots
          const slotsArr = [];
          const start = parseInt(b.jam_mulai.split(':')[0]);
          const end = parseInt(b.jam_selesai.split(':')[0]);
          for(let i=start; i<end; i++) {
             slotsArr.push({ 
               jam_mulai: `${String(i).padStart(2,'0')}:00`, 
               jam_selesai: `${String(i+1).padStart(2,'0')}:00`, 
               status: 'tersedia' 
             });
          }
          setSelectedSlots(slotsArr);
          setStep(2);
        } catch (err) {
          toast.error('Gagal memuat data edit booking. Mungkin sudah tidak bisa diedit.');
          navigate('/riwayat');
        }
      } else if (location.state?.lapangan_id) {
        // Auto-select if passed via state
        const found = data.find(l => String(l.id) === String(location.state.lapangan_id));
        if (found) { setSelectedLapangan(found); setStep(2); }
      }
    }).finally(() => setLoadingLapangan(false));
  }, [editId, location.state, navigate]);

  // Load slots when court/date changes (only on step 2+)
  const fetchSlots = useCallback(async () => {
    if (!selectedLapangan) return;
    setLoadingSlots(true);
    // Don't reset selectedSlots if we are in edit mode and just loaded
    if (!isEditing || selectedSlots.length === 0) {
      setSelectedSlots([]);
    }
    try {
      const qs = editId ? `&exclude_booking_id=${editId}` : '';
      const { data } = await api.get(`/lapangan/${selectedLapangan.id}/slots?tanggal=${formatDateInput(selectedDate)}${qs}`);
      setSlots(data.slots || []);
    } catch { toast.error('Gagal memuat jadwal.'); }
    finally { setLoadingSlots(false); }
  }, [selectedLapangan, selectedDate, editId, isEditing]);

  useEffect(() => { if (step === 2) fetchSlots(); }, [fetchSlots, step]);

  /* Slot selection — only contiguous */
  const toggleSlot = (slot) => {
    if (slot.status !== 'tersedia') return;
    const exists = selectedSlots.find(s => s.jam_mulai === slot.jam_mulai);
    if (exists) {
      setSelectedSlots(selectedSlots.filter(s => s.jam_mulai !== slot.jam_mulai));
      return;
    }
    if (selectedSlots.length === 0) { setSelectedSlots([slot]); return; }
    const sorted = [...selectedSlots, slot].sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].jam_mulai !== sorted[i - 1].jam_selesai) {
        toast.warning('Pilih jam yang berurutan dan berdekatan!'); return;
      }
    }
    setSelectedSlots(sorted);
  };

  const summary = (() => {
    if (!selectedSlots.length || !selectedLapangan) return null;
    const sorted = [...selectedSlots].sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
    const durasi = sorted.length;
    return {
      jam_mulai: sorted[0].jam_mulai,
      jam_selesai: sorted[sorted.length - 1].jam_selesai,
      durasi,
      total: durasi * selectedLapangan.harga_per_jam,
    };
  })();

  const handleSubmit = async () => {
    if (!summary) return;
    setSubmitting(true);
    try {
      const payload = {
        lapangan_id: selectedLapangan.id,
        tanggal: formatDateInput(selectedDate),
        jam_mulai: summary.jam_mulai,
        jam_selesai: summary.jam_selesai,
        catatan,
      };

      let response;
      if (isEditing) {
        response = await api.put(`/booking/${editId}`, payload);
      } else {
        response = await api.post('/booking', payload);
      }

      toast.success(`Booking berhasil ${isEditing ? 'diperbarui' : 'dibuat'}!`);
      setCreatedBookingId(response.data?.booking?.id || '');
      setIsEditing(false);
      setSubmitSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking gagal!');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Render ── */
  if (submitSuccess) {
    const text = `Halo Admin, saya baru saja booking ${selectedLapangan?.nama} untuk tanggal ${formatDateInput(selectedDate)} jam ${summary?.jam_mulai}. Mohon segera dikonfirmasi. Terima kasih!`;
    const waUrl = `https://wa.me/6282129438009?text=${encodeURIComponent(text)}`;

    return (
      <div className="animate-fade" style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>Booking Berhasil {isEditing ? 'Diperbarui' : ''}!</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '32px' }}>
          Pesanan Anda telah masuk ke sistem kami dan sedang menunggu konfirmasi.
        </p>
        <div style={{ background: 'var(--color-surface-2)', padding: '24px', borderRadius: 'var(--radius-lg)', marginBottom: '32px', textAlign: 'left' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Langkah Selanjutnya:</div>
          <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>
            Silakan kirim pesan ke WhatsApp Admin agar pesanan Anda segera diproses dan diverifikasi.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <a href={waUrl} target="_blank" rel="noreferrer" className="btn btn-success btn-xl">
            Konfirmasi ke WhatsApp Admin
          </a>
          <button onClick={() => navigate('/riwayat')} className="btn btn-ghost btn-lg">
            Kembali ke Riwayat Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h1>{isEditing ? 'Edit Booking' : 'Booking Lapangan'}</h1>
        <p>{isEditing ? 'Ubah jadwal atau lapangan pesanan Anda' : 'Pilih lapangan dan jadwal bermain Anda'}</p>
      </div>

      <StepBar step={step} />

      {/* ═══ STEP 1: Pilih Lapangan ═══ */}
      {step === 1 && (
        <div className="booking-step animate-fade">
          <div className="booking-step-title">Pilih Lapangan yang Anda Inginkan</div>
          {loadingLapangan ? <LoadingSpinner text="Memuat lapangan..." /> : (
            <div className="court-select-grid">
              {lapangan.map((l) => {
                const fArr = typeof l.fasilitas === 'string' ? JSON.parse(l.fasilitas || '[]') : (l.fasilitas || []);
                return (
                  <div
                    key={l.id}
                    className={`court-select-card ${selectedLapangan?.id === l.id ? 'selected' : ''}`}
                    onClick={() => setSelectedLapangan(l)}
                  >
                    <div className="court-select-check">{selectedLapangan?.id === l.id ? '✓' : ''}</div>
                    <div className="court-select-info">
                      <div className="court-select-name">{l.nama}</div>
                      <div className="court-select-price">{formatRupiah(l.harga_per_jam)}<span>/jam</span></div>
                      <div className="court-select-hours">Jam Buka: {l.jam_buka} – {l.jam_tutup}</div>
                      <div className="court-select-tags">
                        {fArr.slice(0, 3).map((f, i) => <span key={i} className="court-tag">{f}</span>)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="step-footer">
            <div />
            <button
              className="btn btn-primary btn-lg"
              disabled={!selectedLapangan}
              onClick={() => { setStep(2); }}
            >
              Lanjut — Pilih Jadwal →
            </button>
          </div>
        </div>
      )}

      {/* ═══ STEP 2: Pilih Tanggal & Jam ═══ */}
      {step === 2 && (
        <div className="booking-step animate-fade">
          <div className="booking-step-title">
            Pilih Tanggal & Jam — <span style={{ color: 'var(--color-primary)' }}>{selectedLapangan?.nama}</span>
          </div>

          <div className="booking-datetime-layout">
            {/* Calendar */}
            <div className="booking-date-panel">
              <div className="panel-label">Pilih Tanggal</div>
              <MiniCalendar value={selectedDate} onChange={setSelectedDate} minDate={today} maxDate={maxDate} />
              <div className="selected-date-display">
                {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

            {/* Slots */}
            <div className="booking-slot-panel">
              <div className="panel-label">Pilih Jam Bermain</div>

              {/* Legend */}
              <div className="slot-legend">
                <span><i className="legend-dot green" />Tersedia</span>
                <span><i className="legend-dot selected" />Dipilih</span>
                <span><i className="legend-dot red" />Terisi</span>
                <span><i className="legend-dot yellow" />Blokir</span>
                <span><i className="legend-dot grey" />Lewat</span>
              </div>

              {loadingSlots ? <LoadingSpinner text="Memuat jadwal..." /> : slots.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px 0' }}>
                  <h3>Tidak Ada Slot</h3>
                </div>
              ) : (
                <div className="slot-picker-grid">
                  {slots.map((slot) => {
                    const isSel = selectedSlots.some(s => s.jam_mulai === slot.jam_mulai);
                    const label = {
                      tersedia: isSel ? '✓ Dipilih' : 'Pilih',
                      terisi: 'Terisi',
                      diblokir: 'Blokir',
                      terlewat: 'Lewat',
                    }[slot.status];
                    return (
                      <button
                        key={slot.jam_mulai}
                        disabled={slot.status !== 'tersedia'}
                        onClick={() => toggleSlot(slot)}
                        className={['slot-btn', slot.status, isSel ? 'selected' : ''].join(' ')}
                        title={slot.status === 'terlewat' ? 'Waktu sudah lewat' : slot.status === 'terisi' ? 'Sudah dipesan' : slot.status === 'diblokir' ? 'Maintenance' : ''}
                      >
                        <span className="slot-btn-time">{slot.jam_mulai}</span>
                        <span className="slot-btn-end">s/d {slot.jam_selesai}</span>
                        <span className="slot-btn-label">{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected summary chip */}
              {summary && (
                <div className="slot-summary-chip">
                  <span>{summary.jam_mulai} – {summary.jam_selesai} ({summary.durasi} jam)</span>
                  <strong>{formatRupiah(summary.total)}</strong>
                  <button className="chip-clear" onClick={() => setSelectedSlots([])}>✕</button>
                </div>
              )}
                {/* Controls */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep(1)}>← Ganti Lapangan</button>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1 }} 
                    disabled={selectedSlots.length === 0}
                    onClick={() => setStep(3)}
                  >
                    {isEditing ? 'Simpan Perubahan' : 'Lanjutkan Booking'} →
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ STEP 3: Konfirmasi ═══ */}
      {step === 3 && summary && (
        <div className="booking-step animate-fade">
          <div className="booking-step-title">Konfirmasi Booking Anda</div>

          <div className="confirm-layout">
            {/* Summary card */}
            <div className="confirm-card">
              <div className="confirm-card-header">Ringkasan Pesanan</div>
              {[
                { label: 'Lapangan', value: selectedLapangan?.nama },
                { label: 'Tanggal', value: selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'Jam Bermain', value: `${summary.jam_mulai} – ${summary.jam_selesai}` },
                { label: 'Durasi', value: `${summary.durasi} jam` },
                { label: 'Harga/jam', value: formatRupiah(selectedLapangan?.harga_per_jam) },
              ].map(item => (
                <div key={item.label} className="confirm-row">
                  <span className="confirm-row-label">{item.label}</span>
                  <span className="confirm-row-value">{item.value}</span>
                </div>
              ))}
              <div className="confirm-total">
                <span>Total Pembayaran</span>
                <span className="confirm-total-price">{formatRupiah(summary.total)}</span>
              </div>
              <div className="confirm-note">Pembayaran dilakukan langsung di tempat setelah booking dikonfirmasi admin</div>
            </div>

            {/* Notes + Submit */}
            <div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Catatan (opsional)</label>
                <textarea
                  className="form-textarea"
                  placeholder="Misal: butuh raket, ingin latihan smash, dll."
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  style={{ minHeight: '120px' }}
                />
              </div>

              <div className="confirm-wa-note">
                Notifikasi konfirmasi akan dikirim via WhatsApp ke nomor Anda
              </div>

              <button
                className="btn btn-primary btn-full btn-xl"
                onClick={() => setShowConfirm(true)}
                style={{ marginTop: '16px' }}
              >
                {isEditing ? 'Simpan Perubahan' : 'Kirim Booking Sekarang'}
              </button>

              <button
                className="btn btn-secondary btn-full"
                onClick={() => setStep(2)}
                style={{ marginTop: '10px' }}
              >
                ← Kembali Ubah Jadwal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Modal Konfirmasi Final ═══ */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Konfirmasi Booking"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowConfirm(false)} disabled={submitting}>
              Batal
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Memproses...' : (isEditing ? 'Simpan Perubahan' : 'Ya, Booking Sekarang!')}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Apakah semua detail sudah benar?</p>
        {summary && selectedLapangan && [
          { label: 'Lapangan', value: selectedLapangan.nama },
          { label: 'Tanggal', value: selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
          { label: 'Jam', value: `${summary.jam_mulai} – ${summary.jam_selesai} (${summary.durasi} jam)` },
          { label: 'Total', value: formatRupiah(summary.total) },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{item.label}</span>
            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{item.value}</span>
          </div>
        ))}
      </Modal>
    </div>
  );
}
