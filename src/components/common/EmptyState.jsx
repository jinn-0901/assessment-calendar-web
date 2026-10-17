import { CalendarDays } from "lucide-react";

export default function EmptyState({ title, description, icon: Icon = CalendarDays }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={24} /></div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
