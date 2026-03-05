import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingsApi } from '../services/adminApi';
import Layout from '../components/Layout';
import { ArrowLeft, Calendar, Clock, MapPin, User, Phone, Mail, IndianRupee, Info } from 'lucide-react';

function BookingDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchBookingDetails();
    }, [id]);

    const fetchBookingDetails = async () => {
        try {
            setLoading(true);
            const data = await bookingsApi.getById(id);
            setBooking(data);
        } catch (err) {
            console.error('Error fetching booking details:', err);
            setError('Failed to load booking details.');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/bookings');
    };

    if (loading) return (
        <Layout>
            <div className="flex items-center justify-center h-screen">Loading...</div>
        </Layout>
    );

    if (error) return (
        <Layout>
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <p className="text-red-500">{error}</p>
                <button onClick={handleBack} className="text-blue-600 hover:underline">Go Back</button>
            </div>
        </Layout>
    );

    if (!booking) return null;

    // Helper for formatting time
    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    };

    // Calculate advance and remaining
    const totalAmount = parseFloat(booking.total_amount) || 0;
    const originalAmount = parseFloat(booking.original_amount) || totalAmount;
    const discountAmount = parseFloat(booking.discount_amount) || 0;
    const isPaid = booking.payment_status === 'paid' || booking.payment_status === 'completed';
    const advancePaid = isPaid ? totalAmount : 0;
    const remainingAmount = totalAmount - advancePaid;

    // Determine slots to display
    // Prioritize time_slots array, fallback to start/end time
    // Determine slots to display
    // Prioritize time_slots array, fallback to start/end time
    // Handle potential key variations (start vs start_time)
    const displaySlots = booking.time_slots && booking.time_slots.length > 0
        ? booking.time_slots.map(slot => {
            const start = slot.start || slot.start_time || slot.startTime;
            const end = slot.end || slot.end_time || slot.endTime;
            if (!start || !end) return null;
            return `${formatTime(start)} - ${formatTime(end)}`;
        }).filter(Boolean)
        : [`${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}`];

    // Format Date
    const formattedDate = new Date(booking.booking_date).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    // Format Month
    const bookingMonth = new Date(booking.booking_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    // Mock prices per slot based on total / slots count (simplified logic as slots might have diff prices)
    const pricePerSlot = displaySlots.length > 0 ? totalAmount / displaySlots.length : totalAmount;

    return (
        <Layout>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="h-5 w-5 text-slate-600" />
                </button>
                <h1 className="text-2xl font-bold text-slate-900">Booking Details</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Court Image & Cancel Button */}
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
                        <div className="relative h-64 w-full bg-slate-100">
                            {/* Placeholder for court image if not available in API response yet */}
                            {booking.court?.images?.[0] ? (
                                <img
                                    src={booking.court.images[0]}
                                    alt="Court"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400">
                                    <MapPin className="h-12 w-12 opacity-20" />
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-200">
                            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
                                Cancel Booking
                            </button>
                        </div>
                    </div>

                    {/* User & Booking Info Grid */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                            {/* User Name */}
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">User Name</p>
                                <p className="text-sm font-medium text-slate-900">{booking.customer_name}</p>
                            </div>

                            {/* Mobile Number */}
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Mobile Number</p>
                                <p className="text-sm font-medium text-slate-900">{booking.customer_phone}</p>
                            </div>

                            {/* Email ID */}
                            <div className="md:col-span-2">
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Email ID</p>
                                <p className="text-sm font-medium text-slate-900">{booking.customer_email}</p>
                            </div>

                            <hr className="md:col-span-2 border-slate-100" />

                            {/* Branch Name */}
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Branch Name</p>
                                <p className="text-sm font-medium text-slate-900">{booking.court?.branch?.name}</p>
                            </div>

                            {/* Game */}
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Game</p>
                                <p className="text-sm font-medium text-slate-900">{booking.game_type?.name || booking.court?.game_type?.name}</p>
                            </div>

                            {/* Number of Players */}
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">No. Of Players</p>
                                <p className="text-sm font-medium text-slate-900">{booking.number_of_players || 'N/A'}</p>
                            </div>

                            {/* Date of Booking */}
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Date Of Booking</p>
                                <p className="text-sm font-medium text-slate-900">{booking.created_at ? new Date(booking.created_at).toLocaleDateString('en-GB') : 'N/A'}</p>
                            </div>

                            {/* Time of Booking */}
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Time Of Booking</p>
                                <p className="text-sm font-medium text-slate-900">{booking.created_at ? new Date(booking.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p>
                            </div>

                            <hr className="md:col-span-2 border-slate-100" />

                            {/* Selected Slots List */}
                            <div className="md:col-span-2">
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Selected Slots</p>
                                <div className="space-y-1">
                                    <p className="font-medium text-slate-900 text-sm mb-2">{booking.court?.name}</p>
                                    <p className="text-sm text-slate-500 mb-2">{bookingMonth}</p>
                                    <ul className="space-y-1">
                                        {displaySlots.map((slot, index) => (
                                            <li key={index} className="text-sm text-slate-600 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                {slot}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Summary */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
                        <h2 className="text-lg font-semibold text-slate-900 mb-6">Selected Ground & Slots</h2>

                        {/* Ground Summary */}
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-slate-900 mb-4">Ground Summary</h3>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-600">Selected Sport</span>
                                <span className="text-sm font-medium text-slate-900">{booking.game_type?.name || booking.court?.game_type?.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Selected Date</span>
                                <span className="text-sm font-medium text-slate-900">{bookingMonth}</span>
                            </div>
                        </div>

                        {/* Price Details */}
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-slate-900 mb-4">Price Details</h3>
                            <div className="space-y-3">
                                {displaySlots.map((slot, index) => (
                                    <div key={index} className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs font-medium text-slate-900 uppercase">{booking.court?.name}</p>
                                            <p className="text-xs text-slate-500">{slot}</p>
                                        </div>
                                        <span className="text-sm font-medium text-slate-900">₹{pricePerSlot.toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-slate-100 my-4"></div>

                        {/* Price Breakup */}
                        <div className="mb-auto">
                            <h3 className="text-sm font-semibold text-slate-900 mb-4">Price Breakup</h3>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-600">Ground Total</span>
                                <span className="text-sm font-semibold text-slate-900">₹{originalAmount.toFixed(2)}</span>
                            </div>

                            {discountAmount > 0 && (
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-600">Discount</span>
                                    <span className="text-sm font-bold text-green-600">- ₹{discountAmount.toFixed(2)}</span>
                                </div>
                            )}

                            {booking.coupon_code && (
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm text-slate-600">Applied Coupon</span>
                                    <span className="text-sm font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                                        🏷 {booking.coupon_code}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-center mb-4 border-t pt-3">
                                <span className="text-sm font-bold text-slate-700">Final Amount</span>
                                <span className="text-sm font-bold text-slate-900">₹{totalAmount.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-600">Remaining Amount</span>
                                <span className="text-sm font-bold text-slate-900">₹{remainingAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Advance Amount Paid</span>
                                <span className="text-sm font-medium text-slate-900">₹{advancePaid.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Pay Button */}
                        <div className="mt-6">
                            <button className="w-full py-3 px-4 bg-teal-400 text-white rounded-lg font-semibold hover:bg-teal-500 transition-colors shadow-lg shadow-teal-100">
                                Pay Remaining Amount (₹{remainingAmount.toFixed(2)})
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default BookingDetails;
