export const todayISO = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
};

export const prettyDate = (value) => {
  if (!value) return "";
  const date = new Date(value + "T12:00:00");
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(date);
};

export const dateParts = (value) => {
  const date = new Date(value + "T12:00:00");
  return {
    month: date.getMonth() + 1,
    day: date.getDate(),
    weekday: new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(date)
  };
};
