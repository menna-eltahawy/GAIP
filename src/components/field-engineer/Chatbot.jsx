import { useState, useRef, useEffect } from "react";
import api from "../../api/axiosConfig";
import { Sprout, MessageSquare, X, Send, Loader2, FileText } from "lucide-react";

const Chatbot = ({ buttonPositionClasses = "absolute bottom-[24px] right-[20px]" }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      sender: "bot",
      text: "Hi I am Wall-E how can I help you today",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim() || loading) return;

    const userText = message;
    setMessage("");
    setChatHistory((prev) => [...prev, { sender: "user", text: userText }]);
    setLoading(true);

    try {
      // تم التعديل هنا
      const res = await api.post(`/api/chatbot/engineer`, { user_message: userText });
      setChatHistory((prev) => [...prev, { sender: "bot", text: res.data.response }]);
    } catch (err) {
      const errMsg = err.response?.data?.detail || "عذراً، حدث خطأ في معالجة طلبك.";
      setChatHistory((prev) => [...prev, { sender: "bot", text: `❌ ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await api.post(`/api/chatbot/engineer/pdf`, {}, { headers, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `irrigation_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("فشل تحميل تقرير PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <>
      <div className={`${buttonPositionClasses} z-[9998] pointer-events-none`} dir="ltr">
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="pointer-events-auto w-[46px] h-[46px] rounded-[12px] bg-[#e2e4c8] dark:bg-slate-800 border-[2.5px] border-white/90 dark:border-slate-700 text-[#1b9a4c] dark:text-emerald-400 shadow-md flex items-center justify-center transition-transform hover:scale-105"
          title="Field Engineer Assistant"
        >
          {isChatOpen ? <X className="w-5 h-5" strokeWidth={2.5} /> : <MessageSquare className="w-5 h-5" strokeWidth={2.5} />}
        </button>
      </div>

      <div
        dir="rtl"
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000] bg-slate-900 w-[400px] max-w-[90vw] rounded-2xl shadow-2xl border border-slate-800 overflow-hidden transition-all duration-300 origin-center ${
          isChatOpen ? "scale-100 opacity-100 pointer-events-auto" : "scale-95 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-slate-950 border-b border-slate-800 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-500" />
            <span className="font-bold text-sm text-slate-100">Wall-E</span>
          </div>
          <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-slate-200 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="h-72 p-4 overflow-y-auto bg-slate-900 text-xs space-y-3 flex flex-col">
          {chatHistory.map((chat, index) => (
            <div key={index} className="flex flex-col gap-1 self-end">
              <div className={`p-3 rounded-xl shadow-sm max-w-[85%] border transition-all ${chat.sender === "user" ? "bg-emerald-950/30 border-emerald-500/20 text-emerald-100 rounded-tr-none self-start text-right" : "bg-slate-950 border-slate-800 text-slate-200 rounded-tl-none self-end text-right whitespace-pre-wrap"}`}>
                {chat.text}
              </div>
              {chat.sender === "bot" && index === chatHistory.length - 1 && (
                <button onClick={handleDownloadPDF} disabled={pdfLoading} className="flex items-center gap-1 text-[10px] text-emerald-500 hover:text-emerald-400 self-start mr-1 transition-colors disabled:opacity-40">
                  <FileText className="w-3 h-3" />
                  {pdfLoading ? "جاري التحميل..." : "Loading PDF"}
                </button>
              )}
            </div>
          ))}
          {loading && (
            <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl rounded-tl-none shadow-sm flex items-center gap-2 self-end">
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
              <span className="text-[10px] text-slate-400">جاري تحليل بيانات التربة...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
          <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} disabled={loading} placeholder="اسأل عن الري، التربة، أو المحاصيل..." className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-60 text-right transition-colors" />
          <button type="submit" disabled={loading || !message.trim()} className="bg-emerald-600 text-slate-100 p-2 rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-40 flex items-center justify-center shrink-0">
            <Send className="w-4 h-4 transform rotate-180" />
          </button>
        </form>
      </div>
    </>
  );
};

export default Chatbot;