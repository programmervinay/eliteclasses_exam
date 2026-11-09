import React from 'react';

interface WatermarkProps {
  studentName: string;
  phone: string;
  examId: string;
}

export const Watermark: React.FC<WatermarkProps> = ({
  studentName,
  phone,
  examId,
}) => {
  // Mask phone number (e.g., 98****3210)
  const maskedPhone = phone && phone.length >= 10
    ? `${phone.slice(0, 2)}****${phone.slice(-4)}`
    : phone || 'Student';

  const shortExamId = examId ? examId.slice(0, 8) : 'EXAM';
  const watermarkText = `${studentName} • ${maskedPhone} • ID:${shortExamId}`;

  return (
    <div 
      className="pointer-events-none fixed inset-0 z-30 select-none overflow-hidden opacity-10 dark:opacity-5 transition-opacity w-full h-full max-w-[100vw] max-h-[100vh]"
      style={{ contain: 'strict' }}
      aria-hidden="true"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-10 sm:gap-16 p-4 sm:p-6 rotate-[-20deg] w-[120%] h-[120%] -ml-[10%] -mt-[10%]">
        {Array.from({ length: 24 }).map((_, idx) => (
          <div key={idx} className="text-center font-mono text-xs font-bold text-slate-800 dark:text-slate-100 tracking-wider break-all">
            {watermarkText}
          </div>
        ))}
      </div>
    </div>
  );
};
