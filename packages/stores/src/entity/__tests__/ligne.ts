import {EntityToType, StoreNode} from "../types";

export type Ligne = EntityToType<typeof LigneEntity>;
export type LigneNode = StoreNode<typeof LigneEntity>;

export const LigneEntity = {
    id: {
        type: "field",
        domain: {type: "number"},
        isRequired: true,
        name: "id",
        label: "ligne.id"
    }
} as const;
