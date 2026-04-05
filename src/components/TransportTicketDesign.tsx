import React, { forwardRef } from 'react';
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';
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
  m -= 60; // 1 ساعة
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

// Route Visual Component
const RouteVisual = ({ stops, isReturn, totalDuration }: { stops: any[], isReturn: boolean, totalDuration: number }) => (
  <div className="flex-1 flex flex-col justify-center mx-8 relative w-full pt-4 min-w-[250px]">
    <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] text-[#074388] font-bold tracking-wide bg-blue-50 px-3 z-10 rounded-full border border-blue-100 shadow-sm whitespace-nowrap">
      {totalDuration > 0 ? `إجمالي وقت الرحلة المجدول: ${totalDuration} دقيقة` : 'رحلة تنقل بري'}
    </span>
    
    <div className="relative w-full h-1 mt-6">
      <div className={`absolute top-1/2 left-0 w-full border-t-[3px] border-dashed -translate-y-1/2 ${isReturn ? 'border-[#578e36]/40' : 'border-[#074388]/40'}`}></div>
      
      {stops.map((stop, index) => {
          const percent = stops.length === 1 ? 50 : (index / (stops.length - 1)) * 100;
          const isEndpoint = index === 0 || index === stops.length - 1;
          
          return (
              <div key={index} className="absolute top-1/2 flex flex-col items-center z-10" style={{ [isReturn ? 'left' : 'right']: `${percent}%`, transform: `translate(${isReturn ? '-50%' : '50%'}, -50%)` }}>
                 <div className={`rounded-full bg-white z-10 ${isEndpoint ? `w-4 h-4 border-[4px] ${isReturn ? 'border-[#578e36]' : 'border-[#074388]'}` : `w-3 h-3 border-[2px] ${isReturn ? 'border-[#578e36]/70' : 'border-[#074388]/70'}`}`}></div>
                 <span className="absolute top-4 text-[11px] font-bold text-gray-700 w-max whitespace-nowrap bg-white/90 px-1.5 rounded shadow-sm border border-gray-100">{stop.name}</span>
              </div>
          )
      })}

      {stops.map((stop, index) => {
          if (index === stops.length - 1) return null;
          const nextStop = stops[index + 1];
          const percent1 = (index / (stops.length - 1)) * 100;
          const percent2 = ((index + 1) / (stops.length - 1)) * 100;
          const midPercent = (percent1 + percent2) / 2;
          
          return (
                <span key={`int-${index}`} className="absolute -bottom-7 text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 whitespace-nowrap z-0 shadow-sm" style={{ [isReturn ? 'left' : 'right']: `${midPercent}%`, transform: `translateX(${isReturn ? '-50%' : '50%'}) translateY(10px)` }}>
                  {nextStop.minutesFromPrevious > 0 ? `${nextStop.minutesFromPrevious} دقيقة` : 'محطة مرور'}
                </span>
          )
      })}
      
      <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-white px-2 z-20">
        <BusIcon className={`w-7 h-7 drop-shadow-sm transition-transform ${isReturn ? 'text-[#578e36] -scale-x-100' : 'text-[#074388] -scale-x-100'}`} />
      </div>
    </div>
  </div>
);

