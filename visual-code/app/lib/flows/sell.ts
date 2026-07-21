export type FlowStep = {
  id: string;
  question: string;
  field: string;
  required: boolean;
};

export const sellFlow: FlowStep[] = [
  {
    id: "propertyType",
    field: "propertyType",
    question: "Che tipo di immobile vuoi vendere?",
    required: true,
  },
  {
    id: "municipality",
    field: "municipality",
    question: "In quale Comune si trova l'immobile?",
    required: true,
  },
  {
    id: "province",
    field: "province",
    question: "In quale Provincia si trova?",
    required: true,
  },
  {
    id: "address",
    field: "address",
    question: "Qual è l'indirizzo dell'immobile?",
    required: true,
  },
  {
    id: "owners",
    field: "owners",
    question: "Sei l'unico proprietario?",
    required: true,
  },
  {
    id: "occupied",
    field: "occupied",
    question: "L'immobile è libero o occupato?",
    required: true,
  },
  {
    id: "surface",
    field: "surface",
    question: "Quanti metri quadrati ha l'immobile?",
    required: true,
  },
  {
    id: "documents",
    field: "documents",
    question: "Hai già i documenti dell'immobile disponibili?",
    required: false,
  },
];