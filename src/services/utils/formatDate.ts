export function formatDate(date: Date, delimiter?: "M.YYYY") {
  if (delimiter == "M.YYYY") {
    date
      .toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
      })
      .split("/")
      .join(".");
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
