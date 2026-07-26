import { DashboardChromeClient } from "./DashboardChromeClient";

type UserInput = { name:string;username?:string|null;email:string;role:string;avatar?:string|null;headline?:string|null;institution?:{name:string}|null };

export function DashboardChrome({user,children}:{user:UserInput;children:React.ReactNode}){
  const safeUser={name:user.name,username:user.username??null,email:user.email,role:user.role,avatar:user.avatar??null,headline:user.headline??null,institution:user.institution?{name:user.institution.name}:null};
  return <DashboardChromeClient user={safeUser}>{children}</DashboardChromeClient>;
}
