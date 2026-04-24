import React, { forwardRef } from 'react';
import QRCode from 'react-qr-code';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TransportTicketDesignProps {
  ticket: any;
  applicant: any;
  passengerName: string;
  passportNumber: string;
  ticketNumber: string;
  isRoundTrip: boolean;
}

// Helper: Format Time Strings
const parseTime = (timeStr: string | null | undefined) => {
  if (!timeStr) return { time: "00:00", ampm: "AM" };
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return {
    time: `${h12.toString().padStart(2, '0')}:${(mStr || '00').padStart(2, '0')}`,
    ampm
  };
};

const getBoardTime = (timeStr: string | null | undefined): string => {
  if (!timeStr) return "00:00";
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr || '0', 10);
  m -= 30; // 30 دقيقة قبل الرحلة
  if (m < 0) {
    m += 60;
    h -= 1;
  }
  if (h < 0) h += 24;
  const ampm = h >= 12 ? 'م' : 'ص';
  const h12 = h % 12 || 12;
  return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const formatDate = (dateStr: string) => {
    try {
        const d = new Date(dateStr);
        return {
            date: format(d, 'yyyy-MM-dd'),
            day: format(d, 'EEEE', { locale: ar })
        };
    } catch {
        return { date: '----', day: '---' };
    }
}

// Icons
const BusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" />
  </svg>
);

const QRCodePlaceholder = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 0h30v30H0V0zm10 10v10h10V10H10zM70 0h30v30H70V0zm10 10v10h10V10H80zM0 70h30v30H0V70zm10 10v10h10V80H10zM40 0h20v20H40V0zM40 80h20v20H40V80zM80 40h20v20H80V40zM0 40h20v20H0V40zM40 40h20v20H40V40z" />
    <path d="M30 30h10v10H30V30zm20 0h10v10H50V30zm20 0h10v10H70V30zM30 50h10v10H30V50zm20 0h10v10H50V50zm20 0h10v10H70V50zM30 70h10v10H30V70zm20 0h10v10H50V70zm20 0h10v10H70V70z" opacity="0.8"/>
  </svg>
);

const RouteVisual = ({ duration, isReturn }: { duration: string, isReturn: boolean }) => (
  <div className="flex-1 flex flex-col justify-center mx-8 relative w-full pt-4 min-w-[200px]">
    <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 font-medium bg-white px-3 z-10 rounded-full border border-gray-100 shadow-sm whitespace-nowrap" dir="rtl">
      {duration}
    </span>
    <div className="relative w-full h-1 mt-3">
      <div className={`absolute top-1/2 left-0 w-full border-t-[3px] border-dashed -translate-y-1/2 ${isReturn ? 'border-[#578e36]/40' : 'border-[#074388]/40'}`}></div>
      <div className={`absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-[4px] rounded-full z-10 ${isReturn ? 'border-[#578e36]' : 'border-[#074388]'}`}></div>
      <div className={`absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-[4px] rounded-full z-10 ${isReturn ? 'border-[#578e36]' : 'border-[#074388]'}`}></div>
      <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-white px-2 z-20">
        <BusIcon className={`w-7 h-7 drop-shadow-sm ${isReturn ? 'text-[#578e36] -scale-x-100' : 'text-[#074388] -scale-x-100'}`} />
      </div>
    </div>
  </div>
);

