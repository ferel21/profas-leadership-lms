import { DashboardChromeClient } from "./DashboardChromeClient";
import { getLoginStreak } from "@/services/streak";

type UserInput = { id?:string;name:string;username?:string|null;email:string;role:string;avatar?:string|null;headline?:string|null;institution?:{name:string}|null };

export async function DashboardChrome({user,children}:{user:UserInput;children:React.ReactNode}){
  const safeUser={name:user.name,username:user.username??null,email:user.email,role:user.role,avatar:user.avatar??null,headline:user.headline??null,institution:user.institution?{name:user.institution.name}:null};
  // Streak is a convenience metric; never let its database query block page
  // navigation when the connection pool is under pressure.
  const streak = user.id ? await getLoginStreak(user.id).catch(() => 0) : 0;
  return <DashboardChromeClient user={safeUser} streak={streak}>{children}</DashboardChromeClient>;
}
