import React from 'react';
import { 
  PlayCircle, 
  PauseCircle, 
  Repeat, 
  RotateCcw, 
  Camera, 
  Download, 
  Upload,
  ZoomIn,
  Grid
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Toolbar: React.FC = () => {
  const { 
    isPlaying, 
    togglePlayback, 
    resetAnimation, 
    uploadFile, 
    hasModel,
    showGrid,
    setShowGrid
  } = useApp();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.name.match(/\.(glb|gltf|stl)$/i)) {
        uploadFile(file);
      } else {
        alert('Only GLB, GLTF, or STL files are allowed.');
      }
    }
  };
  
  return (
    <div className="flex items-center space-x-2 p-2 bg-dark-800/50 backdrop-blur-sm rounded-lg shadow-lg">
      <label className="btn btn-primary cursor-pointer flex items-center px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
        <Upload size={16} className="mr-2" />
        Import Model
        <input 
          type="file" 
          accept=".glb,.gltf,.stl" 
          className="hidden" 
          onChange={handleFileChange}
        />
      </label>
      
      {hasModel && (
        <>
          <button 
            onClick={togglePlayback} 
            className="p-2 rounded-lg hover:bg-dark-600 text-white transition-colors"
            title={isPlaying ? "Pause Animation" : "Play Animation"}
          >
            {isPlaying ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
          </button>
          
          <button 
            onClick={resetAnimation} 
            className="p-2 rounded-lg hover:bg-dark-600 text-white transition-colors"
            title="Reset Animation"
          >
            <RotateCcw size={20} />
          </button>
          
          <button 
            className="p-2 rounded-lg hover:bg-dark-600 text-white transition-colors"
            title="Loop Animation"
          >
            <Repeat size={20} />
          </button>
          
          <div className="h-6 w-px bg-dark-600 mx-1"></div>
          
          <button 
            className="p-2 rounded-lg hover:bg-dark-600 text-white transition-colors"
            title="Camera Reset"
          >
            <Camera size={20} />
          </button>
          
          <button 
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg hover:bg-dark-600 text-white transition-colors ${showGrid ? 'bg-dark-600' : ''}`}
            title="Toggle Grid"
          >
            <Grid size={20} />
          </button>
          
          <button 
            className="p-2 rounded-lg hover:bg-dark-600 text-white transition-colors"
            title="Reset Zoom"
          >
            <ZoomIn size={20} />
          </button>
          
          <div className="h-6 w-px bg-dark-600 mx-1"></div>
          
          <button 
            className="p-2 rounded-lg hover:bg-dark-600 text-white transition-colors"
            title="Download Model"
          >
            <Download size={20} />
          </button>
        </>
      )}
    </div>
  );
};