export const formatJakartaDateTime = (date: string | undefined): string => {
  if (!date) return "-";
  
  try {
    const formattedDate = new Date(date).toLocaleString(
      "id-ID",
      {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
    return `${formattedDate} WIB`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "-";
  }
};
