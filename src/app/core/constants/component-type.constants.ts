import { ComponentTypes } from "@app/enums";

export const COMPONENT_TYPE: Record<ComponentTypes, string> = {
   [ComponentTypes.Recurring]: 'Recurring',
   [ComponentTypes.Monthly]: 'Monthly',
   [ComponentTypes.Fixed]: 'Fixed'
};


export const COMPONENT_TYPES = Object.entries(COMPONENT_TYPE).map(([id, name]) => ({
   id: Number(id) as ComponentTypes,
   name
}));


