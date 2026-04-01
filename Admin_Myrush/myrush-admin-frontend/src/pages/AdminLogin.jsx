import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../services/authApi.js';
import { adminsApi } from '../services/adminApi.js';
import { Lock, Phone, ArrowRight, Loader2, Save, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/myrushlogo.png';

function AdminLogin() {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password Change State
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempAdminId, setTempAdminId] = useState(null);

  // Check if already logged in (only if not in password change flow)
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const adminInfo = localStorage.getItem('admin_info');

    if (token && adminInfo && !showPasswordChange) {
      const user = JSON.parse(adminInfo);
      // If somehow here but must change password (e.g. refresh), force flow or logout
      if (user.must_change_password) {
        handleLogout(); // Clear bad state
      } else {
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
  };

  const handleMobileChange = (e) => {
    let val = e.target.value;
    if (val.startsWith('+91')) {
      val = val.slice(3);
    }
    // Remove non-digit characters
    val = val.replace(/\D/g, '');
    // Limit to 10 digits
    if (val.length > 10) {
      val = val.slice(0, 10);
    }
    setMobile(val);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError("Please enter your password");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const { response, data } = await loginAdmin(mobile, password);

      if (response.ok && data.success) {
        // Store token immediately as we need it for the update call
        localStorage.setItem('admin_token', data.token);

        // Always store admin info immediately to ensure the next flow (password change) has state
        localStorage.setItem('admin_info', JSON.stringify(data.admin));
        window.dispatchEvent(new Event('admin-info-updated'));

        if (data.admin.must_change_password) {
          setTempAdminId(data.admin.id);
          setShowPasswordChange(true);
          setSuccess('Login successful. Please set a new password.');
          setIsLoading(false); // Stop loading, show new form
        } else {
          setSuccess('Login Successful!');
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        }
      } else {
        const errMsg = data.message || 'Login failed';
        setError(errMsg.toLowerCase() === 'login failed' || errMsg.toLowerCase().includes('password') || errMsg.toLowerCase().includes('credentials') ? 'Invalid password' : errMsg);
        setIsLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      // Call update API
      await adminsApi.update(tempAdminId, { password: newPassword });

      // Update local storage with fresh info including cleared must_change_password flag
      const storedToken = localStorage.getItem('admin_token');
      if (!storedToken) throw new Error("Session lost, please login again");

      // Fetch fresh "me" profile with full permissions extracted correctly
      const me = await adminsApi.getMe();

      if (me) {
        localStorage.setItem('admin_info', JSON.stringify(me));
        window.dispatchEvent(new Event('admin-info-updated'));
        setSuccess('Password updated successfully! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        throw new Error("Could not retrieve user details.");
      }

    } catch (err) {
      setError(err.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <style>{`
        input::-ms-reveal,
        input::-ms-clear {
          display: none;
        }
      `}</style>
      <div className="w-full max-w-md animate-fade-in overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="relative bg-slate-900 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-600 shadow-lg shadow-green-500/30">
            <img
              src={logo}
              alt="MyRush Logo"
              className="h-12 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white text-wrap">
            {showPasswordChange ? 'Set New Password' : 'Welcome'}
          </h1>
          <p className="mt-2 text-slate-400">
            {showPasswordChange ? 'Please choose a secure password for your account' : 'Sign in to manage your venues'}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100 text-wrap break-words">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-600 border border-emerald-100 text-wrap break-words">
              {success}
            </div>
          )}

          {!showPasswordChange ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={handleMobileChange}
                    onBlur={(e) => {
                      if (e.target.value && e.target.value.length !== 10) {
                        setError("Mobile number must be exactly 10 digits");
                      }
                    }}
                    onFocus={() => setError('')}
                    placeholder="Enter mobile number"
                    required
                    maxLength={10}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    maxLength={128}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-12 py-2.5 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 focus:outline-none active:scale-95 transition-transform"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    Login
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordChangeSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    maxLength={128}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    maxLength={128}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    Set Password
                    <Save className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
