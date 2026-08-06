import type { LanguageCode } from "./types";

export interface GlossaryEntry {
  id: string;
  italianTerm: string;
  translations: Record<LanguageCode, string>;
  explanations: Record<LanguageCode, string>;
}

export const PROPERTY_GLOSSARY: GlossaryEntry[] = [
  {
    id: "visura-catastale",
    italianTerm: "Visura catastale",
    translations: {
      it: "Visura catastale",
      en: "Cadastral record",
      de: "Katasterauszug",
      fr: "Relevé cadastral",
      es: "Nota catastral",
    },
    explanations: {
      it: "Mostra come l'immobile è registrato al Catasto. Da sola non prova la conformità urbanistica.",
      en: "It shows how the property is registered in the Italian cadastre. On its own, it does not prove planning compliance.",
      de: "Sie zeigt, wie die Immobilie im italienischen Kataster eingetragen ist. Allein beweist sie keine baurechtliche Konformität.",
      fr: "Il indique comment le bien est enregistré au cadastre italien. Il ne prouve pas à lui seul la conformité urbanistique.",
      es: "Muestra cómo está registrado el inmueble en el catastro italiano. Por sí sola no demuestra la conformidad urbanística.",
    },
  },
  {
    id: "planimetria",
    italianTerm: "Planimetria catastale",
    translations: {
      it: "Planimetria catastale",
      en: "Cadastral floor plan",
      de: "Katastergrundriss",
      fr: "Plan cadastral",
      es: "Plano catastral",
    },
    explanations: {
      it: "È il disegno depositato al Catasto. Deve essere confrontato con lo stato reale dell'immobile.",
      en: "It is the floor plan filed with the cadastre. It should be compared with the property's actual layout.",
      de: "Es ist der beim Kataster hinterlegte Grundriss. Er sollte mit dem tatsächlichen Zustand verglichen werden.",
      fr: "Il s'agit du plan déposé au cadastre. Il doit être comparé à l'état réel du bien.",
      es: "Es el plano depositado en el catastro. Debe compararse con la situación real del inmueble.",
    },
  },
  {
    id: "conformita-urbanistica",
    italianTerm: "Conformità urbanistica",
    translations: {
      it: "Conformità urbanistica",
      en: "Planning compliance",
      de: "Baurechtliche Konformität",
      fr: "Conformité urbanistique",
      es: "Conformidad urbanística",
    },
    explanations: {
      it: "Verifica che lo stato reale corrisponda ai titoli e ai progetti approvati dal Comune.",
      en: "It checks whether the actual property matches the permits and plans approved by the municipality.",
      de: "Sie prüft, ob der tatsächliche Zustand den von der Gemeinde genehmigten Unterlagen entspricht.",
      fr: "Elle vérifie que l'état réel correspond aux autorisations et plans approuvés par la commune.",
      es: "Comprueba que el estado real coincida con las licencias y planos aprobados por el ayuntamiento.",
    },
  },
  {
    id: "ape",
    italianTerm: "APE",
    translations: {
      it: "Attestato di prestazione energetica",
      en: "Energy performance certificate",
      de: "Energieausweis",
      fr: "Diagnostic de performance énergétique",
      es: "Certificado de eficiencia energética",
    },
    explanations: {
      it: "Documento che descrive la prestazione energetica dell'immobile e la relativa classe.",
      en: "A document describing the property's energy performance and energy rating.",
      de: "Ein Dokument über die Energieeffizienz und Energieklasse der Immobilie.",
      fr: "Un document décrivant la performance énergétique et la classe du bien.",
      es: "Documento que describe el rendimiento energético y la calificación del inmueble.",
    },
  },
  {
    id: "procura",
    italianTerm: "Procura",
    translations: {
      it: "Procura",
      en: "Power of attorney",
      de: "Vollmacht",
      fr: "Procuration",
      es: "Poder notarial",
    },
    explanations: {
      it: "Autorizza un'altra persona a compiere determinati atti in nome del proprietario. Forma e contenuto dipendono dall'operazione.",
      en: "It authorises another person to perform specified acts for the owner. Its form depends on the transaction.",
      de: "Sie ermächtigt eine andere Person, bestimmte Handlungen für den Eigentümer vorzunehmen. Die Form hängt vom Vorgang ab.",
      fr: "Elle autorise une autre personne à accomplir certains actes pour le propriétaire. Sa forme dépend de l'opération.",
      es: "Autoriza a otra persona a realizar determinados actos por el propietario. Su forma depende de la operación.",
    },
  },
  {
    id: "atto-provenienza",
    italianTerm: "Atto di provenienza",
    translations: {
      it: "Atto di provenienza",
      en: "Title deed or acquisition deed",
      de: "Eigentums- oder Erwerbsurkunde",
      fr: "Titre ou acte d'acquisition",
      es: "Título o escritura de adquisición",
    },
    explanations: {
      it: "È il documento che indica come il proprietario ha acquisito l'immobile, per esempio con compravendita, donazione o successione.",
      en: "It explains how the owner acquired the property, for example by purchase, gift or inheritance.",
      de: "Sie zeigt, wie der Eigentümer die Immobilie erworben hat, etwa durch Kauf, Schenkung oder Erbschaft.",
      fr: "Il indique comment le propriétaire a acquis le bien, par achat, donation ou succession.",
      es: "Indica cómo adquirió el propietario el inmueble, por compra, donación o herencia.",
    },
  },
  {
    id: "accesso-atti",
    italianTerm: "Accesso agli atti",
    translations: {
      it: "Accesso agli atti",
      en: "Municipal records access",
      de: "Einsicht in Gemeindeakten",
      fr: "Accès aux dossiers municipaux",
      es: "Acceso a expedientes municipales",
    },
    explanations: {
      it: "È la richiesta al Comune per consultare pratiche edilizie, autorizzazioni e progetti relativi all'immobile.",
      en: "It is a request to the municipality to inspect building files, permits and approved plans.",
      de: "Es ist ein Antrag bei der Gemeinde auf Einsicht in Bauakten, Genehmigungen und Pläne.",
      fr: "Il s'agit d'une demande à la commune pour consulter les dossiers, autorisations et plans du bien.",
      es: "Es una solicitud al ayuntamiento para consultar expedientes, licencias y planos del inmueble.",
    },
  },
  {
    id: "agibilita",
    italianTerm: "Agibilità",
    translations: {
      it: "Agibilità",
      en: "Occupancy compliance",
      de: "Nutzbarkeitsbescheinigung",
      fr: "Conformité d'occupation",
      es: "Habitabilidad y aptitud de uso",
    },
    explanations: {
      it: "Riguarda le condizioni di sicurezza, igiene, salubrità e risparmio energetico necessarie per l'uso dell'immobile.",
      en: "It concerns safety, hygiene, health and energy conditions required for the property's use.",
      de: "Sie betrifft Sicherheits-, Hygiene-, Gesundheits- und Energieanforderungen für die Nutzung der Immobilie.",
      fr: "Elle concerne les conditions de sécurité, d'hygiène, de salubrité et d'énergie nécessaires à l'usage du bien.",
      es: "Se refiere a las condiciones de seguridad, higiene, salubridad y energía necesarias para usar el inmueble.",
    },
  },
  {
    id: "successione",
    italianTerm: "Successione",
    translations: {
      it: "Successione",
      en: "Inheritance procedure",
      de: "Erbschaftsverfahren",
      fr: "Procédure successorale",
      es: "Procedimiento sucesorio",
    },
    explanations: {
      it: "È la procedura con cui beni e obblighi passano agli eredi dopo il decesso del proprietario.",
      en: "It is the procedure through which assets and obligations pass to heirs after the owner's death.",
      de: "Es ist das Verfahren, durch das Vermögen und Pflichten nach dem Tod auf die Erben übergehen.",
      fr: "C'est la procédure par laquelle les biens et obligations passent aux héritiers après le décès.",
      es: "Es el procedimiento por el que bienes y obligaciones pasan a los herederos tras el fallecimiento.",
    },
  },
  {
    id: "imu",
    italianTerm: "IMU",
    translations: {
      it: "Imposta municipale propria",
      en: "Italian municipal property tax",
      de: "Italienische kommunale Immobiliensteuer",
      fr: "Taxe foncière municipale italienne",
      es: "Impuesto municipal italiano sobre inmuebles",
    },
    explanations: {
      it: "È un'imposta comunale sugli immobili dovuta in molte situazioni, soprattutto per seconde case. Importi ed esenzioni dipendono dal caso.",
      en: "It is a municipal property tax often due on second homes. Amounts and exemptions depend on the case.",
      de: "Es ist eine kommunale Immobiliensteuer, die häufig für Zweitwohnungen anfällt. Höhe und Ausnahmen hängen vom Fall ab.",
      fr: "Il s'agit d'une taxe municipale souvent due sur les résidences secondaires. Les montants et exonérations varient.",
      es: "Es un impuesto municipal que suele aplicarse a segundas viviendas. Los importes y exenciones dependen del caso.",
    },
  },
  {
    id: "tari",
    italianTerm: "TARI",
    translations: {
      it: "Tassa sui rifiuti",
      en: "Italian waste tax",
      de: "Italienische Abfallgebühr",
      fr: "Taxe italienne sur les déchets",
      es: "Tasa italiana de residuos",
    },
    explanations: {
      it: "È la tassa comunale collegata al servizio di raccolta e smaltimento dei rifiuti.",
      en: "It is the municipal charge linked to waste collection and disposal.",
      de: "Es ist die kommunale Gebühr für Abfallsammlung und -entsorgung.",
      fr: "C'est la taxe municipale liée à la collecte et au traitement des déchets.",
      es: "Es la tasa municipal vinculada a la recogida y gestión de residuos.",
    },
  }
];

export function glossaryForText(text: string) {
  const value = text.toLowerCase();
  return PROPERTY_GLOSSARY.filter((entry) =>
    value.includes(entry.italianTerm.toLowerCase()) ||
    value.includes(entry.id.replaceAll("-", " ")),
  );
}
