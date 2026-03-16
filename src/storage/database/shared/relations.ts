import { relations } from "drizzle-orm/relations";
import { auxiliaryTypes, auxiliaryItems, accountAuxiliarySettings, auxiliaryBalances } from "./schema";

export const auxiliaryItemsRelations = relations(auxiliaryItems, ({one, many}) => ({
	auxiliaryType: one(auxiliaryTypes, {
		fields: [auxiliaryItems.typeId],
		references: [auxiliaryTypes.id]
	}),
	auxiliaryBalances: many(auxiliaryBalances),
}));

export const auxiliaryTypesRelations = relations(auxiliaryTypes, ({many}) => ({
	auxiliaryItems: many(auxiliaryItems),
	accountAuxiliarySettings: many(accountAuxiliarySettings),
	auxiliaryBalances: many(auxiliaryBalances),
}));

export const accountAuxiliarySettingsRelations = relations(accountAuxiliarySettings, ({one}) => ({
	auxiliaryType: one(auxiliaryTypes, {
		fields: [accountAuxiliarySettings.auxiliaryTypeId],
		references: [auxiliaryTypes.id]
	}),
}));

export const auxiliaryBalancesRelations = relations(auxiliaryBalances, ({one}) => ({
	auxiliaryItem: one(auxiliaryItems, {
		fields: [auxiliaryBalances.auxiliaryItemId],
		references: [auxiliaryItems.id]
	}),
	auxiliaryType: one(auxiliaryTypes, {
		fields: [auxiliaryBalances.auxiliaryTypeId],
		references: [auxiliaryTypes.id]
	}),
}));