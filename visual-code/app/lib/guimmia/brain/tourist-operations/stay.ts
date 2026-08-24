import type { TouristReadiness, OperationalTask } from "./types";
export function stayReadiness(tasks:OperationalTask[]):TouristReadiness{const required=["GUEST_IDENTITY","GUEST_REPORTING","SAFETY","ACCESS","HUMAN_SUPPORT"];const blockers=required.filter(code=>!tasks.some(task=>task.code===code&&["READY","COMPLETED"].includes(task.status)));return{ready:blockers.length===0,blockers:blockers.map(code=>"TASK_NOT_READY:"+code),humanReviewRequired:true}}
export function criticalIncidentNeedsHuman(priority:string,assignedActorKind?:string){return priority==="CRITICAL"&&assignedActorKind!=="HUMAN"}
