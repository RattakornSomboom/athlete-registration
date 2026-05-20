const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// Helper สำหรับแนบ token ทุก request
const authHeader = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ===== AUTH =====
export const apiLogin = async (email: string, password: string) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // { token, role, user }
};

// ===== STUDENT =====
export const apiGetStudent = async (studentId: string) => {
  const res = await fetch(`${BASE_URL}/students/${studentId}`, {
    headers: authHeader(),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // { studentId, firstName, lastName, faculty, major, year }
};

// ===== SPORTS =====
export const apiGetSports = async () => {
  const res = await fetch(`${BASE_URL}/sports`, {
    headers: authHeader(),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // [{ id, name, maxAthletes, isOpen, positions, requirements }]
};

export const apiUpdateSports = async (sports: unknown) => {
  const res = await fetch(`${BASE_URL}/sports`, {
    method: "PUT",
    headers: authHeader(),
    body: JSON.stringify(sports),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

// ===== APPLICATIONS =====
export const apiSubmitApplication = async (data: unknown) => {
  const res = await fetch(`${BASE_URL}/applications`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const apiGetApplications = async () => {
  const res = await fetch(`${BASE_URL}/applications`, {
    headers: authHeader(),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const apiGetApplicationsByClub = async (clubId: string) => {
  const res = await fetch(`${BASE_URL}/applications?clubId=${clubId}`, {
    headers: authHeader(),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const apiUpdateApplicationStatus = async (id: string, status: string) => {
  const res = await fetch(`${BASE_URL}/applications/${id}/status`, {
    method: "PATCH",
    headers: authHeader(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

// ===== SELECTION =====
export const apiAnnounceSelection = async (applicationIds: string[]) => {
  const res = await fetch(`${BASE_URL}/selections/announce`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({ applicationIds }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};