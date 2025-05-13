import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';

interface AppContextType {
  modelUrl: string;
  model: File | null;
  hasModel: boolean;
  isPlaying: boolean;
  showGrid: boolean;
  showAxes: boolean;
  renderMode: string;
  wireframeOpacity: number;
  wireframeColor: string;
  edgeHighlight: boolean;
  faceOpacity: number;
  animationProgress: number;
  animations: THREE.AnimationClip[];
  currentAnimation: string;
  animationSpeed: number;
  selectedAnimations: string[];
  fileList: string[];
  uploadsList: string[];
  fetchFileList: () => void;
  fetchUploadsList: () => void;
  selectModel: (filename: string) => void;
  uploadFile: (file: File) => void;
  moveToDisplay: (filename: string) => void;
  togglePlayback: () => void;
  resetAnimation: () => void;
  setShowGrid: (show: boolean) => void;
  setShowAxes: (show: boolean) => void;
  setRenderMode: (mode: string) => void;
  setWireframeOpacity: (opacity: number) => void;
  setWireframeColor: (color: string) => void;
  setEdgeHighlight: (highlight: boolean) => void;
  setFaceOpacity: (opacity: number) => void;
  setAnimationProgress: (progress: number) => void;
  setAnimations: (animations: THREE.AnimationClip[]) => void;
  setCurrentAnimation: (animation: string) => void;
  setAnimationSpeed: (speed: number) => void;
  toggleAnimationSelection: (animation: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modelUrl, setModelUrl] = useState<string>('');
  const [model, setModel] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showAxes, setShowAxes] = useState<boolean>(false);
  const [renderMode, setRenderMode] = useState<string>('wireframe');
  const [wireframeOpacity, setWireframeOpacity] = useState<number>(0.1);
  const [wireframeColor, setWireframeColor] = useState<string>('#00ff00');
  const [edgeHighlight, setEdgeHighlight] = useState<boolean>(true);
  const [faceOpacity, setFaceOpacity] = useState<number>(0.1);
  const [animationProgress, setAnimationProgress] = useState<number>(0);
  const [animations, setAnimations] = useState<THREE.AnimationClip[]>([]);
  const [currentAnimation, setCurrentAnimation] = useState<string>('');
  const [animationSpeed, setAnimationSpeed] = useState<number>(0.2);
  const [selectedAnimations, setSelectedAnimations] = useState<string[]>([]);
  const [fileList, setFileList] = useState<string[]>([]);
  const [uploadsList, setUploadsList] = useState<string[]>([]);
  
  const fetchUploadsList = useCallback(async () => {
    console.log('Attempting to fetch uploads list from server...');
    try {
      const res = await fetch('http://localhost:3001/uploads-list', {
        headers: {
          'Accept': 'application/json'
        }
      }).catch(error => {
        console.error('Network error when fetching uploads:', error);
        throw new Error('Could not connect to server. Is it running?');
      });
      
      console.log('Server response received:', {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries())
      });
      
      const contentType = res.headers.get('content-type');
      let responseData;
      
      try {
        responseData = contentType?.includes('application/json') 
          ? await res.json()
          : await res.text();
        console.log('Response data:', responseData);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid server response');
      }
      
      if (!res.ok) {
        console.error('Failed to fetch uploads:', {
          status: res.status,
          statusText: res.statusText,
          response: responseData
        });
        throw new Error(responseData.error || 'Failed to fetch uploads');
      }
      
      console.log('Uploads list received:', responseData.files);
      setUploadsList(responseData.files || []);
    } catch (error) {
      console.error('Error fetching uploads:', error);
      setUploadsList([]); // Reset to empty list on error
      throw error; // Re-throw to let component handle the error
    }
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    console.log('Starting file upload:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Sending to backend...');
      const res = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      }).catch(error => {
        console.error('Network error during upload:', error);
        throw new Error('Could not connect to server. Is it running?');
      });
      
      console.log('Upload response received:', {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries())
      });
      
      const contentType = res.headers.get('content-type');
      let responseData;
      
      try {
        responseData = contentType?.includes('application/json') 
          ? await res.json()
          : await res.text();
        console.log('Response data:', responseData);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid server response');
      }
      
      if (!res.ok) {
        console.error('Upload failed:', {
          status: res.status,
          statusText: res.statusText,
          response: responseData
        });
        throw new Error(responseData.error || 'Upload failed');
      }
      
      console.log('Upload successful:', responseData);
      
      // Refresh the uploads list
      await fetchUploadsList();
      
      return responseData;
    } catch (error) {
      console.error('Upload error:', error);
      throw error; // Re-throw to let component handle the error
    }
  }, [fetchUploadsList]);
  
  const moveToDisplay = useCallback(async (filename: string) => {
    const res = await fetch(`http://localhost:3001/move-to-display/${filename}`, {
      method: 'POST',
    });
    if (res.ok) {
      fetchUploadsList();
      fetchFileList();
    } else {
      alert('Failed to move file to display');
    }
  }, []);
  
  const fetchFileList = useCallback(async () => {
    const res = await fetch('http://localhost:3001/display-list');
    if (res.ok) {
      const data = await res.json();
      setFileList(data.files || []);
    }
  }, []);
  
  const selectModel = useCallback((filename: string) => {
    setModelUrl(`http://localhost:3001/display/${filename}`);
    setModel(null);
    setIsPlaying(false);
    setAnimationProgress(0);
    setAnimations([]);
    setCurrentAnimation('');
    setSelectedAnimations([]);
  }, []);
  
  useEffect(() => {
    fetchFileList();
    fetchUploadsList();
  }, [fetchFileList, fetchUploadsList]);

  useEffect(() => {
    if (animations.length > 0) {
      setSelectedAnimations(animations.map(anim => anim.name));
    }
  }, [animations]);
  
  const togglePlayback = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);
  
  const resetAnimation = useCallback(() => {
    setAnimationProgress(0);
    setIsPlaying(false);
  }, []);
  
  const toggleAnimationSelection = useCallback((animation: string) => {
    setSelectedAnimations(prev => {
      if (prev.includes(animation)) {
        return prev.filter(a => a !== animation);
      } else {
        return [...prev, animation];
      }
    });
  }, []);
  
  return (
    <AppContext.Provider
      value={{
        modelUrl,
        model,
        hasModel: !!modelUrl,
        isPlaying,
        showGrid,
        showAxes,
        renderMode,
        wireframeOpacity,
        wireframeColor,
        edgeHighlight,
        faceOpacity,
        animationProgress,
        animations,
        currentAnimation,
        animationSpeed,
        selectedAnimations,
        fileList,
        uploadsList,
        fetchFileList,
        fetchUploadsList,
        selectModel,
        uploadFile,
        moveToDisplay,
        togglePlayback,
        resetAnimation,
        setShowGrid,
        setShowAxes,
        setRenderMode,
        setWireframeOpacity,
        setWireframeColor,
        setEdgeHighlight,
        setFaceOpacity,
        setAnimationProgress,
        setAnimations,
        setCurrentAnimation,
        setAnimationSpeed,
        toggleAnimationSelection,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};