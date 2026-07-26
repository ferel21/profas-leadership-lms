import { SearchX, FolderOpen } from "lucide-react";

export function EmptyStatePremium({ 
  title, 
  description, 
  icon = "search" 
}: { 
  title: string, 
  description: string, 
  icon?: "search" | "folder" 
}) {
  return (
    <div className="empty-state-premium">
      <div className="icon-wrap">
        {icon === "search" ? <SearchX size={32} /> : <FolderOpen size={32} />}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
