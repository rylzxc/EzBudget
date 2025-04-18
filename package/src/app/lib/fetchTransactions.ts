export async function getUserTransactions(
  userId: number,
  month: number,
  year: number
) {
  const res = await fetch(
    `/api/transaction?userId=${userId}&month=${month}&year=${year}`
  );
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}
