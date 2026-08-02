import { deleteLocalVaultDocumentsForJourney } from "@/lib/local-vault/db";
import { deleteJourneyPilotMemory } from "@/lib/pilot-os/store";
import { deleteJourney } from "@/lib/property-journey/storage";

export async function deleteJourneyCompletely(journeyId: string) {
  try {
    await deleteLocalVaultDocumentsForJourney(journeyId);
  } catch {
    // La pratica deve poter essere rimossa anche se IndexedDB non è disponibile.
  }

  deleteJourneyPilotMemory(journeyId);
  return deleteJourney(journeyId);
}
