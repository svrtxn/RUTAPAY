export const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function formatCLP(n: number): string {
  if (n == null) return "$0";
  return "$" + Number(n).toLocaleString("es-CL");
}

export function formatNumberInput(val: string | number): string {
  if (!val) return "";
  const digits = String(val).replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("es-CL");
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function formatMonthLabel(ym: string): string {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  return `${MONTHS_ES[parseInt(m) - 1]} ${y}`;
}

export function currentYM(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
