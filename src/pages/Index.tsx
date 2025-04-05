
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthentication } from "@/hooks/useAuthentication";

const Index = () => {
  const { user } = useAuthentication();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect based on authentication status
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  }, [user, navigate]);

  return null; // This component doesn't render anything
};

export default Index;
