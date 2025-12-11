const API_URL = "http://localhost:5001"; // Make sure this matches your Python port!

// Helper to send commands
export const sendCommand = async (command, apiKey) => {
  try {
    const response = await fetch(`${API_URL}/commands`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API-Key": apiKey,
      },
      body: JSON.stringify({ command_text: command }),
    });
    return await response.json();
  } catch (error) {
    return { status: "ERROR", message: "Server connection failed" };
  }
};

// Helper to get user info (credits/role)
export const getUserInfo = async (apiKey) => {
  try {
    const response = await fetch(`${API_URL}/me`, {
        headers: { "API-Key": apiKey }
    });
    if (!response.ok) throw new Error("Failed");
    return await response.json();
  } catch (error) {
    return null;
  }
};

// Get all rules
export const getRules = async () => {
  try {
    const response = await fetch(`${API_URL}/rules`);
    return await response.json();
  } catch (error) {
    return [];
  }
};

// Add a new rule (Updated for Conflict Detection)
export const addRule = async (pattern, action, testString) => {
  try {
    const response = await fetch(`${API_URL}/rules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        pattern, 
        action,
        test_string: testString // <--- Send this to backend
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        // Return the error string from the backend (e.g., "Shadow Conflict...")
        return data.error || "Failed to add rule";
    }
    return true;
  } catch (error) {
    return "Network error";
  }
};

// Delete a rule
export const deleteRule = async (id) => {
  await fetch(`${API_URL}/rules/${id}`, { method: "DELETE" });
};

// Get Global Audit Logs (Admin Only)
export const getAdminLogs = async (apiKey) => {
  try {
    const response = await fetch(`${API_URL}/admin/logs`, {
      headers: { "API-Key": apiKey }
    });
    if (!response.ok) throw new Error("Unauthorized");
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};
