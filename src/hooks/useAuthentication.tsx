
import { useState, useEffect, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

// Create a context for authentication
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  isAdmin: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSession = async (session: Session | null) => {
    if (session) {
      try {
        // Fetch the user profile from our profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        // Set the user with data from both auth and profiles
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          full_name: profile.full_name || '',
          role: profile.role as "admin" | "sales",
          created_at: profile.created_at,
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  };

  // Check for existing session on initial load
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleSession(session);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You are now signed in.",
      });
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: error?.message || "Invalid email or password. Please try again.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "Please check your email for a confirmation link.",
      });
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error?.message || "Could not create account. Please try again.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthentication = () => useContext(AuthContext);

// Auth guard hook
export const useAuthGuard = (requireAdmin = false) => {
  const { user, isLoading, isAdmin } = useAuthentication();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login", { replace: true });
    } else if (!isLoading && requireAdmin && !isAdmin) {
      navigate("/", { replace: true });
    }
  }, [user, isLoading, navigate, requireAdmin, isAdmin]);

  return { isLoading, isAuthenticated: !!user };
};
