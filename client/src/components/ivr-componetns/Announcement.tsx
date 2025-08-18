// import { useState, useEffect } from 'react';
// import { FiTrash2, FiPlay, FiPause } from 'react-icons/fi';

// interface SystemRecording {
//   id: string;
//   name: string;
//   description: string;
// }

// interface AnnouncementProps {
//   entry: {
//     id: number;
//     digit: string;
//     value: string;
//   };
//   onUpdate: (id: number, field: string, value: string) => void;
//   onRemove: (id: number) => void;
//   error?: string;
//   systemRecordings: SystemRecording[];
// }

// const Announcement: React.FC<AnnouncementProps> = ({
//   entry,
//   onUpdate,
//   onRemove,
//   error,
//   systemRecordings
// }) => {
//   const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   // Clean up audio when component unmounts
//   useEffect(() => {
//     return () => {
//       if (audio) {
//         audio.pause();
//         URL.revokeObjectURL(audio.src);
//       }
//     };
//   }, [audio]);

//   const handlePlayPause = async (recordingName: string) => {
//     try {
//       setIsLoading(true);
//       if (audio && isPlaying) {
//         audio.pause();
//         setIsPlaying(false);
//         return;
//       }

//       // Stop any currently playing audio
//       if (audio) {
//         audio.pause();
//         URL.revokeObjectURL(audio.src);
//       }

//       // In a real app, you would fetch the audio file from your server
//       // const response = await fetch(`/api/audio/system/${recordingName}`);
//       // const blob = await response.blob();
//       // const audioUrl = URL.createObjectURL(blob);
      
//       // For demo purposes, we'll just use a placeholder
//       const audioUrl = `/sounds/en/custom/${recordingName}.wav`;
      
//       const newAudio = new Audio(audioUrl);
//       newAudio.onended = () => setIsPlaying(false);
//       setAudio(newAudio);
//       await newAudio.play();
//       setIsPlaying(true);
//     } catch (err) {
//       console.error('Error playing audio:', err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const selectedRecording = systemRecordings.find(rec => rec.id === entry.value);

//   return (
//     <div className="flex items-center gap-2 sm:gap-4 p-4 bg-white rounded-lg border border-gray-200">
//       <div className="flex-grow grid grid-cols-1 sm:grid-cols-3 gap-3">
//         {/* Digit Input */}
//         <div className="relative">
//           <input
//             type="text"
//             value={entry.digit}
//             onChange={(e) => {
//               const value = e.target.value;
//               if (/^[0-9]?$/.test(value)) {
//                 onUpdate(entry.id, 'digit', value);
//               }
//             }}
//             className={`w-full bg-gray-100 border-2 rounded-md p-2 text-gray-800 placeholder-gray-500 transition-colors ${
//               error
//                 ? 'border-red-500 focus:ring-red-400'
//                 : 'border-transparent focus:border-indigo-500 focus:ring-indigo-400'
//             } focus:ring-1 focus:bg-white`}
//             placeholder="Digit"
//             aria-label="Digit for entry"
//           />
//           {error && (
//             <p className="text-red-600 text-xs mt-1 px-1 absolute">{error}</p>
//           )}
//         </div>

//         {/* Type Display (Fixed to 'announcement') */}
//         <div className="flex items-center bg-gray-100 rounded-md p-2">
//           <span className="text-gray-800">Announcement</span>
//         </div>

//         {/* System Recording Selector */}
//         <div className="flex gap-2">
//           <select
//             value={entry.value}
//             onChange={(e) => onUpdate(entry.id, 'value', e.target.value)}
//             className="flex-1 bg-gray-100 border-2 border-transparent rounded-md p-2 text-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400 focus:bg-white transition-colors"
//             aria-label="Select system recording"
//           >
//             <option value="">Select Recording</option>
//             {systemRecordings.map((recording) => (
//               <option key={recording.id} value={recording.id}>
//                 {recording.name}
//               </option>
//             ))}
//           </select>
          
//           {selectedRecording && (
//             <button
//               type="button"
//               onClick={() => handlePlayPause(selectedRecording.id)}
//               className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50"
//               aria-label={isPlaying ? 'Pause' : 'Play'}
//               disabled={isLoading}
//             >
//               {isLoading ? (
//                 <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
//               ) : isPlaying ? (
//                 <FiPause size={20} />
//               ) : (
//               )}
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Delete Button */}
//       <button
//         type="button"
//         onClick={() => onRemove(entry.id)}
//         className="p-2 text-gray-500 rounded-md hover:bg-red-100 hover:text-red-600 transition-colors"
//         aria-label="Remove entry"
//       >
//         <FiTrash2 size={20} />
//       </button>
//     </div>
//   );
// };

// export default Announcement;