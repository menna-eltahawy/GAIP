import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Upload, Loader2, Check, Sprout, AlertTriangle, ShieldAlert, Leaf, Wrench } from "lucide-react";
import api from "../../api/axiosConfig";

const SEVERITY = [
  { value: "منخفضة", desc: "ضرر بسيط", dot: "#1b9a4c", bg: "#e9f3ec", border: "#d2e8d9", text: "#167c3e" },
  { value: "متوسطة", desc: "يحتاج متابعة", dot: "#d97706", bg: "#fffbeb", border: "#fde68a", text: "#b45309" },
  { value: "حرجة", desc: "خطر شديد", dot: "#dc2626", bg: "#fef2f2", border: "#fecaca", text: "#b91c1c" },
];

export default function ReportModal({ location, onClose, onReportAdded }) {
  const [description, setDescription] = useState("");
  const [problemType, setProblemType] = useState("");
  const [cropType, setCropType] = useState("قمح");
  const [problemName, setProblemName] = useState("");
  const [severity, setSeverity] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const crops = ["قمح", "ذرة"];
  const problemTypes = ["مشكلة في محاصيل", "مشكلة أخرى"];

  const selectedSeverity = useMemo(() => SEVERITY.find((s) => s.value === severity), [severity]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      }
    }
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || !problemType || !severity) return;
    if (problemType === "مشكلة أخرى" && !problemName.trim()) return;

    setIsSubmitting(true);
    setErrorMsg("");

    const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");

    const formData = new FormData();
    formData.append("Email", userInfo.email || "");
    formData.append("ProblemType", problemType);
    if (problemType === "مشكلة في محاصيل") {
      formData.append("CropType", cropType);
    } else {
      formData.append("ProblemName", problemName);
    }
    formData.append("SeverityLevel", severity);
    formData.append("Description", description);

    formData.append("Latitude", location.lat);
    formData.append("Longitude", location.lng);

    if (selectedFile) formData.append("Image", selectedFile);

    try {
      await api.post("/Reports", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setIsSubmitting(false);
      setIsSuccess(true);
      onReportAdded();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "حدث خطأ أثناء إرسال البلاغ.");
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
      dir="rtl"
    >
      <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-[#f9fbf9]">
          <div className="flex items-center gap-3">
            <div className="bg-[#e9f3ec] p-2.5 rounded-xl border border-[#d2e8d9] text-[#1b9a4c]">
              <Sprout size={20} />
            </div>
            <div>
              <h2 className="text-[17px] font-extrabold text-gray-900">
                إضافة بلاغ إصابة جديد
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                Field Report Submission
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto min-h-0">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 bg-[#e9f3ec] text-[#1b9a4c] rounded-2xl flex items-center justify-center mb-4 border border-[#d2e8d9]">
                <Check size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                تم إرسال البلاغ بنجاح
              </h3>
              <p className="text-[12px] text-gray-500">
                سيتم استلام البلاغ ومراجعته في لوحة تحكم المهندس الزراعي.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-600 text-[12px] rounded-xl border border-rose-100 font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Problem Type */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                  نوع المشكلة
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {problemTypes.map((p) => {
                    const active = problemType === p;
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => { setProblemType(p); if (p === "مشكلة في محاصيل") setProblemName(""); }}
                        className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-[13px] font-bold transition-all ${
                          active
                            ? "bg-[#e9f3ec] border-[#1b9a4c] text-[#167c3e]"
                            : "border-gray-200 bg-[#fbfcfb] text-gray-600 hover:border-[#1b9a4c]"
                        }`}
                      >
                        {p === "مشكلة في محاصيل" ? <Leaf size={16} /> : <Wrench size={16} />}
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Crop Type (when crops problem) */}
              {problemType === "مشكلة في محاصيل" && (
                <div className="animate-fade-in">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                    نوع المحصول
                  </label>
                  <select
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#fbfcfb] text-[13px] text-gray-800 focus:ring-1 focus:ring-[#1b9a4c] focus:border-[#1b9a4c] outline-none transition-all"
                  >
                    {crops.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Problem name (when other) */}
              {problemType === "مشكلة أخرى" && (
                <div className="animate-fade-in">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                    اسم المشكلة
                  </label>
                  <input
                    type="text"
                    required
                    value={problemName}
                    onChange={(e) => setProblemName(e.target.value)}
                    placeholder="اكتب اسم المشكلة"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#fbfcfb] text-[13px] text-gray-800 focus:ring-1 focus:ring-[#1b9a4c] focus:border-[#1b9a4c] outline-none transition-all"
                  />
                </div>
              )}

              {/* Severity Level */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                  مستوى الخطورة
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SEVERITY.map((s) => {
                    const active = severity === s.value;
                    return (
                      <button
                        type="button"
                        key={s.value}
                        onClick={() => setSeverity(s.value)}
                        className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl border transition-all ${
                          active ? "ring-2 ring-offset-1" : ""
                        }`}
                        style={{
                          backgroundColor: active ? s.bg : "#fbfcfb",
                          borderColor: active ? s.dot : "#e5e7eb",
                          boxShadow: active ? `0 0 0 2px ${s.dot}33` : "none",
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.dot }} />
                          <span className="text-[12px] font-extrabold" style={{ color: s.text }}>
                            {s.value}
                          </span>
                        </div>
                        <span className="text-[9px] text-gray-400 font-bold">{s.desc}</span>
                      </button>
                    );
                  })}
                </div>
                {severity && (
                  <p className="flex items-center gap-1.5 mt-2 text-[11px] font-bold" style={{ color: selectedSeverity.text }}>
                    <ShieldAlert size={13} />
                    مستوى الخطورة: {severity} — {selectedSeverity.desc}
                  </p>
                )}
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                  وصف المشكلة
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اصفرار الأوراق، وجود حشرات، جفاف بالمحصول..."
                  required
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#fbfcfb] text-[13px] text-gray-800 focus:ring-1 focus:ring-[#1b9a4c] focus:border-[#1b9a4c] outline-none transition-all resize-none"
                />
              </div>

              {/* File Upload / Camera Zone */}
              <div>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => !selectedFile && fileInputRef.current?.click()}
                  className={`border-[1.5px] border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    selectedFile
                      ? "border-[#1b9a4c] bg-[#e9f3ec]/20"
                      : "border-gray-200 hover:border-[#1b9a4c] bg-[#fbfcfb] hover:bg-[#e9f3ec]/10"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                  />

                  {selectedFile && previewUrl ? (
                    <div className="relative group rounded-xl overflow-hidden border border-gray-200">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-36 object-cover rounded-xl"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={removeFile}
                          className="p-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors shadow-md"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 text-gray-500">
                      <div className="p-2.5 bg-[#e9f3ec] text-[#1b9a4c] rounded-xl mb-2 border border-[#d2e8d9]">
                        <Upload size={20} />
                      </div>
                      <span className="text-[13px] font-bold text-gray-700">
                        اضغط لالتقاط صورة أو رفع ملف
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-5 py-3 text-[13px] font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !description.trim() ||
                    !problemType ||
                    !severity ||
                    (problemType === "مشكلة أخرى" && !problemName.trim())
                  }
                  className="bg-[#1b9a4c] hover:bg-[#167c3e] text-white text-[13px] font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={15} />
                      إرسال البلاغ
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
