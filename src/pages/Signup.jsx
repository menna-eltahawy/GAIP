import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import api from "../api/axiosConfig";
import logoImg from '../assets/logo.svg';

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const navigate = useNavigate();

  function validate(data) {
    const errs = {};
    if (!data.firstName.trim()) errs.firstName = 'First Name مطلوب';
    if (!data.lastName.trim()) errs.lastName = 'Last Name مطلوب';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errs.email = 'أدخل بريد إلكتروني صالح';
    if (!/^01[0125]\d{8}$/.test(data.phoneNumber.trim())) errs.phoneNumber = 'رقم الهاتف لازم 11 رقم ويبدأ بـ 010 / 011 / 012 / 015';
    if (data.password.length < 8) errs.password = 'كلمة المرور 8 أحرف على الأقل';
    return errs;
  }

  async function handleSignup(e) {
    e.preventDefault();
    setGeneralError('');

    const localErrs = validate(formData);
    setErrors(localErrs);
    if (Object.keys(localErrs).length > 0) return;

    setLoading(true);

    const data = new FormData();
    data.append('first_name', formData.firstName);
    data.append('last_name', formData.lastName);
    data.append('email', formData.email);
    data.append('password', formData.password);
    data.append('phone_number', formData.phoneNumber);

    try {
      await api.post('/user/new', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("تم إنشاء الحساب بنجاح!");
      navigate('/'); 
    } catch (error) {
      console.error(error);
      const detail = error.response?.data?.detail;
      if (Array.isArray(detail)) {
        const fieldMap = { first_name: 'firstName', last_name: 'lastName', email: 'email', phone_number: 'phoneNumber', password: 'password' };
        const fieldErrs = {};
        const rest = [];
        detail.forEach(function(d) {
          const locName = d.loc?.[d.loc.length - 1];
          const key = fieldMap[locName];
          if (key) fieldErrs[key] = d.msg;
          else rest.push(typeof d === 'string' ? d : d.msg);
        });
        setErrors(fieldErrs);
        if (rest.length) setGeneralError(rest.join(' | '));
      } else if (typeof detail === 'string') {
        setGeneralError(detail);
      } else {
        setGeneralError('فشل إنشاء الحساب — تحقق من الاتصال بالخادم');
      }
    } finally {
      setLoading(false);
    }
  }

  function setField(name, value) {
    setFormData(function(prev) {
      return Object.assign({}, prev, { [name]: value });
    });
    if (errors[name]) {
      setErrors(function(prev) {
        const newErrs = Object.assign({}, prev);
        delete newErrs[name];
        return newErrs;
      });
    }
  }

  function handleFirstNameChange(e) { setField('firstName', e.target.value); }
  function handleLastNameChange(e) { setField('lastName', e.target.value); }
  function handleEmailChange(e) { setField('email', e.target.value); }
  function handlePhoneChange(e) { setField('phoneNumber', e.target.value); }
  function handlePasswordChange(e) { setField('password', e.target.value); }

  function navigateToLogin() {
    navigate('/');
  }

  return (
    <div className="flex min-h-screen w-full font-sans relative bg-slate-950">
      <div className="absolute top-6 left-6 z-50">
        <ThemeToggle />
      </div>
      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeSlideUp 0.6s ease-out forwards; opacity: 0; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
      `}</style>
      
      <div className="flex flex-col justify-center w-full lg:w-1/2 px-8 lg:px-24 py-12 relative z-10">
        <div className="text-center mb-8 animate-fade-in">
          
{/* Logo without border - White in Dark Mode, Original in Light Mode */}
          <div className="flex justify-center items-center mb-6">
            <img 
              src={logoImg} 
              alt="Wall-E Logo" 
              className="w-16 h-16 object-contain brightness-0 invert transition-all duration-300 [.light_&]:brightness-100 [.light_&]:invert-0" 
            />
          </div>          
          <h1 className="text-[26px] font-extrabold text-slate-100 tracking-tight">Create Account</h1>
          <p className="text-[9px] text-slate-400 mt-2 uppercase tracking-[0.15em] font-bold">Join GAIP Platform</p>
        </div>
        
        <div className="max-w-[400px] w-full mx-auto relative z-10">
          <div className="bg-slate-900 p-8 rounded-[1.5rem] shadow-xl border border-slate-800 animate-fade-in delay-100">
            <form onSubmit={handleSignup} className="space-y-4">
              
              {generalError && (
                <div className="px-3.5 py-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-[11px] font-bold">
                  {generalError}
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">First Name</label>
                <input type="text" required onChange={handleFirstNameChange} className={`w-full px-4 py-3 rounded-xl border bg-slate-950 text-[13px] text-slate-100 focus:outline-none transition-all ${errors.firstName ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'}`} placeholder="First Name" />
                {errors.firstName && <p className="mt-1 text-[10px] font-bold text-red-500">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Last Name</label>
                <input type="text" required onChange={handleLastNameChange} className={`w-full px-4 py-3 rounded-xl border bg-slate-950 text-[13px] text-slate-100 focus:outline-none transition-all ${errors.lastName ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'}`} placeholder="Last Name" />
                {errors.lastName && <p className="mt-1 text-[10px] font-bold text-red-500">{errors.lastName}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Email Address</label>
                <input type="email" required onChange={handleEmailChange} className={`w-full px-4 py-3 rounded-xl border bg-slate-950 text-[13px] text-slate-100 focus:outline-none transition-all ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'}`} placeholder="email@walle.eg" />
                {errors.email && <p className="mt-1 text-[10px] font-bold text-red-500">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Phone Number</label>
                <input type="text" required onChange={handlePhoneChange} className={`w-full px-4 py-3 rounded-xl border bg-slate-950 text-[13px] text-slate-100 focus:outline-none transition-all ${errors.phoneNumber ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'}`} placeholder="01xxxxxxxxx" />
                {errors.phoneNumber && <p className="mt-1 text-[10px] font-bold text-red-500">{errors.phoneNumber}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Password</label>
                <input type="password" required onChange={handlePasswordChange} className={`w-full px-4 py-3 rounded-xl border bg-slate-950 text-[13px] text-slate-100 focus:outline-none transition-all ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'}`} placeholder="••••••••" />
                {errors.password && <p className="mt-1 text-[10px] font-bold text-red-500">{errors.password}</p>}
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-[#DCD7C9] [.light_&]:text-[#FBF5DD] font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-6 shadow-lg shadow-emerald-900/20"
              >
                {loading ? "Creating..." : "Create Account"} <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={navigateToLogin}
                className="w-full bg-slate-950 border-[1.5px] border-slate-800 hover:border-emerald-500 text-slate-300 hover:text-emerald-400 font-bold py-3.5 px-4 rounded-xl transition-all mt-4"
              >
                Already have an account? Sign In
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 border-l border-slate-800 flex-col justify-center px-[8%] text-slate-100 relative overflow-hidden lg:sticky lg:top-0 lg:h-screen">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(currentColor 1.5px, transparent 1.5px)', backgroundSize: '24px 24px', color: 'var(--color-emerald-500)' }}></div>
        <div className="animate-fade-in delay-200 relative z-10">
          <div className="w-10 h-[3px] bg-emerald-500 mb-6 rounded-full"></div>
          
          <h2 className="text-[40px] font-bold mb-6 leading-[1.2] tracking-tight text-slate-100">
            Deploy Advanced Geospatial AI.
          </h2>
          
          <p className="text-slate-400 text-[15px] mb-12 max-w-[480px] leading-relaxed font-medium">
            Create your workspace to access automated crop classification, predictive soil analytics, and real-time telemetry. Equip your operations with precise, data-driven intelligence.
          </p>
          
          <div className="flex gap-16">
            <div>
              <p className="text-[34px] font-bold mb-1 text-emerald-500">Analyze</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">Predictive Insights</p>
            </div>
            <div>
              <p className="text-[34px] font-bold mb-1 text-emerald-500">Monitor</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">Real-Time Telemetry</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}