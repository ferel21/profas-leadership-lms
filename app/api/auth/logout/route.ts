import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() { 
  const cookieStore = await cookies();
  cookieStore.delete("profas_session");
  const response = NextResponse.json({ ok: true }); 
  response.cookies.delete("profas_session"); 
  return response; 
}