const TransportTicketDesign = forwardRef<HTMLDivElement, TransportTicketDesignProps>(({ ticket, applicant, passengerName, passportNumber, ticketNumber, isRoundTrip }, ref) => {
  const agent = ticket?.agentName || "أوفرسيز للسفريات";
  const pnr = applicant?.applicantCode || "UNKNOWN";

  const parseTripData = (tripDetails: any, fromStr: string, toStr: string, depTimeStr: string, arrTimeStr: string) => {
      let stops: { name: string, minutesFromPrevious: number, totalMins: number }[] = [];
      stops.push({ name: fromStr, minutesFromPrevious: 0, totalMins: 0 });
      
      if (tripDetails?.stops?.length > 0) {
          tripDetails.stops.forEach((s: any) => {
              const destName = s.destination?.name || '';
              if (destName && destName !== fromStr && destName !== toStr) {
                  const minsFromStart = s.routeStop?.minutesFromStart || 0;
                  const prevMins = stops[stops.length - 1].totalMins;
                  const minDiff = Math.max(0, minsFromStart - prevMins);
                  stops.push({ name: destName, minutesFromPrevious: minDiff, totalMins: minsFromStart });
              }
          });
      }
      
      let totalComputedDuration = 0;
      if (depTimeStr && arrTimeStr) {
          const [dh, dm] = depTimeStr.split(':').map(Number);
          const [ah, am] = arrTimeStr.split(':').map(Number);
          let diff = (ah * 60 + am) - (dh * 60 + dm);
          if (diff < 0) diff += 24 * 60; // Next day
          totalComputedDuration = diff;
      }
  
      const prevMins = stops[stops.length - 1].totalMins;
      const finalDiff = totalComputedDuration > prevMins ? totalComputedDuration - prevMins : 0;
      
      stops.push({ name: toStr, minutesFromPrevious: finalDiff > 0 ? finalDiff : 0, totalMins: totalComputedDuration });
      
      return { displayStops: stops, totalDuration: totalComputedDuration };
  };

  const trips = {
    departure: ticket?.trip ? {
      type: 'رحلة الذهاب',
      typeEn: 'DEPARTURE',
      from: ticket.departureLocation,
      to: ticket.arrivalLocation,
      dateInfo: formatDate(ticket.departureDate),
      time: parseTime(ticket.trip.departureTime),
      arrTime: parseTime(ticket.trip.arrivalTime),
      tripNo: ticket.busNumber || ticket.trip.tripNumber || "غير محدد",
      boardTime: getBoardTime(ticket.trip.departureTime),
      startingPoint: ticket.boardingPoint || ticket.departureLocation,
      parsedRoute: parseTripData(ticket.trip, ticket.departureLocation, ticket.arrivalLocation, ticket.trip.departureTime, ticket.trip.arrivalTime)
    } : null,

    return: isRoundTrip && ticket?.returnTrip ? {
      type: 'رحلة العودة',
      typeEn: 'RETURN',
      from: ticket.arrivalLocation, // Opposite
      to: ticket.departureLocation,
      dateInfo: formatDate(ticket.returnTrip.date),
      time: parseTime(ticket.returnTrip.departureTime),
      arrTime: parseTime(ticket.returnTrip.arrivalTime),
      tripNo: ticket.returnBusNumber || ticket.returnTrip.tripNumber || "غير محدد",
      boardTime: getBoardTime(ticket.returnTrip.departureTime),
      startingPoint: "المحطة المركزية", // Can be dynamic if returning boardingPoint is mapped
      parsedRoute: parseTripData(ticket.returnTrip, ticket.arrivalLocation, ticket.departureLocation, ticket.returnTrip.departureTime, ticket.returnTrip.arrivalTime)
    } : null,
  };

  const conditions = [
    'يجب التواجد في محطة الانطلاق قبل موعد الرحلة بساعة كاملة.',
    'التذكرة صالحة للرحلة والتاريخ المحددين فقط وغير قابلة للتحويل.',
    'يسمح بوزن أمتعة أقصاه 25 كجم للراكب الواحد.',
    'يمنع نقل المواد القابلة للاشتعال أو الخطرة للمحافظة على السلامة.',
    'الشركة غير مسؤولة عن فقدان الأمتعة الشخصية داخل المقصورة.',
    'يجب التأكد من اصطحاب اثبات هوية ساري المفعول (جواز سفر أو بطاقة).',
  ];

  return (
    <div ref={ref} className="ticket-page w-[1280px] bg-white flex flex-row shadow-[0_5px_20px_rgba(0,0,0,0.05)] overflow-hidden font-sans mx-auto mb-8 print:mb-0 print:shadow-none print:break-after-page" dir="ltr" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', borderRadius: '0', border: '1px solid #e2e8f0' }}>
        {/* ==============================================
            SECTION 1: LEFT STUB (Passenger Stub)
            ============================================== */}
        <div className="w-[320px] bg-[#578e36] text-white flex flex-col relative shrink-0 z-30" dir="rtl">
          <div className="h-14 bg-[#074388] w-full flex flex-col items-center justify-center shadow-md z-10 relative print:bg-[#074388]">
            <span className="text-sm font-black tracking-widest text-white">قسيمة المسافر</span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-blue-200 uppercase" dir="ltr">Passenger Stub</span>
          </div>

          <div className="p-6 flex flex-col flex-1 h-full relative">
            <div className="text-center mb-5">
              <p className="text-[10px] text-green-100 font-medium leading-relaxed bg-black/5 py-1.5 px-3 rounded-full border border-black/5">
                نرافقك خطوة بخطوة نحو اعتمادك المهني
              </p>
            </div>

            <div className="flex justify-center mb-5 mt-2">
              <div className="bg-white p-3 rounded-xl shadow-lg border border-black/10 shrink-0">
                <QRCode value={ticketNumber} size={110} level="M" />
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-[10px] text-green-200 uppercase tracking-widest mb-1 font-bold">PNR</p>
              <p className="text-4xl font-black text-white font-mono tracking-widest bg-black/10 py-3 rounded-xl shadow-inner border border-black/10">
                {pnr}
              </p>
            </div>

            <div className="space-y-4 flex-1">
              <div className="bg-black/10 rounded-lg p-3 border border-white/10">
                <p className="text-[10px] text-green-200 mb-1 font-bold">اسم الراكب / Name</p>
                <p className="font-bold text-sm text-white mb-3 line-clamp-1">{passengerName}</p>

                <p className="text-[10px] text-green-200 mb-1 font-bold">رقم الجواز / Passport</p>
                <p className="font-bold text-sm text-white font-mono mb-3" dir="ltr">{passportNumber || "غير محدد"}</p>

                <p className="text-[10px] text-green-200 mb-1 font-bold">رقم التذكرة / Ticket No</p>
                <p className="font-bold text-sm text-white font-mono tracking-wider" dir="ltr">{ticketNumber}</p>
              </div>

              <div className="bg-black/10 rounded-lg p-3 border border-white/10 space-y-3">
                {trips.departure && (
                   <div>
                     <p className="text-[10px] text-green-200 mb-1 font-bold">نقطة انطلاق الذهاب</p>
                     <p className="font-bold text-xs text-white mb-1 line-clamp-2">{trips.departure.startingPoint}</p>
                     <div className="flex items-center justify-between text-[10px]">
                        <span className="text-green-200">وقت الحضور:</span>
                        <span className="font-bold bg-black/20 px-1.5 py-0.5 rounded" dir="ltr">{trips.departure.boardTime}</span>
                     </div>
                   </div>
                )}
                {trips.return && (
                  <>
                   <div className="h-px w-full bg-white/20"></div>
                   <div>
                     <p className="text-[10px] text-green-200 mb-1 font-bold">نقطة انطلاق العودة</p>
                     <p className="font-bold text-xs text-white mb-1 line-clamp-2">{trips.return.startingPoint}</p>
                     <div className="flex items-center justify-between text-[10px]">
                        <span className="text-green-200">وقت الحضور:</span>
                        <span className="font-bold bg-black/20 px-1.5 py-0.5 rounded" dir="ltr">{trips.return.boardTime}</span>
                     </div>
                   </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center">
              <p className="text-[10px] text-green-100 mb-2 text-center opacity-90 font-medium">
                يرجى إبراز الهوية عند الصعود
              </p>
              <div className="bg-white w-full rounded-md p-1 flex justify-center shadow-sm overflow-hidden mix-blend-screen">
                 <Barcode value={ticketNumber} height={30} displayValue={false} margin={0} width={1.8} background="transparent" />
              </div>
            </div>
          </div>
        </div>

        {/* ==============================================
            SECTION 2: MAIN PANEL (Ticket Body)
            ============================================== */}
        <div className="flex-1 flex flex-col bg-white relative z-20 border-l-[3px] border-dashed border-[#074388]/60" dir="rtl">
          
          {/* Top Cutout */}
          <div className="absolute top-[-16px] left-[-16px] w-8 h-8 bg-white rounded-full border-b border-r border-gray-200 print:hidden z-10 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)]" style={{ transform: 'rotate(45deg)'}}></div>
          {/* Bottom Cutout */}
          <div className="absolute bottom-[-16px] left-[-16px] w-8 h-8 bg-white rounded-full border-t border-r border-gray-200 print:hidden z-10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]" style={{ transform: 'rotate(-45deg)'}}></div>

          {/* Header Section */}
          <div className="px-10 py-4 flex justify-between items-center border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-white h-[120px] print:bg-white print:from-white print:to-white">
            <div className="text-right">
              <h2 className="text-5xl font-black text-[#074388] leading-none mb-2 print:text-[#074388]">تذكرة سفر</h2>
              <p className="text-base font-bold text-gray-500">تذكرة نقل بري</p>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mt-1" dir="ltr">LAND TRANSPORT TICKET</p>
            </div>
            <div className="flex items-center -mr-4">
              <img 
                src="/logo1.png" 
                alt="Logo" 
                className="h-full max-h-[160px] w-auto object-contain mix-blend-multiply scale-[1.3] origin-left" 
              />
            </div>
          </div>

          {/* Passenger Info Bar */}
          <div className="px-10 py-5">
            <div className="flex justify-between items-center bg-[#f8faf9] rounded-xl p-5 border border-gray-100 shadow-sm print:bg-[#f8faf9]">
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

          {/* Trips Area */}
          <div className="flex-1 px-10 pb-6 space-y-6">
            
            {/* Departure Card */}
            {trips.departure && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-1 bg-[#074388] print:bg-[#074388]"></div>
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <span className="bg-[#074388]/10 text-[#074388] px-3 py-1 rounded-md text-sm font-black print:bg-[#074388]/10">
                    {trips.departure.type}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold tracking-widest">{trips.departure.typeEn}</span>
                </div>
                
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">التاريخ / Date</p>
                    <p className="font-bold text-sm text-gray-800 font-mono" dir="ltr">{trips.departure.dateInfo.date} <span className="text-xs text-gray-500 font-sans ml-1">({trips.departure.dateInfo.day})</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">الرحلة / Trip</p>
                    <p className="font-bold text-sm text-white bg-[#074388] px-2 py-0.5 rounded font-mono print:bg-[#074388] print:text-white" dir="ltr">{trips.departure.tripNo}</p>
                  </div>
                  <div className="border-r border-gray-200 pr-5">
                    <p className="text-[10px] text-gray-400 mb-0.5">نقطة الانطلاق / Starting Point</p>
                    <p className="font-bold text-sm text-[#074388] print:text-[#074388]">{trips.departure.startingPoint}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between w-full">
                {/* From */}
                <div className="w-[180px]">
                  <p className="text-[10px] text-gray-400 uppercase mb-1">من / From</p>
                  <p className="text-5xl font-black text-[#074388] tracking-tight print:text-[#074388]">{trips.departure.from}</p>
                  <div className="mt-2 flex items-baseline gap-1" dir="ltr">
                    <span className="text-3xl font-black text-gray-900 font-mono">{trips.departure.time.time}</span>
                    <span className="text-sm font-bold text-gray-500">{trips.departure.time.ampm}</span>
                  </div>
                </div>
                
                <RouteVisual stops={trips.departure.parsedRoute.displayStops} totalDuration={trips.departure.parsedRoute.totalDuration} isReturn={false} />

                {/* To */}
                <div className="w-[180px] text-left">
                  <p className="text-[10px] text-gray-400 uppercase mb-1">إلى / To</p>
                  <p className="text-5xl font-black text-[#074388] tracking-tight print:text-[#074388]">{trips.departure.to}</p>
                  <div className="mt-2 flex items-baseline gap-1 justify-end" dir="ltr">
                    <span className="text-3xl font-black text-gray-900 font-mono">{trips.departure.arrTime.time}</span>
                    <span className="text-sm font-bold text-gray-500">{trips.departure.arrTime.ampm}</span>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Return Card */}
            {trips.return && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-1 bg-[#578e36] print:bg-[#578e36]"></div>
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <span className="bg-[#578e36]/10 text-[#578e36] px-3 py-1 rounded-md text-sm font-black print:bg-[#578e36]/10">
                    {trips.return.type}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold tracking-widest">{trips.return.typeEn}</span>
                </div>
                
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">التاريخ / Date</p>
                    <p className="font-bold text-sm text-gray-800 font-mono" dir="ltr">{trips.return.dateInfo.date} <span className="text-xs text-gray-500 font-sans ml-1">({trips.return.dateInfo.day})</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">الرحلة / Trip</p>
                    <p className="font-bold text-sm text-white bg-[#578e36] px-2 py-0.5 rounded font-mono print:bg-[#578e36] print:text-white" dir="ltr">{trips.return.tripNo}</p>
                  </div>
                  <div className="border-r border-gray-200 pr-5">
                    <p className="text-[10px] text-gray-400 mb-0.5">نقطة الانطلاق / Starting Point</p>
                    <p className="font-bold text-sm text-[#578e36] print:text-[#578e36]">{trips.return.startingPoint}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between w-full">
                <div className="w-[180px]">
                  <p className="text-[10px] text-gray-400 uppercase mb-1">من / From</p>
                  <p className="text-5xl font-black text-gray-800 tracking-tight">{trips.return.from}</p>
                  <div className="mt-2 flex items-baseline gap-1" dir="ltr">
                    <span className="text-3xl font-black text-gray-900 font-mono">{trips.return.time.time}</span>
                    <span className="text-sm font-bold text-gray-500">{trips.return.time.ampm}</span>
                  </div>
                </div>
                
                <RouteVisual stops={trips.return.parsedRoute.displayStops} totalDuration={trips.return.parsedRoute.totalDuration} isReturn={true} />

                <div className="w-[180px] text-left">
                  <p className="text-[10px] text-gray-400 uppercase mb-1">إلى / To</p>
                  <p className="text-5xl font-black text-gray-800 tracking-tight">{trips.return.to}</p>
                  <div className="mt-2 flex items-baseline gap-1 justify-end" dir="ltr">
                    <span className="text-3xl font-black text-gray-900 font-mono">{trips.return.arrTime.time}</span>
                    <span className="text-sm font-bold text-gray-500">{trips.return.arrTime.ampm}</span>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Conditions Footer */}
          <div className="bg-[#f8faf9] px-10 py-5 border-t border-gray-100 z-10 print:bg-[#f8faf9]">
            <h4 className="text-[11px] font-bold text-gray-700 mb-3">شروط وأحكام السفر / Conditions of Carriage</h4>
            <div className="grid grid-cols-3 gap-x-5 gap-y-1">
              {conditions.map((cond, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-[#074388] rounded-full mt-1.5 shrink-0 print:bg-[#074388]"></div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{cond}</p>
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
