import type { NextAction, RentalOperationPhase } from "./types";
const ORDER:RentalOperationPhase[]=["R06","R07","R08","R09","R10","R11"];
export function nextResidentialPhase(completed:RentalOperationPhase[]){return ORDER.find(phase=>!completed.includes(phase))??null}
export function buildActionQueue(actions:NextAction[]){const rank={CRITICAL:0,HIGH:1,NORMAL:2};return [...actions].sort((a,b)=>rank[a.priority]-rank[b.priority]||(a.dueAt??"9999").localeCompare(b.dueAt??"9999")||a.code.localeCompare(b.code))}
export function assertUpstreamSnapshot(snapshotId?:string,fingerprint?:string){return{ready:Boolean(snapshotId&&fingerprint),reasonCodes:[...(!snapshotId?["PHASE05_SNAPSHOT_REQUIRED"]:[]),...(!fingerprint?["FACTS_FINGERPRINT_REQUIRED"]:[])]}}
