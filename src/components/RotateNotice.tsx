import React from "react";

const RotateNotice: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center z-50">
      <img src="/rotate.gif" alt="Vui lòng xoay ngang màn hình" className="w-32 h-32 mb-4" />
      <p className="text-lg">Vui lòng xoay ngang thiết bị của bạn</p>
    </div>
  );
};

export default RotateNotice;
