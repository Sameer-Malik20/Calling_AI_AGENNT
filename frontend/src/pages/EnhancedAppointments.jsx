import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Mail, Phone, MessageSquare, Send, X, CheckCircle, XCircle, Edit, TrendingUp, Users, Target, BarChart3 } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import axios from 'axios';

const EnhancedAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentSelectionList, setAppointmentSelectionList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  const [includeCall, setIncludeCall] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointmentStats, setAppointmentStats] = useState({
    followup: 0,
    appointment: 0,
    negotiation: 0,
    discussion: 0,
    proposal_submitted: 0,
    total: 0
  });

  useEffect(() => {
    fetchAppointments();
    fetchAppointmentStats();
  }, [currentMonth]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const response = await axios.get(`${API_BASE_URL}/api/appointments`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/appointments/stats`);
      setAppointmentStats(response.data);
    } catch (error) {
      console.error('Error fetching appointment stats:', error);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getAppointmentsForDate = (date) => {
    if (!date) return [];
    return appointments.filter(apt => {
      const aptDate = new Date(apt.istTime);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const handleDateClick = (date) => {
    if (!date) return;
    setSelectedDate(date);
    const dayAppointments = getAppointmentsForDate(date);
    if (dayAppointments.length > 0) {
      if (dayAppointments.length === 1) {
        // If only one appointment, show directly
        setSelectedAppointment(dayAppointments[0]);
        setShowModal(true);
      } else {
        // If multiple appointments, show selection modal
        setAppointmentSelectionList(dayAppointments);
        setShowSelectionModal(true);
      }
    }
  };

  const handleFollowUp = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/appointments/${selectedAppointment._id}/follow-up`, {
        scheduledTime: followUpTime,
        message: followUpMessage,
        includeCall: includeCall
      });
      alert('Follow-up scheduled successfully!');
      setShowFollowUpModal(false);
      setFollowUpMessage('');
      setFollowUpTime('');
      setIncludeCall(false);
      fetchAppointments();
      fetchAppointmentStats();
    } catch (error) {
      console.error('Error sending follow-up:', error);
      alert('Failed to schedule follow-up');
    }
  };

  const handleAppointmentSelect = (appointment) => {
    setSelectedAppointment(appointment);
    setShowSelectionModal(false);
    setShowModal(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-600';
      case 'COMPLETED': return 'bg-green-100 text-green-600';
      case 'CANCELLED': return 'bg-red-100 text-red-600';
      case 'FOLLOWUP': return 'bg-purple-100 text-purple-600';
      case 'NEGOTIATION': return 'bg-orange-100 text-orange-600';
      case 'DISCUSSION': return 'bg-cyan-100 text-cyan-600';
      case 'PROPOSAL_SUBMITTED': return 'bg-emerald-100 text-emerald-600';
      default: return 'bg-amber-100 text-amber-600';
    }
  };

  const updateAppointmentStatus = async (status) => {
    try {
      await axios.put(`${API_BASE_URL}/api/appointments/${selectedAppointment._id}`, { status });
      alert(`Appointment status updated to ${status.toLowerCase()} successfully!`);
      setShowModal(false);
      fetchAppointments();
      fetchAppointmentStats();
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment');
    }
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="h-full flex flex-col">
      {/* Dashboard Header with Stats */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Appointment Dashboard</h1>
        <p className="text-sm text-slate-500 font-bold">Manage your demo bookings and follow-ups</p>
        
        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
          <StatBox 
            label="Follow-up" 
            value={appointmentStats.followup} 
            icon={<MessageSquare size={20} />} 
            color="purple" 
          />
          <StatBox 
            label="Appointments" 
            value={appointmentStats.appointment} 
            icon={<Calendar size={20} />} 
            color="blue" 
          />
          <StatBox 
            label="Negotiation" 
            value={appointmentStats.negotiation} 
            icon={<Target size={20} />} 
            color="orange" 
          />
          <StatBox 
            label="Discussion" 
            value={appointmentStats.discussion} 
            icon={<Users size={20} />} 
            color="cyan" 
          />
          <StatBox 
            label="Proposal Sent" 
            value={appointmentStats.proposal_submitted} 
            icon={<Send size={20} />} 
            color="emerald" 
          />
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-3xl shadow-xl p-8 flex-1 overflow-hidden flex flex-col">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-slate-900">{monthName}</h2>
          <div className="flex gap-2">
            <button
              onClick={previousMonth}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold transition-all"
            >
              ← Previous
            </button>
            <button
              onClick={nextMonth}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold transition-all"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-black text-slate-400 uppercase tracking-wider py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((date, index) => {
              const dayAppointments = date ? getAppointmentsForDate(date) : [];
              const hasAppointments = dayAppointments.length > 0;
              const isToday = date && date.toDateString() === new Date().toDateString();
              const isSelected = date && selectedDate && date.toDateString() === selectedDate.toDateString();

              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(date)}
                  className={`
                    min-h-[100px] p-3 rounded-2xl border-2 transition-all cursor-pointer
                    ${!date ? 'bg-transparent border-transparent cursor-default' : ''}
                    ${hasAppointments ? 'bg-blue-50 border-blue-500 hover:bg-blue-100' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}
                    ${isToday ? 'ring-2 ring-blue-600' : ''}
                    ${isSelected ? 'shadow-lg scale-105' : ''}
                  `}
                >
                  {date && (
                    <>
                      <div className={`text-sm font-black mb-2 ${isToday ? 'text-blue-600' : 'text-slate-900'}`}>
                        {date.getDate()}
                      </div>
                      {hasAppointments && (
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 2).map((apt, i) => (
                            <div key={i} className="text-[10px] font-bold bg-blue-600 text-white px-2 py-1 rounded-lg truncate">
                              {new Date(apt.istTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          ))}
                          {dayAppointments.length > 2 && (
                            <div className="text-[9px] font-black text-blue-600 text-center">
                              +{dayAppointments.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-50 border-2 border-blue-500 rounded"></div>
            <span className="text-xs font-bold text-slate-600">Has Appointments</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border-2 border-blue-600 rounded ring-2 ring-blue-600"></div>
            <span className="text-xs font-bold text-slate-600">Today</span>
          </div>
        </div>
      </div>

      {/* Appointment Details Modal */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-xl font-black text-slate-900">Appointment Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Lead Information */}
              <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">Lead Information</h4>
                <div className="flex items-center gap-3">
                  <User size={16} className="text-blue-600" />
                  <span className="text-sm font-bold text-slate-900">{selectedAppointment.leadId?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-blue-600" />
                  <span className="text-sm font-bold text-slate-600">{selectedAppointment.leadId?.number || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-blue-600" />
                  <span className="text-sm font-bold text-slate-600">{selectedAppointment.email || selectedAppointment.leadId?.email || 'N/A'}</span>
                </div>
              </div>

              {/* Time Information */}
              <div className="bg-blue-50 rounded-2xl p-5 space-y-3">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">Scheduled Time</h4>
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-blue-600" />
                  <div>
                    <div className="text-sm font-bold text-slate-900">User Time: {selectedAppointment.userTime}</div>
                    <div className="text-xs font-bold text-slate-500">IST: {new Date(selectedAppointment.istTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
                    <div className="text-xs font-bold text-slate-500">Timezone: {selectedAppointment.timezone}</div>
                  </div>
                </div>
              </div>

              {/* Call Transcript */}
              {selectedAppointment.callLogId?.transcript && (
                <div className="bg-slate-50 rounded-2xl p-5">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">Call Transcript</h4>
                  <div className="text-xs font-mono text-slate-600 whitespace-pre-wrap max-h-48 overflow-auto custom-scrollbar">
                    {selectedAppointment.callLogId.transcript}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedAppointment.notes && (
                <div className="bg-amber-50 rounded-2xl p-5">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">Notes</h4>
                  <p className="text-sm font-bold text-slate-600">{selectedAppointment.notes}</p>
                </div>
              )}

              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-slate-900">Status:</span>
                <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${getStatusBadgeClass(selectedAppointment.status)}`}>
                  {selectedAppointment.status}
                </span>
              </div>

              {/* Status Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowFollowUpModal(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  <Send size={16} />
                  Schedule Follow-up
                </button>
                
                {/* Status Update Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateAppointmentStatus('FOLLOWUP')}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-purple-700 transition-all"
                  >
                    <MessageSquare size={14} />
                    Follow-up
                  </button>
                  <button
                    onClick={() => updateAppointmentStatus('NEGOTIATION')}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-orange-700 transition-all"
                  >
                    <Target size={14} />
                    Negotiation
                  </button>
                  <button
                    onClick={() => updateAppointmentStatus('DISCUSSION')}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-cyan-700 transition-all"
                  >
                    <Users size={14} />
                    Discussion
                  </button>
                  <button
                    onClick={() => updateAppointmentStatus('PROPOSAL_SUBMITTED')}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-all"
                  >
                    <Send size={14} />
                    Proposal Sent
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Selection Modal */}
      {showSelectionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[55] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between rounded-t-3xl">
              <div>
                <h3 className="text-xl font-black text-slate-900">Select Appointment</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setShowSelectionModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Appointment List */}
            <div className="p-6 space-y-3">
              {appointmentSelectionList.map((appointment, index) => (
                <div
                  key={appointment._id || index}
                  onClick={() => handleAppointmentSelect(appointment)}
                  className="p-4 border-2 border-slate-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-slate-900">
                      {appointment.leadId?.name || 'Unknown Lead'}
                    </span>
                    <span className="text-xs font-bold bg-blue-600 text-white px-2 py-1 rounded-lg">
                      {new Date(appointment.istTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-bold">
                    {appointment.leadId?.number || 'N/A'} • {appointment.email || appointment.leadId?.email || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-black text-slate-900">Status:</span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-black uppercase ${getStatusBadgeClass(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100">
              <button
                onClick={() => setShowSelectionModal(false)}
                className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-black text-slate-700 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Modal */}
      {showFollowUpModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Schedule Follow-up</h3>
              <button
                onClick={() => setShowFollowUpModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-black text-slate-900 mb-2">Follow-up Time</label>
                <input
                  type="datetime-local"
                  value={followUpTime}
                  onChange={(e) => setFollowUpTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-900 mb-2">Message</label>
                <textarea
                  value={followUpMessage}
                  onChange={(e) => setFollowUpMessage(e.target.value)}
                  rows={4}
                  placeholder="Enter your follow-up message..."
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none font-bold resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="includeCall"
                  checked={includeCall}
                  onChange={(e) => setIncludeCall(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="includeCall" className="text-sm font-black text-slate-900">
                  Include automated follow-up call with previous discussion summary
                </label>
              </div>

              <button
                onClick={handleFollowUp}
                disabled={!followUpTime || !followUpMessage}
                className="w-full px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-wider hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-100"
              >
                Schedule Follow-up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-black text-slate-900 uppercase tracking-wider">Loading Appointments...</p>
          </div>
        </div>
      )}
    </div>
  );
};

const StatBox = ({ label, value, icon, color }) => (
  <div className="bg-white rounded-[24px] border border-slate-100 p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all group overflow-hidden">
    <div className="flex items-center gap-3 overflow-hidden">
      <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 group-hover:scale-110 transition-transform shrink-0`}>
        {React.cloneElement(icon, { size: 16 })}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{label}</p>
        <p className="text-lg font-black text-slate-900 tabular-nums truncate">{value}</p>
      </div>
    </div>
  </div>
);

export default EnhancedAppointments;