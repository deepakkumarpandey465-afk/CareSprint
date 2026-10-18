
import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Check,
  Clock,
  Search,
  Stethoscope,
  UserRound,
  X,
  LayoutDashboard,
  HeartPulse,
  RefreshCw
} from "lucide-react";

const API_URL = "http://localhost:3001/api/bookings";

const doctors = [
  {
    id: 1,
    name: "Dr. Aditi Sharma",
    specialty: "General Physician",
    experience: "8 years",
    fee: 500,
    available: true
  },
  {
    id: 2,
    name: "Dr. Rahul Verma",
    specialty: "Cardiologist",
    experience: "12 years",
    fee: 800,
    available: true
  },
  {
    id: 3,
    name: "Dr. Neha Kapoor",
    specialty: "Dermatologist",
    experience: "6 years",
    fee: 600,
    available: true
  },
  {
    id: 4,
    name: "Dr. Arjun Mehta",
    specialty: "Pediatrician",
    experience: "10 years",
    fee: 700,
    available: false
  }
];

const statusLabels = {
  pending: "Pending",
  accepted: "Confirmed",
  declined: "Declined",
  completed: "Completed",
  cancelled: "Cancelled"
};

const emptyForm = {
  name: "",
  phone: "",
  address: "",
  doctorName: "",
  specialty: "",
  date: "",
  time: "",
  reason: ""
};

