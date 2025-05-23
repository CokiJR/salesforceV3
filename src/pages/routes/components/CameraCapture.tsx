import { useState, useRef, useEffect } from "react";
import { Loader2, Camera, MapPin, AlertTriangle } from "lucide-react";
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
  const [locationStatus, setLocationStatus] = useState<"pending" | "success" | "error">("pending");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Request location immediately when component mounts
  useEffect(() => {
    requestLocation();
  }, []);

  // Request location permission
  const requestLocation = async () => {
    setLocationStatus("pending");
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      // Save location
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      
      setLocationStatus("success");
      console.log("Location obtained:", position.coords.latitude, position.coords.longitude);
    } catch (error: any) {
      console.error("Error requesting location:", error);
      setLocationStatus("error");
      toast({
        variant: "warning",
        title: "Location not available",
        description: "We couldn't access your location. You can continue, but location data will be missing.",
      });
    }
  };

  // Request camera permission
  const requestCamera = async () => {
    setStatus("requesting");
    setErrorMessage("");
    
    try {
      // Check if location is still pending, wait a bit more
      if (locationStatus === "pending") {
        toast({
          variant: "warning",
          title: "Waiting for location",
          description: "Still trying to get your location. This will improve data accuracy.",
        });
        // Give location a bit more time, but don't block the camera
        setTimeout(() => {
          if (locationStatus === "pending") {
            setLocationStatus("error");
            toast({
              variant: "warning",
              title: "Location timed out",
              description: "We couldn't access your location in time. You can continue, but location data will be missing.",
            });
          }
        }, 3000);
      }
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera if available
        audio: false
      });
      
      // Save stream and start video
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setStatus("capturing");
      
      // If we still don't have location, show a warning
      if (locationStatus === "error" || !location) {
        toast({
          variant: "warning",
          title: "Location not available",
          description: "We couldn't access your location. You can continue, but location data will be missing.",
        });
      }
    } catch (error: any) {
      console.error("Error requesting camera:", error);
      setErrorMessage(error.message || "Failed to access camera");
      setStatus("error");
    }
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
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

  // Convert data URL to File object
  const dataURLtoFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  };

  // Submit captured photo and location
  const handleSubmit = () => {
    if (!imageUrl) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Photo is missing",
      });
      return;
    }
    
    // Convert data URL to File object
    const photoFile = dataURLtoFile(imageUrl, `photo_${Date.now()}.jpg`);
    console.log("Photo converted to file:", photoFile);
    
    // If location is missing, use a default or null location
    const locationData = location || { latitude: 0, longitude: 0 };
    
    // Pass the image URL and location to the parent component
    onCapture(imageUrl, locationData);
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
            onClick={requestCamera}
            className="flex items-center justify-center p-8 border border-dashed rounded-md hover:bg-muted/50 transition-colors"
          >
            <div className="text-center">
              <Camera className="h-8 w-8 mx-auto mb-2" />
              <p className="font-medium">Click to Activate Camera</p>
              <p className="text-sm text-muted-foreground mt-1">
                {locationStatus === "success" && location ? (
                  <span className="flex items-center justify-center text-green-600">
                    <MapPin className="h-3 w-3 mr-1" />
                    Location data ready
                  </span>
                ) : locationStatus === "error" ? (
                  <span className="flex items-center justify-center text-amber-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Location unavailable
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Requesting location...
                  </span>
                )}
              </p>
            </div>
          </button>
        </div>
      )}
      
      {status === "requesting" && (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-center text-sm text-muted-foreground">Activating camera...</p>
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
            
            {!location && (
              <div className="absolute bottom-2 left-2 bg-black/70 text-amber-400 text-xs px-2 py-1 rounded-md flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                <span>Location data unavailable</span>
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
            
            {!location && (
              <div className="absolute bottom-2 left-2 bg-black/70 text-amber-400 text-xs px-2 py-1 rounded-md flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                <span>Location data unavailable</span>
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