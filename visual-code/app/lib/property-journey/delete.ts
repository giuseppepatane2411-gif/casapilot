import { deleteLocalVaultDocumentsForJourney } from "@/lib/local-vault/db";
import { deleteJourneyPilotMemory } from "@/lib/pilot-os/store";
import { deleteCloudJourney } from "@/lib/property-journey/cloud";

export async function deleteJourneyCompletely(journeyId: string) {
  const deleted = await deleteCloudJourney(journeyId);

  try {
    await deleteLocalVaultDocumentsForJourney(journeyId);
  } catch {
    // La pratica deve poter essere rimossa anche se IndexedDB non è disponibile.
  }

  deleteJourneyPilotMemory(journeyId);
  return deleted;
}
