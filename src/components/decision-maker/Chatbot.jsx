import { useState, useRef, useEffect } from "react";
import api from '../../api/axiosConfig';
import { Leaf, MessageSquare, X, Send, Loader2 } from "lucide-react";

const Chatbot = ({ 
  onDataLoaded, 
  buttonPositionClasses = "absolute bottom-[20px] right-[20px]" 
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const chatEndRef = useRef(null);

  const [chatHistory, setChatHistory] = useState([
    {
      sender: "bot",
      text: "Hi I am Wall-E how can I help you today",
    },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

  const triggerGeospatialAnalysis = async (geoPayload) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const correctedCoords = geoPayload.geometry.map((point) => [
        point[1],
        point[0],
      ]);

      const strictServerPayload = {
        testStartDate: geoPayload.testStartDate,
        testEndDate: geoPayload.testEndDate,
        geometry: correctedCoords,
      };

      const classifyRes = await api.post(
        `/api/classify`,
        strictServerPayload,
        { headers },
      );
      const compareRes = await api.post(
        `/api/compare`,
        strictServerPayload,
        { headers },
      );

      const classifyData = classifyRes.data;
      if (onDataLoaded) {
        onDataLoaded({
          metadata: strictServerPayload,
          cropTileUrl: classifyData?.maps_urls?.crop_type_tiles,
          healthTileUrl: classifyData?.maps_urls?.crop_health_tiles,
          cropAreas: classifyData?.crop_areas_feddans,
          cropHealth: classifyData?.crop_health_feddans,
          comparisonReport: compareRes.data?.comparison_report,
          cropTypePreview: classifyData?.crop_type_thumbnail_b64
            ? `data:image/png;base64,${classifyData.crop_type_thumbnail_b64}`
            : null,
          cropHealthPreview: classifyData?.crop_health_thumbnail_b64
            ? `data:image/png;base64,${classifyData.crop_health_thumbnail_b64}`
            : null,
        });
      }

      const areas = classifyData?.crop_areas_feddans;
      if (areas) {
        setChatHistory((prev) => [
          ...prev,
          {
            sender: "bot",
            text: `✅ تم الانتهاء من تحليل المحاصيل بنجاح!\n🌾 القمح: ${areas.Wheat_1} فدان\n🌽 الذرة: ${areas.Corn_0} فدان\n🏢 غير زراعي: ${areas.Non_agricultural_2} فدان`,
          },
        ]);
      }
    } catch (err) {
      console.error(
        "فشل تمرير مخرجات الشات بوت للـ Classification Endpoints:",
        err,
      );
    }
  };

  const handleChoiceClick = async (choice, responseType, originalMsg) => {
    setLoading(true);
    try {
      const res = await api.post(
        `/api/chatbot/resolve_choice`,
        {
          original_message: originalMsg,
          selected_name: choice.name,
          choice_type: choice.type,
          response_type: responseType,
        },
      );

      const data = res.data;

      if (
        data.type === "location_choices" ||
        data.type === "governorate_choice"
      ) {
        setChatHistory((prev) => [
          ...prev,
          {
            sender: "bot",
            text: data.message,
            choices: data.choices,
            responseType: data.type,
            originalMessage: originalMsg,
          },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          {
            sender: "bot",
            text: `🎯 تم اختيار المنطقة! جاري معالجة النطاق الجغرافي للموسم الزراعي: (${data.testStartDate} إلى ${data.testEndDate})`,
          },
        ]);
        await triggerGeospatialAnalysis(data);
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || "حدث خطأ في اختيار المنطقة";
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: `❌ ${errMsg}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim() || loading) return;

    const userText = message;
    setMessage("");
    setChatHistory((prev) => [...prev, { sender: "user", text: userText }]);
    setLoading(true);

    try {
      const response = await api.post(
        `/api/chatbot/process_message`,
        {
          user_message: userText,
        },
      );

      const data = response.data;

      if (
        data.type === "location_choices" ||
        data.type === "governorate_choice"
      ) {
        setChatHistory((prev) => [
          ...prev,
          {
            sender: "bot",
            text: data.message,
            choices: data.choices,
            responseType: data.type,
            originalMessage: userText,
          },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          {
            sender: "bot",
            text: `🎯 رائع! قمت بتحليل النص وبدء معالجة النطاق الجغرافي للموسم الزراعي: (${data.testStartDate} إلى ${data.testEndDate})`,
          },
        ]);
        await triggerGeospatialAnalysis(data);
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.detail || "عذراً، حدث خطأ في معالجة النص الجغرافي.";
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: `❌ ${errMsg}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Button with new design matching the image */}
      <div className={`${buttonPositionClasses} z-[9998] pointer-events-none`} dir="ltr">
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="pointer-events-auto w-[46px] h-[46px] rounded-[12px] bg-[#e2e4c8] dark:bg-slate-800 border-[2.5px] border-white/90 dark:border-slate-700 text-[#1b9a4c] dark:text-emerald-400 shadow-md flex items-center justify-center transition-transform hover:scale-105"
          title="GeoAI Assistant"
        >
          {isChatOpen ? (
            <X className="w-5 h-5" strokeWidth={2.5} />
          ) : (
            <MessageSquare className="w-5 h-5" strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* Chat Window */}
      <div
        dir="rtl"
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000] bg-slate-900 w-[400px] max-w-[90vw] rounded-2xl shadow-2xl border border-slate-800 overflow-hidden transition-all duration-300 origin-center ${
          isChatOpen ? "scale-100 opacity-100 pointer-events-auto" : "scale-95 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-slate-950 border-b border-slate-800 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-500" />
            <span className="font-bold text-sm text-slate-100">
              Wall-E GeoAI Assistant
            </span>
          </div>
          <button
            onClick={() => setIsChatOpen(false)}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-80 p-4 overflow-y-auto bg-slate-900 text-xs space-y-3 flex flex-col">
          {chatHistory.map((chat, index) => (
            <div key={index} className="space-y-2">
              <div
                className={`p-3 rounded-xl shadow-sm max-w-[85%] border transition-all ${
                  chat.sender === "user"
                    ? "bg-emerald-950/30 border-emerald-500/20 text-emerald-100 rounded-tr-none self-start text-right"
                    : "bg-slate-950 border-slate-800 text-slate-200 rounded-tl-none self-end text-right whitespace-pre-wrap"
                }`}
              >
                {chat.text}
              </div>
              {chat.choices && chat.choices.length > 0 && (
                <div className="flex flex-col gap-1.5 pr-2">
                  {chat.choices.map((choice, ci) => (
                    <button
                      key={ci}
                      onClick={() =>
                        handleChoiceClick(
                          choice,
                          chat.responseType,
                          chat.originalMessage,
                        )
                      }
                      disabled={loading}
                      className="text-right bg-slate-950 border border-slate-700 hover:bg-emerald-900/20 hover:border-emerald-500 text-slate-200 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-40 shadow-sm"
                    >
                      <span>{choice.short_name || choice.name}</span>
                      {choice.name_en && (
                        <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                          {choice.name_en}
                        </span>
                      )}
                      {choice.source && (
                        <span className="block text-[9px] text-emerald-500 font-normal mt-0.5">
                          {choice.source}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl rounded-tl-none shadow-sm flex items-center gap-2 self-end">
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
              <span className="text-[10px] text-slate-400">
                جاري معالجة الـ GeoAI Pipeline الحركي...
              </span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form
          onSubmit={handleSendMessage}
          className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2"
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
            placeholder="اكتب: حددلى القمح بمركز منوف سنة 2014..."
            className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-60 text-right transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="bg-emerald-600 text-slate-100 p-2 rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-40 flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4 transform rotate-180" />
          </button>
        </form>
      </div>
    </>
  );
};

export default Chatbot;