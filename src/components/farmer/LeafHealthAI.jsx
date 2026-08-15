import { useRef, useState } from 'react';
import { ScanHeart, Upload, ImagePlus, Loader2, AlertTriangle, CheckCircle2, Leaf, Bug, Combine, RefreshCw } from 'lucide-react';
import api from '../../api/axiosConfig';

const CLASS_META = {
  'Healthy':     { label: 'سليم',             icon: CheckCircle2, color: 'text-emerald-400',   bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  'Leaf Rust':   { label: 'صدأ الأوراق',      icon: Leaf,          color: 'text-orange-400',    bg: 'bg-orange-500/10',  border: 'border-orange-500/30' },
  'Aphid':       { label: 'المن',             icon: Bug,           color: 'text-lime-400',      bg: 'bg-lime-500/10',   border: 'border-lime-500/30' },
  'Rust&Aphid':  { label: 'صدأ ومن معاً',     icon: Combine,       color: 'text-amber-400',     bg: 'bg-amber-500/10',  border: 'border-amber-500/30' },
};

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];

const LeafHealthAI = () => {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const pickFile = (f) => {
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      setError('الرجاء اختيار صورة بصيغة JPG أو PNG أو WebP');
      return;
    }
    setError(null);
    setResult(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const detect = async () => {
    if (!file) {
      setError('اختر صورة المحصول أولاً');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await api.post('/disease/detect', data);
      setResult(res.data);
    } catch (e) {
      const detail = e.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'تعذر الاتصال بالخادم — تأكد من تشغيل الـ backend');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const top = result?.all?.[0];
  const topMeta = top ? CLASS_META[top['class']] || CLASS_META['Leaf Rust'] : null;

  return (
    <div className="space-y-6 animate-card">
      {/* Upload area */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]); }}
        className="cursor-pointer border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-900/50 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 transition-all"
      >
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
        {preview ? (
          <img src={preview} alt="preview" className="max-h-64 rounded-2xl border border-slate-700 shadow-lg" />
        ) : (
          <>
            <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl">
              <ScanHeart className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-sm font-bold text-slate-300">اسحب صورة المحصول هنا أو اضغط للاختيار</p>
            <p className="text-[10px] text-slate-500">JPG أو PNG أو WebP — حتى 10 ميجابايت</p>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={detect}
          disabled={!file || loading}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-black shadow-lg shadow-emerald-900/40 transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
          {loading ? 'جارٍ التشخيص...' : 'تشخيص المحصول'}
        </button>
        {file && (
          <button
            onClick={reset}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 text-xs font-bold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            إعادة الاختيار
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-950/40 border border-red-500/30 text-red-300 px-4 py-3 rounded-2xl text-xs font-bold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Result */}
      {result && top && topMeta && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className={`${topMeta.bg} border ${topMeta.border} p-3 rounded-2xl`}>
                <topMeta.icon className={`w-6 h-6 ${topMeta.color}`} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">النتيجة</p>
                <p className={`text-lg font-black ${topMeta.color}`}>{topMeta.label}</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-2xl font-black text-slate-100">{Math.round(top.confidence * 100)}%</p>
              <p className="text-[10px] text-slate-500">دقة التشخيص</p>
            </div>
          </div>

          {/* Confidence bars */}
          <div className="space-y-2">
            {result.all.map((r) => {
              const meta = CLASS_META[r['class']] || CLASS_META['Leaf Rust'];
              const pct = Math.round(r.confidence * 100);
              return (
                <div key={r['class']} className="flex items-center gap-3 text-xs">
                  <span className="w-24 shrink-0 text-slate-400 font-bold">{meta.label}</span>
                  <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-emerald-400 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-10 text-left text-slate-300 font-black">{pct}%</span>
                </div>
              );
            })}
          </div>

          {/* Advice */}
          <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-4">
            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-wider mb-1.5">التوصية العلاجية</p>
            <p className="text-xs leading-6 text-slate-300">{result.advice_ar}</p>
          </div>

          {top.confidence < 0.5 && (
            <p className="text-[10px] text-amber-400 font-bold flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              الثقة منخفضة — أعد المحاولة بصورة أوضح وأقرب للمحصول
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default LeafHealthAI;
