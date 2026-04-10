import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Re-hydrate session from local storage upon refresh
    const savedUser = localStorage.getItem('aura_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const loginGuest = (guestData) => {
    const userData = { role: 'guest', ...guestData };
    setUser(userData);
    localStorage.setItem('aura_user', JSON.stringify(userData));
  };

  const loginStaff = (staffData) => {
    const userData = { role: 'staff', ...staffData };
    setUser(userData);
    localStorage.setItem('aura_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aura_user');
  };

  return (
    <AuthContext.Provider value={{ user, loginGuest, loginStaff, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to allow components to easily grab auth data
export const useAuth = () => useContext(AuthContext);
