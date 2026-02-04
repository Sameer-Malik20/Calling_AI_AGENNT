import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Mail, Phone, MessageSquare, Send, X, CheckCircle, XCircle, Edit, TrendingUp, Users, Target, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import axios from 'axios';

const ProfessionalAppointments = () => {
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
  const [includeEmail, setIncludeEmail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [callLogs, setCallLogs] = useState([]);
  const [loadingCallLogs, setLoadingCallLogs] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointmentStats, setAppointmentStats] = useState({
    followup: 0,
    appointment: 0,
    negotiation: 0,
    discussion: 0,
    proposal_submitted: 0,
    total: 0
  });
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchAppointments();
    fetchAppointmentStats();
  }, [currentMonth]);

  useEffect(() => {
    if (selectedAppointment) {
      setSelectedStatus(selectedAppointment.status);
      const leadId = selectedAppointment.leadId?._id || selectedAppointment.leadId;
      if (leadId) fetchCallLogs(leadId);
    } else {
      setCallLogs([]);
    }
  }, [selectedAppointment]);

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
        const apt = dayAppointments[0];
        setSelectedAppointment(apt);
        setShowModal(true);
        // fetchCallLogs will be triggered by useEffect
      } else {
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
        includeCall: includeCall,
        includeEmail: includeEmail
      });
      alert('Follow-up scheduled successfully!');
      setShowFollowUpModal(false);
      setFollowUpMessage('');
      setFollowUpTime('');
      setIncludeCall(false);
      setIncludeEmail(false);
      fetchAppointments();
      fetchAppointmentStats();
    } catch (error) {
      console.error('Error sending follow-up:', error);
      alert('Failed to schedule follow-up');
    }
  };

  const handleAppointmentSelect = (appointment) => {
    setSelectedAppointment(appointment);
    
    setSelectedStatus(appointment.status);
    setShowSelectionModal(false);
    setShowModal(true);
  };

  const fetchCallLogs = async (leadId) => {
    try {
      setLoadingCallLogs(true);
      const response = await axios.get(`${API_BASE_URL}/api/leads/${leadId}/call-logs`);
      
      // Handle categorized response or fallback to combined array
      if (response.data.campaignLogs && response.data.followUpLogs) {
        setCallLogs([...response.data.campaignLogs, ...response.data.followUpLogs]);
      } else {
        setCallLogs(response.data.callLogs || []);
      }
      
      console.log("Logs fetched successfully");
    } catch (error) {
      console.error('Error fetching call logs:', error);
      setCallLogs([]);
    } finally {
      setLoadingCallLogs(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'COMPLETED': return 'bg-green-100 text-green-600 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-600 border-red-200';
      case 'FOLLOWUP': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'NEGOTIATION': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'DISCUSSION': return 'bg-cyan-100 text-cyan-600 border-cyan-200';
      case 'PROPOSAL_SUBMITTED': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      default: return 'bg-amber-100 text-amber-600 border-amber-200';
    }
  };

  const updateAppointmentStatus = async (status) => {
    try {
      await axios.put(`${API_BASE_URL}/api/appointments/${selectedAppointment._id}`, { status });
      setSelectedStatus(status);
      setTimeout(() => {
        setShowModal(false);
        fetchAppointments();
        fetchAppointmentStats();
      }, 500);
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

// Filter calculations
const initialCallLog = callLogs.find(log => log.callType === 'CAMPAIGN');
console.log("initialCallLog",initialCallLog);
const followUpLogs = callLogs.filter(log => log.callType === 'FOLLOW_UP');
console.log("followUpLogs",followUpLogs);

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Appointment Dashboard
          </h1>
          <p className="text-slate-600">Manage your demo bookings and follow-ups</p>
        </div>

        {/* Stats Dashboard - Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard 
            label="Follow-up" 
            value={appointmentStats.followup} 
            icon={<MessageSquare size={20} />} 
            color="purple" 
            gradient="from-purple-500/20 to-purple-600/10"
          />
          <StatCard 
            label="Appointments" 
            value={appointmentStats.appointment} 
            icon={<Calendar size={20} />} 
            color="blue" 
            gradient="from-blue-500/20 to-blue-600/10"
          />
          <StatCard 
            label="Negotiation" 
            value={appointmentStats.negotiation} 
            icon={<Target size={20} />} 
            color="orange" 
            gradient="from-orange-500/20 to-orange-600/10"
          />
          <StatCard 
            label="Discussion" 
            value={appointmentStats.discussion} 
            icon={<Users size={20} />} 
            color="cyan" 
            gradient="from-cyan-500/20 to-cyan-600/10"
          />
          <StatCard 
            label="Proposal Sent" 
            value={appointmentStats.proposal_submitted} 
            icon={<Send size={20} />} 
            color="emerald" 
            gradient="from-emerald-500/20 to-emerald-600/10"
          />
        </div>

        {/* Calendar Section */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 mb-8">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">{monthName}</h2>
            <div className="flex gap-2">
              <button
                onClick={previousMonth}
                className="p-2 bg-slate-200 hover:bg-slate-300 rounded-lg transition-all duration-200"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 bg-slate-200 hover:bg-slate-300 rounded-lg transition-all duration-200"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-slate-600 py-3">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
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
                    h-24 p-2 rounded-xl border-2 transition-all duration-300 cursor-pointer
                    ${!date ? 'bg-transparent border-transparent cursor-default' :
                      hasAppointments ?
                        'bg-blue-100 border-blue-300 hover:bg-blue-200 hover:border-blue-400' :
                        'bg-white border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }
                    ${isToday ? 'ring-2 ring-blue-500 bg-blue-100' : ''}
                    ${isSelected ? 'shadow-lg scale-105 border-blue-500' : ''}
                  `}
                >
                  {date && (
                    <>
                      <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-slate-900'}`}>
                        {date.getDate()}
                      </div>
                      {hasAppointments && (
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 2).map((apt, i) => (
                            <div key={i} className="text-xs font-medium bg-blue-500 text-white px-1 py-0.5 rounded-md truncate">
                              {new Date(apt.istTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          ))}
                          {dayAppointments.length > 2 && (
                            <div className="text-[10px] font-medium text-blue-600 text-center">
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

        {/* Appointment Selection Modal */}
        {showSelectionModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-55 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full max-h-[80vh] overflow-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between rounded-t-2xl">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Select Appointment</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => setShowSelectionModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-all"
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
                    className="p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {appointment.leadId?.name || 'Unknown Lead'}
                      </span>
                      <span className="text-xs font-medium bg-blue-500 text-white px-2 py-1 rounded-lg">
                        {new Date(appointment.istTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium">
                      {appointment.leadId?.number || 'N/A'} • {appointment.email || appointment.leadId?.email || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-semibold text-slate-900">Status:</span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium uppercase ${getStatusBadgeClass(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200">
                <button
                  onClick={() => setShowSelectionModal(false)}
                  className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-700 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Appointment Details Modal */}
        {showModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between rounded-t-2xl">
                <h3 className="text-xl font-semibold text-slate-900">Appointment Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Lead Information */}
                <div className="bg-slate-100 rounded-xl p-5 space-y-3">
                  <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">Lead Information</h4>
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-slate-900">{selectedAppointment.leadId?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-slate-600">{selectedAppointment.leadId?.number || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-slate-600">{selectedAppointment.email || selectedAppointment.leadId?.email || 'N/A'}</span>
                  </div>
                </div>

                {/* Time Information */}
                <div className="bg-blue-100 rounded-xl p-5 space-y-3">
                  <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">Scheduled Time</h4>
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-blue-600" />
                    <div>
                      <div className="text-sm font-medium text-slate-900">User Time: {selectedAppointment.userTime}</div>
                      <div className="text-xs font-medium text-slate-600">IST: {new Date(selectedAppointment.istTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
                      <div className="text-xs font-medium text-slate-600">Timezone: {selectedAppointment.timezone}</div>
                    </div>
                  </div>
                </div>
{/* Initial Campaign Call Transcript */}
 <div className="mb-8">
     <div className="flex justify-between items-center mb-3">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 
          Initial Campaign Conversation
        </h4>
        {initialCallLog && (
          <span className="text-[10px] text-slate-500 font-mono">
            {new Date(initialCallLog.timestamp).toLocaleString('en-IN')}
          </span>
        )}
     </div>
     
     {initialCallLog ? (
       <div className="relative group p-[1px] rounded-2xl overflow-hidden">
         {/* Aceternity Gradient Border */}
         <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 opacity-50 group-hover:opacity-100 transition-opacity" />
         
         <div className="relative bg-slate-950/90 backdrop-blur-xl p-5 rounded-2xl border border-white/5">
           <div className="text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
             {initialCallLog.transcript}
           </div>
         </div>
       </div>
     ) : (
       <div className="bg-slate-900/50 border border-dashed border-white/5 p-6 rounded-2xl text-center text-slate-500 text-xs">
         No campaign call found for this lead.
       </div>
     )}
  </div>

  {/* SECTION 2: FOLLOW-UP CALLS (Bento Box 2) */}
  <div>
     <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
       <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> 
       Follow-up History ({followUpLogs.length})
     </h4>

     <div className="grid grid-cols-1 gap-3">
       {followUpLogs.length > 0 ? (
         followUpLogs.map((log, idx) => (
           <div key={idx} className="bg-white/[0.03] border border-white/5 p-4 rounded-xl hover:bg-white/[0.05] transition-colors">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-cyan-400">FOLLOW-UP #{idx + 1}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(log.timestamp).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono line-clamp-2 hover:line-clamp-none transition-all cursor-pointer">
                {log.transcript}
              </div>
           </div>
         ))
       ) : (
         <div className="text-xs text-slate-600 italic px-2">No follow-ups recorded yet.</div>
       )}
     </div>
  </div>

               {/* Status Selection - Radio Buttons */}
                <div className="bg-slate-100 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">Update Status</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <StatusRadio
                      label="Follow-up"
                      value="FOLLOWUP"
                      selected={selectedStatus}
                      onChange={updateAppointmentStatus}
                      color="purple"
                    />
                    <StatusRadio
                      label="Negotiation"
                      value="NEGOTIATION"
                      selected={selectedStatus}
                      onChange={updateAppointmentStatus}
                      color="orange"
                    />
                    <StatusRadio
                      label="Discussion"
                      value="DISCUSSION"
                      selected={selectedStatus}
                      onChange={updateAppointmentStatus}
                      color="cyan"
                    />
                    <StatusRadio
                      label="Proposal Sent"
                      value="PROPOSAL_SUBMITTED"
                      selected={selectedStatus}
                      onChange={updateAppointmentStatus}
                      color="emerald"
                    />
                    <StatusRadio
                      label="Completed"
                      value="COMPLETED"
                      selected={selectedStatus}
                      onChange={updateAppointmentStatus}
                      color="green"
                    />
                    <StatusRadio
                      label="Cancelled"
                      value="CANCELLED"
                      selected={selectedStatus}
                      onChange={updateAppointmentStatus}
                      color="red"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setShowFollowUpModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Send size={16} />
                    Schedule Follow-up
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Follow-up Modal */}
        {showFollowUpModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Schedule Follow-up</h3>
                <button
                  onClick={() => setShowFollowUpModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Follow-up Time</label>
                  <input
                    type="datetime-local"
                    value={followUpTime}
                    onChange={(e) => setFollowUpTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                  <textarea
                    value={followUpMessage}
                    onChange={(e) => setFollowUpMessage(e.target.value)}
                    rows={4}
                    placeholder="Enter your follow-up message..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none font-medium text-slate-900 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Communication Method</label>
                  <div className="space-y-3">
                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      includeCall
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}>
                      <input
                        type="checkbox"
                        checked={includeCall}
                        onChange={(e) => setIncludeCall(e.target.checked)}
                        className="w-5 h-5 text-blue-500 bg-white border-slate-300 rounded focus:ring-blue-500"
                      />
                      <Phone size={20} className={includeCall ? 'text-blue-500' : 'text-slate-600'} />
                      <span className={`font-semibold ${includeCall ? 'text-blue-600' : 'text-slate-700'}`}>Call</span>
                    </label>
                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      includeEmail
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}>
                      <input
                        type="checkbox"
                        checked={includeEmail}
                        onChange={(e) => setIncludeEmail(e.target.checked)}
                        className="w-5 h-5 text-blue-500 bg-white border-slate-300 rounded focus:ring-blue-500"
                      />
                      <Mail size={20} className={includeEmail ? 'text-blue-500' : 'text-slate-600'} />
                      <span className={`font-semibold ${includeEmail ? 'text-blue-600' : 'text-slate-700'}`}>Email</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleFollowUp}
                  disabled={!followUpTime || !followUpMessage}
                  className="w-full px-5 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Schedule Follow-up
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Custom Components
const StatCard = ({ label, value, icon, color, gradient }) => (
  <div className={`bg-gradient-to-br ${gradient} rounded-2xl border border-slate-200 p-6 transition-all duration-300 hover:scale-105`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-600 mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
      <div className={`p-3 rounded-xl bg-${color}-100 text-${color}-600`}>
        {icon}
      </div>
    </div>
  </div>
);

const StatusRadio = ({ label, value, selected, onChange, color }) => (
  <label className={`
    flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer
    ${selected === value ?
      `bg-${color}-100 border-${color}-300 text-${color}-600` :
      'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
    }
  `}>
    <input
      type="radio"
      value={value}
      checked={selected === value}
      onChange={() => onChange(value)}
      className="sr-only"
    />
    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
      selected === value ? `border-${color}-500 bg-${color}-500` : 'border-slate-400'
    }`}>
      {selected === value && <div className="w-2 h-2 rounded-full bg-white"></div>}
    </div>
    <span className="text-sm font-medium">{label}</span>
  </label>
);


export default ProfessionalAppointments;