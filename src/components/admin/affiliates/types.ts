export const SITE_URL = "https://ntygear.com";
export const API_URL = import.meta.env.VITE_API_URL || "https://slategrey-cattle-753687.hostingersite.com";
export const textStyle: React.CSSProperties = {
  fontFamily: "Inter, sans-serif",
  textTransform: "none",
  letterSpacing: "normal",
};

export const generateCode = (name: string) => {
  const base = name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 10) || "NTY";
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${base}${suffix}`;
};

export const fmtNum = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString();

export const fmtMoney = (n: number | null | undefined) =>
  n == null ? "$0.00" : `$${Number(n).toFixed(2)}`;
