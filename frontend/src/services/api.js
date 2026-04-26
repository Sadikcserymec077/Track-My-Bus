import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

// Response interceptor: on 401 clear local storage
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('bustrack_token');
            localStorage.removeItem('bustrack_user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

// ─── AUTH ──────────────────────────────────────────────────────────────────────
export const loginUser = (data) => api.post('/auth/login', data);
export const changePassword = (data) => api.post('/auth/change-password', data);
export const updateFcmToken = (fcmToken) => api.patch('/auth/fcm-token', { fcmToken });
export const updateProfile = (data) => api.patch('/auth/profile', data);
export const registerParent = (data) => api.post('/auth/register-parent', data);

// ─── ADMIN ─────────────────────────────────────────────────────────────────────
export const getDashboard = () => api.get('/admin/dashboard');
export const getAllDrivers = () => api.get('/admin/drivers');
export const createDriver = (data) => api.post('/admin/drivers', data);
export const updateDriver = (id, data) => api.put(`/admin/drivers/${id}`, data);
export const deleteDriver = (id) => api.delete(`/admin/drivers/${id}`);

export const getAllStudents = () => api.get('/admin/students');
export const createStudent = (data) => api.post('/admin/students', data);
export const updateStudent = (id, data) => api.put(`/admin/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/admin/students/${id}`);

export const getAllBuses = () => api.get('/admin/buses');
export const createBus = (data) => api.post('/admin/buses', data);
export const updateBus = (id, data) => api.put(`/admin/buses/${id}`, data);
export const deleteBus = (id) => api.delete(`/admin/buses/${id}`);

export const assignDriverToBus = (data) => api.post('/admin/assign-driver', data);
export const assignStudentToBus = (data) => api.post('/admin/assign-student', data);
export const removeStudentFromBus = (data) => api.post('/admin/remove-student', data);

export const getLiveLocations = () => api.get('/admin/live-locations');
export const getTripHistory = () => api.get('/admin/trip-history');
export const sendNotification = (data) => api.post('/admin/send-notification', data);

// ─── DRIVER ────────────────────────────────────────────────────────────────────
export const getMyBusDriver = () => api.get('/driver/my-bus');
export const startTrip = (data) => api.post('/driver/start-trip', data);
export const sendLocationAPI = (data) => api.post('/driver/send-location', data);
export const stopTrip = (data) => api.post('/driver/stop-trip', data);
export const sosAlert = (data) => api.post('/driver/sos', data);
export const boardStudent = (data) => api.post('/driver/board-student', data);
export const getDriverTripHistory = () => api.get('/driver/trip-history');

// ─── STUDENT ───────────────────────────────────────────────────────────────────
export const getMyBusStudent = () => api.get('/student/my-bus');
export const trackBus = (busId) => api.get(`/student/track-bus/${busId}`);
export const getAllBusLocations = () => api.get('/student/all-bus-locations');
export const getStudentNotifications = () => api.get('/student/notifications');
export const markNotificationRead = (id) => api.patch(`/student/notifications/${id}/read`);
export const studentSosAlert = (data) => api.post('/student/sos', data);

export default api;
