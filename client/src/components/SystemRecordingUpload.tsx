import axios from 'axios';
import React, { useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import baseUrl from '../util/baseUrl';

// --- Type Definitions ---
export interface RecordingFile {
  id: string; // Unique ID for each selected file
  name: string; // File name (e.g., "welcome.wav")
  originalFile: File; // The actual File object to be uploaded
}

export interface RecordingFormData {
  name: string;
  description: string;
  selectedFiles: RecordingFile[]; // Array of files chosen for this recording entry
}

interface DragItem {
  id: string;
  index: number;
}

// --- DraggableFile Component ---
interface DraggableFileProps {
  file: RecordingFile;
  index: number;
  moveFile: (dragIndex: number, hoverIndex: number) => void;
  onRemove: (id: string) => void;
}

const ItemTypes = {
  FILE: 'file',
};

const DraggableFile: React.FC<DraggableFileProps> = ({ file, index, moveFile, onRemove }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: string | symbol | null }>({
    accept: ItemTypes.FILE,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveFile(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.FILE,
    item: () => {
      return { id: file.id, index: index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.5 : 1;
  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity }}
      className="flex items-center p-3 bg-white rounded-md border border-gray-200 shadow-sm mb-2 cursor-grab"
      data-handler-id={handlerId}
    >
      <span className="flex-1 text-indigo-700 font-medium">{file.name}</span>
      <button
        type="button"
        onClick={() => onRemove(file.id)}
        className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
      >
        Remove
      </button>
    </div>
  );
};


// --- SystemRecordings Component ---
const SystemRecordings: React.FC = () => {
  const [formData, setFormData] = useState<RecordingFormData>({
    name: '',
    description: '',
    selectedFiles: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (value.trim()) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // ----- THIS IS THE CORRECTED FUNCTION -----
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray: RecordingFile[] = Array.from(e.target.files).map((file) => ({
        id: `${file.name}-${file.lastModified}`, // A more stable unique ID
        name: file.name,
        originalFile: file, // Store the actual File object
      }));

      setFormData((prev) => ({
        ...prev,
        selectedFiles: [...prev.selectedFiles, ...filesArray],
      }));

      // Clear the file input after selecting files
      e.target.value = '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Recording name is required';
    }
    if (formData.selectedFiles.length === 0) {
      newErrors.files = 'At least one sound file must be selected';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const moveFile = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      setFormData((prev) => {
        const newFiles = [...prev.selectedFiles];
        const [draggedFile] = newFiles.splice(dragIndex, 1);
        newFiles.splice(hoverIndex, 0, draggedFile);
        return { ...prev, selectedFiles: newFiles };
      });
    },
    []
  );

  const handleRemoveSelectedFile = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedFiles: prev.selectedFiles.filter((file) => file.id !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      console.log("Form validation failed.", errors);
      return;
    }

    try {
      console.log("--- Starting File Upload ---");
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);

      // Now this will work correctly
      formData.selectedFiles.forEach((file) => {
        formDataToSend.append('audioFiles', file.originalFile, file.name);
      });

      const response = await axios.post(`${baseUrl}/api/audio/upload`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log("--- Upload Successful ---", response.data);
      alert("Files uploaded successfully!");

      setFormData({ name: '', description: '', selectedFiles: [] });
      setErrors({});

    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload files. Please try again.");
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 max-w-4xl mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center text-indigo-800">New System Recording</h1>

        <div className="bg-white shadow-md rounded-lg p-6 transform hover:scale-105 transition-transform">
          <h2 className="text-xl font-semibold mb-4 text-indigo-700">Create New Recording Sequence</h2>
          <form onSubmit={handleSubmit} className="mb-6 space-y-4">
            {/* Recording Name */}
            <div className="relative group">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Recording Name <span className="text-xs text-gray-500">(Required)</span>
              </label>

              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md p-2 ${errors.name ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-indigo-500 focus:border-indigo-500`}
                placeholder="e.g., Main IVR Greeting"
                aria-label="Recording sequence name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Description */}
            <div className="relative group">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Plays welcome message, then menu options."
                rows={3}
                aria-label="Recording description"
              />
            </div>

            {/* File Selection Input */}
            <div className="relative group">
              <label htmlFor="files" className="block text-sm font-medium text-gray-700">
                Select Sound Files <span className="text-xs text-gray-500">(Multiple allowed)</span>
              </label>

              <input
                type="file"
                id="files"
                name="files"
                multiple
                accept="audio/*"
                onChange={handleFileChange}
                className={`mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0 file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100
                  ${errors.files ? 'border-red-500 border rounded-md' : ''}`}
                aria-label="Select sound files"
              />
              {errors.files && <p className="text-red-500 text-sm mt-1">{errors.files}</p>}
            </div>

            {/* Display and Arrange Selected Files */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Arrangement of Selected Sounds:</h3>
              <p className="text-sm text-gray-600 mb-3">Drag and drop the files below to arrange their playback order.</p>
              <div className="min-h-[100px] border border-dashed border-gray-300 rounded-md p-4 bg-gray-50">
                {formData.selectedFiles.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No sound files selected yet. Use the "Select Sound Files" input above.</p>
                ) : (
                  formData.selectedFiles.map((file, index) => (
                    <DraggableFile
                      key={file.id}
                      file={file}
                      index={index}
                      moveFile={moveFile}
                      onRemove={handleRemoveSelectedFile}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 text-white rounded-md text-lg font-semibold hover:bg-indigo-700 transition-colors"
                aria-label="Create system recording"
              >
                Create Recording Sequence
              </button>
            </div>
          </form>
        </div>
      </div>
    </DndProvider>
  );
};

export default SystemRecordings;