import { createContext, useContext, useState, type ReactNode } from "react";

export type UserRole = "admin" | "doctor" | "receptionist" | "patient";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USERS: Record<string, User & { password: string }> = {
  "admin@ras.dental": {
    id: "1",
    name: "Dr. Ahmad Ras",
    email: "admin@ras.dental",
    role: "admin",
    password: "admin123",
  },
  "doctor@ras.dental": {
    id: "2",
    name: "Dr. Sarah Khan",
    email: "doctor@ras.dental",
    role: "doctor",
    password: "doctor123",
  },
  "reception@ras.dental": {
    id: "3",
    name: "Maria Santos",
    email: "reception@ras.dental",
    role: "receptionist",
    password: "reception123",
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>({
    id: "1",
    name: "Dr. Ahmad Ras",
    email: "admin@ras.dental",
    role: "admin",
  });

  const login = (email: string, _password: string) => {
    const found = MOCK_USERS[email];
    if (found) {
      const { password: _, ...userData } = found;
      setUser(userData);
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
