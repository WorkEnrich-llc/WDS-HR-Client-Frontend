import { Classification } from "@app/enums";


export const CLASSIFICATION: Record<Classification, string> = {
   [Classification.Earning]: 'Earning',
   [Classification.Deduction]: 'Deduction'
};



export const CLASSIFICATIONS = Object.entries(CLASSIFICATION).map(([id, name]) => ({
   id: Number(id) as Classification,
   name
}));