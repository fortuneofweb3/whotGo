import React from 'react';

const SettingsPopup = ({ musicVolume, soundVolume, setMusicVolume, setSoundVolume, closePopup }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] p-4 fade-in" onClick={closePopup}>
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto scale-in" onClick={e => e.stopPropagation()}>
        <div className="bg-gray-900">
                                                                                           <div className="p-8 bg-[#80142C]">
              <div className="text-center mb-10">
                                   <div className="flex justify-between items-center mb-4">
                     <div></div>
                     <span onClick={closePopup} className="text-white text-2xl cursor-pointer">×</span>
                   </div>
              <h1 className="text-4xl font-bold mb-2 text-white">
                Settings
              </h1>
              <div className="text-gray-200 text-lg tracking-wider">
                Customize Your Experience
              </div>
            </div>
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Audio Settings */}
              <div className="bg-gray-900 p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <span className="w-8 h-8 bg-gray-700 flex items-center justify-center mr-3">
                    🔊
                  </span>
                  Audio Settings
                </h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">Music Volume</span>
                    <label className="slider">
                      <input
                        type="range"
                        className="level"
                        min="0"
                        max="100"
                        value={musicVolume}
                        onChange={e => setMusicVolume(Number(e.target.value))}
                      />
                      <svg className="volume" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.36 19.36a1 1 0 0 1-.705-1.71C19.167 16.148 20 14.142 20 12s-.833-4.148-2.345-5.65a1 1 0 1 1 1.41-1.419C20.958 6.812 22 9.322 22 12s-1.042 5.188-2.935 7.069a.997.997 0 0 1-.705.291z" />
                        <path d="M15.53 16.53a.999.999 0 0 1-.703-1.711C15.572 14.082 16 13.054 16 12s-.428-2.082-1.173-2.819a1 1 0 1 1 1.406-1.422A6 6 0 0 1 18 12a6 6 0 0 1-1.767 4.241.996.996 0 0 1-.703.289zM12 22a1 1 0 0 1-.707-.293L6.586 17H4c-1.103 0-2-.897-2-2V9c0-1.103.897-2 2-2h2.586l4.707-4.707A.998.998 0 0 1 13 3v18a1 1 0 0 1-1 1z" />
                      </svg>
                    </label>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">Sound Effects</span>
                    <label className="slider">
                      <input
                        type="range"
                        className="level"
                        min="0"
                        max="100"
                        value={soundVolume}
                        onChange={e => setSoundVolume(Number(e.target.value))}
                      />
                      <svg className="volume" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.36 19.36a1 1 0 0 1-.705-1.71C19.167 16.148 20 14.142 20 12s-.833-4.148-2.345-5.65a1 1 0 1 1 1.41-1.419C20.958 6.812 22 9.322 22 12s-1.042 5.188-2.935 7.069a.997.997 0 0 1-.705.291z" />
                        <path d="M15.53 16.53a.999.999 0 0 1-.703-1.711C15.572 14.082 16 13.054 16 12s-.428-2.082-1.173-2.819a1 1 0 1 1 1.406-1.422A6 6 0 0 1 18 12a6 6 0 0 1-1.767 4.241.996.996 0 0 1-.703.289zM12 22a1 1 0 0 1-.707-.293L6.586 17H4c-1.103 0-2-.897-2-2V9c0-1.103.897-2 2-2h2.586l4.707-4.707A.998.998 0 0 1 13 3v18a1 1 0 0 1-1 1z" />
                      </svg>
                    </label>
                  </div>
                </div>
              </div>

              {/* Account Settings */}
              <div className="bg-gray-900 p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <span className="w-8 h-8 bg-gray-700 flex items-center justify-center mr-3">
                    👤
                  </span>
                  Account Settings
                </h3>
                <div className="space-y-4">
                  <button className="w-full p-3 bg-gray-800 text-white hover:bg-gray-700 transition-colors">
                    Clear Game History
                  </button>
                  <button className="w-full p-3 bg-[#80142C] text-white hover:bg-[#4a0c1a] transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-gray-200 italic">
                Customize your gaming experience to your preferences.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPopup;