import React from 'react';

const WhotShapePopup = ({ selectShape, closePopup }) => {
  const shapes = ['●', '▲', '✚', '■', '★'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] fade-in">
      <div className="bg-gray-900 p-4 sm:p-8 border-2 border-[#80142C] text-center scale-in relative max-w-[90vw] max-h-[90vh]">
        <button
          onClick={closePopup}
          className="absolute top-2 right-2 text-white hover:text-gray-300 text-xl sm:text-2xl font-bold cursor-pointer z-10"
        >
          ×
        </button>
        <div className="bg-[#80142C] p-3 sm:p-6">
          <h2 className="text-lg sm:text-2xl font-bold text-white mb-3 sm:mb-6">Choose WHOT Shape</h2>
          <div className="flex gap-2 sm:gap-4 justify-center">
            {shapes.map(shape => (
              <button
                key={shape}
                onClick={() => selectShape(shape)}
                className="w-12 h-14 sm:w-16 sm:h-20 bg-[#80142C] smooth-transition flex items-center justify-center text-white text-2xl sm:text-3xl font-bold cursor-pointer hover:bg-[#4a0c1a]"
              >
                {shape}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhotShapePopup;