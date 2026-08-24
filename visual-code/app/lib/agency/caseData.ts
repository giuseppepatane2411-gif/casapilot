import "server-only";
import type { CaseTask } from "@/lib/agency/caseProgress";

const demoTasks: CaseTask[] = [
  { id:"t1", title:"Dati immobile", category:"property", phase:"onboarding", status:"done", priority:10, due_at:null, assigned_to:"owner", action_url:null, why_it_matters:null },
  { id:"t2", title:"Valutazione iniziale", category:"valuation", phase:"valuation", status:"done", priority:20, due_at:null, assigned_to:"guimmia", action_url:null, why_it_matters:null },
  { id:"t3", title:"Completa la documentazione tecnica", category:"documents", phase:"documents", status:"in_progress", priority:30, due_at:null, assigned_to:"owner", action_url:null, why_it_matters:"Serve per portare l'immobile alla fase successiva senza blocchi." },
  { id:"t4", title:"Carica o verifica l'APE", category:"compliance", phase:"documents", status:"todo", priority:40, due_at:null, assigned_to:"owner", action_url:null, why_it_matters:"Guimmia deve sapere se il fascicolo tecnico Ã¨ pronto." },
];

export async function getCaseOverview(listingId: string) {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const demo={ listing:{ id:listingId, slug:"attico-terrazza-catania", title:"Attico luminoso con grande terrazza", operation:"sale", status:"review", current_phase:"documents", human_touches:1 }, tasks:demoTasks, counters:{documents:3,inquiries:7,visits:2,offers:1,portals:4}, source:"demo" as const };
  if(!url || !key) return demo;
  const lq=new URLSearchParams({select:"id,slug,title,operation,status,current_phase,human_touches",id:`eq.${listingId}`,limit:"1"});
  const tq=new URLSearchParams({select:"id,title,category,phase,status,priority,due_at,assigned_to,action_url,why_it_matters",listing_id:`eq.${listingId}`,order:"priority.asc,created_at.asc"});
  try {
    const [lr,tr]=await Promise.all([
      fetch(`${url}/rest/v1/agency_listings?${lq.toString()}`,{headers:{apikey:key as string,Authorization:`Bearer ${key}`},cache:"no-store"}),
      fetch(`${url}/rest/v1/agency_case_tasks?${tq.toString()}`,{headers:{apikey:key as string,Authorization:`Bearer ${key}`},cache:"no-store"})
    ]);
    if(!lr.ok || !tr.ok) return demo;
    const listings=await lr.json(); const tasks=await tr.json() as CaseTask[]; if(!listings[0]) return demo;
    async function count(table:string){ const r=await fetch(`${url}/rest/v1/${table}?select=id&listing_id=eq.${listingId}`,{headers:{apikey:key as string,Authorization:`Bearer ${key}`,Prefer:"count=exact",Range:"0-0"},cache:"no-store"}); const range=r.headers.get("content-range") ?? ""; const n=Number(range.split("/")[1] ?? 0); return Number.isFinite(n)?n:0; }
    const [documents,inquiries,visits,offers,portals]=await Promise.all([count("agency_documents"),count("agency_inquiries"),count("agency_visits"),count("agency_offers"),count("agency_listing_distribution")]);
    return { listing:listings[0], tasks, counters:{documents,inquiries,visits,offers,portals}, source:"supabase" as const };
  } catch { return demo; }
}