const TransportTicketDesign = forwardRef<HTMLDivElement, TransportTicketDesignProps>(({ ticket, applicant, passengerName, passportNumber, ticketNumber, isRoundTrip }, ref) => {
  const agent = ticket?.agentName || "مكتب سفريات اليمن";
  const pnr = applicant?.applicantCode || "UNKNOWN";

  // Safe Parsing (Fallback to defaults if API doesn't include trip relation)
  const parseSafe = (isReturnTrip: boolean) => {
      const tripSrc = isReturnTrip ? ticket?.returnTrip : ticket?.trip;
      const tFrom = isReturnTrip ? ticket?.arrivalLocation : ticket?.departureLocation;
      const tTo = isReturnTrip ? ticket?.departureLocation : ticket?.arrivalLocation;
      const tDate = isReturnTrip ? (ticket?.returnTrip?.date || ticket?.departureDate) : ticket?.departureDate;
      const tDepTime = tripSrc?.departureTime || ticket?.departureTime || "08:00";
      const tArrTime = tripSrc?.arrivalTime || ticket?.arrivalTime || "12:00";
      
      let totalComputedDuration = 0;
      if (tDepTime && tArrTime) {
          const [dh, dm] = tDepTime.split(':').map(Number);
          const [ah, am] = tArrTime.split(':').map(Number);
          let diff = (ah * 60 + am) - (dh * 60 + dm);
          if (diff < 0) diff += 24 * 60; // Next day
          totalComputedDuration = diff;
      }
      const durationString = totalComputedDuration > 0 ? `${Math.floor(totalComputedDuration / 60)} ساعات` : 'رحلة مباشرة';
      
      return {
          type: isReturnTrip ? 'رحلة العودة' : 'رحلة الذهاب',
          typeEn: isReturnTrip ? 'RETURN' : 'DEPARTURE',
          from: tFrom || "غير محدد",
          to: tTo || "غير محدد",
          dateInfo: formatDate(tDate),
          timeDeparture: parseTime(tDepTime).time,
          timeDepartureAmPm: parseTime(tDepTime).ampm,
          timeArrival: parseTime(tArrTime).time,
          timeArrivalAmPm: parseTime(tArrTime).ampm,
          boardTime: getBoardTime(tDepTime),
          startingPoint: (isReturnTrip ? "محطة العودة المركزية" : ticket?.boardingPoint) || tFrom || "غير محدد",
          duration: durationString,
      };
  };

  const trips = {
    departure: parseSafe(false),
    return: isRoundTrip ? parseSafe(true) : null,
  };

  const conditions = [
    'يجب التواجد في محطة الانطلاق قبل موعد الرحلة بـ 30 دقيقة.',
    'التذكرة صالحة للرحلة والتاريخ المحددين فقط.',
    'يسمح بوزن أمتعة أقصاه 25 كجم للراكب الواحد.',
    'يمنع نقل المواد القابلة للاشتعال أو الخطرة.',
    'الشركة غير مسؤولة عن فقدان الأمتعة الشخصية داخل المقصورة.',
    'يجب إبراز الهوية الشخصية أو الجواز عند الصعود.',
  ];

  return (
    <div ref={ref} className="ticket-page w-[1280px] bg-white flex flex-row rounded-[24px] overflow-hidden font-sans mx-auto mb-8 print:mb-0 print:border print:border-gray-300 print:rounded-none shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] print:shadow-none" dir="ltr" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
        
        {/* ==============================================
            SECTION 1: LEFT STUB (Passenger Stub)
            ============================================== */}
        <div className="w-[320px] bg-[#578e36] text-white flex flex-col relative shrink-0 z-30" dir="rtl">
          <div className="h-12 bg-black/10 w-full flex flex-col items-center justify-center border-b border-black/10 print:bg-[#4d7d30]">
            <span className="text-xs font-black text-white">قسيمة المسافر</span>
            <span className="text-[9px] font-bold text-green-200 uppercase" dir="ltr" style={{ letterSpacing: '0.2em' }}>Passenger Stub</span>
          </div>

          <div className="p-6 flex flex-col flex-1 h-full relative justify-between">
            
            <div>
              <div className="text-center mb-6">
                <p className="text-[10px] text-green-200 uppercase mb-1 font-bold" style={{ letterSpacing: '0.2em' }}>PNR</p>
                <p className="text-3xl font-black text-white font-mono bg-black/10 py-2 rounded-xl border border-black/10" style={{ letterSpacing: '0.2em' }}>{pnr}</p>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-[10px] text-green-200 mb-1 font-bold">اسم الراكب / Name</p>
                  <p className="font-bold text-sm text-white mb-3 line-clamp-1">{passengerName}</p>

                  <p className="text-[10px] text-green-200 mb-1 font-bold">رقم الجواز / Passport</p>
                  <p className="font-bold text-sm text-white font-mono" dir="ltr">{passportNumber || "غير محدد"}</p>
                </div>

                <div className="bg-white/5 rounded-lg p-3 border border-white/10 space-y-3">
                  {trips.departure && (
                     <div>
                       <p className="text-[10px] text-green-200 mb-1 font-bold">نقطة انطلاق الذهاب</p>
                       <p className="font-bold text-xs text-white mb-1 line-clamp-1">{trips.departure.startingPoint}</p>
                       <div className="flex items-center justify-between text-[10px]">
                          <span className="text-green-200">وقت الحضور:</span>
                          <span className="font-bold bg-white/20 px-1.5 py-0.5 rounded" dir="ltr">{trips.departure.boardTime}</span>
                       </div>
                     </div>
                  )}
                  {trips.return && (
                    <>
                     <div className="h-px w-full bg-white/20"></div>
                     <div>
                       <p className="text-[10px] text-green-200 mb-1 font-bold">نقطة انطلاق العودة</p>
                       <p className="font-bold text-xs text-white mb-1 line-clamp-1">{trips.return.startingPoint}</p>
                       <div className="flex items-center justify-between text-[10px]">
                          <span className="text-green-200">وقت الحضور:</span>
                          <span className="font-bold bg-white/20 px-1.5 py-0.5 rounded" dir="ltr">{trips.return.boardTime}</span>
                       </div>
                     </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center">
              <div className="flex items-center justify-center gap-4 mb-5 w-full">
                <div className="flex-1 text-right">
                  <p className="text-[10px] text-green-200 font-bold mb-1">Ticket Number</p>
                  <p className="text-sm text-white font-mono" dir="ltr" style={{ letterSpacing: '0.1em' }}>{ticketNumber || "TKT-000000"}</p>
                </div>
                <div className="bg-white p-2 rounded-lg shadow-sm shrink-0">
                  {ticketNumber ? <QRCode value={ticketNumber} size={90} level="M" /> : <QRCodePlaceholder className="w-20 h-20 text-black" />}
                </div>
              </div>
              <p className="text-[12px] text-green-100 text-center font-bold px-4 bg-black/10 py-2 rounded-full border border-black/5 w-full">
                نرافقك خطوة بخطوة نحو اعتمادك المهني
              </p>
            </div>
          </div>
        </div>

        {/* ==============================================
            SECTION 2: MAIN PANEL (Ticket Body)
            ============================================== */}
        <div className="flex-1 flex flex-col bg-white relative z-20 border-l-[3px] border-dashed border-gray-300" dir="rtl">
          
          <div className="absolute top-[-16px] left-[-16px] w-8 h-8 bg-[#f4f7f6] rounded-full border-b border-r border-gray-200 print:hidden z-10" style={{ transform: 'rotate(45deg)'}}></div>
          <div className="absolute bottom-[-16px] left-[-16px] w-8 h-8 bg-[#f4f7f6] rounded-full border-t border-r border-gray-200 print:hidden z-10" style={{ transform: 'rotate(-45deg)'}}></div>

          <div className="px-10 py-6 flex justify-between items-center border-b border-gray-100 bg-white">
            <div className="flex items-center">
              <img 
                src="/logo1.png" 
                alt="Logo" 
                className="h-[50px] w-auto object-contain bg-transparent" 
              />
            </div>
            <div className="text-left">
              <h2 className="text-3xl font-black text-[#074388]">تذكرة سفر</h2>
              <p className="text-sm font-bold text-gray-500 mt-1">تذكرة نقل بري</p>
              <p className="text-[10px] text-gray-400 uppercase font-bold mt-1" dir="ltr" style={{ letterSpacing: '0.2em' }}>LAND TRANSPORT TICKET</p>
            </div>
          </div>

          <div className="px-10 py-6">
            <div className="flex justify-between items-center bg-[#f8faf9] rounded-xl p-5 border border-gray-100 print:bg-[#f8faf9]">
              <div className="flex-1 border-l border-gray-200 pl-4">
                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">اسم الراكب / Passenger Name</p>
                <p className="font-bold text-lg text-gray-900">{passengerName}</p>
              </div>
              <div className="flex-1 border-l border-gray-200 px-4">
                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">رقم الجواز / Passport No.</p>
                <p className="font-bold text-base text-gray-800 font-mono" dir="ltr">{passportNumber || "غير محدد"}</p>
              </div>
              <div className="flex-1 pr-4">
                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">الوكيل / Agent</p>
                <p className="font-bold text-base text-gray-700">{agent}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 px-10 pb-8 space-y-6">
            
            {trips.departure && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 relative overflow-hidden group hover:border-[#074388]/30 transition-colors">
              <div className="absolute top-0 right-0 w-full h-1 bg-[#074388]"></div>
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <span className="bg-[#074388]/10 text-[#074388] px-3 py-1 rounded-md text-xs font-black print:bg-[#074388]/10 print:text-[#074388]">
                    {trips.departure.type}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold" style={{ letterSpacing: '0.1em' }}>{trips.departure.typeEn}</span>
                </div>
                
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">التاريخ / Date</p>
                    <p className="font-bold text-sm text-gray-800 font-mono" dir="ltr">{trips.departure.dateInfo.date} <span className="text-xs text-gray-500 font-sans ml-1">({trips.departure.dateInfo.day})</span></p>
                  </div>
                  <div className="border-r border-gray-200 pr-5">
                    <p className="text-[10px] text-gray-400 mb-0.5">نقطة الانطلاق / Starting Point</p>
                    <p className="font-bold text-sm text-[#074388]">{trips.departure.startingPoint}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between w-full">
                <div className="w-[180px]">
                  <p className="text-[10px] text-gray-400 uppercase mb-1">من / From</p>
                  <p className="text-4xl font-black text-[#074388] whitespace-nowrap">{trips.departure.from}</p>
                  <div className="mt-2 flex items-baseline gap-1" dir="ltr">
                    <span className="text-3xl font-black text-gray-900 font-mono">{trips.departure.timeDeparture}</span>
                    <span className="text-sm font-bold text-gray-500">{trips.departure.timeDepartureAmPm}</span>
                  </div>
                </div>
                
                <RouteVisual duration={trips.departure.duration} isReturn={false} />

                <div className="w-[180px] text-left">
                  <p className="text-[10px] text-gray-400 uppercase mb-1">إلى / To</p>
                  <p className="text-4xl font-black text-[#074388] whitespace-nowrap">{trips.departure.to}</p>
                  <div className="mt-2 flex items-baseline gap-1 justify-end" dir="ltr">
                    <span className="text-3xl font-black text-gray-900 font-mono">{trips.departure.timeArrival}</span>
                    <span className="text-sm font-bold text-gray-500">{trips.departure.timeArrivalAmPm}</span>
                  </div>
                </div>
              </div>
            </div>
            )}

            {trips.return && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 relative overflow-hidden group hover:border-[#578e36]/30 transition-colors">
              <div className="absolute top-0 right-0 w-full h-1 bg-[#578e36]"></div>
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <span className="bg-[#578e36]/10 text-[#578e36] px-3 py-1 rounded-md text-xs font-black print:bg-[#578e36]/10 print:text-[#578e36]">
                    {trips.return.type}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold" style={{ letterSpacing: '0.1em' }}>{trips.return.typeEn}</span>
                </div>
                
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">التاريخ / Date</p>
                    <p className="font-bold text-sm text-gray-800 font-mono" dir="ltr">{trips.return.dateInfo.date} <span className="text-xs text-gray-500 font-sans ml-1">({trips.return.dateInfo.day})</span></p>
                  </div>
                  <div className="border-r border-gray-200 pr-5">
                    <p className="text-[10px] text-gray-400 mb-0.5">نقطة الانطلاق / Starting Point</p>
                    <p className="font-bold text-sm text-[#578e36]">{trips.return.startingPoint}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between w-full">
                <div className="w-[180px]">
                  <p className="text-[10px] text-gray-400 uppercase mb-1">من / From</p>
                  <p className="text-4xl font-black text-gray-800 whitespace-nowrap">{trips.return.from}</p>
                  <div className="mt-2 flex items-baseline gap-1" dir="ltr">
                    <span className="text-3xl font-black text-gray-900 font-mono">{trips.return.timeDeparture}</span>
                    <span className="text-sm font-bold text-gray-500">{trips.return.timeDepartureAmPm}</span>
                  </div>
                </div>
                
                <RouteVisual duration={trips.return.duration} isReturn={true} />

                <div className="w-[180px] text-left">
                  <p className="text-[10px] text-gray-400 uppercase mb-1">إلى / To</p>
                  <p className="text-4xl font-black text-gray-800 whitespace-nowrap">{trips.return.to}</p>
                  <div className="mt-2 flex items-baseline gap-1 justify-end" dir="ltr">
                    <span className="text-3xl font-black text-gray-900 font-mono">{trips.return.timeArrival}</span>
                    <span className="text-sm font-bold text-gray-500">{trips.return.timeArrivalAmPm}</span>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>

          <div className="bg-[#f8faf9] px-10 py-5 border-t border-gray-100 z-10 print:bg-[#f8faf9]">
            <h4 className="text-[12px] font-bold text-gray-700 mb-3" dir="rtl">شروط وأحكام السفر / Conditions of Carriage</h4>
            <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-right" dir="rtl">
              {conditions.map((cond, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#074388] rounded-full mt-1.5 shrink-0 print:bg-[#074388]"></div>
                  <p className="text-[11px] text-gray-500 leading-relaxed m-0">{cond}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
  );
});

TransportTicketDesign.displayName = "TransportTicketDesign";
export default TransportTicketDesign;
