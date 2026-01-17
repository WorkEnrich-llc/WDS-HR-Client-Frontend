import { ComponentTypes } from "@app/enums";

export const COMPONENT_TYPE: Record<ComponentTypes, string> = {
   [ComponentTypes.Fixed]: 'Fixed',
   [ComponentTypes.Variable]: 'Variable'
};


export const COMPONENT_TYPES = Object.entries(COMPONENT_TYPE).map(([id, name]) => ({
   id: Number(id) as ComponentTypes,
   name
}));


