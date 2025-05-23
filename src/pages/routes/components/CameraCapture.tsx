import { useState, useRef, useEffect } from "react";
import { Loader2, Camera, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface CameraCaptureProps {
  onCapture: (imageUrl: string, location: { latitude: number; longitude: number }) => void;
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const [status, setStatus] = useState<"idle" | "requesting" | "capturing" | "captured" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Request camera and location permissions
  const requestPermissions = async () => {
    setStatus("requesting");
    setErrorMessage("");
    
    try {
      // Request location permission
      const locationPromise = new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      // Request camera permission
      const cameraPromise = navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera if available
        audio: false
      });
      
      // Wait for both permissions
      const [position, stream] = await Promise.all([locationPromise, cameraPromise]);
      
      // Save location
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      
      // Save stream and start video
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setStatus("capturing");
    } catch (error: any) {
      console.error("Error requesting permissions:", error);
      setErrorMessage(error.message || "Failed to access camera or location");
      setStatus("error");
    }
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !location) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const context = canvas.getContext("2d");
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to data URL (JPEG format)
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setImageUrl(dataUrl);
      setStatus("captured");
      
      // Stop the camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  // Submit captured photo and location
  const handleSubmit = () => {
    if (!imageUrl || !location) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Photo or location data is missing",
      });
      return;
    }
    
    onCapture(imageUrl, location);
  };

  // Retry capturing
  const handleRetry = () => {
    setImageUrl(null);
    setStatus("idle");
    // Clean up any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-4 py-2">
      {/* Hidden canvas for capturing photos */}
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      {status === "idle" && (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={requestPermissions}
            className="flex items-center justify-center p-8 border border-dashed rounded-md hover:bg-muted/50 transition-colors"
          >
            <div className="text-center">
              <Camera className="h-8 w-8 mx-auto mb-2" />
              <p className="font-medium">Click to Take Photo</p>
              <p className="text-sm text-muted-foreground mt-1">
                We'll need access to your camera and location
              </p>
            </div>
          </button>
        </div>
      )}
      
      {status === "requesting" && (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-center text-sm text-muted-foreground">Requesting camera and location access...</p>
        </div>
      )}
      
      {status === "capturing" && (
        <div className="space-y-4">
          <div className="relative border rounded-md overflow-hidden">
            <video 
              ref={videoRef} 
              className="w-full h-auto" 
              playsInline 
              autoPlay 
              muted
            ></video>
            
            {location && (
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
              </div>
            )}
          </div>
          
          <div className="flex justify-center">
            <Button onClick={capturePhoto} className="px-8">
              Capture Photo
            </Button>
          </div>
        </div>
      )}
      
      {status === "captured" && imageUrl && (
        <div className="space-y-4">
          <div className="relative border rounded-md overflow-hidden">
            <img 
              src={imageUrl} 
              alt="Captured photo" 
              className="w-full h-auto"
            />
            
            {location && (
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleRetry}>
              Retake Photo
            </Button>
            <Button onClick={handleSubmit}>
              Submit
            </Button>
          </div>
        </div>
      )}
      
      {status === "error" && (
        <div className="p-4 border border-destructive rounded-md">
          <p className="font-medium text-destructive">Error</p>
          <p className="text-sm mt-1">{errorMessage || "Failed to access camera or location"}</p>
          <Button variant="outline" className="mt-4" onClick={() => setStatus("idle")}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}