function formatDate(value) {
  if (!value) return "Not provided";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-${status || "pending"}`}>
      {statusLabels[status] || status || "Pending"}
    </span>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <Icon size={20} />
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function BookingCard({
  booking,
  doctorView,
  onStatusChange,
  onCancel,
  busyId
}) {
  const isBusy = String(busyId) === String(booking.id);

  return (
    <article className="booking-card">
      <div className="booking-card-top">
        <div className="avatar">
          <UserRound size={22} />
        </div>

        <div className="booking-main">
          <h3>{booking.name}</h3>
          <p>{booking.doctorName}</p>
        </div>

        <StatusBadge status={booking.status} />
      </div>

      <div className="booking-details">
        <div>
          <CalendarDays size={16} />
          <span>
            {booking.eta ||
              [booking.date && formatDate(booking.date), booking.time]
                .filter(Boolean)
                .join(" · ") ||
              "Appointment time not available"}
          </span>
        </div>
        <div>
          <Clock size={16} />
          <span>{booking.fee != null ? `Fee: ₹${booking.fee}` : "Appointment"}</span>
        </div>
        {booking.specialty && (
          <div>
            <Stethoscope size={16} />
            <span>{booking.specialty}</span>
          </div>
        )}
      </div>

      {booking.phone && (
        <p className="booking-extra">
          <strong>Phone:</strong> {booking.phone}
        </p>
      )}

      {booking.reason && (
        <p className="booking-extra">
          <strong>Reason:</strong> {booking.reason}
        </p>
      )}

      {doctorView && booking.status === "pending" && (
        <div className="button-row">
          <button
            className="btn btn-primary"
            disabled={isBusy}
            onClick={() => onStatusChange(booking.id, "accepted")}
          >
            <Check size={16} />
            Accept
          </button>
          <button
            className="btn btn-danger"
            disabled={isBusy}
            onClick={() => onStatusChange(booking.id, "declined")}
          >
            <X size={16} />
            Decline
          </button>
        </div>
      )}

      {doctorView && booking.status === "accepted" && (
        <button
          className="btn btn-primary"
          disabled={isBusy}
          onClick={() => onStatusChange(booking.id, "completed")}
        >
          <Check size={16} />
          Mark as completed
        </button>
      )}

      {!doctorView &&
        ["pending", "accepted"].includes(booking.status) && (
          <button
            className="btn btn-danger cancel-button"
            disabled={isBusy}
            onClick={() => onCancel(booking.id)}
          >
            <X size={16} />
            {isBusy ? "Please wait..." : "Cancel booking"}
          </button>
        )}
    </article>
  );
}

export default function App() {
  const [view, setView] = useState("patient");
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  async function loadBookings() {
    setLoadingBookings(true);
    setError("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Bookings load nahi hui. Backend check karo.");
      }

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("Bookings API se JSON response nahi mila. Backend URL check karo.");
      }
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Backend se connect nahi ho pa raha.");
    } finally {
      setLoadingBookings(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  const visibleDoctors = useMemo(() => {
    const query = doctorSearch.trim().toLowerCase();

    return doctors.filter((doctor) =>
      `${doctor.name} ${doctor.specialty}`.toLowerCase().includes(query)
    );
  }, [doctorSearch]);

  const filteredBookings = useMemo(() => {
    const query = bookingSearch.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesSearch =
        (booking.name || "").toLowerCase().includes(query) ||
        (booking.doctorName || "").toLowerCase().includes(query) ||
        (booking.phone || "").toLowerCase().includes(query);

      // Cancelled requests should never appear in the doctor's active inbox.
      if (view === "doctor" && booking.status === "cancelled") {
        return false;
      }

      const matchesStatus =
        bookingStatusFilter === "all"
          ? true
          : booking.status === bookingStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, bookingSearch, bookingStatusFilter, view]);

  const stats = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      confirmed: bookings.filter((b) => b.status === "accepted").length,
      completed: bookings.filter((b) => b.status === "completed").length
    }),
    [bookings]
  );

  function chooseDoctor(doctor) {
    setForm((current) => ({
      ...current,
      doctorName: doctor.name,
      specialty: doctor.specialty
    }));

    setNotice(`${doctor.name} selected. Complete the booking form below.`);
    setError("");

    document.getElementById("booking-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function submitBooking(event) {
    event.preventDefault();
    setNotice("");
    setError("");

    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !form.doctorName ||
      !form.date ||
      !form.time ||
      !form.reason.trim()
    ) {
      setError("Saare * marked fields fill karna zaroori hai.");
      return;
    }

    if (form.date < today) {
      setError("Please aaj ya future ki date select karo.");
      return;
    }

    const selectedDoctor = doctors.find(
      (doctor) => doctor.name === form.doctorName && doctor.available
    );

    if (!selectedDoctor) {
      setError("Please available doctor select karo.");
      return;
    }

    setSaving(true);

    try {
      const bookingPayload = {
        id: `CS-${Date.now()}`,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        specialty: selectedDoctor.specialty,
        fee: selectedDoctor.fee,
        eta: `${form.date} at ${form.time}`,
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        reason: form.reason.trim()
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingPayload)
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("Booking API se JSON response nahi mila. Backend URL check karo.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Booking create nahi hui.");
      }

      setBookings((current) => [data, ...current]);
      setForm(emptyForm);
      setNotice("Booking request successfully submit ho gayi!");
      setBookingSearch("");
      setBookingStatusFilter("all");
    } catch (err) {
      setError(err.message || "Booking submit karte waqt error aaya.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(id, status) {
    setBusyId(id);
    setNotice("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(id)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status })
        }
      );

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("Status API se JSON response nahi mila. Backend URL check karo.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Status update nahi hua.");
      }

      setBookings((current) =>
        current.map((booking) => (String(booking.id) === String(data.id) ? data : booking))
      );

      setNotice(`Booking status: ${statusLabels[data.status] || data.status}`);
    } catch (err) {
      setError(err.message || "Status update nahi hua.");
    } finally {
      setBusyId(null);
    }
  }

  async function cancelBooking(id) {
    const confirmed = window.confirm(
      "Kya tum is booking ko cancel karna chahte ho?"
    );

    if (!confirmed) return;

    setBusyId(id);
    setNotice("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(id)}/cancel`,
        { method: "PATCH" }
      );

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "API se JSON response nahi mila. Backend URL aur server check karo."
        );
      }

      if (!response.ok) {
        throw new Error(data.error || "Booking cancel nahi hui.");
      }

      setBookings((current) =>
        current.map((booking) =>
          String(booking.id) === String(data.id) ? data : booking
        )
      );

      setNotice("Booking successfully cancel ho gayi.");
      setBookingStatusFilter("all");
    } catch (err) {
      setError(err.message || "Booking cancel karte waqt error aaya.");
    } finally {
      setBusyId(null);
    }
  }

  function resetBookingFilters() {
    setBookingSearch("");
    setBookingStatusFilter("all");
  }

  return (
    <div className="app-shell">
      <style>{`
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: #f6f8fc;
          color: #172033;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        button, input, select, textarea { font: inherit; }
        button { cursor: pointer; }
        button:disabled { opacity: .6; cursor: not-allowed; }
        .app-shell { min-height: 100vh; }
        .navbar {
          background: #fff;
          border-bottom: 1px solid #e7ebf3;
          padding: 15px max(22px, calc((100% - 1180px) / 2));
          display: flex; align-items: center; justify-content: space-between;
          gap: 18px; flex-wrap: wrap;
        }
        .brand { display: flex; align-items: center; gap: 10px; font-size: 21px; font-weight: 800; color: #172b4d; }
        .brand-mark { display: grid; place-items: center; background: #e4edff; color: #285ee8; width: 40px; height: 40px; border-radius: 12px; }
        .brand small { display: block; color: #7b879c; font-size: 11px; font-weight: 500; margin-top: 1px; }
        .nav-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .nav-button { display: flex; gap: 8px; align-items: center; padding: 10px 14px; border: 1px solid transparent; border-radius: 10px; background: transparent; color: #5d6880; font-weight: 650; }
        .nav-button.active { background: #eaf0ff; color: #285ee8; }
        .container { max-width: 1180px; padding: 30px 22px 60px; margin: auto; }
        .hero { background: linear-gradient(120deg, #173b8d, #3268e8); color: white; padding: 34px; border-radius: 22px; display: flex; align-items: center; justify-content: space-between; gap: 22px; flex-wrap: wrap; box-shadow: 0 12px 30px #244fa21c; }
        .eyebrow { font-size: 12px; text-transform: uppercase; letter-spacing: 1.4px; font-weight: 750; opacity: .8; }
        .hero h1 { margin: 10px 0; font-size: clamp(28px, 4vw, 42px); letter-spacing: -1.2px; }
        .hero p { color: #e2eaff; max-width: 600px; line-height: 1.7; margin: 0; }
        .hero-icon { width: 100px; height: 100px; border-radius: 28px; display: grid; place-items: center; background: #ffffff20; }
        .section { margin-top: 34px; }
        .section-heading { display: flex; justify-content: space-between; align-items: end; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; }
        .section-heading h2 { margin: 0 0 5px; font-size: 23px; letter-spacing: -.4px; }
        .section-heading p { margin: 0; color: #748098; line-height: 1.6; font-size: 14px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; margin: 22px 0 28px; }
        .stat-card { background: white; border: 1px solid #e7ebf3; padding: 19px; border-radius: 16px; box-shadow: 0 4px 12px #17203305; }
        .stat-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; color: #748098; font-size: 13px; }
        .stat-top svg { color: #3268e8; }
        .stat-value { font-size: 30px; font-weight: 800; margin-top: 12px; }
        .doctor-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(235px, 1fr)); gap: 16px; }
        .doctor-card, .panel { background: white; border: 1px solid #e7ebf3; border-radius: 17px; padding: 20px; }
        .doctor-top { display: flex; gap: 12px; align-items: center; }
        .doctor-avatar, .avatar { width: 46px; height: 46px; border-radius: 14px; background: #eaf0ff; color: #3268e8; display: grid; place-items: center; flex-shrink: 0; }
        .doctor-card h3 { margin: 0 0 4px; font-size: 16px; }
        .muted { color: #748098; font-size: 13px; }
        .doctor-meta { display: flex; justify-content: space-between; margin: 17px 0; color: #69758d; font-size: 13px; }
        .fee { color: #172033; font-weight: 750; }
        .btn { border: 0; display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 10px 13px; border-radius: 10px; font-size: 13px; font-weight: 700; transition: .15s ease; }
        .btn-primary { background: #3268e8; color: white; }
        .btn-primary:hover { background: #2455ca; }
        .btn-secondary { background: #edf2ff; color: #285ee8; }
        .btn-danger { background: #fff0f0; color: #c73737; }
        .btn-full { width: 100%; }
        .booking-layout { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(300px, .9fr); gap: 20px; align-items: start; }
        .panel h2 { font-size: 20px; margin: 0 0 18px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .field { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
        .field.full { grid-column: 1 / -1; }
        .field label { color: #4c5870; font-size: 13px; font-weight: 700; }
        .field input, .field select, .field textarea, .filter-input, .filter-select {
          width: 100%; border: 1px solid #dce2ec; background: white; padding: 11px 12px; border-radius: 10px; color: #172033; outline: none; min-width: 0;
        }
        .field input:focus, .field select:focus, .field textarea:focus, .filter-input:focus, .filter-select:focus { border-color: #3268e8; box-shadow: 0 0 0 3px #3268e81a; }
        .field textarea { min-height: 80px; resize: vertical; }
        .booking-card { background: white; border: 1px solid #e7ebf3; border-radius: 16px; padding: 18px; margin-bottom: 13px; }
        .booking-card-top { display: flex; gap: 12px; align-items: center; }
        .booking-main { flex: 1; min-width: 0; }
        .booking-main h3 { margin: 0 0 5px; font-size: 16px; overflow-wrap: anywhere; }
        .booking-main p { margin: 0; color: #748098; font-size: 13px; }
        .booking-details { display: flex; flex-wrap: wrap; gap: 13px; margin-top: 17px; color: #69758d; font-size: 12px; }
        .booking-details div { display: flex; align-items: center; gap: 6px; }
        .booking-details svg { color: #3268e8; }
        .booking-extra { color: #69758d; font-size: 13px; line-height: 1.6; overflow-wrap: anywhere; }
        .booking-extra strong { color: #3b465c; }
        .status-badge { display: inline-flex; padding: 6px 9px; border-radius: 999px; font-size: 11px; font-weight: 800; white-space: nowrap; }
        .status-pending { color: #946200; background: #fff4d6; }
        .status-accepted { color: #167246; background: #def8e9; }
        .status-declined { color: #b32d2d; background: #ffebeb; }
        .status-completed { color: #2857b9; background: #e6eeff; }
        .status-cancelled { color: #5c6473; background: #eceff4; }
        .button-row { display: flex; gap: 9px; flex-wrap: wrap; margin-top: 17px; }
        .cancel-button { margin-top: 16px; }
        .filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
        .filter-input { flex: 1 1 210px; }
        .filter-select { flex: 0 1 170px; }
        .notice { padding: 12px 14px; margin: 18px 0; border-radius: 10px; font-size: 14px; line-height: 1.5; }
        .notice.success { color: #17683e; background: #e1f8eb; border: 1px solid #c0efd4; }
        .notice.error { color: #a42c2c; background: #fff0f0; border: 1px solid #ffd5d5; }
        .empty { text-align: center; background: white; border: 1px dashed #d8dfeb; border-radius: 16px; padding: 35px 18px; color: #748098; }
        .empty svg { color: #3268e8; }
        .empty h3 { color: #27334a; margin: 12px 0 6px; }
        .empty p { font-size: 14px; margin: 0 0 14px; line-height: 1.6; }
        .availability { font-size: 12px; color: #167246; margin-bottom: 12px; }
        .availability.unavailable { color: #b32d2d; }
        .footer { text-align: center; padding: 25px 15px; color: #8490a5; font-size: 12px; }
        @media (max-width: 760px) {
          .container { padding: 20px 14px 40px; }
          .navbar { padding: 13px 14px; }
          .hero { padding: 25px 20px; border-radius: 17px; }
          .hero-icon { display: none; }
          .booking-layout { grid-template-columns: 1fr; }
          .form-grid { grid-template-columns: 1fr; }
          .field.full { grid-column: auto; }
          .booking-card-top { align-items: flex-start; flex-wrap: wrap; }
          .booking-card-top .status-badge { margin-left: 58px; }
          .nav-button { padding: 9px 10px; font-size: 12px; }
        }
      `}</style>

      <header className="navbar">
        <div className="brand">
          <div className="brand-mark">
            <HeartPulse size={23} />
          </div>
          <div>
            CareSprint
            <small>Healthcare booking prototype</small>
          </div>
        </div>

        <div className="nav-actions">
          <button
            className={`nav-button ${view === "patient" ? "active" : ""}`}
            onClick={() => setView("patient")}
          >
            <HeartPulse size={17} />
            Patient view
          </button>
          <button
            className={`nav-button ${view === "doctor" ? "active" : ""}`}
            onClick={() => setView("doctor")}
          >
            <LayoutDashboard size={17} />
            Doctor dashboard
          </button>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <div>
            <div className="eyebrow">Simple healthcare, better access</div>
            <h1>
              {view === "patient"
                ? "Your health, made simpler."
                : "Doctor dashboard"}
            </h1>
            <p>
              {view === "patient"
                ? "Find a doctor, request an appointment and manage your bookings from one place."
                : "Manage appointment requests, update booking statuses and review your booking activity."}
            </p>
          </div>
          <div className="hero-icon">
            {view === "patient" ? (
              <HeartPulse size={55} />
            ) : (
              <Activity size={55} />
            )}
          </div>
        </section>

        {notice && (
          <div className="notice success" role="status">
            {notice}
          </div>
        )}

        {error && (
          <div className="notice error" role="alert">
            {error}
            <button
              className="btn btn-secondary"
              style={{ marginLeft: 10 }}
              onClick={loadBookings}
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        <section className="stats-grid" aria-label="Booking statistics">
          <StatCard label="Total bookings" value={stats.total} icon={CalendarDays} />
          <StatCard label="Pending" value={stats.pending} icon={Clock} />
          <StatCard label="Confirmed" value={stats.confirmed} icon={Check} />
          <StatCard label="Completed" value={stats.completed} icon={Activity} />
        </section>

        {view === "patient" ? (
          <>
            <section className="section">
              <div className="section-heading">
                <div>
                  <h2>Find your doctor</h2>
                  <p>Search by doctor name or specialty.</p>
                </div>
              </div>

              <div className="filters">
                <input
                  className="filter-input"
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  placeholder="Search doctors or specialties..."
                  aria-label="Search doctors"
                />
              </div>

              <div className="doctor-grid">
                {visibleDoctors.map((doctor) => (
                  <article className="doctor-card" key={doctor.id}>
                    <div className="doctor-top">
                      <div className="doctor-avatar">
                        <Stethoscope size={22} />
                      </div>
                      <div>
                        <h3>{doctor.name}</h3>
                        <div className="muted">{doctor.specialty}</div>
                      </div>
                    </div>

                    <div className="doctor-meta">
                      <span>{doctor.experience} experience</span>
                      <span className="fee">₹{doctor.fee}</span>
                    </div>

                    <div
                      className={`availability ${doctor.available ? "" : "unavailable"}`}
                    >
                      {doctor.available ? "● Available for demo booking" : "● Currently unavailable"}
                    </div>

                    <button
                      className="btn btn-primary btn-full"
                      disabled={!doctor.available}
                      onClick={() => chooseDoctor(doctor)}
                    >
                      Select doctor
                    </button>
                  </article>
                ))}

                {visibleDoctors.length === 0 && (
                  <div className="empty">
                    <Search size={24} />
                    <h3>No doctors found</h3>
                    <p>Search query change karke dekho.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="section" id="booking-form">
              <div className="section-heading">
                <div>
                  <h2>Book an appointment</h2>
                  <p>Fill in the details to create a booking request.</p>
                </div>
              </div>

              <div className="booking-layout">
                <div className="panel">
                  <h2>Appointment details</h2>

                  <form onSubmit={submitBooking}>
                    <div className="form-grid">
                      <div className="field full">
                        <label htmlFor="doctorName">Select doctor *</label>
                        <select
                          id="doctorName"
                          name="doctorName"
                          value={form.doctorName}
                          onChange={(e) => {
                            const selected = doctors.find(
                              (doctor) => doctor.name === e.target.value
                            );

                            setForm((current) => ({
                              ...current,
                              doctorName: e.target.value,
                              specialty: selected?.specialty || ""
                            }));
                          }}
                          required
                        >
                          <option value="">Choose a doctor</option>
                          {doctors
                            .filter((doctor) => doctor.available)
                            .map((doctor) => (
                              <option key={doctor.id} value={doctor.name}>
                                {doctor.name} — {doctor.specialty}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="field">
                        <label htmlFor="name">Patient name *</label>
                        <input
                          id="name"
                          name="name"
                          value={form.name}
                          onChange={updateForm}
                          placeholder="Enter patient name"
                          autoComplete="name"
                          required
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="phone">Phone number *</label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={form.phone}
                          onChange={updateForm}
                          placeholder="Enter phone number"
                          autoComplete="tel"
                          required
                        />
                      </div>

                      <div className="field full">
                        <label htmlFor="address">Patient address *</label>
                        <input
                          id="address"
                          name="address"
                          value={form.address}
                          onChange={updateForm}
                          placeholder="Enter complete address"
                          autoComplete="street-address"
                          required
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="date">Appointment date *</label>
                        <input
                          id="date"
                          name="date"
                          type="date"
                          min={today}
                          value={form.date}
                          onChange={updateForm}
                          required
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="time">Appointment time *</label>
                        <select
                          id="time"
                          name="time"
                          value={form.time}
                          onChange={updateForm}
                          required
                        >
                          <option value="">Choose a time</option>
                          <option>09:00 AM</option>
                          <option>10:00 AM</option>
                          <option>11:00 AM</option>
                          <option>12:00 PM</option>
                          <option>02:00 PM</option>
                          <option>03:00 PM</option>
                          <option>04:00 PM</option>
                          <option>05:00 PM</option>
                        </select>
                      </div>

                      <div className="field full">
                        <label htmlFor="reason">Reason for visit *</label>
                        <textarea
                          id="reason"
                          name="reason"
                          value={form.reason}
                          onChange={updateForm}
                          placeholder="Briefly describe the reason for appointment"
                          required
                        />
                      </div>
                    </div>

                    <button
                      className="btn btn-primary btn-full"
                      type="submit"
                      disabled={saving}
                      style={{ marginTop: 18, padding: 13 }}
                    >
                      {saving ? "Submitting..." : "Request appointment"}
                    </button>
                  </form>
                </div>

                <div className="panel">
                  <h2>Your bookings</h2>

                  <div className="filters">
                    <input
                      className="filter-input"
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                      placeholder="Search patient, doctor or phone..."
                      aria-label="Search bookings"
                    />
                    <select
                      className="filter-select"
                      value={bookingStatusFilter}
                      onChange={(e) => setBookingStatusFilter(e.target.value)}
                      aria-label="Filter booking status"
                    >
                      <option value="all">All statuses</option>
                      <option value="pending">Pending</option>
                      <option value="accepted">Confirmed</option>
                      <option value="declined">Declined</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {loadingBookings ? (
                    <div className="empty">
                      <p>Loading saved bookings...</p>
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="empty">
                      <CalendarDays size={26} />
                      <h3>No bookings yet</h3>
                      <p>Choose a doctor and submit your first demo request.</p>
                    </div>
                  ) : filteredBookings.length === 0 ? (
                    <div className="empty">
                      <Search size={25} />
                      <h3>No matching bookings</h3>
                      <p>Search ya status filter change karke dekho.</p>
                      <button
                        className="btn btn-secondary"
                        onClick={resetBookingFilters}
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    filteredBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        doctorView={false}
                        onStatusChange={changeStatus}
                        onCancel={cancelBooking}
                        busyId={busyId}
                      />
                    ))
                  )}
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="section">
            <div className="section-heading">
              <div>
                <h2>Incoming requests</h2>
                <p>Review requests and update their booking status.</p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={loadBookings}
                disabled={loadingBookings}
              >
                <RefreshCw size={15} />
                Refresh
              </button>
            </div>

            <div className="filters">
              <input
                className="filter-input"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="Search patient, doctor or phone..."
                aria-label="Search incoming bookings"
              />
              <select
                className="filter-select"
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                aria-label="Filter incoming booking status"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Confirmed</option>
                <option value="declined">Declined</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {loadingBookings ? (
              <div className="empty">
                <p>Loading saved bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="empty">
                <CalendarDays size={26} />
                <h3>No requests yet</h3>
                <p>Patient bookings will appear here.</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="empty">
                <Search size={25} />
                <h3>No matching bookings</h3>
                <p>Search ya status filter change karke dekho.</p>
                <button
                  className="btn btn-secondary"
                  onClick={resetBookingFilters}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  doctorView
                  onStatusChange={changeStatus}
                  onCancel={cancelBooking}
                  busyId={busyId}
                />
              ))
            )}
          </section>
        )}

        <footer className="footer">
          CareSprint demo prototype · Use sample data only; do not enter real patient information.
        </footer>
      </main>
    </div>
  );
}
