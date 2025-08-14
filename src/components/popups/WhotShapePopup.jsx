import React from 'react';

const WhotShapePopup = ({ selectShape, closePopup }) => {
  const shapes = ['●', '▲', '✚', '■', '★'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] fade-in">
      <div className="bg-gray-900 p-8 border-2 border-[#80142C] text-center scale-in">
        <div className="bg-[#80142C] p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Choose WHOT Shape</h2>
          <div className="flex gap-4 justify-center">
            {shapes.map(shape => (
              <button
                key={shape}
                onClick={() => selectShape(shape)}
                className="w-16 h-20 bg-[#80142C] smooth-transition flex items-center justify-center text-white text-3xl font-bold cursor-pointer hover:bg-[#4a0c1a]"
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