import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiPlay, FiPause, FiTrash2, FiDownload, FiX, FiUpload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

interface AudioFile {
  _id: string;
  originalName: string;
  size: number;
  url: string;
  mimeType: string;
}

interface Recording {
  _id: string;
  name: string;
  description: string;
  audioFiles: AudioFile[];
  createdAt: string;
}

const SystemRecordingsList: React.FC = () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecordings();
    
    // Cleanup audio on component unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/api/audio/recordings`);
      
      if (response.data.success) {
        setRecordings(response.data.data);
      } else {
        setError('Failed to fetch recordings');
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err) 
        ? err.response?.data?.message || 'Error connecting to server'
        : 'Error connecting to server';
      setError(errorMessage);
      console.error('Error fetching recordings:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = async (url: string) => {
    console.log (url)
    console.log (url)
    console.log (url)
    console.log (url)
    try {
      // If the same audio is already playing, pause it
      if (audioRef.current && currentPlaying === url) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          await audioRef.current.play();
          setIsPlaying(true);
        }
        return;
      }

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Create new audio element
      const audio = new Audio(url);
      audioRef.current = audio;
      setCurrentPlaying(url);
      setIsPlaying(true);

      // Set up event listeners
      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
      };

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        setCurrentPlaying(null);
      };

      audio.onpause = () => {
        setIsPlaying(false);
      };

      audio.onplay = () => {
        setIsPlaying(true);
      };

      // Start playing
      await audio.play();

    } catch (err) {
      console.error('Playback error:', err);
      setError(`Failed to play audio: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsPlaying(false);
      setCurrentPlaying(null);
    }
  };

  // Format time (seconds to MM:SS)
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDeleteRecording = async (recordingId: string) => {
    if (window.confirm('Are you sure you want to delete this recording and all its audio files? This action cannot be undone.')) {
      try {
        await axios.delete(`${baseUrl}/api/audio/recordings/${recordingId}`);
        setRecordings(recordings.filter(recording => recording._id !== recordingId));
      } catch (err) {
        const errorMessage = axios.isAxiosError(err) 
          ? err.response?.data?.message || 'Error deleting recording'
          : 'Error deleting recording';
        setError(errorMessage);
        console.error('Error deleting recording:', err);
      }
    }
  };

  const handleDeleteAudioFile = async (recordingId: string, fileId: string, fileName: string) => {
    if (window.confirm('Are you sure you want to delete this audio file? This action cannot be undone.')) {
      try {
        await axios.delete(`${baseUrl}/api/audio/recordings/${recordingId}/files/${fileId}`, {
          data: { fileName }
        });
        
       // Instead of using .filter(Boolean) at the end, which doesn't properly type narrow, use:
setRecordings(recordings.map(recording => {
    if (recording._id === recordingId) {
      // If this was the last file, filter out this recording entirely
      if (recording.audioFiles.length === 1) {
        return undefined; // Will be filtered out
      }
      // Otherwise just remove the file
      return {
        ...recording,
        audioFiles: recording.audioFiles.filter(file => file._id !== fileId)
      };
    }
    return recording;
  }).filter((recording): recording is Recording => recording !== undefined));

      } catch (err) {
        const errorMessage = axios.isAxiosError(err) 
          ? err.response?.data?.message || 'Error deleting audio file'
          : 'Error deleting audio file';
        setError(errorMessage);
        console.error('Error deleting audio file:', err);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-100 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">System Recordings</h1>
        <button
          onClick={() => navigate('/system-recordings-upload')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <FiUpload className="w-4 h-4" />
          Upload Recording
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recordings.map((recording) => (
                <React.Fragment key={recording._id}>
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="px-6 py-2 text-sm font-medium text-gray-900 flex justify-between items-center">
                      <span>{recording.name}</span>
                      <button
                        onClick={() => handleDeleteRecording(recording._id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100"
                        title="Delete this recording and all its files"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  {recording.audioFiles.map((file) => {
                    const audioUrl = `${baseUrl}/recordings/${file.originalName}`;
                    const isCurrentPlaying = currentPlaying === audioUrl;
                    
                    return (
                      <tr key={file._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => togglePlay(audioUrl)}
                                className="text-gray-600 hover:text-blue-600 p-1 rounded-full hover:bg-gray-100"
                                aria-label={isPlaying && isCurrentPlaying ? 'Pause' : 'Play'}
                              >
                                {isPlaying && isCurrentPlaying ? <FiPause /> : <FiPlay />}
                              </button>
                              <div className="flex flex-col">
                                <span>{file.originalName}</span>
                                {isCurrentPlaying && (
                                  <span className="text-xs text-gray-400">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAudioFile(recording._id, file._id, file.originalName);
                              }}
                              className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50"
                              title="Delete this audio file"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {recording.description || 'No description'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(recording.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <a
                            href={audioUrl}
                            download
                            className="text-blue-600 hover:text-blue-900"
                            title="Download"
                          >
                            <FiDownload className="w-5 h-5" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {recordings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No recordings found. Upload your first recording to get started.
        </div>
      )}
    </div>
  );
};

export default SystemRecordingsList;