/**
 * Utility to format Date strings or objects into Indian Standard Time (Asia/Kolkata)
 */
export const formatToIST = (
  dateInput: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }
): string => {
  if (!dateInput) return '—';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      ...options
    }).format(date);
  } catch (err) {
    console.error("Error formatting date to IST:", err);
    return '—';
  }
};

export const formatToISTFull = (
  dateInput: string | Date | null | undefined
): string => {
  return formatToIST(dateInput, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
